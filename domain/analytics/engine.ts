// ─── Analytics & Deterministic Recommendation Engine ────────────────────────
// Pure business logic: AN-01 through AN-07, REC-01 through REC-03

import type { Entry, PlatformKey, PlatformActivity } from "@/types/domain";
import { PLATFORM_LABELS } from "@/types/domain";

export interface DailyPoint {
  date: string;
  dayLabel: string;
  grossPaise: number;
  expensePaise: number;
  netPaise: number;
}

export interface PlatformContribution {
  platformKey: PlatformKey;
  platformName: string;
  grossPaise: number;
  percentage: number; // 0 to 100
  activityCount: number;
  avgPerActivityPaise: number;
}

export interface Recommendation {
  id: string;
  type: "info" | "warning" | "success" | "tip";
  titleEn: string;
  titleHi: string;
  explanationEn: string;
  explanationHi: string;
  basisEn: string;
  basisHi: string;
}

export interface AnalyticsSummary {
  totalGrossPaise: number;
  totalExpensePaise: number;
  totalNetPaise: number;
  avgDailyGrossPaise: number;
  dailyPoints: DailyPoint[];
  platformContributions: PlatformContribution[];
  topPlatform: PlatformContribution | null;
  expenseRatioPercent: number;
  recommendations: Recommendation[];
}

export function calculateAnalytics(
  entries: Entry[],
  activities: PlatformActivity[] = []
): AnalyticsSummary {
  let totalGrossPaise = 0;
  let totalExpensePaise = 0;

  // Group by date
  const byDateMap = new Map<string, { gross: number; expense: number }>();
  // Group earnings by platform
  const byPlatformMap = new Map<PlatformKey, number>();

  for (const entry of entries) {
    const cur = byDateMap.get(entry.entry_date) || { gross: 0, expense: 0 };
    if (entry.entry_type === "earning") {
      cur.gross += entry.amount_paise;
      totalGrossPaise += entry.amount_paise;
      if (entry.platform_key) {
        const pCur = byPlatformMap.get(entry.platform_key) || 0;
        byPlatformMap.set(entry.platform_key, pCur + entry.amount_paise);
      }
    } else {
      cur.expense += entry.amount_paise;
      totalExpensePaise += entry.amount_paise;
    }
    byDateMap.set(entry.entry_date, cur);
  }

  const totalNetPaise = totalGrossPaise - totalExpensePaise;
  const uniqueDatesCount = byDateMap.size;
  const avgDailyGrossPaise = uniqueDatesCount > 0 ? Math.round(totalGrossPaise / uniqueDatesCount) : 0;

  // Sort daily points ascending
  const sortedDates = Array.from(byDateMap.keys()).sort();
  const dailyPoints: DailyPoint[] = sortedDates.map((date) => {
    const data = byDateMap.get(date)!;
    const parts = date.split("-");
    const dayLabel = `${parts[2]}/${parts[1]}`;
    return {
      date,
      dayLabel,
      grossPaise: data.gross,
      expensePaise: data.expense,
      netPaise: data.gross - data.expense,
    };
  });

  // Calculate platform contributions & activity counts
  const platformContributions: PlatformContribution[] = [];
  byPlatformMap.forEach((gross, pKey) => {
    const percentage = totalGrossPaise > 0 ? Math.round((gross / totalGrossPaise) * 100) : 0;

    // Filter synced activities for activity counts
    const pActs = activities.filter((a) => a.platform_key === pKey);
    const activityCount = pActs.reduce((acc, a) => acc + (a.activity_count || 1), 0);
    const avgPerActivityPaise = activityCount > 0 ? Math.round(gross / activityCount) : 0;

    platformContributions.push({
      platformKey: pKey,
      platformName: PLATFORM_LABELS[pKey] || pKey,
      grossPaise: gross,
      percentage,
      activityCount,
      avgPerActivityPaise,
    });
  });

  platformContributions.sort((a, b) => b.grossPaise - a.grossPaise);
  const topPlatform = platformContributions.length > 0 ? platformContributions[0] : null;

  const expenseRatioPercent =
    totalGrossPaise > 0 ? Math.round((totalExpensePaise / totalGrossPaise) * 100) : 0;

  // ─── Deterministic Explainable Recommendations (REC-01 to REC-03) ─────────────
  const recommendations: Recommendation[] = [];

  if (entries.length >= 3) {
    // 1. Top performing platform recommendation
    if (topPlatform && topPlatform.percentage >= 50) {
      recommendations.push({
        id: "top-platform-high",
        type: "success",
        titleEn: `${topPlatform.platformName} is your primary income driver`,
        titleHi: `${topPlatform.platformName} आपकी आय का मुख्य स्रोत है`,
        explanationEn: `You earn ${topPlatform.percentage}% of your gross income from ${topPlatform.platformName}. Keep peak hours prioritized here.`,
        explanationHi: `आप अपनी सकल आय का ${topPlatform.percentage}% ${topPlatform.platformName} से कमाते हैं। यहाँ पीक आवर्स को प्राथमिकता दें।`,
        basisEn: `Observed data: ₹${(topPlatform.grossPaise / 100).toFixed(0)} out of ₹${(totalGrossPaise / 100).toFixed(0)} came from ${topPlatform.platformName}.`,
        basisHi: `प्राप्त डेटा: कुल ₹${(totalGrossPaise / 100).toFixed(0)} में से ₹${(topPlatform.grossPaise / 100).toFixed(0)} ${topPlatform.platformName} से आया।`,
      });
    }

    // 2. High expense ratio alert
    if (expenseRatioPercent >= 30) {
      recommendations.push({
        id: "expense-ratio-high",
        type: "warning",
        titleEn: `High expense ratio: ${expenseRatioPercent}%`,
        titleHi: `खर्च अनुपात अधिक है: ${expenseRatioPercent}%`,
        explanationEn: `Expenses consume ${expenseRatioPercent}% of gross earnings. Check fuel and maintenance logs to protect your net take-home pay.`,
        explanationHi: `खर्च सकल कमाई का ${expenseRatioPercent}% ले रहे हैं। शुद्ध आय बढ़ाने के लिए ईंधन और रखरखाव पर नज़र रखें।`,
        basisEn: `Rule: Triggers when expenses exceed 30% of gross earnings. Current ratio is ${expenseRatioPercent}%.`,
        basisHi: `नियम: जब खर्च कुल कमाई के 30% से अधिक हों। वर्तमान अनुपात ${expenseRatioPercent}% है।`,
      });
    } else if (expenseRatioPercent > 0 && expenseRatioPercent <= 15) {
      recommendations.push({
        id: "healthy-margin",
        type: "tip",
        titleEn: "Great expense discipline",
        titleHi: "शानदार खर्च नियंत्रण",
        explanationEn: `Your expenses are only ${expenseRatioPercent}% of your earnings, keeping your net margin strong.`,
        explanationHi: `आपके खर्च कुल कमाई के केवल ${expenseRatioPercent}% हैं, जिससे आपकी शुद्ध बचत बेहतर है।`,
        basisEn: `Observed data: Healthy expense ratio under 15%.`,
        basisHi: `प्राप्त डेटा: 15% से कम का स्वस्थ खर्च अनुपात।`,
      });
    }

    // 3. Multi-platform diversification tip
    if (platformContributions.length === 1) {
      recommendations.push({
        id: "diversify-platforms",
        type: "tip",
        titleEn: "Consider multi-apping during slow hours",
        titleHi: "मंदी के समय में अन्य ऐप्स भी आज़माएँ",
        explanationEn: `All your recorded earnings come from a single platform. Adding a delivery or ride-sharing backup can hedge against slow shifts.`,
        explanationHi: `आपकी सारी कमाई एक ही ऐप से आ रही है। दूसरा ऐप चालू रखने से खाली समय में भी कमाई हो सकती है।`,
        basisEn: `Observed data: 100% of earnings are on ${platformContributions[0].platformName}.`,
        basisHi: `प्राप्त डेटा: 100% कमाई ${platformContributions[0].platformName} पर है।`,
      });
    }
  }

  return {
    totalGrossPaise,
    totalExpensePaise,
    totalNetPaise,
    avgDailyGrossPaise,
    dailyPoints,
    platformContributions,
    topPlatform,
    expenseRatioPercent,
    recommendations,
  };
}
