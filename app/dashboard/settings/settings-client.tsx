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

import {
    getMaintenanceStatus,
    triggerManualSync,
    clearAllNotifications,
    clearSystemLogs,
    processEmailQueueAction,
    clearEmailQueueAction
} from "@/actions/maintenance";
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

export function SettingsClient() {
    const [dbStatus, setDbStatus] = useState<{ status: string; latency?: number } | null>(null);
    const [maintenanceStatus, setMaintenanceStatus] = useState<{ redis: string; firebase: string; lastSync: string | null } | null>(null);
    const [loadingStatus, setLoadingStatus] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState("session-reminder");
    const [sendingEmail, setSendingEmail] = useState(false);
    const [sendingAllEmails, setSendingAllEmails] = useState(false);
    const [processingAction, setProcessingAction] = useState<string | null>(null);

    // Config State
    const [config, setConfig] = useState<any>(null);
    const [savingConfig, setSavingConfig] = useState(false);

    const checkStatus = async () => {
        setLoadingStatus(true);
        const [dbResult, maintenanceResult] = await Promise.all([
            checkSystemStatus(),
            getMaintenanceStatus()
        ]);

        if (dbResult.success) {
            setDbStatus({ status: "healthy", latency: dbResult.dbLatency });
        } else {
            setDbStatus({ status: "error" });
        }

        if (maintenanceResult.success && maintenanceResult.status) {
            setMaintenanceStatus(maintenanceResult.status);
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

    const handleManualSync = async () => {
        setProcessingAction("sync");
        const result = await triggerManualSync();
        if (result.success) {
            toast.success(result.message);
            checkStatus(); // Refresh last sync time
        } else {
            toast.error(result.error || "Sync failed");
        }
        setProcessingAction(null);
    };

    const handleClearNotifications = async () => {
        setProcessingAction("notifications");
        const result = await clearAllNotifications();
        if (result.success) {
            toast.success(result.message);
        } else {
            toast.error(result.error || "Failed to clear notifications");
        }
        setProcessingAction(null);
    };

    const handleClearLogs = async () => {
        setProcessingAction("logs");
        const result = await clearSystemLogs(30);
        if (result.success) {
            toast.success(result.message);
        } else {
            toast.error(result.error || "Failed to clear logs");
        }
        setProcessingAction(null);
    };

    const handleProcessQueue = async () => {
        setProcessingAction("process-queue");
        const result = await processEmailQueueAction();
        if (result.success) {
            toast.success(result.message);
        } else {
            toast.error(result.error || "Failed to process queue");
        }
        setProcessingAction(null);
    };

    const handleClearQueue = async () => {
        setProcessingAction("clear-queue");
        const result = await clearEmailQueueAction();
        if (result.success) {
            toast.success(result.message);
        } else {
            toast.error(result.error || "Failed to clear queue");
        }
        setProcessingAction(null);
    };

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
                        {/* Database */}
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-3">
                                <Database className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <p className="font-medium">Database (Neon)</p>
                                    <p className="text-sm text-muted-foreground">PostgreSQL</p>
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

                        {/* Redis */}
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-3">
                                <Database className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <p className="font-medium">Cache (Redis)</p>
                                    <p className="text-sm text-muted-foreground">Session & Data Caching</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {loadingStatus ? (
                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                ) : maintenanceStatus?.redis === "connected" ? (
                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1">
                                        <CheckCircle className="h-3 w-3" />
                                        Connected
                                    </Badge>
                                ) : (
                                    <Badge variant="destructive" className="gap-1">
                                        <XCircle className="h-3 w-3" />
                                        {maintenanceStatus?.redis || "Unknown"}
                                    </Badge>
                                )}
                            </div>
                        </div>

                        {/* Firebase */}
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-3">
                                <Database className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <p className="font-medium">Realtime DB (Firebase)</p>
                                    <p className="text-sm text-muted-foreground">Live Attendance</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {loadingStatus ? (
                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                ) : maintenanceStatus?.firebase === "connected" ? (
                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1">
                                        <CheckCircle className="h-3 w-3" />
                                        Connected
                                    </Badge>
                                ) : (
                                    <Badge variant="destructive" className="gap-1">
                                        <XCircle className="h-3 w-3" />
                                        {maintenanceStatus?.firebase || "Unknown"}
                                    </Badge>
                                )}
                            </div>
                        </div>

                        {/* Last Sync */}
                        <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                            <div className="flex items-center gap-3">
                                <RefreshCw className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <p className="font-medium">Last Sync</p>
                                    <p className="text-sm text-muted-foreground">
                                        {maintenanceStatus?.lastSync
                                            ? new Date(maintenanceStatus.lastSync).toLocaleString()
                                            : "Never / Unknown"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <Button variant="outline" size="sm" onClick={checkStatus} disabled={loadingStatus} className="w-full">
                            <RefreshCw className={`mr-2 h-4 w-4 ${loadingStatus ? "animate-spin" : ""}`} />
                            Refresh Status
                        </Button>
                    </CardContent>
                </Card>

                {/* Maintenance Controls */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Database className="h-5 w-5" />
                            Maintenance Controls
                        </CardTitle>
                        <CardDescription>Perform system maintenance tasks</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Button
                                variant="outline"
                                onClick={handleManualSync}
                                disabled={!!processingAction}
                                className="justify-start"
                            >
                                {processingAction === "sync" ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                                Sync Everything Manually
                            </Button>

                            <Button
                                variant="outline"
                                onClick={handleProcessQueue}
                                disabled={!!processingAction}
                                className="justify-start"
                            >
                                {processingAction === "process-queue" ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                                Process Email Queue
                            </Button>

                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="outline" className="justify-start text-red-600 hover:text-red-700 hover:bg-red-50">
                                        <XCircle className="mr-2 h-4 w-4" />
                                        Clear All Notifications
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Clear All Notifications?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will remove all notifications for all users. This action cannot be undone.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleClearNotifications} className="bg-red-600 hover:bg-red-700">
                                            Clear All
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>

                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="outline" className="justify-start text-red-600 hover:text-red-700 hover:bg-red-50">
                                        <XCircle className="mr-2 h-4 w-4" />
                                        Clear Logs (Keep 30)
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Clear System Logs?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will remove all security logs except for the latest 30 records. This action cannot be undone.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleClearLogs} className="bg-red-600 hover:bg-red-700">
                                            Clear Logs
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>

                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="outline" className="justify-start text-red-600 hover:text-red-700 hover:bg-red-50">
                                        <XCircle className="mr-2 h-4 w-4" />
                                        Clear Email Queue
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Clear Email Queue?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will remove all PENDING emails from the queue. They will not be sent.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleClearQueue} className="bg-red-600 hover:bg-red-700">
                                            Clear Queue
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
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
