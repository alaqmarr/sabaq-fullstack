"use client";

import { useState } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Clock, MapPin, Users, CheckCircle, XCircle, MessageCircle, Star, Calendar, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate, formatTime } from "@/lib/date-utils";
import { resumeSession } from "@/actions/sessions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface SessionWithAttendance {
    id: string;
    scheduledAt: Date;
    sabaq: {
        id: string;
        name: string;
        location?: {
            name: string;
        } | null;
    };
    _count?: {
        attendances: number;
    };
    userAttendance: {
        attended: boolean;
        isLate?: boolean;
    };
}

interface RecentlyEndedCarouselProps {
    sessions: SessionWithAttendance[];
    showAdminActions?: boolean;
}

export function RecentlyEndedCarousel({ sessions, showAdminActions = false }: RecentlyEndedCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [direction, setDirection] = useState(0);
    const [isResuming, setIsResuming] = useState(false);
    const router = useRouter();

    const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        const threshold = 50;
        if (info.offset.x < -threshold && currentIndex < sessions.length - 1) {
            setDirection(1);
            setCurrentIndex((prev) => prev + 1);
        } else if (info.offset.x > threshold && currentIndex > 0) {
            setDirection(-1);
            setCurrentIndex((prev) => prev - 1);
        }
    };

    const goToNext = () => {
        if (currentIndex < sessions.length - 1) {
            setDirection(1);
            setCurrentIndex((prev) => prev + 1);
        }
    };

    const goToPrev = () => {
        if (currentIndex > 0) {
            setDirection(-1);
            setCurrentIndex((prev) => prev - 1);
        }
    };

    const handleResumeSession = async (sessionId: string) => {
        setIsResuming(true);
        try {
            const result = await resumeSession(sessionId);
            if (result.success) {
                toast.success("Session resumed successfully!");
                router.refresh();
            } else {
                toast.error(result.error || "Failed to resume session");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setIsResuming(false);
        }
    };

    const currentSession = sessions[currentIndex];
    const attendanceCount = currentSession._count?.attendances || 0;

    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 100 : -100,
            opacity: 0,
            scale: 0.95,
        }),
        center: {
            x: 0,
            opacity: 1,
            scale: 1,
        },
        exit: (direction: number) => ({
            x: direction < 0 ? 100 : -100,
            opacity: 0,
            scale: 0.95,
        }),
    };

    return (
        <div className="space-y-3">
            {/* Main card with animation */}
            <div className="relative overflow-hidden">
                <AnimatePresence custom={direction} mode="wait">
                    <motion.div
                        key={currentSession.id}
                        custom={direction}
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.1}
                        onDragEnd={handleDragEnd}
                        className="cursor-grab active:cursor-grabbing"
                    >
                        <Card className={cn(
                            "glass group overflow-hidden transition-all border-white/20 dark:border-white/10",
                            "border-l-4 border-l-muted-foreground/50"
                        )}>
                            <Link href={`/dashboard/sessions/${currentSession.id}`} className="absolute inset-0 z-0" />
                            <CardContent className="p-0 relative z-10 pointer-events-none">
                                <div className="flex flex-col lg:flex-row lg:items-center">
                                    {/* Left: Details */}
                                    <div className="p-4 sm:p-5 flex-1 space-y-3">
                                        <div className="flex items-start justify-between gap-2">
                                            <h3 className="text-base sm:text-lg font-semibold line-clamp-1 pointer-events-auto">
                                                {currentSession.sabaq.name}
                                            </h3>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <Badge variant="secondary">Ended</Badge>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-muted-foreground">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 text-primary/70" />
                                                <span className="truncate">
                                                    {formatDate(currentSession.scheduledAt)}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 text-primary/70" />
                                                <span className="truncate">
                                                    {formatTime(currentSession.scheduledAt)}
                                                </span>
                                            </div>
                                            {currentSession.sabaq.location && (
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 text-primary/70" />
                                                    <span className="truncate">{currentSession.sabaq.location.name}</span>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-2">
                                                <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 text-primary/70" />
                                                <span>Attended: <strong>{attendanceCount}</strong></span>
                                            </div>
                                        </div>

                                        {/* User Attendance Status */}
                                        <div className={cn(
                                            "flex items-center gap-2 font-medium text-xs sm:text-sm p-2 rounded-md w-fit",
                                            currentSession.userAttendance.attended
                                                ? "text-green-600 bg-green-500/10"
                                                : "text-red-600 bg-red-500/10"
                                        )}>
                                            {currentSession.userAttendance.attended ? (
                                                <>
                                                    <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                                                    <span>{currentSession.userAttendance.isLate ? "Attended (Late)" : "Attended"}</span>
                                                </>
                                            ) : (
                                                <>
                                                    <XCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                                                    <span>You were absent</span>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right: Controls */}
                                    <div className="p-4 sm:p-5 bg-muted/30 lg:bg-transparent lg:border-l border-t lg:border-t-0 flex flex-wrap lg:flex-col gap-2 justify-end lg:w-52 pointer-events-auto">
                                        {/* Actions for users who attended */}
                                        {currentSession.userAttendance.attended && (
                                            <>
                                                <Button size="sm" variant="frosted-amber" asChild className="w-fit justify-start">
                                                    <Link href={`/sessions/${currentSession.id}/ask`}>
                                                        <MessageCircle className="h-3.5 w-3.5 mr-2" /> Ask Question
                                                    </Link>
                                                </Button>
                                                <Button size="sm" variant="frosted-blue" asChild className="w-fit justify-start">
                                                    <Link href={`/sessions/${currentSession.id}/feedback`}>
                                                        <Star className="h-3.5 w-3.5 mr-2" /> Add Feedback
                                                    </Link>
                                                </Button>
                                            </>
                                        )}

                                        {/* Admin: Resume Session button */}
                                        {showAdminActions && (
                                            <Button
                                                size="sm"
                                                variant="frosted-green"
                                                className="w-fit justify-start"
                                                onClick={() => handleResumeSession(currentSession.id)}
                                                disabled={isResuming}
                                            >
                                                <RotateCcw className={cn("h-3.5 w-3.5 mr-2", isResuming && "animate-spin")} />
                                                Resume Session
                                            </Button>
                                        )}

                                        {/* Message for absent users */}
                                        {!currentSession.userAttendance.attended && !showAdminActions && (
                                            <p className="text-xs text-muted-foreground italic">
                                                You missed this session.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Navigation - below card */}
            {sessions.length > 1 && (
                <div className="flex items-center justify-center gap-3">
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={goToPrev}
                        disabled={currentIndex === 0}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center gap-1.5">
                        {sessions.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => {
                                    setDirection(idx > currentIndex ? 1 : -1);
                                    setCurrentIndex(idx);
                                }}
                                className={cn(
                                    "w-2 h-2 rounded-full transition-all",
                                    idx === currentIndex
                                        ? "bg-primary w-4"
                                        : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                                )}
                            />
                        ))}
                    </div>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={goToNext}
                        disabled={currentIndex === sessions.length - 1}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            )}
        </div>
    );
}
