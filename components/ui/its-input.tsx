'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { lookupUserByITS } from '@/actions/users';
import { Loader2, CheckCircle, XCircle, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface ITSInputProps {
    value: string;
    onChange: (value: string) => void;
    onUserFound?: (user: any) => void;
    label?: string;
    placeholder?: string;
    className?: string;
    required?: boolean;
}

export function ITSInput({
    value,
    onChange,
    onUserFound,
    label = "ITS Number",
    placeholder = "Enter 8-digit ITS",
    className,
    required = false
}: ITSInputProps) {
    const [loading, setLoading] = useState(false);
    const [foundUser, setFoundUser] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const checkITS = async () => {
            if (value.length === 8 && /^\d+$/.test(value)) {
                setLoading(true);
                setError(null);

                const result = await lookupUserByITS(value);

                if (result.success && result.user) {
                    setFoundUser(result.user);
                    if (onUserFound) {
                        onUserFound(result.user);
                    }
                } else {
                    setFoundUser(null);
                    setError(result.error || 'User not found');
                    if (onUserFound) {
                        onUserFound(null);
                    }
                }
                setLoading(false);
            } else {
                setFoundUser(null);
                setError(null);
                if (value.length > 0 && value.length !== 8) {
                    // Optional: show hint about length
                }
            }
        };

        const timeoutId = setTimeout(checkITS, 500); // Debounce
        return () => clearTimeout(timeoutId);
    }, [value, onUserFound]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/\D/g, '').slice(0, 8);
        onChange(val);
    };

    return (
        <div className={cn("space-y-2", className)}>
            <Label>{label} {required && <span className="text-destructive">*</span>}</Label>
            <div className="relative">
                <Input
                    value={value}
                    onChange={handleChange}
                    placeholder={placeholder}
                    inputMode="numeric"
                    className={cn(
                        "pr-10 transition-all duration-300",
                        foundUser ? "border-green-500 ring-green-500/20" : "",
                        error ? "border-destructive ring-destructive/20" : ""
                    )}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : foundUser ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : error ? (
                        <XCircle className="h-4 w-4 text-destructive" />
                    ) : null}
                </div>
            </div>

            {/* Popup / Card for User Details */}
            {foundUser && (
                <div className="animate-fade-in mt-2">
                    <Card className="bg-card/95 backdrop-blur-sm border-green-500/30 shadow-lg overflow-hidden">
                        <CardContent className="p-3 flex items-center gap-3">
                            <Avatar className="h-10 w-10 border border-border">
                                <AvatarImage src={foundUser.profileImage} />
                                <AvatarFallback className="bg-primary/10 text-primary">
                                    {foundUser.name.charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{foundUser.name}</p>
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <span className="font-mono">{foundUser.itsNumber}</span>
                                    <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                                    <span className="inline-flex items-center rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[10px] font-semibold">
                                        {foundUser.role}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {error && (
                <p className="text-xs text-destructive animate-fade-in">{error}</p>
            )}
        </div>
    );
}
