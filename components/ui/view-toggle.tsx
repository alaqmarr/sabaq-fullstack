'use client';

import { LayoutGrid, Table as TableIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

interface ViewToggleProps {
    defaultView?: 'grid' | 'table';
    view?: 'grid' | 'table'; // Backwards compatibility
    onViewChange?: (view: 'grid' | 'table') => void; // Backwards compatibility
}

export function ViewToggle({ defaultView = 'grid', view: controlledView, onViewChange }: ViewToggleProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const currentView = controlledView || searchParams.get('view') || defaultView;

    const handleViewChange = (newView: 'grid' | 'table') => {
        if (onViewChange) {
            onViewChange(newView);
        } else {
            const params = new URLSearchParams(searchParams);
            params.set('view', newView);
            router.replace(`${pathname}?${params.toString()}`);
        }
    };

    return (
        <div className="inline-flex items-center bg-muted/50 p-1 rounded-lg border">
            <Button
                variant={currentView === 'grid' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-8 px-2 lg:px-3"
                onClick={() => handleViewChange('grid')}
                title="Grid View"
            >
                <LayoutGrid className="h-4 w-4 mr-2" />
                <span className="hidden lg:inline">Grid</span>
            </Button>
            <Button
                variant={currentView === 'table' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-8 px-2 lg:px-3"
                onClick={() => handleViewChange('table')}
                title="Table View"
            >
                <TableIcon className="h-4 w-4 mr-2" />
                <span className="hidden lg:inline">Table</span>
            </Button>
        </div>
    );
}
