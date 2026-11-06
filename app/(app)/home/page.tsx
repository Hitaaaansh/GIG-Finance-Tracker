"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/lib/auth/context";
import { useI18n } from "@/lib/i18n/context";
import { LocalEntries } from "@/lib/data/LocalDataService";
import { calculateDashboard } from "@/domain/target/engine";
import { formatINR } from "@/lib/utils/money";
import {
  todayLocalDate,
  firstDayOfCurrentMonth,
  lastDayOfCurrentMonth,
  getMonthLabel,
} from "@/lib/utils/time";
import {
  PLATFORM_LABELS,
  EXPENSE_LABELS,
  type TargetStatus,
  type Entry,
  type ExpenseLabel,
} from "@/types/domain";
import {
  TrendingUp,
  TrendingDown,
  Target,
  Calendar,
  Zap,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Trash2,
  ListFilter,
  Plus,
} from "lucide-react";
import Link from "next/link";

function StatusIcon({ status }: { status: TargetStatus }) {
  if (status === "on_track" || status === "target_reached") return <CheckCircle2 size={15} />;
  if (status === "behind") return <Clock size={15} />;
  if (status === "significantly_behind") return <AlertCircle size={15} />;
  return <Zap size={15} />;
}

function statusChipClass(status: TargetStatus): string {
  if (status === "on_track") return "gt-status-on-track";
  if (status === "behind") return "gt-status-behind";
  if (status === "significantly_behind") return "gt-status-sig-behind";
  if (status === "target_reached") return "gt-status-reached";
  return "gt-status-no-data";
}

function MetricRow({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-center justify-between py-3" style={{ borderBottom: "1px solid #F0F4F2" }}>
      <span className="text-sm" style={{ color: "#586967" }}>{label}</span>
      <div className="text-right">
        <span className="font-bold text-sm tabular-nums" style={{ color: "#182B2A" }}>{value}</span>
        {sub && <div className="text-xs" style={{ color: "#586967" }}>{sub}</div>}
      </div>
    </div>
  );
}

export default function HomePage() {
  const { session, profile, workdays } = useAuth();
  const { t, lang } = useI18n();

  const [entryToDelete, setEntryToDelete] = useState<Entry | null>(null);
  const [dataVersion, setDataVersion] = useState(0);

  const today = todayLocalDate();
  const monthStart = firstDayOfCurrentMonth();
  const monthEnd = lastDayOfCurrentMonth();
  const monthLabel = getMonthLabel(today);

  const { todayEntries, mtdEntries, allRecentEntries } = useMemo(() => {
    if (!session) return { todayEntries: [], mtdEntries: [], allRecentEntries: [] };
    const all = LocalEntries.getByDateRange(session.user.id, monthStart, monthEnd);
    const recent = LocalEntries.getAll(session.user.id).slice(0, 8);
    return {
      todayEntries: all.filter((e) => e.entry_date === today),
      mtdEntries: all,
      allRecentEntries: recent,
    };
  }, [session, today, monthStart, monthEnd, dataVersion]);

  const summary = useMemo(() => {
    if (!profile) return null;
    const sum = (entries: typeof todayEntries, type: "earning" | "expense") =>
      entries.filter((e) => e.entry_type === type).reduce((acc, e) => acc + e.amount_paise, 0);

    return calculateDashboard({
      todayGrossPaise: sum(todayEntries, "earning"),
      todayExpensePaise: sum(todayEntries, "expense"),
      mtdGrossPaise: sum(mtdEntries, "earning"),
      mtdExpensePaise: sum(mtdEntries, "expense"),
      monthlyTargetPaise: profile.monthly_target_paise,
      selectedWeekdays: workdays,
    });
  }, [profile, todayEntries, mtdEntries, workdays]);

  const handleDeleteEntry = (entry: Entry) => {
    if (!session) return;
    LocalEntries.delete(entry.id, session.user.id);
    setEntryToDelete(null);
    setDataVersion((v) => v + 1);
  };

  const hasAnyData = mtdEntries.length > 0;
  const progressPct = summary && summary.monthly_target_paise > 0
    ? Math.min(100, (summary.mtd_net_paise / summary.monthly_target_paise) * 100)
    : 0;

  if (!profile || !summary) {
    return (
      <div className="p-5 flex flex-col gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="gt-card">
            <div className="gt-skeleton h-5 w-32 mb-3" />
            <div className="gt-skeleton h-8 w-48 mb-2" />
            <div className="gt-skeleton h-4 w-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0 pb-6">
      {/* Delete Confirmation Modal (ENTRY-07) */}
      {entryToDelete && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full border border-[#D9E0DC] shadow-xl gt-fade-in">
            <div className="flex items-center gap-2 text-[#B8403A] mb-3">
              <AlertCircle size={22} />
              <h3 className="font-bold text-base text-[#182B2A]">
                {t.entry.deleteConfirm}
              </h3>
            </div>
            <p className="text-sm text-[#586967] mb-4">
              {entryToDelete.entry_type === "earning"
                ? `${entryToDelete.platform_key ? PLATFORM_LABELS[entryToDelete.platform_key] : "Earning"}: ${formatINR(entryToDelete.amount_paise)}`
                : `Expense: ${formatINR(entryToDelete.amount_paise)}`}{" "}
              ({entryToDelete.entry_date})
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setEntryToDelete(null)}
                className="gt-btn-secondary flex-1"
              >
                {t.common.cancel}
              </button>
              <button
                onClick={() => handleDeleteEntry(entryToDelete)}
                className="gt-btn-primary flex-1 bg-[#B8403A] hover:bg-[#962F2A]"
              >
                {t.common.delete}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="px-5 pt-6 pb-4" style={{ background: "#176B63" }}>
        <p className="text-sm font-medium mb-1" style={{ color: "rgba(255,255,255,0.7)" }}>
          {lang === "hi" ? "नमस्ते," : "Hello,"} {profile.display_name.split(" ")[0]} 👋
        </p>
        <h1 className="text-2xl font-bold mb-4" style={{ color: "#FFFFFF" }}>
          {monthLabel}
        </h1>

        {/* Target progress area */}
        <div className="gt-card" style={{ background: "rgba(255,255,255,0.1)", borderColor: "rgba(255,255,255,0.2)" }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.8)" }}>
              {t.dashboard.monthProgress}
            </span>
            <span className={`gt-status-chip ${statusChipClass(summary.status)}`}>
              <StatusIcon status={summary.status} />
              {t.dashboard.status[summary.status]}
            </span>
          </div>

          <div className="flex items-end gap-2 mb-2">
            <span className="text-3xl font-bold tabular-nums" style={{ color: "#FFFFFF" }}>
              {formatINR(summary.mtd_net_paise)}
            </span>
            <span className="text-sm pb-1" style={{ color: "rgba(255,255,255,0.6)" }}>
              {lang === "hi" ? "शुद्ध कमाई" : "net earned"}
            </span>
          </div>

          <div className="gt-progress-track" style={{ background: "rgba(255,255,255,0.2)" }}>
            <div
              className="gt-progress-fill"
              style={{ width: `${progressPct}%`, background: "#D99A2B" }}
            />
          </div>

          <div className="flex justify-between mt-2">
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>
              {formatINR(0)}
            </span>
            <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.8)" }}>
              {t.dashboard.target}: {formatINR(summary.monthly_target_paise)}
            </span>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 flex flex-col gap-4">
        {/* Empty state */}
        {!hasAnyData && (
          <div className="gt-card text-center py-8">
            <div className="text-4xl mb-3">📊</div>
            <h2 className="font-bold text-lg mb-2" style={{ color: "#182B2A" }}>
              {t.dashboard.emptyState.title}
            </h2>
            <p className="text-sm mb-5" style={{ color: "#586967" }}>
              {t.dashboard.emptyState.body}
            </p>
            <Link href="/add" className="gt-btn-primary inline-flex">
              {t.dashboard.emptyState.cta} <ArrowRight size={16} />
            </Link>
          </div>
        )}

        {/* Today Summary */}
        <div className="gt-card">
          <div className="flex items-center gap-2 mb-3">
            <Calendar size={16} color="#176B63" />
            <span className="gt-section-title" style={{ margin: 0 }}>{t.dashboard.today}</span>
            <span className="text-xs ml-auto" style={{ color: "#A8B5B2" }}>{today}</span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 rounded-lg" style={{ background: "#E8F5EE" }}>
              <div className="text-xs font-semibold mb-1" style={{ color: "#287A55" }}>
                {lang === "hi" ? "कमाई" : "Earned"}
              </div>
              <div className="font-bold tabular-nums text-sm" style={{ color: "#287A55" }}>
                {formatINR(summary.today_gross_paise)}
              </div>
            </div>
            <div className="text-center p-3 rounded-lg" style={{ background: "#FDE8E7" }}>
              <div className="text-xs font-semibold mb-1" style={{ color: "#B8403A" }}>
                {lang === "hi" ? "खर्च" : "Spent"}
              </div>
              <div className="font-bold tabular-nums text-sm" style={{ color: "#B8403A" }}>
                {formatINR(summary.today_expense_paise)}
              </div>
            </div>
            <div className="text-center p-3 rounded-lg" style={{ background: "#E8F4F2" }}>
              <div className="text-xs font-semibold mb-1" style={{ color: "#176B63" }}>
                {lang === "hi" ? "नेट" : "Net"}
              </div>
              <div className="font-bold tabular-nums text-sm" style={{ color: "#176B63" }}>
                {formatINR(summary.today_net_paise)}
              </div>
            </div>
          </div>
        </div>

        {/* Month Breakdown */}
        {hasAnyData && (
          <div className="gt-card">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={16} color="#176B63" />
              <span className="gt-section-title" style={{ margin: 0 }}>
                {lang === "hi" ? "महीने का विवरण" : "Month Breakdown"}
              </span>
            </div>

            <MetricRow label={t.dashboard.gross} value={formatINR(summary.mtd_gross_paise)} />
            <MetricRow label={t.dashboard.expenses} value={`−${formatINR(summary.mtd_expense_paise)}`} />
            <div className="flex items-center justify-between py-3">
              <span className="text-sm font-bold" style={{ color: "#182B2A" }}>{t.dashboard.net}</span>
              <span className="font-bold tabular-nums" style={{ color: summary.mtd_net_paise >= 0 ? "#287A55" : "#B8403A" }}>
                {formatINR(summary.mtd_net_paise)}
              </span>
            </div>
          </div>
        )}

        {/* Target Details */}
        {hasAnyData && (
          <div className="gt-card">
            <div className="flex items-center gap-2 mb-1">
              <Target size={16} color="#176B63" />
              <span className="gt-section-title" style={{ margin: 0 }}>{t.dashboard.target}</span>
            </div>

            {summary.status === "target_reached" ? (
              <div className="flex items-center gap-3 py-3" style={{ color: "#287A55" }}>
                <CheckCircle2 size={24} />
                <div>
                  <div className="font-bold">{t.dashboard.status.target_reached}</div>
                  <div className="text-sm">{t.dashboard.statusHint.target_reached}</div>
                </div>
              </div>
            ) : (
              <>
                <MetricRow
                  label={t.dashboard.remaining}
                  value={formatINR(summary.target_remaining_paise)}
                />
                <MetricRow
                  label={t.dashboard.remainingWorkdays}
                  value={`${summary.remaining_planned_workdays} ${lang === "hi" ? "दिन" : "days"}`}
                />
                {summary.remaining_planned_workdays === 0 ? (
                  <div className="mt-3 p-3 rounded-lg text-sm" style={{ background: "#FDE8E7", color: "#B8403A" }}>
                    <AlertCircle size={14} className="inline mr-1" />
                    {t.dashboard.noWorkdaysLeft}
                  </div>
                ) : (
                  <div className="flex items-center justify-between py-3 mt-1 rounded-lg px-3" style={{ background: "#E8F4F2" }}>
                    <span className="text-sm font-semibold" style={{ color: "#176B63" }}>
                      {t.dashboard.requiredPerDay}
                    </span>
                    <span className="font-bold text-lg tabular-nums" style={{ color: "#176B63" }}>
                      {formatINR(summary.required_per_workday_paise)}
                    </span>
                  </div>
                )}
              </>
            )}

            {/* Status explanation */}
            <div className="mt-3 p-3 rounded-lg text-xs" style={{ background: "#F5F4EF", color: "#586967" }}>
              ℹ️ {t.dashboard.statusHint[summary.status]}
              {summary.status !== "no_data" && summary.status !== "target_reached" && (
                <span> {t.dashboard.expectedProgress}: {formatINR(summary.expected_progress_paise)}</span>
              )}
            </div>
          </div>
        )}

        {/* Recent Entries List (ENTRY-07, ENTRY-10) */}
        {allRecentEntries.length > 0 && (
          <div className="gt-card">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ListFilter size={16} color="#176B63" />
                <span className="gt-section-title" style={{ margin: 0 }}>
                  {lang === "hi" ? "हाल की प्रविष्टियां" : "Recent Activity"}
                </span>
              </div>
              <Link href="/add" className="text-xs font-semibold text-[#176B63] flex items-center gap-1">
                <Plus size={14} /> {lang === "hi" ? "नई जोड़ें" : "Add"}
              </Link>
            </div>

            <div className="flex flex-col divide-y divide-[#F0F4F2]">
              {allRecentEntries.map((entry) => {
                const isEarning = entry.entry_type === "earning";
                const label = isEarning
                  ? (entry.platform_key ? PLATFORM_LABELS[entry.platform_key] : "Earning")
                  : (entry.expense_label && (EXPENSE_LABELS as any)[entry.expense_label]
                      ? (lang === "hi" ? (EXPENSE_LABELS as any)[entry.expense_label].hi : (EXPENSE_LABELS as any)[entry.expense_label].en)
                      : (entry.expense_label || "Expense"));

                return (
                  <div key={entry.id} className="py-2.5 flex items-center justify-between">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-xs text-[#182B2A]">{label}</span>
                        {entry.source_type === "mock_api" && (
                          <span className="gt-badge-synced">
                            {t.entry.source.mock_api}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-[#586967]">{entry.entry_date}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className="font-bold text-xs tabular-nums"
                        style={{ color: isEarning ? "#287A55" : "#B8403A" }}
                      >
                        {isEarning ? "+" : "−"}
                        {formatINR(entry.amount_paise)}
                      </span>
                      <button
                        onClick={() => setEntryToDelete(entry)}
                        className="text-[#586967] hover:text-[#B8403A] p-1 transition-colors"
                        title={t.common.delete}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
