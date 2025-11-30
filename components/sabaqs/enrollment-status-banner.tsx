import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, Clock, XCircle } from "lucide-react";

interface EnrollmentStatusBannerProps {
    status: "PENDING" | "APPROVED" | "REJECTED" | null;
    rejectionReason?: string | null;
}

export function EnrollmentStatusBanner({ status, rejectionReason }: EnrollmentStatusBannerProps) {
    if (!status) return null;

    if (status === "APPROVED") {
        return (
            <Alert className="bg-green-500/15 border-green-500/20 text-green-700 dark:text-green-400">
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Enrolled</AlertTitle>
                <AlertDescription>
                    You are successfully enrolled in this sabaq.
                </AlertDescription>
            </Alert>
        );
    }

    if (status === "PENDING") {
        return (
            <Alert className="bg-orange-500/15 border-orange-500/20 text-orange-700 dark:text-orange-400">
                <Clock className="h-4 w-4" />
                <AlertTitle>Pending Approval</AlertTitle>
                <AlertDescription>
                    Your enrollment request is under review.
                </AlertDescription>
            </Alert>
        );
    }

    if (status === "REJECTED") {
        return (
            <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Enrollment Rejected</AlertTitle>
                <AlertDescription>
                    {rejectionReason || "Your enrollment request was rejected."}
                </AlertDescription>
            </Alert>
        );
    }

    return null;
}
