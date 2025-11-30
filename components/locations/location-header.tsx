'use client';

import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { LocationDialog } from './location-dialog';

export function LocationHeader() {
    const [open, setOpen] = useState(false);

    return (
        <>
            <Button onClick={() => setOpen(true)} variant="frosted-green" size="sm" className="sm:h-10">
                <Plus className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Add Location</span>
                <span className="inline sm:hidden">Add</span>
            </Button>
            <LocationDialog open={open} onOpenChange={setOpen} />
        </>
    );
}
