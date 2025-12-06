import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-10 w-full rounded-md border border-brand-chrome bg-white px-3 py-2 text-sm text-brand-ink",
        "placeholder:text-brand-ink/50",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sea/50 focus-visible:border-brand-sea",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "transition-colors",
        className
      )}
      {...props}
    />
  )
}

export { Input }
