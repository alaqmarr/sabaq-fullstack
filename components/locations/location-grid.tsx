'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash, MapPin, Navigation, Map } from 'lucide-react';
import { LocationDialog } from './location-dialog';
import { deleteLocation } from '@/actions/locations';
import { toast } from 'sonner'

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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {locations.map((location) => (
                    <div key={location.id}>
                        <Card className="glass-premium group relative overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1 border-white/20 dark:border-white/10 h-full">
                            <CardHeader className="pb-3 pt-4 sm:pt-5 px-4 sm:px-5">
                                <div className="flex justify-between items-start gap-2">
                                    <div className="space-y-1 min-w-0">
                                        <CardTitle className="line-clamp-1 flex items-center gap-2 text-base sm:text-lg font-semibold">
                                            <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary shrink-0" />
                                            <span className="truncate">{location.name}</span>
                                        </CardTitle>
                                        <CardDescription className="line-clamp-1 text-xs sm:text-sm">
                                            {location.address}
                                        </CardDescription>
                                    </div>
                                    <Badge variant={location.isActive ? "frosted-green" : "frosted-slate"} className="text-[10px] sm:text-xs shrink-0">
                                        {location.isActive ? "active" : "inactive"}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="pb-4 sm:pb-5 px-4 sm:px-5 space-y-2 text-sm">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Navigation className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                                    <span className="text-xs sm:text-sm truncate">
                                        {Number(location.latitude).toFixed(6)}, {Number(location.longitude).toFixed(6)}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground lowercase">
                                    <Map className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                                    <span className="text-xs sm:text-sm">radius: {location.radiusMeters}m</span>
                                </div>
                            </CardContent>
                            <CardFooter className="pt-0 px-4 sm:px-5 pb-4 sm:pb-5 flex justify-end gap-2">
                                <Button
                                    variant="frosted-blue"
                                    size="sm"
                                    className="h-8 px-3 text-xs sm:text-sm"
                                    onClick={() => {
                                        setEditingLocation(location);
                                        setIsDialogOpen(true);
                                    }}
                                    disabled={loading === location.id}
                                >
                                    <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5" /> Edit
                                </Button>
                                <Button
                                    variant="frosted-red"
                                    size="sm"
                                    className="h-8 px-3 text-xs sm:text-sm"
                                    onClick={() => handleDelete(location.id)}
                                    disabled={loading === location.id}
                                >
                                    <Trash className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5" /> Delete
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
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
