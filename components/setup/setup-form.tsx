'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createInitialSuperAdmin } from '@/actions/setup';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Loader2 } from 'lucide-react';

export function SetupForm() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        itsNumber: '',
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!formData.itsNumber || !formData.name || !formData.password) {
            setError('ITS Number, Name, and Password are required');
            return;
        }

        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters long');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);

        const result = await createInitialSuperAdmin({
            itsNumber: formData.itsNumber,
            name: formData.name,
            email: formData.email || undefined,
            phone: formData.phone || undefined,
            password: formData.password,
        });

        setLoading(false);

        if (result.success) {
            // Redirect to login page
            router.push('/login?setup=complete');
        } else {
            setError(result.error || 'Failed to create account');
        }
    };

    return (
        <Card className="w-full max-w-lg">
            <CardHeader className="space-y-1">
                <div className="flex items-center justify-center mb-4">
                    <div className="p-3 bg-primary/10 rounded-full">
                        <Shield className="h-8 w-8 text-primary" />
                    </div>
                </div>
                <CardTitle className="text-2xl text-center">Initial Setup</CardTitle>
                <CardDescription className="text-center">
                    Create the first SuperAdmin account to get started
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="itsNumber">ITS Number *</Label>
                        <Input
                            id="itsNumber"
                            type="text"
                            placeholder="12345678"
                            value={formData.itsNumber}
                            onChange={(e) => setFormData({ ...formData, itsNumber: e.target.value })}
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="name">Full Name *</Label>
                        <Input
                            id="name"
                            type="text"
                            placeholder="John Doe"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email (Optional)</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="john@example.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            disabled={loading}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="phone">Phone (Optional)</Label>
                        <Input
                            id="phone"
                            type="tel"
                            placeholder="+1234567890"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            disabled={loading}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">Password *</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required
                            disabled={loading}
                            minLength={8}
                        />
                        <p className="text-xs text-muted-foreground">Minimum 8 characters</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm Password *</Label>
                        <Input
                            id="confirmPassword"
                            type="password"
                            placeholder="••••••••"
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            required
                            disabled={loading}
                        />
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creating Account...
                            </>
                        ) : (
                            'Create SuperAdmin Account'
                        )}
                    </Button>

                    <p className="text-xs text-center text-muted-foreground mt-4">
                        This setup page is only accessible when no SuperAdmin accounts exist.
                        After creating this account, you can log in and create additional users.
                    </p>
                </form>
            </CardContent>
        </Card>
    );
}
