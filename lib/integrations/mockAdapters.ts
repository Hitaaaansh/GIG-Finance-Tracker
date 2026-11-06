// ─── Platform Mock Adapters & Normalization Engine ───────────────────────────
// Fulfills requirements INT-01 through INT-07
// Separates provider-specific raw shapes from normalized domain models.

import type { PlatformKey, NormalizedActivity } from "@/types/domain";
import { LocalActivities, LocalEntries } from "@/lib/data/LocalDataService";
import { todayLocalDate, nowISO } from "@/lib/utils/time";

export interface MockSyncResult {
  platform: PlatformKey;
  success: boolean;
  inserted: number;
  skipped: number;
  totalSyncedAmountPaise: number;
  errorMessage?: string;
}

// ─── Mock Platform Payload Generators ─────────────────────────────────────────
// Emulates external platform webhook/API payloads with their native structures.

interface RawUberTrip {
  trip_uuid: string;
  trip_time: string; // ISO
  fare_amount_inr: number;
  currency: string;
  status: "COMPLETED" | "CANCELLED";
}

interface RawSwiggyOrder {
  order_number: string;
  delivered_timestamp: string; // ISO
  payout: {
    base_pay: number;
    incentive: number;
    tips: number;
  };
}

interface RawZomatoPayout {
  delivery_id: string;
  order_time: string;
  earnings: {
    trip_distance_pay: number;
    customer_tip: number;
    surge_bonus: number;
  };
}

interface RawGenericActivity {
  ref_id: string;
  timestamp: string;
  net_amount: number;
  activity_count: number;
}

export const MockPlatformAdapters = {
  // Normalizes raw Uber payload into standard domain model
  normalizeUber(raw: RawUberTrip): NormalizedActivity | null {
    if (raw.status !== "COMPLETED" || raw.fare_amount_inr <= 0) return null;
    return {
      platform: "uber",
      externalId: `uber_${raw.trip_uuid}`,
      occurredAt: raw.trip_time,
      grossAmountMinor: Math.round(raw.fare_amount_inr * 100),
      activityCount: 1,
      activityType: "trip",
      source: "mock_api",
      rawVersion: "uber_v2",
    };
  },

  // Normalizes raw Swiggy payload into standard domain model
  normalizeSwiggy(raw: RawSwiggyOrder): NormalizedActivity | null {
    const total = raw.payout.base_pay + raw.payout.incentive + raw.payout.tips;
    if (total <= 0) return null;
    return {
      platform: "swiggy",
      externalId: `swiggy_${raw.order_number}`,
      occurredAt: raw.delivered_timestamp,
      grossAmountMinor: Math.round(total * 100),
      activityCount: 1,
      activityType: "delivery",
      source: "mock_api",
      rawVersion: "swiggy_v1",
    };
  },

  // Normalizes raw Zomato payload into standard domain model
  normalizeZomato(raw: RawZomatoPayout): NormalizedActivity | null {
    const total =
      raw.earnings.trip_distance_pay +
      raw.earnings.customer_tip +
      raw.earnings.surge_bonus;
    if (total <= 0) return null;
    return {
      platform: "zomato",
      externalId: `zomato_${raw.delivery_id}`,
      occurredAt: raw.order_time,
      grossAmountMinor: Math.round(total * 100),
      activityCount: 1,
      activityType: "delivery",
      source: "mock_api",
      rawVersion: "zomato_v3",
    };
  },

  // Normalizes generic platform payload (Ola, Rapido, Blinkit, Zepto, Porter)
  normalizeGeneric(
    platform: PlatformKey,
    raw: RawGenericActivity
  ): NormalizedActivity | null {
    if (raw.net_amount <= 0) return null;
    return {
      platform,
      externalId: `${platform}_${raw.ref_id}`,
      occurredAt: raw.timestamp,
      grossAmountMinor: Math.round(raw.net_amount * 100),
      activityCount: raw.activity_count || 1,
      activityType: platform === "rapido" || platform === "ola" ? "ride" : "task",
      source: "mock_api",
      rawVersion: "generic_v1",
    };
  },

  // Simulates fetching remote data from external platform API
  generateMockData(platform: PlatformKey, daysBack: number = 7): NormalizedActivity[] {
    const results: NormalizedActivity[] = [];
    const today = new Date();

    for (let i = 0; i < daysBack; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const isoDate = d.toISOString().slice(0, 10);
      const timestamp = `${isoDate}T${String(10 + (i % 8)).padStart(2, "0")}:30:00.000Z`;

      if (platform === "uber") {
        const norm = this.normalizeUber({
          trip_uuid: `trip_${isoDate}_${i}`,
          trip_time: timestamp,
          fare_amount_inr: 450 + (i * 37) % 350,
          currency: "INR",
          status: "COMPLETED",
        });
        if (norm) results.push(norm);
      } else if (platform === "swiggy") {
        const norm = this.normalizeSwiggy({
          order_number: `swg_${isoDate}_${i}`,
          delivered_timestamp: timestamp,
          payout: {
            base_pay: 220 + (i * 25) % 180,
            incentive: 50,
            tips: (i % 2 === 0 ? 30 : 0),
          },
        });
        if (norm) results.push(norm);
      } else if (platform === "zomato") {
        const norm = this.normalizeZomato({
          delivery_id: `zom_${isoDate}_${i}`,
          order_time: timestamp,
          earnings: {
            trip_distance_pay: 260 + (i * 40) % 200,
            customer_tip: 40,
            surge_bonus: (i % 3 === 0 ? 60 : 0),
          },
        });
        if (norm) results.push(norm);
      } else {
        const norm = this.normalizeGeneric(platform, {
          ref_id: `${platform}_${isoDate}_${i}`,
          timestamp,
          net_amount: 320 + (i * 50) % 300,
          activity_count: 2 + (i % 3),
        });
        if (norm) results.push(norm);
      }
    }

    return results;
  },

  // Syncs all enabled platforms for a user
  syncUserPlatforms(
    userId: string,
    platformKeys: PlatformKey[],
    autoCreateEntries: boolean = true
  ): MockSyncResult[] {
    const results: MockSyncResult[] = [];

    for (const key of platformKeys) {
      try {
        const mockPayloads = this.generateMockData(key, 5);
        const { inserted, skipped } = LocalActivities.upsertBatch(userId, mockPayloads);

        let totalAmountPaise = 0;
        const newEntries: {
          user_id: string;
          entry_type: "earning";
          amount_paise: number;
          entry_date: string;
          platform_key: PlatformKey;
          source_type: "mock_api";
          source_record_id: string;
        }[] = [];

        for (const act of mockPayloads) {
          totalAmountPaise += act.grossAmountMinor;
          if (autoCreateEntries) {
            newEntries.push({
              user_id: userId,
              entry_type: "earning",
              amount_paise: act.grossAmountMinor,
              entry_date: act.occurredAt.slice(0, 10),
              platform_key: act.platform,
              source_type: "mock_api",
              source_record_id: act.externalId,
            });
          }
        }

        // Avoid duplicating synced entries in LocalEntries if they already exist
        if (autoCreateEntries && newEntries.length > 0) {
          const existingEntries = LocalEntries.getAll(userId);
          const trulyNew = newEntries.filter(
            (ne) => !existingEntries.some((ee) => ee.source_record_id === ne.source_record_id)
          );
          if (trulyNew.length > 0) {
            LocalEntries.createBatch(trulyNew);
          }
        }

        results.push({
          platform: key,
          success: true,
          inserted,
          skipped,
          totalSyncedAmountPaise: totalAmountPaise,
        });
      } catch (err) {
        results.push({
          platform: key,
          success: false,
          inserted: 0,
          skipped: 0,
          totalSyncedAmountPaise: 0,
          errorMessage: err instanceof Error ? err.message : "Sync failed",
        });
      }
    }

    return results;
  },
};
