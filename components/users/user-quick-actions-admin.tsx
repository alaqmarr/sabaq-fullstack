'use client';

import { Button } from '@/components/ui/button';
import { UserPlus, FileDown, Upload } from 'lucide-react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export function UserQuickActionsAdmin() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const handleAction = (action: string) => {
        const params = new URLSearchParams(searchParams);
        params.set('action', action);
        router.push(`${pathname}?${params.toString()}`);
    };

    return (
        <div className="flex items-center gap-2">
            <Link href="/dashboard/users/bulk-upload">
                <Button variant="outline" size="sm">
                    <Upload className="mr-2 h-4 w-4" />
                    Bulk Upload
                </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={() => handleAction('export')}>
                <FileDown className="mr-2 h-4 w-4" />
                Export
            </Button>
            <Button size="sm" onClick={() => handleAction('new')}>
                <UserPlus className="mr-2 h-4 w-4" />
                Add User
            </Button>
        </div>
    );
}
