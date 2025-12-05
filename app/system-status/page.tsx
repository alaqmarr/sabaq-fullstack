import { getAppConfig } from "@/actions/app-config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertTriangle, Server, Shield, Activity, Globe } from "lucide-react";

export const revalidate = 60;
export const preferredRegion = ["sin1"];

export default async function SystemStatusPage() {
    const { config } = await getAppConfig();

    if (!config) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900">System Status Unavailable</h1>
                    <p className="text-gray-500">Unable to fetch system configuration.</p>
                </div>
            </div>
        );
    }

    const getStatusColor = (isUp: boolean) => (isUp ? "text-green-600" : "text-red-600");
    const getStatusBg = (isUp: boolean) => (isUp ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200");
    const getStatusIcon = (isUp: boolean) => (isUp ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />);

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
            <div className="max-w-3xl mx-auto space-y-8">

                {/* Header */}
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">System Status</h1>
                    <p className="text-muted-foreground">Current operational status of Sabaq Portal services.</p>
                </div>

                {/* Overall Status */}
                <Card className={`border-l-4 ${config.overallStatus === 'OPERATIONAL' ? 'border-l-green-500' : config.overallStatus === 'DEGRADED' ? 'border-l-yellow-500' : 'border-l-red-500'}`}>
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center justify-between">
                            <span className="text-lg font-semibold">Overall System Status</span>
                            <Badge variant={config.overallStatus === 'OPERATIONAL' ? 'default' : 'destructive'} className={config.overallStatus === 'OPERATIONAL' ? 'bg-green-600 hover:bg-green-700' : ''}>
                                {config.overallStatus}
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            {config.overallStatus === 'OPERATIONAL'
                                ? "All systems are running smoothly."
                                : config.downReason || "System is experiencing issues."}
                        </p>
                        <div className="mt-4 text-xs text-muted-foreground flex items-center gap-2">
                            <span>Version: {config.version}</span>
                            <span>•</span>
                            <span>Last Updated: {new Date(config.updatedAt).toLocaleString()}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Component Grid */}
                <div className="grid gap-4 sm:grid-cols-2">

                    {/* Admin Portal */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base font-medium flex items-center gap-2">
                                <Shield className="h-4 w-4 text-muted-foreground" />
                                Admin Portal
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className={`flex items-center gap-2 p-3 rounded-lg border ${getStatusBg(config.isAdminUp)} ${getStatusColor(config.isAdminUp)}`}>
                                {getStatusIcon(config.isAdminUp)}
                                <span className="font-semibold">{config.isAdminUp ? "Operational" : "Down"}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* API Services */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base font-medium flex items-center gap-2">
                                <Server className="h-4 w-4 text-muted-foreground" />
                                API Services (POST)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className={`flex items-center gap-2 p-3 rounded-lg border ${getStatusBg(config.isPostApiUp)} ${getStatusColor(config.isPostApiUp)}`}>
                                {getStatusIcon(config.isPostApiUp)}
                                <span className="font-semibold">{config.isPostApiUp ? "Operational" : "Down"}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* GET API Services */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base font-medium flex items-center gap-2">
                                <Globe className="h-4 w-4 text-muted-foreground" />
                                API Services (GET)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className={`flex items-center gap-2 p-3 rounded-lg border ${getStatusBg(config.isGetApiUp)} ${getStatusColor(config.isGetApiUp)}`}>
                                {getStatusIcon(config.isGetApiUp)}
                                <span className="font-semibold">{config.isGetApiUp ? "Operational" : "Down"}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Maintenance Mode */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base font-medium flex items-center gap-2">
                                <Activity className="h-4 w-4 text-muted-foreground" />
                                Maintenance Mode
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className={`flex items-center gap-2 p-3 rounded-lg border ${config.isUnderMaintenance ? "bg-yellow-50 border-yellow-200 text-yellow-700" : "bg-gray-50 border-gray-200 text-gray-600"}`}>
                                {config.isUnderMaintenance ? <AlertTriangle className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
                                <span className="font-semibold">{config.isUnderMaintenance ? "Active" : "Inactive"}</span>
                            </div>
                        </CardContent>
                    </Card>

                </div>
            </div>
        </div>
    );
}
