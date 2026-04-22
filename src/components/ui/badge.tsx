import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.06em] whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-[var(--nd-border-visible)] [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default:
          "rounded-[4px] border border-[var(--nd-border-visible)] text-[var(--nd-text-primary)]",
        secondary:
          "rounded-[4px] border border-[var(--nd-border)] text-[var(--nd-text-secondary)]",
        destructive:
          "rounded-[4px] border border-[var(--nd-accent)] text-[var(--nd-accent)]",
        outline:
          "rounded-[4px] border border-[var(--nd-border-visible)] text-[var(--nd-text-primary)]",
        ghost:
          "rounded-[4px] text-[var(--nd-text-secondary)] hover:text-[var(--nd-text-primary)]",
        pill:
          "rounded-[999px] border border-[var(--nd-border-visible)] text-[var(--nd-text-primary)]",
        link: "text-[var(--nd-interactive)] underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
