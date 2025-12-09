'use client';

import { useState, useEffect, useCallback } from 'react';
import { UserGrid } from './user-grid';
import { UserTable } from './user-table';
import { SearchInput } from '../ui/search-input';
import { Button } from '@/components/ui/button';
import { getUsers } from '@/actions/users';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface UsersClientWrapperProps {
    initialUsers: any[];
    initialTotal: number;
    currentView: 'grid' | 'table';
    currentUserRole?: string;
}

export function UsersClientWrapper({ initialUsers, initialTotal, currentView, currentUserRole }: UsersClientWrapperProps) {
    const [users, setUsers] = useState(initialUsers);
    const [total, setTotal] = useState(initialTotal);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Simple debounce implementation if hook doesn't exist
    const [debouncedQuery, setDebouncedQuery] = useState('');
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedQuery(searchQuery), 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const fetchUsers = useCallback(async (pageNum: number, query: string, append: boolean) => {
        setLoading(true);
        try {
            const res = await getUsers(pageNum, 20, query);
            if (res.success && res.users) {
                if (append) {
                    setUsers(prev => [...prev, ...res.users]);
                } else {
                    setUsers(res.users);
                }
                if (res.total !== undefined) setTotal(res.total);
                setPage(pageNum);
            } else {
                toast.error(res.error || 'Failed to fetch users');
            }
        } catch (error) {
            toast.error('An error occurred while fetching users');
        } finally {
            setLoading(false);
        }
    }, []);

    // Effect for search
    useEffect(() => {
        // Only fetch if query changed (initial load is handled by props)
        // But we need to distinguish initial load vs search change.
        // We can check if users === initialUsers and query is empty?
        // Actually, simpler: if query changes, reset page to 1 and fetch.
        // But we need to avoid double fetch on mount.
        // The debouncedQuery starts empty.

        // If it's the first render and query is empty, don't fetch (we have initialUsers).
        // But if query changes to something else, or back to empty, we fetch.

        // We can track if it's initial mount.
        // Or just rely on the fact that initialUsers is passed.

        // Let's just fetch when debouncedQuery changes, EXCEPT if it's empty and we have initial users matching empty query?
        // No, simpler to just fetch. If it's a re-fetch of page 1, it's fine.
        // But we want to avoid flickering.

        // If we are on page 1 and query is empty, we match initial props.
        // But if we navigated here, initial props are fresh.

        // Let's use a ref to track if we should fetch.
    }, [debouncedQuery]);

    // Better approach:
    // When debouncedQuery changes, we MUST fetch page 1.
    useEffect(() => {
        // Skip the very first run if query is empty (assuming initialUsers are for empty query)
        // But we don't know if initialUsers are for empty query (they are).
        // We can use a ref to skip first effect execution?
        // Actually, `debouncedQuery` will be '' initially.
        // If we fetch on '', we replace initialUsers with same data. Wasteful but safe.
        // To optimize:
        if (debouncedQuery === '' && users === initialUsers) return;

        fetchUsers(1, debouncedQuery, false);
    }, [debouncedQuery, fetchUsers]); // Removed users/initialUsers from dep array to avoid loops, handled by logic

    const handleLoadMore = () => {
        fetchUsers(page + 1, debouncedQuery, true);
    };

    const hasMore = users.length < total;

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <SearchInput
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Search users..."
                    className="max-w-md"
                />
                <div className="text-sm text-muted-foreground">
                    Showing {users.length} of {total} users
                </div>
            </div>

            {users.length === 0 && !loading ? (
                <div className="text-center py-12 glass-card rounded-lg">
                    <p className="text-muted-foreground">No users found matching "{searchQuery}"</p>
                </div>
            ) : (
                <>
                    {currentView === 'grid' ? (
                        <UserGrid users={users} currentUserRole={currentUserRole} />
                    ) : (
                        <UserTable users={users} />
                    )}

                    {hasMore && (
                        <div className="flex justify-center pt-4">
                            <Button
                                variant="outline"
                                onClick={handleLoadMore}
                                disabled={loading}
                                className="w-full sm:w-auto min-w-[200px]"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Loading...
                                    </>
                                ) : (
                                    'Load More'
                                )}
                            </Button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
