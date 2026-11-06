"use client";

import { useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import { LocalAuth } from "@/lib/data/LocalDataService";
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const { t } = useI18n();

  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError(t.auth.errors.emailRequired);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError(t.auth.errors.emailInvalid);
      return;
    }

    setIsSubmitting(true);
    // LocalAuth.requestPasswordReset is a no-op; always show success
    LocalAuth.requestPasswordReset(email.trim());
    // Simulate slight delay for UX realism
    await new Promise((res) => setTimeout(res, 600));
    setIsSubmitting(false);
    setSubmitted(true);
  }

  return (
    <div className="gt-card gt-fade-in">
      {/* Back link */}
      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 text-sm font-medium mb-5"
        style={{ color: "#586967" }}
      >
        <ArrowLeft size={15} />
        Back to sign in
      </Link>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-ink mb-1">
          {t.auth.resetPassword}
        </h1>
        <p className="text-sm" style={{ color: "#586967" }}>
          Enter your email and we'll send a reset link.
        </p>
      </div>

      {/* Success state */}
      {submitted ? (
        <div
          className="flex flex-col items-center gap-4 py-6 text-center gt-fade-in"
        >
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ background: "#E8F5EE" }}
          >
            <CheckCircle2 size={28} style={{ color: "#287A55" }} />
          </div>
          <div>
            <p className="font-semibold text-ink mb-1">Check your inbox</p>
            <p className="text-sm" style={{ color: "#586967" }}>
              {t.auth.resetPasswordSent}
            </p>
          </div>
          <Link href="/login" className="gt-btn-secondary w-full mt-2">
            {t.auth.signIn}
          </Link>
        </div>
      ) : (
        <>
          {/* Error */}
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
            <div>
              <label htmlFor="forgot-email" className="gt-label">
                {t.auth.email}
              </label>
              <input
                id="forgot-email"
                type="email"
                autoComplete="email"
                inputMode="email"
                className={`gt-input${error ? " error" : ""}`}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                disabled={isSubmitting}
              />
            </div>

            <button
              type="submit"
              className="gt-btn-primary w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Sending…
                </>
              ) : (
                "Send Reset Link"
              )}
            </button>
          </form>

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
        </>
      )}
    </div>
  );
}
