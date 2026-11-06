import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-8"
      style={{ backgroundColor: "#F5F4EF" }}
    >
      {/* GigTrack wordmark */}
      <div className="mb-6 flex flex-col items-center gap-1 text-center">
        <span
          className="text-4xl font-extrabold tracking-tight select-none"
          style={{ color: "#176B63" }}
        >
          GigTrack
        </span>
      </div>

      {/* Auth card container */}
      <div className="w-full max-w-[440px] shadow-sm">
        {children}
      </div>
    </div>
  );
}
