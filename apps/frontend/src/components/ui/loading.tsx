'use client';

import * as React from "react"
import { cn } from "@/lib/utils"

const Loading = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center justify-center p-4", className)}
    {...props}
  >
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
))
Loading.displayName = "Loading"

export { Loading }
