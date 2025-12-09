'use client';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatCustom } from '@/lib/date-utils';

interface SecurityLog {
    id: string;
    action: string;
    resource: string;
    details: any;
    createdAt: Date;
    user: {
        name: string;
        itsNumber: string;
        role: string;
    };
}

interface SecurityLogsTableProps {
    logs: SecurityLog[];
}

export function SecurityLogsTable({ logs }: SecurityLogsTableProps) {
    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Resource</TableHead>
                        <TableHead>Details</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {logs.map((log) => (
                        <TableRow key={log.id}>
                            <TableCell className="whitespace-nowrap">
                                {formatCustom(log.createdAt, 'MMM d, HH:mm:ss')}
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col">
                                    <span className="font-medium">{log.user.name}</span>
                                    <span className="text-xs text-muted-foreground">
                                        {log.user.itsNumber}
                                    </span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <Badge variant="outline">{log.user.role}</Badge>
                            </TableCell>
                            <TableCell>
                                <Badge
                                    variant={
                                        log.action.includes('UNAUTHORIZED')
                                            ? 'destructive'
                                            : 'secondary'
                                    }
                                >
                                    {log.action}
                                </Badge>
                            </TableCell>
                            <TableCell>{log.resource}</TableCell>
                            <TableCell className="max-w-[300px] truncate text-xs font-mono text-muted-foreground">
                                {log.details ? JSON.stringify(log.details) : '-'}
                            </TableCell>
                        </TableRow>
                    ))}
                    {logs.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center">
                                No logs found.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
