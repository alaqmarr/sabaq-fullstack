"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { startSession, resumeSession } from "@/actions/sessions";
import { toast } from "sonner";
import { Play, Square, RotateCcw, Loader2, UserPlus } from "lucide-react";
import Link from "next/link";
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
import { EndSessionDialog } from "./end-session-dialog";
import { useRouter } from "next/navigation";

interface SessionQuickActionsProps {
    sessionId: string;
    sabaqName: string;
    isActive: boolean;
    isEnded: boolean;
    hasStarted: boolean;
    isAdmin: boolean;
}

export function SessionQuickActions({
    sessionId,
    sabaqName,
    isActive,
    isEnded,
    hasStarted,
    isAdmin,
}: SessionQuickActionsProps) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();


    if (!isAdmin) return null;

    const handleStart = async () => {
        setLoading(true);
        try {
            const result = await startSession(sessionId);
            if (result.success) {
                toast.success("Session started successfully");
                router.refresh();
            } else {
                toast.error(result.error || "Failed to start session");
            }
        } catch (error) {
            toast.error("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    const handleResume = async () => {
        setLoading(true);
        try {
            const result = await resumeSession(sessionId);
            if (result.success) {
                toast.success("Session resumed successfully");
                router.refresh();
            } else {
                toast.error(result.error || "Failed to resume session");
            }
        } catch (error) {
            toast.error("Something went wrong");
        } finally {
            setLoading(false);
        }
    };




    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-row flex-wrap gap-3">
                {!hasStarted && (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button className="w-full sm:w-auto justify-start" disabled={loading}>
                                {loading ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Play className="mr-2 h-4 w-4 fill-current" />
                                )}
                                Start Session
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Start Session?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will enable attendance marking and notify enrolled users.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleStart}>
                                    Start Session
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}

                {isActive && (
                    <EndSessionDialog
                        sessionId={sessionId}
                        sabaqName={sabaqName}
                        onSuccess={() => {
                            router.refresh();
                        }}
                    >
                        <Button
                            variant="destructive"
                            className="w-full sm:w-auto justify-start"
                            disabled={loading}
                        >
                            {loading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Square className="mr-2 h-4 w-4 fill-current" />
                            )}
                            End Session
                        </Button>
                    </EndSessionDialog>
                )}

                {/* Manual Attendance - available for non-active sessions (ended or upcoming) */}
                {!isActive && (
                    <Button
                        variant="outline"
                        className="w-full sm:w-auto justify-start"
                        asChild
                    >
                        <Link href={`/dashboard/sessions/${sessionId}/manual-attendance`}>
                            <UserPlus className="mr-2 h-4 w-4" />
                            Manual Attendance
                        </Link>
                    </Button>
                )}

                {isEnded && (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button
                                variant="outline"
                                className="w-full sm:w-auto justify-start"
                                disabled={loading}
                            >
                                {loading ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <RotateCcw className="mr-2 h-4 w-4" />
                                )}
                                Resume Session
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Resume Session?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will re-enable attendance marking.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleResume}>
                                    Resume Session
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}


            </CardContent>
        </Card>
    );
}
