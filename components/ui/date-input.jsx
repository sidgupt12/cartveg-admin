"use client"

import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export function DateInput({
  value,
  onChange,
  className,
  placeholder = "Pick a date",
  ...props
}) {
  const formattedDate = value ? format(value, "PPP") : null

  return (
    <div className="relative">
      <input
        type="date"
        value={value ? format(value, "yyyy-MM-dd") : ""}
        onChange={(e) => {
          const date = e.target.value ? new Date(e.target.value) : null
          onChange?.(date)
        }}
        className={cn(
          "w-full h-9 px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          "appearance-none",
          className
        )}
        {...props}
      />
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
      </div>
    </div>
  )
} 