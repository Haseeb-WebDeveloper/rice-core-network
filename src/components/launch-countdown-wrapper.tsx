"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { LaunchCountdown } from "./launch-countdown";
import { LAUNCH_DATE } from "@/constants/limit";

const LAUNCH_STORAGE_KEY = "rice-core-launched";

export function LaunchCountdownWrapper({ children }: { children: React.ReactNode }) {
  const [isLaunched, setIsLaunched] = useState(() => {
    // Check localStorage on initial render
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(LAUNCH_STORAGE_KEY);
      if (stored === "true") {
        return true;
      }
    }
    // Also check if launch date has passed
    return new Date().getTime() >= LAUNCH_DATE;
  });
  const router = useRouter();

  const handleLaunch = useCallback(() => {
    setIsLaunched(true);
    // Persist to localStorage so it stays launched across navigation
    if (typeof window !== "undefined") {
      localStorage.setItem(LAUNCH_STORAGE_KEY, "true");
    }
    // Force router refresh to ensure all pages update
    router.refresh();
  }, [router]);

  useEffect(() => {
    const checkLaunchDate = () => {
      const now = new Date().getTime();
      
      if (now >= LAUNCH_DATE && !isLaunched) {
        handleLaunch();
      }
    };

    // Check immediately
    checkLaunchDate();
    
    // Check every second
    const interval = setInterval(checkLaunchDate, 1000);

    return () => clearInterval(interval);
  }, [handleLaunch, isLaunched]);

  // Show only countdown if not launched
  if (!isLaunched) {
    return <LaunchCountdown onLaunch={handleLaunch} />;
  }

  // Show normal app after launch
  return <main className="min-h-screen">{children}</main>;
}

