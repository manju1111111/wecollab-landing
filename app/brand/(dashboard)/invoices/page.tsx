"use client";

import { useState, useEffect } from "react";
import { FileText, CheckCircle2, AlertCircle, DollarSign, Clock, Check, ArrowRight, Sparkles } from "lucide-react";
import { fetchBrandInvoices, settleInvoice } from "@/app/brand/billing-actions";
import { createClient } from "@/lib/supabase/client";

interface InvoiceRecord {
  id: string;
  campaign_name: string;
  creator_name: string;
  amount: number;
  status: "paid" | "unpaid" | "overdue";
  due_date: string;
}

export default function BrandInvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [settlingId, setSettlingId] = useState<string | null>(null);
  const [settledId, setSettledId] = useState<string | null>(null);

  const loadInvoices = async () => {
    try {
      const sessionCookie = document.cookie
        .split("; ")
        .find((row) => row.startsWith("brand_session="))
        ?.split("=")[1];

      if (!sessionCookie) return;
      const session = JSON.parse(decodeURIComponent(sessionCookie));

      const res = await fetchBrandInvoices(session.id);
      if (res.invoices) {
        setInvoices(res.invoices as InvoiceRecord[]);
        setIsDemo(!!res.isMock);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const handlePay = async (id: string) => {
    setSettlingId(id);
    
    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Optimistic Update
    setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, status: "paid" } : inv));
    setSettlingId(null);
    setSettledId(id);
    
    setTimeout(() => setSettledId(null), 2000);

    if (isDemo) return;

    try {
      await settleInvoice(id);
    } catch (e) {
      console.error(e);
    }
  };

  const totalInvoiced = invoices.reduce((s, i) => s + i.amount, 0);
  const totalPaid = invoices.filter(i => i.status === "paid").reduce((s, i) => s + i.amount, 0);
  const totalOutstanding = invoices.filter(i => i.status !== "paid").reduce((s, i) => s + i.amount, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
      case "overdue":
        return "bg-rose-500/10 border-rose-500/20 text-rose-400";
      default:
        return "bg-amber-500/10 border-amber-500/20 text-amber-400";
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full font-sans text-slate-200">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2">
          Billing & Invoices
        </h1>
        <p className="text-[13px] text-slate-400 font-semibold mt-1">
          Review campaign payouts, process invoice statements, and settle outstanding balances.
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <span className="p-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center shrink-0">
              <DollarSign className="h-5 w-5" />
            </span>
            <span className="text-[9px] font-black uppercase tracking-wider bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full">
              Invoiced
            </span>
          </div>
          <h3 className="text-3xl font-black text-white">₹{totalInvoiced.toLocaleString()}</h3>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Total Billable</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <span className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </span>
            <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-50/5 text-emerald-400 px-2 py-0.5 rounded-full">
              Settled
            </span>
          </div>
          <h3 className="text-3xl font-black text-white">₹{totalPaid.toLocaleString()}</h3>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Total Settled</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <span className="p-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl flex items-center justify-center shrink-0">
              <Clock className="h-5 w-5" />
            </span>
            <span className="text-[9px] font-black uppercase tracking-wider bg-rose-50/5 text-rose-400 px-2 py-0.5 rounded-full">
              Outstanding
            </span>
          </div>
          <h3 className="text-3xl font-black text-white">₹{totalOutstanding.toLocaleString()}</h3>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Pending Balance</p>
        </div>
      </div>

      {/* Invoices List */}
      <div className="bg-slate-900 border border-slate-800 rounded-[32px] p-6 shadow-xl flex flex-col gap-6">
        <div>
          <h3 className="text-[15px] font-black text-white flex items-center gap-2">
            Invoice Statements Audit Ledger
            {isDemo && (
              <span className="text-[9px] font-bold bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                Demo
              </span>
            )}
          </h3>
          <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Pay, audit, and track individual creator campaign payments.</p>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-20 flex justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-800 border-t-indigo-500"></div>
            </div>
          ) : invoices.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-slate-500 gap-1.5">
              <FileText className="h-8 w-8 stroke-[1.5]" />
              <p className="text-[12px] font-bold">No statements generated</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800/80 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                  <th className="pb-3 pl-3">Campaign Target</th>
                  <th className="pb-3">Creator Partner</th>
                  <th className="pb-3">Due Date</th>
                  <th className="pb-3 text-right">Amount Due</th>
                  <th className="pb-3 text-center">Status</th>
                  <th className="pb-3 text-center pr-3">Payment Settlement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="text-[12px] font-bold text-slate-300 hover:bg-slate-950/20 transition">
                    <td className="py-4.5 pl-3">
                      <div className="flex items-center gap-3">
                        <span className="h-7 w-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                          <FileText className="h-4 w-4" />
                        </span>
                        <span>{inv.campaign_name}</span>
                      </div>
                    </td>
                    <td className="py-4.5 font-bold text-white">{inv.creator_name}</td>
                    <td className="py-4.5 font-mono text-[11px] text-slate-400">
                      {new Date(inv.due_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="py-4.5 text-right font-black text-white">₹{inv.amount.toLocaleString()}</td>
                    <td className="py-4.5 text-center">
                      <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${getStatusColor(inv.status)}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-4.5 text-center pr-3">
                      {inv.status === "paid" ? (
                        <span className="text-[11px] text-emerald-400 flex items-center gap-1 justify-center">
                          <Check className="h-4 w-4" /> Settled
                        </span>
                      ) : (
                        <button
                          disabled={settlingId === inv.id}
                          onClick={() => handlePay(inv.id)}
                          className="bg-indigo-600 hover:bg-indigo-750 text-white font-bold py-1.5 px-3 rounded-xl text-[11px] transition inline-flex items-center gap-1 disabled:opacity-50"
                        >
                          {settlingId === inv.id ? (
                            <div className="h-3 w-3 border border-white/30 border-t-white animate-spin rounded-full"></div>
                          ) : settledId === inv.id ? (
                            <Check className="h-3 w-3 animate-pulse" />
                          ) : (
                            <>Pay Out <ArrowRight className="h-3 w-3" /></>
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

    </div>
  );
}
