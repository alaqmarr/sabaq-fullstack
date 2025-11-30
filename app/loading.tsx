import Image from 'next/image';

export default function Loading() {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-950 dark:to-indigo-950">
            {/* Animated background */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -inset-[10px] opacity-50">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/30 rounded-full mix-blend-multiply filter blur-xl animate-blob" />
                    <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-400/30 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000" />
                    <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-indigo-400/30 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000" />
                </div>
            </div>

            {/* Main content */}
            <div className="relative z-10 flex flex-col items-center">
                {/* Logo container with rings */}
                <div className="relative">
                    {/* Animated rings */}
                    <div className="absolute inset-0 -m-12">
                        <div className="absolute inset-0 rounded-full border-4 border-blue-500/20 animate-ping" style={{ animationDuration: '2s' }} />
                        <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.5s' }} />
                        <div className="absolute inset-0 rounded-full border-4 border-purple-500/20 animate-ping" style={{ animationDuration: '2s', animationDelay: '1s' }} />
                    </div>

                    {/* Logo */}
                    <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-2xl overflow-hidden shadow-2xl ring-4 ring-white/50 dark:ring-white/20 animate-bounce" style={{ animationDuration: '2s' }}>
                        <Image
                            src="/logo.jpg"
                            alt="Logo"
                            fill
                            className="object-cover"
                            priority
                        />
                        {/* Glow effect */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 via-transparent to-purple-500/20" />
                    </div>
                </div>

                {/* Loading text */}
                <div className="mt-12 text-center space-y-3">
                    <h2 className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 lowercase animate-pulse">
                        loading...
                    </h2>
                    <p className="text-sm text-muted-foreground">Please wait while we prepare everything</p>
                </div>

                {/* Animated dots */}
                <div className="mt-8 flex gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                    <div className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                </div>
            </div>
        </div>
    );
}
