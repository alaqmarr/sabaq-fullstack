'use client';

export default function Loading() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
            <div className="text-center space-y-8">
                {/* Animated Logo/Icon */}
                <div className="relative">
                    <div className="w-24 h-24 mx-auto">
                        <div className="absolute inset-0 glass-strong rounded-full animate-pulse"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    </div>
                </div>

                {/* Loading Text */}
                <div className="space-y-3">
                    <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                        Sabaq System
                    </h2>
                    <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                        <span className="inline-block w-2 h-2 bg-primary rounded-full animate-pulse"></span>
                        Loading...
                    </p>
                </div>

                {/* Progress Bar */}
                <div className="w-64 h-1 mx-auto bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full animate-[loading_1.5s_ease-in-out_infinite]"></div>
                </div>
            </div>

            <style jsx>{`
        @keyframes loading {
          0%, 100% {
            transform: translateX(-100%);
          }
          50% {
            transform: translateX(100%);
          }
        }
      `}</style>
        </div>
    );
}
