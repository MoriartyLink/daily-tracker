import * as React from "react"
import { cn } from "@/lib/utils"

type RadioGroupContextType = {
  value?: string;
  onValueChange?: (value: string) => void;
};

const RadioGroupContext = React.createContext<RadioGroupContextType>({});

type RadioGroupProps = React.HTMLAttributes<HTMLDivElement> & {
  value?: string;
  onValueChange?: (value: string) => void;
};

const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(({ className, value, onValueChange, ...props }, ref) => (
  <RadioGroupContext.Provider value={{ value, onValueChange }}>
    <div ref={ref} role="radiogroup" className={cn("grid gap-2", className)} {...props} />
  </RadioGroupContext.Provider>
))
RadioGroup.displayName = "RadioGroup"

const RadioGroupItem = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { value: string }>(({ className, value, ...props }, ref) => {
  const { value: groupValue, onValueChange } = React.useContext(RadioGroupContext);
  const isChecked = groupValue === value;

  return (
    <button
      ref={ref}
      type="button"
      role="radio"
      aria-checked={isChecked}
      value={value}
      onClick={() => onValueChange?.(value)}
      className={cn(
        "h-4 w-4 rounded-full border border-zinc-600 bg-zinc-900 text-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer transition-all",
        isChecked && "border-blue-500 bg-blue-500",
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-center">
        <div className={cn("h-2 w-2 rounded-full bg-white transition-opacity", isChecked ? "opacity-100" : "opacity-0")} />
      </div>
    </button>
  );
})
RadioGroupItem.displayName = "RadioGroupItem"

export { RadioGroup, RadioGroupItem }
