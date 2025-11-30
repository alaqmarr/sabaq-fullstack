'use client';

export default function Loading() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
            {/* Animated background pattern */}
            <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />

            <div className="relative z-10 flex flex-col items-center gap-8 px-4">
                {/* Book Opening Animation */}
                <div style={{ perspective: '1000px', width: '200px', height: '150px' }}>
                    <div className="book-animation">
                        <div className="book-page-left"></div>
                        <div className="book-page-right"></div>
                        <div className="book-spine"></div>
                    </div>
                </div>

                {/* Quote */}
                <div className="text-center space-y-4 max-w-md opacity-0 animate-fade-in">
                    <p className="text-2xl text-primary" style={{ fontFamily: 'serif', direction: 'rtl' }}>
                        العِلْمُ فَرِيضَةٌ عَلَىٰ كُلِّ مُسْلِمٍ وَمُسْلِمَةٍ
                    </p>
                    <p className="text-sm text-muted-foreground italic">
                        "Seeking knowledge is obligatory upon every Muslim, male and female"
                    </p>
                </div>
            </div>

            <style jsx>{`
                .book-animation {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    transform-style: preserve-3d;
                    animation: float 3s ease-in-out infinite;
                }

                @keyframes float {
                    0%, 100% { transform: translateY(0px) rotateY(0deg); }
                    50% { transform: translateY(-10px) rotateY(5deg); }
                }

                .book-page-left,
                .book-page-right {
                    position: absolute;
                    width: 50%;
                    height: 100%;
                    background: linear-gradient(to right, hsl(var(--card)) 0%, hsl(var(--card)) 95%, hsl(var(--muted)) 100%);
                    border: 2px solid hsl(var(--border));
                    border-radius: 2px;
                    transform-origin: center;
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                }

                .book-page-left {
                    left: 0;
                    animation: page-turn-left 3s ease-in-out infinite;
                    border-right: none;
                    border-top-right-radius: 0;
                    border-bottom-right-radius: 0;
                }

                .book-page-right {
                    right: 0;
                    animation: page-turn-right 3s ease-in-out infinite;
                    border-left: none;
                    border-top-left-radius: 0;
                    border-bottom-left-radius: 0;
                }

                @keyframes page-turn-left {
                    0%, 30% { transform: rotateY(0deg); }
                    50%, 80% { transform: rotateY(-25deg); }
                    100% { transform: rotateY(0deg); }
                }

                @keyframes page-turn-right {
                    0%, 30% { transform: rotateY(0deg); }
                    50%, 80% { transform: rotateY(25deg); }
                    100% { transform: rotateY(0deg); }
                }

                .book-spine {
                    position: absolute;
                    left: 50%;
                    top: 0;
                    width: 8px;
                    height: 100%;
                    background: linear-gradient(to bottom, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.8) 100%);
                    transform: translateX(-50%);
                    border-radius: 1px;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                }

                .book-page-left::before,
                .book-page-right::before {
                    content: '';
                    position: absolute;
                    top: 20px;
                    left: 15%;
                    right: 15%;
                    height: calc(100% - 40px);
                    background-image: repeating-linear-gradient(
                        transparent,
                        transparent 12px,
                        hsl(var(--border) / 0.3) 12px,
                        hsl(var(--border) / 0.3) 13px
                    );
                    pointer-events: none;
                }

                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .animate-fade-in {
                    animation: fade-in 1s ease-out 0.5s forwards;
                }
            `}</style>
        </div>
    );
}
