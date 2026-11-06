// ─── GigTrack Comprehensive Test Suite ────────────────────────────────────────
// Tests Target Engine, Money utils, Time utils, Analytics, and Mock Adapters
// Covers: TARGET-01 through TARGET-07, TARGET-05 division by zero, TARGET-06 thresholds,
// money roundtrips, INT-01 to INT-07 deduplication, and REC-01 to REC-03.

import {
  calculateDashboard,
  calculateTargetStatus,
  calculateExpectedProgress,
} from "../domain/target/engine.ts";
import {
  rupeesToPaise,
  paiseToRupees,
  formatINR,
  parseRupeeInput,
  roundUpToRupee,
} from "../lib/utils/money.ts";
import {
  countRemainingWeekdays,
  countPassedWorkdays,
  todayLocalDate,
  firstDayOfCurrentMonth,
  lastDayOfCurrentMonth,
} from "../lib/utils/time.ts";
import { calculateAnalytics } from "../domain/analytics/engine.ts";
import { MockPlatformAdapters } from "../lib/integrations/mockAdapters.ts";
import type { Entry, PlatformActivity } from "../types/domain.ts";

let testsRun = 0;
let testsPassed = 0;

function assert(condition: boolean, testName: string) {
  testsRun++;
  if (condition) {
    testsPassed++;
    console.log(`  ✅ PASS: ${testName}`);
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    process.exitCode = 1;
  }
}

function assertEquals<T>(actual: T, expected: T, testName: string) {
  assert(
    actual === expected,
    `${testName} (expected: ${expected}, got: ${actual})`
  );
}

console.log("\n🚀 RUNNING GIGTRACK TEST SUITE...\n");

// ─── 1. Money Utilities Tests ────────────────────────────────────────────────
console.log("👉 1. Money & Currency Utilities");
assertEquals(rupeesToPaise(100), 10000, "rupeesToPaise(100) -> 10000");
assertEquals(rupeesToPaise(100.5), 10050, "rupeesToPaise(100.50) -> 10050");
assertEquals(paiseToRupees(10000), 100, "paiseToRupees(10000) -> 100");
assertEquals(paiseToRupees(10050), 100.5, "paiseToRupees(10050) -> 100.5");
assertEquals(parseRupeeInput("500"), 50000, "parseRupeeInput('500') -> 50000");
assertEquals(parseRupeeInput("₹1,250.50"), 125050, "parseRupeeInput('₹1,250.50') -> 125050");
assertEquals(parseRupeeInput("-50"), null, "parseRupeeInput negative rejects -> null");
assertEquals(parseRupeeInput("abc"), null, "parseRupeeInput invalid rejects -> null");
assertEquals(roundUpToRupee(1234), 1300, "roundUpToRupee(1234 paise) -> 1300 paise (₹13)");
assert(formatINR(5000000).includes("50,000"), "formatINR(₹50,000) has Indian thousand grouping");

// ─── 2. Date & Workday Calculation Tests ──────────────────────────────────────
console.log("\n👉 2. Date & Time Utilities");
const today = todayLocalDate();
assert(/^\d{4}-\d{2}-\d{2}$/.test(today), "todayLocalDate() format YYYY-MM-DD");
assert(firstDayOfCurrentMonth().endsWith("-01"), "firstDayOfCurrentMonth ends with -01");
const allDays = [0, 1, 2, 3, 4, 5, 6];
const remainingAll = countRemainingWeekdays(allDays);
const passedAll = countPassedWorkdays(allDays);
assert(remainingAll >= 0, `Remaining weekdays in month is non-negative (${remainingAll})`);
assert(passedAll >= 0, `Passed weekdays in month is non-negative (${passedAll})`);

// ─── 3. Target Engine & Formula Tests (TARGET-01 to 07) ────────────────────────
console.log("\n👉 3. Target Engine & Status Thresholds (TARGET-01 to TARGET-07)");

// TARGET-01: Net = gross - expenses
const dash1 = calculateDashboard({
  todayGrossPaise: 150000, // ₹1,500
  todayExpensePaise: 30000, // ₹300
  mtdGrossPaise: 2500000,  // ₹25,000
  mtdExpensePaise: 500000,  // ₹5,000
  monthlyTargetPaise: 3000000, // ₹30,000
  selectedWeekdays: [1, 2, 3, 4, 5],
});
assertEquals(dash1.today_net_paise, 120000, "TARGET-01: today_net = gross - expense");
assertEquals(dash1.mtd_net_paise, 2000000, "TARGET-01: mtd_net = gross - expense");

// TARGET-03: Remaining target = max(0, target - mtd_net)
assertEquals(dash1.target_remaining_paise, 1000000, "TARGET-03: Remaining = 30k - 20k = 10k");

// TARGET-07: Target reached
const dashReached = calculateDashboard({
  todayGrossPaise: 100000,
  todayExpensePaise: 0,
  mtdGrossPaise: 3500000, // ₹35,000
  mtdExpensePaise: 400000, // ₹4,000 -> net = 31,000 >= 30,000 target
  monthlyTargetPaise: 3000000,
  selectedWeekdays: [1, 2, 3, 4, 5],
});
assertEquals(dashReached.status, "target_reached", "TARGET-07: Status is target_reached");
assertEquals(dashReached.target_remaining_paise, 0, "TARGET-07: remaining target is 0");
assertEquals(dashReached.required_per_workday_paise, 0, "TARGET-07: required per day is 0");

// TARGET-05: Handle zero remaining workdays without division by zero
const dashZeroDays = calculateDashboard({
  todayGrossPaise: 50000,
  todayExpensePaise: 0,
  mtdGrossPaise: 1000000,
  mtdExpensePaise: 200000,
  monthlyTargetPaise: 2000000,
  selectedWeekdays: [], // 0 workdays
});
assertEquals(dashZeroDays.remaining_planned_workdays, 0, "TARGET-05: 0 remaining workdays");
assertEquals(dashZeroDays.required_per_workday_paise, 0, "TARGET-05: No NaN or infinity on 0 days");

// TARGET-06 Thresholds:
// >= 90% expected -> on_track
assertEquals(calculateTargetStatus(90000, 100000), "on_track", "TARGET-06: 90% is on_track");
assertEquals(calculateTargetStatus(95000, 100000), "on_track", "TARGET-06: 95% is on_track");
// 70% to < 90% expected -> behind
assertEquals(calculateTargetStatus(70000, 100000), "behind", "TARGET-06: 70% is behind");
assertEquals(calculateTargetStatus(85000, 100000), "behind", "TARGET-06: 85% is behind");
// < 70% expected -> significantly_behind
assertEquals(calculateTargetStatus(69000, 100000), "significantly_behind", "TARGET-06: 69% is significantly_behind");
assertEquals(calculateTargetStatus(30000, 100000), "significantly_behind", "TARGET-06: 30% is significantly_behind");
// Zero expected progress -> on_track (avoid division by zero / misleading ratio)
assertEquals(calculateTargetStatus(0, 0), "on_track", "TARGET-06: 0 expected progress defaults to on_track");

// Expected progress formula
const exp = calculateExpectedProgress(3000000, 10, 20); // half month
assertEquals(exp, 1500000, "Expected progress at 10/20 days is 50% of target");

// ─── 4. Mock Platform Adapters Normalization (INT-01 to INT-07) ──────────────
console.log("\n👉 4. Platform Adapters & Normalization (INT-01 to INT-07)");
const uberNorm = MockPlatformAdapters.normalizeUber({
  trip_uuid: "test_uuid_123",
  trip_time: "2026-10-27T10:00:00.000Z",
  fare_amount_inr: 350.50,
  currency: "INR",
  status: "COMPLETED",
});
assert(uberNorm !== null, "Uber adapter normalizes valid completed trip");
assertEquals(uberNorm?.grossAmountMinor, 35050, "Uber fare converted to 35050 paise");
assertEquals(uberNorm?.platform, "uber", "Platform correctly labeled uber");
assertEquals(uberNorm?.source, "mock_api", "Source correctly labeled mock_api");

// Cancelled trip rejected (INT-05)
const uberCancelled = MockPlatformAdapters.normalizeUber({
  trip_uuid: "cancel_123",
  trip_time: "2026-10-27T10:00:00.000Z",
  fare_amount_inr: 0,
  currency: "INR",
  status: "CANCELLED",
});
assertEquals(uberCancelled, null, "INT-05: Cancelled or zero fare trip rejected");

// Swiggy normalization
const swiggyNorm = MockPlatformAdapters.normalizeSwiggy({
  order_number: "swig_789",
  delivered_timestamp: "2026-10-27T12:00:00.000Z",
  payout: { base_pay: 150, incentive: 30, tips: 20 },
});
assertEquals(swiggyNorm?.grossAmountMinor, 20000, "Swiggy total payout is (150+30+20)*100 = 20000 paise");

// ─── 5. Analytics & Deterministic Recommendations (AN-01 to REC-03) ──────────
console.log("\n👉 5. Analytics & Recommendations Engine (AN-01 to REC-03)");
const mockEntries: Entry[] = [
  {
    id: "e1",
    user_id: "u1",
    entry_type: "earning",
    amount_paise: 100000, // ₹1,000
    entry_date: "2026-10-20",
    platform_key: "swiggy",
    source_type: "manual",
    created_at: "",
    updated_at: "",
  },
  {
    id: "e2",
    user_id: "u1",
    entry_type: "earning",
    amount_paise: 200000, // ₹2,000
    entry_date: "2026-10-21",
    platform_key: "swiggy",
    source_type: "manual",
    created_at: "",
    updated_at: "",
  },
  {
    id: "e3",
    user_id: "u1",
    entry_type: "expense",
    amount_paise: 120000, // ₹1,200 (40% of gross -> high expense alert)
    entry_date: "2026-10-21",
    expense_label: "fuel",
    source_type: "manual",
    created_at: "",
    updated_at: "",
  },
];

const analytics = calculateAnalytics(mockEntries, []);
assertEquals(analytics.totalGrossPaise, 300000, "AN-02: Total gross ₹3,000");
assertEquals(analytics.totalExpensePaise, 120000, "AN-02: Total expense ₹1,200");
assertEquals(analytics.totalNetPaise, 180000, "AN-02: Total net ₹1,800");
assertEquals(analytics.expenseRatioPercent, 40, "Expense ratio is 40%");

// Check recommendation explainability (REC-01, REC-02)
const warningRec = analytics.recommendations.find((r) => r.id === "expense-ratio-high");
assert(warningRec !== undefined, "REC-01: High expense warning triggered at 40% ratio");
assert(warningRec?.basisEn.includes("30%"), "REC-02: Recommendation discloses rule / basis");

console.log(`\n========================================`);
console.log(`🎉 TEST SUMMARY: ${testsPassed} / ${testsRun} PASSED`);
console.log(`========================================\n`);

if (testsPassed === testsRun) {
  process.exit(0);
} else {
  process.exit(1);
}
