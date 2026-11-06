// ─── Time / Date Utilities ────────────────────────────────────────────────────
// All date logic centralized here. Timezone: Asia/Kolkata.

const TZ = "Asia/Kolkata";

/** Returns current UTC timestamp as ISO string */
export function nowISO(): string {
  return new Date().toISOString();
}

/** Returns today's date as "YYYY-MM-DD" in Asia/Kolkata timezone */
export function todayLocalDate(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: TZ }); // "YYYY-MM-DD"
}

/** Returns current year-month as "YYYY-MM" in IST */
export function currentYearMonth(): string {
  return todayLocalDate().slice(0, 7);
}

/** First day of current month as "YYYY-MM-DD" */
export function firstDayOfCurrentMonth(): string {
  return currentYearMonth() + "-01";
}

/** Last day of current month as "YYYY-MM-DD" */
export function lastDayOfCurrentMonth(): string {
  const [year, month] = currentYearMonth().split("-").map(Number);
  const lastDay = new Date(year, month, 0).getDate();
  return `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
}

/** Count of a given weekday (0–6) remaining in month from tomorrow through month-end */
export function countRemainingWeekdays(selectedWeekdays: number[]): number {
  const today = todayLocalDate();
  const lastDay = lastDayOfCurrentMonth();

  let count = 0;
  const current = new Date(today + "T00:00:00+05:30");
  const end = new Date(lastDay + "T00:00:00+05:30");

  // Start from tomorrow
  current.setDate(current.getDate() + 1);

  while (current <= end) {
    if (selectedWeekdays.includes(current.getDay())) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }

  return count;
}

/** Count of selected weekdays that have passed (or today) this month up through today */
export function countPassedWorkdays(selectedWeekdays: number[]): number {
  const firstDay = firstDayOfCurrentMonth();
  const today = todayLocalDate();

  let count = 0;
  const current = new Date(firstDay + "T00:00:00+05:30");
  const end = new Date(today + "T00:00:00+05:30");

  while (current <= end) {
    if (selectedWeekdays.includes(current.getDay())) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }

  return count;
}

/** Generate a random UUID-like string */
export function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Format a "YYYY-MM-DD" date for display: "27 Oct 2026" */
export function formatDisplayDate(dateStr: string, locale = "en-IN"): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Get short month name from "YYYY-MM-DD" */
export function getMonthLabel(dateStr: string): string {
  const [y, m] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

/** Get all dates in current month as "YYYY-MM-DD" array */
export function getCurrentMonthDates(): string[] {
  const first = firstDayOfCurrentMonth();
  const last = lastDayOfCurrentMonth();
  const dates: string[] = [];
  const current = new Date(first);
  const end = new Date(last);
  while (current <= end) {
    dates.push(current.toLocaleDateString("en-CA"));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

/** Get dates for last N days (including today) */
export function getLastNDays(n: number): string[] {
  const dates: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toLocaleDateString("en-CA", { timeZone: TZ }));
  }
  return dates;
}
