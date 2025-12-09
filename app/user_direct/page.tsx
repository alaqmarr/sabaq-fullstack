import { prisma } from '@/lib/prisma';
import { UserDirectClient } from './user-direct-client';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { auth } from '@/auth';
import { getSessionAttendanceRequests } from '@/actions/attendance-request-admin';

export const metadata: Metadata = {
    title: 'Attendance Request | Sabaq',
    description: 'Submit an attendance request if you forgot to mark scanning.',
};

interface PageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function UserDirectPage({ searchParams }: PageProps) {
    const params = await searchParams;
    const sessionId = params.subId as string;

    if (!sessionId) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-4">
                <Alert variant="destructive" className="max-w-md bg-red-900/10 border-red-900/50 text-red-400">
                    <AlertTriangle className="h-5 w-5" />
                    <AlertTitle>Invalid Link</AlertTitle>
                    <AlertDescription>
                        Session ID is missing. Please scan the QR code provided by the venue appropriately.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    const sessionData = await prisma.session.findUnique({
        where: { id: sessionId },
        include: { sabaq: true }
    });

    if (!sessionData) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-4">
                <Alert variant="destructive" className="max-w-md bg-red-900/10 border-red-900/50 text-red-400">
                    <AlertTriangle className="h-5 w-5" />
                    <AlertTitle>Session Not Found</AlertTitle>
                    <AlertDescription>
                        The session you are trying to mark attendance for does not exist or has been deleted.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    // Check Authentication
    const authSession = await auth();
    const user = authSession?.user;

    // Check Admin Permissions for this Sabaq
    let isAdmin = false;
    let pendingRequests: any[] = [];

    if (user) {
        const userRole = user.role;
        // Verify if user is admin/manager/etc.
        if (['SUPERADMIN', 'ADMIN', 'MANAGER', 'ATTENDANCE_INCHARGE', 'JANAB'].includes(userRole)) {
            isAdmin = true;
            // Fetch pending requests
            const { requests } = await getSessionAttendanceRequests(sessionId);
            pendingRequests = requests || [];
        }
    }

    return (
        <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-4 relative overflow-hidden text-zinc-900">
            {/* Background Effects */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-indigo-100 blur-[120px] rounded-full pointer-events-none opacity-60" />

            <div className="w-full max-w-2xl relative z-10 px-2 sm:px-0">
                <UserDirectClient
                    sessionId={sessionData.id}
                    sessionName={sessionData.sabaq.name}
                    sabaqName={sessionData.sabaq.name}
                    user={user}
                    isAdmin={isAdmin}
                    initialRequests={pendingRequests}
                />
            </div>

            <footer className="absolute bottom-6 text-center text-xs text-zinc-500">
                &copy; {new Date().getFullYear()} Sabaq System
            </footer>
        </div>
    );
}
