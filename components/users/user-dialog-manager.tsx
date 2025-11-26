'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { UserDialog } from './user-dialog';

interface UserDialogManagerProps {
    isOpen: boolean;
}

export function UserDialogManager({ isOpen }: UserDialogManagerProps) {
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

    return <UserDialog open={isOpen} onOpenChange={onOpenChange} />;
}
