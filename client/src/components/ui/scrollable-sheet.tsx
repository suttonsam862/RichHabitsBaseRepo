import React from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ScrollableSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
  maxHeight?: string
  className?: string
  side?: "top" | "right" | "bottom" | "left"
}

/**
 * A pre-configured sheet component with scroll functionality
 * This component simplifies the creation of scrollable sheets/drawers throughout the application
 */
export function ScrollableSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  maxHeight = "calc(100vh - 8rem)",
  className = "",
  side = "right"
}: ScrollableSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={side} className={className}>
        {(title || description) && (
          <SheetHeader>
            {title && <SheetTitle>{title}</SheetTitle>}
            {description && <SheetDescription>{description}</SheetDescription>}
          </SheetHeader>
        )}
        
        <ScrollArea className="overflow-y-auto mt-4" style={{ maxHeight }}>
          <div className="pr-4">
            {children}
          </div>
        </ScrollArea>
        
        {footer && (
          <div className="flex justify-end space-x-2 mt-4">
            {footer}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}