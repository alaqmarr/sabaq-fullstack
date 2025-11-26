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
    FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { createSabaq, updateSabaq } from '@/actions/sabaqs';
import { toast } from 'sonner';

const sabaqSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    kitaab: z.string().min(2, 'Kitaab must be at least 2 characters'),
    level: z.string().min(1, 'Nisaab is required'),
    description: z.string().optional(),
    criteria: z.string().min(1, 'Criteria is required'),
    enrollmentStartsAt: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date'),
    enrollmentEndsAt: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date'),
    allowLocationAttendance: z.boolean().default(false),
    locationId: z.string().optional(),
});

type SabaqFormValues = z.infer<typeof sabaqSchema>;

interface SabaqDialogProps {
    sabaq?: any;
    locations: any[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function SabaqDialog({ sabaq, locations, open, onOpenChange }: SabaqDialogProps) {
    const [loading, setLoading] = useState(false);
    const form = useForm<SabaqFormValues>({
        resolver: zodResolver(sabaqSchema) as any,
        defaultValues: {
            name: sabaq?.name || '',
            kitaab: sabaq?.kitaab || '',
            level: sabaq?.level || '',
            description: sabaq?.description || '',
            criteria: sabaq?.criteria || '',
            enrollmentStartsAt: sabaq?.enrollmentStartsAt ? new Date(sabaq.enrollmentStartsAt).toISOString().slice(0, 16) : '',
            enrollmentEndsAt: sabaq?.enrollmentEndsAt ? new Date(sabaq.enrollmentEndsAt).toISOString().slice(0, 16) : '',
            allowLocationAttendance: sabaq?.allowLocationAttendance || false,
            locationId: sabaq?.locationId || undefined,
        },
    });

    async function onSubmit(data: SabaqFormValues) {
        setLoading(true);
        try {
            const formattedData = {
                ...data,
                enrollmentStartsAt: new Date(data.enrollmentStartsAt),
                enrollmentEndsAt: new Date(data.enrollmentEndsAt),
            };

            if (sabaq) {
                await updateSabaq(sabaq.id, formattedData);
                toast.success('Sabaq updated successfully');
            } else {
                await createSabaq(formattedData);
                toast.success('Sabaq created successfully');
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
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{sabaq ? 'Edit Sabaq' : 'Create Sabaq'}</DialogTitle>
                    <DialogDescription>
                        {sabaq ? 'Update sabaq details.' : 'Create a new sabaq session.'}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Sabaq Name" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="kitaab"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Kitaab</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Kitaab Name" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="level"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nisaab</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Nisaab (e.g., 1, 2, 3)" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Description" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="criteria"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Enrollment Criteria</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Criteria for enrollment" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="enrollmentStartsAt"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Enrollment Start (IST)</FormLabel>
                                        <FormControl>
                                            <Input type="datetime-local" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="enrollmentEndsAt"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Enrollment End (IST)</FormLabel>
                                        <FormControl>
                                            <Input type="datetime-local" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="allowLocationAttendance"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>
                                            Allow Location-Based Attendance
                                        </FormLabel>
                                        <FormDescription>
                                            Users can mark attendance if within radius.
                                        </FormDescription>
                                    </div>
                                </FormItem>
                            )}
                        />
                        {form.watch('allowLocationAttendance') && (
                            <FormField
                                control={form.control}
                                name="locationId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Location</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a location" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {locations.map((loc) => (
                                                    <SelectItem key={loc.id} value={loc.id}>
                                                        {loc.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}
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
