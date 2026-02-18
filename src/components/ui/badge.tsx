import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

// tiny classnames helper (avoids extra deps)
function cn(...classes: Array<string | undefined | false | null>) {
  return classes.filter(Boolean).join(" ");
}

const badgeVariants = cva(
  "inline-flex items-center justify-center w-fit whitespace-nowrap shrink-0 rounded-full border-2 px-3 py-1.5 text-sm font-semibold gap-2 transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-sea [&>svg]:size-4",
  {
    variants: {
      variant: {
        default: "border-transparent bg-brand-primary text-brand-ink",
        rust: "border-transparent bg-brand-rust text-white",
        sea: "border-transparent bg-brand-sea text-white",
        outline:
          "bg-white border-brand-ink/30 text-brand-ink hover:bg-brand-ink/5",
      },
      size: {
        sm: "text-xs px-2.5 py-1",
        md: "text-sm px-3 py-1.5",
        lg: "text-base px-4 py-2",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  asChild?: boolean;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "span";
    return (
      <Comp
        ref={ref}
        data-slot="badge"
        className={cn(badgeVariants({ variant, size }), className)}
        {...props}
      />
    );
  }
);
Badge.displayName = "Badge";

export { Badge };
