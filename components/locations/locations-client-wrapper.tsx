'use client';

import { useState } from 'react';
import { LocationGrid } from './location-grid';
import { LocationTable } from './location-table';
import { SearchInput } from '../ui/search-input';

interface LocationsClientWrapperProps {
    locations: any[];
    currentView: 'grid' | 'table';
}

export function LocationsClientWrapper({ locations, currentView }: LocationsClientWrapperProps) {
    const [searchQuery, setSearchQuery] = useState('');

    // Filter locations based on search query
    const filteredLocations = locations.filter(location => {
        if (!searchQuery) return true;

        const query = searchQuery.toLowerCase();
        const name = location.name?.toLowerCase() || '';
        const address = location.address?.toLowerCase() || '';

        return name.includes(query) || address.includes(query);
    });

    return (
        <div className="space-y-4">
            <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search locations by name or address..."
                className="max-w-md"
            />

            {filteredLocations.length === 0 ? (
                <div className="text-center py-12 glass-card rounded-lg">
                    <p className="text-muted-foreground">No locations found matching "{searchQuery}"</p>
                    <p className="text-sm text-muted-foreground mt-2">Try adjusting your search</p>
                </div>
            ) : currentView === 'grid' ? (
                <LocationGrid locations={filteredLocations} />
            ) : (
                <LocationTable locations={filteredLocations} />
            )}
        </div>
    );
}
