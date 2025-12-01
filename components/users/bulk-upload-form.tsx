'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Upload, Trash2, AlertCircle, CheckCircle, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { bulkCreateUsers, bulkUpdateUsers } from '@/actions/users';
import { Role } from '@prisma/client';

interface ParsedUser {
    itsNumber: string;
    name: string;
    email?: string;
    phone?: string;
    role?: Role;
    password?: string;
}

export function BulkUploadForm() {
    const [users, setUsers] = useState<ParsedUser[]>([]);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message: string; count?: number; skipped?: number } | null>(null);
    const [mode, setMode] = useState<'create' | 'update'>('create');
    const [progress, setProgress] = useState(0);
    const [processedCount, setProcessedCount] = useState(0);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws) as any[];

                // Map and validate data
                const parsedUsers: ParsedUser[] = data.map((row: any) => ({
                    itsNumber: String(row['ITS Number'] || row['ITS'] || row['itsNumber'] || '').trim(),
                    name: String(row['Name'] || row['name'] || '').trim(),
                    email: row['Email'] || row['email'] || undefined,
                    phone: row['Phone'] || row['phone'] ? String(row['Phone'] || row['phone']) : undefined,
                    role: (row['Role'] || row['role'] || (mode === 'create' ? 'MUMIN' : undefined))?.toUpperCase() as Role | undefined,
                    password: row['Password'] || row['password'] || undefined,
                })).filter(u => u.itsNumber); // Basic validation: ITS is mandatory

                if (parsedUsers.length === 0) {
                    toast.error('No valid data found in file');
                    return;
                }

                setUsers(parsedUsers);
                setResult(null);
                setProcessedCount(0);
                setProgress(0);
                toast.success(`Parsed ${parsedUsers.length} users`);
            } catch (error) {
                console.error('Parse error:', error);
                toast.error('Failed to parse file');
            }
        };
        reader.readAsBinaryString(file);
    };

    const handleRemoveRow = (index: number) => {
        setUsers(users.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (users.length === 0) return;

        setLoading(true);
        setProcessedCount(0);
        setProgress(0);
        setResult(null);

        const BATCH_SIZE = 20;
        const totalUsers = users.length;
        let totalSuccess = 0;
        let totalSkipped = 0;
        let allErrors: string[] = [];

        try {
            const action = mode === 'create' ? bulkCreateUsers : bulkUpdateUsers;

            for (let i = 0; i < totalUsers; i += BATCH_SIZE) {
                const batch = users.slice(i, i + BATCH_SIZE);
                const res = await action(batch);

                if (res.success) {
                    totalSuccess += res.count || 0;
                    totalSkipped += res.skipped || 0;
                    if (res.errors) allErrors = [...allErrors, ...res.errors];
                } else {
                    allErrors.push(`Batch ${i / BATCH_SIZE + 1} failed: ${res.error}`);
                }

                const currentProcessed = Math.min(i + BATCH_SIZE, totalUsers);
                setProcessedCount(currentProcessed);
                setProgress(Math.round((currentProcessed / totalUsers) * 100));
            }

            const isSuccess = totalSuccess > 0 || (totalSkipped > 0 && allErrors.length === 0);

            setResult({
                success: isSuccess,
                message: `Processed ${totalUsers} users. Success: ${totalSuccess}, Skipped/Failed: ${totalSkipped + allErrors.length}`,
                count: totalSuccess,
                skipped: totalSkipped
            });

            if (isSuccess) {
                toast.success(`Bulk ${mode} completed`);
                if (totalSuccess === totalUsers) {
                    setUsers([]); // Clear table only if fully successful
                }
            } else {
                toast.error(`Bulk ${mode} completed with errors`);
            }

        } catch (error) {
            setResult({
                success: false,
                message: 'An unexpected error occurred'
            });
            toast.error('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <Tabs value={mode} onValueChange={(v) => setMode(v as 'create' | 'update')} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="create">Bulk Create</TabsTrigger>
                    <TabsTrigger value="update">Bulk Update</TabsTrigger>
                </TabsList>

                <TabsContent value="create" className="mt-6">
                    <UploadSection
                        mode="create"
                        onUpload={handleFileUpload}
                        result={result}
                        users={users}
                        loading={loading}
                        progress={progress}
                        processedCount={processedCount}
                        onRemove={handleRemoveRow}
                        onSubmit={handleSubmit}
                    />
                </TabsContent>

                <TabsContent value="update" className="mt-6">
                    <UploadSection
                        mode="update"
                        onUpload={handleFileUpload}
                        result={result}
                        users={users}
                        loading={loading}
                        progress={progress}
                        processedCount={processedCount}
                        onRemove={handleRemoveRow}
                        onSubmit={handleSubmit}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}

function UploadSection({
    mode,
    onUpload,
    result,
    users,
    loading,
    progress,
    processedCount,
    onRemove,
    onSubmit
}: {
    mode: 'create' | 'update',
    onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void,
    result: any,
    users: ParsedUser[],
    loading: boolean,
    progress: number,
    processedCount: number,
    onRemove: (index: number) => void,
    onSubmit: () => void
}) {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>{mode === 'create' ? 'Upload New Users' : 'Update Existing Users'}</CardTitle>
                    <CardDescription>
                        Upload an .xlsx or .csv file with columns: ITS Number (Required), Name{mode === 'create' ? ' (Required)' : ''}, Email, Phone, Role.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4">
                        <Input
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            onChange={onUpload}
                            className="max-w-md"
                        />
                        <Button variant="outline" onClick={() => window.open('/template.xlsx')} disabled>
                            <FileSpreadsheet className="mr-2 h-4 w-4" />
                            Download Template
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {loading && (
                <Card>
                    <CardContent className="pt-6">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Processing...</span>
                                <span>{processedCount} / {users.length} ({progress}%)</span>
                            </div>
                            <Progress value={progress} />
                        </div>
                    </CardContent>
                </Card>
            )}

            {result && !loading && (
                <Alert variant={result.success ? "default" : "destructive"}>
                    {result.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                    <AlertTitle>{result.success ? 'Success' : 'Error'}</AlertTitle>
                    <AlertDescription>{result.message}</AlertDescription>
                </Alert>
            )}

            {users.length > 0 && (
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Preview ({users.length} users)</CardTitle>
                        <Button onClick={onSubmit} disabled={loading}>
                            {loading ? 'Processing...' : (mode === 'create' ? 'Create Users' : 'Update Users')}
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>ITS Number</TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Phone</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users.slice(0, 100).map((user, index) => (
                                        <TableRow key={index}>
                                            <TableCell>{user.itsNumber}</TableCell>
                                            <TableCell>{user.name || <span className="text-muted-foreground italic">No Change</span>}</TableCell>
                                            <TableCell>{user.email || <span className="text-muted-foreground italic">No Change</span>}</TableCell>
                                            <TableCell>{user.phone || <span className="text-muted-foreground italic">No Change</span>}</TableCell>
                                            <TableCell>{user.role || <span className="text-muted-foreground italic">No Change</span>}</TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => onRemove(index)}
                                                    className="text-destructive hover:text-destructive"
                                                    disabled={loading}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {users.length > 100 && (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center text-muted-foreground">
                                                ... and {users.length - 100} more rows
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
