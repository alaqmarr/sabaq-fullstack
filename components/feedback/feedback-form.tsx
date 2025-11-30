"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Star, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { submitFeedback } from "@/actions/feedback";
import { cn } from "@/lib/utils";
import { User } from "next-auth";

interface FeedbackFormProps {
    sessionId: string;
    user?: User; // Pass the logged-in user if available
}

export function FeedbackForm({ sessionId, user }: FeedbackFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [hoverRating, setHoverRating] = useState(0);

    // Dynamic schema based on auth status
    const schema = z.object({
        rating: z.number().min(1, "Please select a rating").max(5),
        comment: z.string().optional(),
        itsNumber: user
            ? z.string().optional()
            : z.string().length(8, "ITS must be 8 digits"),
    });

    const form = useForm<z.infer<typeof schema>>({
        resolver: zodResolver(schema),
        defaultValues: {
            rating: 0,
            comment: "",
            itsNumber: user?.itsNumber || "",
        },
    });

    const onSubmit = async (values: z.infer<typeof schema>) => {
        setIsSubmitting(true);
        try {
            const result = await submitFeedback({
                sessionId,
                rating: values.rating,
                comment: values.comment,
                itsNumber: user ? undefined : values.itsNumber, // Only send ITS if guest
            });

            if (result.success) {
                form.reset(); // Clear form inputs
                setIsSubmitted(true);
                toast.success("Feedback submitted successfully!");
            } else {
                toast.error(result.error || "Failed to submit feedback");
            }
        } catch (error) {
            toast.error("An error occurred. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSubmitted) {
        return (
            <div className="flex flex-col items-center justify-center p-8 space-y-4 text-center animate-in fade-in zoom-in duration-500">
                <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-2">
                    <Star className="h-8 w-8 text-green-600 dark:text-green-400 fill-green-600 dark:fill-green-400" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">Shukran!</h3>
                <p className="text-muted-foreground max-w-xs mx-auto">
                    Your feedback has been recorded. We appreciate your input to improve our sabaqs.
                </p>
            </div>
        );
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {!user && (
                    <FormField
                        control={form.control}
                        name="itsNumber"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>ITS Number</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="Enter your 8-digit ITS"
                                        maxLength={8}
                                        inputMode="numeric"
                                        className="text-lg tracking-widest"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}

                <FormField
                    control={form.control}
                    name="rating"
                    render={({ field }) => (
                        <FormItem className="space-y-3">
                            <FormLabel className="text-base">How was the session?</FormLabel>
                            <FormControl>
                                <div className="flex justify-center gap-3 sm:gap-4">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            className="group focus:outline-none transition-all duration-200 hover:scale-110 active:scale-95"
                                            onMouseEnter={() => setHoverRating(star)}
                                            onMouseLeave={() => setHoverRating(0)}
                                            onClick={() => field.onChange(star)}
                                        >
                                            <Star
                                                className={cn(
                                                    "h-8 w-8 sm:h-10 sm:w-10 transition-colors duration-200",
                                                    (hoverRating || field.value) >= star
                                                        ? "fill-yellow-400 text-yellow-400 drop-shadow-sm"
                                                        : "text-muted-foreground/30 fill-muted-foreground/10"
                                                )}
                                            />
                                        </button>
                                    ))}
                                </div>
                            </FormControl>
                            <FormMessage className="text-center" />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="comment"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Comments (Optional)</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Share your thoughts about today's session..."
                                    className="resize-none min-h-[120px] bg-background/50"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button
                    type="submit"
                    className="w-full h-12 text-base font-medium transition-all hover:scale-[1.02]"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Submitting...
                        </>
                    ) : (
                        "Submit Feedback"
                    )}
                </Button>
            </form>
        </Form>
    );
}
