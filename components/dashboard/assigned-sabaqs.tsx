'use client';

import { useEffect, useState } from 'react';
import { getSabaqs } from '@/actions/sabaqs';
import { SabaqGrid } from '@/components/sabaqs/sabaq-grid';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen } from 'lucide-react';

export function AssignedSabaqsSection() {
    const [sabaqs, setSabaqs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadSabaqs() {
            try {
                const result = await getSabaqs();
                if (result.success && result.sabaqs) {
                    setSabaqs(result.sabaqs);
                }
            } catch (error) {
                console.error('Failed to load assigned sabaqs', error);
            } finally {
                setLoading(false);
            }
        }

        loadSabaqs();
    }, []);

    if (loading) {
        return (
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-8 rounded-lg" />
                    <Skeleton className="h-8 w-48 rounded-lg" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-48 rounded-xl" />
                    ))}
                </div>
            </div>
        );
    }

    if (sabaqs.length === 0) {
        return null; // Don't show section if no sabaqs assigned
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <BookOpen className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-semibold text-cred-heading lowercase">Assigned Sabaqs</h2>
            </div>

            <SabaqGrid
                sabaqs={sabaqs}
                locations={[]} // Locations not needed for basic display/actions here
                users={[]} // Users not needed for basic display/actions here
            />
        </div>
    );
}
