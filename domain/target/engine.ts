// ─── Target Engine ────────────────────────────────────────────────────────────
// Pure, deterministic, testable functions.
// NO side effects, NO imports from UI or data layers.
// Takes raw numbers (paise), returns DashboardSummary.

import type { DashboardSummary, TargetStatus } from "@/types/domain";
import {
  countRemainingWeekdays,
  countPassedWorkdays,
} from "@/lib/utils/time";
import { roundUpToRupee } from "@/lib/utils/money";

// ─── Status Thresholds (from requirements.md TARGET-06) ──────────────────────
// On Track: actual >= 90% of expected
// Behind: 70% <= actual < 90% of expected
// Significantly Behind: actual < 70% of expected
const THRESHOLD_ON_TRACK = 0.9;
const THRESHOLD_BEHIND = 0.7;

export function calculateTargetStatus(
  actualNetPaise: number,
  expectedNetPaise: number
): TargetStatus {
  if (expectedNetPaise <= 0) return "on_track"; // avoid misleading ratio when no workdays have passed
  const ratio = actualNetPaise / expectedNetPaise;
  if (ratio >= THRESHOLD_ON_TRACK) return "on_track";
  if (ratio >= THRESHOLD_BEHIND) return "behind";
  return "significantly_behind";
}

// ─── Expected Progress ────────────────────────────────────────────────────────
// Expected = (passedWorkdays / totalMonthWorkdays) * monthlyTarget
export function calculateExpectedProgress(
  monthlyTargetPaise: number,
  passedWorkdays: number,
  totalMonthWorkdays: number
): number {
  if (totalMonthWorkdays <= 0) return 0;
  return Math.floor((passedWorkdays / totalMonthWorkdays) * monthlyTargetPaise);
}

// ─── Main Dashboard Calculator ────────────────────────────────────────────────
export interface TargetEngineInput {
  todayGrossPaise: number;
  todayExpensePaise: number;
  mtdGrossPaise: number;
  mtdExpensePaise: number;
  monthlyTargetPaise: number;
  selectedWeekdays: number[]; // 0–6
}

export function calculateDashboard(input: TargetEngineInput): DashboardSummary {
  const {
    todayGrossPaise,
    todayExpensePaise,
    mtdGrossPaise,
    mtdExpensePaise,
    monthlyTargetPaise,
    selectedWeekdays,
  } = input;

  // Today
  const todayNetPaise = todayGrossPaise - todayExpensePaise;

  // Month-to-date
  const mtdNetPaise = mtdGrossPaise - mtdExpensePaise;

  // Target remaining: max(0, target - mtdNet)
  const targetRemainingPaise = Math.max(0, monthlyTargetPaise - mtdNetPaise);

  // Remaining planned workdays (from tomorrow through month-end)
  const remainingPlannedWorkdays = countRemainingWeekdays(selectedWeekdays);

  // Required per remaining workday: roundUp(remaining / remainingDays)
  let requiredPerWorkdayPaise = 0;
  if (remainingPlannedWorkdays > 0 && targetRemainingPaise > 0) {
    requiredPerWorkdayPaise = roundUpToRupee(
      Math.ceil(targetRemainingPaise / remainingPlannedWorkdays)
    );
  }

  // Status
  let status: TargetStatus;
  if (mtdGrossPaise === 0 && mtdExpensePaise === 0) {
    status = "no_data";
  } else if (mtdNetPaise >= monthlyTargetPaise) {
    status = "target_reached";
  } else {
    // Calculate expected progress
    const passed = countPassedWorkdays(selectedWeekdays);
    const remaining = remainingPlannedWorkdays;
    const total = passed + remaining;
    const expectedProgress = calculateExpectedProgress(monthlyTargetPaise, passed, total);
    const progressRatio = expectedProgress > 0 ? mtdNetPaise / expectedProgress : 1;

    if (progressRatio >= THRESHOLD_ON_TRACK) status = "on_track";
    else if (progressRatio >= THRESHOLD_BEHIND) status = "behind";
    else status = "significantly_behind";
  }

  // For status card explanation
  const passed = countPassedWorkdays(selectedWeekdays);
  const remaining = remainingPlannedWorkdays;
  const total = passed + remaining;
  const expectedProgressPaise = calculateExpectedProgress(monthlyTargetPaise, passed, total);
  const progressRatio = expectedProgressPaise > 0 ? mtdNetPaise / expectedProgressPaise : 1;

  return {
    today_gross_paise: todayGrossPaise,
    today_expense_paise: todayExpensePaise,
    today_net_paise: todayNetPaise,
    mtd_gross_paise: mtdGrossPaise,
    mtd_expense_paise: mtdExpensePaise,
    mtd_net_paise: mtdNetPaise,
    monthly_target_paise: monthlyTargetPaise,
    target_remaining_paise: targetRemainingPaise,
    remaining_planned_workdays: remainingPlannedWorkdays,
    required_per_workday_paise: requiredPerWorkdayPaise,
    status,
    expected_progress_paise: expectedProgressPaise,
    progress_ratio: progressRatio,
  };
}
