"use client";

import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Clock, MapPin } from "lucide-react";
import Link from "next/link";
import { AddToCalendarBtn } from "./add-to-calendar-btn";
import { cn } from "@/lib/utils";

interface DayViewProps {
    date: Date;
    sessions: any[];
}

export function DayView({ date, sessions }: DayViewProps) {
    if (sessions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <CalendarIcon className="h-12 w-12 mb-4 opacity-20" />
                <p>No sessions scheduled for {format(date, "MMMM d")}</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
                <span className="bg-primary/10 text-primary px-2 py-1 rounded text-sm">
                    {format(date, "EEEE")}
                </span>
                <span>{format(date, "MMMM d, yyyy")}</span>
            </h3>

            <div className="space-y-3">
                {sessions.map((session) => (
                    <div
                        key={session.id}
                        className={cn(
                            "flex flex-col sm:flex-row gap-4 p-4 rounded-lg border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md",
                            session.isActive && "border-green-500/50 bg-green-50/10"
                        )}
                    >
                        <div className="flex-1 space-y-2">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h4 className="font-bold text-lg">{session.sabaq.name}</h4>
                                    <p className="text-sm text-muted-foreground">
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
                                        session.isActive && "bg-green-500 hover:bg-green-600"
                                    )}
                                >
                                    {session.isActive
                                        ? "Active Now"
                                        : session.startedAt
                                            ? "Completed"
                                            : "Scheduled"}
                                </Badge>
                            </div>

                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1.5">
                                    <Clock className="h-4 w-4" />
                                    {format(new Date(session.scheduledAt), "h:mm a")}
                                </div>
                                {session.sabaq.location && (
                                    <div className="flex items-center gap-1.5">
                                        <MapPin className="h-4 w-4" />
                                        {session.sabaq.location.name}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-2 sm:self-center pt-2 sm:pt-0 border-t sm:border-t-0 mt-2 sm:mt-0">
                            <Link href={`/dashboard/sessions/${session.id}`} className="flex-1 sm:flex-none">
                                <Button variant="outline" size="sm" className="w-full">
                                    View Details
                                </Button>
                            </Link>
                            <AddToCalendarBtn session={session} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
