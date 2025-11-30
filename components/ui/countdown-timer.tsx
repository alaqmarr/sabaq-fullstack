"use client";

import { useEffect, useState } from "react";

interface CountdownTimerProps {
    targetDate: Date;
}

export function CountdownTimer({ targetDate }: CountdownTimerProps) {
    const [timeLeft, setTimeLeft] = useState<{
        days: number;
        hours: number;
        minutes: number;
        seconds: number;
    } | null>(null);

    useEffect(() => {
        const calculateTimeLeft = () => {
            const difference = +new Date(targetDate) - +new Date();

            if (difference > 0) {
                return {
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                    seconds: Math.floor((difference / 1000) % 60),
                };
            }
            return null;
        };

        setTimeLeft(calculateTimeLeft());

        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearInterval(timer);
    }, [targetDate]);

    if (!timeLeft) {
        return <span className="text-destructive font-semibold">Expired</span>;
    }

    return (
        <div className="grid grid-cols-4 gap-2 text-center">
            <div className="flex flex-col p-2 bg-primary/10 rounded-md">
                <span className="text-xl font-bold text-primary">{timeLeft.days}</span>
                <span className="text-xs text-muted-foreground">Days</span>
            </div>
            <div className="flex flex-col p-2 bg-primary/10 rounded-md">
                <span className="text-xl font-bold text-primary">{timeLeft.hours}</span>
                <span className="text-xs text-muted-foreground">Hours</span>
            </div>
            <div className="flex flex-col p-2 bg-primary/10 rounded-md">
                <span className="text-xl font-bold text-primary">{timeLeft.minutes}</span>
                <span className="text-xs text-muted-foreground">Mins</span>
            </div>
            <div className="flex flex-col p-2 bg-primary/10 rounded-md">
                <span className="text-xl font-bold text-primary">{timeLeft.seconds}</span>
                <span className="text-xs text-muted-foreground">Secs</span>
            </div>
        </div>
    );
}
