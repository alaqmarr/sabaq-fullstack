"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { Check, Info, MessageCircle, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: Date;
}

interface NotificationListProps {
    notifications: Notification[];
    onMarkAsRead: (id: string) => void;
    onMarkAllAsRead: () => void;
    isLoading?: boolean;
}

export function NotificationList({
    notifications,
    onMarkAsRead,
    onMarkAllAsRead,
    isLoading,
}: NotificationListProps) {
    if (isLoading) {
        return (
            <div className="p-4 text-center text-sm text-muted-foreground">
                Loading notifications...
            </div>
        );
    }

    if (notifications.length === 0) {
        return (
            <div className="p-8 text-center text-sm text-muted-foreground">
                No notifications yet
            </div>
        );
    }

    const getIcon = (type: string) => {
        switch (type) {
            case "SESSION_START":
                return <Calendar className="h-4 w-4 text-blue-500" />;
            case "QUESTION_ANSWERED":
                return <MessageCircle className="h-4 w-4 text-green-500" />;
            case "ENROLLMENT_UPDATE":
                return <Info className="h-4 w-4 text-yellow-500" />;
            default:
                return <Info className="h-4 w-4 text-gray-500" />;
        }
    };

    return (
        <div className="flex flex-col">
            <div className="flex items-center justify-between px-4 py-2 border-b">
                <h4 className="font-semibold text-sm">Notifications</h4>
                {notifications.some((n) => !n.isRead) && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-auto py-1 px-2"
                        onClick={onMarkAllAsRead}
                    >
                        Mark all read
                    </Button>
                )}
            </div>
            <ScrollArea className="h-[300px]">
                <div className="flex flex-col">
                    {notifications.map((notification) => (
                        <div
                            key={notification.id}
                            className={cn(
                                "flex items-start gap-3 p-4 border-b last:border-0 hover:bg-muted/50 transition-colors cursor-pointer relative group",
                                !notification.isRead && "bg-blue-50/50 dark:bg-blue-900/10"
                            )}
                            onClick={() => !notification.isRead && onMarkAsRead(notification.id)}
                        >
                            <div className="mt-1">{getIcon(notification.type)}</div>
                            <div className="flex-1 space-y-1">
                                <p
                                    className={cn(
                                        "text-sm font-medium leading-none",
                                        !notification.isRead && "text-foreground"
                                    )}
                                >
                                    {notification.title}
                                </p>
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                    {notification.message}
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                    {formatDistanceToNow(new Date(notification.createdAt), {
                                        addSuffix: true,
                                    })}
                                </p>
                            </div>
                            {!notification.isRead && (
                                <div className="h-2 w-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                            )}
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
}
