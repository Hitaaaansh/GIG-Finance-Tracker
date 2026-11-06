"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LocalAuth } from "@/lib/data/LocalDataService";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const session = LocalAuth.getCurrentSession();
    if (session) {
      router.replace("/home");
    } else {
      router.replace("/login");
    }
  }, [router]);

  // Render a minimal loading screen while the redirect is computed client-side
  return (
    <div className="min-h-dvh flex items-center justify-center bg-canvas">
      <div className="flex flex-col items-center gap-3">
        <span
          className="text-2xl font-bold tracking-tight"
          style={{ color: "#176B63" }}
        >
          GigTrack
        </span>
        <div className="gt-skeleton h-1 w-24 rounded-full" />
      </div>
    </div>
  );
}
