"use client";

import { ChevronDown, SlidersHorizontal, Bookmark, X, Check } from "lucide-react";
import { useState, useRef, useEffect } from "react";
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
            ? "border-orange-400/80 bg-orange-50/30 text-slate-700 hover:bg-orange-50"
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
}: {
  filters: FilterState;
  setFilters: (f: FilterState) => void;
}) {
  const [isAllFiltersOpen, setIsAllFiltersOpen] = useState(false);

  const toggleSubCat = (subCat: string) => {
    const current = filters.subCategories;
    const newSubCats = current.includes(subCat)
      ? current.filter((c) => c !== subCat)
      : [...current, subCat];
    setFilters({ ...filters, subCategories: newSubCats });
  };

  const removeSubCat = (subCat: string) => {
    setFilters({
      ...filters,
      subCategories: filters.subCategories.filter((c) => c !== subCat),
    });
  };

  return (
    <div className="flex flex-col border-b border-slate-200 bg-white relative z-30">
      {/* Top Filter Row */}
      <div className="flex h-16 flex-wrap items-center justify-between px-6">
        <div className="flex flex-wrap items-center gap-3">
          
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
              className="flex items-center gap-2 text-[13px] font-semibold text-slate-600 hover:text-slate-900"
            >
              <SlidersHorizontal className="h-4 w-4" />
              All Filters
            </button>
            {filters.subCategories.length > 0 && (
              <span className="flex h-1.5 w-1.5 rounded-full bg-orange-500 shadow-sm"></span>
            )}
          </div>
        </div>

        {/* Right side toggle */}
        <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
          <Bookmark className="h-4 w-4 text-slate-400" />
          <span className="text-[13px] font-medium text-slate-600">In My Creators</span>
          <button
            onClick={() => setFilters({ ...filters, hasContact: !filters.hasContact })}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
              filters.hasContact ? "bg-orange-500" : "bg-slate-200"
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

      {/* Active Sub-Categories Row */}
      {filters.subCategories.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 bg-slate-50/50 px-6 py-3 border-b border-slate-100 shadow-inner">
          <span className="text-[12px] font-medium text-slate-500">Active Filters:</span>
          {filters.subCategories.map((subCat) => (
            <span
              key={subCat}
              className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 py-1 pl-2.5 pr-1.5 text-[12px] font-medium text-violet-700 shadow-sm"
            >
              {subCat}
              <button
                onClick={() => removeSubCat(subCat)}
                className="rounded-full p-0.5 hover:bg-violet-200 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <button
            onClick={() => setFilters({ ...filters, subCategories: [] })}
            className="ml-2 text-[12px] font-medium text-slate-400 hover:text-slate-600 underline underline-offset-2 transition-colors"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Sort Row */}
      <div className="flex h-12 items-center justify-end px-6">
        <FilterDropdown
          label="Sort By"
          value="Followers (High to Low)"
          options={["Followers (High to Low)", "Followers (Low to High)", "Engagement Rate", "Score"]}
          onChange={() => {}} // Sorting state handled via table headers ideally, but we can hook this up later if needed.
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
