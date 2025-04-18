import * as React from "react"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"

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

export function ScrollableSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  maxHeight = "calc(100vh - 120px)",
  className,
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
          <div className="p-1">{children}</div>
        </ScrollArea>
        {footer && <SheetFooter className="mt-4">{footer}</SheetFooter>}
      </SheetContent>
    </Sheet>
  )
}