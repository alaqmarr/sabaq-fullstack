import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function DashboardStatsSkeleton() {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
                <Card key={i}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <Skeleton className="h-4 w-[100px]" />
                        <Skeleton className="h-4 w-4 rounded-full" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-8 w-[60px] mb-1" />
                        <Skeleton className="h-3 w-[120px]" />
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

export function DashboardChartSkeleton() {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-[180px]" />
                <Skeleton className="h-4 w-[240px]" />
            </CardHeader>
            <CardContent>
                <Skeleton className="h-[300px] w-full" />
            </CardContent>
        </Card>
    );
}

export function ActiveSessionsSkeleton() {
    return (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-6">
            <Skeleton className="h-8 w-[200px] mb-4" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(2)].map((_, i) => (
                    <Card key={i}>
                        <CardHeader className="pb-2">
                            <Skeleton className="h-6 w-[150px]" />
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2 mb-4">
                                <Skeleton className="h-4 w-[180px]" />
                                <Skeleton className="h-4 w-[160px]" />
                            </div>
                            <div className="flex gap-2">
                                <Skeleton className="h-10 flex-1" />
                                <Skeleton className="h-10 w-10" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

export function UpcomingSessionsSkeleton() {
    return (
        <div>
            <Skeleton className="h-7 w-[200px] mb-4" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(3)].map((_, i) => (
                    <Card key={i}>
                        <CardHeader className="pb-2">
                            <Skeleton className="h-6 w-[150px]" />
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2 mb-4">
                                <Skeleton className="h-4 w-[120px]" />
                                <Skeleton className="h-4 w-[100px]" />
                            </div>
                            <Skeleton className="h-10 w-full" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

export function RecentlyEndedSessionsSkeleton() {
    return (
        <div>
            <Skeleton className="h-7 w-[180px] mb-4" />
            <div className="flex flex-col gap-4">
                {[...Array(2)].map((_, i) => (
                    <Card key={i}>
                        <CardContent className="p-4">
                            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                                <div className="flex-1 space-y-3">
                                    <Skeleton className="h-6 w-[200px]" />
                                    <div className="grid grid-cols-2 gap-2">
                                        <Skeleton className="h-4 w-[100px]" />
                                        <Skeleton className="h-4 w-[80px]" />
                                    </div>
                                    <Skeleton className="h-8 w-[120px]" />
                                </div>
                                <div className="flex flex-wrap gap-2 lg:w-48">
                                    <Skeleton className="h-9 w-[100px]" />
                                    <Skeleton className="h-9 w-[100px]" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

export function SabaqSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <Skeleton className="h-10 w-[200px] mb-2" />
                    <Skeleton className="h-4 w-[150px]" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-10 w-[100px]" />
                    <Skeleton className="h-10 w-[80px]" />
                </div>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {[...Array(8)].map((_, i) => (
                    <Card key={i} className="h-full">
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <Skeleton className="h-6 w-[140px]" />
                                <Skeleton className="h-5 w-[60px]" />
                            </div>
                            <Skeleton className="h-4 w-[100px]" />
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-[80%]" />
                                </div>
                                <div className="flex justify-between items-center pt-2">
                                    <Skeleton className="h-4 w-[60px]" />
                                    <Skeleton className="h-4 w-[40px]" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

export function SessionListSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <Skeleton className="h-10 w-[200px] mb-2" />
                    <Skeleton className="h-4 w-[150px]" />
                </div>
                <Skeleton className="h-10 w-[100px]" />
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {[...Array(8)].map((_, i) => (
                    <Card key={i} className="h-full">
                        <CardHeader className="pb-2">
                            <Skeleton className="h-6 w-[140px] mb-2" />
                            <Skeleton className="h-4 w-[100px]" />
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-[80%]" />
                                </div>
                                <div className="flex justify-between items-center pt-2">
                                    <Skeleton className="h-8 w-[80px]" />
                                    <Skeleton className="h-8 w-[80px]" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

export function UserListSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <Skeleton className="h-10 w-[200px] mb-2" />
                    <Skeleton className="h-4 w-[150px]" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-10 w-[100px]" />
                    <Skeleton className="h-10 w-[100px]" />
                </div>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {[...Array(8)].map((_, i) => (
                    <Card key={i} className="h-full">
                        <CardHeader className="flex flex-row items-center gap-4 pb-2">
                            <Skeleton className="h-12 w-12 rounded-full" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-[120px]" />
                                <Skeleton className="h-3 w-[80px]" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2 mt-2">
                                <Skeleton className="h-3 w-full" />
                                <Skeleton className="h-3 w-[60%]" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

export function LocationListSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <Skeleton className="h-10 w-[200px] mb-2" />
                    <Skeleton className="h-4 w-[150px]" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-10 w-[100px]" />
                    <Skeleton className="h-10 w-[100px]" />
                </div>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {[...Array(8)].map((_, i) => (
                    <Card key={i} className="h-full">
                        <CardHeader className="pb-2">
                            <Skeleton className="h-6 w-[140px] mb-2" />
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-[80%]" />
                                </div>
                                <div className="flex justify-between items-center pt-2">
                                    <Skeleton className="h-4 w-[60px]" />
                                    <Skeleton className="h-4 w-[40px]" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
