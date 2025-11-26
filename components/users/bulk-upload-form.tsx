'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Upload, Trash2, AlertCircle, CheckCircle, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { bulkCreateUsers } from '@/actions/users';
import { Role } from '@prisma/client';

interface ParsedUser {
    itsNumber: string;
    name: string;
    email?: string;
    phone?: string;
    role?: Role;
}

export function BulkUploadForm() {
    const [users, setUsers] = useState<ParsedUser[]>([]);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message: string; count?: number; skipped?: number } | null>(null);

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
                    role: (row['Role'] || row['role'] || 'MUMIN').toUpperCase() as Role,
                })).filter(u => u.itsNumber && u.name); // Basic validation

                if (parsedUsers.length === 0) {
                    toast.error('No valid data found in file');
                    return;
                }

                setUsers(parsedUsers);
                setResult(null);
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
        try {
            const res = await bulkCreateUsers(users);
            if (res.success) {
                setResult({
                    success: true,
                    message: res.message || 'Upload successful',
                    count: res.count,
                    skipped: res.skipped
                });
                toast.success('Bulk upload completed');
                if (res.count && res.count > 0) {
                    setUsers([]); // Clear table on success
                }
            } else {
                setResult({
                    success: false,
                    message: res.error || 'Upload failed'
                });
                toast.error(res.error || 'Upload failed');
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
            <Card>
                <CardHeader>
                    <CardTitle>Upload Excel File</CardTitle>
                    <CardDescription>
                        Upload an .xlsx or .csv file with columns: ITS Number, Name, Email (optional), Phone (optional), Role (optional).
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4">
                        <Input
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            onChange={handleFileUpload}
                            className="max-w-md"
                        />
                        <Button variant="outline" onClick={() => window.open('/template.xlsx')} disabled>
                            <FileSpreadsheet className="mr-2 h-4 w-4" />
                            Download Template
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {result && (
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
                        <Button onClick={handleSubmit} disabled={loading}>
                            {loading ? 'Uploading...' : 'Upload Users'}
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
                                    {users.map((user, index) => (
                                        <TableRow key={index}>
                                            <TableCell>{user.itsNumber}</TableCell>
                                            <TableCell>{user.name}</TableCell>
                                            <TableCell>{user.email || '-'}</TableCell>
                                            <TableCell>{user.phone || '-'}</TableCell>
                                            <TableCell>{user.role}</TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleRemoveRow(index)}
                                                    className="text-destructive hover:text-destructive"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
