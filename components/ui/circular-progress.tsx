import React from 'react';
import { cn } from '@/lib/utils';

interface CircularProgressProps {
    value: number;
    size?: number;
    strokeWidth?: number;
    className?: string;
    showValue?: boolean;
    label?: string;
    color?: string;
}

export function CircularProgress({
    value,
    size = 100,
    strokeWidth = 8,
    className,
    showValue = true,
    label,
    color = "text-primary"
}: CircularProgressProps) {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (value / 100) * circumference;

    return (
        <div className={cn("relative flex flex-col items-center justify-center", className)} style={{ width: size, height: size }}>
            <svg
                width={size}
                height={size}
                viewBox={`0 0 ${size} ${size}`}
                className="transform -rotate-90"
            >
                {/* Background Circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    className="text-muted/20"
                />
                {/* Progress Circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className={cn("transition-all duration-1000 ease-out", color)}
                />
            </svg>
            {showValue && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-2xl font-bold leading-none">{Math.round(value)}%</span>
                    {label && <span className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">{label}</span>}
                </div>
            )}
        </div>
    );
}
