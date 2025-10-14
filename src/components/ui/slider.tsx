
"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, value, ...props }, ref) => {
  const intensity = value?.[0] ?? 0;

  const getIntensityColorVars = (val: number) => {
    if (val >= 8) {
      return {
        '--slider-range': 'hsl(var(--destructive))',
        '--slider-thumb': 'hsl(var(--destructive))',
        '--slider-thumb-border': 'hsl(var(--destructive))',
        '--slider-thumb-shadow': '0 0 0 5px hsla(var(--destructive), 0.3)',
      } as React.CSSProperties;
    }
    if (val >= 5) {
      return {
        '--slider-range': 'hsl(var(--warning))',
        '--slider-thumb': 'hsl(var(--warning))',
        '--slider-thumb-border': 'hsl(var(--warning))',
        '--slider-thumb-shadow': '0 0 0 5px hsla(var(--warning), 0.3)',
      } as React.CSSProperties;
    }
    return {
      '--slider-range': 'hsl(var(--success))',
      '--slider-thumb': 'hsl(var(--success))',
      '--slider-thumb-border': 'hsl(var(--success))',
      '--slider-thumb-shadow': '0 0 0 5px hsla(var(--success), 0.3)',
    } as React.CSSProperties;
  };
  
  return (
    <SliderPrimitive.Root
      ref={ref}
      className={cn(
        "relative flex w-full touch-none select-none items-center",
        className
      )}
      value={value}
      style={getIntensityColorVars(intensity)}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
        <SliderPrimitive.Range className="absolute h-full" style={{ backgroundColor: 'var(--slider-range)' }} />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb 
        className="block h-5 w-5 rounded-full border-2 bg-background ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
        style={{ 
          borderColor: 'var(--slider-thumb-border)', 
          backgroundColor: 'var(--slider-thumb)',
          boxShadow: 'var(--slider-thumb-shadow)'
        }}
      />
    </SliderPrimitive.Root>
  )
})
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
