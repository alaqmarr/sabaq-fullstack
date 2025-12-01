"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface SabaqPerformanceProps {
    data: {
        name: string;
        attendanceRate: number;
        totalStudents: number;
    }[];
}

export function SabaqPerformance({ data }: SabaqPerformanceProps) {
    if (!data || data.length === 0) return null;

    return (
        <Card className="col-span-1">
            <CardHeader>
                <CardTitle className="text-base sm:text-lg">Sabaq Attendance Performance</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data} layout="vertical" margin={{ left: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                        <XAxis type="number" domain={[0, 100]} unit="%" tick={{ fontSize: 12 }} />
                        <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                        <Tooltip
                            formatter={(value: number) => [`${value}%`, 'Attendance Rate']}
                            labelStyle={{ color: 'black' }}
                        />
                        <Bar dataKey="attendanceRate" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
