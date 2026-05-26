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
        setProfile(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse profile data");
      }
    }
  }, []);

  const updateProfile = (data: Partial<ProfileData>) => {
    setProfile(prev => {
      const updated = { ...prev, ...data };
      localStorage.setItem("wecollab_admin_profile", JSON.stringify(updated));
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
