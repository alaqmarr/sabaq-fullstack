import { getSabaqById } from '@/actions/sabaqs';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { ExportButton } from '@/components/exports/export-button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function SabaqExportPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const { sabaq } = await getSabaqById(id);

    if (!sabaq) {
        notFound();
    }

    return (
        <div className="flex-1 space-y-6 p-4 sm:p-8 pt-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-2 mb-4">
                <Link href={`/dashboard/sabaqs/${id}`}>
                    <Button variant="ghost" size="sm">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to {sabaq.name}
                    </Button>
                </Link>
            </div>

            <h2 className="text-2xl font-bold tracking-tight text-cred-heading lowercase">Export Data</h2>

            <Card>
                <CardHeader>
                    <CardTitle>Export Master List</CardTitle>
                    <CardDescription>
                        Download a comprehensive Excel report containing all data for this sabaq, including:
                        <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Sabaq Details</li>
                            <li>Enrolled Users</li>
                            <li>Session History</li>
                            <li>Attendance Records</li>
                        </ul>
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="bg-muted/50 p-4 rounded-lg text-sm text-muted-foreground">
                        <p className="font-semibold mb-1">Estimated Time:</p>
                        <p>~5-10 seconds depending on data size.</p>
                    </div>

                    <div className="flex justify-end">
                        <ExportButton type="sabaq" id={sabaq.id} label="Download Excel Report" />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
