'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { Mail, Phone, QrCode, KeyRound, Loader2 } from "lucide-react";
import { getItsImageUrl } from "@/lib/its";
import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
    DrawerTrigger,
} from "@/components/ui/drawer";
import { QRCodeSVG } from "qrcode.react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { sendUserOTP, resetUserPassword } from "@/actions/auth-otp";
import { updateUser } from "@/actions/users";

interface IDCardProps {
    user: {
        id: string;
        name: string;
        itsNumber: string;
        role: string;
        email?: string | null;
        phone?: string | null;
    };
}

export function IDCard({ user }: IDCardProps) {
    const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    const getRoleBadgeVariant = (role: string) => {
        const variants: Record<
            string,
            | "frosted-purple"
            | "frosted-blue"
            | "frosted-amber"
            | "frosted-teal"
            | "frosted-green"
            | "frosted-slate"
        > = {
            SUPERADMIN: "frosted-purple",
            ADMIN: "frosted-blue",
            MANAGER: "frosted-amber",
            ATTENDANCE_INCHARGE: "frosted-teal",
            JANAB: "frosted-green",
            MUMIN: "frosted-slate",
        };
        return variants[role] || "frosted-slate";
    };

    const handleSendOTP = async () => {
        setLoading(true);
        try {
            const result = await sendUserOTP(user.id);
            if (result.success) {
                setOtpSent(true);
                toast.success("OTP sent to user's email");
            } else {
                toast.error(result.error || "Failed to send OTP");
            }
        } catch (error) {
            toast.error("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (!newPassword) {
            toast.error("Please enter a new password");
            return;
        }
        if (user.email && !otp) {
            toast.error("Please enter the OTP");
            return;
        }

        setLoading(true);
        try {
            if (user.email) {
                const result = await resetUserPassword(user.id, otp, newPassword);
                if (result.success) {
                    toast.success("Password updated successfully");
                    setIsPasswordDialogOpen(false);
                    setOtpSent(false);
                    setOtp("");
                    setNewPassword("");
                } else {
                    toast.error(result.error || "Failed to reset password");
                }
            } else {
                // Direct update if no email
                const result = await updateUser(user.id, { password: newPassword });
                if (result.success) {
                    toast.success("Password updated successfully");
                    setIsPasswordDialogOpen(false);
                    setNewPassword("");
                } else {
                    toast.error(result.error || "Failed to update password");
                }
            }
        } catch (error) {
            toast.error("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative group perspective-1000">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
            <Card className="relative glass-premium border-0 overflow-hidden rounded-2xl">
                {/* Holographic Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-50 pointer-events-none" />

                <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row">
                        {/* Left Section: Photo & QR */}
                        <div className="relative w-full md:w-1/3 bg-black/5 dark:bg-white/5 p-6 flex flex-col items-center justify-center gap-4 border-b md:border-b-0 md:border-r border-white/10">
                            <div className="relative h-32 w-32 rounded-full p-1 bg-gradient-to-br from-white/20 to-white/5 ring-1 ring-white/20 shadow-2xl">
                                <div className="relative h-full w-full rounded-full overflow-hidden bg-background">
                                    <img
                                        src={getItsImageUrl(user.itsNumber)}
                                        alt={user.name}
                                        className="h-full w-full object-cover"
                                        loading="eager"
                                    />
                                </div>
                            </div>

                            <div className="text-center space-y-1">
                                <Badge variant={getRoleBadgeVariant(user.role)} className="font-mono text-xs px-3 py-1 shadow-lg backdrop-blur-md">
                                    {user.role}
                                </Badge>
                            </div>
                        </div>

                        {/* Right Section: Details */}
                        <div className="flex-1 p-6 md:p-8 flex flex-col justify-center space-y-6">
                            <div className="space-y-2 text-center md:text-left">
                                <h1 className="text-2xl md:text-3xl font-bold text-cred-heading uppercase tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                                    {user.name}
                                </h1>
                                <div className="flex items-center justify-center md:justify-start gap-2 text-muted-foreground font-mono text-sm">
                                    <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10">ITS: {user.itsNumber}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {user.email && (
                                    <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/10 backdrop-blur-sm transition-all hover:bg-white/10 hover:scale-[1.02]">
                                        <div className="p-2 rounded-full bg-blue-500/10 text-blue-400 shadow-inner">
                                            <Mail className="h-4 w-4" />
                                        </div>
                                        <span className="lowercase font-medium text-sm truncate">{user.email}</span>
                                    </div>
                                )}
                                {user.phone && (
                                    <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/10 backdrop-blur-sm transition-all hover:bg-white/10 hover:scale-[1.02]">
                                        <div className="p-2 rounded-full bg-green-500/10 text-green-400 shadow-inner">
                                            <Phone className="h-4 w-4" />
                                        </div>
                                        <span className="font-mono text-sm">{user.phone}</span>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex flex-wrap gap-3 justify-center md:justify-start pt-2">
                                {user.phone ? (
                                    <a
                                        href={`https://wa.me/${user.phone.replace(/\D/g, "")}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 sm:flex-none inline-flex items-center justify-center rounded-xl text-sm font-bold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-6 bg-green-500/10 text-green-600 hover:bg-green-500/20 border border-green-500/20 backdrop-blur-sm gap-2 hover:shadow-lg hover:shadow-green-500/10"
                                    >
                                        <WhatsAppIcon className="h-4 w-4" />
                                        <span className="uppercase tracking-wider text-xs">WhatsApp</span>
                                    </a>
                                ) : (
                                    <div className="flex-1 sm:flex-none inline-flex items-center justify-center rounded-xl text-sm font-bold h-10 px-6 bg-muted/50 text-muted-foreground border border-white/10 gap-2 cursor-not-allowed opacity-70">
                                        <WhatsAppIcon className="h-4 w-4" />
                                        <span className="uppercase tracking-wider text-xs">No WhatsApp</span>
                                    </div>
                                )}

                                <Drawer>
                                    <DrawerTrigger asChild>
                                        <button className="flex-1 sm:flex-none inline-flex items-center justify-center rounded-xl text-sm font-bold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 h-10 px-6 bg-white/5 text-foreground hover:bg-white/10 border border-white/10 backdrop-blur-sm gap-2 hover:shadow-lg">
                                            <QrCode className="h-4 w-4" />
                                            <span className="uppercase tracking-wider text-xs">Show QR</span>
                                        </button>
                                    </DrawerTrigger>
                                    <DrawerContent>
                                        <div className="mx-auto w-full max-w-sm">
                                            <DrawerHeader>
                                                <DrawerTitle className="text-center">User QR Code</DrawerTitle>
                                                <DrawerDescription className="text-center">Scan this code to mark attendance</DrawerDescription>
                                            </DrawerHeader>
                                            <div className="p-4 pb-8 flex justify-center">
                                                <div className="bg-white p-4 rounded-xl">
                                                    <QRCodeSVG
                                                        value={JSON.stringify({
                                                            userId: user.id,
                                                            itsNumber: user.itsNumber,
                                                            name: user.name,
                                                            timestamp: new Date().toISOString(),
                                                        })}
                                                        size={200}
                                                        level="H"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </DrawerContent>
                                </Drawer>

                                <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                                    <DialogTrigger asChild>
                                        <button className="flex-1 sm:flex-none inline-flex items-center justify-center rounded-xl text-sm font-bold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 h-10 px-6 bg-red-500/10 text-red-600 hover:bg-red-500/20 border border-red-500/20 backdrop-blur-sm gap-2 hover:shadow-lg hover:shadow-red-500/10">
                                            <KeyRound className="h-4 w-4" />
                                            <span className="uppercase tracking-wider text-xs">Password</span>
                                        </button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Change Password</DialogTitle>
                                            <DialogDescription>
                                                {user.email
                                                    ? "Send an OTP to the user's email to verify the request."
                                                    : "Directly update the password (no email linked)."}
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                            {user.email && !otpSent && (
                                                <Button onClick={handleSendOTP} disabled={loading} className="w-full">
                                                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Mail className="h-4 w-4 mr-2" />}
                                                    Send OTP to {user.email}
                                                </Button>
                                            )}

                                            {(!user.email || otpSent) && (
                                                <>
                                                    {user.email && (
                                                        <div className="space-y-2">
                                                            <Label>OTP Code</Label>
                                                            <Input
                                                                placeholder="Enter 6-digit code"
                                                                value={otp}
                                                                onChange={(e) => setOtp(e.target.value)}
                                                            />
                                                        </div>
                                                    )}
                                                    <div className="space-y-2">
                                                        <Label>New Password</Label>
                                                        <Input
                                                            type="password"
                                                            placeholder="Enter new password"
                                                            value={newPassword}
                                                            onChange={(e) => setNewPassword(e.target.value)}
                                                        />
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                        <DialogFooter>
                                            {(!user.email || otpSent) && (
                                                <Button onClick={handleResetPassword} disabled={loading}>
                                                    {loading ? "Updating..." : "Update Password"}
                                                </Button>
                                            )}
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
