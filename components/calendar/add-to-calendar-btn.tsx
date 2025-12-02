"use client";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CalendarPlus } from "lucide-react";
import { createEvent } from "ics";

interface AddToCalendarBtnProps {
    session: any;
}

export function AddToCalendarBtn({ session }: AddToCalendarBtnProps) {
    const handleDownloadIcs = () => {
        const start = new Date(session.scheduledAt);
        const duration = 60; // Default 1 hour if not specified

        const event: any = {
            start: [
                start.getFullYear(),
                start.getMonth() + 1,
                start.getDate(),
                start.getHours(),
                start.getMinutes(),
            ],
            duration: { hours: 1, minutes: 0 },
            title: session.sabaq.name,
            description: `Sabaq: ${session.sabaq.name}\nKitaab: ${session.sabaq.kitaab}\nLevel: ${session.sabaq.level}`,
            location: "Sabaq Location",
            url: window.location.origin + `/dashboard/sessions/${session.id}`,
            status: "CONFIRMED",
            busyStatus: "BUSY",
        };

        createEvent(event, (error, value) => {
            if (error) {
                console.error(error);
                return;
            }

            const blob = new Blob([value], { type: "text/calendar;charset=utf-8" });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `sabaq-${session.id}.ics`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    };

    const handleGoogleCalendar = () => {
        const start = new Date(session.scheduledAt).toISOString().replace(/-|:|\.\d\d\d/g, "");
        const end = new Date(new Date(session.scheduledAt).getTime() + 60 * 60 * 1000)
            .toISOString()
            .replace(/-|:|\.\d\d\d/g, "");

        const url = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
            session.sabaq.name
        )}&dates=${start}/${end}&details=${encodeURIComponent(
            `Sabaq: ${session.sabaq.name}\nKitaab: ${session.sabaq.kitaab}`
        )}&location=${encodeURIComponent("Sabaq Location")}&sf=true&output=xml`;

        window.open(url, "_blank");
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="w-fit">
                    <CalendarPlus className="mr-2 h-4 w-4" />
                    Add to Calendar
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleGoogleCalendar}>
                    Google Calendar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDownloadIcs}>
                    Download .ics (Apple/Outlook)
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
