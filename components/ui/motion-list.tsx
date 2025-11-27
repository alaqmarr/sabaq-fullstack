'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface MotionListProps {
    children: ReactNode;
    className?: string;
    staggerDelay?: number;
}

export function MotionList({ children, className, staggerDelay = 0.05 }: MotionListProps) {
    return (
        <motion.div
            className={className}
            initial="hidden"
            animate="visible"
            variants={{
                hidden: { opacity: 0 },
                visible: {
                    opacity: 1,
                    transition: {
                        staggerChildren: staggerDelay
                    }
                }
            }}
        >
            {children}
        </motion.div>
    );
}

export function MotionItem({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <motion.div
            className={className}
            variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
            }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
        >
            {children}
        </motion.div>
    );
}
