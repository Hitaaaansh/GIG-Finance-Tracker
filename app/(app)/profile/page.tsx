"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import { useI18n } from "@/lib/i18n/context";
import {
  LocalProfiles,
  LocalWorkdays,
  LocalPlatforms,
  LocalTargetHistory,
  seedDemoData,
} from "@/lib/data/LocalDataService";
import { MockPlatformAdapters } from "@/lib/integrations/mockAdapters";
import { formatINR, parseRupeeInput } from "@/lib/utils/money";
import { nowISO } from "@/lib/utils/time";
import {
  PLATFORM_KEYS,
  PLATFORM_LABELS,
  WEEKDAY_LABELS,
  type PlatformKey,
  type Weekday,
  type Language,
  type VehicleType,
  type MonthlyTargetHistory,
} from "@/types/domain";
import {
  User,
  Globe,
  Target,
  Calendar,
  Layers,
  MapPin,
  Car,
  Bell,
  RefreshCw,
  LogOut,
  Check,
  AlertCircle,
  History,
  Database,
} from "lucide-react";

export default function ProfilePage() {
  const { session, profile, workdays, platforms, logout, refreshProfile } = useAuth();
  const { t, lang, setLang } = useI18n();
  const router = useRouter();

  // Local Form State
  const [displayName, setDisplayName] = useState("");
  const [targetRupees, setTargetRupees] = useState("");
  const [selectedWeekdays, setSelectedWeekdays] = useState<Weekday[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<PlatformKey[]>([]);
  const [city, setCity] = useState("");
  const [vehicleType, setVehicleType] = useState<VehicleType | "">("");
  const [morningEmail, setMorningEmail] = useState(false);
  const [eveningEmail, setEveningEmail] = useState(false);

  // Status & modal states
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [targetHistory, setTargetHistory] = useState<MonthlyTargetHistory[]>([]);
  const [showTargetConfirm, setShowTargetConfirm] = useState(false);
  const [pendingTargetPaise, setPendingTargetPaise] = useState<number | null>(null);

  // Initialize form from profile
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || "");
      setTargetRupees(profile.monthly_target_paise ? String(profile.monthly_target_paise / 100) : "");
      setCity(profile.city || "");
      setVehicleType(profile.vehicle_type || "");
      setMorningEmail(profile.morning_email_enabled);
      setEveningEmail(profile.evening_reminder_enabled);
    }
    if (workdays) {
      setSelectedWeekdays(workdays);
    }
    if (platforms) {
      setSelectedPlatforms(platforms);
    }
    if (session) {
      setTargetHistory(LocalTargetHistory.get(session.user.id));
    }
  }, [profile, workdays, platforms, session]);

  const toggleWeekday = (d: Weekday) => {
    setSelectedWeekdays((prev) =>
      prev.includes(d)
        ? prev.length > 1
          ? prev.filter((item) => item !== d)
          : prev // maintain at least one workday
        : [...prev, d]
    );
  };

  const togglePlatform = (p: PlatformKey) => {
    setSelectedPlatforms((prev) =>
      prev.includes(p)
        ? prev.length > 1
          ? prev.filter((item) => item !== p)
          : prev // maintain at least one platform
        : [...prev, p]
    );
  };

  const handleSaveAttempt = () => {
    const parsedTarget = parseRupeeInput(targetRupees);
    if (!parsedTarget || parsedTarget <= 0) return;

    // If target has changed, show confirmation warning per TARGET-08 / TARGET-09
    if (profile && parsedTarget !== profile.monthly_target_paise) {
      setPendingTargetPaise(parsedTarget);
      setShowTargetConfirm(true);
    } else {
      executeSave(profile?.monthly_target_paise);
    }
  };

  const executeSave = async (targetToSave?: number) => {
    if (!session || !profile) return;
    setSaving(true);
    setSaveSuccess(false);

    const effectiveTarget = targetToSave ?? (parseRupeeInput(targetRupees) || profile.monthly_target_paise);

    // Record target history if changed
    if (effectiveTarget !== profile.monthly_target_paise) {
      LocalTargetHistory.record(session.user.id, effectiveTarget);
      setTargetHistory(LocalTargetHistory.get(session.user.id));
    }

    LocalProfiles.update(session.user.id, {
      display_name: displayName.trim() || profile.display_name,
      monthly_target_paise: effectiveTarget,
      target_updated_at: effectiveTarget !== profile.monthly_target_paise ? nowISO() : profile.target_updated_at,
      city: city.trim() || undefined,
      vehicle_type: (vehicleType as VehicleType) || undefined,
      morning_email_enabled: morningEmail,
      evening_reminder_enabled: eveningEmail,
      language: lang,
    });

    LocalWorkdays.set(session.user.id, selectedWeekdays);
    LocalPlatforms.set(session.user.id, selectedPlatforms);

    refreshProfile();
    setSaving(false);
    setShowTargetConfirm(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleSyncPlatforms = () => {
    if (!session) return;
    setSyncing(true);
    setSyncStatus(null);

    setTimeout(() => {
      const results = MockPlatformAdapters.syncUserPlatforms(
        session.user.id,
        selectedPlatforms,
        true
      );
      const insertedCount = results.reduce((acc, r) => acc + r.inserted, 0);
      setSyncing(false);
      setSyncStatus(
        lang === "hi"
          ? `${insertedCount} नए रिकॉर्ड्स सिंक किए गए!`
          : `Synced ${insertedCount} new platform activities!`
      );
      refreshProfile();
      setTimeout(() => setSyncStatus(null), 4000);
    }, 600);
  };

  const handleLoadDemoData = () => {
    if (!session) return;
    seedDemoData(session.user.id);
    setSyncStatus(t.profile.demoDataLoaded);
    refreshProfile();
    setTimeout(() => setSyncStatus(null), 3000);
  };

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  if (!profile) return null;

  return (
    <div className="flex flex-col gap-5 p-4 pb-12 max-w-2xl mx-auto">
      {/* Header */}
      <div className="pt-2">
        <h1 className="gt-page-title">{t.profile.title}</h1>
        <p className="text-sm text-[#586967] mt-0.5">
          {session?.user.email}
        </p>
      </div>

      {saveSuccess && (
        <div className="flex items-center gap-2 p-3 bg-[#E8F5EE] border border-[#287A55] rounded-xl text-sm text-[#287A55] font-semibold gt-fade-in">
          <Check size={18} />
          <span>{t.profile.saved}</span>
        </div>
      )}

      {syncStatus && (
        <div className="flex items-center gap-2 p-3 bg-[#E8F4F2] border border-[#176B63] rounded-xl text-sm text-[#176B63] font-semibold gt-fade-in">
          <Check size={18} />
          <span>{syncStatus}</span>
        </div>
      )}

      {/* Target Change Modal (TARGET-08) */}
      {showTargetConfirm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full border border-[#D9E0DC] shadow-xl gt-fade-in">
            <div className="flex items-center gap-2 text-[#A96512] mb-3">
              <AlertCircle size={22} />
              <h3 className="font-bold text-base text-[#182B2A]">
                {lang === "hi" ? "लक्ष्य बदलने की पुष्टि" : "Update Monthly Target"}
              </h3>
            </div>
            <p className="text-sm text-[#586967] mb-4">
              {lang === "hi"
                ? `नया लक्ष्य ₹${(pendingTargetPaise! / 100).toLocaleString("en-IN")} तुरंत लागू होगा। पिछला इतिहास सुरक्षित रहेगा।`
                : `Your new target of ₹${(pendingTargetPaise! / 100).toLocaleString("en-IN")} applies immediately to future progress calculations. Prior monthly snapshots are preserved.`}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowTargetConfirm(false)}
                className="gt-btn-secondary flex-1"
              >
                {t.common.cancel}
              </button>
              <button
                onClick={() => executeSave(pendingTargetPaise!)}
                className="gt-btn-primary flex-1"
              >
                {t.common.confirm}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Basic Profile */}
      <div className="gt-card flex flex-col gap-4">
        <div className="flex items-center gap-2 pb-2 border-b border-[#D9E0DC]">
          <User size={18} className="text-[#176B63]" />
          <h2 className="font-bold text-sm text-[#182B2A]">{t.profile.title}</h2>
        </div>

        <div>
          <label className="gt-label">{t.profile.editName}</label>
          <input
            className="gt-input"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </div>

        {/* Language Selection */}
        <div>
          <label className="gt-label">{t.profile.language}</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setLang("en")}
              className={`flex-1 py-2.5 rounded-lg border text-sm font-semibold flex items-center justify-center gap-2 ${
                lang === "en"
                  ? "border-[#176B63] bg-[#E8F4F2] text-[#176B63]"
                  : "border-[#D9E0DC] text-[#586967]"
              }`}
            >
              <Globe size={16} /> English
            </button>
            <button
              type="button"
              onClick={() => setLang("hi")}
              className={`flex-1 py-2.5 rounded-lg border text-sm font-semibold flex items-center justify-center gap-2 ${
                lang === "hi"
                  ? "border-[#176B63] bg-[#E8F4F2] text-[#176B63]"
                  : "border-[#D9E0DC] text-[#586967]"
              }`}
            >
              <Globe size={16} /> हिन्दी
            </button>
          </div>
        </div>
      </div>

      {/* Target & Schedule */}
      <div className="gt-card flex flex-col gap-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#D9E0DC]">
          <div className="flex items-center gap-2">
            <Target size={18} className="text-[#176B63]" />
            <h2 className="font-bold text-sm text-[#182B2A]">{t.dashboard.target}</h2>
          </div>
          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            className="text-xs text-[#176B63] font-semibold flex items-center gap-1"
          >
            <History size={14} />
            {t.profile.targetHistory}
          </button>
        </div>

        <div>
          <label className="gt-label">{t.profile.target}</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-[#586967]">₹</span>
            <input
              className="gt-input pl-8"
              value={targetRupees}
              onChange={(e) => setTargetRupees(e.target.value)}
              inputMode="numeric"
            />
          </div>
          <p className="text-xs text-[#586967] mt-1.5">
            {lang === "hi"
              ? "यह आपका शुद्ध मासिक आय लक्ष्य (खर्च घटाकर) है।"
              : "Net monthly earnings target after deducting fuel and other expenses."}
          </p>
        </div>

        {/* Target History Expandable */}
        {showHistory && (
          <div className="p-3 bg-[#F5F4EF] rounded-xl text-xs flex flex-col gap-2 border border-[#D9E0DC]">
            <span className="font-bold text-[#182B2A]">{t.profile.targetHistory}</span>
            {targetHistory.length === 0 ? (
              <p className="text-[#586967]">
                {lang === "hi" ? "कोई पिछला रिकॉर्ड नहीं" : "No previous targets recorded"}
              </p>
            ) : (
              targetHistory.map((h) => (
                <div key={h.id} className="flex justify-between border-b border-[#D9E0DC] pb-1">
                  <span>{h.target_month}</span>
                  <span className="font-bold text-[#182B2A]">{formatINR(h.target_paise)}</span>
                </div>
              ))
            )}
          </div>
        )}

        {/* Working Weekdays Selection */}
        <div>
          <label className="gt-label">{t.profile.workdays}</label>
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
            {([1, 2, 3, 4, 5, 6, 0] as Weekday[]).map((d) => {
              const active = selectedWeekdays.includes(d);
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleWeekday(d)}
                  className={`py-2 text-xs font-semibold rounded-lg border transition-all ${
                    active
                      ? "border-[#176B63] bg-[#E8F4F2] text-[#176B63]"
                      : "border-[#D9E0DC] text-[#586967]"
                  }`}
                >
                  {lang === "hi" ? WEEKDAY_LABELS[d].hi.slice(0, 3) : WEEKDAY_LABELS[d].short}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Platforms */}
      <div className="gt-card flex flex-col gap-3">
        <div className="flex items-center gap-2 pb-2 border-b border-[#D9E0DC]">
          <Layers size={18} className="text-[#176B63]" />
          <h2 className="font-bold text-sm text-[#182B2A]">{t.profile.platforms}</h2>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {PLATFORM_KEYS.map((key) => {
            const active = selectedPlatforms.includes(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => togglePlatform(key)}
                className={`gt-platform-chip text-xs ${active ? "selected" : ""}`}
              >
                <span>{PLATFORM_LABELS[key]}</span>
                {active && <Check size={14} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Optional Details */}
      <div className="gt-card flex flex-col gap-4">
        <div className="flex items-center gap-2 pb-2 border-b border-[#D9E0DC]">
          <Car size={18} className="text-[#176B63]" />
          <h2 className="font-bold text-sm text-[#182B2A]">
            {lang === "hi" ? "अतिरिक्त जानकारी" : "Additional Info"}
          </h2>
        </div>

        <div>
          <label className="gt-label">{t.profile.city}</label>
          <input
            className="gt-input"
            value={city}
            placeholder="e.g. Bengaluru, Delhi NCR, Mumbai"
            onChange={(e) => setCity(e.target.value)}
          />
        </div>

        <div>
          <label className="gt-label">{t.profile.vehicle}</label>
          <div className="flex flex-wrap gap-2">
            {(["bike", "auto", "car", "cycle", "other"] as VehicleType[]).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setVehicleType(vehicleType === v ? "" : v)}
                className={`gt-platform-chip text-xs capitalize ${
                  vehicleType === v ? "selected" : ""
                }`}
              >
                {t.profile.vehicles[v]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="gt-card flex flex-col gap-3">
        <div className="flex items-center gap-2 pb-2 border-b border-[#D9E0DC]">
          <Bell size={18} className="text-[#176B63]" />
          <h2 className="font-bold text-sm text-[#182B2A]">{t.profile.emailNotifs}</h2>
        </div>

        <label className="flex items-center justify-between text-xs py-1 cursor-pointer">
          <span className="text-[#182B2A] font-medium">{t.profile.morningEmail}</span>
          <input
            type="checkbox"
            checked={morningEmail}
            onChange={(e) => setMorningEmail(e.target.checked)}
            className="w-4 h-4 accent-[#176B63]"
          />
        </label>

        <label className="flex items-center justify-between text-xs py-1 cursor-pointer">
          <span className="text-[#182B2A] font-medium">{t.profile.eveningEmail}</span>
          <input
            type="checkbox"
            checked={eveningEmail}
            onChange={(e) => setEveningEmail(e.target.checked)}
            className="w-4 h-4 accent-[#176B63]"
          />
        </label>
      </div>

      {/* Platform Sync & Mock Demo Actions (INT-01 / INT-06) */}
      <div className="gt-card flex flex-col gap-3">
        <div className="flex items-center gap-2 pb-2 border-b border-[#D9E0DC]">
          <Database size={18} className="text-[#176B63]" />
          <h2 className="font-bold text-sm text-[#182B2A]">
            {lang === "hi" ? "डेटा सिंक और डेमो" : "Data Sync & Demos"}
          </h2>
        </div>

        <p className="text-xs text-[#586967]">
          {lang === "hi"
            ? "मॉक एडाप्टर के माध्यम से अपने चयनित ऐप्स से ट्रिप डेटा सिंक करें या त्वरित पूर्वावलोकन के लिए डेमो डेटा लोड करें।"
            : "Sync recent trip & order payouts via mock platform adapters, or load demo historical entries."}
        </p>

        <div className="flex flex-col sm:flex-row gap-2 mt-1">
          <button
            type="button"
            onClick={handleSyncPlatforms}
            disabled={syncing}
            className="gt-btn-secondary flex-1 py-2.5 text-xs flex items-center justify-center gap-2"
          >
            <RefreshCw size={15} className={syncing ? "animate-spin" : ""} />
            {syncing ? t.profile.syncing : t.profile.syncPlatforms}
          </button>

          <button
            type="button"
            onClick={handleLoadDemoData}
            className="gt-btn-secondary flex-1 py-2.5 text-xs flex items-center justify-center gap-2"
          >
            <Database size={15} />
            {t.profile.loadDemoData}
          </button>
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSaveAttempt}
        disabled={saving}
        className="gt-btn-primary w-full py-3 text-sm"
      >
        {saving ? t.common.loading : t.profile.saveChanges}
      </button>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="gt-btn-ghost w-full py-2.5 text-xs text-[#B8403A] hover:bg-[#FDE8E7] flex items-center justify-center gap-2"
      >
        <LogOut size={16} />
        {t.auth.logout}
      </button>
    </div>
  );
}
