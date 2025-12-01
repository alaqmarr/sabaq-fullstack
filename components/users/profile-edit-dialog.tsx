"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { sendOTP } from "@/actions/otp";
import { updateUserProfile } from "@/actions/users";

import { useRouter } from "next/navigation";

interface ProfileEditDialogProps {
    user: any;
}

export function ProfileEditDialog({ user }: ProfileEditDialogProps) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState<"EDIT" | "OTP">("EDIT");
    const [loading, setLoading] = useState(false);
    const [otp, setOtp] = useState("");

    // Form State
    const [formData, setFormData] = useState({
        phone: user.phone || "",
        email: user.email || "",
    });

    const handleSendOTP = async () => {
        setLoading(true);
        try {
            const res = await sendOTP();
            if (res.success) {
                toast.success("Verification code sent to your email");
                setStep("OTP");
            } else {
                toast.error(res.error || "Failed to send OTP");
            }
        } catch (error) {
            toast.error("Something went wrong");
        } finally {
            setLoading(false);
        }
    };
    const handleVerifyAndSave = async () => {
        if (!otp) return toast.error("Please enter the verification code");

        setLoading(true);
        try {
            // Verify OTP and Save Changes in one go
            const result = await updateUserProfile(user.id, {
                phone: formData.phone,
                email: formData.email,
                otp: otp,
            });

            if (!result.success) {
                toast.error(result.error || "Failed to update profile");
                return;
            }

            toast.success("Profile updated successfully");
            setOpen(false);
            setStep("EDIT");
            setOtp("");
            router.refresh();
        } catch (error) {
            toast.error("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <Edit className="h-4 w-4" />
                    Edit Profile
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Profile</DialogTitle>
                    <DialogDescription>
                        {step === "EDIT"
                            ? "Make changes to your profile here. You will need to verify via email to save."
                            : "Enter the verification code sent to your email to confirm changes."}
                    </DialogDescription>
                </DialogHeader>

                {step === "EDIT" ? (
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input
                                id="phone"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="+91 98765 43210"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                                id="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="mumin@example.com"
                            />
                        </div>
                    </div>
                ) : (
                    <div className="grid gap-4 py-4">
                        <div className="flex justify-center py-4">
                            <ShieldCheck className="h-12 w-12 text-primary animate-pulse" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="otp" className="text-center">Verification Code</Label>
                            <Input
                                id="otp"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                className="text-center text-2xl tracking-widest"
                                maxLength={6}
                                placeholder="000000"
                            />
                        </div>
                    </div>
                )}

                <DialogFooter>
                    {step === "EDIT" ? (
                        <Button onClick={handleSendOTP} disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Verify & Save
                        </Button>
                    ) : (
                        <div className="flex gap-2 w-full">
                            <Button variant="ghost" className="flex-1" onClick={() => setStep("EDIT")}>
                                Back
                            </Button>
                            <Button className="flex-1" onClick={handleVerifyAndSave} disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Confirm
                            </Button>
                        </div>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
