'use client';

import { useState } from 'react';
import { SabaqGrid } from './sabaq-grid';
import { SabaqTable } from './sabaq-table';
import { SearchInput } from '../ui/search-input';

interface SabaqsClientWrapperProps {
    sabaqs: any[];
    locations: any[];
    users: any[];
    currentView: 'grid' | 'table';
}

export function SabaqsClientWrapper({ sabaqs, locations, users, currentView }: SabaqsClientWrapperProps) {
    const [searchQuery, setSearchQuery] = useState('');

    // Filter sabaqs based on search query
    const filteredSabaqs = sabaqs.filter(sabaq => {
        if (!searchQuery) return true;

        const query = searchQuery.toLowerCase();
        const sabaqName = sabaq.name?.toLowerCase() || '';
        const kitaab = sabaq.kitaab?.toLowerCase() || '';
        const level = sabaq.level?.toString().toLowerCase() || '';
        const janabName = sabaq.janab?.name?.toLowerCase() || '';
        const locationName = sabaq.location?.name?.toLowerCase() || '';

        return (
            sabaqName.includes(query) ||
            kitaab.includes(query) ||
            level.includes(query) ||
            janabName.includes(query) ||
            locationName.includes(query)
        );
    });

    return (
        <div className="space-y-4">
            <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search sabaqs by name, kitaab, level, janab, or location..."
                className="max-w-md"
            />

            {filteredSabaqs.length === 0 ? (
                <div className="text-center py-12 glass-card rounded-lg">
                    <p className="text-muted-foreground">No sabaqs found matching "{searchQuery}"</p>
                    <p className="text-sm text-muted-foreground mt-2">Try adjusting your search</p>
                </div>
            ) : currentView === 'grid' ? (
                <SabaqGrid sabaqs={filteredSabaqs} locations={locations} users={users} />
            ) : (
                <SabaqTable sabaqs={filteredSabaqs} locations={locations} users={users} />
            )}
        </div>
    );
}
