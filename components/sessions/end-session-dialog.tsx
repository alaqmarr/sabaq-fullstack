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
import { Loader2, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
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
}

export function EndSessionDialog({
    sessionId,
    sabaqName,
    onSuccess,
}: EndSessionDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [status, setStatus] = useState<"idle" | "syncing" | "success" | "error">(
        "idle"
    );
    const [progress, setProgress] = useState(0);
    const [syncStats, setSyncStats] = useState({ current: 0, total: 0 });
    const [resultMessage, setResultMessage] = useState("");

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
        setIsOpen(false);
        setTimeout(() => {
            setStatus("idle");
            setProgress(0);
            setResultMessage("");
        }, 500);
    };

    return (
        <AlertDialog open={isOpen} onOpenChange={(open) => {
            // Prevent closing if syncing
            if (status === "syncing" && !open) return;
            setIsOpen(open);
        }}>
            <AlertDialogTrigger asChild>
                <Button variant="destructive">End Session</Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="sm:max-w-md">
                <AlertDialogHeader>
                    <AlertDialogTitle>End Session: {sabaqName}</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will finalize the session and sync all realtime attendance data to the main database.
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
                            >
                                <p className="text-sm text-muted-foreground">
                                    Are you sure you want to end this session? This action cannot be undone.
                                </p>
                            </motion.div>
                        )}

                        {status === "syncing" && (
                            <motion.div
                                key="syncing"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="space-y-6 text-center"
                            >
                                <div className="relative mx-auto flex h-24 w-24 items-center justify-center">
                                    <motion.div
                                        className="absolute inset-0 rounded-full border-4 border-blue-100"
                                        animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    />
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                    >
                                        <RefreshCw className="h-10 w-10 text-blue-600" />
                                    </motion.div>
                                </div>

                                <div className="space-y-2">
                                    <h3 className="font-medium text-blue-600">Syncing Attendance...</h3>
                                    <Progress value={progress} className="h-2 w-full" />
                                    <p className="text-xs text-muted-foreground">
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
                                className="space-y-4 text-center"
                            >
                                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-medium text-green-600">Sync Complete!</h3>
                                    <p className="text-sm text-muted-foreground">{resultMessage}</p>
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
                                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                                    <AlertCircle className="h-8 w-8 text-red-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-medium text-red-600">Sync Failed</h3>
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
                            <AlertDialogAction onClick={handleEndSession} className="bg-destructive hover:bg-destructive/90">
                                End Session & Sync
                            </AlertDialogAction>
                        </>
                    )}

                    {(status === "success" || status === "error") && (
                        <AlertDialogAction onClick={handleClose}>Close</AlertDialogAction>
                    )}
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
