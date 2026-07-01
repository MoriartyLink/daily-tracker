import * as React from "react"
import { cn } from "@/lib/utils"

const Separator = React.forwardRef<HTMLHRElement, React.HTMLAttributes<HTMLHRElement> & { orientation?: "horizontal" | "vertical" }>(({ className, orientation = "horizontal", ...props }, ref) => (
  <hr
    ref={ref}
    className={cn("shrink-0 border-slate-800 bg-slate-800", orientation === "horizontal" ? "h-[1px] w-full" : "min-h-full w-[1px]", className)}
    {...props}
  />
))
Separator.displayName = "Separator"

export { Separator }
