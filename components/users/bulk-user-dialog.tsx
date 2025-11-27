'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { BulkUploadForm } from './bulk-upload-form';

interface BulkUserDialogProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function BulkUserDialog({ open: controlledOpen, onOpenChange }: BulkUserDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false);

    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : internalOpen;
    const setOpen = isControlled ? onOpenChange! : setInternalOpen;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {!isControlled && (
                <DialogTrigger asChild>
                    <Button variant="outline" className="gap-2">
                        <Upload className="h-4 w-4" />
                        Bulk Import
                    </Button>
                </DialogTrigger>
            )}
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Bulk Import Users</DialogTitle>
                </DialogHeader>
                <div className="mt-4">
                    <BulkUploadForm />
                </div>
            </DialogContent>
        </Dialog>
    );
}
