'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { BulkUserDialog } from './bulk-user-dialog';

interface BulkUserDialogManagerProps {
    isOpen: boolean;
}

export function BulkUserDialogManager({ isOpen }: BulkUserDialogManagerProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const onOpenChange = (open: boolean) => {
        if (!open) {
            const params = new URLSearchParams(searchParams);
            params.delete('action');
            router.replace(`${pathname}?${params.toString()}`);
        }
    };

    return <BulkUserDialog open={isOpen} onOpenChange={onOpenChange} />;
}
