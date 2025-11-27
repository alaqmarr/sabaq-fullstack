'use client';

import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { LocationDialog } from './location-dialog';

export function LocationHeader() {
    const [open, setOpen] = useState(false);

    return (
        <div className="flex items-center justify-between">
            <h2 className="text-3xl text-cred-heading tracking-tight lowercase">locations</h2>
            <div className="flex items-center space-x-2">
                <Button onClick={() => setOpen(true)} variant="frosted-green">
                    <Plus className="mr-2 h-4 w-4" /> add location
                </Button>
                <LocationDialog open={open} onOpenChange={setOpen} />
            </div>
        </div>
    );
}
