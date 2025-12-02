'use client';

import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { SabaqDialog } from './sabaq-dialog';
import { PageHeader } from '@/components/ui/page-header';

interface SabaqHeaderProps {
    locations: any[];
    users: any[];
    defaultOpen?: boolean;
    children?: React.ReactNode;
}

export function SabaqHeader({ locations, users, defaultOpen = false, children }: SabaqHeaderProps) {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <>
            <PageHeader
                title="sabaqs"
                description="manage sabaq programs"
                actions={[
                    {
                        label: "Create Sabaq",
                        mobileLabel: "Create",
                        icon: Plus,
                        onClick: () => setOpen(true),
                        permission: { resource: "sabaqs", action: "create" }
                    }
                ]}
            >
                {children}
            </PageHeader>
            <SabaqDialog locations={locations} users={users} open={open} onOpenChange={setOpen} />
        </>
    );
}
