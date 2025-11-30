import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";

interface Enrollment {
    id: string;
    status: string;
    requestedAt: Date;
    user: {
        name: string;
        itsNumber: string;
        email: string | null;
    };
}

interface SabaqEnrollmentCardsProps {
    enrollments: Enrollment[];
}

export function SabaqEnrollmentCards({ enrollments }: SabaqEnrollmentCardsProps) {
    if (enrollments.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                No users enrolled yet.
            </div>
        );
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case "APPROVED":
                return "bg-green-500/10 text-green-500 hover:bg-green-500/20";
            case "PENDING":
                return "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20";
            case "REJECTED":
                return "bg-red-500/10 text-red-500 hover:bg-red-500/20";
            default:
                return "bg-gray-500/10 text-gray-500";
        }
    };

    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {enrollments.map((enrollment) => (
                <Card key={enrollment.id} className="overflow-hidden">
                    <CardHeader className="flex flex-row items-center gap-4 pb-2">
                        <Avatar>
                            <AvatarFallback>
                                {enrollment.user.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col overflow-hidden">
                            <CardTitle className="text-base truncate" title={enrollment.user.name}>
                                {enrollment.user.name}
                            </CardTitle>
                            <span className="text-xs text-muted-foreground">
                                ITS: {enrollment.user.itsNumber}
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex justify-between items-center">
                            <Badge className={getStatusColor(enrollment.status)} variant="outline">
                                {enrollment.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                                {format(new Date(enrollment.requestedAt), "MMM d, yyyy")}
                            </span>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
