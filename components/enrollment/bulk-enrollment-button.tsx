'use client';

import { useSession } from 'next-auth/react';
import { BulkEnrollmentDialog } from './bulk-enrollment-dialog';

interface BulkEnrollmentButtonProps {
    sabaqId: string;
    sabaqName: string;
}

export function BulkEnrollmentButton({ sabaqId, sabaqName }: BulkEnrollmentButtonProps) {
    const { data: session } = useSession();

    // Only show to admins and superadmins
    if (!session?.user || !['SUPERADMIN', 'ADMIN'].includes(session.user.role as string)) {
        return null;
    }

    return <BulkEnrollmentDialog sabaqId={sabaqId} sabaqName={sabaqName} />;
}
