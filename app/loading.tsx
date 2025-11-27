'use client';

export default function Loading() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50/50 via-background to-indigo-50/50 dark:from-slate-950 dark:via-background dark:to-slate-950">
            <div className="relative">
                {/* Background Glow */}
                <div className="absolute -inset-20 bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-3xl opacity-50 animate-pulse rounded-full" />

                <div className="glass-premium p-12 rounded-3xl flex flex-col items-center gap-8 relative z-10 backdrop-blur-2xl">
                    {/* Logo/Icon Container */}
                    <div className="relative w-24 h-24">
                        <div className="absolute inset-0 border-4 border-primary/20 rounded-full animate-[spin_3s_linear_infinite]" />
                        <div className="absolute inset-2 border-4 border-primary/40 rounded-full animate-[spin_2s_linear_infinite_reverse]" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-12 h-12 bg-primary rounded-full animate-pulse shadow-[0_0_20px_rgba(var(--primary),0.5)]" />
                        </div>
                    </div>

                    {/* Text */}
                    <div className="text-center space-y-2">
                        <h2 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600 dark:to-purple-400">
                            Sabaq System
                        </h2>
                        <div className="flex items-center gap-1.5 justify-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-[bounce_1s_infinite_0ms]" />
                            <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-[bounce_1s_infinite_200ms]" />
                            <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-[bounce_1s_infinite_400ms]" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
