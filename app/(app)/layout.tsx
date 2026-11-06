"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import { useI18n } from "@/lib/i18n/context";
import { Home, PlusCircle, BarChart2, User } from "lucide-react";

// ─── Bottom Nav Config ────────────────────────────────────────────────────────
interface NavItem {
  href: string;
  labelKey: "home" | "add" | "analytics" | "profile";
  Icon: React.ElementType;
  isAction?: boolean;
}

const NAV_ITEMS: readonly NavItem[] = [
  { href: "/home", labelKey: "home", Icon: Home },
  { href: "/add", labelKey: "add", Icon: PlusCircle, isAction: true },
  { href: "/analytics", labelKey: "analytics", Icon: BarChart2 },
  { href: "/profile", labelKey: "profile", Icon: User },
] as const;

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className="min-h-dvh flex flex-col bg-canvas">
      {/* Content skeleton */}
      <div className="flex-1 px-4 pt-6 pb-[80px] flex flex-col gap-4">
        <div className="gt-skeleton h-7 w-40 rounded" />
        <div className="gt-skeleton h-4 w-56 rounded" />
        <div className="gt-skeleton h-32 w-full rounded-xl mt-4" />
        <div className="gt-skeleton h-24 w-full rounded-xl" />
        <div className="gt-skeleton h-24 w-full rounded-xl" />
      </div>
      {/* Bottom nav skeleton */}
      <div
        className="fixed bottom-0 inset-x-0 border-t flex items-center justify-around"
        style={{
          background: "#FFFFFF",
          borderColor: "#D9E0DC",
          height: "calc(60px + env(safe-area-inset-bottom, 0px))",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <div className="gt-skeleton h-6 w-6 rounded" />
            <div className="gt-skeleton h-2.5 w-10 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── App Shell Layout ─────────────────────────────────────────────────────────
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { session, profile, isLoading } = useAuth();
  const { t } = useI18n();

  // Auth guard: redirect to login if unauthenticated
  useEffect(() => {
    if (isLoading) return;
    if (!session) {
      router.replace("/login");
      return;
    }
    // Redirect to onboarding if profile exists but onboarding not completed
    if (profile && !profile.onboarding_completed_at) {
      router.replace("/onboarding");
    }
  }, [isLoading, session, profile, router]);

  if (isLoading) return <LoadingSkeleton />;

  // Don't render content while redirecting
  if (!session) return null;

  return (
    <div className="min-h-dvh flex flex-col bg-canvas">
      {/* Page content — padded so it clears the bottom nav */}
      <main
        className="flex-1 overflow-y-auto"
        style={{ paddingBottom: "calc(64px + env(safe-area-inset-bottom, 0px))" }}
      >
        {children}
      </main>

      {/* ── Bottom Navigation ── */}
      <nav
        aria-label="Main navigation"
        className="fixed bottom-0 inset-x-0 border-t z-50"
        style={{
          background: "#FFFFFF",
          borderColor: "#D9E0DC",
        }}
      >
        <div
          className="flex items-center justify-around"
          style={{
            height: "64px",
            paddingBottom: "env(safe-area-inset-bottom, 0px)",
          }}
        >
          {NAV_ITEMS.map(({ href, labelKey, Icon, isAction }) => {
            const isActive =
              pathname === href || pathname.startsWith(href + "/");
            const label = t.nav[labelKey];

            if (isAction) {
              // Add button — teal circle, larger
              return (
                <Link
                  key={href}
                  href={href}
                  aria-label={label}
                  className="flex flex-col items-center gap-1 min-w-[48px] min-h-[48px] justify-center"
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center shadow-md transition-transform active:scale-95"
                    style={{
                      background: isActive ? "#11554F" : "#176B63",
                      boxShadow: "0 2px 8px rgba(23,107,99,0.35)",
                    }}
                  >
                    <Icon
                      size={22}
                      color="#FFFFFF"
                      strokeWidth={2.2}
                    />
                  </div>
                </Link>
              );
            }

            return (
              <Link
                key={href}
                href={href}
                aria-label={label}
                className="flex flex-col items-center gap-1 min-w-[48px] min-h-[48px] justify-center px-2 transition-colors"
                style={{ color: isActive ? "#176B63" : "#586967" }}
              >
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.4 : 1.8}
                  className="transition-all"
                />
                <span
                  className="text-[10px] font-semibold tracking-wide leading-none"
                  style={{
                    color: isActive ? "#176B63" : "#586967",
                    fontWeight: isActive ? 700 : 500,
                  }}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
