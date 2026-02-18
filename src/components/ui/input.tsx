import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-touch w-full rounded-md border-2 border-brand-chrome bg-white px-4 py-3 text-base font-medium text-brand-ink",
        "placeholder:text-brand-ink/60",
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-sea focus-visible:border-brand-sea",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-brand-ink/5",
        "transition-all",
        "enabled:hover:border-brand-ink/40",
        className
      )}
      {...props}
    />
  )
}

export { Input }
