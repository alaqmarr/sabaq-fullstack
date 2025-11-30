"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Check, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface RegistrationLinkProps {
    sabaqId: string;
}

export function RegistrationLink({ sabaqId }: RegistrationLinkProps) {
    const [copied, setCopied] = useState(false);
    const [origin, setOrigin] = useState("");

    useEffect(() => {
        setOrigin(window.location.origin);
    }, []);

    const url = `${origin}/sabaqs/${sabaqId}/register`;

    const copyToClipboard = () => {
        navigator.clipboard.writeText(url);
        setCopied(true);
        toast.success("Link copied to clipboard");
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex flex-col gap-2 p-4 bg-muted/50 rounded-lg border">
            <h3 className="text-sm font-medium text-muted-foreground">
                Public Registration Link
            </h3>
            <div className="flex gap-2">
                <Input value={url} readOnly className="font-mono text-sm" />
                <Button variant="outline" size="icon" onClick={copyToClipboard}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
                <Link href={`/sabaqs/${sabaqId}/register`} target="_blank">
                    <Button variant="outline" size="icon">
                        <ExternalLink className="h-4 w-4" />
                    </Button>
                </Link>
            </div>
        </div>
    );
}
