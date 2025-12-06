"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Link2, Copy, ExternalLink, Share2, QrCode, MessageCircle, Star, Users, Check, Scan, Clock, Eye, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatDate, formatTime } from "@/lib/date-utils";

interface SabaqLinksViewProps {
    sabaq: {
        id: string;
        name: string;
        whatsappGroupLink?: string | null;
        enrolledCount: number;
        locationName?: string | null;
    };
    activeSession?: {
        id: string;
        scheduledAt: Date;
    } | null;
    upcomingSession?: {
        id: string;
        scheduledAt: Date;
    } | null;
    recentlyEndedSession?: {
        id: string;
        scheduledAt: Date;
        endedAt?: Date | null;
    } | null;
}

interface LinkItemProps {
    title: string;
    description: string;
    url: string;
    icon: React.ReactNode;
    badge?: {
        text: string;
        variant: "default" | "secondary" | "destructive" | "outline";
    };
}

function LinkItem({ title, description, url, icon, badge }: LinkItemProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            toast.success("Link copied to clipboard!");
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error("Failed to copy link");
        }
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title,
                    text: description,
                    url,
                });
            } catch (err: any) {
                if (err.name !== "AbortError") {
                    toast.error("Failed to share");
                }
            }
        } else {
            handleCopy();
        }
    };

    const handleOpen = () => {
        window.open(url, "_blank");
    };

    return (
        <Card className="glass overflow-hidden">
            <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                            {icon}
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                                <h3 className="font-semibold truncate">{title}</h3>
                                {badge && (
                                    <Badge variant={badge.variant} className="shrink-0">
                                        {badge.text}
                                    </Badge>
                                )}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                                {description}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCopy}
                            className="w-9 p-0"
                        >
                            {copied ? (
                                <Check className="h-4 w-4 text-green-500" />
                            ) : (
                                <Copy className="h-4 w-4" />
                            )}
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={handleShare}
                            className="w-9 p-0"
                        >
                            <Share2 className="h-4 w-4" />
                        </Button>
                        <Button
                            size="sm"
                            variant="frosted-blue"
                            onClick={handleOpen}
                        >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Open
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export function SabaqLinksView({ sabaq, activeSession, upcomingSession, recentlyEndedSession }: SabaqLinksViewProps) {
    const router = useRouter();
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "";

    // Dynamic session links (active > upcoming > recently ended)
    const dynamicLinks: LinkItemProps[] = [];

    // Active session takes priority
    if (activeSession) {
        dynamicLinks.push({
            title: "View Session",
            description: "View the currently active session",
            url: `${baseUrl}/dashboard/sessions/${activeSession.id}`,
            icon: <Eye className="h-5 w-5" />,
            badge: { text: "Active", variant: "default" },
        });
        dynamicLinks.push({
            title: "Take Attendance",
            description: "Scan QR codes or enter ITS manually",
            url: `${baseUrl}/dashboard/sessions/${activeSession.id}/scan`,
            icon: <Scan className="h-5 w-5" />,
            badge: { text: "Active", variant: "default" },
        });
        dynamicLinks.push({
            title: "Ask Question",
            description: "Submit a question for this session",
            url: `${baseUrl}/sessions/${activeSession.id}/ask`,
            icon: <MessageCircle className="h-5 w-5" />,
            badge: { text: "Active", variant: "default" },
        });
        dynamicLinks.push({
            title: "Submit Feedback",
            description: "Share feedback for this session",
            url: `${baseUrl}/sessions/${activeSession.id}/feedback`,
            icon: <Star className="h-5 w-5" />,
            badge: { text: "Active", variant: "default" },
        });
    }
    // Upcoming session if no active
    else if (upcomingSession) {
        dynamicLinks.push({
            title: "View Session",
            description: `Scheduled for ${formatDate(upcomingSession.scheduledAt)} at ${formatTime(upcomingSession.scheduledAt)}`,
            url: `${baseUrl}/dashboard/sessions/${upcomingSession.id}`,
            icon: <Eye className="h-5 w-5" />,
            badge: { text: "Upcoming", variant: "secondary" },
        });
        dynamicLinks.push({
            title: "Take Attendance",
            description: "Link will be active when session starts",
            url: `${baseUrl}/dashboard/sessions/${upcomingSession.id}/scan`,
            icon: <Scan className="h-5 w-5" />,
            badge: { text: "Upcoming", variant: "secondary" },
        });
        dynamicLinks.push({
            title: "Ask Question",
            description: "Submit a question for the upcoming session",
            url: `${baseUrl}/sessions/${upcomingSession.id}/ask`,
            icon: <MessageCircle className="h-5 w-5" />,
            badge: { text: "Upcoming", variant: "secondary" },
        });
        dynamicLinks.push({
            title: "Submit Feedback",
            description: "Share feedback for the upcoming session",
            url: `${baseUrl}/sessions/${upcomingSession.id}/feedback`,
            icon: <Star className="h-5 w-5" />,
            badge: { text: "Upcoming", variant: "secondary" },
        });
    }

    // Recently ended session - show regardless of active/upcoming
    if (recentlyEndedSession) {
        dynamicLinks.push({
            title: "View Last Session",
            description: `Ended on ${formatDate(recentlyEndedSession.scheduledAt)}`,
            url: `${baseUrl}/dashboard/sessions/${recentlyEndedSession.id}`,
            icon: <Eye className="h-5 w-5" />,
            badge: { text: "Ended", variant: "outline" },
        });
        dynamicLinks.push({
            title: "Ask Question (Last Session)",
            description: "Submit a question about the last session",
            url: `${baseUrl}/sessions/${recentlyEndedSession.id}/ask`,
            icon: <MessageCircle className="h-5 w-5" />,
            badge: { text: "Ended", variant: "outline" },
        });
        dynamicLinks.push({
            title: "Submit Feedback (Last Session)",
            description: "Share feedback for the last session",
            url: `${baseUrl}/sessions/${recentlyEndedSession.id}/feedback`,
            icon: <Star className="h-5 w-5" />,
            badge: { text: "Ended", variant: "outline" },
        });
    }

    // Static sabaq links
    const staticLinks: LinkItemProps[] = [
        {
            title: "Sabaq Page",
            description: "View sabaq details and sessions",
            url: `${baseUrl}/dashboard/sabaqs/${sabaq.id}`,
            icon: <Link2 className="h-5 w-5" />,
        },
        {
            title: "Enrollment Management",
            description: "Manage student enrollments",
            url: `${baseUrl}/dashboard/sabaqs/${sabaq.id}/enrollments`,
            icon: <Users className="h-5 w-5" />,
        },
        {
            title: "Admin Management",
            description: "Manage sabaq administrators",
            url: `${baseUrl}/dashboard/sabaqs/${sabaq.id}/admins`,
            icon: <Users className="h-5 w-5" />,
        },
        {
            title: "My QR Code",
            description: "Show your QR code for attendance",
            url: `${baseUrl}/dashboard/verify`,
            icon: <QrCode className="h-5 w-5" />,
        },
    ];

    // WhatsApp link if available
    if (sabaq.whatsappGroupLink) {
        staticLinks.push({
            title: "WhatsApp Group",
            description: "Join the sabaq WhatsApp group",
            url: sabaq.whatsappGroupLink,
            icon: <MessageCircle className="h-5 w-5 text-green-500" />,
        });
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.back()}
                    className="w-fit"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                </Button>
                <div className="flex-1">
                    <h1 className="text-2xl sm:text-3xl font-bold">{sabaq.name}</h1>
                    <p className="text-muted-foreground">
                        {sabaq.enrolledCount} enrolled students
                        {sabaq.locationName && ` • ${sabaq.locationName}`}
                    </p>
                </div>
            </div>

            {/* Active Session Banner */}
            {activeSession && (
                <Card className="border-green-500/50 bg-green-500/10">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-2 rounded-full bg-green-500/20">
                            <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-green-600 dark:text-green-400">
                                Session is Live
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                Started at {formatTime(activeSession.scheduledAt)}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Dynamic Links Section */}
            {dynamicLinks.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Zap className="h-5 w-5 text-amber-500" />
                        Dynamic Links
                    </h2>
                    <div className="flex flex-col gap-3">
                        {dynamicLinks.map((link, index) => (
                            <LinkItem key={`dynamic-${index}`} {...link} />
                        ))}
                    </div>
                </div>
            )}

            {/* Static Links Section */}
            <div className="space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Link2 className="h-5 w-5" />
                    General Links
                </h2>
                <div className="flex flex-col gap-3">
                    {staticLinks.map((link, index) => (
                        <LinkItem key={`static-${index}`} {...link} />
                    ))}
                </div>
            </div>

            {/* Empty state */}
            {dynamicLinks.length === 0 && staticLinks.length === 0 && (
                <Card>
                    <CardContent className="p-8 text-center">
                        <Link2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="font-semibold mb-2">No links available</h3>
                        <p className="text-muted-foreground">
                            Start a session to generate attendance and feedback links.
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
