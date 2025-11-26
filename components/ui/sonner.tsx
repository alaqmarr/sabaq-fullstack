import { Toaster as Sonner } from 'sonner';

export function Toaster() {
  return (
    <Sonner
      position="top-right"
      expand={false}
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast: 'glass shadow-elevated backdrop-blur-xl border-2',
          title: 'font-semibold text-sm',
          description: 'text-xs opacity-90',
          success: 'border-green-500/30 bg-green-50/90 dark:bg-green-950/90 text-green-900 dark:text-green-100',
          error: 'border-red-500/30 bg-red-50/90 dark:bg-red-950/90 text-red-900 dark:text-red-100',
          warning: 'border-yellow-500/30 bg-yellow-50/90 dark:bg-yellow-950/90 text-yellow-900 dark:text-yellow-100',
          info: 'border-blue-500/30 bg-blue-50/90 dark:bg-blue-950/90 text-blue-900 dark:text-blue-100',
          closeButton: 'hover:bg-white/50 dark:hover:bg-black/50 transition-colors',
        },
        style: {
          borderRadius: '12px',
        },
      }}
    />
  );
}
