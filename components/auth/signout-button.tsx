'use client';

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
import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { useState } from "react";

interface SignOutButtonProps {
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "frosted-red" | "frosted-blue";
    className?: string;
    children?: React.ReactNode;
}

export function SignOutButton({ variant = "frosted-red", className, children }: SignOutButtonProps) {
    const [open, setOpen] = useState(false);

    const handleSignOut = async () => {
        await signOut({ callbackUrl: '/' });
    };

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button variant={variant} size="sm" className={className}>
                    {children || (
                        <>
                            <LogOut className="h-4 w-4 mr-2" />
                            Sign Out
                        </>
                    )}
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Sign out?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to sign out of your account?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleSignOut}
                        className="bg-red-600 hover:bg-red-700 text-white focus:ring-red-600"
                    >
                        Sign Out
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
