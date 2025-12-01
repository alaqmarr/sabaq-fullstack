"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface TopStudent {
    id: string;
    name: string;
    its: string;
    attendancePercentage: number;
    totalSessions: number;
    attended: number;
}

interface TopStudentsProps {
    data: TopStudent[];
}

export function TopStudents({ data }: TopStudentsProps) {
    return (
        <Card className="col-span-1">
            <CardHeader>
                <CardTitle className="text-base sm:text-lg">Top Attendees (Last 30 Days)</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {data.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">No data available</p>
                    ) : (
                        data.map((student, index) => (
                            <div key={student.id} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-medium text-muted-foreground">
                                        {index + 1}
                                    </div>
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={`/api/its-image/${student.its}`} />
                                        <AvatarFallback>{student.name.substring(0, 2)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="text-sm font-medium leading-none">{student.name}</p>
                                        <p className="text-xs text-muted-foreground">{student.its}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <Badge variant={student.attendancePercentage >= 90 ? "default" : "secondary"}>
                                        {student.attendancePercentage}%
                                    </Badge>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {student.attended}/{student.totalSessions} sessions
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
