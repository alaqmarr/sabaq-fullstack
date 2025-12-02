"use client";

import { useState, useEffect } from "react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, AlertCircle, HardDrive, ArrowRight } from "lucide-react";
import { syncSessionAttendance } from "@/actions/sync";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { getDatabase, ref, onValue, off } from "firebase/database";
import { initializeApp, getApps, getApp } from "firebase/app";

// Ensure Firebase is initialized (client-side)
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function getFirebaseApp() {
    if (!getApps().length) {
        return initializeApp(firebaseConfig);
    }
    return getApp();
}

interface EndSessionDialogProps {
    sessionId: string;
    sabaqName: string;
    onSuccess?: () => void;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    children?: React.ReactNode;
}

export function EndSessionDialog({
    sessionId,
    sabaqName,
    onSuccess,
    open: controlledOpen,
    onOpenChange: controlledOnOpenChange,
    children,
}: EndSessionDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const [status, setStatus] = useState<"idle" | "syncing" | "success" | "error">("idle");
    const [progress, setProgress] = useState(0);
    const [syncStats, setSyncStats] = useState({ current: 0, total: 0 });
    const [resultStats, setResultStats] = useState<{ count: number; errors: number } | null>(null);
    const [resultMessage, setResultMessage] = useState("");

    const isControlled = controlledOpen !== undefined;
    const isOpen = isControlled ? controlledOpen : internalOpen;
    const onOpenChange = isControlled ? controlledOnOpenChange : setInternalOpen;

    // Listen to Firebase sync status
    useEffect(() => {
        if (!isOpen || status !== "syncing") return;

        const app = getFirebaseApp();
        const db = getDatabase(app);
        const statusRef = ref(db, `sessions/${sessionId}/syncStatus`);

        const handleStatusChange = (snapshot: any) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                if (data.total > 0) {
                    const percentage = Math.round((data.current / data.total) * 100);
                    setProgress(percentage);
                    setSyncStats({ current: data.current, total: data.total });
                }
            }
        };

        const unsubscribe = onValue(statusRef, handleStatusChange);

        return () => {
            off(statusRef, "value", handleStatusChange);
        };
    }, [isOpen, status, sessionId]);

    const handleEndSession = async () => {
        setStatus("syncing");
        setProgress(0);
        setSyncStats({ current: 0, total: 0 });

        try {
            const result = await syncSessionAttendance(sessionId);

            if (result.success) {
                setStatus("success");
                setProgress(100);
                setResultStats({ count: result.count || 0, errors: result.errors || 0 });
                setResultMessage(result.message || "Session finalized successfully.");
                toast.success("Session ended and attendance synced.");
                if (onSuccess) onSuccess();
            } else {
                setStatus("error");
                setResultMessage(result.error || "Failed to sync attendance.");
                toast.error(result.error || "Failed to end session.");
            }
        } catch (error) {
            setStatus("error");
            setResultMessage("An unexpected error occurred.");
            toast.error("An unexpected error occurred.");
        }
    };

    const handleClose = () => {
        if (status === "syncing") return; // Prevent closing while syncing
        if (onOpenChange) onOpenChange(false);
        setTimeout(() => {
            setStatus("idle");
            setProgress(0);
            setResultMessage("");
            setResultStats(null);
        }, 500);
    };

    return (
        <AlertDialog open={isOpen} onOpenChange={(open) => {
            // Prevent closing if syncing
            if (status === "syncing" && !open) return;
            if (onOpenChange) onOpenChange(open);
        }}>
            {children && (
                <AlertDialogTrigger asChild>
                    {children}
                </AlertDialogTrigger>
            )}
            {!children && !isControlled && (
                <AlertDialogTrigger asChild>
                    <Button variant="destructive">End Session</Button>
                </AlertDialogTrigger>
            )}
            <AlertDialogContent className="sm:max-w-lg">
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        {status === "idle" ? `End Session: ${sabaqName}` :
                            status === "syncing" ? "Syncing Attendance Data" :
                                status === "success" ? "Sync Complete" : "Sync Failed"}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        {status === "idle" && "This will finalize the session and sync all realtime attendance data to the main database."}
                        {status === "syncing" && "Please wait while we sync attendance records from the realtime database to the primary storage."}
                        {status === "success" && "Session has been successfully ended and all data has been synchronized."}
                        {status === "error" && "There was an error syncing the data. Please try again or contact support."}
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="py-6">
                    <AnimatePresence mode="wait">
                        {status === "idle" && (
                            <motion.div
                                key="idle"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="flex flex-col items-center justify-center py-4 text-center"
                            >
                                <AlertCircle className="h-12 w-12 text-yellow-500 mb-4" />
                                <p className="text-sm text-muted-foreground max-w-xs">
                                    Are you sure? This action cannot be undone.
                                </p>
                            </motion.div>
                        )}

                        {status === "syncing" && (
                            <motion.div
                                key="syncing"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="space-y-8"
                            >
                                <div className="flex items-center justify-center gap-4 sm:gap-8">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="p-4 bg-orange-100 dark:bg-orange-900/20 rounded-full text-orange-600 dark:text-orange-400 relative">
                                            <HardDrive className="w-8 h-8" />
                                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-black animate-pulse" />
                                        </div>
                                        <span className="text-xs font-medium text-muted-foreground">Realtime DB</span>
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
                                        <span className="text-[10px] text-blue-500 font-medium animate-pulse">Syncing...</span>
                                    </div>

                                    <div className="flex flex-col items-center gap-2">
                                        <div className="p-4 bg-blue-100 dark:bg-blue-900/20 rounded-full text-blue-600 dark:text-blue-400">
                                            <HardDrive className="w-8 h-8" />
                                        </div>
                                        <span className="text-xs font-medium text-muted-foreground">Primary DB</span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>Progress</span>
                                        <span>{syncStats.total > 0 ? `${Math.round((syncStats.current / syncStats.total) * 100)}%` : '0%'}</span>
                                    </div>
                                    <Progress value={progress} className="h-2 w-full" />
                                    <p className="text-xs text-center text-muted-foreground">
                                        {syncStats.total > 0
                                            ? `Processed ${syncStats.current} of ${syncStats.total} records`
                                            : "Initializing sync..."}
                                    </p>
                                </div>
                            </motion.div>
                        )}

                        {status === "success" && (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="space-y-6"
                            >
                                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                                    <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-muted/50 p-4 rounded-lg text-center">
                                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                            {resultStats?.count || 0}
                                        </div>
                                        <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                                            Records Synced
                                        </div>
                                    </div>
                                    <div className="bg-muted/50 p-4 rounded-lg text-center">
                                        <div className={`text-2xl font-bold ${resultStats?.errors ? 'text-red-500' : 'text-muted-foreground'}`}>
                                            {resultStats?.errors || 0}
                                        </div>
                                        <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                                            Failed
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {status === "error" && (
                            <motion.div
                                key="error"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="space-y-4 text-center"
                            >
                                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                                    <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-medium text-red-600 dark:text-red-400">Sync Failed</h3>
                                    <p className="text-sm text-muted-foreground">{resultMessage}</p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <AlertDialogFooter>
                    {status === "idle" && (
                        <>
                            <AlertDialogCancel onClick={handleClose}>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleEndSession();
                                }}
                                className="bg-destructive hover:bg-destructive/90"
                            >
                                End Session & Sync
                            </AlertDialogAction>
                        </>
                    )}

                    {(status === "success" || status === "error") && (
                        <AlertDialogAction onClick={handleClose} className="w-full sm:w-auto">
                            Close
                        </AlertDialogAction>
                    )}
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
