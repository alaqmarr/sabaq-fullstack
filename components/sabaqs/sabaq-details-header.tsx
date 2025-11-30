'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Edit, Users, ArrowLeft } from 'lucide-react';
import { SabaqDialog } from './sabaq-dialog';
import { SabaqAdminDialog } from './sabaq-admin-dialog';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface SabaqDetailsHeaderProps {
    sabaq: any;
    locations: any[];
    users: any[];
    isAdmin: boolean;
}

export function SabaqDetailsHeader({ sabaq, locations, users, isAdmin }: SabaqDetailsHeaderProps) {
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isAdminOpen, setIsAdminOpen] = useState(false);
    const router = useRouter();

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Link href="/dashboard/sabaqs" className="hover:text-foreground transition-colors flex items-center gap-1">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Sabaqs
                </Link>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-cred-heading lowercase">{sabaq.name}</h1>
                    <p className="text-muted-foreground">{sabaq.kitaab} • {sabaq.level}</p>
                </div>

                {isAdmin && (
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 sm:flex-none"
                            onClick={() => setIsAdminOpen(true)}
                        >
                            <Users className="mr-2 h-4 w-4" />
                            Admins
                        </Button>
                        <Button
                            size="sm"
                            className="flex-1 sm:flex-none"
                            onClick={() => setIsEditOpen(true)}
                        >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                        </Button>
                    </div>
                )}
            </div>

            {isAdmin && (
                <>
                    <SabaqDialog
                        sabaq={sabaq}
                        locations={locations}
                        users={users}
                        open={isEditOpen}
                        onOpenChange={setIsEditOpen}
                    />
                    <SabaqAdminDialog
                        sabaqId={sabaq.id}
                        sabaqName={sabaq.name}
                        open={isAdminOpen}
                        onOpenChange={setIsAdminOpen}
                    />
                </>
            )}
        </div>
    );
}
