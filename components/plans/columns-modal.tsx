"use client";

import { X, Check } from "lucide-react";

export type ColumnOption = {
  id: string;
  label: string;
  checked: boolean;
};

export type ColumnCategory = {
  id: string;
  title: string;
  options: ColumnOption[];
};

export function ColumnsModal({
  isOpen,
  onClose,
  categories,
  onToggleColumn,
  onToggleCategory,
}: {
  isOpen: boolean;
  onClose: () => void;
  categories: ColumnCategory[];
  onToggleColumn: (categoryId: string, optionId: string) => void;
  onToggleCategory: (categoryId: string, selectAll: boolean) => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />

      {/* Slide-over panel */}
      <div className="relative w-full max-w-2xl h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">Columns Visible</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-10">
          {categories.map((category) => {
            const allSelected = category.options.every(o => o.checked);
            
            return (
              <div key={category.id}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[15px] font-bold text-slate-800">{category.title}</h3>
                  <button 
                    onClick={() => onToggleCategory(category.id, !allSelected)}
                    className="flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-semibold text-orange-500 hover:bg-orange-50 transition border border-orange-200"
                  >
                    <Check className="h-3 w-3" strokeWidth={3} />
                    {allSelected ? "Deselect All" : "Select All"}
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                  {category.options.map((option) => (
                    <label key={option.id} className="flex items-center gap-3 cursor-pointer group">
                      <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                        option.checked 
                          ? 'border-slate-800 bg-slate-800 text-white' 
                          : 'border-slate-300 bg-white text-transparent group-hover:border-slate-400'
                      }`}>
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </div>
                      <span className="text-[13px] font-medium text-slate-700 select-none group-hover:text-slate-900">
                        {option.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-3 px-6 py-4 border-t border-slate-100 bg-white">
          <button 
            onClick={onClose}
            className="flex-1 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 px-4 py-2.5 rounded-lg text-[14px] font-semibold transition"
          >
            Cancel
          </button>
          <button 
            onClick={onClose}
            className="flex-1 bg-[#7c829e] hover:bg-[#6b718b] text-white px-4 py-2.5 rounded-lg text-[14px] font-semibold transition"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
