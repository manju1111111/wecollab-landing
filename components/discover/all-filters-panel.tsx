"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Check } from "lucide-react";
import { CREATOR_CATEGORIES } from "@/data/creator-categories";

type AllFiltersPanelProps = {
  isOpen: boolean;
  onClose: () => void;
  selectedSubCats: string[];
  onToggleSubCat: (subCat: string) => void;
};

export function AllFiltersPanel({
  isOpen,
  onClose,
  selectedSubCats,
  onToggleSubCat,
}: AllFiltersPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return CREATOR_CATEGORIES;

    const query = searchQuery.toLowerCase();
    
    return CREATOR_CATEGORIES.map((group) => {
      // If the group name matches, return the whole group
      if (group.groupName.toLowerCase().includes(query)) {
        return group;
      }
      
      // Otherwise, filter the subcategories
      const matchingSubCats = group.subCategories.filter((subCat) =>
        subCat.toLowerCase().includes(query)
      );

      if (matchingSubCats.length > 0) {
        return {
          ...group,
          subCategories: matchingSubCats,
        };
      }
      return null;
    }).filter(Boolean) as typeof CREATOR_CATEGORIES;
  }, [searchQuery]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm"
          />

          {/* Slide-over Panel */}
          <motion.div
            initial={{ x: "100%", boxShadow: "-20px 0 25px -5px rgba(0, 0, 0, 0)" }}
            animate={{ x: 0, boxShadow: "-20px 0 25px -5px rgba(0, 0, 0, 0.1)" }}
            exit={{ x: "100%", boxShadow: "-20px 0 25px -5px rgba(0, 0, 0, 0)" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h2 className="text-lg font-bold text-slate-900">All Filters</h2>
              <button
                onClick={onClose}
                className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Sticky Search Bar */}
            <div className="border-b border-slate-200 bg-slate-50/50 p-4">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search sub-categories..."
                  className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                  autoFocus
                />
              </div>
            </div>

            {/* Filter List */}
            <div className="flex-1 overflow-y-auto p-4">
              {filteredCategories.length > 0 ? (
                <div className="flex flex-col gap-6">
                  {filteredCategories.map((group) => (
                    <div key={group.groupName}>
                      <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                        {group.groupName}
                      </h3>
                      <div className="flex flex-col gap-1">
                        {group.subCategories.map((subCat) => {
                          const isSelected = selectedSubCats.includes(subCat);
                          return (
                            <button
                              key={subCat}
                              onClick={() => onToggleSubCat(subCat)}
                              className={`flex items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                                isSelected
                                  ? "bg-violet-50 font-medium text-violet-700"
                                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                              }`}
                            >
                              {subCat}
                              {isSelected && <Check className="h-4 w-4 text-violet-600" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-20 text-center">
                  <p className="text-sm font-medium text-slate-900">No results found</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Try adjusting your search query.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 bg-slate-50 p-4">
              <button
                onClick={onClose}
                className="w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-600"
              >
                View Results
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
