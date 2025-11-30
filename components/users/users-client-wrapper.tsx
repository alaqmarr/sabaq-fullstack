'use client';

import { useState } from 'react';
import { UserGrid } from './user-grid';
import { UserTable } from './user-table';
import { SearchInput } from '../ui/search-input';

interface UsersClientWrapperProps {
    users: any[];
    currentView: 'grid' | 'table';
}

export function UsersClientWrapper({ users, currentView }: UsersClientWrapperProps) {
    const [searchQuery, setSearchQuery] = useState('');

    // Filter users based on search query
    const filteredUsers = users.filter(user => {
        if (!searchQuery) return true;

        const query = searchQuery.toLowerCase();
        const name = user.name?.toLowerCase() || '';
        const email = user.email?.toLowerCase() || '';
        const itsNumber = user.itsNumber?.toLowerCase() || '';
        const phone = user.phone?.toLowerCase() || '';
        const role = user.role?.toLowerCase() || '';

        return (
            name.includes(query) ||
            email.includes(query) ||
            itsNumber.includes(query) ||
            phone.includes(query) ||
            role.includes(query)
        );
    });

    return (
        <div className="space-y-4">
            <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search users by name, ITS, email, phone, or role..."
                className="max-w-md"
            />

            {filteredUsers.length === 0 ? (
                <div className="text-center py-12 glass-card rounded-lg">
                    <p className="text-muted-foreground">No users found matching "{searchQuery}"</p>
                    <p className="text-sm text-muted-foreground mt-2">Try adjusting your search</p>
                </div>
            ) : currentView === 'grid' ? (
                <UserGrid users={filteredUsers} />
            ) : (
                <UserTable users={filteredUsers} />
            )}
        </div>
    );
}
