import { getEmailLogs, getSecurityLogs } from '@/actions/logs';
import { LogsViewer } from '@/components/logs/logs-viewer';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { ShieldAlert } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';

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
            <PageHeader
                title="System Logs"
                description="Monitor system activity, security events, and email delivery status."
            />

            <LogsViewer
                emailLogs={emailLogs}
                securityLogs={securityLogs}
            />
        </div>
    );
}
