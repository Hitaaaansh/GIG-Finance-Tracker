import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-canvas px-4 py-8">
      {/* GigTrack wordmark */}
      <div className="mb-6 flex flex-col items-center gap-1">
        <span
          className="text-3xl font-bold tracking-tight select-none"
          style={{ color: "#176B63", fontFamily: "var(--font-ibm, inherit)" }}
        >
          GigTrack
        </span>
      </div>

      {/* Auth card container */}
      <div className="w-full max-w-[440px]">
        {children}
      </div>
    </div>
  );
}
