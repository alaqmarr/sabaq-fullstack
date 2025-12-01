"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Clock, MapPin } from "lucide-react";
import Link from "next/link";
import { AddToCalendarBtn } from "./add-to-calendar-btn";
import { cn } from "@/lib/utils";
import { formatDate, formatTime } from "@/lib/date-utils";

interface DayViewProps {
    date: Date;
    sessions: any[];
}

export function DayView({ date, sessions }: DayViewProps) {
    if (sessions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-8 lg:py-12 text-muted-foreground">
                <CalendarIcon className="h-8 w-8 lg:h-12 lg:w-12 mb-2 lg:mb-4 opacity-20" />
                <p className="text-xs lg:text-sm text-center">No sessions scheduled for {formatDate(date)}</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <h3 className="font-semibold text-sm lg:text-base flex items-center gap-2 flex-wrap">
                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs">
                    {formatDate(date).split(",")[0]}
                </span>
                <span className="text-xs lg:text-sm">{formatDate(date)}</span>
            </h3>

            <div className="space-y-2 lg:space-y-3">
                {sessions.map((session) => (
                    <div
                        key={session.id}
                        className={cn(
                            "flex flex-col gap-2 p-2 lg:p-3 rounded-lg border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md",
                            session.isActive && "border-green-500/50 bg-green-50/10"
                        )}
                    >
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-sm lg:text-base truncate">{session.sabaq.name}</h4>
                                <p className="text-xs text-muted-foreground truncate">
                                    {session.sabaq.kitaab} • {session.sabaq.level}
                                </p>
                            </div>
                            <Badge
                                variant={
                                    session.isActive
                                        ? "default"
                                        : session.startedAt
                                            ? "secondary"
                                            : "outline"
                                }
                                className={cn(
                                    "text-[10px] lg:text-xs shrink-0",
                                    session.isActive && "bg-green-500 hover:bg-green-600"
                                )}
                            >
                                {session.isActive
                                    ? "Active"
                                    : session.startedAt
                                        ? "Done"
                                        : "Soon"}
                            </Badge>
                        </div>

                        <div className="flex flex-wrap gap-2 lg:gap-3 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span className="text-[10px] lg:text-xs">{formatTime(session.scheduledAt)}</span>
                            </div>
                            {session.sabaq.location && (
                                <div className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    <span className="text-[10px] lg:text-xs truncate max-w-[120px]">{session.sabaq.location.name}</span>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-2 pt-1 border-t">
                            <Link href={`/dashboard/sessions/${session.id}`} className="flex-1">
                                <Button variant="outline" size="sm" className="w-full h-7 text-[10px] lg:text-xs">
                                    Details
                                </Button>
                            </Link>
                            {!session.isActive && !session.startedAt && <AddToCalendarBtn session={session} />}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
