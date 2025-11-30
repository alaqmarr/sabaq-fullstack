"use client";

import { useState, useEffect } from "react";
import {
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
    isToday,
    format,
} from "date-fns";
import { cn } from "@/lib/utils";
import { getCalendarSessions } from "@/actions/calendar";
import { CalendarHeader } from "./calendar-header";
import { DayView } from "./day-view";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CalendarViewProps {
    initialDate?: Date;
}

export function CalendarView({ initialDate = new Date() }: CalendarViewProps) {
    const [currentDate, setCurrentDate] = useState(initialDate);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [sessions, setSessions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchSessions = async () => {
        setIsLoading(true);
        const start = startOfWeek(startOfMonth(currentDate));
        const end = endOfWeek(endOfMonth(currentDate));

        const result = await getCalendarSessions(start, end);
        if (result.success && result.sessions) {
            setSessions(result.sessions);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchSessions();
    }, [currentDate]);

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
    const goToToday = () => {
        const today = new Date();
        setCurrentDate(today);
        setSelectedDate(today);
    };

    const days = eachDayOfInterval({
        start: startOfWeek(startOfMonth(currentDate)),
        end: endOfWeek(endOfMonth(currentDate)),
    });

    const getSessionsForDay = (date: Date) => {
        return sessions.filter((session) =>
            isSameDay(new Date(session.scheduledAt), date)
        );
    };

    const selectedDaySessions = getSessionsForDay(selectedDate);

    return (
        <div className="flex flex-col h-[calc(100vh-10rem)] gap-6">
            {/* Calendar Section */}
            <div className="bg-background/60 backdrop-blur-xl border rounded-xl shadow-sm p-4">
                <CalendarHeader
                    currentDate={currentDate}
                    onPrevMonth={prevMonth}
                    onNextMonth={nextMonth}
                    onToday={goToToday}
                />

                <div className="grid grid-cols-7 gap-1 mb-2">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                        <div
                            key={day}
                            className="text-center text-xs font-semibold text-muted-foreground py-2"
                        >
                            {day}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                    {days.map((day) => {
                        const daySessions = getSessionsForDay(day);
                        const hasActiveSession = daySessions.some((s) => s.isActive);
                        const isSelected = isSameDay(day, selectedDate);
                        const isCurrentMonth = isSameMonth(day, currentDate);

                        return (
                            <button
                                key={day.toString()}
                                onClick={() => setSelectedDate(day)}
                                className={cn(
                                    "aspect-square p-1 relative rounded-lg flex flex-col items-center justify-center transition-all duration-200",
                                    "hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/20",
                                    isSelected && "bg-primary/10 text-primary font-bold shadow-sm ring-1 ring-primary/20",
                                    !isCurrentMonth && "opacity-30 grayscale",
                                    isToday(day) && !isSelected && "bg-muted font-semibold"
                                )}
                            >
                                <span className={cn("text-sm", isSelected && "scale-110")}>
                                    {format(day, "d")}
                                </span>

                                {/* Dots for sessions */}
                                <div className="flex gap-0.5 mt-1 h-1.5">
                                    {daySessions.length > 0 && (
                                        <div
                                            className={cn(
                                                "h-1.5 w-1.5 rounded-full transition-colors",
                                                hasActiveSession ? "bg-green-500 animate-pulse" : "bg-primary/40",
                                                isSelected && "bg-primary"
                                            )}
                                        />
                                    )}
                                    {daySessions.length > 1 && (
                                        <div className={cn(
                                            "h-1.5 w-1.5 rounded-full bg-primary/40",
                                            isSelected && "bg-primary"
                                        )} />
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Agenda Section */}
            <div className="flex-1 min-h-0 bg-background/60 backdrop-blur-xl border rounded-xl shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 border-b bg-muted/20">
                    <h3 className="font-semibold">Agenda</h3>
                </div>
                <ScrollArea className="flex-1 p-4">
                    <DayView date={selectedDate} sessions={selectedDaySessions} />
                </ScrollArea>
            </div>
        </div>
    );
}
