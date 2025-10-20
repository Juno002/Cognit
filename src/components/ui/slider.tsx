
"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, value, ...props }, ref) => {
  const intensity = value?.[0] ?? 0;

  let rangeClass = "bg-[var(--slider-range-success)]";
  let thumbClass = "border-[var(--slider-range-success)]";
  let shadowStyle = "shadow-[var(--slider-thumb-shadow-success)]";

  if (intensity >= 8) {
    rangeClass = "bg-[var(--slider-range-destructive)]";
    thumbClass = "border-[var(--slider-range-destructive)]";
    shadowStyle = "shadow-[var(--slider-thumb-shadow-destructive)]";
  } else if (intensity >= 5) {
    rangeClass = "bg-[var(--slider-range-warning)]";
    thumbClass = "border-[var(--slider-range-warning)]";
    shadowStyle = "shadow-[var(--slider-thumb-shadow-warning)]";
  }
  
  return (
    <SliderPrimitive.Root
      ref={ref}
      className={cn(
        "relative flex w-full touch-none select-none items-center",
        className
      )}
      value={value}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-[var(--slider-track)]">
        <SliderPrimitive.Range className={cn("absolute h-full", rangeClass)} />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb 
        className={cn(
          "block h-5 w-5 rounded-full border-2 bg-background ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          thumbClass,
          shadowStyle
        )}
      />
    </SliderPrimitive.Root>
  )
})
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
