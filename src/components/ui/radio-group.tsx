import * as React from "react"
import { cn } from "@/lib/utils"

type RadioGroupProps = React.HTMLAttributes<HTMLDivElement> & {
  value?: string;
  onValueChange?: (value: string) => void;
};

const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(({ className, value, onValueChange, ...props }, ref) => (
  <div ref={ref} role="radiogroup" className={cn("grid gap-2", className)} {...props} />
))
RadioGroup.displayName = "RadioGroup"

const RadioGroupItem = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { value: string }>(({ className, value, ...props }, ref) => (
  <button
    ref={ref}
    type="button"
    role="radio"
    aria-checked={props['aria-checked'] || false}
    value={value}
    className={cn(
      "h-4 w-4 rounded-full border border-zinc-600 bg-zinc-900 text-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  >
    <div className="flex items-center justify-center">
      <div className="h-2 w-2 rounded-full bg-current opacity-0 transition-opacity" />
    </div>
  </button>
))
RadioGroupItem.displayName = "RadioGroupItem"

export { RadioGroup, RadioGroupItem }
