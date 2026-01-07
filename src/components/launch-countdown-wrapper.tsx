"use client";

import { useState, useEffect } from "react";
import { LaunchCountdown } from "./launch-countdown";

export function LaunchCountdownWrapper({ children }: { children: React.ReactNode }) {
  const [isLaunched, setIsLaunched] = useState(false);

  useEffect(() => {
    const checkLaunchDate = () => {
      const launchDate = new Date("2026-01-08T10:00:00").getTime();
      const now = new Date().getTime();
      
      if (now >= launchDate) {
        setIsLaunched(true);
      }
    };

    // Check immediately
    checkLaunchDate();
    
    // Check every second
    const interval = setInterval(checkLaunchDate, 1000);

    return () => clearInterval(interval);
  }, []);

  // Show only countdown if not launched
  if (!isLaunched) {
    return <LaunchCountdown />;
  }

  // Show normal app after launch
  return <main className="min-h-screen">{children}</main>;
}

