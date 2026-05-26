"use client";

import { X } from "lucide-react";
import { useState, useEffect } from "react";
import { getPlans, addCreatorsToList } from "@/app/plans/actions";

export function SaveToListModal({
  isOpen,
  onClose,
  selectedCreatorIds,
  onSuccess
}: {
  isOpen: boolean;
  onClose: () => void;
  selectedCreatorIds: string[];
  onSuccess: () => void;
}) {
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedListId, setSelectedListId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      getPlans().then((data) => {
        setPlans(data);
        setIsLoading(false);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedListId) return;
    
    setIsSubmitting(true);
    try {
      await addCreatorsToList(selectedListId, selectedCreatorIds);
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to save to list.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">Add to Plan</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <div className="text-[14px] text-slate-600 mb-4">
              Saving <span className="font-bold text-slate-900">{selectedCreatorIds.length} creator(s)</span> to your list.
            </div>

            <label className="block text-[13px] font-bold text-slate-700 mb-2">Select a List <span className="text-red-500">*</span></label>
            
            {isLoading ? (
              <div className="h-10 border border-slate-200 rounded-lg flex items-center justify-center bg-slate-50">
                <span className="text-[13px] text-slate-500">Loading your plans...</span>
              </div>
            ) : (
              <select
                required
                value={selectedListId}
                onChange={(e) => setSelectedListId(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-[14px] outline-none focus:border-[#7c829e] focus:ring-1 focus:ring-[#7c829e] bg-white text-slate-900 font-medium"
              >
                <option value="" disabled>-- Choose a Plan & List --</option>
                {plans.map((plan) => (
                  <optgroup key={plan.id} label={`Plan: ${plan.name}`}>
                    {plan.lists.map((list: any) => (
                      <option key={list.id} value={list.id}>
                        ↳ {list.name} ({list.creator_ids?.length || 0} creators)
                      </option>
                    ))}
                    {plan.lists.length === 0 && (
                      <option disabled>↳ No lists in this plan yet</option>
                    )}
                  </optgroup>
                ))}
              </select>
            )}
            
            {!isLoading && plans.length === 0 && (
              <p className="text-[12px] text-red-500 mt-2 font-medium">You don't have any plans yet. Create one from the Plans dashboard first.</p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 px-4 py-2.5 rounded-lg text-[14px] font-semibold transition"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isSubmitting || !selectedListId}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-lg text-[14px] font-semibold transition disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Save Creators"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
