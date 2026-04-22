"use client"

import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-1.5 font-mono text-[13px] uppercase tracking-[0.06em] whitespace-nowrap transition-colors outline-none select-none disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--nd-text-display)] text-[var(--nd-surface)] rounded-[999px] hover:bg-[var(--nd-text-primary)] focus-visible:ring-2 focus-visible:ring-[var(--nd-border-visible)] active:translate-y-px",
        secondary:
          "bg-transparent border border-[var(--nd-border-visible)] text-[var(--nd-text-primary)] rounded-[999px] hover:border-[var(--nd-text-primary)] focus-visible:ring-2 focus-visible:ring-[var(--nd-border-visible)] active:translate-y-px",
        outline:
          "bg-transparent border border-[var(--nd-border-visible)] text-[var(--nd-text-primary)] rounded-[999px] hover:border-[var(--nd-text-primary)] focus-visible:ring-2 focus-visible:ring-[var(--nd-border-visible)] active:translate-y-px",
        ghost:
          "bg-transparent text-[var(--nd-text-secondary)] hover:text-[var(--nd-text-primary)] hover:bg-[var(--nd-surface-raised)] rounded-[4px] focus-visible:ring-2 focus-visible:ring-[var(--nd-border-visible)]",
        destructive:
          "bg-transparent border border-[var(--nd-accent)] text-[var(--nd-accent)] rounded-[999px] hover:bg-[var(--nd-accent-subtle)] focus-visible:ring-2 focus-visible:ring-[var(--nd-accent)]/30 active:translate-y-px",
        link: "text-[var(--nd-interactive)] underline-offset-4 hover:underline normal-case tracking-normal",
      },
      size: {
        default: "h-11 px-6 py-0",
        xs: "h-7 px-3 text-[11px] tracking-[0.06em]",
        sm: "h-9 px-4 text-[12px]",
        lg: "h-12 px-8",
        icon: "size-9 rounded-[4px] p-0",
        "icon-xs": "size-7 rounded-[4px] p-0 text-[11px]",
        "icon-sm": "size-8 rounded-[4px] p-0",
        "icon-lg": "size-11 rounded-[4px] p-0",
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
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
