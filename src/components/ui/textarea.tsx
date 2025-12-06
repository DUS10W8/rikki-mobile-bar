import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-[120px] w-full rounded-md border border-brand-chrome bg-white px-3 py-2 text-sm text-brand-ink",
        "placeholder:text-brand-ink/50",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sea/50 focus-visible:border-brand-sea",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "transition-colors resize-y",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
