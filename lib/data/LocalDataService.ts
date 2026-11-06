// ─── LocalDataService ─────────────────────────────────────────────────────────
// This is the local data layer for Phases 1–4.
// It stores all data in localStorage, simulating the Supabase schema.
// In Phase 5, this entire file is replaced by SupabaseDataService.ts
// which implements the same exported interface.
//
// IMPORTANT: All money stored as paise (integer). All dates as "YYYY-MM-DD".

import type {
  Profile,
  ProfileWorkday,
  UserPlatform,
  Entry,
  PlatformActivity,
  NormalizedActivity,
  MonthlyTargetHistory,
  AuthUser,
  AuthSession,
  Weekday,
  PlatformKey,
  Language,
  VehicleType,
} from "@/types/domain";
import { generateId, nowISO, todayLocalDate } from "@/lib/utils/time";

// ─── Storage Keys ──────────────────────────────────────────────────────────────
const KEYS = {
  users: "gt_users",
  sessions: "gt_sessions",
  currentUserId: "gt_current_user_id",
  profiles: "gt_profiles",
  workdays: "gt_workdays",
  platforms: "gt_user_platforms",
  entries: "gt_entries",
  activities: "gt_platform_activities",
  targetHistory: "gt_target_history",
};

// ─── Local Storage Helpers ────────────────────────────────────────────────────
function read<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(key) ?? "[]") as T[];
  } catch {
    return [];
  }
}

function write<T>(key: string, data: T[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(data));
}

function readOne<T>(key: string, predicate: (item: T) => boolean): T | null {
  return read<T>(key).find(predicate) ?? null;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
interface StoredUser {
  id: string;
  email: string;
  passwordHash: string; // NOTE: simple hash for demo; NOT production-safe
  created_at: string;
}

function simpleHash(str: string): string {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return h.toString(16);
}

export const LocalAuth = {
  register(email: string, password: string): { user: AuthUser } | { error: string } {
    const users = read<StoredUser>(KEYS.users);
    if (users.find((u) => u.email.toLowerCase() === email.toLowerCase())) {
      return { error: "Email already registered." };
    }
    const user: StoredUser = {
      id: generateId(),
      email: email.toLowerCase().trim(),
      passwordHash: simpleHash(password),
      created_at: nowISO(),
    };
    write(KEYS.users, [...users, user]);
    return { user: { id: user.id, email: user.email, created_at: user.created_at } };
  },

  login(email: string, password: string): { session: AuthSession } | { error: string } {
    const users = read<StoredUser>(KEYS.users);
    const user = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.passwordHash === simpleHash(password)
    );
    if (!user) return { error: "Invalid email or password." };

    const session: AuthSession = {
      user: { id: user.id, email: user.email, created_at: user.created_at },
      token: generateId(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };
    // Store session
    const sessions = read<AuthSession>(KEYS.sessions);
    write(KEYS.sessions, [...sessions.filter((s) => s.user.id !== user.id), session]);
    localStorage.setItem(KEYS.currentUserId, user.id);
    return { session };
  },

  logout(): void {
    const userId = localStorage.getItem(KEYS.currentUserId);
    if (userId) {
      const sessions = read<AuthSession>(KEYS.sessions);
      write(KEYS.sessions, sessions.filter((s) => s.user.id !== userId));
      localStorage.removeItem(KEYS.currentUserId);
    }
  },

  getCurrentSession(): AuthSession | null {
    if (typeof window === "undefined") return null;
    const userId = localStorage.getItem(KEYS.currentUserId);
    if (!userId) return null;
    const sessions = read<AuthSession>(KEYS.sessions);
    const session = sessions.find((s) => s.user.id === userId);
    if (!session) return null;
    if (new Date(session.expires_at) < new Date()) {
      localStorage.removeItem(KEYS.currentUserId);
      return null;
    }
    return session;
  },

  requestPasswordReset(_email: string): void {
    // In local mode: no-op. In Phase 5 Supabase will handle this.
    // We just show a success message always.
  },
};

// ─── Profiles ─────────────────────────────────────────────────────────────────
export const LocalProfiles = {
  get(userId: string): Profile | null {
    return readOne<Profile>(KEYS.profiles, (p) => p.id === userId);
  },

  create(data: Omit<Profile, "created_at" | "updated_at">): Profile {
    const profile: Profile = {
      ...data,
      created_at: nowISO(),
      updated_at: nowISO(),
    };
    const profiles = read<Profile>(KEYS.profiles);
    write(KEYS.profiles, [...profiles, profile]);
    return profile;
  },

  update(userId: string, data: Partial<Profile>): Profile | null {
    const profiles = read<Profile>(KEYS.profiles);
    const idx = profiles.findIndex((p) => p.id === userId);
    if (idx === -1) return null;
    const updated: Profile = { ...profiles[idx], ...data, updated_at: nowISO() };
    profiles[idx] = updated;
    write(KEYS.profiles, profiles);
    return updated;
  },
};

// ─── Workdays ─────────────────────────────────────────────────────────────────
export const LocalWorkdays = {
  get(userId: string): Weekday[] {
    return read<ProfileWorkday>(KEYS.workdays)
      .filter((w) => w.user_id === userId)
      .map((w) => w.weekday);
  },

  set(userId: string, weekdays: Weekday[]): void {
    const all = read<ProfileWorkday>(KEYS.workdays).filter((w) => w.user_id !== userId);
    const newRows: ProfileWorkday[] = weekdays.map((d) => ({ user_id: userId, weekday: d }));
    write(KEYS.workdays, [...all, ...newRows]);
  },
};

// ─── User Platforms ───────────────────────────────────────────────────────────
export const LocalPlatforms = {
  get(userId: string): UserPlatform[] {
    return read<UserPlatform>(KEYS.platforms).filter((p) => p.user_id === userId);
  },

  set(userId: string, platformKeys: PlatformKey[]): void {
    const all = read<UserPlatform>(KEYS.platforms).filter((p) => p.user_id !== userId);
    const newRows: UserPlatform[] = platformKeys.map((key) => ({
      id: generateId(),
      user_id: userId,
      platform_key: key,
      is_enabled: true,
      created_at: nowISO(),
      updated_at: nowISO(),
    }));
    write(KEYS.platforms, [...all, ...newRows]);
  },

  toggle(userId: string, platformKey: PlatformKey, enabled: boolean): void {
    const all = read<UserPlatform>(KEYS.platforms);
    const idx = all.findIndex((p) => p.user_id === userId && p.platform_key === platformKey);
    if (idx !== -1) {
      all[idx] = { ...all[idx], is_enabled: enabled, updated_at: nowISO() };
      write(KEYS.platforms, all);
    }
  },
};

// ─── Entries ──────────────────────────────────────────────────────────────────
export const LocalEntries = {
  getAll(userId: string): Entry[] {
    return read<Entry>(KEYS.entries)
      .filter((e) => e.user_id === userId)
      .sort((a, b) => b.entry_date.localeCompare(a.entry_date));
  },

  getByDateRange(userId: string, from: string, to: string): Entry[] {
    return read<Entry>(KEYS.entries).filter(
      (e) => e.user_id === userId && e.entry_date >= from && e.entry_date <= to
    );
  },

  createBatch(entries: Omit<Entry, "id" | "created_at" | "updated_at">[]): Entry[] {
    const all = read<Entry>(KEYS.entries);
    const created: Entry[] = entries.map((e) => ({
      ...e,
      id: generateId(),
      created_at: nowISO(),
      updated_at: nowISO(),
    }));
    write(KEYS.entries, [...all, ...created]);
    return created;
  },

  update(id: string, userId: string, data: Partial<Entry>): Entry | null {
    const all = read<Entry>(KEYS.entries);
    const idx = all.findIndex((e) => e.id === id && e.user_id === userId);
    if (idx === -1) return null;
    const updated: Entry = { ...all[idx], ...data, updated_at: nowISO() };
    all[idx] = updated;
    write(KEYS.entries, all);
    return updated;
  },

  delete(id: string, userId: string): boolean {
    const all = read<Entry>(KEYS.entries);
    const filtered = all.filter((e) => !(e.id === id && e.user_id === userId));
    if (filtered.length === all.length) return false;
    write(KEYS.entries, filtered);
    return true;
  },
};

// ─── Platform Activities ──────────────────────────────────────────────────────
export const LocalActivities = {
  getAll(userId: string): PlatformActivity[] {
    return read<PlatformActivity>(KEYS.activities).filter((a) => a.user_id === userId);
  },

  // Idempotent upsert: keyed by (user_id, platform_key, external_record_id)
  upsertBatch(userId: string, activities: NormalizedActivity[]): { inserted: number; skipped: number } {
    const all = read<PlatformActivity>(KEYS.activities);
    let inserted = 0;
    let skipped = 0;

    for (const act of activities) {
      const existing = all.findIndex(
        (a) =>
          a.user_id === userId &&
          a.platform_key === act.platform &&
          a.external_record_id === act.externalId
      );
      if (existing !== -1) {
        skipped++;
        continue;
      }
      const row: PlatformActivity = {
        id: generateId(),
        user_id: userId,
        platform_key: act.platform,
        external_record_id: act.externalId,
        occurred_at: act.occurredAt,
        entry_date: act.occurredAt.slice(0, 10),
        gross_amount_paise: act.grossAmountMinor,
        activity_count: act.activityCount,
        activity_type: act.activityType,
        source_type: "mock_api",
        payload_version: act.rawVersion,
        synced_at: nowISO(),
        created_at: nowISO(),
      };
      all.push(row);
      inserted++;
    }

    write(KEYS.activities, all);
    return { inserted, skipped };
  },

  getByDateRange(userId: string, from: string, to: string): PlatformActivity[] {
    return read<PlatformActivity>(KEYS.activities).filter(
      (a) => a.user_id === userId && a.entry_date >= from && a.entry_date <= to
    );
  },
};

// ─── Target History ───────────────────────────────────────────────────────────
export const LocalTargetHistory = {
  get(userId: string): MonthlyTargetHistory[] {
    return read<MonthlyTargetHistory>(KEYS.targetHistory)
      .filter((t) => t.user_id === userId)
      .sort((a, b) => b.effective_at.localeCompare(a.effective_at));
  },

  record(userId: string, targetPaise: number): void {
    const now = nowISO();
    const today = todayLocalDate();
    const targetMonth = today.slice(0, 7) + "-01";
    const entry: MonthlyTargetHistory = {
      id: generateId(),
      user_id: userId,
      target_month: targetMonth,
      target_paise: targetPaise,
      effective_at: now,
      created_at: now,
    };
    const all = read<MonthlyTargetHistory>(KEYS.targetHistory);
    write(KEYS.targetHistory, [...all, entry]);
  },
};

// ─── Demo Seed Data ───────────────────────────────────────────────────────────
export function seedDemoData(userId: string): void {
  const today = todayLocalDate();
  const year = parseInt(today.slice(0, 4));
  const month = parseInt(today.slice(5, 7));

  const demoEntries: Omit<Entry, "id" | "created_at" | "updated_at">[] = [];

  // Generate 20 days of demo earnings
  const platforms: PlatformKey[] = ["swiggy", "zomato", "uber", "ola"];
  for (let d = 1; d <= 20; d++) {
    const date = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    if (date > today) break;

    const platform = platforms[d % platforms.length];
    const amount = Math.floor((Math.random() * 800 + 400) * 100); // ₹400–1200

    demoEntries.push({
      user_id: userId,
      entry_type: "earning",
      amount_paise: amount,
      entry_date: date,
      platform_key: platform,
      source_type: "manual",
    });

    // Every 3rd day add an expense
    if (d % 3 === 0) {
      demoEntries.push({
        user_id: userId,
        entry_type: "expense",
        amount_paise: Math.floor((Math.random() * 100 + 80) * 100), // ₹80–180
        entry_date: date,
        expense_label: d % 6 === 0 ? "food" : "fuel",
        source_type: "manual",
      });
    }
  }

  LocalEntries.createBatch(demoEntries);
}
