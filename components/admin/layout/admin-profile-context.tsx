"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface ProfileData {
  fullName: string;
  email: string;
  phone: string;
  company: string;
  role: string;
  bio: string;
  timezone: string;
  language: string;
  darkMode: boolean;
  emailNotif: boolean;
  smsNotif: boolean;
  twoFactor: boolean;
  profileImage: string;
}

const defaultProfile: ProfileData = {
  fullName: "Alex Chen",
  email: "alex@wecollab.com",
  phone: "+91 98765 43210",
  company: "WeCollab Tech",
  role: "Super Admin",
  bio: "Product leader and creator economy enthusiast.",
  timezone: "Asia/Kolkata",
  language: "English (US)",
  darkMode: false,
  emailNotif: true,
  smsNotif: false,
  twoFactor: true,
  profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80",
};

interface AdminProfileContextType {
  profile: ProfileData;
  updateProfile: (data: Partial<ProfileData>) => void;
}

const AdminProfileContext = createContext<AdminProfileContextType | undefined>(undefined);

export function AdminProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<ProfileData>(defaultProfile);

  useEffect(() => {
    // Load from local storage on mount
    const saved = localStorage.getItem("wecollab_admin_profile");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setProfile(parsed);
        // Write to cookie to sync with SSR
        document.cookie = `wecollab_admin_profile=${encodeURIComponent(saved)}; path=/; max-age=31536000; SameSite=Lax`;
      } catch (e) {
        console.error("Failed to parse profile data");
      }
    } else {
      // Write defaultProfile to localStorage and cookie if not present
      localStorage.setItem("wecollab_admin_profile", JSON.stringify(defaultProfile));
      document.cookie = `wecollab_admin_profile=${encodeURIComponent(JSON.stringify(defaultProfile))}; path=/; max-age=31536000; SameSite=Lax`;
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "wecollab_admin_profile" && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setProfile(parsed);
          document.cookie = `wecollab_admin_profile=${encodeURIComponent(e.newValue)}; path=/; max-age=31536000; SameSite=Lax`;
        } catch (err) {
          console.error("Failed to parse profile data from storage event", err);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const updateProfile = (data: Partial<ProfileData>) => {
    setProfile(prev => {
      const updated = { ...prev, ...data };
      const serialized = JSON.stringify(updated);
      localStorage.setItem("wecollab_admin_profile", serialized);
      // Write to cookie as well
      document.cookie = `wecollab_admin_profile=${encodeURIComponent(serialized)}; path=/; max-age=31536000; SameSite=Lax`;
      return updated;
    });
  };

  return (
    <AdminProfileContext.Provider value={{ profile, updateProfile }}>
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
