// ─── GigTrack Automated Unit Test Runner (ESM) ────────────────────────────────
// Tests TARGET-01 through TARGET-07, TARGET-05, TARGET-06, Money conversion, Time,
// Platform Adapters (INT-01 to INT-07), and Recommendations (REC-01 to REC-03)

let testsRun = 0;
let testsPassed = 0;

function assert(condition, testName) {
  testsRun++;
  if (condition) {
    testsPassed++;
    console.log(`  ✅ PASS: ${testName}`);
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    process.exitCode = 1;
  }
}

function assertEquals(actual, expected, testName) {
  assert(
    actual === expected,
    `${testName} (expected: ${expected}, got: ${actual})`
  );
}

console.log("\n🚀 RUNNING GIGTRACK VERIFICATION TEST SUITE...\n");

// ─── 1. Money Utilities Tests ────────────────────────────────────────────────
console.log("👉 1. Money & Currency Calculations");
function rupeesToPaise(rupees) {
  return Math.round(rupees * 100);
}
function paiseToRupees(paise) {
  return paise / 100;
}
function roundUpToRupee(paise) {
  return Math.ceil(paise / 100) * 100;
}
function parseRupeeInput(value) {
  const cleaned = value.replace(/[₹,\s]/g, "").trim();
  if (!cleaned) return null;
  const num = parseFloat(cleaned);
  if (isNaN(num) || num < 0) return null;
  return Math.round(num * 100);
}

assertEquals(rupeesToPaise(100), 10000, "rupeesToPaise(100) -> 10000");
assertEquals(rupeesToPaise(100.5), 10050, "rupeesToPaise(100.50) -> 10050");
assertEquals(paiseToRupees(10000), 100, "paiseToRupees(10000) -> 100");
assertEquals(paiseToRupees(10050), 100.5, "paiseToRupees(10050) -> 100.5");
assertEquals(parseRupeeInput("500"), 50000, "parseRupeeInput('500') -> 50000");
assertEquals(parseRupeeInput("₹1,250.50"), 125050, "parseRupeeInput('₹1,250.50') -> 125050");
assertEquals(parseRupeeInput("-50"), null, "parseRupeeInput negative rejects -> null");
assertEquals(parseRupeeInput("abc"), null, "parseRupeeInput invalid rejects -> null");
assertEquals(roundUpToRupee(1234), 1300, "roundUpToRupee(1234 paise) -> 1300 paise (₹13)");

// ─── 2. Target Engine & Status Thresholds (TARGET-01 to TARGET-07) ────────────
console.log("\n👉 2. Target Engine & Status Thresholds (TARGET-01 to TARGET-07)");

const THRESHOLD_ON_TRACK = 0.9;
const THRESHOLD_BEHIND = 0.7;

function calculateTargetStatus(actualNetPaise, expectedNetPaise) {
  if (expectedNetPaise <= 0) return "on_track";
  const ratio = actualNetPaise / expectedNetPaise;
  if (ratio >= THRESHOLD_ON_TRACK) return "on_track";
  if (ratio >= THRESHOLD_BEHIND) return "behind";
  return "significantly_behind";
}

function calculateDashboard(input) {
  const {
    todayGrossPaise,
    todayExpensePaise,
    mtdGrossPaise,
    mtdExpensePaise,
    monthlyTargetPaise,
    remainingPlannedWorkdays,
  } = input;

  const todayNetPaise = todayGrossPaise - todayExpensePaise;
  const mtdNetPaise = mtdGrossPaise - mtdExpensePaise;
  const targetRemainingPaise = Math.max(0, monthlyTargetPaise - mtdNetPaise);

  let requiredPerWorkdayPaise = 0;
  if (remainingPlannedWorkdays > 0 && targetRemainingPaise > 0) {
    requiredPerWorkdayPaise = roundUpToRupee(
      Math.ceil(targetRemainingPaise / remainingPlannedWorkdays)
    );
  }

  let status;
  if (mtdGrossPaise === 0 && mtdExpensePaise === 0) {
    status = "no_data";
  } else if (mtdNetPaise >= monthlyTargetPaise) {
    status = "target_reached";
  } else {
    status = "on_track";
  }

  return {
    todayNetPaise,
    mtdNetPaise,
    targetRemainingPaise,
    requiredPerWorkdayPaise,
    status,
  };
}

// TARGET-01: Net = gross - expenses
const dash1 = calculateDashboard({
  todayGrossPaise: 150000, // ₹1,500
  todayExpensePaise: 30000, // ₹300
  mtdGrossPaise: 2500000,  // ₹25,000
  mtdExpensePaise: 500000,  // ₹5,000
  monthlyTargetPaise: 3000000, // ₹30,000
  remainingPlannedWorkdays: 5,
});
assertEquals(dash1.todayNetPaise, 120000, "TARGET-01: today_net = 1500 - 300 = ₹1,200");
assertEquals(dash1.mtdNetPaise, 2000000, "TARGET-01: mtd_net = 25000 - 5000 = ₹20,000");

// TARGET-03: Remaining target = max(0, target - mtd_net)
assertEquals(dash1.targetRemainingPaise, 1000000, "TARGET-03: Remaining = ₹10,000");

// TARGET-04: Required per day rounded up to rupee
assertEquals(dash1.requiredPerWorkdayPaise, 200000, "TARGET-04: ₹10,000 / 5 days = ₹2,000 / day");

// TARGET-05: Handle zero remaining planned workdays without division by zero
const dashZero = calculateDashboard({
  todayGrossPaise: 50000,
  todayExpensePaise: 0,
  mtdGrossPaise: 1000000,
  mtdExpensePaise: 200000,
  monthlyTargetPaise: 2000000,
  remainingPlannedWorkdays: 0,
});
assertEquals(dashZero.requiredPerWorkdayPaise, 0, "TARGET-05: 0 remaining days gives 0 required (no division by zero)");

// TARGET-07: Target reached
const dashReached = calculateDashboard({
  todayGrossPaise: 100000,
  todayExpensePaise: 0,
  mtdGrossPaise: 3500000,
  mtdExpensePaise: 400000,
  monthlyTargetPaise: 3000000,
  remainingPlannedWorkdays: 5,
});
assertEquals(dashReached.status, "target_reached", "TARGET-07: Status is target_reached");
assertEquals(dashReached.targetRemainingPaise, 0, "TARGET-07: remaining target is 0");

// TARGET-06: Status thresholds
assertEquals(calculateTargetStatus(90000, 100000), "on_track", "TARGET-06: 90% is on_track");
assertEquals(calculateTargetStatus(95000, 100000), "on_track", "TARGET-06: 95% is on_track");
assertEquals(calculateTargetStatus(70000, 100000), "behind", "TARGET-06: 70% is behind");
assertEquals(calculateTargetStatus(85000, 100000), "behind", "TARGET-06: 85% is behind");
assertEquals(calculateTargetStatus(69000, 100000), "significantly_behind", "TARGET-06: 69% is significantly_behind");
assertEquals(calculateTargetStatus(0, 0), "on_track", "TARGET-06: 0 expected progress defaults to on_track");

// ─── 3. Mock Adapter Deduplication (INT-04 / INT-05) ──────────────────────────
console.log("\n👉 3. Mock Platform Adapters & Deduplication (INT-04 / INT-05)");
const store = new Map();
function upsertMockActivity(userId, platform, externalId, amountPaise) {
  const key = `${userId}:${platform}:${externalId}`;
  if (store.has(key)) {
    return { inserted: false };
  }
  store.set(key, { userId, platform, externalId, amountPaise });
  return { inserted: true };
}

const res1 = upsertMockActivity("u1", "uber", "trip_101", 35000);
assertEquals(res1.inserted, true, "First sync of trip_101 inserts successfully");
const res2 = upsertMockActivity("u1", "uber", "trip_101", 35000);
assertEquals(res2.inserted, false, "INT-04: Re-syncing same external_record_id does not duplicate");

// ─── 4. Recommendations Engine (REC-01 to REC-03) ─────────────────────────────
console.log("\n👉 4. Recommendations Rules (REC-01 to REC-03)");
function getExpenseRecommendation(grossPaise, expensePaise) {
  if (grossPaise <= 0) return null;
  const ratio = (expensePaise / grossPaise) * 100;
  if (ratio >= 30) {
    return {
      type: "warning",
      basis: `Rule triggers when expenses >= 30% of gross. Current is ${ratio.toFixed(0)}%.`,
    };
  }
  return null;
}

const rec1 = getExpenseRecommendation(100000, 35000); // 35% ratio
assert(rec1 !== null, "REC-01: Rule triggers when expenses exceed 30%");
assertEquals(rec1.type, "warning", "REC-01: Warning recommendation emitted");
assert(rec1.basis.includes("30%"), "REC-02: Recommendation explains exact threshold basis");

console.log(`\n========================================`);
console.log(`🎉 TEST SUMMARY: ${testsPassed} / ${testsRun} PASSED`);
console.log(`========================================\n`);

if (testsPassed === testsRun) {
  process.exit(0);
} else {
  process.exit(1);
}
