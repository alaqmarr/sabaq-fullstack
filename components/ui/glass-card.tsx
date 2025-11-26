import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

interface GlassCardProps extends React.ComponentProps<typeof Card> {
    children: React.ReactNode;
    className?: string;
}

export function GlassCard({ children, className, ...props }: GlassCardProps) {
    return (
        <Card
            className={cn(
                'bg-white/60 dark:bg-black/40 backdrop-blur-xl border-white/20 dark:border-white/10 shadow-lg',
                className
            )}
            {...props}
        >
            {children}
        </Card>
    );
}
