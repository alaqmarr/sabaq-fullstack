'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { markAttendanceLocation } from '@/actions/attendance';
import { toast } from 'sonner';
import { MapPin, Loader2, CheckCircle } from 'lucide-react';

interface LocationAttendanceProps {
    sessionId: string;
    onSuccess?: () => void;
}

export function LocationAttendance({ sessionId, onSuccess }: LocationAttendanceProps) {
    const [loading, setLoading] = useState(false);
    const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);

    const handleMarkAttendance = async () => {
        setLoading(true);

        try {
            // Request geolocation
            if (!navigator.geolocation) {
                toast.error('Geolocation is not supported by your browser');
                setLoading(false);
                return;
            }

            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    setLocation({ latitude, longitude });

                    const result = await markAttendanceLocation(sessionId, latitude, longitude);

                    if (result.success) {
                        toast.success(`Attendance marked! You are ${result.distance}m from the location.`);
                        onSuccess?.();
                    } else {
                        toast.error(result.error || 'Failed to mark attendance');
                    }
                    setLoading(false);
                },
                (error) => {
                    console.error('Geolocation error:', error);
                    toast.error('Failed to get your location. Please enable location services.');
                    setLoading(false);
                }
            );
        } catch (error: any) {
            toast.error(error.message || 'Failed to mark attendance');
            setLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Location-Based Attendance
                </CardTitle>
                <CardDescription>
                    Mark your attendance using your current location. You must be within the specified radius.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Button
                    onClick={handleMarkAttendance}
                    disabled={loading}
                    className="w-full"
                    size="lg"
                >
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Getting Location...
                        </>
                    ) : (
                        <>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Mark My Attendance
                        </>
                    )}
                </Button>

                {location && (
                    <div className="text-xs text-muted-foreground text-center">
                        Your location: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
