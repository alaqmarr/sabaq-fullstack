'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, CameraOff, Loader2, CheckCircle, XCircle, ScanLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { playSuccessSound, playErrorSound } from '@/lib/sounds';
import { cn } from '@/lib/utils';

interface QRScannerProps {
    onScan: (decodedText: string) => Promise<void>;
    onError?: (error: string) => void;
    scanResult?: { type: 'success' | 'error'; message: string } | null;
    onClearResult?: () => void;
}

export function QRScanner({ onScan, onError, scanResult, onClearResult }: QRScannerProps) {
    const [isScanning, setIsScanning] = useState(false);
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const scannerRef = useRef<Html5Qrcode | null>(null);
    const lastScanTimeRef = useRef<number>(0);
    const qrCodeRegionId = 'qr-reader';

    // Handle Scan Result (Sound + Overlay + Delay)
    useEffect(() => {
        if (scanResult) {
            if (scanResult.type === 'success') {
                playSuccessSound();
            } else {
                playErrorSound();
            }

            // Auto-clear after 1.5 seconds (giving user time to read)
            const timer = setTimeout(() => {
                if (onClearResult) onClearResult();
                // Re-enable scanning after the overlay disappears
                setIsProcessing(false);
            }, 1500);

            return () => clearTimeout(timer);
        }
    }, [scanResult, onClearResult]);

    const handleScan = async (decodedText: string) => {
        const now = Date.now();
        // Enforce 1 second delay between scans locally, and check if we are already processing
        if (now - lastScanTimeRef.current < 1000 || isProcessing || scanResult) {
            return;
        }

        lastScanTimeRef.current = now;
        setIsProcessing(true); // Block further scans until result is handled

        try {
            await onScan(decodedText);
            // Note: isProcessing remains true until scanResult is cleared or if onScan fails without setting result
        } catch (e) {
            console.error("Scan handler error", e);
            setIsProcessing(false); // Release lock if error occurs outside of result flow
        }
    };

    const startScanning = async () => {
        try {
            setError(null);

            // Request camera permission
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            stream.getTracks().forEach(track => track.stop()); // Stop the test stream

            setHasPermission(true);

            // Initialize scanner
            if (!scannerRef.current) {
                scannerRef.current = new Html5Qrcode(qrCodeRegionId);
            }

            const config = {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0,
                formatsToSupport: [
                    0,  // QR_CODE
                    8,  // CODE_128
                    7,  // CODE_39
                    13, // EAN_13
                    14, // EAN_8
                    16, // ITF
                    17, // CODE_93
                ],
            };

            await scannerRef.current.start(
                { facingMode: 'environment' }, // Use rear camera
                config,
                (decodedText) => {
                    handleScan(decodedText);
                },
                (errorMessage) => {
                    // Error callback - only log, don't show to user unless critical
                    if (onError && !errorMessage.includes('NotFoundException')) {
                        // onError(errorMessage); 
                    }
                }
            );

            setIsScanning(true);
        } catch (err: any) {
            console.error('Camera error:', err);
            setHasPermission(false);
            setError(err.message || 'Failed to access camera. Please grant camera permissions.');
            if (onError) onError(err.message);
        }
    };

    const stopScanning = async () => {
        try {
            if (scannerRef.current?.isScanning) {
                await scannerRef.current.stop();
                setIsScanning(false);
            }
        } catch (err) {
            console.error('Error stopping scanner:', err);
        }
    };

    useEffect(() => {
        return () => {
            // Cleanup on unmount
            if (scannerRef.current?.isScanning) {
                scannerRef.current.stop().catch(console.error);
            }
        };
    }, []);

    return (
        <div className="space-y-4">
            {/* Scanner Container */}
            <div className="relative w-full aspect-square max-w-[400px] mx-auto bg-black rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10">
                <div id={qrCodeRegionId} className="w-full h-full" />

                {/* Scanning Overlay (Animation) */}
                {isScanning && !scanResult && (
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute inset-0 border-2 border-white/20 rounded-2xl" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-white/30 rounded-lg">
                            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-primary" />
                            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-primary" />
                            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-primary" />
                            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-primary" />
                        </div>
                        <div className="absolute top-0 left-0 w-full h-1 bg-primary/50 shadow-[0_0_20px_rgba(var(--primary),0.5)] animate-scan" />
                    </div>
                )}

                {/* Result Overlay */}
                {scanResult && (
                    <div className={cn(
                        "absolute inset-0 z-50 flex flex-col items-center justify-center p-6 text-center backdrop-blur-md transition-all duration-300 animate-in fade-in zoom-in-95",
                        scanResult.type === 'success' ? "bg-green-500/20" : "bg-red-500/20"
                    )}>
                        <div className={cn(
                            "p-4 rounded-full mb-4 shadow-lg",
                            scanResult.type === 'success' ? "bg-green-500 text-white" : "bg-red-500 text-white"
                        )}>
                            {scanResult.type === 'success' ? (
                                <CheckCircle className="h-12 w-12" />
                            ) : (
                                <XCircle className="h-12 w-12" />
                            )}
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2 drop-shadow-md">
                            {scanResult.type === 'success' ? 'Success!' : 'Error'}
                        </h3>
                        <p className="text-white/90 font-medium text-lg drop-shadow-md max-w-[80%]">
                            {scanResult.message}
                        </p>
                    </div>
                )}
            </div>

            {/* Error Alert */}
            {error && (
                <Alert variant="destructive">
                    <CameraOff className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Permission Request */}
            {hasPermission === false && (
                <Alert>
                    <Camera className="h-4 w-4" />
                    <AlertDescription>
                        Camera access is required to scan QR codes. Please enable camera permissions in your browser settings.
                    </AlertDescription>
                </Alert>
            )}

            {/* Control Button */}
            <div className="flex justify-center">
                {!isScanning ? (
                    <Button onClick={startScanning} className="gap-2 w-full max-w-xs frosted-blue h-12 text-lg" size="lg">
                        <Camera className="h-5 w-5" />
                        Start Scanner
                    </Button>
                ) : (
                    <Button onClick={stopScanning} variant="destructive" className="gap-2 w-full max-w-xs h-12 text-lg" size="lg">
                        <CameraOff className="h-5 w-5" />
                        Stop Scanner
                    </Button>
                )}
            </div>

            {/* Instructions */}
            {isScanning && !scanResult && (
                <p className="text-center text-sm text-muted-foreground animate-pulse flex items-center justify-center gap-2">
                    <ScanLine className="h-4 w-4" />
                    Scanning... Point camera at QR code
                </p>
            )}
        </div>
    );
}
