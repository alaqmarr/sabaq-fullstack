import { Loader2 } from "lucide-react";

export function LoadingScreen() {
    return (
        <div className="h-[calc(100vh-4rem)] w-full flex flex-col items-center justify-center bg-background/50 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-500">
                <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
                    <Loader2 className="h-12 w-12 animate-spin text-primary relative z-10" />
                </div>
                <p className="text-3xl font-arabic text-primary animate-pulse text-center px-4">
                    طَلَبُ العِلْمُ فَرِيضَةٌ عَلَىٰ كُلِّ مُسْلِمٍ وَمُسْلِمَةٍ
                </p>
                <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
        </div>
    );
}
