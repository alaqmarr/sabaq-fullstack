'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, UserCog, RefreshCw, FileJson, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { bulkCreateUsers, fixMissingGenders } from '@/actions/users';
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export function BulkUserImport() {
    const [jsonInput, setJsonInput] = useState('');
    const [parsedUsers, setParsedUsers] = useState<any[]>([]);
    const [importing, setImporting] = useState(false);
    const [fixingGenders, setFixingGenders] = useState(false);

    // Progress State
    const [progress, setProgress] = useState(0);
    const [processedCount, setProcessedCount] = useState(0);
    const [successCount, setSuccessCount] = useState(0);
    const [importErrors, setImportErrors] = useState<any[]>([]);
    const [isComplete, setIsComplete] = useState(false);

    const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        setJsonInput(value);
        setIsComplete(false);
        setImportErrors([]);
        setSuccessCount(0);
        setProcessedCount(0);
        setProgress(0);

        if (!value.trim()) {
            setParsedUsers([]);
            return;
        }

        try {
            const json = JSON.parse(value);
            const users = Object.values(json).map((record: any) => ({
                itsNumber: String(record.mumin_id || record.itsNumber || ''),
                name: record.mumin_name || record.name || '',
                gender: record.mumin_gender === 'M' ? 'MALE' : (record.mumin_gender === 'F' ? 'FEMALE' : (record.gender === 'MALE' || record.gender === 'FEMALE' ? record.gender : undefined)),
                phone: String(record.mumin_mobile || record.phone || ''),
                email: record.email || '',
                role: 'MUMIN',
            })).filter(u => u.itsNumber);

            setParsedUsers(users);
        } catch (err) {
            setParsedUsers([]); // Invalid JSON
        }
    };

    const handleCreateUsers = async () => {
        if (parsedUsers.length === 0) return;

        setImporting(true);
        setIsComplete(false);
        setImportErrors([]);
        setSuccessCount(0);
        setProcessedCount(0);
        setProgress(0);

        try {
            const chunkSize = 100;
            const total = parsedUsers.length;
            let currentSuccess = 0;
            let currentProcessed = 0;
            const currentErrors: any[] = [];

            for (let i = 0; i < total; i += chunkSize) {
                const chunk = parsedUsers.slice(i, i + chunkSize);
                const result = await bulkCreateUsers(chunk);

                // Update stats
                currentProcessed += chunk.length;

                if (result.success) {
                    currentSuccess += result.count || 0;
                    if (result.errors) {
                        currentErrors.push(...result.errors);
                        setImportErrors(prev => [...prev, ...result.errors]);
                    }
                } else {
                    // Entire batch failed? This shouldn't happen with our new server action structure mostly,
                    // but if it does, add a generic error for the batch
                    chunk.forEach(u => {
                        const err = { its: u.itsNumber, name: u.name, error: result.error || "Batch Failed" };
                        currentErrors.push(err);
                    });
                    setImportErrors(prev => [...prev, ...currentErrors.slice(-chunk.length)]);
                }

                setSuccessCount(currentSuccess);
                setProcessedCount(currentProcessed);
                setProgress(Math.min(100, Math.round((currentProcessed / total) * 100)));
            }

            setIsComplete(true);
            toast.success(`Processed ${total} records.`);

        } catch (error) {
            toast.error("An critical error occurred during import");
            console.error(error);
        }
        setImporting(false);
    };

    const handleFixGenders = async () => {
        setFixingGenders(true);
        const result = await fixMissingGenders();
        if (result.success) {
            toast.success(result.message);
        } else {
            toast.error(result.error);
        }
        setFixingGenders(false);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <UserCog className="h-5 w-5" />
                    User Data Management
                </CardTitle>
                <CardDescription>Bulk import users via JSON and manage data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

                {/* JSON Input Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Label>Paste JSON Data</Label>
                        <Badge variant="secondary">Detected: {parsedUsers.length}</Badge>
                    </div>

                    <Textarea
                        placeholder='Paste your JSON here...'
                        className="font-mono text-xs h-[100px] resize-none"
                        value={jsonInput}
                        onChange={handleJsonChange}
                        disabled={importing}
                    />
                </div>

                {/* Import Progress & Results */}
                {(importing || isComplete) && (
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
                                    Success
                                </div>
                                <p className="text-2xl font-bold text-green-800">{successCount}</p>
                            </div>
                            <div className="bg-yellow-500/10 p-3 rounded-md border border-yellow-500/20">
                                <div className="flex items-center gap-2 text-yellow-700 font-medium">
                                    <AlertTriangle className="h-4 w-4" />
                                    Skipped
                                </div>
                                <p className="text-2xl font-bold text-yellow-800">{importErrors.length}</p>
                            </div>
                        </div>

                        {importErrors.length > 0 && (
                            <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">Detailed Errors</Label>
                                <div className="bg-background border rounded-md h-[150px] overflow-y-auto p-2 text-xs font-mono">
                                    {importErrors.map((err, i) => (
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

                {/* Preview Table */}
                {!importing && !isComplete && parsedUsers.length > 0 && (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label>Preview ({parsedUsers.length} records)</Label>
                        </div>
                        <div className="border rounded-md">
                            <div className="h-[300px] overflow-y-auto relative">
                                <Table>
                                    <TableHeader className="sticky top-0 bg-secondary z-10">
                                        <TableRow>
                                            <TableHead className="w-[50px]">S.No</TableHead>
                                            <TableHead>ITS</TableHead>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Gender</TableHead>
                                            <TableHead>Phone</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {parsedUsers.slice(0, 500).map((user, idx) => ( // Increased limit, still capped for DOM perf
                                            <TableRow key={idx}>
                                                <TableCell className="text-muted-foreground text-xs">{idx + 1}</TableCell>
                                                <TableCell className="font-medium">{user.itsNumber}</TableCell>
                                                <TableCell>{user.name}</TableCell>
                                                <TableCell>
                                                    {user.gender ? (
                                                        <Badge variant="outline" className={user.gender === 'MALE' ? 'text-blue-600 bg-blue-50' : 'text-pink-600 bg-pink-50'}>
                                                            {user.gender}
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-muted-foreground italic text-xs">Auto-Infer</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-xs">{user.phone}</TableCell>
                                            </TableRow>
                                        ))}
                                        {parsedUsers.length > 500 && (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center text-muted-foreground text-xs py-4">
                                                    ...and {parsedUsers.length - 500} more records (hidden for performance)
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                    <Button
                        onClick={handleCreateUsers}
                        disabled={parsedUsers.length === 0 || importing}
                        className="flex-1"
                    >
                        {importing ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                        {importing ? 'Processing...' : `Start Import (${parsedUsers.length})`}
                    </Button>
                </div>

                {/* Fix Genders Utility */}
                <div className="flex items-center justify-between border-t pt-4 mt-4">
                    <div className="space-y-1">
                        <Label>Fix Missing Genders</Label>
                        <p className="text-xs text-muted-foreground">
                            Infer gender for records not in JSON
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleFixGenders}
                        disabled={fixingGenders || importing}
                    >
                        {fixingGenders ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <UserCog className="mr-2 h-4 w-4" />}
                        Run Fix
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
