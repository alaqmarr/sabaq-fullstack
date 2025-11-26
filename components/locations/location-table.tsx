'use client';

import { useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit, Trash } from 'lucide-react';
import { LocationDialog } from './location-dialog';
import { deleteLocation } from '@/actions/locations';
import { toast } from 'sonner';

interface LocationTableProps {
    locations: any[];
}

export function LocationTable({ locations }: LocationTableProps) {
    const [editingLocation, setEditingLocation] = useState<any>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this location?')) {
            try {
                await deleteLocation(id);
                toast.success('Location deleted');
            } catch (error) {
                toast.error('Failed to delete location');
            }
        }
    };

    return (
        <>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Address</TableHead>
                            <TableHead>Coordinates</TableHead>
                            <TableHead>Radius</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {locations.map((location) => (
                            <TableRow key={location.id}>
                                <TableCell className="font-medium">{location.name}</TableCell>
                                <TableCell>{location.address}</TableCell>
                                <TableCell>
                                    {Number(location.latitude).toFixed(6)}, {Number(location.longitude).toFixed(6)}
                                </TableCell>
                                <TableCell>{location.radiusMeters}m</TableCell>
                                <TableCell className="text-right">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => {
                                            setEditingLocation(location);
                                            setIsDialogOpen(true);
                                        }}
                                    >
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-red-500"
                                        onClick={() => handleDelete(location.id)}
                                    >
                                        <Trash className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {locations.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center">
                                    No locations found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            {editingLocation && (
                <LocationDialog
                    location={editingLocation}
                    open={isDialogOpen}
                    onOpenChange={(open) => {
                        setIsDialogOpen(open);
                        if (!open) setEditingLocation(null);
                    }}
                />
            )}
        </>
    );
}
