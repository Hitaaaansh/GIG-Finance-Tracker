"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import { useI18n } from "@/lib/i18n/context";
import { AlertCircle, Loader2, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login, profile, isLoading: authLoading } = useAuth();
  const { t } = useI18n();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already logged in
  // (handled by root page, but belt-and-suspenders)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Basic client-side validation
    if (!email.trim()) {
      setError(t.auth.errors.emailRequired);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError(t.auth.errors.emailInvalid);
      return;
    }
    if (!password) {
      setError(t.auth.errors.passwordRequired);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await login(email.trim(), password);
      if (result.error) {
        setError(result.error);
        setIsSubmitting(false);
        return;
      }
      // Check if onboarding is needed — profile may not be loaded yet, so we
      // read it via LocalProfiles after login via auth context's refreshed state.
      // We use a small trick: the profile state from context might still be null
      // at this exact tick, so we navigate to /home and let the app layout
      // redirect to /onboarding if needed.
      router.replace("/home");
    } catch {
      setError(t.auth.errors.loginFailed);
      setIsSubmitting(false);
    }
  }

  return (
    <div className="gt-card gt-fade-in">
      {/* Header */}
      <div className="mb-6 text-center">
        <h1 className="text-xl font-bold text-ink mb-1">{t.auth.login}</h1>
        <p className="text-sm" style={{ color: "#586967" }}>
          {t.tagline}
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div
          className="flex items-start gap-2 rounded-lg px-3 py-3 mb-4 text-sm"
          style={{ background: "#FDE8E7", color: "#B8403A" }}
          role="alert"
        >
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        {/* Email */}
        <div>
          <label htmlFor="email" className="gt-label">
            {t.auth.email}
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            className={`gt-input${error && !email ? " error" : ""}`}
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="gt-label">
            {t.auth.password}
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              className={`gt-input pr-11${error && !password ? " error" : ""}`}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
        </div>

        {/* Forgot password */}
        <div className="text-right -mt-1">
          <Link
            href="/forgot-password"
            className="text-sm font-medium"
            style={{ color: "#176B63" }}
          >
            {t.auth.forgotPassword}
          </Link>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="gt-btn-primary w-full mt-1"
          disabled={isSubmitting || authLoading}
        >
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Signing in…
            </>
          ) : (
            t.auth.login
          )}
        </button>
      </form>

      {/* Register link */}
      <p className="mt-5 text-center text-sm" style={{ color: "#586967" }}>
        {t.auth.noAccount}{" "}
        <Link
          href="/register"
          className="font-semibold"
          style={{ color: "#176B63" }}
        >
          {t.auth.signUp}
        </Link>
      </p>
    </div>
  );
}
