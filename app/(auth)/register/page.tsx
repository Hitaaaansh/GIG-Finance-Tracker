"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import { useI18n } from "@/lib/i18n/context";
import { AlertCircle, Loader2, Eye, EyeOff, CheckCircle2 } from "lucide-react";

interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const { t } = useI18n();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validate(): FieldErrors {
    const errors: FieldErrors = {};
    if (!name.trim()) errors.name = t.onboarding.errors.nameRequired;
    if (!email.trim()) {
      errors.email = t.auth.errors.emailRequired;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = t.auth.errors.emailInvalid;
    }
    if (!password) {
      errors.password = t.auth.errors.passwordRequired;
    } else if (password.length < 8) {
      errors.password = t.auth.errors.passwordMin;
    }
    if (password && confirmPassword !== password) {
      errors.confirmPassword = t.auth.errors.passwordMismatch;
    } else if (!confirmPassword) {
      errors.confirmPassword = t.auth.errors.passwordRequired;
    }
    return errors;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGlobalError(null);

    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsSubmitting(true);
    try {
      const result = await register(email.trim(), password, name.trim());
      if (result.error) {
        setGlobalError(result.error);
        setIsSubmitting(false);
        return;
      }
      router.replace("/onboarding");
    } catch {
      setGlobalError(t.auth.errors.registerFailed);
      setIsSubmitting(false);
    }
  }

  const passwordStrong = password.length >= 8;

  return (
    <div className="gt-card gt-fade-in">
      {/* Header */}
      <div className="mb-6 text-center">
        <h1 className="text-xl font-bold text-ink mb-1">{t.auth.register}</h1>
        <p className="text-sm" style={{ color: "#586967" }}>
          Start tracking your gig earnings today
        </p>
      </div>

      {/* Global error */}
      {globalError && (
        <div
          className="flex items-start gap-2 rounded-lg px-3 py-3 mb-4 text-sm"
          style={{ background: "#FDE8E7", color: "#B8403A" }}
          role="alert"
        >
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{globalError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        {/* Name */}
        <div>
          <label htmlFor="reg-name" className="gt-label">
            Display Name
          </label>
          <input
            id="reg-name"
            type="text"
            autoComplete="name"
            className={`gt-input${fieldErrors.name ? " error" : ""}`}
            placeholder={t.onboarding.step1.placeholder}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setFieldErrors((prev) => ({ ...prev, name: undefined }));
            }}
            disabled={isSubmitting}
          />
          {fieldErrors.name && (
            <p className="gt-error">
              <AlertCircle size={12} />
              {fieldErrors.name}
            </p>
          )}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="reg-email" className="gt-label">
            {t.auth.email}
          </label>
          <input
            id="reg-email"
            type="email"
            autoComplete="email"
            inputMode="email"
            className={`gt-input${fieldErrors.email ? " error" : ""}`}
            placeholder="you@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setFieldErrors((prev) => ({ ...prev, email: undefined }));
            }}
            disabled={isSubmitting}
          />
          {fieldErrors.email && (
            <p className="gt-error">
              <AlertCircle size={12} />
              {fieldErrors.email}
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <label htmlFor="reg-password" className="gt-label">
            {t.auth.password}
          </label>
          <div className="relative">
            <input
              id="reg-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              className={`gt-input pr-11${fieldErrors.password ? " error" : ""}`}
              placeholder="Min. 8 characters"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setFieldErrors((prev) => ({ ...prev, password: undefined }));
              }}
              disabled={isSubmitting}
            />
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded"
              style={{ color: "#586967" }}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {/* Strength hint */}
          {password.length > 0 && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <div
                className="h-1 flex-1 rounded-full transition-colors duration-200"
                style={{ background: passwordStrong ? "#287A55" : "#D99A2B" }}
              />
              <span
                className="text-xs font-medium"
                style={{ color: passwordStrong ? "#287A55" : "#A96512" }}
              >
                {passwordStrong ? "Strong" : "Too short"}
              </span>
            </div>
          )}
          {fieldErrors.password && (
            <p className="gt-error">
              <AlertCircle size={12} />
              {fieldErrors.password}
            </p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label htmlFor="reg-confirm" className="gt-label">
            {t.auth.confirmPassword}
          </label>
          <div className="relative">
            <input
              id="reg-confirm"
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              className={`gt-input pr-11${fieldErrors.confirmPassword ? " error" : ""}`}
              placeholder="Repeat password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setFieldErrors((prev) => ({
                  ...prev,
                  confirmPassword: undefined,
                }));
              }}
              disabled={isSubmitting}
            />
            <button
              type="button"
              aria-label={showConfirm ? "Hide password" : "Show password"}
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded"
              style={{ color: "#586967" }}
              tabIndex={-1}
            >
              {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {/* Match indicator */}
          {confirmPassword.length > 0 && password === confirmPassword && (
            <div className="flex items-center gap-1 mt-1" style={{ color: "#287A55" }}>
              <CheckCircle2 size={13} />
              <span className="text-xs font-medium">Passwords match</span>
            </div>
          )}
          {fieldErrors.confirmPassword && (
            <p className="gt-error">
              <AlertCircle size={12} />
              {fieldErrors.confirmPassword}
            </p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="gt-btn-primary w-full mt-1"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Creating account…
            </>
          ) : (
            t.auth.register
          )}
        </button>
      </form>

      {/* Login link */}
      <p className="mt-5 text-center text-sm" style={{ color: "#586967" }}>
        {t.auth.haveAccount}{" "}
        <Link
          href="/login"
          className="font-semibold"
          style={{ color: "#176B63" }}
        >
          {t.auth.signIn}
        </Link>
      </p>
    </div>
  );
}
