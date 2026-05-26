"use client";

import { X, Sparkles, Upload } from "lucide-react";
import { useState } from "react";

export function AddCreatorModal({ 
  isOpen, 
  onClose,
  onSubmit 
}: { 
  isOpen: boolean; 
  onClose: () => void;
  onSubmit: (data: any) => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Gather form data
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    
    await onSubmit(data);
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
            <h2 className="text-[18px] font-bold text-slate-900">Add New Creator</h2>
            <p className="text-[13px] text-slate-500 font-medium mt-0.5">Quickly add a creator to your database.</p>
          </div>
          <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form id="add-creator-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-6">
          <div className="flex gap-6 mb-8">
            {/* Avatar Upload (Mock) */}
            <div className="w-24 shrink-0 flex flex-col items-center gap-2">
              <div className="h-24 w-24 rounded-full border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-slate-400 hover:border-indigo-400 hover:bg-indigo-50 transition-colors cursor-pointer group">
                <Upload className="h-5 w-5 group-hover:text-indigo-500 mb-1" />
                <span className="text-[10px] font-bold uppercase tracking-wider group-hover:text-indigo-600">Upload</span>
              </div>
            </div>

            {/* Basic Info */}
            <div className="flex-1 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[12px] font-bold text-slate-700 mb-1.5 block">Full Name *</label>
                  <input required name="name" type="text" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-[14px] outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" placeholder="e.g. Jane Doe" />
                </div>
                <div>
                  <label className="text-[12px] font-bold text-slate-700 mb-1.5 block">Username *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">@</span>
                    <input required name="username" type="text" className="w-full pl-7 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-[14px] outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" placeholder="janedoe" />
                  </div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[12px] font-bold text-slate-700 block">Bio / Description</label>
                  <button type="button" className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 bg-indigo-50 px-2 py-0.5 rounded-full">
                    <Sparkles className="h-3 w-3" /> Auto-categorize
                  </button>
                </div>
                <textarea name="bio" rows={3} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-[14px] outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none" placeholder="Paste their Instagram bio here..." />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6 mb-8">
            <div className="col-span-3 pb-2 border-b border-slate-100">
              <h3 className="text-[14px] font-bold text-slate-900">Metrics & Location</h3>
            </div>
            
            <div>
              <label className="text-[12px] font-bold text-slate-700 mb-1.5 block">Followers</label>
              <input name="followers_count" type="number" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-[14px] outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" placeholder="e.g. 150000" />
            </div>
            <div>
              <label className="text-[12px] font-bold text-slate-700 mb-1.5 block">Avg Views</label>
              <input name="avg_views" type="number" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-[14px] outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" placeholder="e.g. 45000" />
            </div>
            <div>
              <label className="text-[12px] font-bold text-slate-700 mb-1.5 block">Engagement Rate (%)</label>
              <input name="engagement_rate" type="number" step="0.01" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-[14px] outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" placeholder="e.g. 3.5" />
            </div>

            <div>
              <label className="text-[12px] font-bold text-slate-700 mb-1.5 block">Location</label>
              <input name="location" type="text" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-[14px] outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" placeholder="City, Country" />
            </div>
            <div>
              <label className="text-[12px] font-bold text-slate-700 mb-1.5 block">Language</label>
              <input name="language" type="text" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-[14px] outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" placeholder="e.g. English" />
            </div>
            <div>
              <label className="text-[12px] font-bold text-slate-700 mb-1.5 block">Gender</label>
              <select name="gender" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-[14px] outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
                <option value="">Select...</option>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="col-span-2 pb-2 border-b border-slate-100">
              <h3 className="text-[14px] font-bold text-slate-900">Business & Contact</h3>
            </div>
            
            <div>
              <label className="text-[12px] font-bold text-slate-700 mb-1.5 block">Email</label>
              <input name="email" type="email" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-[14px] outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" placeholder="collab@creator.com" />
            </div>
            <div>
              <label className="text-[12px] font-bold text-slate-700 mb-1.5 block">Pricing / Post ($)</label>
              <input name="collaboration_pricing" type="number" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-[14px] outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" placeholder="e.g. 1500" />
            </div>

            <div className="col-span-2 flex items-center gap-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="has_manager" value="true" className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 h-4 w-4" />
                <span className="text-[13px] font-semibold text-slate-700">Has Manager</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="verified" value="true" className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 h-4 w-4" />
                <span className="text-[13px] font-semibold text-slate-700">Verified</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="brand_safe" value="true" defaultChecked className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 h-4 w-4" />
                <span className="text-[13px] font-semibold text-slate-700">Brand Safe</span>
              </label>
            </div>
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
            {isSubmitting ? "Saving..." : "Save Creator"}
          </button>
        </div>
        
      </div>
    </div>
  );
}
