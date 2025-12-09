'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserCog, RefreshCw, CheckCircle, AlertTriangle, PenLine } from 'lucide-react';
import { toast } from 'sonner';
import { bulkUpdateUsers } from '@/actions/users';
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export function BulkNameUpdate() {
    const [jsonInput, setJsonInput] = useState('');
    const [parsedUsers, setParsedUsers] = useState<any[]>([]);
    const [updating, setUpdating] = useState(false);

    // Progress State
    const [progress, setProgress] = useState(0);
    const [processedCount, setProcessedCount] = useState(0);
    const [successCount, setSuccessCount] = useState(0);
    const [updateErrors, setUpdateErrors] = useState<any[]>([]);
    const [isComplete, setIsComplete] = useState(false);

    const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        setJsonInput(value);
        resetState();

        if (!value.trim()) {
            setParsedUsers([]);
            return;
        }

        try {
            const json = JSON.parse(value);
            // Flexible parsing: Supports map { ITS: { mumin_name: ... } } OR { ITS: "Name" }
            const users = Object.entries(json).map(([key, value]: [string, any]) => {
                let name = '';
                // Case 1: Value is string (Name)
                if (typeof value === 'string') {
                    name = value;
                }
                // Case 2: Value is object with mumin_name or name
                else if (typeof value === 'object') {
                    name = value.mumin_name || value.name || '';
                }

                return {
                    itsNumber: String(value?.mumin_id || value?.itsNumber || key),
                    name: name,
                };
            }).filter(u => u.itsNumber && u.name);

            setParsedUsers(users);
        } catch (err) {
            setParsedUsers([]); // Invalid JSON
        }
    };

    const resetState = () => {
        setIsComplete(false);
        setUpdateErrors([]);
        setSuccessCount(0);
        setProcessedCount(0);
        setProgress(0);
    };

    const handleUpdateUsers = async () => {
        if (parsedUsers.length === 0) return;

        setUpdating(true);
        resetState();

        try {
            const chunkSize = 100;
            const total = parsedUsers.length;
            let currentSuccess = 0;
            let currentProcessed = 0;

            for (let i = 0; i < total; i += chunkSize) {
                const chunk = parsedUsers.slice(i, i + chunkSize);
                const result = await bulkUpdateUsers(chunk);

                currentProcessed += chunk.length;

                if (result.success) {
                    currentSuccess += result.count || 0;
                    if (result.errors) {
                        setUpdateErrors(prev => [...prev, ...result.errors]);
                    }
                } else {
                    chunk.forEach(u => {
                        const err = { its: u.itsNumber, name: u.name, error: result.error || "Batch Failed" };
                        setUpdateErrors(prev => [...prev, err]);
                    });
                }

                setSuccessCount(currentSuccess);
                setProcessedCount(currentProcessed);
                setProgress(Math.min(100, Math.round((currentProcessed / total) * 100)));
            }

            setIsComplete(true);
            toast.success(`Processed ${total} records.`);
            setJsonInput('');
            setParsedUsers([]);

        } catch (error) {
            toast.error("An error occurred during update");
            console.error(error);
        }
        setUpdating(false);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <PenLine className="h-5 w-5" />
                    Bulk Name Update
                </CardTitle>
                <CardDescription>Update names for existing users via JSON</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Label>Paste JSON Data &#123; "ITS": "Name" &#125; or Object</Label>
                        <Badge variant="secondary">Detected: {parsedUsers.length}</Badge>
                    </div>

                    <Textarea
                        placeholder='Example: { "20310358": "Mustafa Bhai" }'
                        className="font-mono text-xs h-[100px] resize-none"
                        value={jsonInput}
                        onChange={handleJsonChange}
                        disabled={updating}
                    />
                </div>

                {(updating || isComplete) && (
                    <div className="space-y-4 border p-4 rounded-lg bg-muted/20 animate-in fade-in slide-in-from-top-2">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm font-medium">
                                <span>Progress</span>
                                <span>{Math.round(progress)}% ({processedCount}/{parsedUsers.length})</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-2">
                            <div className="bg-green-500/10 p-3 rounded-md border border-green-500/20">
                                <div className="flex items-center gap-2 text-green-700 font-medium">
                                    <CheckCircle className="h-4 w-4" />
                                    Updated
                                </div>
                                <p className="text-2xl font-bold text-green-800">{successCount}</p>
                            </div>
                            <div className="bg-yellow-500/10 p-3 rounded-md border border-yellow-500/20">
                                <div className="flex items-center gap-2 text-yellow-700 font-medium">
                                    <AlertTriangle className="h-4 w-4" />
                                    Errors
                                </div>
                                <p className="text-2xl font-bold text-yellow-800">{updateErrors.length}</p>
                            </div>
                        </div>

                        {updateErrors.length > 0 && (
                            <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">Error Log</Label>
                                <div className="bg-background border rounded-md h-[150px] overflow-y-auto p-2 text-xs font-mono">
                                    {updateErrors.map((err, i) => (
                                        <div key={i} className="flex gap-2 border-b last:border-0 py-1 text-destructive">
                                            <span className="font-bold shrink-0 w-[80px]">{err.its}</span>
                                            <span className="shrink-0 w-[150px] truncate" title={err.name}>{err.name}</span>
                                            <span className="opacity-80">{err.error}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {!updating && !isComplete && parsedUsers.length > 0 && (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label>Preview Updates ({parsedUsers.length})</Label>
                        </div>
                        <div className="border rounded-md">
                            <div className="h-[200px] overflow-y-auto relative">
                                <Table>
                                    <TableHeader className="sticky top-0 bg-secondary z-10">
                                        <TableRow>
                                            <TableHead className="w-[50px]">S.No</TableHead>
                                            <TableHead>ITS</TableHead>
                                            <TableHead>New Name</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {parsedUsers.slice(0, 100).map((user, idx) => (
                                            <TableRow key={idx}>
                                                <TableCell className="text-muted-foreground text-xs">{idx + 1}</TableCell>
                                                <TableCell className="font-medium">{user.itsNumber}</TableCell>
                                                <TableCell>{user.name}</TableCell>
                                            </TableRow>
                                        ))}
                                        {parsedUsers.length > 100 && (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center text-muted-foreground text-xs py-4">
                                                    ...and {parsedUsers.length - 100} more
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </div>
                )}

                <Button
                    onClick={handleUpdateUsers}
                    disabled={parsedUsers.length === 0 || updating}
                    className="w-full"
                >
                    {updating ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <PenLine className="mr-2 h-4 w-4" />}
                    {updating ? 'Updating...' : `Update Names (${parsedUsers.length})`}
                </Button>
            </CardContent>
        </Card>
    );
}
