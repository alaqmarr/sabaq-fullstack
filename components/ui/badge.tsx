import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold lowercase tracking-wide transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive:
          "border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        "frosted-purple": "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20 backdrop-blur-md shadow-[0_0_10px_rgba(168,85,247,0.1)]",
        "frosted-blue": "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20 backdrop-blur-md shadow-[0_0_10px_rgba(59,130,246,0.1)]",
        "frosted-amber": "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20 backdrop-blur-md shadow-[0_0_10px_rgba(245,158,11,0.1)]",
        "frosted-green": "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 backdrop-blur-md shadow-[0_0_10px_rgba(16,185,129,0.1)]",
        "frosted-teal": "bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/20 backdrop-blur-md shadow-[0_0_10px_rgba(20,184,166,0.1)]",
        "frosted-slate": "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20 backdrop-blur-md shadow-[0_0_10px_rgba(100,116,139,0.1)]",
        "frosted-red": "bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/20 backdrop-blur-md shadow-[0_0_10px_rgba(239,68,68,0.1)]",
        "frosted-yellow": "bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 border-yellow-500/20 backdrop-blur-md shadow-[0_0_10px_rgba(234,179,8,0.1)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
