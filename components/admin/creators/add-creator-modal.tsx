"use client";

import { X, Sparkles, Upload, Search, Check, AlertCircle, RefreshCw, HelpCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CREATOR_CATEGORIES } from "@/data/creator-categories";
import { CreatorAvatar } from "./creator-data-grid";

export function AddCreatorModal({ 
  isOpen, 
  onClose,
  onSubmit,
  creator = null
}: { 
  isOpen: boolean; 
  onClose: () => void;
  onSubmit: (data: any) => void;
  creator?: any | null;
}) {
  // Wizard Steps: "input" | "analyzing" | "review"
  const [step, setStep] = useState<"input" | "analyzing" | "review">("input");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [isManualMode, setIsManualMode] = useState(false);

  // Input state
  const [usernameInput, setUsernameInput] = useState("");
  
  // Progress Timeline state
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});
  const [activeTimelineStep, setActiveTimelineStep] = useState<string>("profile_fetched");
  const [enrichRunId, setEnrichRunId] = useState<string | null>(null);

  // Proposed Creator details (editable in review step)
  const [fullName, setFullName] = useState("");
  const [bioText, setBioText] = useState("");
  const [followersCount, setFollowersCount] = useState("");
  const [avgViews, setAvgViews] = useState("");
  const [engagementRate, setEngagementRate] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [languageInput, setLanguageInput] = useState("");
  const [genderInput, setGenderInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [pricingInput, setPricingInput] = useState("");
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState("");
  const [profileImageCdnUrl, setProfileImageCdnUrl] = useState("");
  const [creatorScore, setCreatorScore] = useState<number>(5.0);

  // AI-Proposed Filter assignments
  const [aiFilters, setAiFilters] = useState<{
    filter_id: string;
    name: string;
    group: string;
    confidence: number;
    reasoning: string;
  }[]>([]);

  // Manual tag selection states
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [activeGroup, setActiveGroup] = useState<string>("Video Format");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showOverrideDetails, setShowOverrideDetails] = useState(false);

  // Controlled checkboxes
  const [hasManagerInput, setHasManagerInput] = useState(false);
  const [verifiedInput, setVerifiedInput] = useState(false);
  const [brandSafeInput, setBrandSafeInput] = useState(true);

  // Employee assignment
  const [assignedEmployee, setAssignedEmployee] = useState<string>("");
  const [employeesList, setEmployeesList] = useState<{id: string; full_name: string; role: string; assigned_count: number; status: string}[]>([]);

  // Fetch employees for assignment
  useEffect(() => {
    if (isOpen) {
      fetch("/api/admin/employees")
        .then(r => r.json())
        .then(d => setEmployeesList(d.employees || []))
        .catch(() => {});
    }
  }, [isOpen]);

  // Sync state for Edit Mode vs Add Mode
  useEffect(() => {
    if (creator) {
      setStep("review");
      setIsManualMode(false);
      setShowOverrideDetails(true);
      setFullName(creator.name || "");
      setUsernameInput(creator.username || "");
      setBioText(creator.bio || "");
      setFollowersCount(creator.followers ? String(creator.followers) : "");
      setAvgViews(creator.avg_reel_views ? String(creator.avg_reel_views) : "");
      setEngagementRate(creator.engagement_rate ? String(creator.engagement_rate) : "");
      setLocationInput(creator.location || "");
      setLanguageInput(creator.language || "");
      setGenderInput(creator.gender || "");
      setEmailInput(creator.email || "");
      setPricingInput(creator.collaboration_pricing ? String(creator.collaboration_pricing) : "");
      setAvatarPreviewUrl(creator.profile_image || "");
      setProfileImageCdnUrl(creator.profile_image || "");
      setSelectedTags(creator.tags || []);
      setSelectedCategory(creator.category || "");
      setHasManagerInput(creator.has_manager || false);
      setVerifiedInput(creator.verified || false);
      setBrandSafeInput(creator.brand_safe !== false);
      setAssignedEmployee(creator.assigned_employee || "");
      setCreatorScore(creator.creator_score ? parseFloat(creator.creator_score) : 5.0);
      if (creator.category) {
        setActiveGroup(creator.category);
      }
    } else {
      setStep("input");
      setIsManualMode(false);
      setShowOverrideDetails(false);
      setUsernameInput("");
      setFullName("");
      setBioText("");
      setFollowersCount("");
      setAvgViews("");
      setEngagementRate("");
      setLocationInput("");
      setLanguageInput("");
      setGenderInput("");
      setEmailInput("");
      setPricingInput("");
      setAvatarPreviewUrl("");
      setProfileImageCdnUrl("");
      setSelectedTags([]);
      setSelectedCategory("");
      setHasManagerInput(false);
      setVerifiedInput(false);
      setBrandSafeInput(true);
      setAssignedEmployee("");
      setCreatorScore(5.0);
      setAiFilters([]);
      setCompletedSteps({});
      setActiveTimelineStep("profile_fetched");
      setActiveGroup("Video Format");
    }
    setErrorMessage("");
    setStatusMessage("");
  }, [creator, isOpen]);

  if (!isOpen) return null;

  // Clean Instagram URL to Username
  const cleanInstagramInput = (input: string): string => {
    let cleanVal = input.trim();
    if (cleanVal.startsWith("http://") || cleanVal.startsWith("https://")) {
      try {
        const url = new URL(cleanVal);
        const segments = url.pathname.split("/").filter(Boolean);
        if (segments.length > 0) {
          cleanVal = segments[0];
        }
      } catch (e) {
        const parts = cleanVal.split("instagram.com/");
        if (parts.length > 1) {
          cleanVal = parts[1].split("/")[0].split("?")[0];
        }
      }
    }
    return cleanVal.replace("@", "").trim();
  };

  // Launch AI Pipeline
  const handleAnalyzeCreator = async () => {
    const cleanUsername = cleanInstagramInput(usernameInput);
    if (!cleanUsername) {
      alert("Please enter an Instagram username or profile URL.");
      return;
    }

    setStep("analyzing");
    setErrorMessage("");
    setCompletedSteps({});
    setActiveTimelineStep("profile_fetched");
    setStatusMessage("Connecting to Instagram sync engine...");

    try {
      const res = await fetch("/api/instagram/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: cleanUsername }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to fetch creator data from the Instagram sync engine.");
      }

      const data = await res.json();
      if (!data?.profile) {
        throw new Error("Instagram sync engine returned no profile data.");
      }

      setCompletedSteps({
        profile_fetched: true,
        content_analyzed: true,
        categories_assigned: true,
        filters_assigned: true,
        brand_safety_checked: true,
        score_generated: true,
      });

      setFullName(data.profile.full_name || "");
      setBioText(data.profile.biography || "");
      setFollowersCount(data.profile.followers ? String(data.profile.followers) : "");
      setAvgViews(data.metrics?.avg_reel_views ? String(data.metrics.avg_reel_views) : "");
      setEngagementRate(data.metrics?.engagement_rate ? String(data.metrics.engagement_rate) : "");
      setLocationInput(data.profile.location || "");
      setLanguageInput(data.profile.language || "English");
      setGenderInput(data.profile.gender || "");
      setEmailInput(data.profile.email || "");
      setAvatarPreviewUrl(data.profile.profile_pic_url || "");
      setProfileImageCdnUrl(data.profile.profile_pic_url || "");
      setCreatorScore(data.metrics?.creator_quality_score ? parseFloat(String(data.metrics.creator_quality_score)) : 5.0);
      setBrandSafeInput(data.profile.brand_safe !== false);
      setSelectedTags(data.profile.tags || []);
      setSelectedCategory(data.profile.category || "General");
      if (data.profile.category) {
        setActiveGroup(data.profile.category);
      }

      setStatusMessage("Instagram sync complete!");
      setStep("review");
    } catch (e: any) {
      setErrorMessage(e.message || "An unexpected error occurred.");
      setStep("input");
    }
  };

  const handleToggleTag = (tag: string, parentGroupName: string) => {
    setSelectedTags(prev => {
      const nextTags = prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag];
      if (nextTags.length > 0 && !selectedCategory) {
        setSelectedCategory(parentGroupName);
      }
      return nextTags;
    });
  };

  const handleRemoveFilter = (filterId: string) => {
    const filterObj = aiFilters.find(f => f.filter_id === filterId);
    if (!filterObj) return;

    setAiFilters(prev => prev.filter(f => f.filter_id !== filterId));
    setSelectedTags(prev => prev.filter(t => t !== filterObj.name));
  };

  const activeGroupSubcategories = CREATOR_CATEGORIES.find(g => g.groupName === activeGroup)?.subCategories || [];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const cleanUsername = cleanInstagramInput(usernameInput);
    if (!cleanUsername) {
      alert("Instagram username is required.");
      return;
    }
    if (!fullName.trim()) {
      alert("Full Name is required.");
      return;
    }

    setIsSubmitting(true);

    const submitData = {
      name: fullName,
      username: cleanUsername,
      bio: bioText,
      profile_image: profileImageCdnUrl || avatarPreviewUrl,
      followers_count: followersCount,
      avg_views: avgViews,
      engagement_rate: engagementRate,
      location: locationInput,
      language: languageInput,
      gender: genderInput,
      email: emailInput,
      collaboration_pricing: pricingInput,
      has_manager: hasManagerInput ? "true" : "false",
      verified: verifiedInput ? "true" : "false",
      brand_safe: brandSafeInput ? "true" : "false",
      tags: selectedTags,
      category: selectedCategory || "General",
      assigned_employee: assignedEmployee || null,
      creator_score: creatorScore,
    };

    try {
      await onSubmit(submitData);
      onClose();
    } catch (err) {
      alert("Failed to save creator profile.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const timelineSteps = [
    { key: "profile_fetched", label: "Profile Fetched" },
    { key: "content_analyzed", label: "Content Analyzed" },
    { key: "categories_assigned", label: "Categories Assigned" },
    { key: "filters_assigned", label: "Filters Assigned" },
    { key: "brand_safety_checked", label: "Brand Safety Checked" },
    { key: "score_generated", label: "Creator Score Generated" }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className={`relative bg-white rounded-2xl shadow-2xl w-full ${isManualMode ? 'max-w-3xl' : 'max-w-2xl'} max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200`}>
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="text-[18px] font-bold text-slate-900">
              {creator 
                ? "Edit Creator Profile" 
                : isManualMode 
                  ? "Add Creator Manually" 
                  : step === "review" 
                    ? "Review AI Creator Analysis" 
                    : "Add Creator (AI-First)"}
            </h2>
            <p className="text-[13px] text-slate-500 font-medium mt-0.5">
              {creator 
                ? "Update creator details." 
                : isManualMode 
                  ? "Enter creator details manually." 
                  : step === "review" 
                    ? "Confirm classifications and make manual updates." 
                    : "AI analyzes profile details and sets filters automatically."}
            </p>
          </div>
          <button type="button" onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body wrapper */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          
          {/* Error display */}
          {errorMessage && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-[13px] font-semibold flex items-start gap-2.5 animate-in slide-in-from-top-2 duration-200">
              <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />
              <div>
                <p className="font-bold text-rose-800">Pipeline Execution Error</p>
                <p className="mt-0.5 text-rose-600/90">{errorMessage}</p>
              </div>
            </div>
          )}

          <AnimatePresence mode="wait">
            
            {/* STEP 1 & 2: Input Screen */}
            {step === "input" && (
              <motion.div 
                key="input-step"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6 py-8 px-4"
              >
                <div className="text-center max-w-md mx-auto space-y-2 mb-6">
                  <div className="h-12 w-12 rounded-full bg-indigo-50 flex items-center justify-center mx-auto text-indigo-600">
                    <Sparkles className="h-6 w-6 animate-pulse" />
                  </div>
                  <h3 className="text-[16px] font-bold text-slate-900">Enter Instagram Account</h3>
                  <p className="text-[13px] text-slate-500">Provide the creator's username or full Instagram URL. WeCollab AI will extract profiles, captions, brand affinities, and score details automatically.</p>
                </div>

                <div className="max-w-md mx-auto space-y-4">
                  <div>
                    <label className="text-[12px] font-bold text-slate-700 mb-1.5 block">Instagram Username or URL</label>
                    <input 
                      type="text" 
                      value={usernameInput}
                      onChange={(e) => setUsernameInput(e.target.value)}
                      placeholder="e.g. @username or https://instagram.com/username"
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-[14px] outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
                      autoFocus
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAnalyzeCreator}
                    disabled={!usernameInput.trim()}
                    className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-750 disabled:opacity-50 text-white rounded-xl text-[14px] font-bold tracking-wide transition-all shadow-md shadow-indigo-100 flex items-center justify-center gap-2"
                  >
                    <Sparkles className="h-4 w-4 fill-indigo-200" />
                    <span>Fetch & Analyze Creator</span>
                  </button>

                  <div className="flex items-center justify-center pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsManualMode(true);
                        setStep("review");
                        setShowOverrideDetails(true);
                      }}
                      className="text-[13px] font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
                    >
                      Or, add creator details manually
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 3: Progress Timeline */}
            {step === "analyzing" && (
              <motion.div 
                key="analyzing-step"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="py-6 px-4 space-y-8 max-w-md mx-auto"
              >
                <div className="text-center space-y-2">
                  <RefreshCw className="h-8 w-8 text-indigo-600 animate-spin mx-auto" />
                  <h3 className="text-[15px] font-bold text-slate-900">Analyzing Profile Data</h3>
                  <p className="text-[12px] text-slate-400">Our agents are analyzing recent media nodes and text signals...</p>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 space-y-4 shadow-sm">
                  {timelineSteps.map((s) => {
                    const isCompleted = completedSteps[s.key];
                    const isActive = activeTimelineStep === s.key;
                    
                    return (
                      <div key={s.key} className="flex items-center justify-between text-[13px] font-semibold">
                        <span className={`transition-colors ${isCompleted ? 'text-slate-900 font-bold' : isActive ? 'text-indigo-600 font-bold' : 'text-slate-400'}`}>
                          {s.label}
                        </span>
                        <div className="shrink-0 flex items-center justify-center h-5 w-5">
                          {isCompleted ? (
                            <span className="h-5 w-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-extrabold">✓</span>
                          ) : isActive ? (
                            <span className="h-3 w-3 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent inline-block"></span>
                          ) : (
                            <span className="h-2 w-2 rounded-full bg-slate-200"></span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* STEP 4 & 5: AI Review Screen or Manual Add Form */}
            {step === "review" && (
              isManualMode ? (
                <div className="space-y-8 animate-in fade-in duration-200">
                  {/* Basic Info and Avatar */}
                  <div className="flex gap-6">
                    {/* Avatar Upload (Mock/Preview) */}
                    <div className="w-24 shrink-0 flex flex-col items-center gap-2">
                      {avatarPreviewUrl ? (
                        <div className="relative h-24 w-24 rounded-full overflow-hidden border-2 border-indigo-500">
                          <img src={avatarPreviewUrl} alt="Avatar" className="h-full w-full object-cover" />
                          <button
                            type="button"
                            onClick={() => {
                              setAvatarPreviewUrl("");
                              setProfileImageCdnUrl("");
                            }}
                            className="absolute inset-0 bg-black/40 flex items-center justify-center text-white opacity-0 hover:opacity-100 transition-opacity text-[11px] font-bold"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <div 
                          onClick={() => {
                            const url = prompt("Enter profile image URL:");
                            if (url) {
                              setAvatarPreviewUrl(url);
                              setProfileImageCdnUrl(url);
                            }
                          }}
                          className="h-24 w-24 rounded-full border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-slate-400 hover:border-indigo-400 hover:bg-indigo-50 transition-colors cursor-pointer group"
                        >
                          <Upload className="h-5 w-5 group-hover:text-indigo-500 mb-1" />
                          <span className="text-[10px] font-bold uppercase tracking-wider group-hover:text-indigo-600">Upload URL</span>
                        </div>
                      )}
                    </div>

                    {/* Basic Info */}
                    <div className="flex-1 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[12px] font-bold text-slate-700 mb-1.5 block">Full Name *</label>
                          <input 
                            required 
                            type="text" 
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-[14px] outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-medium" 
                            placeholder="e.g. Jane Doe" 
                          />
                        </div>
                        <div>
                          <label className="text-[12px] font-bold text-slate-700 mb-1.5 block">Username *</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">@</span>
                            <input 
                              required 
                              type="text" 
                              value={usernameInput}
                              onChange={(e) => setUsernameInput(e.target.value)}
                              className="w-full pl-7 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-[14px] outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-medium" 
                              placeholder="janedoe" 
                            />
                          </div>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-[12px] font-bold text-slate-700 block">Bio / Description</label>
                          <button 
                            type="button" 
                            onClick={async () => {
                              const cleanUsername = cleanInstagramInput(usernameInput);
                              if (!cleanUsername) {
                                alert("Please enter an Instagram username or profile URL first.");
                                return;
                              }
                              setIsManualMode(false);
                              handleAnalyzeCreator();
                            }}
                            className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 bg-indigo-50 px-2 py-0.5 rounded-full"
                          >
                            <Sparkles className="h-3 w-3" /> Auto-categorize
                          </button>
                        </div>
                        <textarea 
                          value={bioText}
                          onChange={(e) => setBioText(e.target.value)}
                          rows={3} 
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-[14px] outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none font-medium" 
                          placeholder="Paste their Instagram bio here..." 
                        />
                      </div>
                    </div>
                  </div>

                  {/* Metrics & Location */}
                  <div className="grid grid-cols-3 gap-6">
                    <div className="col-span-3 pb-2 border-b border-slate-100">
                      <h3 className="text-[14px] font-bold text-slate-900">Metrics & Location</h3>
                    </div>
                    
                    <div>
                      <label className="text-[12px] font-bold text-slate-700 mb-1.5 block">Followers</label>
                      <input 
                        type="number" 
                        value={followersCount}
                        onChange={(e) => setFollowersCount(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-[14px] outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-medium" 
                        placeholder="e.g. 150000" 
                      />
                    </div>
                    <div>
                      <label className="text-[12px] font-bold text-slate-700 mb-1.5 block">Avg Views</label>
                      <input 
                        type="number" 
                        value={avgViews}
                        onChange={(e) => setAvgViews(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-[14px] outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-medium" 
                        placeholder="e.g. 45000" 
                      />
                    </div>
                    <div>
                      <label className="text-[12px] font-bold text-slate-700 mb-1.5 block">Engagement Rate (%)</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        value={engagementRate}
                        onChange={(e) => setEngagementRate(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-[14px] outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-medium" 
                        placeholder="e.g. 3.5" 
                      />
                    </div>

                    <div>
                      <label className="text-[12px] font-bold text-slate-700 mb-1.5 block">Location</label>
                      <input 
                        type="text" 
                        value={locationInput}
                        onChange={(e) => setLocationInput(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-[14px] outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-medium" 
                        placeholder="City, Country" 
                      />
                    </div>
                    <div>
                      <label className="text-[12px] font-bold text-slate-700 mb-1.5 block">Language</label>
                      <input 
                        type="text" 
                        value={languageInput}
                        onChange={(e) => setLanguageInput(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-[14px] outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-medium" 
                        placeholder="e.g. English" 
                      />
                    </div>
                    <div>
                      <label className="text-[12px] font-bold text-slate-700 mb-1.5 block">Gender</label>
                      <select 
                        value={genderInput}
                        onChange={(e) => setGenderInput(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-[14px] outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-medium"
                      >
                        <option value="">Select...</option>
                        <option value="Female">Female</option>
                        <option value="Male">Male</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  {/* Taxonomy Filters Selection */}
                  <div className="space-y-4">
                    <div className="pb-2 border-b border-slate-100 flex items-center justify-between">
                      <h3 className="text-[14px] font-bold text-slate-900">Taxonomy Filters</h3>
                      <select 
                        value={selectedCategory} 
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="text-[12px] bg-slate-50 border border-slate-200 rounded px-2 py-1 font-bold outline-none"
                      >
                        <option value="">Set primary category...</option>
                        {CREATOR_CATEGORIES.map(c => (
                          <option key={c.groupName} value={c.groupName}>{c.groupName}</option>
                        ))}
                      </select>
                    </div>

                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[13px] outline-none focus:border-indigo-500 focus:bg-white transition-all"
                        placeholder="Type keyword to filter master subcategories..."
                      />
                    </div>

                    <div className="border border-slate-100 rounded-xl overflow-hidden flex h-[180px] bg-slate-50/20">
                      <div className="w-1/3 border-r border-slate-200 overflow-y-auto bg-slate-50/50 p-2 space-y-0.5 scrollbar-thin">
                        {CREATOR_CATEGORIES.map(group => (
                          <button
                            type="button"
                            key={group.groupName}
                            onClick={() => setActiveGroup(group.groupName)}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-[11.5px] font-bold transition-all ${
                              activeGroup === group.groupName 
                                ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200/50' 
                                : 'text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            <span className="truncate">{group.groupName}</span>
                          </button>
                        ))}
                      </div>

                      <div className="flex-1 overflow-y-auto p-3 scrollbar-thin bg-white">
                        <div className="flex flex-wrap gap-1.5">
                          {activeGroupSubcategories.map(sub => {
                            const isSelected = selectedTags.includes(sub);
                            return (
                              <button
                                type="button"
                                key={sub}
                                onClick={() => handleToggleTag(sub, activeGroup)}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11.5px] font-bold border transition-all ${
                                  isSelected 
                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' 
                                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                                }`}
                              >
                                {isSelected && <Check className="h-3 w-3" />}
                                {sub}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {selectedTags.length > 0 && (
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Selected tags</label>
                        <div className="flex flex-wrap gap-1.5 p-3 bg-slate-50 border border-slate-200/60 rounded-xl max-h-[85px] overflow-y-auto custom-scrollbar">
                          {selectedTags.map(tag => (
                            <span 
                              key={tag} 
                              className="inline-flex items-center gap-1 bg-white border border-slate-200 text-slate-700 text-[11.5px] font-bold px-2 py-0.5 rounded-lg shadow-sm"
                            >
                              {tag}
                              <button 
                                type="button" 
                                onClick={() => {
                                  setSelectedTags(prev => prev.filter(t => t !== tag));
                                }} 
                                className="text-slate-400 hover:text-red-500 ml-0.5"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Business & Contact */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="col-span-2 pb-2 border-b border-slate-100">
                      <h3 className="text-[14px] font-bold text-slate-900">Business & Contact</h3>
                    </div>
                    
                    <div>
                      <label className="text-[12px] font-bold text-slate-700 mb-1.5 block">Email</label>
                      <input 
                        type="email" 
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-[14px] outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-medium" 
                        placeholder="collab@creator.com" 
                      />
                    </div>
                    <div>
                      <label className="text-[12px] font-bold text-slate-700 mb-1.5 block">Pricing / Post ($)</label>
                      <input 
                        type="number" 
                        value={pricingInput}
                        onChange={(e) => setPricingInput(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-[14px] outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-medium" 
                        placeholder="e.g. 1500" 
                      />
                    </div>

                    <div className="col-span-2 flex items-center gap-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={hasManagerInput}
                          onChange={(e) => setHasManagerInput(e.target.checked)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 h-4 w-4" 
                        />
                        <span className="text-[13px] font-semibold text-slate-700">Has Manager</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={verifiedInput}
                          onChange={(e) => setVerifiedInput(e.target.checked)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 h-4 w-4" 
                        />
                        <span className="text-[13px] font-semibold text-slate-700">Verified</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={brandSafeInput}
                          onChange={(e) => setBrandSafeInput(e.target.checked)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 h-4 w-4" 
                        />
                        <span className="text-[13px] font-semibold text-slate-700">Brand Safe</span>
                      </label>
                    </div>
                  </div>

                  {/* Assign to Employee */}
                  <div className="pt-2">
                    <label className="text-[13px] font-bold text-slate-700 mb-1.5 block">Assign to Employee</label>
                    <p className="text-[11px] text-slate-400 mb-2">This creator will appear in the selected employee's workspace.</p>
                    <select
                      value={assignedEmployee}
                      onChange={e => setAssignedEmployee(e.target.value)}
                      className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none font-medium"
                    >
                      <option value="">— Unassigned —</option>
                      {employeesList.filter(e => e.status === 'active' || e.status === 'invited').map(emp => (
                        <option key={emp.id} value={emp.id}>
                          {emp.full_name} ({emp.role})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <motion.div 
                  key="review-step"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-6"
                >
                  {/* Profile Card Summary */}
                  <div className="flex gap-5 p-5 bg-slate-50 border border-slate-100 rounded-2xl shadow-sm items-start">
                    <div className="relative h-20 w-20 rounded-full overflow-hidden border-2 border-indigo-500 shrink-0">
                      <CreatorAvatar src={avatarPreviewUrl} name={fullName} className="h-20 w-20" />
                    </div>
                    
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-[17px] font-extrabold text-slate-900 truncate">{fullName || `@${usernameInput}`}</h3>
                        <div className="flex items-center gap-1.5 shrink-0 bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold">
                          <Sparkles className="h-3.5 w-3.5 fill-indigo-200" />
                          <span>Score: {creatorScore.toFixed(1)}/10</span>
                        </div>
                      </div>
                      <p className="text-[12.5px] font-semibold text-indigo-600">@{usernameInput}</p>
                      {bioText && <p className="text-[12px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">{bioText}</p>}
                    </div>
                  </div>

                  {/* Primary proposal fields summary */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Followers</p>
                      <p className="text-[14px] font-black text-slate-900 mt-0.5">
                        {followersCount ? parseInt(followersCount).toLocaleString() : "—"}
                      </p>
                    </div>
                    <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Engagement</p>
                      <p className="text-[14px] font-black text-slate-900 mt-0.5">{engagementRate ? `${engagementRate}%` : "—"}</p>
                    </div>
                    <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Primary Category</p>
                      <p className="text-[14px] font-black text-slate-900 mt-0.5 truncate">{selectedCategory || "General"}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-[13px] font-semibold bg-white p-4 rounded-xl border border-slate-100">
                    <div className="flex justify-between border-b border-slate-50 pb-2">
                      <span className="text-slate-400">{(isManualMode || creator) ? "Gender" : "Proposed Gender"}:</span>
                      <span className="text-slate-800">{genderInput || "Unspecified"}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-50 pb-2">
                      <span className="text-slate-400">{(isManualMode || creator) ? "Language" : "Proposed Language"}:</span>
                      <span className="text-slate-800">{languageInput || "English"}</span>
                    </div>
                    <div className="flex justify-between pt-1">
                      <span className="text-slate-400">{(isManualMode || creator) ? "Location" : "Proposed Location"}:</span>
                      <span className="text-slate-800 truncate max-w-[160px]">{locationInput || "Unspecified"}</span>
                    </div>
                    <div className="flex justify-between pt-1">
                      <span className="text-slate-400">Brand Safety:</span>
                      <span className={`font-bold ${brandSafeInput ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {brandSafeInput ? "Brand Safe" : "Risky"}
                      </span>
                    </div>
                  </div>

                  {/* AI Mapped Filters with Reasoning Tooltips */}
                  {aiFilters.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-[11.5px] font-bold text-slate-400 uppercase tracking-wider block">AI Assigned Filters ({aiFilters.length})</label>
                      <div className="flex flex-wrap gap-2 p-3 bg-slate-50 border border-slate-200/60 rounded-xl max-h-[140px] overflow-y-auto custom-scrollbar">
                        {aiFilters.map(f => (
                          <div 
                            key={f.filter_id} 
                            className="relative group cursor-help inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 text-slate-700 text-[12px] font-semibold rounded-lg shadow-sm hover:border-indigo-300 hover:bg-indigo-50/20 transition-all"
                          >
                            <span className="text-slate-800 font-bold">{f.name}</span>
                            <span className="text-[10px] text-indigo-500 font-extrabold bg-indigo-50 px-1 py-0.5 rounded">
                              {Math.round(f.confidence * 100)}%
                            </span>
                            <button 
                              type="button" 
                              onClick={() => handleRemoveFilter(f.filter_id)} 
                              className="text-slate-300 hover:text-red-500 ml-0.5 transition-colors font-bold text-[11px]"
                            >
                              ×
                            </button>
                            
                            {/* Reasoning Hover Tooltip */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-slate-900 text-white text-[11px] rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 leading-relaxed font-normal">
                              <p className="font-extrabold text-indigo-300 mb-1">AI Reasoning ({Math.round(f.confidence * 100)}% confidence):</p>
                              {f.reasoning}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Manual Override Fields (collapsible) */}
                  <div className="border border-slate-100 rounded-2xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setShowOverrideDetails(!showOverrideDetails)}
                      className="w-full flex items-center justify-between px-5 py-3 bg-slate-50 hover:bg-slate-100 transition-colors text-[13px] font-bold text-slate-700"
                    >
                      <span>Manual Profile Overrides & Categorization</span>
                      {showOverrideDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>

                    {showOverrideDetails && (
                      <div className="p-5 border-t border-slate-100 space-y-4 bg-white animate-in slide-in-from-top-1 duration-200">
                        
                        {/* Section 1: Basic Information */}
                        <div className="pb-2 border-b border-slate-100">
                          <h4 className="text-[12px] font-bold text-slate-800 uppercase tracking-wider">Basic Information</h4>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-[11.5px] font-bold text-slate-700 mb-1.5 block">Instagram Username *</label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-[13px]">@</span>
                              <input 
                                type="text" 
                                value={usernameInput}
                                onChange={(e) => setUsernameInput(e.target.value)}
                                placeholder="janedoe"
                                required
                                className="w-full pl-7 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-[13px] outline-none focus:border-indigo-500 font-medium" 
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-[11.5px] font-bold text-slate-700 mb-1.5 block">Full Name *</label>
                            <input 
                              type="text" 
                              value={fullName}
                              onChange={(e) => setFullName(e.target.value)}
                              placeholder="Jane Doe"
                              required
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-[13px] outline-none focus:border-indigo-500 font-medium" 
                            />
                          </div>
                          
                          <div className="col-span-2">
                            <label className="text-[11.5px] font-bold text-slate-700 mb-1.5 block">Bio / Description</label>
                            <textarea 
                              value={bioText}
                              onChange={(e) => setBioText(e.target.value)}
                              placeholder="Instagram Bio..."
                              rows={3}
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-[13px] outline-none focus:border-indigo-500 resize-none font-medium" 
                            />
                          </div>

                          <div className="col-span-2">
                            <label className="text-[11.5px] font-bold text-slate-700 mb-1.5 block">Profile Image URL</label>
                            <input 
                              type="text" 
                              value={profileImageCdnUrl || avatarPreviewUrl}
                              onChange={(e) => {
                                setAvatarPreviewUrl(e.target.value);
                                setProfileImageCdnUrl(e.target.value);
                              }}
                              placeholder="https://example.com/image.jpg"
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-[13px] outline-none focus:border-indigo-500 font-medium" 
                            />
                          </div>
                        </div>

                        {/* Section 2: Metrics & Business */}
                        <div className="pb-2 border-b border-slate-100 pt-2">
                          <h4 className="text-[12px] font-bold text-slate-800 uppercase tracking-wider">Metrics & Business</h4>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="text-[11.5px] font-bold text-slate-700 mb-1.5 block">Followers</label>
                            <input 
                              type="number" 
                              value={followersCount}
                              onChange={(e) => setFollowersCount(e.target.value)}
                              placeholder="e.g. 150000"
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-[13px] outline-none focus:border-indigo-500 font-medium" 
                            />
                          </div>
                          <div>
                            <label className="text-[11.5px] font-bold text-slate-700 mb-1.5 block">Avg Views</label>
                            <input 
                              type="number" 
                              value={avgViews}
                              onChange={(e) => setAvgViews(e.target.value)}
                              placeholder="e.g. 45000"
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-[13px] outline-none focus:border-indigo-500 font-medium" 
                            />
                          </div>
                          <div>
                            <label className="text-[11.5px] font-bold text-slate-700 mb-1.5 block">Engagement Rate (%)</label>
                            <input 
                              type="number" 
                              step="0.01"
                              value={engagementRate}
                              onChange={(e) => setEngagementRate(e.target.value)}
                              placeholder="e.g. 3.5"
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-[13px] outline-none focus:border-indigo-500 font-medium" 
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-[11.5px] font-bold text-slate-700 mb-1.5 block">Email</label>
                            <input 
                              type="email" 
                              value={emailInput}
                              onChange={(e) => setEmailInput(e.target.value)}
                              placeholder="collab@creator.com"
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-[13px] outline-none focus:border-indigo-500 font-medium" 
                            />
                          </div>
                          <div>
                            <label className="text-[11.5px] font-bold text-slate-700 mb-1.5 block">Pricing ($ / post)</label>
                            <input 
                              type="number" 
                              value={pricingInput}
                              onChange={(e) => setPricingInput(e.target.value)}
                              placeholder="e.g. 1500"
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-[13px] outline-none focus:border-indigo-500 font-medium" 
                            />
                          </div>
                        </div>

                        {/* Section 3: Attributes & Assignment */}
                        <div className="pb-2 border-b border-slate-100 pt-2">
                          <h4 className="text-[12px] font-bold text-slate-800 uppercase tracking-wider">Attributes & Assignment</h4>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="text-[11.5px] font-bold text-slate-700 mb-1.5 block">Location</label>
                            <input 
                              type="text" 
                              value={locationInput}
                              onChange={(e) => setLocationInput(e.target.value)}
                              placeholder="City, Country"
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-[13px] outline-none focus:border-indigo-500 font-medium" 
                            />
                          </div>
                          <div>
                            <label className="text-[11.5px] font-bold text-slate-700 mb-1.5 block">Language</label>
                            <input 
                              type="text" 
                              value={languageInput}
                              onChange={(e) => setLanguageInput(e.target.value)}
                              placeholder="e.g. English"
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-[13px] outline-none focus:border-indigo-500 font-medium" 
                            />
                          </div>
                          <div>
                            <label className="text-[11.5px] font-bold text-slate-700 mb-1.5 block">Gender</label>
                            <select 
                              value={genderInput}
                              onChange={(e) => setGenderInput(e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-[13px] outline-none focus:border-indigo-500 font-medium"
                            >
                              <option value="">Select...</option>
                              <option value="Female">Female</option>
                              <option value="Male">Male</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-[11.5px] font-bold text-slate-700 mb-1.5 block">Assign Employee</label>
                            <select
                              value={assignedEmployee}
                              onChange={e => setAssignedEmployee(e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-[13px] outline-none focus:border-indigo-500 font-medium"
                            >
                              <option value="">— Unassigned —</option>
                              {employeesList.filter(e => e.status === 'active' || e.status === 'invited').map(emp => (
                                <option key={emp.id} value={emp.id}>
                                  {emp.full_name} ({emp.role})
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-[11.5px] font-bold text-slate-700 mb-1.5 block">Creator Score</label>
                            <input 
                              type="number"
                              step="0.1"
                              min="0"
                              max="10"
                              value={creatorScore}
                              onChange={(e) => setCreatorScore(parseFloat(e.target.value) || 5.0)}
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-[13px] outline-none focus:border-indigo-500 font-medium" 
                            />
                          </div>
                        </div>

                        {/* Manual taxonomic filter selection */}
                        <div className="space-y-3 pt-2">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                            <label className="text-[11.5px] font-bold text-slate-700 uppercase tracking-wider block">Add Taxonomy Filters</label>
                            <select 
                              value={selectedCategory} 
                              onChange={(e) => setSelectedCategory(e.target.value)}
                              className="text-[12px] bg-slate-50 border border-slate-200 rounded px-2 py-1 font-bold outline-none"
                            >
                              <option value="">Set primary category...</option>
                              {CREATOR_CATEGORIES.map(c => (
                                <option key={c.groupName} value={c.groupName}>{c.groupName}</option>
                              ))}
                            </select>
                          </div>

                          {/* Search Sub-categories */}
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                            <input
                              type="text"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[13px] outline-none focus:border-indigo-500 focus:bg-white transition-all"
                              placeholder="Type keyword to filter master subcategories..."
                            />
                          </div>

                          {/* Sidebar taxonomic selector panel */}
                          <div className="border border-slate-100 rounded-xl overflow-hidden flex h-[180px] bg-slate-50/20">
                            <div className="w-1/3 border-r border-slate-200 overflow-y-auto bg-slate-50/50 p-2 space-y-0.5 scrollbar-thin">
                              {CREATOR_CATEGORIES.map(group => (
                                <button
                                  type="button"
                                  key={group.groupName}
                                  onClick={() => setActiveGroup(group.groupName)}
                                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-[11.5px] font-bold transition-all ${
                                    activeGroup === group.groupName 
                                      ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200/50' 
                                      : 'text-slate-600 hover:bg-slate-100'
                                  }`}
                                >
                                  <span className="truncate">{group.groupName}</span>
                                </button>
                              ))}
                            </div>

                            <div className="flex-1 overflow-y-auto p-3 scrollbar-thin bg-white">
                              <div className="flex flex-wrap gap-1.5">
                                {activeGroupSubcategories.map(sub => {
                                  const isSelected = selectedTags.includes(sub);
                                  return (
                                    <button
                                      type="button"
                                      key={sub}
                                      onClick={() => handleToggleTag(sub, activeGroup)}
                                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11.5px] font-bold border transition-all ${
                                        isSelected 
                                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' 
                                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                                      }`}
                                    >
                                      {isSelected && <Check className="h-3 w-3" />}
                                      {sub}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>

                          {/* Checkbox settings */}
                          <div className="flex items-center gap-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={hasManagerInput}
                                onChange={(e) => setHasManagerInput(e.target.checked)}
                                className="rounded border-slate-300 text-indigo-600 h-4 w-4" 
                              />
                              <span className="text-[12.5px] font-bold text-slate-700">Has Manager</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={verifiedInput}
                                onChange={(e) => setVerifiedInput(e.target.checked)}
                                className="rounded border-slate-300 text-indigo-600 h-4 w-4" 
                              />
                              <span className="text-[12.5px] font-bold text-slate-700">Verified</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={brandSafeInput}
                                onChange={(e) => setBrandSafeInput(e.target.checked)}
                                className="rounded border-slate-300 text-indigo-600 h-4 w-4" 
                              />
                              <span className="text-[12.5px] font-bold text-slate-700">Brand Safe Override</span>
                            </label>
                          </div>

                        </div>

                      </div>
                    )}
                  </div>
                </motion.div>
              )
            )}

          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex items-center justify-end gap-3 shrink-0">
          <button 
            type="button" 
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-[14px] font-bold text-slate-600 hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
          
          {step === "review" && (
            <button 
              type="button"
              disabled={isSubmitting}
              onClick={handleSave}
              className="px-6 py-2.5 rounded-xl text-[14px] font-bold text-white bg-indigo-600 hover:bg-indigo-750 transition-all shadow-md shadow-indigo-100 disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent inline-block"></span>
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Creator Profile</span>
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
