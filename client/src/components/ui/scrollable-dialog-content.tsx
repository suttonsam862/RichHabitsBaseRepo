import { DialogContent } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import React from "react"

interface ScrollableDialogContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogContent> {
  maxHeight?: string
}

const ScrollableDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogContent>,
  ScrollableDialogContentProps
>(({ className, maxHeight = "90vh", children, ...props }, ref) => {
  return (
    <DialogContent 
      ref={ref} 
      className={cn("max-h-[" + maxHeight + "] overflow-y-auto", className)}
      {...props}
    >
      {children}
    </DialogContent>
  )
})

ScrollableDialogContent.displayName = "ScrollableDialogContent"

export { ScrollableDialogContent }