"use client";

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
import { ReactNode } from "react";

interface ConfirmDialogProps {
    title: string;
    description: string;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
    variant?: "default" | "destructive";
    children?: ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    disabled?: boolean;
}

export function ConfirmDialog({
    title,
    description,
    onConfirm,
    confirmText = "Confirm",
    cancelText = "Cancel",
    variant = "default",
    children,
    open,
    onOpenChange,
    disabled = false,
}: ConfirmDialogProps) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            {children && <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>}
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>{description}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>{cancelText}</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault();
                            onConfirm();
                            if (!open && !onOpenChange) {
                                // If uncontrolled, we rely on the trigger to close, but Action closes it.
                                // Actually, if we want to support async operations inside onConfirm that might keep it open,
                                // we should probably let the parent handle closing if controlled.
                                // But for simple cases, we want it to close.
                                // The default behavior of AlertDialogAction is to close.
                                // If we want to prevent close, we need e.preventDefault().
                                // Let's assume onConfirm might be async and we might want to close manually?
                                // Or let's stick to standard behavior: click -> action -> close.
                                // If the user wants to keep it open (loading state), they should control it.
                            }
                        }}
                        className={variant === "destructive" ? "bg-destructive hover:bg-destructive/90" : ""}
                        disabled={disabled}
                    >
                        {confirmText}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
