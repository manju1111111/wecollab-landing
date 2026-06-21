"use client";

import { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { useAdminProfile } from "@/components/admin/layout/admin-profile-context";

export function PageHeader() {
  const { profile } = useAdminProfile();
  const [time, setTime] = useState(new Date());
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000); // update every second so minute changes happen exactly on time
    return () => clearInterval(interval);
  }, []);

  const timeString = time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const dateString = time.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const firstName = profile.fullName ? profile.fullName.split(" ")[0] : "Admin";

  return (
    <div className="flex items-start justify-between w-full">
      <div>
        <h1 className="text-3xl font-bold text-[#111827] tracking-tight flex items-center gap-2">
          Welcome back, {isClient ? firstName : "Admin"}! <span className="text-2xl">👋</span>
        </h1>
        <p className="text-[#64748b] font-medium mt-1">
          Here's what's happening with WeCollab today.
        </p>
      </div>
      <div className="text-right">
        <div className="flex items-center gap-1.5 text-[#111827] justify-end">
          <Clock className="h-4 w-4" />
          <span className="text-lg font-bold">
            {isClient ? timeString : "10:24 AM"}
          </span>
        </div>
        <p className="text-[#64748b] text-[13px] font-medium mt-0.5">
          {isClient ? dateString : "Monday, 26 May 2024"}
        </p>
      </div>
    </div>
  );
}
