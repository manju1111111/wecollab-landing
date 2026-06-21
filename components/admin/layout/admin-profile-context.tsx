"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

export interface ProfileData {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  company: string;
  role: string;
  bio: string;
  location: string;
  avatarUrl: string;
  // UI preferences (kept client-side only — not blocking profile identity)
  darkMode: boolean;
  emailNotif: boolean;
  smsNotif: boolean;
  twoFactor: boolean;
}

const EMPTY_PROFILE: ProfileData = {
  id: "",
  email: "",
  fullName: "",
  phone: "",
  company: "",
  role: "",
  bio: "",
  location: "",
  avatarUrl: "",
  darkMode: false,
  emailNotif: true,
  smsNotif: false,
  twoFactor: true,
};

interface AdminProfileContextType {
  profile: ProfileData;
  isLoading: boolean;
  error: string | null;
  updateProfile: (data: Partial<ProfileData>) => void;
  refreshProfile: () => Promise<void>;
}

const AdminProfileContext = createContext<AdminProfileContextType | undefined>(undefined);

export function AdminProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<ProfileData>(EMPTY_PROFILE);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch("/api/admin/profile", { credentials: "include" });

      if (!res.ok) {
        if (res.status === 401) {
          // Not logged in — let middleware handle redirect
          setIsLoading(false);
          return;
        }
        throw new Error(`Profile fetch failed: ${res.status}`);
      }

      const data = await res.json();
      const p = data.profile;

      // Load UI prefs from localStorage (these are device-local preferences)
      let uiPrefs = {
        darkMode: false,
        emailNotif: true,
        smsNotif: false,
        twoFactor: true,
      };
      try {
        const saved = localStorage.getItem("wecollab_ui_prefs");
        if (saved) uiPrefs = { ...uiPrefs, ...JSON.parse(saved) };
      } catch (_) {}

      setProfile({
        id: p.id,
        email: p.email,
        fullName: p.fullName,
        phone: p.phone,
        company: p.company,
        role: p.role,
        bio: p.bio,
        location: p.location,
        avatarUrl: p.avatarUrl,
        ...uiPrefs,
      });
    } catch (err: any) {
      console.error("[AdminProfileContext] fetchProfile error:", err.message);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  /**
   * Optimistic local update — call after a successful PUT /api/admin/profile.
   * Also persists UI prefs locally.
   */
  const updateProfile = useCallback((data: Partial<ProfileData>) => {
    setProfile((prev) => {
      const next = { ...prev, ...data };

      // Persist UI prefs to localStorage
      const uiPrefs = {
        darkMode: next.darkMode,
        emailNotif: next.emailNotif,
        smsNotif: next.smsNotif,
        twoFactor: next.twoFactor,
      };
      try {
        localStorage.setItem("wecollab_ui_prefs", JSON.stringify(uiPrefs));
      } catch (_) {}

      return next;
    });
  }, []);

  const refreshProfile = useCallback(async () => {
    await fetchProfile();
  }, [fetchProfile]);

  return (
    <AdminProfileContext.Provider value={{ profile, isLoading, error, updateProfile, refreshProfile }}>
      {children}
    </AdminProfileContext.Provider>
  );
}

export function useAdminProfile() {
  const context = useContext(AdminProfileContext);
  if (context === undefined) {
    throw new Error("useAdminProfile must be used within an AdminProfileProvider");
  }
  return context;
}
