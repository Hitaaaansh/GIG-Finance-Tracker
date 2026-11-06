"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/lib/auth/context";
import { useI18n } from "@/lib/i18n/context";
import { LocalEntries, LocalActivities } from "@/lib/data/LocalDataService";
import { calculateAnalytics } from "@/domain/analytics/engine";
import { formatINR } from "@/lib/utils/money";
import {
  todayLocalDate,
  firstDayOfCurrentMonth,
  lastDayOfCurrentMonth,
} from "@/lib/utils/time";
import {
  TrendingUp,
  TrendingDown,
  PieChart,
  Lightbulb,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  Calendar,
  Layers,
} from "lucide-react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

type TimeRange = "this_month" | "last_7_days" | "last_30_days";

export default function AnalyticsPage() {
  const { session } = useAuth();
  const { t, lang } = useI18n();
  const [timeRange, setTimeRange] = useState<TimeRange>("this_month");

  const today = todayLocalDate();

  const { dateFrom, dateTo } = useMemo(() => {
    if (timeRange === "this_month") {
      return {
        dateFrom: firstDayOfCurrentMonth(),
        dateTo: lastDayOfCurrentMonth(),
      };
    } else if (timeRange === "last_7_days") {
      const d = new Date();
      d.setDate(d.getDate() - 6);
      return {
        dateFrom: d.toISOString().slice(0, 10),
        dateTo: today,
      };
    } else {
      const d = new Date();
      d.setDate(d.getDate() - 29);
      return {
        dateFrom: d.toISOString().slice(0, 10),
        dateTo: today,
      };
    }
  }, [timeRange, today]);

  const { entries, activities } = useMemo(() => {
    if (!session) return { entries: [], activities: [] };
    const ent = LocalEntries.getByDateRange(session.user.id, dateFrom, dateTo);
    const act = LocalActivities.getByDateRange(session.user.id, dateFrom, dateTo);
    return { entries: ent, activities: act };
  }, [session, dateFrom, dateTo]);

  const analytics = useMemo(() => {
    return calculateAnalytics(entries, activities);
  }, [entries, activities]);

  const chartData = useMemo(() => {
    return analytics.dailyPoints.map((dp) => ({
      date: dp.dayLabel,
      Gross: Math.round(dp.grossPaise / 100),
      Expense: Math.round(dp.expensePaise / 100),
      Net: Math.round(dp.netPaise / 100),
    }));
  }, [analytics.dailyPoints]);

  const hasData = entries.length > 0;

  return (
    <div className="flex flex-col gap-4 p-4 pb-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="pt-2">
        <h1 className="gt-page-title">{t.analytics.title}</h1>
        <p className="text-sm text-[#586967] mt-0.5">
          {lang === "hi"
            ? "अपनी कुल आय, खर्च और प्लेटफ़ॉर्म प्रदर्शन देखें"
            : "Review earnings, expenses, and platform breakdown"}
        </p>
      </div>

      {/* Time Range Selector */}
      <div className="flex bg-white rounded-xl p-1 border border-[#D9E0DC]">
        {(
          [
            { id: "this_month", en: "This Month", hi: "यह महीना" },
            { id: "last_7_days", en: "7 Days", hi: "7 दिन" },
            { id: "last_30_days", en: "30 Days", hi: "30 दिन" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setTimeRange(tab.id)}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              timeRange === tab.id
                ? "bg-[#176B63] text-white shadow-sm"
                : "text-[#586967] hover:text-[#182B2A]"
            }`}
          >
            {lang === "hi" ? tab.hi : tab.en}
          </button>
        ))}
      </div>

      {!hasData ? (
        <div className="gt-card text-center py-10 my-4">
          <div className="text-4xl mb-3">📈</div>
          <h2 className="font-bold text-lg text-[#182B2A] mb-1">
            {t.analytics.noData}
          </h2>
          <p className="text-sm text-[#586967] mb-5 max-w-xs mx-auto">
            {t.analytics.noDataHint}
          </p>
          <Link href="/add" className="gt-btn-primary inline-flex">
            {lang === "hi" ? "एंट्री जोड़ें" : "Add an Entry"}
          </Link>
        </div>
      ) : (
        <>
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="gt-card p-3">
              <span className="text-xs font-semibold text-[#586967]">
                {t.analytics.totalGross}
              </span>
              <div className="text-xl font-bold text-[#182B2A] mt-1">
                {formatINR(analytics.totalGrossPaise)}
              </div>
            </div>

            <div className="gt-card p-3">
              <span className="text-xs font-semibold text-[#586967]">
                {t.analytics.totalExpense}
              </span>
              <div className="text-xl font-bold text-[#B8403A] mt-1">
                {formatINR(analytics.totalExpensePaise)}
              </div>
            </div>

            <div className="gt-card p-3">
              <span className="text-xs font-semibold text-[#586967]">
                {t.analytics.totalNet}
              </span>
              <div className="text-xl font-bold text-[#287A55] mt-1">
                {formatINR(analytics.totalNetPaise)}
              </div>
            </div>

            <div className="gt-card p-3">
              <span className="text-xs font-semibold text-[#586967]">
                {t.analytics.avgDaily}
              </span>
              <div className="text-xl font-bold text-[#176B63] mt-1">
                {formatINR(analytics.avgDailyGrossPaise)}
              </div>
            </div>
          </div>

          {/* Daily Trends Chart */}
          <div className="gt-card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-[#176B63]" />
                <h3 className="font-bold text-[#182B2A] text-sm">
                  {t.analytics.earningsVsExpenses}
                </h3>
              </div>
              <span className="text-xs text-[#586967]">
                {chartData.length} {lang === "hi" ? "दिन" : "days"}
              </span>
            </div>

            <div className="h-56 w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <XAxis dataKey="date" stroke="#586967" fontSize={11} />
                  <YAxis stroke="#586967" fontSize={11} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip
                    formatter={(val) => [`₹${Number(val).toLocaleString("en-IN")}`, ""]}
                    contentStyle={{
                      backgroundColor: "#FFFFFF",
                      borderRadius: "8px",
                      border: "1px solid #D9E0DC",
                      fontSize: "12px",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="Gross" fill="#176B63" radius={[4, 4, 0, 0]} name={t.analytics.totalGross} />
                  <Bar dataKey="Expense" fill="#B8403A" radius={[4, 4, 0, 0]} name={t.analytics.totalExpense} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Platform Breakdown */}
          <div className="gt-card">
            <div className="flex items-center gap-2 mb-3">
              <PieChart size={18} className="text-[#176B63]" />
              <h3 className="font-bold text-[#182B2A] text-sm">
                {t.analytics.platformBreakdown}
              </h3>
            </div>

            {analytics.platformContributions.length === 0 ? (
              <p className="text-xs text-[#586967] py-2">
                {lang === "hi"
                  ? "कोई प्लेटफ़ॉर्म डेटा दर्ज नहीं है"
                  : "No platform specific earnings found"}
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {analytics.platformContributions.map((item) => (
                  <div key={item.platformKey} className="flex flex-col gap-1">
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-1.5 font-semibold text-[#182B2A]">
                        <span>{item.platformName}</span>
                        {item.activityCount > 0 && (
                          <span className="text-[10px] text-[#586967] bg-[#F5F4EF] px-1.5 py-0.5 rounded">
                            {item.activityCount} {t.analytics.activities}
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-[#182B2A]">
                          {formatINR(item.grossPaise)}
                        </span>
                        <span className="text-[#586967] ml-1.5">
                          ({item.percentage}%)
                        </span>
                      </div>
                    </div>
                    {/* Progress indicator */}
                    <div className="gt-progress-track h-2">
                      <div
                        className="gt-progress-fill"
                        style={{
                          width: `${item.percentage}%`,
                          backgroundColor: "#176B63",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Hours worked notice (AN-05) */}
            <div className="flex items-start gap-2 mt-4 pt-3 border-t border-[#D9E0DC] text-xs text-[#586967]">
              <HelpCircle size={14} className="flex-shrink-0 mt-0.5" />
              <span>
                {lang === "hi"
                  ? "घंटे-आधारित कमाई उपलब्ध नहीं है क्योंकि आधिकारिक कार्य-घंटे डेटा सिंक समर्थित नहीं है।"
                  : "Hourly earnings unavailable because verified shift durations are not tracked by mock platforms."}
              </span>
            </div>
          </div>

          {/* Recommendations / Insights (REC-01 to REC-03) */}
          <div className="gt-card">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb size={18} className="text-[#D99A2B]" />
              <h3 className="font-bold text-[#182B2A] text-sm">
                {t.recommendations.title}
              </h3>
            </div>

            {analytics.recommendations.length === 0 ? (
              <div className="text-xs text-[#586967] py-2">
                {t.recommendations.noData}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {analytics.recommendations.map((rec) => (
                  <div
                    key={rec.id}
                    className="p-3 rounded-lg border text-xs"
                    style={{
                      backgroundColor:
                        rec.type === "warning"
                          ? "#FEF3E2"
                          : rec.type === "success"
                          ? "#E8F5EE"
                          : "#F5F4EF",
                      borderColor:
                        rec.type === "warning"
                          ? "#D99A2B"
                          : rec.type === "success"
                          ? "#287A55"
                          : "#D9E0DC",
                    }}
                  >
                    <div className="font-bold text-[#182B2A] mb-1">
                      {lang === "hi" ? rec.titleHi : rec.titleEn}
                    </div>
                    <div className="text-[#586967] mb-2">
                      {lang === "hi" ? rec.explanationHi : rec.explanationEn}
                    </div>
                    <div className="flex items-center gap-1 text-[11px] font-medium text-[#176B63]">
                      <span>🔍 {t.recommendations.basis}:</span>
                      <span>{lang === "hi" ? rec.basisHi : rec.basisEn}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
