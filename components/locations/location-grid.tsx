'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash, MapPin, Navigation, Map } from 'lucide-react';
import { LocationDialog } from './location-dialog';
import { deleteLocation } from '@/actions/locations';
import { toast } from 'sonner';

interface LocationGridProps {
    locations: any[];
}

export function LocationGrid({ locations }: LocationGridProps) {
    const [editingLocation, setEditingLocation] = useState<any>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [loading, setLoading] = useState<string | null>(null);

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this location?')) {
            setLoading(id);
            try {
                await deleteLocation(id);
                toast.success('Location deleted');
            } catch (error) {
                toast.error('Failed to delete location');
            }
            setLoading(null);
        }
    };

    if (locations.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground bg-muted/10 rounded-lg border border-dashed">
                No locations found.
            </div>
        );
    }

    return (
        <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {locations.map((location) => (
                    <Card key={location.id} className="glass group relative overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1 border-white/20 dark:border-white/10">
                        <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <CardTitle className="line-clamp-1 flex items-center gap-2 text-lg font-semibold">
                                        <MapPin className="h-4 w-4 text-primary" />
                                        {location.name}
                                    </CardTitle>
                                    <CardDescription className="line-clamp-1">
                                        {location.address}
                                    </CardDescription>
                                </div>
                                <Badge variant={location.isActive ? "frosted-green" : "frosted-slate"}>
                                    {location.isActive ? "active" : "inactive"}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="pb-3 space-y-2 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Navigation className="h-4 w-4" />
                                <span>
                                    {Number(location.latitude).toFixed(6)}, {Number(location.longitude).toFixed(6)}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground lowercase">
                                <Map className="h-4 w-4" />
                                <span>radius: {location.radiusMeters}m</span>
                            </div>
                        </CardContent>
                        <CardFooter className="pt-0 flex justify-end gap-2">
                            <Button
                                variant="frosted-blue"
                                size="sm"
                                onClick={() => {
                                    setEditingLocation(location);
                                    setIsDialogOpen(true);
                                }}
                                disabled={loading === location.id}
                            >
                                <Edit className="h-4 w-4 mr-1" /> Edit
                            </Button>
                            <Button
                                variant="frosted-red"
                                size="sm"
                                onClick={() => handleDelete(location.id)}
                                disabled={loading === location.id}
                            >
                                <Trash className="h-4 w-4 mr-1" /> Delete
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
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
