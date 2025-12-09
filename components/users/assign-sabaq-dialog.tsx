"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { getSabaqs } from "@/actions/sabaqs";
import { assignUserToSabaq } from "@/actions/sabaqs";

interface AssignSabaqDialogProps {
    user: any;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AssignSabaqDialog({
    user,
    open,
    onOpenChange,
}: AssignSabaqDialogProps) {
    const [sabaqs, setSabaqs] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [assigning, setAssigning] = useState(false);
    const [selectedSabaqId, setSelectedSabaqId] = useState<string>("");

    useEffect(() => {
        if (open) {
            fetchSabaqs();
        }
    }, [open]);

    const fetchSabaqs = async () => {
        setLoading(true);
        try {
            const result = await getSabaqs();
            if (result.success) {
                setSabaqs(result.sabaqs);
            } else {
                toast.error(result.error || "Failed to load sabaqs");
            }
        } catch (error) {
            toast.error("Failed to load sabaqs");
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async () => {
        if (!selectedSabaqId) return;

        setAssigning(true);
        try {
            const result = await assignUserToSabaq(user.id, selectedSabaqId);
            if (result.success) {
                toast.success(result.message);
                onOpenChange(false);
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            toast.error("An error occurred while assigning user");
        } finally {
            setAssigning(false);
        }
    };

    // Determine label based on user role
    const getActionLabel = () => {
        if (user.role === "JANAB") return "Assign as Janab";
        if (["ADMIN", "MANAGER", "ATTENDANCE_INCHARGE"].includes(user.role))
            return "Assign as Admin";
        return "Enroll in Sabaq";
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] glass-card">
                <DialogHeader>
                    <DialogTitle>Assign {user.name} to Sabaq</DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div className="text-sm text-muted-foreground">
                        Select a sabaq to {getActionLabel().toLowerCase()} for {user.name} ({user.role}).
                    </div>

                    {loading ? (
                        <div className="flex justify-center p-4">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                    ) : (
                        <Select value={selectedSabaqId} onValueChange={setSelectedSabaqId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a sabaq" />
                            </SelectTrigger>
                            <SelectContent>
                                {sabaqs.map((sabaq) => (
                                    <SelectItem key={sabaq.id} value={sabaq.id}>
                                        {sabaq.name} ({sabaq.level})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </div>
                <DialogFooter>
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        disabled={assigning}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="frosted-blue"
                        onClick={handleAssign}
                        disabled={!selectedSabaqId || assigning}
                    >
                        {assigning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {getActionLabel()}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
