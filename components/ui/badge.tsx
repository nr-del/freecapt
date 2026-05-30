import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// docs/12_design_system.md §5.3 - FreeCapT badge variants
const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        default: "bg-slate-100 text-slate-700",
        founder: "bg-brand-50 text-brand-700",
        employee: "bg-slate-100 text-slate-700",
        investor: "bg-amber-50 text-amber-700",
        paid: "bg-slate-900 text-white text-2xs uppercase tracking-wider",
        auto: "bg-brand-600 text-white text-2xs uppercase tracking-wider",
        pending: "text-amber-600",
        success: "text-brand-700",
        danger: "text-red-600",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
