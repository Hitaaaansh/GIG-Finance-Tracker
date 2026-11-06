// ─── GigTrack Domain Types ───────────────────────────────────────────────────
// Mirrors schema.md. Using paise (integer, 1 INR = 100 paise) for all money.
// Timestamps stored as ISO strings. Dates as "YYYY-MM-DD" strings.

export type Language = "en" | "hi";

export type PlatformKey =
  | "uber"
  | "ola"
  | "rapido"
  | "swiggy"
  | "zomato"
  | "blinkit"
  | "zepto"
  | "porter";

export const PLATFORM_KEYS: PlatformKey[] = [
  "uber",
  "ola",
  "rapido",
  "swiggy",
  "zomato",
  "blinkit",
  "zepto",
  "porter",
];

export const PLATFORM_LABELS: Record<PlatformKey, string> = {
  uber: "Uber",
  ola: "Ola",
  rapido: "Rapido",
  swiggy: "Swiggy",
  zomato: "Zomato",
  blinkit: "Blinkit",
  zepto: "Zepto",
  porter: "Porter",
};

export const PLATFORM_ACTIVITY_LABELS: Record<PlatformKey, string> = {
  uber: "Trips",
  ola: "Rides",
  rapido: "Rides",
  swiggy: "Orders",
  zomato: "Deliveries",
  blinkit: "Deliveries",
  zepto: "Deliveries",
  porter: "Jobs",
};

// 0=Sunday, 1=Monday, ..., 6=Saturday
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const WEEKDAY_LABELS: Record<Weekday, { en: string; hi: string; short: string }> = {
  0: { en: "Sunday", hi: "रविवार", short: "Sun" },
  1: { en: "Monday", hi: "सोमवार", short: "Mon" },
  2: { en: "Tuesday", hi: "मंगलवार", short: "Tue" },
  3: { en: "Wednesday", hi: "बुधवार", short: "Wed" },
  4: { en: "Thursday", hi: "गुरुवार", short: "Thu" },
  5: { en: "Friday", hi: "शुक्रवार", short: "Fri" },
  6: { en: "Saturday", hi: "शनिवार", short: "Sat" },
};

export type VehicleType = "bike" | "auto" | "car" | "cycle" | "other";

export type ExpenseLabel =
  | "fuel"
  | "food"
  | "maintenance"
  | "mobile_data"
  | "other";

export const EXPENSE_LABELS: Record<ExpenseLabel, { en: string; hi: string }> = {
  fuel: { en: "Fuel", hi: "ईंधन" },
  food: { en: "Food", hi: "खाना" },
  maintenance: { en: "Vehicle Maintenance", hi: "वाहन रखरखाव" },
  mobile_data: { en: "Mobile / Data", hi: "मोबाइल / डेटा" },
  other: { en: "Other", hi: "अन्य" },
};

// ─── Profile ──────────────────────────────────────────────────────────────────

export interface Profile {
  id: string; // UUID
  display_name: string;
  language: Language;
  city?: string;
  vehicle_type?: VehicleType;
  timezone: string; // default "Asia/Kolkata"
  monthly_target_paise: number;
  target_updated_at: string; // ISO timestamp
  morning_email_enabled: boolean;
  evening_reminder_enabled: boolean;
  onboarding_completed_at?: string; // ISO timestamp; null = not done
  created_at: string;
  updated_at: string;
}

export interface ProfileWorkday {
  user_id: string;
  weekday: Weekday;
}

export interface UserPlatform {
  id: string;
  user_id: string;
  platform_key: PlatformKey;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Entries ─────────────────────────────────────────────────────────────────

export type EntryType = "earning" | "expense";
export type SourceType = "manual" | "mock_api";

export interface Entry {
  id: string;
  user_id: string;
  entry_type: EntryType;
  amount_paise: number; // must be > 0
  entry_date: string; // "YYYY-MM-DD" local date
  platform_key?: PlatformKey; // required for earnings
  expense_label?: string; // required for expenses (ExpenseLabel or custom string)
  source_type: SourceType;
  source_record_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// ─── Platform Activities (mock API sync) ─────────────────────────────────────

export interface PlatformActivity {
  id: string;
  user_id: string;
  platform_key: PlatformKey;
  external_record_id: string;
  occurred_at: string; // ISO timestamp UTC
  entry_date: string; // "YYYY-MM-DD"
  gross_amount_paise: number;
  activity_count?: number;
  activity_type?: string;
  source_type: "mock_api";
  payload_version?: string;
  synced_at: string;
  created_at: string;
}

// Normalized activity from adapter
export interface NormalizedActivity {
  platform: PlatformKey;
  externalId: string;
  occurredAt: string; // ISO timestamp
  grossAmountMinor: number; // paise
  activityCount?: number;
  activityType?: string;
  source: "mock_api";
  rawVersion?: string;
}

// ─── Target History ───────────────────────────────────────────────────────────

export interface MonthlyTargetHistory {
  id: string;
  user_id: string;
  target_month: string; // "YYYY-MM-DD" first day of month
  target_paise: number;
  effective_at: string;
  created_at: string;
}

// ─── Notifications ────────────────────────────────────────────────────────────

export type NotificationType = "morning" | "evening";
export type NotificationStatus = "pending" | "sent" | "failed" | "skipped";

export interface NotificationLog {
  id: string;
  user_id: string;
  local_date: string;
  notification_type: NotificationType;
  status: NotificationStatus;
  provider_message_id?: string;
  error_code?: string;
  attempted_at?: string;
  sent_at?: string;
  created_at: string;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  created_at: string;
}

export interface AuthSession {
  user: AuthUser;
  token: string; // local session token
  expires_at: string;
}

// ─── Dashboard / Target Engine ────────────────────────────────────────────────

export type TargetStatus = "on_track" | "behind" | "significantly_behind" | "target_reached" | "no_data";

export interface DashboardSummary {
  // Today
  today_gross_paise: number;
  today_expense_paise: number;
  today_net_paise: number;

  // Month-to-date
  mtd_gross_paise: number;
  mtd_expense_paise: number;
  mtd_net_paise: number;

  // Target
  monthly_target_paise: number;
  target_remaining_paise: number;
  remaining_planned_workdays: number;
  required_per_workday_paise: number; // rounded up to whole rupees

  // Status
  status: TargetStatus;
  expected_progress_paise: number; // what user should have earned by today under schedule
  progress_ratio: number; // actual / expected (0–∞)
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export interface DailyTotal {
  date: string; // "YYYY-MM-DD"
  gross_paise: number;
  expense_paise: number;
  net_paise: number;
}

export interface PlatformBreakdown {
  platform: PlatformKey;
  gross_paise: number;
  contribution_pct: number; // 0–100
  activity_count?: number;
}

// ─── Recommendations ──────────────────────────────────────────────────────────

export interface Recommendation {
  id: string;
  type: "platform" | "expense" | "schedule" | "target" | "general";
  title_en: string;
  title_hi: string;
  body_en: string;
  body_hi: string;
  data_basis: string; // e.g. "Based on last 30 days of earnings"
}
