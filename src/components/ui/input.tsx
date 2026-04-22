import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "w-full min-w-0 bg-transparent px-0 py-2 font-mono text-sm text-[var(--nd-text-primary)] outline-none transition-colors",
        "border-b border-[var(--nd-border-visible)]",
        "placeholder:text-[var(--nd-text-disabled)] placeholder:font-mono",
        "focus-visible:border-b-[var(--nd-text-primary)]",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40",
        "aria-invalid:border-b-[var(--nd-accent)]",
        "file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-mono file:text-[var(--nd-text-primary)]",
        className
      )}
      {...props}
    />
  )
}

export { Input }
