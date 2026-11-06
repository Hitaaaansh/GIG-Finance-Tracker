"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import { useI18n } from "@/lib/i18n/context";
import { LocalProfiles, LocalWorkdays, LocalPlatforms } from "@/lib/data/LocalDataService";
import { generateId, nowISO } from "@/lib/utils/time";
import { parseRupeeInput } from "@/lib/utils/money";
import {
  PLATFORM_KEYS,
  PLATFORM_LABELS,
  type PlatformKey,
  type Weekday,
  type Language,
  type VehicleType,
} from "@/types/domain";
import { Check, ChevronRight, ChevronLeft, Globe } from "lucide-react";

const WEEKDAYS: { key: Weekday; en: string; hi: string }[] = [
  { key: 1, en: "Mon", hi: "सोम" },
  { key: 2, en: "Tue", hi: "मंगल" },
  { key: 3, en: "Wed", hi: "बुध" },
  { key: 4, en: "Thu", hi: "गुरु" },
  { key: 5, en: "Fri", hi: "शुक्र" },
  { key: 6, en: "Sat", hi: "शनि" },
  { key: 0, en: "Sun", hi: "रवि" },
];

const PLATFORM_ICONS: Record<PlatformKey, string> = {
  uber: "🚗",
  ola: "🟢",
  rapido: "🏍️",
  swiggy: "🍔",
  zomato: "🍕",
  blinkit: "⚡",
  zepto: "🛒",
  porter: "📦",
};

interface OnboardingState {
  displayName: string;
  language: Language;
  platforms: PlatformKey[];
  targetRupees: string;
  workdays: Weekday[];
  city: string;
  vehicleType: VehicleType | "";
}

const TOTAL_STEPS = 6;

export default function OnboardingPage() {
  const { session, refreshProfile } = useAuth();
  const { t, lang, setLang } = useI18n();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [state, setState] = useState<OnboardingState>({
    displayName: "",
    language: "en",
    platforms: [],
    targetRupees: "",
    workdays: [1, 2, 3, 4, 5],
    city: "",
    vehicleType: "",
  });

  const update = (key: keyof OnboardingState, value: unknown) => {
    setState((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const togglePlatform = (key: PlatformKey) => {
    setState((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(key)
        ? prev.platforms.filter((k) => k !== key)
        : [...prev.platforms, key],
    }));
    setErrors((prev) => ({ ...prev, platforms: "" }));
  };

  const toggleWeekday = (day: Weekday) => {
    setState((prev) => ({
      ...prev,
      workdays: prev.workdays.includes(day)
        ? prev.workdays.filter((d) => d !== day)
        : [...prev.workdays, day],
    }));
    setErrors((prev) => ({ ...prev, workdays: "" }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (step === 1 && !state.displayName.trim()) {
      newErrors.displayName = t.onboarding.errors.nameRequired;
    }
    if (step === 3 && state.platforms.length === 0) {
      newErrors.platforms = t.onboarding.errors.platformRequired;
    }
    if (step === 4) {
      const parsed = parseRupeeInput(state.targetRupees);
      if (!parsed || parsed <= 0) newErrors.targetRupees = t.onboarding.errors.targetRequired;
    }
    if (step === 5 && state.workdays.length === 0) {
      newErrors.workdays = t.onboarding.errors.weekdayRequired;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validate()) return;
    if (step < TOTAL_STEPS) {
      if (step === 2) setLang(state.language);
      setStep((s) => s + 1);
    } else {
      handleFinish();
    }
  };

  const handleFinish = async () => {
    if (!session || !validate()) return;
    setSaving(true);

    const targetPaise = parseRupeeInput(state.targetRupees)!;

    LocalProfiles.create({
      id: session.user.id,
      display_name: state.displayName.trim(),
      language: state.language,
      city: state.city.trim() || undefined,
      vehicle_type: (state.vehicleType as VehicleType) || undefined,
      timezone: "Asia/Kolkata",
      monthly_target_paise: targetPaise,
      target_updated_at: nowISO(),
      morning_email_enabled: false,
      evening_reminder_enabled: false,
      onboarding_completed_at: nowISO(),
    });

    LocalWorkdays.set(session.user.id, state.workdays);
    LocalPlatforms.set(session.user.id, state.platforms);

    refreshProfile();
    router.replace("/home");
  };

  const progressPct = (step / TOTAL_STEPS) * 100;

  return (
    <div className="min-h-dvh bg-canvas flex flex-col">
      {/* Header */}
      <div className="px-5 pt-8 pb-4">
        <div className="flex items-center justify-between mb-6">
          <span className="text-xl font-bold text-teal" style={{ color: "#176B63" }}>
            GigTrack
          </span>
          <span className="text-sm text-muted" style={{ color: "#586967" }}>
            {step} / {TOTAL_STEPS}
          </span>
        </div>
        {/* Progress bar */}
        <div className="gt-progress-track">
          <div
            className="gt-progress-fill"
            style={{
              width: `${progressPct}%`,
              background: "#176B63",
            }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-5 py-2 gt-fade-in" key={step}>
        {/* Step 1: Name */}
        {step === 1 && (
          <div>
            <h1 className="text-2xl font-bold mb-1" style={{ color: "#182B2A" }}>
              {t.onboarding.step1.title}
            </h1>
            <p className="text-sm mb-8" style={{ color: "#586967" }}>
              {t.onboarding.welcomeSub}
            </p>
            <label className="gt-label">{t.onboarding.step1.label}</label>
            <input
              className={`gt-input ${errors.displayName ? "error" : ""}`}
              placeholder={t.onboarding.step1.placeholder}
              value={state.displayName}
              onChange={(e) => update("displayName", e.target.value)}
              autoFocus
            />
            {errors.displayName && <p className="gt-error">{errors.displayName}</p>}
          </div>
        )}

        {/* Step 2: Language */}
        {step === 2 && (
          <div>
            <h1 className="text-2xl font-bold mb-1" style={{ color: "#182B2A" }}>
              {t.onboarding.step2.title}
            </h1>
            <p className="text-sm mb-8" style={{ color: "#586967" }}>
              {t.onboarding.step2.label}
            </p>
            <div className="flex flex-col gap-3">
              {(["en", "hi"] as Language[]).map((l) => (
                <button
                  key={l}
                  onClick={() => update("language", l)}
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                    state.language === l
                      ? "border-[#176B63] bg-[#E8F4F2]"
                      : "border-[#D9E0DC] bg-white"
                  }`}
                >
                  <Globe size={20} color={state.language === l ? "#176B63" : "#586967"} />
                  <div className="text-left">
                    <div
                      className="font-semibold"
                      style={{ color: state.language === l ? "#176B63" : "#182B2A" }}
                    >
                      {l === "en" ? "English" : "हिन्दी"}
                    </div>
                    <div className="text-sm" style={{ color: "#586967" }}>
                      {l === "en" ? "English interface" : "हिंदी में इंटरफ़ेस"}
                    </div>
                  </div>
                  {state.language === l && (
                    <Check size={18} color="#176B63" className="ml-auto" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Platforms */}
        {step === 3 && (
          <div>
            <h1 className="text-2xl font-bold mb-1" style={{ color: "#182B2A" }}>
              {t.onboarding.step3.title}
            </h1>
            <p className="text-sm mb-6" style={{ color: "#586967" }}>
              {t.onboarding.step3.label}
            </p>
            <div className="flex flex-wrap gap-3">
              {PLATFORM_KEYS.map((key) => (
                <button
                  key={key}
                  onClick={() => togglePlatform(key)}
                  className={`gt-platform-chip ${state.platforms.includes(key) ? "selected" : ""}`}
                >
                  <span>{PLATFORM_ICONS[key]}</span>
                  {PLATFORM_LABELS[key]}
                  {state.platforms.includes(key) && <Check size={14} />}
                </button>
              ))}
            </div>
            {errors.platforms && <p className="gt-error mt-4">{errors.platforms}</p>}
          </div>
        )}

        {/* Step 4: Target */}
        {step === 4 && (
          <div>
            <h1 className="text-2xl font-bold mb-1" style={{ color: "#182B2A" }}>
              {t.onboarding.step4.title}
            </h1>
            <p className="text-sm mb-2" style={{ color: "#586967" }}>
              {t.onboarding.step4.hint}
            </p>
            <div className="gt-card mt-4 mb-6" style={{ background: "#FDF3DC", borderColor: "#D99A2B" }}>
              <p className="text-sm font-medium" style={{ color: "#A96512" }}>
                💡 This is your net take-home income target after subtracting all expenses.
              </p>
            </div>
            <label className="gt-label">{t.onboarding.step4.label}</label>
            <div className="relative">
              <span
                className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-lg"
                style={{ color: "#586967" }}
              >
                ₹
              </span>
              <input
                className={`gt-input pl-8 ${errors.targetRupees ? "error" : ""}`}
                placeholder={t.onboarding.step4.placeholder}
                value={state.targetRupees}
                onChange={(e) => update("targetRupees", e.target.value)}
                inputMode="numeric"
                autoFocus
              />
            </div>
            {errors.targetRupees && <p className="gt-error">{errors.targetRupees}</p>}
          </div>
        )}

        {/* Step 5: Workdays */}
        {step === 5 && (
          <div>
            <h1 className="text-2xl font-bold mb-1" style={{ color: "#182B2A" }}>
              {t.onboarding.step5.title}
            </h1>
            <p className="text-sm mb-2" style={{ color: "#586967" }}>
              {t.onboarding.step5.label}
            </p>
            <p className="text-xs mb-6" style={{ color: "#A8B5B2" }}>
              {t.onboarding.step5.hint}
            </p>
            <div className="grid grid-cols-4 gap-2">
              {WEEKDAYS.map(({ key, en: enLabel, hi: hiLabel }) => (
                <button
                  key={key}
                  onClick={() => toggleWeekday(key)}
                  className={`flex flex-col items-center py-3 rounded-xl border-2 transition-all font-semibold text-sm ${
                    state.workdays.includes(key)
                      ? "border-[#176B63] bg-[#E8F4F2] text-[#176B63]"
                      : "border-[#D9E0DC] bg-white text-[#586967]"
                  }`}
                >
                  {lang === "hi" ? hiLabel : enLabel}
                </button>
              ))}
            </div>
            {errors.workdays && <p className="gt-error mt-4">{errors.workdays}</p>}
          </div>
        )}

        {/* Step 6: Optional */}
        {step === 6 && (
          <div>
            <h1 className="text-2xl font-bold mb-1" style={{ color: "#182B2A" }}>
              {t.onboarding.step6.title}
            </h1>
            <p className="text-sm mb-8" style={{ color: "#586967" }}>
              These fields are optional — you can fill them in later.
            </p>
            <div className="flex flex-col gap-5">
              <div>
                <label className="gt-label">{t.onboarding.step6.cityLabel}</label>
                <input
                  className="gt-input"
                  placeholder={t.onboarding.step6.cityPlaceholder}
                  value={state.city}
                  onChange={(e) => update("city", e.target.value)}
                />
              </div>
              <div>
                <label className="gt-label">{t.onboarding.step6.vehicleLabel}</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {(["bike", "auto", "car", "cycle", "other"] as VehicleType[]).map((v) => (
                    <button
                      key={v}
                      onClick={() => update("vehicleType", state.vehicleType === v ? "" : v)}
                      className={`gt-platform-chip capitalize ${state.vehicleType === v ? "selected" : ""}`}
                    >
                      {t.profile.vehicles[v]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Nav */}
      <div className="px-5 py-5 flex items-center gap-3" style={{ paddingBottom: "max(20px, env(safe-area-inset-bottom))" }}>
        {step > 1 && (
          <button
            onClick={() => setStep((s) => s - 1)}
            className="gt-btn-secondary flex-shrink-0"
            style={{ width: "44px", padding: "0" }}
            aria-label={t.onboarding.back}
          >
            <ChevronLeft size={20} />
          </button>
        )}
        <button
          onClick={handleNext}
          disabled={saving}
          className="gt-btn-primary flex-1"
        >
          {saving
            ? t.common.loading
            : step === TOTAL_STEPS
            ? t.onboarding.finish
            : t.onboarding.next}
          {!saving && step < TOTAL_STEPS && <ChevronRight size={18} />}
        </button>
      </div>
    </div>
  );
}
