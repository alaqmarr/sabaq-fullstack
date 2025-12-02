'use client';

import { useState, useEffect } from 'react';
import { bulkEnrollUsers } from '@/actions/enrollments';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserPlus, Upload, Loader2, CheckCircle2, XCircle, AlertCircle, HardDrive, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { motion, AnimatePresence } from 'framer-motion';
import { Progress } from '@/components/ui/progress';

interface BulkEnrollmentDialogProps {
    sabaqId: string;
    sabaqName: string;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function BulkEnrollmentDialog({ sabaqId, sabaqName, open: controlledOpen, onOpenChange }: BulkEnrollmentDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false);

    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : internalOpen;
    const setOpen = isControlled ? onOpenChange! : setInternalOpen;
    const [itsInput, setItsInput] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
    const [results, setResults] = useState<any>(null);
    const [progress, setProgress] = useState(0);

    // Simulate progress during processing
    useEffect(() => {
        if (status === 'processing') {
            const interval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 90) return prev;
                    return prev + Math.random() * 10;
                });
            }, 500);
            return () => clearInterval(interval);
        } else if (status === 'idle') {
            setProgress(0);
        }
    }, [status]);

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
        setStatus('processing');
        setProgress(0);

        try {
            const result = await bulkEnrollUsers(sabaqId, itsNumbers);

            if (!result.success) {
                toast.error('error' in result ? result.error : 'Failed to bulk enroll');
                setStatus('error');
                return;
            }

            if ('enrolled' in result) {
                setResults(result);
                setProgress(100);
                setStatus('success');
                toast.success(`Successfully enrolled ${result.enrolled.length} users`);
            }
        } catch (error) {
            toast.error('An error occurred during bulk enrollment');
            setStatus('error');
        }
    };

    const handleClose = () => {
        if (status === 'processing') return;
        setOpen(false);
        setTimeout(() => {
            setItsInput('');
            setFile(null);
            setResults(null);
            setStatus('idle');
            setProgress(0);
        }, 300);
    };

    return (
        <Dialog open={open} onOpenChange={(val) => {
            if (status === 'processing' && !val) return;
            handleClose();
        }}>
            {!isControlled && (
                <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                        <UserPlus className="h-4 w-4" />
                        Bulk Enroll
                    </Button>
                </DialogTrigger>
            )}
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto glass">
                <DialogHeader>
                    <DialogTitle>
                        {status === 'idle' ? 'Bulk Enroll Users' :
                            status === 'processing' ? 'Enrolling Users' :
                                status === 'success' ? 'Enrollment Complete' : 'Enrollment Failed'}
                    </DialogTitle>
                    <DialogDescription>
                        {status === 'idle' && <span>Enroll multiple users in <strong>{sabaqName}</strong> at once</span>}
                        {status === 'processing' && 'Please wait while we process the enrollment requests...'}
                        {status === 'success' && 'Users have been successfully enrolled.'}
                        {status === 'error' && 'There was an error processing your request.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    <AnimatePresence mode="wait">
                        {status === 'idle' && (
                            <motion.div
                                key="idle"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                            >
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
                            </motion.div>
                        )}

                        {status === 'processing' && (
                            <motion.div
                                key="processing"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="space-y-8 py-8"
                            >
                                <div className="flex items-center justify-center gap-4 sm:gap-8">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="p-4 bg-blue-100 dark:bg-blue-900/20 rounded-full text-blue-600 dark:text-blue-400 relative">
                                            <Users className="w-8 h-8" />
                                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-black animate-pulse" />
                                        </div>
                                        <span className="text-xs font-medium text-muted-foreground">Users</span>
                                    </div>

                                    <div className="flex-1 flex flex-col items-center gap-2 max-w-[120px]">
                                        <div className="relative w-full h-1.5 bg-muted rounded-full overflow-hidden">
                                            <motion.div
                                                className="absolute inset-0 bg-blue-500"
                                                initial={{ x: '-100%' }}
                                                animate={{ x: '100%' }}
                                                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                                            />
                                        </div>
                                        <span className="text-[10px] text-blue-500 font-medium animate-pulse">Enrolling...</span>
                                    </div>

                                    <div className="flex flex-col items-center gap-2">
                                        <div className="p-4 bg-purple-100 dark:bg-purple-900/20 rounded-full text-purple-600 dark:text-purple-400">
                                            <HardDrive className="w-8 h-8" />
                                        </div>
                                        <span className="text-xs font-medium text-muted-foreground">Database</span>
                                    </div>
                                </div>

                                <div className="space-y-2 max-w-md mx-auto">
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>Progress</span>
                                        <span>{Math.round(progress)}%</span>
                                    </div>
                                    <Progress value={progress} className="h-2 w-full" />
                                    <p className="text-xs text-center text-muted-foreground">
                                        Processing {parseItsNumbers(itsInput).length} users...
                                    </p>
                                </div>
                            </motion.div>
                        )}

                        {status === 'success' && results && (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="space-y-4"
                            >
                                <div className="space-y-4">
                                    {results.enrolled?.length > 0 && (
                                        <Alert className="border-green-500 bg-green-50 dark:bg-green-950"><CheckCircle2 className="h-4 w-4 text-green-600" /><AlertDescription><strong>Successfully Enrolled ({results.enrolled.length}):</strong><div className="mt-2 max-h-32 overflow-y-auto text-xs">{results.enrolled.map((u: any) => <div key={u.itsNumber}>{u.itsNumber} - {u.name}</div>)}</div></AlertDescription></Alert>
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
                            </motion.div>
                        )}

                        {status === 'error' && (
                            <motion.div
                                key="error"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col items-center justify-center py-8 text-center"
                            >
                                <XCircle className="h-12 w-12 text-red-500 mb-4" />
                                <h3 className="text-lg font-medium">Enrollment Failed</h3>
                                <p className="text-sm text-muted-foreground mt-2">
                                    An error occurred while processing your request. Please try again.
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <DialogFooter>
                    {status === 'idle' ? (
                        <>
                            <Button variant="outline" onClick={handleClose}>Cancel</Button>
                            <Button onClick={handleSubmit} disabled={!itsInput.trim()}>Enroll Users</Button>
                        </>
                    ) : (
                        <Button onClick={handleClose} disabled={status === 'processing'}>
                            {status === 'processing' ? 'Processing...' : 'Close'}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
