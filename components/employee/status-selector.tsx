"use client";

import { useState } from "react";

export function StatusSelector() {
  const [status, setStatus] = useState<"online" | "break">("online");

  return (
    <div className="px-3 mb-2">
      <select 
        value={status}
        onChange={(e) => {
          const newStatus = e.target.value as "online" | "break";
          setStatus(newStatus);
          const event = new CustomEvent("employee-status-changed", { detail: { status: newStatus } });
          window.dispatchEvent(event);
        }}
        className="w-full bg-slate-50 border border-slate-200/60 rounded-xl px-2.5 py-1.5 text-[11px] font-black text-slate-600 outline-none hover:bg-slate-100 transition cursor-pointer"
      >
        <option value="online">🟢 Status: Online</option>
        <option value="break">🟡 Status: Break</option>
      </select>
    </div>
  );
}
