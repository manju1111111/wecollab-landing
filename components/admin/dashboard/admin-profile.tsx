"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Mail, Phone, MapPin, MoreHorizontal, ShieldCheck } from "lucide-react";
import { useAdminProfile } from "@/components/admin/layout/admin-profile-context";

export function AdminProfile() {
  const { profile } = useAdminProfile();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 flex flex-col h-[320px] animate-pulse bg-slate-50/20" />
    );
  }

  return (
    <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 flex flex-col h-[320px] relative">
      <div className="h-28 bg-gradient-to-r from-[#0b3b84] to-indigo-600 relative shrink-0">
        <button className="absolute top-4 right-4 h-8 w-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>
      
      {/* Absolute Centered Avatar */}
      <div className="absolute top-[72px] left-1/2 -translate-x-1/2 h-20 w-20 rounded-full border-4 border-white shadow-lg overflow-hidden bg-white z-10">
        <Image 
          src={profile.profileImage}
          alt="Profile Photo"
          fill
          className="object-cover"
        />
      </div>
      
      <div className="px-6 pb-6 pt-12 flex flex-col flex-1">
        {/* Centered Profile Info */}
        <div className="flex flex-col items-center text-center mb-4">
          <h2 className="text-lg font-bold text-slate-900 truncate w-full">{profile.fullName}</h2>
          <p className="text-[12px] text-slate-500 mt-0.5 truncate w-full">{profile.email}</p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
              {profile.role}
            </span>
            <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
              <MapPin className="h-3 w-3 shrink-0" /> {profile.timezone}
            </div>
          </div>
        </div>

        {/* Details list */}
        <div className="mt-auto flex flex-col gap-3.5">
          <div className="flex items-center justify-between text-[12px]">
            <span className="text-slate-500 font-medium">Company</span>
            <span className="font-bold text-slate-900 truncate max-w-[120px] text-right">{profile.company}</span>
          </div>
          <div className="flex items-center justify-between text-[12px]">
            <span className="text-slate-500 font-medium">Phone</span>
            <span className="font-bold text-slate-900">{profile.phone}</span>
          </div>
          <div className="flex items-center justify-between text-[12px]">
            <span className="text-slate-500 font-medium">Account Status</span>
            <span className="flex items-center gap-1 font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
              <ShieldCheck className="h-3 w-3" /> Verified
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
