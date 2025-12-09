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

interface EnrollSabaqDialogProps {
    user: any;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EnrollSabaqDialog({
    user,
    open,
    onOpenChange,
}: EnrollSabaqDialogProps) {
    const [sabaqs, setSabaqs] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [enroll, setEnroll] = useState(false);
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

    const handleEnroll = async () => {
        if (!selectedSabaqId) return;

        setEnroll(true);
        try {
            // Force ENROLL type
            const result = await assignUserToSabaq(user.id, selectedSabaqId, 'ENROLL');
            if (result.success) {
                toast.success(result.message);
                onOpenChange(false);
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            toast.error("An error occurred while enrolling user");
        } finally {
            setEnroll(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] glass-card">
                <DialogHeader>
                    <DialogTitle>Enroll {user.name} in Sabaq</DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div className="text-sm text-muted-foreground">
                        Select a sabaq to enroll {user.name}.
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
                        disabled={enroll}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="frosted-green"
                        onClick={handleEnroll}
                        disabled={!selectedSabaqId || enroll}
                    >
                        {enroll && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Enroll
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
