"use client";

import { ChevronDown, SlidersHorizontal, Bookmark, X, Check } from "lucide-react";
import { useState, useRef, useEffect, useMemo } from "react";
import { AllFiltersPanel } from "./all-filters-panel";
import { motion, AnimatePresence } from "framer-motion";

export type FilterState = {
  platform: string;
  location: string;
  gender: string;
  followers: string;
  hasContact: boolean;
  subCategories: string[];
};

// Generic Dropdown Component
function FilterDropdown({
  label,
  value,
  options,
  onChange,
  icon,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (val: string) => void;
  icon?: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isActive = value !== "All Platforms" && value !== "All" && value !== "all";

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-[13px] font-medium transition ${
          isActive
            ? "border-primary/40 bg-primary-soft/20 text-primary hover:bg-primary-soft/30"
            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
        }`}
      >
        {icon}
        {value === "All Platforms" || value === "All" || value === "all" ? label : value}
        <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 mt-1.5 w-48 z-40 rounded-xl border border-slate-100 bg-white p-1.5 shadow-lg"
          >
            {options.map((opt) => (
              <button
                key={opt}
                onClick={() => {
                  onChange(opt);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  value === opt ? "bg-violet-50 text-violet-700 font-medium" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                {opt}
                {value === opt && <Check className="h-3.5 w-3.5" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function DiscoverFilters({
  filters,
  setFilters,
  plans = [],
  activePlanId = null,
  setActivePlanId,
}: {
  filters: FilterState;
  setFilters: (f: FilterState) => void;
  plans?: any[];
  activePlanId?: string | null;
  setActivePlanId?: (id: string | null) => void;
}) {
  const [isAllFiltersOpen, setIsAllFiltersOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const activeFilters = useMemo(() => {
    const list: { key: string; label: string; value: string; onClear: () => void }[] = [];
    if (filters.platform && filters.platform !== "All Platforms") {
      list.push({
        key: "platform",
        label: "Platform",
        value: filters.platform,
        onClear: () => setFilters({ ...filters, platform: "All Platforms" })
      });
    }
    if (filters.location && filters.location !== "All") {
      list.push({
        key: "location",
        label: "Location",
        value: filters.location,
        onClear: () => setFilters({ ...filters, location: "All" })
      });
    }
    if (filters.gender && filters.gender !== "All") {
      list.push({
        key: "gender",
        label: "Gender",
        value: filters.gender,
        onClear: () => setFilters({ ...filters, gender: "All" })
      });
    }
    if (filters.followers && filters.followers !== "all") {
      list.push({
        key: "followers",
        label: "Followers",
        value: filters.followers,
        onClear: () => setFilters({ ...filters, followers: "all" })
      });
    }
    if (filters.hasContact) {
      list.push({
        key: "hasContact",
        label: "Saved Only",
        value: "Yes",
        onClear: () => setFilters({ ...filters, hasContact: false })
      });
    }
    filters.subCategories.forEach((subCat) => {
      list.push({
        key: `subcat-${subCat}`,
        label: "Niche",
        value: subCat,
        onClear: () => setFilters({ ...filters, subCategories: filters.subCategories.filter(c => c !== subCat) })
      });
    });
    return list;
  }, [filters, setFilters]);

  const handleClearAll = () => {
    setFilters({
      platform: "All Platforms",
      location: "All",
      gender: "All",
      followers: "all",
      hasContact: false,
      subCategories: [],
    });
  };

  const toggleSubCat = (subCat: string) => {
    const current = filters.subCategories;
    const newSubCats = current.includes(subCat)
      ? current.filter((c) => c !== subCat)
      : [...current, subCat];
    setFilters({ ...filters, subCategories: newSubCats });
  };

  return (
    <div className="flex flex-col border-b border-slate-200 bg-white relative z-30">
      {/* Desktop Filter Row */}
      <div className="hidden md:flex h-16 flex-wrap items-center justify-between px-6">
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Active Blueprint Focus Selector */}
          {setActivePlanId && plans.length > 0 && (
            <div className="relative">
              <select
                value={activePlanId || ""}
                onChange={(e) => setActivePlanId(e.target.value ? e.target.value : null)}
                className={`flex h-9 items-center gap-2 rounded-lg border px-3 py-1.5 text-[12px] font-black transition outline-none cursor-pointer ${
                  activePlanId
                    ? "border-indigo-400 bg-indigo-50/50 text-indigo-700 hover:bg-indigo-50 shadow-sm"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 shadow-sm"
                }`}
              >
                <option value="">🎯 Lock Active Plan Focus</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    Focus: {p.name} ({p.brand})
                  </option>
                ))}
              </select>
            </div>
          )}
          
          <FilterDropdown
            label="Platform"
            value={filters.platform}
            options={["All Platforms", "Instagram", "YouTube", "X", "TikTok"]}
            onChange={(val) => setFilters({ ...filters, platform: val })}
            icon={
              filters.platform === "Instagram" ? (
                <div className="flex h-4 w-4 items-center justify-center rounded bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500 text-white">
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                  </svg>
                </div>
              ) : null
            }
          />

          <FilterDropdown
            label="Location"
            value={filters.location}
            options={["All", "India", "USA", "UK", "Canada", "Australia"]}
            onChange={(val) => setFilters({ ...filters, location: val })}
          />

          <FilterDropdown
            label="Gender"
            value={filters.gender}
            options={["All", "Male", "Female", "Non-binary"]}
            onChange={(val) => setFilters({ ...filters, gender: val })}
          />

          <FilterDropdown
            label="Followers"
            value={filters.followers}
            options={["all", "10k - 50k", "50k - 100k", "100k - 500k", "500k+"]}
            onChange={(val) => setFilters({ ...filters, followers: val })}
          />

          {/* All Filters Button */}
          <div className="ml-2 flex items-center gap-2">
            <button
              onClick={() => setIsAllFiltersOpen(true)}
              className="flex items-center gap-2 text-[13px] font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              <SlidersHorizontal className="h-4 w-4" />
              All Filters
            </button>
            {filters.subCategories.length > 0 && (
              <span className="flex h-1.5 w-1.5 rounded-full bg-primary shadow-sm"></span>
            )}
          </div>
        </div>

        {/* Right side toggle */}
        <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
          <Bookmark className="h-4 w-4 text-slate-400" />
          <span className="text-[13px] font-medium text-slate-600">In My Creators</span>
          <button
            onClick={() => setFilters({ ...filters, hasContact: !filters.hasContact })}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
              filters.hasContact ? "bg-primary" : "bg-slate-200"
            }`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow-sm ${
                filters.hasContact ? "translate-x-4" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Mobile Filters Row */}
      <div className="flex md:hidden h-14 items-center justify-between px-4 border-b border-slate-200">
        <button
          onClick={() => setIsMobileDrawerOpen(true)}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-[13px] font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
        >
          <SlidersHorizontal className="h-4 w-4 text-slate-500" />
          Filters
          {activeFilters.length > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-650 text-[10px] font-bold bg-indigo-600 text-white">
              {activeFilters.length}
            </span>
          )}
        </button>

        <div className="flex items-center gap-2">
          {/* Native Sort Selector */}
          <select
            value="Followers (High to Low)"
            onChange={() => {}}
            className="rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs font-bold text-slate-700 outline-none cursor-pointer"
          >
            <option value="Followers (High to Low)">Sort: Followers</option>
            <option value="Followers (Low to High)">Sort: Followers (Low)</option>
            <option value="Engagement Rate">Sort: Engagement</option>
            <option value="Score">Sort: Score</option>
          </select>
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      {isMobileDrawerOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileDrawerOpen(false)}
        />
      )}

      {/* Mobile Drawer Slide-out */}
      <div
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col bg-white shadow-xl transition-transform duration-300 md:hidden ${
          isMobileDrawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">Filters</h2>
            {activeFilters.length > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-650 text-[10px] font-bold bg-indigo-600 text-white">
                {activeFilters.length}
              </span>
            )}
          </div>
          <button
            onClick={() => setIsMobileDrawerOpen(false)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Filters Content */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">
          {/* Active Blueprint Focus Selector */}
          {setActivePlanId && plans.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Blueprint Plan Focus</label>
              <select
                value={activePlanId || ""}
                onChange={(e) => setActivePlanId(e.target.value ? e.target.value : null)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-700 outline-none cursor-pointer"
              >
                <option value="">🎯 Lock Active Plan Focus</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    Focus: {p.name} ({p.brand})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Platform */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Platform</label>
            <select
              value={filters.platform}
              onChange={(e) => setFilters({ ...filters, platform: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-700 outline-none cursor-pointer"
            >
              <option value="All Platforms">All Platforms</option>
              <option value="Instagram">Instagram</option>
              <option value="YouTube">YouTube</option>
              <option value="X">X</option>
              <option value="TikTok">TikTok</option>
            </select>
          </div>

          {/* Location */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Location</label>
            <select
              value={filters.location}
              onChange={(e) => setFilters({ ...filters, location: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-700 outline-none cursor-pointer"
            >
              <option value="All">All Locations</option>
              <option value="India">India</option>
              <option value="USA">USA</option>
              <option value="UK">UK</option>
              <option value="Canada">Canada</option>
              <option value="Australia">Australia</option>
            </select>
          </div>

          {/* Gender */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Gender</label>
            <select
              value={filters.gender}
              onChange={(e) => setFilters({ ...filters, gender: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-700 outline-none cursor-pointer"
            >
              <option value="All">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Non-binary">Non-binary</option>
            </select>
          </div>

          {/* Followers */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Followers Size</label>
            <select
              value={filters.followers}
              onChange={(e) => setFilters({ ...filters, followers: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-700 outline-none cursor-pointer"
            >
              <option value="all">All Sizes</option>
              <option value="10k - 50k">10k - 50k</option>
              <option value="50k - 100k">50k - 100k</option>
              <option value="100k - 500k">100k - 500k</option>
              <option value="500k+">500k+</option>
            </select>
          </div>

          {/* Niche Category Trigger */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Niche / Categories</label>
            <button
              onClick={() => {
                setIsAllFiltersOpen(true);
              }}
              className="w-full flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-700 font-semibold text-left hover:bg-slate-100 cursor-pointer"
            >
              <span>{filters.subCategories.length > 0 ? `${filters.subCategories.length} Selected` : "Select Sub-categories"}</span>
              <SlidersHorizontal className="h-4 w-4 text-slate-400" />
            </button>
          </div>

          {/* In My Creators Toggle */}
          <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-2">
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-700">In My Creators</span>
              <span className="text-xs text-slate-400 font-medium">Show only creators in your list</span>
            </div>
            <button
              onClick={() => setFilters({ ...filters, hasContact: !filters.hasContact })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                filters.hasContact ? "bg-primary" : "bg-slate-200"
              }`}
            >
              <span
                className={`inline-block h-4.5 w-4.5 transform rounded-full bg-white transition-transform shadow-sm ${
                  filters.hasContact ? "translate-x-5" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 bg-slate-50 p-4 flex gap-2">
          {activeFilters.length > 0 && (
            <button
              onClick={handleClearAll}
              className="flex-1 py-3 text-sm font-bold text-slate-500 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 text-center cursor-pointer"
            >
              Clear All
            </button>
          )}
          <button
            onClick={() => setIsMobileDrawerOpen(false)}
            className="flex-1 py-3 text-sm font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-800 text-center cursor-pointer"
          >
            Apply Filters
          </button>
        </div>
      </div>

      {/* Active Dismissible Filter Chips Row */}
      <AnimatePresence>
        {activeFilters.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap items-center gap-2 bg-slate-50/60 px-4 md:px-6 py-3 border-b border-slate-200/50 shadow-inner"
          >
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider mr-1">Active Filters:</span>
            <div className="flex flex-wrap items-center gap-1.5">
              {activeFilters.map((f) => (
                <motion.span
                  key={f.key}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary-soft/50 py-1 pl-2.5 pr-1.5 text-[11px] font-bold text-primary shadow-sm"
                >
                  <span className="opacity-70 text-[10px] font-medium">{f.label}:</span>
                  <span>{f.value}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      f.onClear();
                    }}
                    className="rounded-full p-0.5 hover:bg-primary-soft-hover transition-colors cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </motion.span>
              ))}
            </div>
            <button
              onClick={handleClearAll}
              className="ml-3 text-[11px] font-bold text-slate-400 hover:text-primary underline underline-offset-2 transition-colors cursor-pointer"
            >
              Clear all
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sort Row (Desktop-only, handled inside Mobile Drawer for mobile) */}
      <div className="hidden md:flex h-12 items-center justify-end px-6">
        <FilterDropdown
          label="Sort By"
          value="Followers (High to Low)"
          options={["Followers (High to Low)", "Followers (Low to High)", "Engagement Rate", "Score"]}
          onChange={() => {}}
        />
      </div>

      <AllFiltersPanel
        isOpen={isAllFiltersOpen}
        onClose={() => setIsAllFiltersOpen(false)}
        selectedSubCats={filters.subCategories}
        onToggleSubCat={toggleSubCat}
      />
    </div>
  );
}
