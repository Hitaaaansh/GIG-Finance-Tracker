"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/lib/auth/context";
import { useI18n } from "@/lib/i18n/context";
import { LocalEntries } from "@/lib/data/LocalDataService";
import { parseRupeeInput } from "@/lib/utils/money";
import { todayLocalDate } from "@/lib/utils/time";
import {
  PLATFORM_LABELS,
  EXPENSE_LABELS,
  type PlatformKey,
  type ExpenseLabel,
  type EntryType,
} from "@/types/domain";
import { Plus, Trash2, CheckCircle2, ChevronDown, X } from "lucide-react";

const EXPENSE_LABEL_KEYS = Object.keys(EXPENSE_LABELS) as ExpenseLabel[];

interface EntryRow {
  id: string;
  type: EntryType;
  amount: string;
  platform: PlatformKey | "";
  expenseLabel: ExpenseLabel | "custom" | "";
  customLabel: string;
  date: string;
  amountError: string;
  platformError: string;
  labelError: string;
}

function newRow(type: EntryType, date: string): EntryRow {
  return {
    id: Math.random().toString(36).slice(2),
    type,
    amount: "",
    platform: "",
    expenseLabel: "",
    customLabel: "",
    date,
    amountError: "",
    platformError: "",
    labelError: "",
  };
}

function PlatformSelect({
  value,
  platforms,
  onChange,
  error,
  lang,
}: {
  value: PlatformKey | "";
  platforms: PlatformKey[];
  onChange: (v: PlatformKey) => void;
  error: string;
  lang: string;
}) {
  return (
    <div>
      <label className="gt-label">{lang === "hi" ? "प्लेटफ़ॉर्म" : "Platform"}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as PlatformKey)}
          className={`gt-input appearance-none pr-8 ${error ? "error" : ""}`}
          style={{ paddingRight: "2.5rem" }}
        >
          <option value="">{lang === "hi" ? "चुनें…" : "Select…"}</option>
          {platforms.map((p) => (
            <option key={p} value={p}>{PLATFORM_LABELS[p]}</option>
          ))}
        </select>
        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#586967" }} />
      </div>
      {error && <p className="gt-error">{error}</p>}
    </div>
  );
}

function ExpenseLabelSelect({
  value,
  customValue,
  onLabelChange,
  onCustomChange,
  error,
  lang,
}: {
  value: ExpenseLabel | "custom" | "";
  customValue: string;
  onLabelChange: (v: ExpenseLabel | "custom") => void;
  onCustomChange: (v: string) => void;
  error: string;
  lang: string;
}) {
  return (
    <div>
      <label className="gt-label">{lang === "hi" ? "खर्च किस पर?" : "Where did you spend?"}</label>
      <div className="flex flex-wrap gap-2 mb-2">
        {EXPENSE_LABEL_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => onLabelChange(key)}
            className={`gt-platform-chip text-xs py-1 px-3 ${value === key ? "selected" : ""}`}
          >
            {lang === "hi" ? EXPENSE_LABELS[key].hi : EXPENSE_LABELS[key].en}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onLabelChange("custom")}
          className={`gt-platform-chip text-xs py-1 px-3 ${value === "custom" ? "selected" : ""}`}
        >
          {lang === "hi" ? "कस्टम" : "Custom"}
        </button>
      </div>
      {value === "custom" && (
        <input
          className="gt-input mt-1"
          placeholder={lang === "hi" ? "लेबल लिखें…" : "Type a label…"}
          value={customValue}
          onChange={(e) => onCustomChange(e.target.value)}
          autoFocus
        />
      )}
      {error && <p className="gt-error">{error}</p>}
    </div>
  );
}

export default function AddPage() {
  const { session, platforms } = useAuth();
  const { t, lang } = useI18n();
  const today = todayLocalDate();

  const [activeTab, setActiveTab] = useState<EntryType>("earning");
  const [rows, setRows] = useState<EntryRow[]>([newRow("earning", today)]);
  const [saving, setSaving] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [globalError, setGlobalError] = useState("");

  const updateRow = useCallback((id: string, updates: Partial<EntryRow>) => {
    setRows((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, ...updates, amountError: "", platformError: "", labelError: "" } : r
      )
    );
  }, []);

  const addRow = () => {
    setRows((prev) => [...prev, newRow(activeTab, today)]);
  };

  const removeRow = (id: string) => {
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));
  };

  const switchTab = (type: EntryType) => {
    setActiveTab(type);
    setRows([newRow(type, today)]);
    setSavedCount(0);
    setGlobalError("");
  };

  const validate = (): boolean => {
    let valid = true;
    setRows((prev) =>
      prev.map((row) => {
        const errors: Partial<EntryRow> = {};
        const amount = parseRupeeInput(row.amount);
        if (!amount || amount <= 0) {
          errors.amountError = t.entry.errors.amountRequired;
          valid = false;
        }
        if (row.type === "earning" && !row.platform) {
          errors.platformError = t.entry.errors.platformRequired;
          valid = false;
        }
        if (row.type === "expense") {
          const hasLabel =
            (row.expenseLabel && row.expenseLabel !== "custom") ||
            (row.expenseLabel === "custom" && row.customLabel.trim());
          if (!hasLabel) {
            errors.labelError = t.entry.errors.labelRequired;
            valid = false;
          }
        }
        return { ...row, ...errors };
      })
    );
    return valid;
  };

  const handleSave = async () => {
    if (!session || !validate()) return;
    setSaving(true);
    setGlobalError("");

    try {
      const entries = rows.map((row) => {
        const labelValue =
          row.expenseLabel === "custom"
            ? row.customLabel.trim()
            : row.expenseLabel || undefined;

        return {
          user_id: session.user.id,
          entry_type: row.type,
          amount_paise: parseRupeeInput(row.amount)!,
          entry_date: row.date,
          platform_key: row.type === "earning" ? (row.platform as PlatformKey) : undefined,
          expense_label: row.type === "expense" ? labelValue : undefined,
          source_type: "manual" as const,
        };
      });

      LocalEntries.createBatch(entries);
      setSavedCount(rows.length);
      setRows([newRow(activeTab, today)]);

      // Auto-clear success after 3s
      setTimeout(() => setSavedCount(0), 3000);
    } catch {
      setGlobalError(t.entry.errors.batchFailed);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="px-5 pt-6 pb-4 sticky top-0 z-10" style={{ background: "#F5F4EF", borderBottom: "1px solid #D9E0DC" }}>
        <h1 className="gt-page-title mb-4">{t.entry.title}</h1>

        {/* Tab Switcher */}
        <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: "#D9E0DC", background: "#FFFFFF" }}>
          <button
            onClick={() => switchTab("earning")}
            className="flex-1 py-3 text-sm font-semibold transition-all"
            style={{
              background: activeTab === "earning" ? "#176B63" : "transparent",
              color: activeTab === "earning" ? "#FFFFFF" : "#586967",
            }}
          >
            💰 {t.entry.earningTab}
          </button>
          <button
            onClick={() => switchTab("expense")}
            className="flex-1 py-3 text-sm font-semibold transition-all"
            style={{
              background: activeTab === "expense" ? "#B8403A" : "transparent",
              color: activeTab === "expense" ? "#FFFFFF" : "#586967",
            }}
          >
            💸 {t.entry.expenseTab}
          </button>
        </div>
      </div>

      {/* Success Banner */}
      {savedCount > 0 && (
        <div className="mx-4 mt-4 flex items-center gap-3 p-3 rounded-xl gt-fade-in" style={{ background: "#E8F5EE" }}>
          <CheckCircle2 size={20} color="#287A55" />
          <span className="text-sm font-semibold" style={{ color: "#287A55" }}>
            {savedCount} {savedCount === 1 ? "entry" : "entries"} {t.entry.saved}
          </span>
        </div>
      )}

      {/* Global Error */}
      {globalError && (
        <div className="mx-4 mt-4 flex items-center gap-3 p-3 rounded-xl" style={{ background: "#FDE8E7" }}>
          <X size={18} color="#B8403A" />
          <span className="text-sm" style={{ color: "#B8403A" }}>{globalError}</span>
        </div>
      )}

      {/* Rows */}
      <div className="flex flex-col gap-4 px-4 pt-4 flex-1">
        {rows.map((row, idx) => (
          <div key={row.id} className="gt-card gt-fade-in">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase" style={{ color: "#586967", letterSpacing: "0.05em" }}>
                {lang === "hi" ? "प्रविष्टि" : "Entry"} {idx + 1}
              </span>
              {rows.length > 1 && (
                <button
                  onClick={() => removeRow(row.id)}
                  className="gt-btn-ghost py-1 px-2"
                  style={{ color: "#B8403A", minHeight: "auto" }}
                  aria-label="Remove row"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>

            <div className="flex flex-col gap-4">
              {/* Amount */}
              <div>
                <label className="gt-label">{t.entry.amount}</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold" style={{ color: "#586967" }}>₹</span>
                  <input
                    className={`gt-input pl-8 ${row.amountError ? "error" : ""}`}
                    placeholder="0"
                    inputMode="decimal"
                    value={row.amount}
                    onChange={(e) => updateRow(row.id, { amount: e.target.value })}
                  />
                </div>
                {row.amountError && <p className="gt-error">{row.amountError}</p>}
              </div>

              {/* Platform (earning) */}
              {row.type === "earning" && (
                <PlatformSelect
                  value={row.platform}
                  platforms={platforms}
                  onChange={(v) => updateRow(row.id, { platform: v })}
                  error={row.platformError}
                  lang={lang}
                />
              )}

              {/* Expense label */}
              {row.type === "expense" && (
                <ExpenseLabelSelect
                  value={row.expenseLabel}
                  customValue={row.customLabel}
                  onLabelChange={(v) => updateRow(row.id, { expenseLabel: v })}
                  onCustomChange={(v) => updateRow(row.id, { customLabel: v })}
                  error={row.labelError}
                  lang={lang}
                />
              )}

              {/* Date */}
              <div>
                <label className="gt-label">{t.entry.date}</label>
                <input
                  type="date"
                  className="gt-input"
                  value={row.date}
                  max={today}
                  onChange={(e) => updateRow(row.id, { date: e.target.value })}
                />
              </div>
            </div>
          </div>
        ))}

        {/* Add Row */}
        <button onClick={addRow} className="gt-btn-secondary w-full">
          <Plus size={18} /> {t.entry.addRow}
        </button>
      </div>

      {/* Save Button */}
      <div className="sticky bottom-0 px-4 py-4" style={{ background: "rgba(245,244,239,0.95)", backdropFilter: "blur(8px)", borderTop: "1px solid #D9E0DC", paddingBottom: "max(16px, env(safe-area-inset-bottom))" }}>
        <button
          onClick={handleSave}
          disabled={saving}
          className="gt-btn-primary w-full"
        >
          {saving ? t.entry.saving : `${t.entry.saveAll} (${rows.length})`}
        </button>
      </div>
    </div>
  );
}
