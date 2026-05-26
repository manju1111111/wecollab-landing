"use client";

import { useState, useEffect } from "react";
import { Play, Pause, RefreshCcw, RotateCcw } from "lucide-react";

export function TimeTracker() {
  const [time, setTime] = useState(13522); // Starts at 03:45:22 by default
  const [isActive, setIsActive] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const savedTime = localStorage.getItem("tracker_time");
    const savedActive = localStorage.getItem("tracker_active");
    if (savedTime !== null) {
      setTime(parseInt(savedTime, 10));
    }
    if (savedActive === "true") {
      setIsActive(true);
    }
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isActive) {
      interval = setInterval(() => {
        setTime((prevTime) => {
          const newTime = prevTime + 1;
          localStorage.setItem("tracker_time", newTime.toString());
          return newTime;
        });
      }, 1000);
      localStorage.setItem("tracker_active", "true");
    } else {
      if (interval) clearInterval(interval);
      localStorage.setItem("tracker_active", "false");
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive]);

  const toggle = () => setIsActive(!isActive);

  const reset = () => {
    setIsActive(false);
    setTime(0);
    localStorage.setItem("tracker_time", "0");
    localStorage.setItem("tracker_active", "false");
  };

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  // 8 hours = 28,800 seconds
  const goal = 28800;
  const progressPercent = Math.min((time / goal) * 100, 100);
  const circumference = 2 * Math.PI * 45; // 282.74
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 h-[280px] flex flex-col relative overflow-hidden group">
      <div className="flex justify-between items-start">
        <h3 className="text-[14px] font-bold text-slate-900">Time Tracker</h3>
        <button 
          onClick={reset}
          className="h-6 w-6 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 hover:bg-slate-100 transition-colors"
          title="Reset Timer"
        >
          <RotateCcw className="h-3 w-3 text-slate-400" />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center relative mt-4">
        {/* Circular Progress Ring */}
        <div className="relative w-40 h-40">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="#f1f5f9" strokeWidth="8" />
            {isClient && (
              <circle 
                cx="50" 
                cy="50" 
                r="45" 
                fill="none" 
                stroke="#3b82f6" 
                strokeWidth="8" 
                strokeDasharray={circumference} 
                strokeDashoffset={strokeDashoffset} 
                strokeLinecap="round" 
                className="transition-all duration-1000 ease-linear"
              />
            )}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">
              {isClient ? formatTime(time) : "03:45:22"}
            </span>
            <span className="text-[11px] font-medium text-slate-400">
              {isActive ? "Tracking..." : "Paused"}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 mt-6">
          <button 
            onClick={() => setIsActive(true)}
            className={`h-10 w-10 rounded-full flex items-center justify-center transition-all shadow-sm ${isActive ? 'bg-blue-50 text-blue-500' : 'bg-slate-50 text-slate-400 hover:bg-blue-500 hover:text-white'}`}
          >
            <Play className="h-4 w-4 fill-current ml-0.5" />
          </button>
          <button 
            onClick={() => setIsActive(false)}
            className={`h-10 w-10 rounded-full flex items-center justify-center transition-all shadow-sm ${!isActive ? 'bg-amber-50 text-amber-500' : 'bg-slate-50 text-slate-400 hover:bg-amber-500 hover:text-white'}`}
          >
            <Pause className="h-4 w-4 fill-current" />
          </button>
        </div>
      </div>
      
      {/* Decorative timer icon bottom right */}
      <div className={`absolute bottom-4 right-4 h-8 w-8 rounded-full text-white flex items-center justify-center shadow-lg transition-colors ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-[#0b3b84]'}`}>
        <RefreshCcw className={`h-4 w-4 ${isActive ? 'animate-spin-slow' : ''}`} />
      </div>
    </div>
  );
}
