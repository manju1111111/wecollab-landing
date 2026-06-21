"use client";

import { useState, useRef, useEffect } from "react";
import { 
  X, Camera, Save, LogOut, CheckCircle2, 
  Bell, Shield, User, Globe, Smartphone,
  Loader2, AlertCircle
} from "lucide-react";
import Image from "next/image";
import { useAdminProfile } from "./admin-profile-context";

interface ProfileSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export function ProfileSettingsPanel({ isOpen, onClose, onLogout }: ProfileSettingsPanelProps) {
  const { profile, updateProfile, refreshProfile } = useAdminProfile();
  
  const [activeTab, setActiveTab] = useState<"profile" | "account" | "security">("profile");
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("Profile updated successfully!");
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [hasChanges, setHasChanges] = useState(false);
  
  // Form State — mirrors profile fields editable by user
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    company: "",
    bio: "",
    location: "",
    avatarUrl: "",
    // UI prefs
    darkMode: false,
    emailNotif: true,
    smsNotif: false,
    twoFactor: true,
    // timezone/language — client only
    timezone: "Asia/Kolkata",
    language: "English (US)",
  });
  
  // Sync form data from context when panel opens or profile reloads
  useEffect(() => {
    if (!hasChanges || !isOpen) {
      setFormData({
        fullName: profile.fullName,
        phone: profile.phone,
        company: profile.company,
        bio: profile.bio,
        location: profile.location,
        avatarUrl: profile.avatarUrl,
        darkMode: profile.darkMode,
        emailNotif: profile.emailNotif,
        smsNotif: profile.smsNotif,
        twoFactor: profile.twoFactor,
        timezone: "Asia/Kolkata",
        language: "English (US)",
      });
    }
  }, [profile, isOpen]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const showToastMsg = (message: string, type: "success" | "error" = "success") => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3500);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          fullName: formData.fullName,
          phone: formData.phone,
          company: formData.company,
          bio: formData.bio,
          location: formData.location,
          avatarUrl: formData.avatarUrl,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Save failed");
      }

      const { profile: saved } = await res.json();

      // Update global context with saved data from DB
      updateProfile({
        fullName: saved.fullName,
        phone: saved.phone,
        company: saved.company,
        bio: saved.bio,
        location: saved.location,
        avatarUrl: saved.avatarUrl,
        // persist UI prefs
        darkMode: formData.darkMode,
        emailNotif: formData.emailNotif,
        smsNotif: formData.smsNotif,
        twoFactor: formData.twoFactor,
      });

      setHasChanges(false);
      showToastMsg("Profile saved to database ✓", "success");
    } catch (err: any) {
      console.error("[ProfileSettingsPanel] save error:", err.message);
      showToastMsg(err.message || "Failed to save profile", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (hasChanges) {
      if (confirm("You have unsaved changes. Are you sure you want to close?")) {
        onClose();
        setHasChanges(false);
        // Reset form to current profile
        setFormData({
          fullName: profile.fullName,
          phone: profile.phone,
          company: profile.company,
          bio: profile.bio,
          location: profile.location,
          avatarUrl: profile.avatarUrl,
          darkMode: profile.darkMode,
          emailNotif: profile.emailNotif,
          smsNotif: profile.smsNotif,
          twoFactor: profile.twoFactor,
          timezone: "Asia/Kolkata",
          language: "English (US)",
        });
      }
    } else {
      onClose();
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showToastMsg("Image too large. Max size is 5MB.", "error");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        handleInputChange("avatarUrl", base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  // Avatar display: show local preview if base64, otherwise show DB URL
  const avatarDisplaySrc = formData.avatarUrl || "/default-avatar.png";
  const isLocalAvatar = formData.avatarUrl?.startsWith("data:");

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 transition-opacity"
        onClick={handleClose}
      />

      {/* Side Panel */}
      <div className="fixed top-0 right-0 h-full w-full sm:w-[500px] bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-out translate-x-0 border-l border-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 shrink-0 bg-white/80 backdrop-blur-md">
          <h2 className="text-xl font-bold text-slate-900">Settings</h2>
          <button 
            onClick={handleClose}
            className="h-8 w-8 flex items-center justify-center rounded-full bg-slate-50 text-slate-500 hover:bg-slate-100 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Scroll Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-slate-50/50">
          
          {/* Top Profile Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-6 flex flex-col items-center relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-16 bg-gradient-to-r from-blue-50 to-indigo-50" />
            
            <div 
              className="relative h-24 w-24 rounded-full border-4 border-white shadow-md overflow-hidden mb-4 z-10 group cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                accept="image/*" 
                className="hidden" 
              />
              {avatarDisplaySrc && avatarDisplaySrc !== "/default-avatar.png" ? (
                <Image 
                  src={avatarDisplaySrc}
                  alt="Profile" 
                  fill
                  unoptimized={isLocalAvatar}
                  className="object-cover transition-transform group-hover:scale-105 duration-300"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <span className="text-white text-3xl font-bold">
                    {(formData.fullName || profile.email || "?")[0].toUpperCase()}
                  </span>
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]">
                <Camera className="h-6 w-6 text-white mb-1" />
                <span className="text-white text-[10px] font-bold">Upload</span>
              </div>
            </div>
            
            <div className="text-center z-10">
              <h3 className="text-lg font-bold text-slate-900">{formData.fullName || profile.email}</h3>
              <p className="text-[13px] font-medium text-slate-500">{profile.email}</p>
              
              <div className="flex items-center justify-center gap-2 mt-3">
                <span className="bg-blue-50 text-blue-600 text-[11px] font-bold px-2.5 py-1 rounded-md">
                  {profile.role || "Admin"}
                </span>
                <span className="flex items-center gap-1 bg-emerald-50 text-emerald-600 text-[11px] font-bold px-2.5 py-1 rounded-md">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                  Active Now
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex bg-slate-100/50 p-1 rounded-xl mb-6">
            {(["profile", "account", "security"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 text-[13px] font-bold rounded-lg transition-all capitalize ${
                  activeTab === tab 
                    ? "bg-white text-slate-900 shadow-sm" 
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-6">
            
            {activeTab === "profile" && (
              <div className="flex flex-col gap-5">
                <div className="flex items-center gap-2 text-[14px] font-bold text-slate-900 mb-2 border-b border-slate-100 pb-3">
                  <User className="h-4 w-4 text-blue-500" /> Personal Details
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5 col-span-2 sm:col-span-1">
                    <label className="text-[12px] font-semibold text-slate-700">Full Name</label>
                    <input 
                      type="text" 
                      value={formData.fullName}
                      onChange={(e) => handleInputChange("fullName", e.target.value)}
                      placeholder="Your full name"
                      className="h-10 px-3 rounded-lg border border-slate-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-slate-50 focus:bg-white"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 col-span-2 sm:col-span-1">
                    <label className="text-[12px] font-semibold text-slate-700">Phone Number</label>
                    <input 
                      type="text" 
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      placeholder="+91 98765 43210"
                      className="h-10 px-3 rounded-lg border border-slate-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-slate-50 focus:bg-white"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 col-span-2">
                    <label className="text-[12px] font-semibold text-slate-700">Email Address</label>
                    <input 
                      type="email" 
                      value={profile.email}
                      disabled
                      className="h-10 px-3 rounded-lg border border-slate-200 text-[13px] bg-slate-100 text-slate-500 cursor-not-allowed"
                    />
                    <span className="text-[11px] text-slate-400">Email is managed by your authentication provider</span>
                  </div>
                  <div className="flex flex-col gap-1.5 col-span-2 sm:col-span-1">
                    <label className="text-[12px] font-semibold text-slate-700">Company</label>
                    <input 
                      type="text" 
                      value={formData.company}
                      onChange={(e) => handleInputChange("company", e.target.value)}
                      placeholder="WeCollab"
                      className="h-10 px-3 rounded-lg border border-slate-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-slate-50 focus:bg-white"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 col-span-2 sm:col-span-1">
                    <label className="text-[12px] font-semibold text-slate-700">Location</label>
                    <input 
                      type="text" 
                      value={formData.location}
                      onChange={(e) => handleInputChange("location", e.target.value)}
                      placeholder="Mumbai, India"
                      className="h-10 px-3 rounded-lg border border-slate-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-slate-50 focus:bg-white"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 col-span-2">
                    <label className="text-[12px] font-semibold text-slate-700">Role</label>
                    <input 
                      type="text" 
                      value={profile.role || "Admin"}
                      disabled
                      className="h-10 px-3 rounded-lg border border-slate-200 text-[13px] bg-slate-100 text-slate-500 cursor-not-allowed"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 col-span-2">
                    <label className="text-[12px] font-semibold text-slate-700">Bio</label>
                    <textarea 
                      value={formData.bio}
                      onChange={(e) => handleInputChange("bio", e.target.value)}
                      rows={3}
                      placeholder="Tell us a bit about yourself..."
                      className="p-3 rounded-lg border border-slate-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-slate-50 focus:bg-white resize-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "account" && (
              <div className="flex flex-col gap-6">
                <div>
                  <div className="flex items-center gap-2 text-[14px] font-bold text-slate-900 mb-4 border-b border-slate-100 pb-3">
                    <Globe className="h-4 w-4 text-blue-500" /> Preferences
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5 col-span-2 sm:col-span-1">
                      <label className="text-[12px] font-semibold text-slate-700">Timezone</label>
                      <select 
                        value={formData.timezone}
                        onChange={(e) => handleInputChange("timezone", e.target.value)}
                        className="h-10 px-3 rounded-lg border border-slate-200 text-[13px] focus:outline-none bg-slate-50"
                      >
                        <option value="Asia/Kolkata">IST (Asia/Kolkata)</option>
                        <option value="America/New_York">EST (America/New_York)</option>
                        <option value="Europe/London">GMT (Europe/London)</option>
                        <option value="America/Los_Angeles">PST (America/Los_Angeles)</option>
                        <option value="Asia/Dubai">GST (Asia/Dubai)</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5 col-span-2 sm:col-span-1">
                      <label className="text-[12px] font-semibold text-slate-700">Language</label>
                      <select 
                        value={formData.language}
                        onChange={(e) => handleInputChange("language", e.target.value)}
                        className="h-10 px-3 rounded-lg border border-slate-200 text-[13px] focus:outline-none bg-slate-50"
                      >
                        <option value="English (US)">English (US)</option>
                        <option value="English (UK)">English (UK)</option>
                        <option value="Spanish">Spanish</option>
                        <option value="Hindi">Hindi</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-[14px] font-bold text-slate-900 mb-4 border-b border-slate-100 pb-3 mt-2">
                    <Bell className="h-4 w-4 text-blue-500" /> Notifications
                  </div>
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[13px] font-bold text-slate-800">Email Notifications</div>
                        <div className="text-[11px] text-slate-500">Receive daily summaries and alerts</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={formData.emailNotif} onChange={(e) => handleInputChange("emailNotif", e.target.checked)} />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[13px] font-bold text-slate-800">SMS Notifications</div>
                        <div className="text-[11px] text-slate-500">For critical approvals only</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={formData.smsNotif} onChange={(e) => handleInputChange("smsNotif", e.target.checked)} />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "security" && (
              <div className="flex flex-col gap-6">
                <div>
                  <div className="flex items-center gap-2 text-[14px] font-bold text-slate-900 mb-4 border-b border-slate-100 pb-3">
                    <Shield className="h-4 w-4 text-blue-500" /> Two-Factor Authentication
                  </div>
                  <div className="flex items-start justify-between bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                    <div className="pr-4">
                      <div className="text-[13px] font-bold text-slate-800 flex items-center gap-2">
                        Require 2FA <Smartphone className="h-3 w-3 text-slate-500" />
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1 leading-relaxed">Adds an extra layer of security to your account by requiring a code from your authenticator app.</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                      <input type="checkbox" className="sr-only peer" checked={formData.twoFactor} onChange={(e) => handleInputChange("twoFactor", e.target.checked)} />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-[14px] font-bold text-slate-900 mb-4 border-b border-slate-100 pb-3 mt-2">
                    Password Change
                  </div>
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[12px] font-semibold text-slate-700">Current Password</label>
                      <input type="password" placeholder="••••••••" className="h-10 px-3 rounded-lg border border-slate-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-slate-50 focus:bg-white" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[12px] font-semibold text-slate-700">New Password</label>
                      <input type="password" placeholder="••••••••" className="h-10 px-3 rounded-lg border border-slate-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-slate-50 focus:bg-white" />
                    </div>
                  </div>
                </div>
              </div>
            )}
            
          </div>
          
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-100 bg-white shrink-0 flex items-center justify-between">
          <button 
            onClick={onLogout}
            className="flex items-center gap-2 px-4 h-10 rounded-lg text-red-600 text-[13px] font-bold hover:bg-red-50 transition-colors border border-transparent hover:border-red-100"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:block">Logout</span>
          </button>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={handleClose}
              className="px-5 h-10 rounded-lg text-slate-600 text-[13px] font-bold hover:bg-slate-50 transition-colors border border-slate-200 shadow-sm"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              className={`flex items-center justify-center min-w-[120px] px-5 h-10 rounded-lg text-white text-[13px] font-bold transition-all shadow-sm ${
                isSaving ? 'bg-blue-400 cursor-wait' : 
                hasChanges ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200' : 
                'bg-slate-300 cursor-not-allowed text-slate-500'
              }`}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" /> Save Changes
                </>
              )}
            </button>
          </div>
        </div>

      </div>

      {/* Toast Notification */}
      <div className={`fixed bottom-6 right-6 px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 transition-all duration-300 z-[60] ${
        toastType === "success" ? "bg-slate-900 text-white" : "bg-red-600 text-white"
      } ${
        showToast ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'
      }`}>
        {toastType === "success" 
          ? <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          : <AlertCircle className="h-5 w-5 text-red-200 shrink-0" />
        }
        <span className="text-[13px] font-bold">{toastMessage}</span>
      </div>
    </>
  );
}
