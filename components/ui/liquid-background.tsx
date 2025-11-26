'use client';

import { motion } from 'framer-motion';

export function LiquidBackground() {
    return (
        <div className="fixed inset-0 -z-10 overflow-hidden bg-background">
            <div className="absolute inset-0 opacity-30 dark:opacity-20">
                <motion.div
                    className="absolute top-[-10%] left-[-10%] h-[50vh] w-[50vh] rounded-full bg-blue-400 blur-[100px]"
                    animate={{
                        x: [0, 100, 0],
                        y: [0, 50, 0],
                        scale: [1, 1.2, 1],
                    }}
                    transition={{
                        duration: 20,
                        repeat: Infinity,
                        repeatType: 'reverse',
                        ease: 'easeInOut',
                    }}
                />
                <motion.div
                    className="absolute top-[20%] right-[-10%] h-[60vh] w-[60vh] rounded-full bg-purple-400 blur-[120px]"
                    animate={{
                        x: [0, -100, 0],
                        y: [0, 100, 0],
                        scale: [1, 1.1, 1],
                    }}
                    transition={{
                        duration: 25,
                        repeat: Infinity,
                        repeatType: 'reverse',
                        ease: 'easeInOut',
                    }}
                />
                <motion.div
                    className="absolute bottom-[-10%] left-[20%] h-[50vh] w-[50vh] rounded-full bg-indigo-400 blur-[100px]"
                    animate={{
                        x: [0, 50, 0],
                        y: [0, -50, 0],
                        scale: [1, 1.3, 1],
                    }}
                    transition={{
                        duration: 22,
                        repeat: Infinity,
                        repeatType: 'reverse',
                        ease: 'easeInOut',
                    }}
                />
            </div>
            <div className="absolute inset-0 bg-background/40 backdrop-blur-[100px]" />
        </div>
    );
}
