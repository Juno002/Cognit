// src/components/Tooltip.tsx
'use client';

import * as React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { cn } from '@/lib/utils';

type Props = React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content> & {
  children: React.ReactNode;
  label: React.ReactNode;
  mobileTap?: boolean; // si quieres forzar tap behavior
};

const TooltipProvider = TooltipPrimitive.Provider;

const TooltipRoot = TooltipPrimitive.Root;
const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      'z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
      className
    )}
    {...props}
  />
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

export function Tooltip({ children, label, mobileTap = true, ...contentProps }: Props) {
  const [isTouch, setIsTouch] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    // Detect touch devices once on mount
    const hasTouch = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
    setIsTouch(Boolean(hasTouch));
  }, []);

  // If not mobile/touch, use uncontrolled Radix (hover/focus)
  if (!isTouch && !mobileTap) {
    return (
      <TooltipProvider>
        <TooltipRoot>
          <TooltipTrigger asChild>{children}</TooltipTrigger>
          <TooltipContent {...contentProps}>{label}</TooltipContent>
        </TooltipRoot>
      </TooltipProvider>
    );
  }

  // Controlled mode for touch devices: toggle on tap
  return (
    <TooltipProvider>
      <TooltipRoot open={open} onOpenChange={(v) => setOpen(v)}>
        {/* asChild ensures the child's element becomes the trigger */}
        <TooltipTrigger
          asChild
          onClick={(e: React.MouseEvent) => {
            // prevent double-focus/blur weirdness; toggle open state on tap
            e.stopPropagation();
            setOpen((s) => !s);
          }}
          onPointerDown={(e: React.PointerEvent) => {
            // stop propagation to avoid accidental document handlers
            e.stopPropagation();
          }}
        >
          {children}
        </TooltipTrigger>

        <TooltipContent {...contentProps}>
          <div className="flex flex-col">
            <div>{label}</div>
            <div className="mt-2 text-xs opacity-80">
              {/* Optional small hint to close on mobile */}
              Toca fuera o el botón "Cerrar" para ocultar.
            </div>
            <div className="mt-2 text-right">
              <button
                onClick={() => setOpen(false)}
                className="px-2 py-1 rounded bg-white text-black text-xs"
                type="button"
              >
                Cerrar
              </button>
            </div>
          </div>
        </TooltipContent>
      </TooltipRoot>
    </TooltipProvider>
  );
}

export default Tooltip;
