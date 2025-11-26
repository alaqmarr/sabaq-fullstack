'use client';

import { Button } from '@/components/ui/button';
import { Plus, FileDown } from 'lucide-react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

export function SessionQuickActions() {
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
            <Button variant="outline" size="sm" onClick={() => handleAction('export')}>
                <FileDown className="mr-2 h-4 w-4" />
                Export
            </Button>
            <Button size="sm" onClick={() => handleAction('new')}>
                <Plus className="mr-2 h-4 w-4" />
                Create Session
            </Button>
        </div>
    );
}
