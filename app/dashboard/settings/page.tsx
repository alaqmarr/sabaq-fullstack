"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Activity, Database, Mail, CheckCircle, XCircle, RefreshCw, Send, Settings, Save } from "lucide-react";
import { checkSystemStatus, sendTestEmail, sendAllTestEmails } from "@/actions/settings";
import { getAppConfig, updateAppConfig } from "@/actions/app-config";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function SettingsPage() {
    const [dbStatus, setDbStatus] = useState<{ status: string; latency?: number } | null>(null);
    const [loadingStatus, setLoadingStatus] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState("session-reminder");
    const [sendingEmail, setSendingEmail] = useState(false);
    const [sendingAllEmails, setSendingAllEmails] = useState(false);

    // Config State
    const [config, setConfig] = useState<any>(null);
    const [savingConfig, setSavingConfig] = useState(false);

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

    const fetchConfig = async () => {
        const result = await getAppConfig();
        if (result.success) {
            setConfig(result.config);
        }
    };

    useEffect(() => {
        checkStatus();
        fetchConfig();
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

    const handleSaveConfig = async () => {
        if (!config) return;
        setSavingConfig(true);
        const result = await updateAppConfig({
            isAdminUp: config.isAdminUp,
            isPostApiUp: config.isPostApiUp,
            isGetApiUp: config.isGetApiUp,
            isUnderMaintenance: config.isUnderMaintenance,
            version: config.version,
            overallStatus: config.overallStatus,
            downReason: config.downReason,
        });

        if (result.success) {
            toast.success("System configuration updated");
            setConfig(result.config);
        } else {
            toast.error("Failed to update configuration");
        }
        setSavingConfig(false);
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
        { value: "profile-updated", label: "Profile Updated" },
        { value: "role-promoted", label: "Role Promoted" },
        { value: "role-demoted", label: "Role Demoted" },
    ];

    return (
        <div className="space-y-6 p-4 sm:p-6">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">System Settings</h1>
                <p className="text-sm sm:text-base text-muted-foreground">Manage system configuration and diagnostics.</p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* System Configuration */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Settings className="h-5 w-5" />
                            System Configuration
                        </CardTitle>
                        <CardDescription>Control system availability and maintenance mode</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {config ? (
                            <div className="space-y-6">
                                <div className="grid gap-6 sm:grid-cols-2">
                                    <div className="flex items-center justify-between space-x-2 border p-4 rounded-lg">
                                        <Label htmlFor="admin-up" className="flex flex-col space-y-1">
                                            <span>Admin Portal</span>
                                            <span className="font-normal text-xs text-muted-foreground">Enable/Disable admin access</span>
                                        </Label>
                                        <Switch
                                            id="admin-up"
                                            checked={config.isAdminUp}
                                            onCheckedChange={(checked) => setConfig({ ...config, isAdminUp: checked })}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between space-x-2 border p-4 rounded-lg">
                                        <Label htmlFor="maintenance" className="flex flex-col space-y-1">
                                            <span>Maintenance Mode</span>
                                            <span className="font-normal text-xs text-muted-foreground">Put system under maintenance</span>
                                        </Label>
                                        <Switch
                                            id="maintenance"
                                            checked={config.isUnderMaintenance}
                                            onCheckedChange={(checked) => setConfig({ ...config, isUnderMaintenance: checked })}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between space-x-2 border p-4 rounded-lg">
                                        <Label htmlFor="post-api" className="flex flex-col space-y-1">
                                            <span>POST API</span>
                                            <span className="font-normal text-xs text-muted-foreground">Enable data mutations</span>
                                        </Label>
                                        <Switch
                                            id="post-api"
                                            checked={config.isPostApiUp}
                                            onCheckedChange={(checked) => setConfig({ ...config, isPostApiUp: checked })}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between space-x-2 border p-4 rounded-lg">
                                        <Label htmlFor="get-api" className="flex flex-col space-y-1">
                                            <span>GET API</span>
                                            <span className="font-normal text-xs text-muted-foreground">Enable data fetching</span>
                                        </Label>
                                        <Switch
                                            id="get-api"
                                            checked={config.isGetApiUp}
                                            onCheckedChange={(checked) => setConfig({ ...config, isGetApiUp: checked })}
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label>Overall Status</Label>
                                        <Select
                                            value={config.overallStatus}
                                            onValueChange={(val) => setConfig({ ...config, overallStatus: val })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="OPERATIONAL">Operational</SelectItem>
                                                <SelectItem value="DEGRADED">Degraded Performance</SelectItem>
                                                <SelectItem value="DOWN">System Down</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>System Version</Label>
                                        <Input
                                            value={config.version}
                                            onChange={(e) => setConfig({ ...config, version: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2 sm:col-span-2">
                                        <Label>Down Reason (Public)</Label>
                                        <Input
                                            value={config.downReason || ""}
                                            onChange={(e) => setConfig({ ...config, downReason: e.target.value })}
                                            placeholder="e.g. Scheduled Maintenance"
                                        />
                                    </div>
                                </div>

                                <Button onClick={handleSaveConfig} disabled={savingConfig} className="w-full sm:w-auto">
                                    {savingConfig ? (
                                        <>
                                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="mr-2 h-4 w-4" />
                                            Save Configuration
                                        </>
                                    )}
                                </Button>
                            </div>
                        ) : (
                            <div className="flex justify-center p-8">
                                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        )}
                    </CardContent>
                </Card>

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
                            <Label>Select Template</Label>
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
                        <div className="flex flex-col sm:flex-row gap-3">
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
