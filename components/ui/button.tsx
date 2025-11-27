import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium lowercase tracking-wide transition-all duration-300 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 active:scale-95 cursor-pointer",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 hover:shadow-primary/40",
        destructive:
          "bg-destructive text-white shadow-lg shadow-destructive/25 hover:bg-destructive/90 hover:shadow-destructive/40",
        outline:
          "border border-input bg-background/50 backdrop-blur-sm shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost:
          "hover:bg-accent/50 hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        glass: "bg-white/20 text-white border border-white/30 backdrop-blur-md shadow-lg hover:bg-white/30",
        "frosted-blue": "bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20 backdrop-blur-md shadow-[0_0_10px_rgba(59,130,246,0.1)] hover:bg-blue-500/20 hover:border-blue-500/40 hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] dark:bg-blue-500/20 dark:hover:bg-blue-500/30",
        "frosted-teal": "bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20 backdrop-blur-md shadow-[0_0_10px_rgba(20,184,166,0.1)] hover:bg-teal-500/20 hover:border-teal-500/40 hover:shadow-[0_0_15px_rgba(20,184,166,0.3)] dark:bg-teal-500/20 dark:hover:bg-teal-500/30",
        "frosted-red": "bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/20 backdrop-blur-md shadow-[0_0_10px_rgba(239,68,68,0.1)] hover:bg-red-500/20 hover:border-red-500/40 hover:shadow-[0_0_15px_rgba(239,68,68,0.3)] dark:bg-red-500/20 dark:hover:bg-red-500/30",
        "frosted-green": "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 backdrop-blur-md shadow-[0_0_10px_rgba(16,185,129,0.1)] hover:bg-emerald-500/20 hover:border-emerald-500/40 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] dark:bg-emerald-500/20 dark:hover:bg-emerald-500/30",
        "frosted-amber": "bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 backdrop-blur-md shadow-[0_0_10px_rgba(245,158,11,0.1)] hover:bg-amber-500/20 hover:border-amber-500/40 hover:shadow-[0_0_15px_rgba(245,158,11,0.3)] dark:bg-amber-500/20 dark:hover:bg-amber-500/30",
      },
      size: {
        default: "h-10 px-6 py-2",
        sm: "h-9 rounded-full px-4",
        lg: "h-12 rounded-full px-8 text-base",
        icon: "size-10 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
