'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

interface AttendanceChartProps {
    data: {
        date: string;
        present: number;
        late: number;
    }[];
}

export function AttendanceChart({ data }: AttendanceChartProps) {
    if (!data || data.length === 0) return null;

    return (
        <Card className="col-span-1">
            <CardHeader>
                <CardTitle className="text-base sm:text-lg">Recent Attendance Trends</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                        <Bar dataKey="present" fill="hsl(var(--primary))" />
                        <Bar dataKey="late" fill="hsl(var(--destructive))" />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
