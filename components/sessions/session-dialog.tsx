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
import { createSession, updateSession } from '@/actions/sessions';
import { toast } from 'sonner';

const sessionSchema = z.object({
    scheduledAt: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date'),
    cutoffTime: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date'),
});

type SessionFormValues = z.infer<typeof sessionSchema>;

interface SessionDialogProps {
    session?: any;
    sabaqId?: string;
    sabaqs?: any[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function SessionDialog({ session, sabaqId, sabaqs, open, onOpenChange }: SessionDialogProps) {
    const [loading, setLoading] = useState(false);
    const form = useForm<SessionFormValues>({
        resolver: zodResolver(sessionSchema) as any,
        defaultValues: {
            scheduledAt: session?.scheduledAt ? new Date(session.scheduledAt).toISOString().slice(0, 16) : '',
            cutoffTime: session?.cutoffTime ? new Date(session.cutoffTime).toISOString().slice(0, 16) : '',
        },
    });

    async function onSubmit(data: SessionFormValues) {
        setLoading(true);
        try {
            if (!sabaqId) {
                toast.error('Please select a sabaq');
                setLoading(false);
                return;
            }

            const formattedData = {
                ...data,
                sabaqId,
                scheduledAt: new Date(data.scheduledAt),
                cutoffTime: new Date(data.cutoffTime),
            };

            if (session) {
                await updateSession(session.id, formattedData);
                toast.success('Session updated successfully');
            } else {
                await createSession(formattedData);
                toast.success('Session created successfully');
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
                    <DialogTitle>{session ? 'Edit Session' : 'Create Session'}</DialogTitle>
                    <DialogDescription>
                        {session ? 'Update session details.' : 'Schedule a new session for this sabaq.'}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="scheduledAt"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Scheduled Time</FormLabel>
                                    <FormControl>
                                        <Input type="datetime-local" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="cutoffTime"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Cutoff Time</FormLabel>
                                    <FormControl>
                                        <Input type="datetime-local" {...field} />
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
