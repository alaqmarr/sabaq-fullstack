"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Activity, Database, Mail, CheckCircle, XCircle, RefreshCw, Send } from "lucide-react";
import { checkSystemStatus, sendTestEmail, sendAllTestEmails } from "@/actions/settings";
import { toast } from "sonner";

export default function SettingsPage() {
    const [dbStatus, setDbStatus] = useState<{ status: string; latency?: number } | null>(null);
    const [loadingStatus, setLoadingStatus] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState("session-reminder");
    const [sendingEmail, setSendingEmail] = useState(false);
    const [sendingAllEmails, setSendingAllEmails] = useState(false);

    const checkStatus = async () => {
        setLoadingStatus(true);
        const result = await checkSystemStatus();
        if (result.success) {
            setDbStatus({ status: "healthy", latency: result.dbLatency });
        } else {
            setDbStatus({ status: "error" });
        }
        setLoadingStatus(false);
    };

    useEffect(() => {
        checkStatus();
    }, []);

    const handleSendTestEmail = async () => {
        setSendingEmail(true);
        const result = await sendTestEmail(selectedTemplate);
        if (result.success) {
            toast.success("Test email queued successfully");
        } else {
            toast.error("Failed to queue test email");
        }
        setSendingEmail(false);
    };

    const handleSendAllTestEmails = async () => {
        setSendingAllEmails(true);
        const result = await sendAllTestEmails();
        if (result.success) {
            toast.success("All test emails queued successfully");
        } else {
            toast.error("Failed to queue all test emails");
        }
        setSendingAllEmails(false);
    };

    const templates = [
        { value: "enrollment-approved", label: "Enrollment Approved" },
        { value: "enrollment-rejected", label: "Enrollment Rejected" },
        { value: "session-reminder", label: "Session Reminder" },
        { value: "attendance-marked", label: "Attendance Marked" },
        { value: "admin-otp", label: "Admin OTP" },
        { value: "session-summary", label: "Session Summary" },
        { value: "session-absent", label: "Session Absent" },
        { value: "question-answered", label: "Question Answered" },
        { value: "security-flagged-user", label: "Security Alert (User)" },
        { value: "security-flagged-admin", label: "Security Alert (Admin)" },
    ];

    return (
        <div className="space-y-6 p-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
                <p className="text-muted-foreground">Manage system configuration and diagnostics.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* System Status */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="h-5 w-5" />
                            System Health
                        </CardTitle>
                        <CardDescription>Real-time system status checks</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-3">
                                <Database className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <p className="font-medium">Database Connection</p>
                                    <p className="text-sm text-muted-foreground">PostgreSQL (Prisma)</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {loadingStatus ? (
                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                ) : dbStatus?.status === "healthy" ? (
                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1">
                                        <CheckCircle className="h-3 w-3" />
                                        Healthy ({dbStatus.latency}ms)
                                    </Badge>
                                ) : (
                                    <Badge variant="destructive" className="gap-1">
                                        <XCircle className="h-3 w-3" />
                                        Error
                                    </Badge>
                                )}
                            </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={checkStatus} disabled={loadingStatus} className="w-full">
                            <RefreshCw className={`mr-2 h-4 w-4 ${loadingStatus ? "animate-spin" : ""}`} />
                            Refresh Status
                        </Button>
                    </CardContent>
                </Card>

                {/* Email Testing */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Mail className="h-5 w-5" />
                            Email Template Testing
                        </CardTitle>
                        <CardDescription>Send test emails to your registered address</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Select Template</label>
                            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {templates.map((t) => (
                                        <SelectItem key={t.value} value={t.value}>
                                            {t.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex gap-3">
                            <Button onClick={handleSendTestEmail} disabled={sendingEmail || sendingAllEmails} className="flex-1">
                                {sendingEmail ? (
                                    <>
                                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <Send className="mr-2 h-4 w-4" />
                                        Send Selected
                                    </>
                                )}
                            </Button>
                            <Button onClick={handleSendAllTestEmails} disabled={sendingEmail || sendingAllEmails} variant="secondary" className="flex-1">
                                {sendingAllEmails ? (
                                    <>
                                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                        Sending All...
                                    </>
                                ) : (
                                    <>
                                        <Mail className="mr-2 h-4 w-4" />
                                        Test All
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
