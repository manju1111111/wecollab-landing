"use client";

import { useState, useRef, useEffect } from "react";
import { User, Settings, Bell, HelpCircle, LogOut, ChevronDown } from "lucide-react";
import Image from "next/image";
import { ProfileSettingsPanel } from "./profile-settings-panel";
import { useAdminProfile } from "./admin-profile-context";

interface AdminProfileDropdownProps {
  onLogout: () => void;
}

export function AdminProfileDropdown({ onLogout }: AdminProfileDropdownProps) {
  const { profile } = useAdminProfile();
  const [isOpen, setIsOpen] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleOpenPanel = () => {
    setIsOpen(false);
    setIsPanelOpen(true);
  };

  if (!mounted) {
    return (
      <div className="h-10 w-28 rounded-full bg-slate-50 border border-slate-200/60 animate-pulse" />
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className={`flex items-center gap-3 pl-2 pr-1 py-1 rounded-full transition-all border ${
          isOpen ? 'bg-slate-50 border-slate-200 shadow-inner' : 'bg-transparent border-transparent hover:bg-slate-50 hover:border-slate-200'
        }`}
      >
        <div className="h-10 w-10 rounded-full overflow-hidden bg-slate-200 border-2 border-white shadow-sm shrink-0">
          <Image src={profile.profileImage} alt="Profile" width={40} height={40} className="w-full h-full object-cover" />
        </div>
        <div className="text-left hidden sm:block">
          <div className="text-[13px] font-bold text-slate-900 leading-tight">{profile.fullName}</div>
          <div className="text-[11px] font-medium text-slate-500">{profile.role}</div>
        </div>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform hidden sm:block ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 py-2 z-40 transform origin-top-right transition-all">
          <div className="px-4 py-3 border-b border-slate-100 mb-1">
            <p className="text-[14px] font-bold text-slate-900">{profile.fullName}</p>
            <p className="text-[12px] text-slate-500 font-medium">{profile.email}</p>
          </div>
          
          <div className="flex flex-col px-1">
            <button 
              onClick={handleOpenPanel}
              className="flex items-center gap-3 px-3 py-2 text-[13px] font-semibold text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors w-full text-left"
            >
              <User className="h-4 w-4" /> My Profile
            </button>
            <button 
              onClick={handleOpenPanel}
              className="flex items-center gap-3 px-3 py-2 text-[13px] font-semibold text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors w-full text-left"
            >
              <Settings className="h-4 w-4" /> Account Settings
            </button>
            <button 
              className="flex items-center justify-between px-3 py-2 text-[13px] font-semibold text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors w-full text-left"
            >
              <div className="flex items-center gap-3">
                <Bell className="h-4 w-4" /> Notifications
              </div>
              <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">12</span>
            </button>
            <button 
              className="flex items-center gap-3 px-3 py-2 text-[13px] font-semibold text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors w-full text-left"
            >
              <HelpCircle className="h-4 w-4" /> Help Center
            </button>
          </div>
          
          <div className="border-t border-slate-100 mt-1 pt-1 px-1">
            <button 
              onClick={() => {
                setIsOpen(false);
                onLogout();
              }}
              className="flex items-center gap-3 px-3 py-2 text-[13px] font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors w-full text-left"
            >
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </div>
        </div>
      )}

      {/* Slide-over Panel */}
      <ProfileSettingsPanel 
        isOpen={isPanelOpen} 
        onClose={() => setIsPanelOpen(false)} 
        onLogout={onLogout}
      />
    </div>
  );
}
