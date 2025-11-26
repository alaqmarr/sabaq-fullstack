'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { processEmailQueue } from '@/actions/email-queue';
import { toast } from 'sonner';
import { Mail, Loader2 } from 'lucide-react';

export function ProcessEmailsButton() {
    const [loading, setLoading] = useState(false);

    const handleProcess = async () => {
        setLoading(true);
        try {
            const result = await processEmailQueue();
            if (result.success) {
                toast.success(`Processed ${result.processed} emails. Success: ${result.successCount}, Failed: ${result.failureCount}`);
            } else {
                toast.error(result.error || 'Failed to process emails');
            }
        } catch (error) {
            toast.error('Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button variant="outline" size="sm" onClick={handleProcess} disabled={loading} title="Process Email Queue">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
            <span className="ml-2 hidden sm:inline">Process Emails</span>
        </Button>
    );
}
