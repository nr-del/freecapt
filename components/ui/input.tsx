import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // docs/12_design_system.md §5.2 - FreeCapT input
          "flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus:outline-none focus:border-brand-500 focus:shadow-focus disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 aria-invalid:border-red-500 aria-invalid:focus:border-red-500",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
