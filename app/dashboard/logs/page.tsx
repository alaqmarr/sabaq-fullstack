import { getEmailLogs, getSecurityLogs } from '@/actions/logs';
import { LogsViewer } from '@/components/logs/logs-viewer';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { ShieldAlert } from 'lucide-react';

export const metadata = {
    title: "System Logs",
};

export default async function LogsPage() {
    const session = await auth();

    if (!session?.user || session.user.role !== 'SUPERADMIN') {
        redirect('/dashboard');
    }

    const [emailLogsResult, securityLogsResult] = await Promise.all([
        getEmailLogs(),
        getSecurityLogs()
    ]);

    const emailLogs = emailLogsResult.success && emailLogsResult.logs ? emailLogsResult.logs : [];
    const securityLogs = securityLogsResult.success && securityLogsResult.logs ? securityLogsResult.logs : [];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-cred-heading flex items-center gap-3">
                    <ShieldAlert className="h-8 w-8 text-primary" />
                    System Logs
                </h1>
                <p className="text-muted-foreground mt-2">
                    Monitor system activity, security events, and email delivery status.
                </p>
            </div>

            <LogsViewer
                emailLogs={emailLogs}
                securityLogs={securityLogs}
            />
        </div>
    );
}
