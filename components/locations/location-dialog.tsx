'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { createLocation, updateLocation } from '@/actions/locations';
import { toast } from 'sonner';
import { MapPin, Loader2 } from 'lucide-react';

const locationSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    address: z.string().min(5, 'Address must be at least 5 characters'),
    latitude: z.coerce.number().min(-90).max(90),
    longitude: z.coerce.number().min(-180).max(180),
    radiusMeters: z.coerce.number().min(10).max(1000),
});

type LocationFormValues = z.infer<typeof locationSchema>;

interface LocationDialogProps {
    location?: any;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function LocationDialog({ location, open, onOpenChange }: LocationDialogProps) {
    const [loading, setLoading] = useState(false);
    const [fetchingLocation, setFetchingLocation] = useState(false);

    const form = useForm<LocationFormValues>({
        resolver: zodResolver(locationSchema) as any,
        defaultValues: {
            name: location?.name || '',
            address: location?.address || '',
            latitude: location?.latitude ? Number(location.latitude) : 0,
            longitude: location?.longitude ? Number(location.longitude) : 0,
            radiusMeters: location?.radiusMeters ? Number(location.radiusMeters) : 100,
        } as LocationFormValues,
    });

    const getCurrentLocation = () => {
        if (!navigator.geolocation) {
            toast.error('Geolocation is not supported by your browser');
            return;
        }

        setFetchingLocation(true);
        toast.loading('Fetching your location...');

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;

                form.setValue('latitude', Number(latitude.toFixed(6)));
                form.setValue('longitude', Number(longitude.toFixed(6)));

                setFetchingLocation(false);
                toast.dismiss();
                toast.success('Location detected successfully!', {
                    description: `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`,
                });
            },
            (error) => {
                setFetchingLocation(false);
                toast.dismiss();

                let errorMessage = 'Failed to get location';
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = 'Location permission denied. Please enable location access.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = 'Location information unavailable';
                        break;
                    case error.TIMEOUT:
                        errorMessage = 'Location request timed out';
                        break;
                }
                toast.error(errorMessage);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    };

    async function onSubmit(data: LocationFormValues) {
        setLoading(true);
        try {
            if (location) {
                await updateLocation(location.id, data);
                toast.success('Location updated successfully');
            } else {
                await createLocation(data);
                toast.success('Location created successfully');
            }
            onOpenChange(false);
            form.reset();
        } catch (error) {
            toast.error('Something went wrong');
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{location ? 'Edit Location' : 'Add Location'}</DialogTitle>
                    <DialogDescription>
                        {location ? 'Update location details.' : 'Create a new location for sabaqs.'}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Masjid Al-Anwar" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Address</FormLabel>
                                    <FormControl>
                                        <Input placeholder="123 Street, City" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Auto-detect location button */}
                        <div className="flex items-center justify-between py-2">
                            <p className="text-sm text-muted-foreground">Coordinates</p>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={getCurrentLocation}
                                disabled={fetchingLocation}
                                className="gap-2"
                            >
                                {fetchingLocation ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Detecting...
                                    </>
                                ) : (
                                    <>
                                        <MapPin className="h-4 w-4" />
                                        Auto-detect
                                    </>
                                )}
                            </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="latitude"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Latitude</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="any" placeholder="0.000000" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="longitude"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Longitude</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="any" placeholder="0.000000" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="radiusMeters"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Radius (Meters)</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="100" {...field} />
                                    </FormControl>
                                    <FormDescription className="text-xs">
                                        Acceptable check-in distance from location
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="submit" disabled={loading || fetchingLocation}>
                                {loading ? 'Saving...' : 'Save'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
