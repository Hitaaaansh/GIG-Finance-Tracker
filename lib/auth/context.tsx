"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { LocalAuth, LocalProfiles, LocalWorkdays, LocalPlatforms } from "@/lib/data/LocalDataService";
import type { AuthSession, Profile, Weekday, PlatformKey } from "@/types/domain";

interface AuthContextValue {
  session: AuthSession | null;
  profile: Profile | null;
  workdays: Weekday[];
  platforms: PlatformKey[];
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  register: (email: string, password: string, displayName: string) => Promise<{ error?: string }>;
  logout: () => void;
  refreshProfile: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  profile: null,
  workdays: [],
  platforms: [],
  isLoading: true,
  login: async () => ({}),
  register: async () => ({}),
  logout: () => {},
  refreshProfile: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [workdays, setWorkdays] = useState<Weekday[]>([]);
  const [platforms, setPlatforms] = useState<PlatformKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadUserData = useCallback((userId: string) => {
    const p = LocalProfiles.get(userId);
    const w = LocalWorkdays.get(userId);
    const pl = LocalPlatforms.get(userId)
      .filter((p) => p.is_enabled)
      .map((p) => p.platform_key);
    setProfile(p);
    setWorkdays(w);
    setPlatforms(pl);
  }, []);

  useEffect(() => {
    const s = LocalAuth.getCurrentSession();
    setSession(s);
    if (s) loadUserData(s.user.id);
    setIsLoading(false);
  }, [loadUserData]);

  const login = useCallback(
    async (email: string, password: string): Promise<{ error?: string }> => {
      const result = LocalAuth.login(email, password);
      if ("error" in result) return { error: result.error };
      setSession(result.session);
      loadUserData(result.session.user.id);
      return {};
    },
    [loadUserData]
  );

  const register = useCallback(
    async (
      email: string,
      password: string,
      _displayName: string
    ): Promise<{ error?: string }> => {
      const result = LocalAuth.register(email, password);
      if ("error" in result) return { error: result.error };
      // Auto-login after register
      const loginResult = LocalAuth.login(email, password);
      if ("error" in loginResult) return { error: loginResult.error };
      setSession(loginResult.session);
      return {};
    },
    []
  );

  const logout = useCallback(() => {
    LocalAuth.logout();
    setSession(null);
    setProfile(null);
    setWorkdays([]);
    setPlatforms([]);
  }, []);

  const refreshProfile = useCallback(() => {
    if (session) loadUserData(session.user.id);
  }, [session, loadUserData]);

  return (
    <AuthContext.Provider
      value={{ session, profile, workdays, platforms, isLoading, login, register, logout, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
