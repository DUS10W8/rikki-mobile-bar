import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

// tiny classnames helper
function cn(...classes: Array<string | undefined | false | null>) {
  return classes.filter(Boolean).join(" ");
}

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center",
    "rounded-2xl font-semibold",
    "transition-all outline-none",
    "focus-visible:ring-2 focus-visible:ring-brand-sea/50",
    "disabled:opacity-60 disabled:pointer-events-none",
    "shadow-[0_8px_28px_rgba(0,0,0,0.12)] hover:shadow-[0_12px_34px_rgba(0,0,0,0.18)]",
  ].join(" "),
  {
    variants: {
      variant: {
        primary:
          "bg-brand-sea text-white border border-brand-sea hover:bg-brand-rust",
        secondary:
          "bg-white text-brand-sea border border-brand-sea hover:bg-brand-sea/10",
        ghost:
          "bg-transparent text-brand-ink hover:bg-brand-ink/5 border border-transparent",
        outline:
          "bg-transparent text-brand-ink border border-brand-ink/20 hover:bg-brand-ink/5",
      },
      size: {
        icon: "size-10 p-0",
        sm: "text-sm px-3 py-1.5",
        md: "text-base px-5 py-3",
        lg: "text-base px-6 py-3.5",
        xl: "text-lg px-7 py-4",
      },
      fullWidth: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
      fullWidth: false,
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  /** optional leading icon node */
  leftIcon?: React.ReactNode;
  /** optional trailing icon node */
  rightIcon?: React.ReactNode;
  /** if true, sets aria-busy and prevents clicks */
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      asChild,
      variant,
      size,
      fullWidth,
      leftIcon,
      rightIcon,
      loading,
      children,
      onClick,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, fullWidth }), className)}
        aria-busy={loading || undefined}
        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
          if (loading) {
            e.preventDefault();
            return;
          }
          onClick?.(e);
        }}
        {...props}
      >
        {leftIcon && <span className="mr-2 inline-flex" aria-hidden="true">{leftIcon}</span>}
        <span>{children}</span>
        {rightIcon && <span className="ml-2 inline-flex" aria-hidden="true">{rightIcon}</span>}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { buttonVariants };
