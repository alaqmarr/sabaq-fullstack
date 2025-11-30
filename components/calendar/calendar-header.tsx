"use client";

import { format } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CalendarHeaderProps {
    currentDate: Date;
    onPrevMonth: () => void;
    onNextMonth: () => void;
    onToday: () => void;
}

export function CalendarHeader({
    currentDate,
    onPrevMonth,
    onNextMonth,
    onToday,
}: CalendarHeaderProps) {
    return (
        <div className="flex items-center justify-between mb-2 lg:mb-3">
            <h2 className="text-base lg:text-xl font-bold tracking-tight">
                {format(currentDate, "MMM yyyy")}
            </h2>
            <div className="flex items-center rounded-md border bg-background shadow-sm">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onPrevMonth}
                    className="h-7 w-7 lg:h-8 lg:w-8 rounded-none rounded-l-md"
                >
                    <ChevronLeft className="h-3 w-3 lg:h-4 lg:w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onToday}
                    className="h-7 lg:h-8 rounded-none border-x px-2 lg:px-3 font-normal text-xs"
                >
                    Today
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onNextMonth}
                    className="h-7 w-7 lg:h-8 lg:w-8 rounded-none rounded-r-md"
                >
                    <ChevronRight className="h-3 w-3 lg:h-4 lg:w-4" />
                </Button>
            </div>
        </div>
    );
}
