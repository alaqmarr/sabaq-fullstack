import { Metadata } from "next";
import { CalendarView } from "@/components/calendar/calendar-view";

export const metadata: Metadata = {
    title: "Calendar | Sabaq Module",
    description: "View upcoming sabaq sessions",
};

export default function CalendarPage() {
    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Calendar</h2>
            </div>
            <div className="h-[calc(100vh-200px)]">
                <CalendarView />
            </div>
        </div>
    );
}
