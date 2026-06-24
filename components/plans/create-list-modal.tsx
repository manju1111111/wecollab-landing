"use client";

import { X, Lightbulb } from "lucide-react";
import { useState } from "react";
import { createList } from "../../app/plans/actions";

const COLORS = ["#ef4444", "#f59e0b", "#84cc16", "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899", "#0f172a"];
const PLATFORMS = ["Instagram", "YouTube", "Twitter", "Facebook"];

export function CreateListModal({
  isOpen,
  onClose,
  planId,
}: {
  isOpen: boolean;
  onClose: () => void;
  planId: string;
}) {
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [selectedPlatform, setSelectedPlatform] = useState(PLATFORMS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    formData.append("color", selectedColor);
    formData.append("platform", selectedPlatform);
    
    try {
      await createList(planId, formData);
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to create list");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end">
      <div 
        className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />

      <div className="relative w-full max-w-[500px] h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">Create New List</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 flex flex-col">
          <div className="space-y-8 flex-1">
            <h3 className="text-[15px] font-bold text-slate-900 border-b border-slate-100 pb-2">List Details</h3>
            
            {/* Name */}
            <div>
              <label className="block text-[13px] font-medium text-slate-500 mb-2">List Name</label>
              <input
                type="text"
                name="name"
                required
                placeholder="Enter list name"
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-[14px] outline-none focus:border-[#7c829e] focus:ring-1 focus:ring-[#7c829e]"
              />
            </div>

            {/* Color */}
            <div>
              <label className="block text-[13px] font-medium text-slate-500 mb-2">Choose Color</label>
              <div className="flex items-center gap-3">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setSelectedColor(c)}
                    className={`h-6 w-6 rounded-full transition-all ${selectedColor === c ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : 'hover:scale-110'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {/* Platform */}
            <div>
              <label className="block text-[13px] font-medium text-slate-500 mb-2">Choose a Platform</label>
              <div className="grid grid-cols-4 gap-2">
                {PLATFORMS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setSelectedPlatform(p)}
                    className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-lg border text-[13px] font-medium transition ${
                      selectedPlatform === p 
                        ? 'border-slate-800 text-slate-900 bg-slate-50' 
                        : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {/* Placeholder icons based on name */}
                    {p === 'Instagram' && <span className="text-pink-500 font-bold">IG</span>}
                    {p === 'YouTube' && <span className="text-red-500 font-bold">YT</span>}
                    {p === 'Twitter' && <span className="text-blue-400 font-bold">TW</span>}
                    {p === 'Facebook' && <span className="text-blue-600 font-bold">FB</span>}
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Warning Box */}
            <div className="bg-[#fff9eb] border border-[#fde68a] rounded-xl p-4 flex gap-3">
              <Lightbulb className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
              <div className="text-[13px] text-slate-700 font-medium leading-relaxed">
                Setting deliverables for your plan allows you to reach out to influencers to obtain cost estimates and gain access to CPE and CPV metrics.<br/><br/>
                Deliverables, Posts & Costs will be applied to all the profiles in the list.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-6 mt-6 border-t border-slate-100">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 px-4 py-2.5 rounded-lg text-[14px] font-semibold transition"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-[#7c829e] hover:bg-[#6b718b] text-white px-4 py-2.5 rounded-lg text-[14px] font-semibold transition disabled:opacity-50"
            >
              {isSubmitting ? "Creating..." : "Create List"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
