"use client";

import { useState, useEffect, useRef } from "react";
import { Clock } from "lucide-react";
import confetti from "canvas-confetti";
import { LAUNCH_DATE } from "@/constants/limit";

interface LaunchCountdownProps {
  onLaunch?: () => void;
}

export function LaunchCountdown({ onLaunch }: LaunchCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);
  const confettiFired = useRef(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const difference = LAUNCH_DATE - now;

      if (difference <= 0) {
        // Trigger confetti effect when timer reaches zero
        if (!confettiFired.current) {
          confettiFired.current = true;
          triggerLaunchConfetti();
          // Notify parent component that launch has occurred
          onLaunch?.();
        }
        
        return null;
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
      };
    };

    const triggerLaunchConfetti = () => {
      const duration = 5 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

      const randomInRange = (min: number, max: number) =>
        Math.random() * (max - min) + min;

      const interval = window.setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        
        // Fireworks from left
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        });
        
        // Fireworks from right
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        });
        
        // Center burst
        confetti({
          ...defaults,
          particleCount: 20,
          origin: { x: 0.5, y: 0.5 },
        });
      }, 250);

      // Initial burst
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { x: 0.5, y: 0.5 },
      });
    };

    // Calculate immediately
    setTimeLeft(calculateTimeLeft());

    // Update every second
    const interval = setInterval(() => {
      const time = calculateTimeLeft();
      setTimeLeft(time);
      if (!time) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [onLaunch]);

  // Don't render if launched (timeLeft is null when launched)
  if (!timeLeft) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <div className="text-center space-y-8 px-4">
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Clock className="h-8 w-8 text-primary animate-pulse" />
            <h1 className="text-3xl md:text-4xl font-bold">Launching Soon</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            We're preparing something amazing for you
          </p>
        </div>
        
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center justify-center gap-4 md:gap-10 flex-wrap">
            <div className="text-4xl md:text-5xl font-bold text-foreground tabular-nums min-w-12 text-center leading-none">
              {String(timeLeft.days).padStart(2, "0")}
            </div>
            <Separator />
            <div className="text-4xl md:text-5xl font-bold text-foreground tabular-nums min-w-12 text-center leading-none">
              {String(timeLeft.hours).padStart(2, "0")}
            </div>
            <Separator />
            <div className="text-4xl md:text-5xl font-bold text-foreground tabular-nums min-w-12 text-center leading-none">
              {String(timeLeft.minutes).padStart(2, "0")}
            </div>
            <Separator />
            <div className="text-4xl md:text-5xl font-bold text-foreground tabular-nums min-w-12 text-center leading-none">
              {String(timeLeft.seconds).padStart(2, "0")}
            </div>
          </div>
          <div className="flex items-center justify-center gap-4 md:gap-10 flex-wrap mt-2">
            <div className="text-sm text-muted-foreground uppercase tracking-wide min-w-12 text-center">Days</div>
            <div className="min-w-0" />
            <div className="text-sm text-muted-foreground uppercase tracking-wide min-w-12 text-center">Hours</div>
            <div className="min-w-0" />
            <div className="text-sm text-muted-foreground uppercase tracking-wide min-w-12 text-center">Minutes</div>
            <div className="min-w-0" />
            <div className="text-sm text-muted-foreground uppercase tracking-wide min-w-12 text-center">Seconds</div>
          </div>
        </div>

        <div className="text-sm text-muted-foreground">
          <p>Launch Date: January 8, 2026 at 10:00 AM</p>
        </div>
      </div>
    </div>
  );
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="text-4xl md:text-5xl font-bold text-foreground tabular-nums min-w-12 text-center leading-none">
        {String(value).padStart(2, "0")}
      </div>
      <div className="text-sm text-muted-foreground uppercase tracking-wide mt-2">
        {label}
      </div>
    </div>
  );
}

function Separator() {
  return (
    <span className="text-muted-foreground text-3xl md:text-4xl font-bold leading-none">:</span>
  );
}

