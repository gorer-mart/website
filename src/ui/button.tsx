import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-none text-sm font-semibold uppercase tracking-wider transition-all duration-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-black text-white hover:bg-neutral-800 active:scale-95 shadow-premium",
        destructive: "bg-red-600 text-white hover:bg-red-700 active:scale-95 shadow-premium",
        outline: "border-2 border-black bg-transparent text-black hover:bg-black hover:text-white active:scale-95",
        secondary: "bg-neutral-100 text-neutral-900 hover:bg-neutral-200 active:scale-95",
        ghost: "hover:bg-neutral-100 hover:text-neutral-900 active:scale-95",
        link: "text-black underline-offset-4 hover:underline",
        premium: "bg-yellow text-black hover:bg-white hover:scale-105 transition-all shadow-premium font-bold",
      },
      size: {
        default: "h-12 px-8 py-4",
        sm: "h-9 px-4 text-xs",
        lg: "h-14 px-10 text-base",
        icon: "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
