'use client';

import { useState } from 'react';
import { bulkEnrollUsers } from '@/actions/enrollments';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserPlus, Upload, Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface BulkEnrollmentDialogProps {
    sabaqId: string;
    sabaqName: string;
}

export function BulkEnrollmentDialog({ sabaqId, sabaqName }: BulkEnrollmentDialogProps) {
    const [open, setOpen] = useState(false);
    const [itsInput, setItsInput] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [processing, setProcessing] = useState(false);
    const [results, setResults] = useState<any>(null);

    const parseItsNumbers = (text: string): string[] => {
        return text.split(/[\n,;\s]+/).map(its => its.trim()).filter(its => its.length > 0);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const uploadedFile = e.target.files?.[0];
        if (!uploadedFile) return;
        if (!uploadedFile.name.endsWith('.csv')) {
            toast.error('Please upload a CSV file');
            return;
        }
        setFile(uploadedFile);
        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            setItsInput(parseItsNumbers(text).join('\n'));
        };
        reader.readAsText(uploadedFile);
    };

    const handleSubmit = async () => {
        const itsNumbers = parseItsNumbers(itsInput);
        if (itsNumbers.length === 0) {
            toast.error('Please enter at least one ITS number');
            return;
        }
        setProcessing(true);
        try {
            const result = await bulkEnrollUsers(sabaqId, itsNumbers);
            if (!result.success) {
                toast.error('error' in result ? result.error : 'Failed to bulk enroll');
                setProcessing(false);
                return;
            }
            if ('enrolled' in result) {
                setResults(result);
                toast.success(`Successfully enrolled ${result.enrolled.length} users`);
            }
        } catch (error) {
            toast.error('An error occurred during bulk enrollment');
        } finally {
            setProcessing(false);
        }
    };

    const handleClose = () => {
        setOpen(false);
        setItsInput('');
        setFile(null);
        setResults(null);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <UserPlus className="h-4 w-4" />
                    Bulk Enroll
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto glass">
                <DialogHeader>
                    <DialogTitle>Bulk Enroll Users</DialogTitle>
                    <DialogDescription>Enroll multiple users in <strong>{sabaqName}</strong> at once</DialogDescription>
                </DialogHeader>
                {!results ? (
                    <Tabs defaultValue="manual" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                            <TabsTrigger value="csv">CSV Upload</TabsTrigger>
                        </TabsList>
                        <TabsContent value="manual" className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="its-input">ITS Numbers</Label>
                                <Textarea id="its-input" placeholder="Enter ITS numbers (one per line or comma-separated)&#10;12345678&#10;87654321" value={itsInput} onChange={(e) => setItsInput(e.target.value)} rows={10} className="font-mono text-sm" />
                                <p className="text-xs text-muted-foreground">{parseItsNumbers(itsInput).length} ITS numbers detected</p>
                            </div>
                        </TabsContent>
                        <TabsContent value="csv" className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="csv-upload">Upload CSV File</Label>
                                <div className="flex items-center gap-2">
                                    <Input id="csv-upload" type="file" accept=".csv" onChange={handleFileUpload} className="cursor-pointer" />
                                    <Upload className="h-4 w-4 text-muted-foreground" />
                                </div>
                                {file && <p className="text-sm text-green-600">✓ Loaded: {file.name}</p>}
                            </div>
                            <Alert><AlertCircle className="h-4 w-4" /><AlertDescription className="text-xs"><strong>CSV Format:</strong> One ITS number per row. Header row is optional.</AlertDescription></Alert>
                            {itsInput && (
                                <div className="space-y-2">
                                    <Label>Preview ({parseItsNumbers(itsInput).length} numbers)</Label>
                                    <div className="max-h-32 overflow-y-auto border rounded-md p-3 bg-muted/50 font-mono text-xs">
                                        {parseItsNumbers(itsInput).slice(0, 20).join(', ')}{parseItsNumbers(itsInput).length > 20 && '...'}
                                    </div>
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                ) : (
                    <div className="space-y-4">
                        {results.enrolled?.length > 0 && (
                            <Alert className="border-green-500 bg-green-50 dark:bg-green-950"><CheckCircle2 className="h-4 w-4 text-green-600" /><AlertDescription><strong>Successfully Enrolled ({results.enrolled.length}):</strong><div className="mot-2 max-h-32 overflow-y-auto text-xs">{results.enrolled.map((u: any) => <div key={u.itsNumber}>{u.itsNumber} - {u.name}</div>)}</div></AlertDescription></Alert>
                        )}
                        {results.alreadyEnrolled?.length > 0 && (
                            <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950"><AlertCircle className="h-4 w-4 text-yellow-600" /><AlertDescription><strong>Already Enrolled ({results.alreadyEnrolled.length}):</strong><div className="mt-2 max-h-32 overflow-y-auto text-xs">{results.alreadyEnrolled.map((u: any) => <div key={u.itsNumber}>{u.itsNumber} - {u.name}</div>)}</div></AlertDescription></Alert>
                        )}
                        {results.notFound?.length > 0 && (
                            <Alert className="border-red-500 bg-red-50 dark:bg-red-950"><XCircle className="h-4 w-4 text-red-600" /><AlertDescription><strong>Not Found ({results.notFound.length}):</strong><div className="mt-2 max-h-32 overflow-y-auto text-xs font-mono">{results.notFound.join(', ')}</div></AlertDescription></Alert>
                        )}
                        {results.invalid?.length > 0 && (
                            <Alert className="border-red-500 bg-red-50 dark:bg-red-950"><XCircle className="h-4 w-4 text-red-600" /><AlertDescription><strong>Invalid Format ({results.invalid.length}):</strong><div className="mt-2 max-h-32 overflow-y-auto text-xs font-mono">{results.invalid.join(', ')}</div></AlertDescription></Alert>
                        )}
                    </div>
                )}
                <DialogFooter>
                    {!results ? (
                        <>
                            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                            <Button onClick={handleSubmit} disabled={processing || !itsInput.trim()}>{processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Enroll Users</Button>
                        </>
                    ) : (
                        <Button onClick={handleClose}>Close</Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
