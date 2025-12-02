'use client';

import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { LocationDialog } from './location-dialog';
import { PageHeader } from '@/components/ui/page-header';

interface LocationHeaderProps {
    children?: React.ReactNode;
}

export function LocationHeader({ children }: LocationHeaderProps) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <PageHeader
                title="locations"
                description="manage attendance locations"
                actions={[
                    {
                        label: "Add Location",
                        mobileLabel: "Add",
                        icon: Plus,
                        onClick: () => setOpen(true),
                        variant: "frosted-green",
                        permission: { resource: "locations", action: "create" }
                    }
                ]}
            >
                {children}
            </PageHeader>
            <LocationDialog open={open} onOpenChange={setOpen} />
        </>
    );
}
