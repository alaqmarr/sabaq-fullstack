import { auth } from '@/auth';

export const preferredRegion = ["sin1"];
import { redirect } from 'next/navigation';
import { BulkUploadForm } from '@/components/users/bulk-upload-form';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function BulkUploadPage() {
    const session = await auth();

    if (!session?.user || session.user.role !== 'SUPERADMIN') {
        redirect('/dashboard');
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/users">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <h2 className="text-3xl font-bold tracking-tight">Bulk User Upload</h2>
            </div>

            <BulkUploadForm />
        </div>
    );
}
