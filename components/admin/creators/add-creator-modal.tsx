"use client";

import { X, Sparkles, Upload, Search, Check } from "lucide-react";
import { useState, useEffect } from "react";
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [activeGroup, setActiveGroup] = useState<string>("Video Format");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Employee assignment
  const [assignedEmployee, setAssignedEmployee] = useState<string>("");
  const [employeesList, setEmployeesList] = useState<{id: string; full_name: string; role: string; assigned_count: number; status: string}[]>([]);

  // Controlled form states for Instagram auto-fill
  const [fullName, setFullName] = useState("");
  const [usernameInput, setUsernameInput] = useState("");
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
  // CDN URL stored as profile_image in Supabase (lightweight, indexable by Algolia)
  const [profileImageCdnUrl, setProfileImageCdnUrl] = useState("");

  // Controlled checkbox states
  const [hasManagerInput, setHasManagerInput] = useState(false);
  const [verifiedInput, setVerifiedInput] = useState(false);
  const [brandSafeInput, setBrandSafeInput] = useState(true);

  const [isFetchingInsta, setIsFetchingInsta] = useState(false);
  const [isCategorizing, setIsCategorizing] = useState(false);
  const [lastFetchedUsername, setLastFetchedUsername] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [isAutoOnboarding, setIsAutoOnboarding] = useState(false);
  const [scrapedCaptions, setScrapedCaptions] = useState<string[]>([]);

  const handleAutoOnboard = async () => {
    const username = usernameInput.trim();
    if (!username) {
      alert("Please enter a username first.");
      return;
    }
    
    setIsAutoOnboarding(true);
    setErrorMessage("");
    setStatusMessage("Running automated categorization pipeline in background...");
    
    try {
      const res = await fetch("/api/admin/categorize-pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      
      if (!res.ok) {
        const contentType = res.headers.get("content-type") || "";
        let errMsg = "Automated pipeline failed.";
        if (contentType.includes("application/json")) {
          const data = await res.json();
          errMsg = data.error || errMsg;
        } else {
          const text = await res.text();
          errMsg = text || errMsg;
        }
        setErrorMessage(errMsg);
        setStatusMessage("");
        return;
      }
      
      const data = await res.json();
      
      if (data.success) {
        if (data.runId) {
          setStatusMessage("Enqueuing and processing Trigger.dev background task...");
          let isDone = false;
          let attempts = 0;
          while (!isDone && attempts < 30) {
            attempts++;
            await new Promise((resolve) => setTimeout(resolve, 2000));
            const statusRes = await fetch(`/api/admin/enrich-status?runId=${data.runId}`);
            if (statusRes.ok) {
              const statusData = await statusRes.json();
              if (statusData.status === "SUCCESS") {
                isDone = true;
              } else if (statusData.status === "FAILURE" || statusData.status === "CANCELED" || statusData.status === "TIMED_OUT") {
                throw new Error(`Enrichment failed with status: ${statusData.status}`);
              }
            }
          }
        }
        setStatusMessage("Success! Creator has been auto-onboarded with AI-mapped tags.");
        alert(`Successfully onboarded @${username}!`);
        onClose();
        window.location.reload();
      } else {
        setErrorMessage(data.error || "Automated pipeline failed.");
        setStatusMessage("");
      }
    } catch (e: any) {
      setErrorMessage(e.message || "An unexpected error occurred.");
      setStatusMessage("");
    } finally {
      setIsAutoOnboarding(false);
    }
  };



  // Semantic AI Tag Suggester States
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [isFetchingAiSuggestions, setIsFetchingAiSuggestions] = useState(false);
  const [searchedTerm, setSearchedTerm] = useState("");

  // Fetch employees for assignment dropdown
  useEffect(() => {
    if (isOpen) {
      fetch("/api/admin/employees")
        .then(r => r.json())
        .then(d => setEmployeesList(d.employees || []))
        .catch(() => {});
    }
  }, [isOpen]);

  // Reset AI suggestions when search query changes
  useEffect(() => {
    setAiSuggestions([]);
    setSearchedTerm("");
  }, [searchQuery]);

  // Sync form states with creator prop (edit mode vs add mode)
  useEffect(() => {
    if (creator) {
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
      if (creator.category) {
        setActiveGroup(creator.category);
      }
    } else {
      setFullName("");
      setUsernameInput("");
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
      setActiveGroup("Video Format");
    }
    setErrorMessage("");
    setStatusMessage("");
  }, [creator, isOpen]);

  if (!isOpen) return null;

  const handleAutoCategorize = async (bioTextContent: string, captionsList?: string[]) => {
    if (!bioTextContent && (!captionsList || captionsList.length === 0)) return;
    setIsCategorizing(true);
    setErrorMessage("");
    setStatusMessage("Gemini AI is analyzing biography and recent captions to auto-detect creator niches...");

    try {
      const res = await fetch("/api/admin/ai-categorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          description: bioTextContent, 
          captions: captionsList || scrapedCaptions 
        }),
      });
      
      if (!res.ok) {
        const contentType = res.headers.get("content-type") || "";
        let errMsg = "AI auto-categorizer endpoint returned an error.";
        if (contentType.includes("application/json")) {
          const data = await res.json();
          errMsg = data.error || errMsg;
        } else {
          const text = await res.text();
          errMsg = text || errMsg;
        }
        throw new Error(errMsg);
      }
      
      const data = await res.json();

      if (data.tags && Array.isArray(data.tags)) {
        setSelectedTags(data.tags);
        setStatusMessage(`Successfully imported profile & detected ${data.tags.length} niche tags!`);
        
        // Find which group has the matching tags and set selectedCategory & activeGroup
        if (data.tags.length > 0) {
          for (const tag of data.tags) {
            const matchGroup = CREATOR_CATEGORIES.find(g => g.subCategories.includes(tag));
            if (matchGroup) {
              setSelectedCategory(matchGroup.groupName);
              setActiveGroup(matchGroup.groupName);
              break;
            }
          }
        }
      } else if (data.error) {
        console.warn("AI categorization failed:", data.error);
        setStatusMessage("Profile imported, but AI auto-categorization failed.");
      }
    } catch (err: any) {
      console.warn("AI categorization error:", err);
      setStatusMessage("Profile imported, but AI categorization failed.");
    } finally {
      setIsCategorizing(false);
    }
  };

  const handleFetchInstagramData = async (username: string) => {
    if (!username || !username.trim()) return;
    
    setIsFetchingInsta(true);
    setErrorMessage("");
    setStatusMessage("Accessing Apify scraper to retrieve live Instagram metrics...");
    
    try {
      const res = await fetch("/api/admin/fetch-instagram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      
      if (!res.ok) {
        const contentType = res.headers.get("content-type") || "";
        let errMsg = "Failed to retrieve Instagram details.";
        if (contentType.includes("application/json")) {
          const data = await res.json();
          errMsg = data.error || errMsg;
        } else {
          const text = await res.text();
          errMsg = text || errMsg;
        }
        setErrorMessage(errMsg);
        setStatusMessage("");
        return;
      }
      
      const data = await res.json();
      
      if (!data.success) {
        setErrorMessage(data.error || "Failed to retrieve Instagram details.");
        setStatusMessage("");
        return;
      }
      
      // Successfully fetched real data! Populate the form
      setFullName(data.fullName || "");
      setBioText(data.biography || "");
      setFollowersCount(data.followersCount ? String(data.followersCount) : "");
      setAvgViews(data.avgViews ? String(data.avgViews) : "");
      setEngagementRate(data.engagementRate ? String(data.engagementRate) : "");
      setLocationInput(data.location || "Mumbai, India");
      // Use base64 for browser preview (CDN URLs may have CORS restrictions in-browser)
      setAvatarPreviewUrl(data.profilePicBase64 || data.profilePicUrl || "");
      // Store the lightweight CDN URL for Supabase/Algolia (what gets saved to profile_image)
      setProfileImageCdnUrl(data.profilePicUrl || "");
      // Clear the separate profileImageUrl state (no longer needed)
      setLastFetchedUsername(username);
      setStatusMessage(`Successfully loaded @${username}'s live metrics!`);
      
      const captions = data.captions || [];
      setScrapedCaptions(captions);

      // Auto-categorize using Gemini AI on biography and captions
      if (data.biography || captions.length > 0) {
        await handleAutoCategorize(data.biography || "", captions);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Network error. Failed to connect to scraper service.");
      setStatusMessage("");
    } finally {
      setIsFetchingInsta(false);
    }
  };

  const handleGetAiSuggestions = async (queryText: string) => {
    if (!queryText || !queryText.trim()) return;
    setIsFetchingAiSuggestions(true);
    setErrorMessage("");
    
    try {
      const res = await fetch("/api/admin/ai-suggest-tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: queryText }),
      });
      
      if (!res.ok) {
        const contentType = res.headers.get("content-type") || "";
        let errMsg = "AI failed to find conceptual category matches.";
        if (contentType.includes("application/json")) {
          const data = await res.json();
          errMsg = data.error || errMsg;
        } else {
          const text = await res.text();
          errMsg = text || errMsg;
        }
        setErrorMessage(errMsg);
        return;
      }
      
      const data = await res.json();
      
      if (data.success && Array.isArray(data.suggestions)) {
        setAiSuggestions(data.suggestions);
        setSearchedTerm(queryText);
      } else {
        setErrorMessage(data.error || "AI failed to find conceptual category matches.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to connect to WeCollab AI suggestions API.");
    } finally {
      setIsFetchingAiSuggestions(false);
    }
  };

  const handleToggleTag = (tag: string, parentGroupName: string) => {
    setSelectedTags(prev => {
      let nextTags;
      if (prev.includes(tag)) {
        nextTags = prev.filter(t => t !== tag);
      } else {
        nextTags = [...prev, tag];
      }
      
      // Auto-category selection logic:
      // If we are selecting a first tag, set the selectedCategory to the parentGroupName!
      if (nextTags.length > 0 && !selectedCategory) {
        setSelectedCategory(parentGroupName);
      }
      
      return nextTags;
    });
  };

  const handleSelectAllInGroup = (groupName: string) => {
    const group = CREATOR_CATEGORIES.find(g => g.groupName === groupName);
    if (!group) return;
    
    const subCategories = group.subCategories;
    const isAllSelected = subCategories.every(sub => selectedTags.includes(sub));
    
    if (isAllSelected) {
      // Remove all
      setSelectedTags(prev => prev.filter(t => !subCategories.includes(t)));
    } else {
      // Add missing ones
      setSelectedTags(prev => {
        const toAdd = subCategories.filter(sub => !prev.includes(sub));
        const nextTags = [...prev, ...toAdd];
        if (nextTags.length > 0 && !selectedCategory) {
          setSelectedCategory(groupName);
        }
        return nextTags;
      });
    }
  };

  const isAllGroupSelected = (groupName: string) => {
    const group = CREATOR_CATEGORIES.find(g => g.groupName === groupName);
    if (!group) return false;
    return group.subCategories.every(sub => selectedTags.includes(sub));
  };

  const activeGroupSubcategories = CREATOR_CATEGORIES.find(g => g.groupName === activeGroup)?.subCategories || [];

  const filteredSearchResults = searchQuery 
    ? CREATOR_CATEGORIES.map(group => {
        const matches = group.subCategories.filter(sub => 
          sub.toLowerCase().includes(searchQuery.toLowerCase())
        );
        return {
          groupName: group.groupName,
          subCategories: matches
        };
      }).filter(group => group.subCategories.length > 0)
    : [];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const submitData = {
      name: fullName,
      username: usernameInput,
      bio: bioText,
      profile_image: profileImageCdnUrl || avatarPreviewUrl,  // CDN URL → Supabase & Algolia
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
    };
    
    await onSubmit(submitData);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="text-[18px] font-bold text-slate-900">{creator ? "Edit Creator Profile" : "Add New Creator"}</h2>
            <p className="text-[13px] text-slate-500 font-medium mt-0.5">
              {creator ? "Update the creator's metrics, niches and details." : "Quickly add a creator to your database."}
            </p>
          </div>
          <button type="button" onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form id="add-creator-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-6">
          {/* Error and Status Banners */}
          {errorMessage && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-[13px] font-semibold flex items-start gap-2.5 animate-in slide-in-from-top-2 duration-200">
              <span className="bg-rose-100 text-rose-700 h-5 w-5 rounded-full flex items-center justify-center text-[11px] font-extrabold shrink-0">!</span>
              <div>
                <p className="font-bold text-rose-800">Scraping Failed</p>
                <p className="mt-0.5 text-rose-600/90">{errorMessage}</p>
              </div>
            </div>
          )}

          {statusMessage && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 text-[13px] font-semibold flex items-start gap-2.5 animate-in slide-in-from-top-2 duration-200">
              <span className="bg-emerald-100 text-emerald-700 h-5 w-5 rounded-full flex items-center justify-center text-[11px] font-extrabold shrink-0">✓</span>
              <div>
                <p className="font-bold text-emerald-800">Status Update</p>
                <p className="mt-0.5 text-emerald-600/90 flex items-center gap-2">
                  {isCategorizing && <span className="h-3 w-3 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent inline-block"></span>}
                  {statusMessage}
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-6 mb-8">
            {/* Avatar Upload / Preview */}
            <div className="w-24 shrink-0 flex flex-col items-center gap-2">
              {avatarPreviewUrl ? (
                <div className="relative h-24 w-24 rounded-full overflow-hidden border-2 border-indigo-500 shadow-md">
                  <CreatorAvatar src={avatarPreviewUrl} name={fullName} className="h-24 w-24" />
                  <input type="hidden" name="profile_image" value={avatarPreviewUrl} />
                </div>
              ) : (
                <div className="h-24 w-24 rounded-full border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-slate-400 hover:border-indigo-400 hover:bg-indigo-50 transition-colors cursor-pointer group">
                  <Upload className="h-5 w-5 group-hover:text-indigo-500 mb-1" />
                  <span className="text-[10px] font-bold uppercase tracking-wider group-hover:text-indigo-600">Upload</span>
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
                    name="name" 
                    type="text" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-[14px] outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" 
                    placeholder="e.g. Jane Doe" 
                  />
                </div>
                <div>
                  <label className="text-[12px] font-bold text-slate-700 mb-1.5 block">Username *</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-slate-400 font-medium">@</span>
                    <input 
                      required 
                      name="username" 
                      type="text" 
                      value={usernameInput}
                      onChange={(e) => setUsernameInput(e.target.value)}
                      onBlur={(e) => {
                        if (e.target.value.trim() && e.target.value.trim() !== lastFetchedUsername) {
                          handleFetchInstagramData(e.target.value);
                        }
                      }}
                      className="w-full pl-7 pr-28 py-2 bg-white border border-slate-200 rounded-lg text-[14px] outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" 
                      placeholder="janedoe" 
                    />
                    <button
                      type="button"
                      disabled={isFetchingInsta || !usernameInput.trim()}
                      onClick={() => handleFetchInstagramData(usernameInput)}
                      className="absolute right-1.5 px-3 py-1 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 text-indigo-600 rounded-md text-[11px] font-bold transition-all flex items-center gap-1.5 h-7"
                    >
                      {isFetchingInsta ? (
                        <>
                          <div className="h-3 w-3 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"></div>
                          <span>Fetching...</span>
                        </>
                      ) : (
                        <span>✨ Auto-Fill</span>
                      )}
                    </button>
                  </div>
                  <button
                    type="button"
                    disabled={isAutoOnboarding || !usernameInput.trim()}
                    onClick={handleAutoOnboard}
                    className="mt-2 w-full flex items-center justify-center gap-1.5 py-1.5 bg-indigo-600 hover:bg-indigo-750 disabled:opacity-50 text-white rounded-lg text-[11px] font-extrabold tracking-wide uppercase transition-all shadow-sm shadow-indigo-100"
                  >
                    {isAutoOnboarding ? (
                      <>
                        <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        <span>Processing Pipeline...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5 fill-indigo-200" />
                        <span>Auto-Onboard Pipeline (Skip Form)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[12px] font-bold text-slate-700 block">Bio / Description</label>
                  <button 
                    type="button" 
                    onClick={() => handleAutoCategorize(bioText)}
                    disabled={isCategorizing || !bioText.trim()}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 disabled:opacity-50 flex items-center gap-1 bg-indigo-50 px-2.5 py-1 rounded-full transition-colors"
                  >
                    <Sparkles className="h-3 w-3 animate-pulse" /> Auto-categorize
                  </button>
                </div>
                <textarea 
                  name="bio" 
                  rows={3} 
                  value={bioText}
                  onChange={(e) => setBioText(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-[14px] outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none animate-in fade-in" 
                  placeholder="Paste their Instagram bio here..." 
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6 mb-8">
            <div className="col-span-3 pb-2 border-b border-slate-100">
              <h3 className="text-[14px] font-bold text-slate-900">Metrics & Location</h3>
            </div>
            
            <div>
              <label className="text-[12px] font-bold text-slate-700 mb-1.5 block">Followers</label>
              <input 
                name="followers_count" 
                type="number" 
                value={followersCount}
                onChange={(e) => setFollowersCount(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-[14px] outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" 
                placeholder="e.g. 150000" 
              />
            </div>
            <div>
              <label className="text-[12px] font-bold text-slate-700 mb-1.5 block">Avg Views</label>
              <input 
                name="avg_views" 
                type="number" 
                value={avgViews}
                onChange={(e) => setAvgViews(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-[14px] outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" 
                placeholder="e.g. 45000" 
              />
            </div>
            <div>
              <label className="text-[12px] font-bold text-slate-700 mb-1.5 block">Engagement Rate (%)</label>
              <input 
                name="engagement_rate" 
                type="number" 
                step="0.01" 
                value={engagementRate}
                onChange={(e) => setEngagementRate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-[14px] outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" 
                placeholder="e.g. 3.5" 
              />
            </div>

            <div>
              <label className="text-[12px] font-bold text-slate-700 mb-1.5 block">Location</label>
              <input 
                name="location" 
                type="text" 
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-[14px] outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" 
                placeholder="City, Country" 
              />
            </div>
            <div>
              <label className="text-[12px] font-bold text-slate-700 mb-1.5 block">Language</label>
              <input 
                name="language" 
                type="text" 
                value={languageInput}
                onChange={(e) => setLanguageInput(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-[14px] outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" 
                placeholder="e.g. English" 
              />
            </div>
            <div>
              <label className="text-[12px] font-bold text-slate-700 mb-1.5 block">Gender</label>
              <select 
                name="gender" 
                value={genderInput}
                onChange={(e) => setGenderInput(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-[14px] outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">Select...</option>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Categories & Focus Areas */}
          <div className="space-y-4 mb-8">
            <div className="pb-2 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-[14px] font-bold text-slate-900">Categories & Focus Areas</h3>
              <span className="text-[11px] font-extrabold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                {selectedTags.length} Selected
              </span>
            </div>

            {/* Primary Category Selector */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[12px] font-bold text-slate-700 mb-1.5 block">Primary Category *</label>
                <select 
                  name="category"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-[14px] outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">Select primary category...</option>
                  {CREATOR_CATEGORIES.map(c => (
                    <option key={c.groupName} value={c.groupName}>{c.groupName}</option>
                  ))}
                </select>
              </div>
              
              {/* Search Sub-categories */}
              <div>
                <label className="text-[12px] font-bold text-slate-700 mb-1.5 block">Search Sub-categories</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-[14px] outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    placeholder="Search across all 239 sub-categories..."
                  />
                </div>
              </div>
            </div>

            {/* Selection Panel */}
            <div className="border border-slate-200 rounded-xl overflow-hidden flex h-[260px] bg-slate-50/20">
              {/* Left Sidebar - Groups list */}
              {!searchQuery && (
                <div className="w-1/3 border-r border-slate-200 overflow-y-auto bg-slate-50/50 p-2 space-y-1 scrollbar-thin">
                  {CREATOR_CATEGORIES.map(group => {
                    const selectedInGroup = group.subCategories.filter(sub => selectedTags.includes(sub)).length;
                    const isActive = activeGroup === group.groupName;
                    
                    return (
                      <button
                        type="button"
                        key={group.groupName}
                        onClick={() => setActiveGroup(group.groupName)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-[12.5px] font-bold transition-all ${
                          isActive 
                            ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200/60' 
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                      >
                        <span className="truncate">{group.groupName}</span>
                        {selectedInGroup > 0 && (
                          <span className="bg-indigo-100 text-indigo-700 text-[10px] px-1.5 py-0.5 rounded-full shrink-0 font-extrabold">
                            {selectedInGroup}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Right Area - Sub-categories pills */}
              <div className="flex-1 overflow-y-auto p-4 scrollbar-thin bg-white">
                {searchQuery ? (
                  /* Search Results View */
                  <div className="space-y-4">
                    {filteredSearchResults.length > 0 ? (
                      filteredSearchResults.map(group => (
                        <div key={group.groupName} className="space-y-1.5">
                          <h4 className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2 py-0.5 rounded inline-block">
                            {group.groupName}
                          </h4>
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {group.subCategories.map(sub => {
                              const isSelected = selectedTags.includes(sub);
                              return (
                                <button
                                  type="button"
                                  key={sub}
                                  onClick={() => handleToggleTag(sub, group.groupName)}
                                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold border transition-all ${
                                    isSelected 
                                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm shadow-indigo-100' 
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
                      ))
                    ) : (
                      /* Conceptual AI Suggester Panel when no direct matches */
                      <div className="h-full flex flex-col items-center justify-center text-center p-4">
                        {isFetchingAiSuggestions ? (
                          /* Loading pulsing indicator */
                          <div className="space-y-4 w-full max-w-[280px] animate-pulse">
                            <div className="flex items-center justify-center gap-2 text-indigo-600 font-bold text-[13px]">
                              <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"></span>
                              <span>WeCollab AI is mapping categories...</span>
                            </div>
                            <div className="space-y-2">
                              <div className="h-8 bg-slate-100 rounded-full w-full"></div>
                              <div className="h-8 bg-slate-100 rounded-full w-3/4 mx-auto"></div>
                            </div>
                          </div>
                        ) : aiSuggestions.length > 0 && searchedTerm === searchQuery ? (
                          /* Render AI Suggested tags */
                          <div className="space-y-3 w-full text-left">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                              <h4 className="text-[11.5px] font-extrabold text-indigo-600 uppercase tracking-wider flex items-center gap-1.5">
                                <Sparkles className="h-3.5 w-3.5 fill-indigo-100 animate-pulse text-indigo-500" /> AI Suggestions for "{searchedTerm}"
                              </h4>
                              <button 
                                type="button"
                                onClick={() => handleGetAiSuggestions(searchQuery)}
                                className="text-[11px] font-bold text-slate-400 hover:text-indigo-600"
                              >
                                Re-analyze
                              </button>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {aiSuggestions.map(sub => {
                                const isSelected = selectedTags.includes(sub);
                                return (
                                  <button
                                    type="button"
                                    key={sub}
                                    onClick={() => {
                                      // Get the parent group name of the sub-category
                                      const groupName = CREATOR_CATEGORIES.find(g => g.subCategories.includes(sub))?.groupName || "General";
                                      handleToggleTag(sub, groupName);
                                    }}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold border transition-all ${
                                      isSelected 
                                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' 
                                        : 'bg-indigo-50/40 border-indigo-100 text-indigo-700 hover:border-indigo-200 hover:bg-indigo-50'
                                    }`}
                                  >
                                    {isSelected ? <Check className="h-3 w-3" /> : <Sparkles className="h-3 w-3 text-indigo-400/80" />}
                                    {sub}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          /* Initial AI Suggestion Trigger Box */
                          <div className="space-y-3.5 max-w-[320px]">
                            <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center mx-auto text-indigo-600">
                              <Search className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="text-[13px] font-bold text-slate-700">No keyword matches found for "{searchQuery}"</p>
                              <p className="text-[12px] text-slate-500 mt-1">Want WeCollab AI to find conceptually related niche categories in our system?</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleGetAiSuggestions(searchQuery)}
                              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[12.5px] font-bold shadow-sm transition-all"
                            >
                              <Sparkles className="h-3.5 w-3.5 fill-indigo-100" /> Ask WeCollab AI
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  /* Standard Group View */
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <h4 className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">{activeGroup}</h4>
                      <button 
                        type="button"
                        onClick={() => handleSelectAllInGroup(activeGroup)}
                        className="text-[11px] font-extrabold text-indigo-600 hover:text-indigo-700"
                      >
                        {isAllGroupSelected(activeGroup) ? "Deselect All" : "Select All"}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {activeGroupSubcategories.map(sub => {
                        const isSelected = selectedTags.includes(sub);
                        return (
                          <button
                            type="button"
                            key={sub}
                            onClick={() => handleToggleTag(sub, activeGroup)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold border transition-all ${
                              isSelected 
                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm shadow-indigo-100' 
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
                )}
              </div>
            </div>

            {/* Selected Tags list */}
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

          <div className="grid grid-cols-2 gap-6">
            <div className="col-span-2 pb-2 border-b border-slate-100">
              <h3 className="text-[14px] font-bold text-slate-900">Business & Contact</h3>
            </div>
            
            <div>
              <label className="text-[12px] font-bold text-slate-700 mb-1.5 block">Email</label>
              <input 
                name="email" 
                type="email" 
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-[14px] outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" 
                placeholder="collab@creator.com" 
              />
            </div>
            <div>
              <label className="text-[12px] font-bold text-slate-700 mb-1.5 block">Pricing / Post ($)</label>
              <input 
                name="collaboration_pricing" 
                type="number" 
                value={pricingInput}
                onChange={(e) => setPricingInput(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-[14px] outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" 
                placeholder="e.g. 1500" 
              />
            </div>

            <div className="col-span-2 flex items-center gap-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  name="has_manager" 
                  checked={hasManagerInput}
                  onChange={(e) => setHasManagerInput(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 h-4 w-4" 
                />
                <span className="text-[13px] font-semibold text-slate-700">Has Manager</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  name="verified" 
                  checked={verifiedInput}
                  onChange={(e) => setVerifiedInput(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 h-4 w-4" 
                />
                <span className="text-[13px] font-semibold text-slate-700">Verified</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  name="brand_safe" 
                  checked={brandSafeInput}
                  onChange={(e) => setBrandSafeInput(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 h-4 w-4" 
                />
                <span className="text-[13px] font-semibold text-slate-700">Brand Safe</span>
              </label>
            </div>
          </div>

          {/* ─── Assign to Employee ─────────────────────────── */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <label className="text-[13px] font-bold text-slate-700 mb-1.5 block">Assign to Employee</label>
            <p className="text-[11px] text-slate-400 mb-2">This creator will appear in the selected employee's workspace.</p>
            <select
              value={assignedEmployee}
              onChange={e => setAssignedEmployee(e.target.value)}
              className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none"
            >
              <option value="">— Unassigned —</option>
              {employeesList.filter(e => e.status === 'active' || e.status === 'invited').map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.full_name} ({emp.role}) — {emp.assigned_count} creators
                </option>
              ))}
            </select>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex items-center justify-end gap-3 shrink-0">
          <button 
            type="button" 
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-[14px] font-bold text-slate-600 hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            form="add-creator-form"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl text-[14px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200 disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? "Saving..." : creator ? "Update Creator" : "Save Creator"}
          </button>
        </div>
        
      </div>
    </div>
  );
}
