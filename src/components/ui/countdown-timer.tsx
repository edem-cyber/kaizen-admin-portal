"use client";

import { useState, useEffect } from "react";

interface TimeLeft {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
}

interface CountdownTimerProps {
    targetDate: Date;
    className?: string;
}

function calculateTimeLeft(targetDate: Date): TimeLeft {
    const now = new Date().getTime();
    const target = targetDate.getTime();
    const difference = target - now;

    if (difference <= 0) {
        return {
            days: 0,
            hours: 0,
            minutes: 0,
            seconds: 0,
        };
    }

    return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
    };
}

export function CountdownTimer({ targetDate, className = "" }: CountdownTimerProps) {
    const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => ({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
    }));

    useEffect(() => {
        // Calculate initial time on client to avoid hydration mismatch
        const updateTimer = () => {
            setTimeLeft(calculateTimeLeft(targetDate));
        };
        
        // Update immediately on mount
        updateTimer();
        
        // Then update every second
        const timer = setInterval(updateTimer, 1000);

        return () => clearInterval(timer);
    }, [targetDate]);

    const padNumber = (num: number, digits: number): string => {
        return num.toString().padStart(digits, "0");
    };

    return (
        <div className={`flex items-center justify-center gap-2 ${className}`}>
            <TimeUnit value={padNumber(timeLeft.days, 2)} label="D" />
            <span className="text-white/60 font-mono animate-pulse text-2xl">:</span>
            <TimeUnit value={padNumber(timeLeft.hours, 2)} label="H" />
            <span className="text-white/60 font-mono animate-pulse text-2xl">:</span>
            <TimeUnit value={padNumber(timeLeft.minutes, 2)} label="M" />
            <span className="text-white/60 font-mono animate-pulse text-2xl">:</span>
            <TimeUnit value={padNumber(timeLeft.seconds, 2)} label="S" />
        </div>
    );
}

function TimeUnit({ value, label }: { value: string; label: string; }) {
    return (
        <div className="flex flex-col items-center">
            <span className="font-mono font-bold text-white tabular-nums tracking-tighter text-2xl min-w-[2.5rem]">
                {value}
            </span>
            <span className="text-xs text-white/50 uppercase tracking-wider font-medium">{label}</span>
        </div>
    );
}
