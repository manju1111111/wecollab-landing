"use client";

import { useState, useEffect } from "react";
import { X, Send, Award, FileText, Sparkles, CheckCircle2 } from "lucide-react";
import { sendCreatorPitch } from "@/app/employee/pitch-actions";

interface PitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId: string;
  employeeName: string;
  creatorId: string;
  creatorName: string;
  onSuccess?: () => void;
}

type TemplateType = "initial_outreach" | "pricing_offer" | "campaign_brief";

export function PitchModal({
  isOpen,
  onClose,
  employeeId,
  employeeName,
  creatorId,
  creatorName,
  onSuccess
}: PitchModalProps) {
  const [template, setTemplate] = useState<TemplateType>("initial_outreach");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Core Templates builder
  const getTemplateContent = (type: TemplateType) => {
    const firstName = creatorName.split(" ")[0];
    switch (type) {
      case "initial_outreach":
        return {
          subject: `Collaboration Query — WeCollab Opportunities`,
          body: `Hi ${firstName}!\n\nWe absolutely loved your recent reels and content! We represent premium global brands and would love to discuss a partnership deal on our upcoming activewear campaigns.\n\nLet us know if you're open to collaboration opportunities!\n\nBest,\n${employeeName}\nWeCollab Partnerships Team`
        };
      case "pricing_offer":
        return {
          subject: `Compensation Proposal — Brand Sponsorship`,
          body: `Hi ${firstName}!\n\nFollowing up on our campaign brief, we are excited to propose a compensation package of ₹6,50,000 for 1 Dedicated Reel and 2 High-Quality Instagram Stories.\n\nLet us know if these pricing terms work for your portfolio so we can send the agreement over!\n\nBest,\n${employeeName}\nWeCollab Operations Team`
        };
      case "campaign_brief":
        return {
          subject: `Campaign Brief Specifications — Brand Collab`,
          body: `Hi ${firstName}!\n\nHere are the active guidelines and deliverables for our upcoming athletic footwear launch:\n- Deliverable: 1 high-resolution IG Reel showcasing product usability in training.\n- Target Schedule: Deliver draft reels within 7 days of package arrival.\n- Exclusivity: 30 days activewear branding exclusivity.\n\nLet us know if you are comfortable with these campaign specifications.\n\nBest,\n${employeeName}\nWeCollab Partnerships`
        };
    }
  };

  // Sync templates on selector update
  useEffect(() => {
    const content = getTemplateContent(template);
    setSubject(content.subject);
    setBody(content.body);
  }, [template, creatorName, employeeName]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await sendCreatorPitch({
        employeeId,
        creatorId,
        templateType: template,
        subject,
        body
      });

      if (res.error) {
        setError(res.error);
        setLoading(false);
      } else {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setLoading(false);
          if (onSuccess) onSuccess();
          onClose();
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message || "Failed to submit proposal pitch.");
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[32px] max-w-xl w-full p-8 md:p-10 shadow-2xl flex flex-col relative overflow-hidden text-slate-800 font-sans">
        
        {/* Header */}
        <div className="flex justify-between items-start mb-6 shrink-0">
          <div>
            <h3 className="text-[16px] font-black text-slate-900 flex items-center gap-1.5">
              Pitch Creator <Sparkles className="h-4.5 w-4.5 text-indigo-500 fill-indigo-100" />
            </h3>
            <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Pitching brand details to {creatorName}.</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 hover:bg-slate-50 text-slate-400 hover:text-slate-700 rounded-xl transition"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {success ? (
          <div className="py-24 flex flex-col items-center justify-center text-center">
            <CheckCircle2 className="h-16 w-16 text-emerald-500 mb-4 animate-bounce" />
            <h4 className="text-[16px] font-black text-slate-900 mb-1">Outreach Dispatched!</h4>
            <p className="text-[12px] text-slate-400 font-medium">Logged outreach in CRM histories.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 overflow-y-auto">
            
            {error && (
              <div className="bg-rose-50 border border-rose-100 text-rose-500 text-[11px] font-bold rounded-2xl p-3.5">
                ⚠️ {error}
              </div>
            )}

            {/* Template selector */}
            <div className="flex bg-slate-50 border border-slate-100 rounded-2xl p-1 shrink-0">
              <button
                type="button"
                onClick={() => setTemplate("initial_outreach")}
                className={`flex-1 py-2 rounded-xl text-[11px] font-black transition flex items-center justify-center gap-1 ${
                  template === "initial_outreach" 
                    ? "bg-white text-indigo-600 shadow-sm border border-slate-100"
                    : "text-slate-400 hover:text-slate-650"
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" /> Collab Pitch
              </button>
              <button
                type="button"
                onClick={() => setTemplate("pricing_offer")}
                className={`flex-1 py-2 rounded-xl text-[11px] font-black transition flex items-center justify-center gap-1 ${
                  template === "pricing_offer" 
                    ? "bg-white text-indigo-600 shadow-sm border border-slate-100"
                    : "text-slate-400 hover:text-slate-650"
                }`}
              >
                <Award className="h-3.5 w-3.5" /> Pricing Offer
              </button>
              <button
                type="button"
                onClick={() => setTemplate("campaign_brief")}
                className={`flex-1 py-2 rounded-xl text-[11px] font-black transition flex items-center justify-center gap-1 ${
                  template === "campaign_brief" 
                    ? "bg-white text-indigo-600 shadow-sm border border-slate-100"
                    : "text-slate-400 hover:text-slate-650"
                }`}
              >
                <FileText className="h-3.5 w-3.5" /> Camp Brief
              </button>
            </div>

            {/* Subject */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Email Subject</label>
              <input
                required
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 text-[12px] font-bold text-slate-700 outline-none focus:border-indigo-500 transition"
              />
            </div>

            {/* Body */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Email Body</label>
              <textarea
                required
                rows={6}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3.5 px-4 text-[12px] font-bold text-slate-700 outline-none focus:border-indigo-500 transition resize-none font-sans leading-relaxed"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4 mt-3.5 shrink-0 pt-4 border-t border-slate-50">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-slate-50 border border-slate-150 hover:bg-slate-100 text-slate-500 hover:text-slate-700 font-bold py-2.5 px-4 rounded-xl text-[12px] transition text-center"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl text-[12px] transition flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50"
              >
                {loading ? (
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white animate-spin rounded-full"></div>
                ) : (
                  <>
                    Send Outreach <Send className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}
