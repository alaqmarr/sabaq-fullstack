'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Shield, Mail, AlertTriangle, CheckCircle, XCircle, Clock, User, Search, Info } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface EmailLog {
    id: string;
    to: string;
    subject: string;
    status: 'PENDING' | 'SENT' | 'FAILED';
    error?: string | null;
    sentAt?: Date | null;
    createdAt: Date;
}

interface SecurityLog {
    id: string;
    action: string;
    resource: string;
    details?: any;
    ipAddress?: string | null;
    createdAt: Date;
    user: {
        name: string;
        itsNumber: string;
        role: string;
    };
}

interface LogsViewerProps {
    emailLogs: EmailLog[];
    securityLogs: SecurityLog[];
}

export function LogsViewer({ emailLogs, securityLogs }: LogsViewerProps) {
    const [activeTab, setActiveTab] = useState('security');
    const [searchTerm, setSearchTerm] = useState('');

    const filteredSecurityLogs = securityLogs.filter(log =>
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user.itsNumber.includes(searchTerm) ||
        (log.ipAddress && log.ipAddress.includes(searchTerm))
    );

    const filteredEmailLogs = emailLogs.filter(log =>
        log.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.to.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.status.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const renderDetails = (details: any) => {
        if (!details) return null;

        // If details is a string that looks like JSON, try to parse it
        let parsedDetails = details;
        if (typeof details === 'string') {
            try {
                parsedDetails = JSON.parse(details);
            } catch (e) {
                // If not JSON, just render string
                return <span className="text-xs text-muted-foreground">{details}</span>;
            }
        }

        // If it's an object, render key-value pairs nicely
        if (typeof parsedDetails === 'object' && parsedDetails !== null) {
            return (
                <div className="flex flex-wrap gap-2 mt-2">
                    {Object.entries(parsedDetails).map(([key, value]) => (
                        <Badge key={key} variant="outline" className="text-[10px] font-normal bg-muted/30 hover:bg-muted/50 transition-colors border-border/50">
                            <span className="font-semibold opacity-70 mr-1 uppercase tracking-wider">{key}:</span>
                            <span className="opacity-90">{String(value)}</span>
                        </Badge>
                    ))}
                </div>
            );
        }

        return (
            <pre className="mt-2 p-2 rounded bg-muted/50 text-xs font-mono overflow-x-auto">
                {JSON.stringify(parsedDetails, null, 2)}
            </pre>
        );
    };

    return (
        <div className="space-y-4 h-[calc(100dvh-140px)] flex flex-col">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0">
                <Tabs defaultValue="security" value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
                    <TabsList className="grid w-full grid-cols-2 sm:w-[300px]">
                        <TabsTrigger value="security" className="flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            Security
                        </TabsTrigger>
                        <TabsTrigger value="email" className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            Email
                        </TabsTrigger>
                    </TabsList>
                </Tabs>

                <div className="relative w-full sm:w-[300px]">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search logs..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                    />
                </div>
            </div>

            <div className="flex-1 min-h-0">
                {activeTab === 'security' && (
                    <Card className="glass-card h-full flex flex-col border-0 sm:border">
                        <CardHeader className="pb-3 shrink-0">
                            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                <Shield className="h-5 w-5 text-primary" />
                                Security Events
                                <Badge variant="secondary" className="ml-2 text-xs font-normal">
                                    {filteredSecurityLogs.length}
                                </Badge>
                            </CardTitle>
                            <CardDescription>
                                Track critical user actions and system security events.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 min-h-0 p-0 sm:p-6 sm:pt-0 overflow-hidden">
                            <ScrollArea className="h-full w-full">
                                <div className="space-y-4 p-4 sm:p-0 sm:pr-4">
                                    {filteredSecurityLogs.length === 0 ? (
                                        <div className="text-center py-12 text-muted-foreground">
                                            {searchTerm ? 'No matching security logs found.' : 'No security logs found.'}
                                        </div>
                                    ) : (
                                        filteredSecurityLogs.map((log) => (
                                            <div key={log.id} className="flex flex-col sm:flex-row sm:items-start gap-4 p-4 rounded-lg border border-border/50 bg-background/50 hover:bg-background/80 transition-colors">
                                                <div className="flex-1 space-y-2 min-w-0">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            <Badge variant="outline" className="font-mono text-xs shrink-0">
                                                                {log.action}
                                                            </Badge>
                                                            <span className="text-sm font-medium text-foreground truncate">
                                                                {log.resource}
                                                            </span>
                                                        </div>
                                                        <span className="text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1 shrink-0">
                                                            <Clock className="h-3 w-3" />
                                                            {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                                                        </span>
                                                    </div>

                                                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                                                        <User className="h-3.5 w-3.5" />
                                                        <span className="font-medium text-foreground/80">{log.user.name}</span>
                                                        <span className="hidden sm:inline">({log.user.itsNumber})</span>
                                                        <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                                                            {log.user.role}
                                                        </Badge>
                                                    </div>

                                                    {log.details && (
                                                        <div className="w-full overflow-hidden">
                                                            {renderDetails(log.details)}
                                                        </div>
                                                    )}

                                                    {log.ipAddress && (
                                                        <div className="text-xs text-muted-foreground font-mono mt-1">
                                                            IP: {log.ipAddress}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                )}

                {activeTab === 'email' && (
                    <Card className="glass-card h-full flex flex-col border-0 sm:border">
                        <CardHeader className="pb-3 shrink-0">
                            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                <Mail className="h-5 w-5 text-primary" />
                                Email History
                                <Badge variant="secondary" className="ml-2 text-xs font-normal">
                                    {filteredEmailLogs.length}
                                </Badge>
                            </CardTitle>
                            <CardDescription>
                                View sent emails and delivery status.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 min-h-0 p-0 sm:p-6 sm:pt-0 overflow-hidden">
                            <ScrollArea className="h-full w-full">
                                <div className="space-y-4 p-4 sm:p-0 sm:pr-4">
                                    {filteredEmailLogs.length === 0 ? (
                                        <div className="text-center py-12 text-muted-foreground">
                                            {searchTerm ? 'No matching email logs found.' : 'No email logs found.'}
                                        </div>
                                    ) : (
                                        filteredEmailLogs.map((log) => (
                                            <div key={log.id} className="flex flex-col sm:flex-row sm:items-start gap-4 p-4 rounded-lg border border-border/50 bg-background/50 hover:bg-background/80 transition-colors">
                                                <div className="flex-1 space-y-2 min-w-0">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <h4 className="font-medium text-sm truncate">{log.subject}</h4>
                                                        <span className="text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1 shrink-0">
                                                            <Clock className="h-3 w-3" />
                                                            {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center justify-between text-sm gap-2">
                                                        <span className="text-muted-foreground truncate">To: {log.to}</span>
                                                        <Badge
                                                            variant={
                                                                log.status === 'SENT' ? 'default' :
                                                                    log.status === 'FAILED' ? 'destructive' : 'secondary'
                                                            }
                                                            className={
                                                                log.status === 'SENT' ? 'bg-green-500 hover:bg-green-600' : ''
                                                            }
                                                        >
                                                            {log.status === 'SENT' && <CheckCircle className="h-3 w-3 mr-1" />}
                                                            {log.status === 'FAILED' && <XCircle className="h-3 w-3 mr-1" />}
                                                            {log.status === 'PENDING' && <Clock className="h-3 w-3 mr-1" />}
                                                            {log.status}
                                                        </Badge>
                                                    </div>

                                                    {log.error && (
                                                        <div className="flex items-start gap-2 text-xs text-destructive bg-destructive/10 p-2 rounded break-words">
                                                            <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                                                            <span className="break-all">{log.error}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
