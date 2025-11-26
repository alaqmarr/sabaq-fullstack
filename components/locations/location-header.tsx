'use client';

import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { LocationDialog } from './location-dialog';

export function LocationHeader() {
    const [open, setOpen] = useState(false);

    return (
        <div className="flex items-center justify-between space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Locations</h2>
            <div className="flex items-center space-x-2">
                <Button onClick={() => setOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Add Location
                </Button>
                <LocationDialog open={open} onOpenChange={setOpen} />
            </div>
        </div>
    );
}
