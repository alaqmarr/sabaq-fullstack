"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Edit,
    Users,
    MapPin,
    BookOpen,
    Trash,
    UserCheck,
    MoreVertical,
    Play,
    Square,
    CalendarPlus,
    Eye,
    ClipboardList,
    Calendar,
    Loader2,
    Link2,
} from "lucide-react";
import Link from "next/link";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { startSession } from "@/actions/sessions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { SessionDialog } from "@/components/sessions/session-dialog";
import { EndSessionDialog } from "@/components/sessions/end-session-dialog";

interface SabaqCardProps {
    sabaq: any;
    locationName: string;
    janabName: string;
    onEdit: () => void;
    onManageAdmins: () => void;
    onDelete: () => void;
}

export function SabaqCard({
    sabaq,
    locationName,
    janabName,
    onEdit,
    onManageAdmins,
    onDelete,
}: SabaqCardProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const [isSessionDialogOpen, setIsSessionDialogOpen] = useState(false);

    // Determine session status
    const activeSession = sabaq.sessions?.find((s: any) => s.isActive);
    // Find the next upcoming session (not active, scheduled in future)
    // The sessions are already ordered by scheduledAt asc from the server
    const upcomingSession = sabaq.sessions?.find(
        (s: any) => !s.isActive && !s.endedAt && new Date(s.scheduledAt) > new Date()
    );

    const handleStartSession = async (sessionId: string) => {
        setLoading(true);
        try {
            const result = await startSession(sessionId);
            if (result.success) {
                toast.success("Session started successfully");
                router.refresh();
                router.push(`/dashboard/sessions/${sessionId}`);
            } else {
                toast.error(result.error || "Failed to start session");
            }
        } catch (error) {
            toast.error("Something went wrong");
        } finally {
            setLoading(false);
        }
    };



    return (
        <>
            <SessionDialog
                open={isSessionDialogOpen}
                onOpenChange={setIsSessionDialogOpen}
                sabaqId={sabaq.id}
            />
            <Card className="glass-premium hover-lift group relative overflow-hidden border-0 p-1 h-full flex flex-col">
                <Link href={`/dashboard/sabaqs/${sabaq.id}`} className="absolute inset-0 z-10" />

                <CardHeader className="pb-3 pt-4 sm:pt-5 px-4 sm:px-5 relative z-10 pointer-events-none">
                    <div className="flex justify-between items-start gap-2">
                        <CardTitle className="text-cred-heading text-base sm:text-lg pointer-events-auto text-balance flex items-center gap-2">
                            <span>{sabaq.name}</span>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-sm font-normal text-muted-foreground">Nisaab {sabaq.level}</span>
                        </CardTitle>
                        <div className="pointer-events-auto z-20">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuItem onClick={onEdit}>
                                        <Edit className="mr-2 h-4 w-4" /> Edit Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={onManageAdmins}>
                                        <Users className="mr-2 h-4 w-4" /> Manage Admins
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <Link href={`/dashboard/sabaqs/${sabaq.id}`}>
                                        <DropdownMenuItem>
                                            <Eye className="mr-2 h-4 w-4" /> View Details
                                        </DropdownMenuItem>
                                    </Link>
                                    <Link href={`/dashboard/sabaqs/${sabaq.id}/sessions`}>
                                        <DropdownMenuItem>
                                            <Calendar className="mr-2 h-4 w-4" /> View Sessions
                                        </DropdownMenuItem>
                                    </Link>
                                    <Link href={`/dashboard/sabaqs/${sabaq.id}/enrollments`}>
                                        <DropdownMenuItem>
                                            <ClipboardList className="mr-2 h-4 w-4" /> View Enrollments
                                        </DropdownMenuItem>
                                    </Link>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        className="text-destructive focus:text-destructive"
                                        onClick={onDelete}
                                    >
                                        <Trash className="mr-2 h-4 w-4" /> Delete Sabaq
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-2">
                        {sabaq.isActive ? (
                            <Badge variant="frosted-green" className="text-[10px] sm:text-xs">
                                active
                            </Badge>
                        ) : (
                            <Badge variant="frosted-slate" className="text-[10px] sm:text-xs">
                                inactive
                            </Badge>
                        )}
                        {(sabaq.pendingEnrollments?.length || 0) > 0 && (
                            <Badge variant="outline" className="text-[10px] sm:text-xs bg-orange-500/10 text-orange-600 border-orange-500/30">
                                {sabaq.pendingEnrollments.length} Pending
                            </Badge>
                        )}
                        <Badge variant="secondary" className="text-[10px] sm:text-xs">
                            {sabaq._count?.enrollments || 0} Enrolled
                        </Badge>
                        <Badge variant="outline" className="text-[10px] sm:text-xs bg-blue-500/10 text-blue-600 border-blue-500/30">
                            {sabaq._count?.sessions || 0} Sessions
                        </Badge>
                    </div>
                </CardHeader>

                <CardContent className="space-y-2.5 sm:space-y-3 px-4 sm:px-5 pb-4 sm:pb-5 text-sm relative z-10 pointer-events-none flex-grow">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <div className="p-1.5 sm:p-2 rounded-full bg-primary/10 text-primary shrink-0">
                            <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </div>
                        <span className="text-xs sm:text-sm truncate">
                            {sabaq.kitaab || "-"}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <div className="p-1.5 sm:p-2 rounded-full bg-primary/10 text-primary shrink-0">
                            <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </div>
                        <span className="text-xs sm:text-sm truncate">{locationName || "-"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <div className="p-1.5 sm:p-2 rounded-full bg-primary/10 text-primary shrink-0">
                            <UserCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </div>
                        <span className="text-xs sm:text-sm truncate">{janabName || "-"}</span>
                    </div>
                </CardContent>

                <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-0 flex flex-col gap-2 pointer-events-auto relative z-20 mt-auto">
                    {/* Quick Action Buttons */}
                    <div className="grid grid-cols-3 gap-2">
                        <Link href={`/dashboard/sabaqs/${sabaq.id}/enrollments`} className="w-full">
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full text-xs"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <ClipboardList className="h-3.5 w-3.5 mr-1" />
                                <span className="hidden sm:inline">Enroll</span>
                            </Button>
                        </Link>
                        <Link href={`/dashboard/sabaqs/${sabaq.id}/admins`} className="w-full">
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full text-xs"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <Users className="h-3.5 w-3.5 mr-1" />
                                <span className="hidden sm:inline">Admins</span>
                            </Button>
                        </Link>
                        <Link href={`/dashboard/sabaqs/${sabaq.id}/links`} className="w-full">
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full text-xs"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <Link2 className="h-3.5 w-3.5 mr-1" />
                                <span className="hidden sm:inline">Links</span>
                            </Button>
                        </Link>
                    </div>

                    {/* Session Action Button */}
                    {activeSession ? (
                        <EndSessionDialog
                            sessionId={activeSession.id}
                            sabaqName={sabaq.name}
                            onSuccess={() => {
                                router.refresh();
                            }}
                        >
                            <Button
                                variant="destructive"
                                size="sm"
                                className="w-full"
                                disabled={loading}
                                onClick={(e) => e.stopPropagation()}
                            >
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Square className="mr-2 h-4 w-4 fill-current" />}
                                End Ongoing Session
                            </Button>
                        </EndSessionDialog>
                    ) : upcomingSession ? (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                    variant="default"
                                    size="sm"
                                    className="w-full"
                                    disabled={loading}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4 fill-current" />}
                                    Start Upcoming Session
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Start Session?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will enable attendance marking.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={(e) => {
                                        e.stopPropagation();
                                        handleStartSession(upcomingSession.id);
                                    }}>Start Session</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    ) : (
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsSessionDialogOpen(true);
                            }}
                        >
                            <CalendarPlus className="mr-2 h-4 w-4" />
                            Schedule Session
                        </Button>
                    )}
                </div>
            </Card>
        </>
    );
}
