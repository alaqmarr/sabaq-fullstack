import { BulkUploadForm } from '@/components/users/bulk-upload-form';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
    title: "Bulk User Upload",
};

export default function BulkUsersPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/users">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Bulk User Management</h1>
                    <p className="text-muted-foreground">Upload or update multiple users via Excel/CSV</p>
                </div>
            </div>

            <BulkUploadForm />
        </div>
    );
}
