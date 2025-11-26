'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { createUser, updateUser } from '@/actions/users';
import { toast } from 'sonner';
import { Role } from '@prisma/client';

const userSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    itsNumber: z.string().min(8, 'ITS Number must be at least 8 characters'),
    email: z.string().email().optional().or(z.literal('')),
    role: z.nativeEnum(Role),
    password: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
});

type UserFormValues = z.infer<typeof userSchema>;

interface UserDialogProps {
    user?: any;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function UserDialog({ user, open, onOpenChange }: UserDialogProps) {
    const [loading, setLoading] = useState(false);
    const form = useForm<UserFormValues>({
        resolver: zodResolver(userSchema) as any,
        defaultValues: {
            name: user?.name || '',
            itsNumber: user?.itsNumber || '',
            email: user?.email || '',
            role: user?.role || 'MUMIN',
            password: '',
        },
    });

    async function onSubmit(data: UserFormValues) {
        setLoading(true);
        try {
            if (user) {
                const { password, ...rest } = data;
                const updateData = password ? data : rest;
                await updateUser(user.id, updateData);
                toast.success('User updated successfully');
            } else {
                if (!data.password) {
                    // Default password to ITS number if not provided
                    data.password = data.itsNumber;
                }
                await createUser(data);
                toast.success('User created successfully');
            }
            onOpenChange(false);
            form.reset();
        } catch (error) {
            toast.error('Something went wrong');
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{user ? 'Edit User' : 'Add User'}</DialogTitle>
                    <DialogDescription>
                        {user ? 'Update user details.' : 'Create a new user account.'}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Full Name" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="itsNumber"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>ITS Number</FormLabel>
                                    <FormControl>
                                        <Input placeholder="ITS Number" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email (Optional)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Email" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="role"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Role</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a role" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {Object.values(Role).map((role) => (
                                                <SelectItem key={role} value={role}>
                                                    {role}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Password {user && '(Leave blank to keep current)'}</FormLabel>
                                    <FormControl>
                                        <Input type="password" placeholder="Password" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="submit" disabled={loading}>
                                {loading ? 'Saving...' : 'Save'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
