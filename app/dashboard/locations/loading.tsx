import { LocationListSkeleton } from "@/components/dashboard/skeletons";

export default function Loading() {
    return (
        <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <div className="h-10 w-40 bg-muted animate-pulse rounded-md mb-2" />
                    <div className="h-5 w-60 bg-muted animate-pulse rounded-md" />
                </div>
            </div>
            <LocationListSkeleton />
        </div>
    );
}
