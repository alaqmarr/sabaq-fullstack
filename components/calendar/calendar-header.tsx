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
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold tracking-tight">
                    {format(currentDate, "MMMM yyyy")}
                </h2>
                <div className="flex items-center rounded-md border bg-background shadow-sm ml-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onPrevMonth}
                        className="h-8 w-8 rounded-none rounded-l-md"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onToday}
                        className="h-8 rounded-none border-x px-3 font-normal"
                    >
                        Today
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onNextMonth}
                        className="h-8 w-8 rounded-none rounded-r-md"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
