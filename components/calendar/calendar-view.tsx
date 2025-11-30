"use client";

import { useState, useEffect } from "react";
import {
    format,
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
} from "date-fns";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getCalendarSessions } from "@/actions/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { AddToCalendarBtn } from "./add-to-calendar-btn";

interface CalendarViewProps {
    initialDate?: Date;
}

export function CalendarView({ initialDate = new Date() }: CalendarViewProps) {
    const [currentDate, setCurrentDate] = useState(initialDate);
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
    const goToToday = () => setCurrentDate(new Date());

    const days = eachDayOfInterval({
        start: startOfWeek(startOfMonth(currentDate)),
        end: endOfWeek(endOfMonth(currentDate)),
    });

    const getSessionsForDay = (date: Date) => {
        return sessions.filter((session) =>
            isSameDay(new Date(session.scheduledAt), date)
        );
    };

    return (
        <div className="flex flex-col h-full space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold tracking-tight">
                        {format(currentDate, "MMMM yyyy")}
                    </h2>
                    <div className="flex items-center rounded-md border bg-background shadow-sm">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={prevMonth}
                            className="h-8 w-8 rounded-none rounded-l-md"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={goToToday}
                            className="h-8 rounded-none border-x px-3 font-normal"
                        >
                            Today
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={nextMonth}
                            className="h-8 w-8 rounded-none rounded-r-md"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-px bg-muted rounded-lg overflow-hidden border shadow-sm">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                    <div
                        key={day}
                        className="bg-background p-2 text-center text-xs font-semibold text-muted-foreground"
                    >
                        {day}
                    </div>
                ))}
                {days.map((day, dayIdx) => {
                    const daySessions = getSessionsForDay(day);
                    return (
                        <div
                            key={day.toString()}
                            className={cn(
                                "min-h-[100px] bg-background p-2 transition-colors hover:bg-muted/50 relative group",
                                !isSameMonth(day, currentDate) && "bg-muted/20 text-muted-foreground"
                            )}
                        >
                            <div className="flex items-center justify-between">
                                <span
                                    className={cn(
                                        "text-sm font-medium h-7 w-7 flex items-center justify-center rounded-full",
                                        isToday(day) && "bg-primary text-primary-foreground"
                                    )}
                                >
                                    {format(day, "d")}
                                </span>
                            </div>
                            <div className="mt-2 space-y-1">
                                {daySessions.map((session) => (
                                    <Popover key={session.id}>
                                        <PopoverTrigger asChild>
                                            <button className="w-full text-left">
                                                <div
                                                    className={cn(
                                                        "px-2 py-1 rounded text-xs truncate border",
                                                        session.isActive
                                                            ? "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800"
                                                            : session.startedAt
                                                                ? "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700"
                                                                : "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800"
                                                    )}
                                                >
                                                    <span className="font-semibold">
                                                        {format(new Date(session.scheduledAt), "HH:mm")}
                                                    </span>{" "}
                                                    {session.sabaq.name}
                                                </div>
                                            </button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-80 p-0" align="start">
                                            <div className="p-4 space-y-3">
                                                <div className="space-y-1">
                                                    <h4 className="font-semibold leading-none">
                                                        {session.sabaq.name}
                                                    </h4>
                                                    <p className="text-sm text-muted-foreground">
                                                        {session.sabaq.kitaab}
                                                    </p>
                                                </div>
                                                <div className="grid gap-2 text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                                        <span>
                                                            {format(new Date(session.scheduledAt), "PPP p")}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Badge
                                                            variant={
                                                                session.isActive
                                                                    ? "default"
                                                                    : session.startedAt
                                                                        ? "secondary"
                                                                        : "outline"
                                                            }
                                                        >
                                                            {session.isActive
                                                                ? "Active Now"
                                                                : session.startedAt
                                                                    ? "Completed"
                                                                    : "Scheduled"}
                                                        </Badge>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 pt-2">
                                                    <Link
                                                        href={`/dashboard/sessions/${session.id}`}
                                                        className="flex-1"
                                                    >
                                                        <Button size="sm" className="w-full">
                                                            View Details
                                                        </Button>
                                                    </Link>
                                                    <AddToCalendarBtn session={session} />
                                                </div>
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
