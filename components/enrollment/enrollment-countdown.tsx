'use client';

import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

interface EnrollmentCountdownProps {
    enrollmentEndsAt: Date | string;
    className?: string;
}

export function EnrollmentCountdown({ enrollmentEndsAt, className = '' }: EnrollmentCountdownProps) {
    const [timeLeft, setTimeLeft] = useState<string>('');

    useEffect(() => {
        const calculateTimeLeft = () => {
            const now = new Date().getTime();
            const endDate = new Date(enrollmentEndsAt).getTime();
            const difference = endDate - now;

            if (difference <= 0) {
                setTimeLeft('Enrollment closed');
                return;
            }

            const days = Math.floor(difference / (1000 * 60 * 60 * 24));
            const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((difference % (1000 * 60)) / 1000);

            if (days > 0) {
                setTimeLeft(`${days}d ${hours}h`);
            } else if (hours > 0) {
                setTimeLeft(`${hours}h ${minutes}m`);
            } else if (minutes > 0) {
                setTimeLeft(`${minutes}m ${seconds}s`);
            } else {
                setTimeLeft(`${seconds}s`);
            }
        };

        calculateTimeLeft();
        const interval = setInterval(calculateTimeLeft, 1000);

        return () => clearInterval(interval);
    }, [enrollmentEndsAt]);

    return (
        <div className={`flex items-center gap-1.5 ${className}`}>
            <Clock className="h-3.5 w-3.5 shrink-0" />
            <span className="text-xs font-medium">{timeLeft}</span>
        </div>
    );
}
