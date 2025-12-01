"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, ShieldAlert, ArrowLeft, Lock } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { logUnauthorizedAccess } from "@/actions/security";

export default function UnauthorizedPage() {
    useEffect(() => {
        // Log the unauthorized access attempt
        logUnauthorizedAccess("Unauthorized Page Visit", {
            url: window.location.href,
            referrer: document.referrer,
        });
    }, []);

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-background via-background to-destructive/5 p-4">
            <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]" />

            <Card className="w-full max-w-md border-destructive/20 shadow-2xl relative overflow-hidden backdrop-blur-xl bg-background/80">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-destructive via-orange-500 to-destructive" />

                <CardHeader className="text-center pb-2">
                    <div className="mx-auto bg-destructive/10 w-20 h-20 rounded-full flex items-center justify-center mb-4 ring-1 ring-destructive/20 shadow-inner">
                        <ShieldAlert className="h-10 w-10 text-destructive" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-destructive tracking-tight">
                        Access Denied
                    </CardTitle>
                </CardHeader>

                <CardContent className="text-center space-y-4 pt-2">
                    <div className="p-4 bg-destructive/5 rounded-lg border border-destructive/10">
                        <p className="text-sm font-medium text-destructive/80 flex items-center justify-center gap-2">
                            <AlertTriangle className="h-4 w-4" />
                            Security Alert
                        </p>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Your attempt to access this resource has been blocked and this activity has been <strong>flagged</strong> for security review.
                        </p>
                    </div>

                    <p className="text-sm text-muted-foreground leading-relaxed">
                        You do not have the necessary permissions to view this page. If you believe this is a mistake, please contact the system administrator immediately before attempting to access other resources.
                    </p>
                </CardContent>

                <CardFooter className="flex flex-col gap-3 pt-2">
                    <Link href="/dashboard" className="w-full">
                        <Button variant="outline" className="w-full gap-2 group hover:border-primary/50 hover:bg-primary/5">
                            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                            Return to Dashboard
                        </Button>
                    </Link>
                    <div className="text-xs text-center text-muted-foreground opacity-50 flex items-center justify-center gap-1">
                        <Lock className="h-3 w-3" />
                        Secure System Log ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
