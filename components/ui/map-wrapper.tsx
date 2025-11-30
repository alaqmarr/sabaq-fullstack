'use client';

import dynamic from 'next/dynamic';

const LeafletMap = dynamic(() => import('./map'), {
    ssr: false,
    loading: () => <div className="h-[200px] w-full bg-muted animate-pulse rounded-md" />
});

interface MapWrapperProps {
    latitude: number;
    longitude: number;
    popupText?: string;
}

export function MapWrapper(props: MapWrapperProps) {
    return <LeafletMap {...props} />;
}
