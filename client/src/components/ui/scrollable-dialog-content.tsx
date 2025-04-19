import * as React from "react";
import { cn } from "@/lib/utils";
import { DialogContent } from "@/components/ui/dialog";

export interface ScrollableDialogContentProps extends React.ComponentPropsWithoutRef<typeof DialogContent> {
  maxHeight?: string;
}

const ScrollableDialogContent = React.forwardRef<
  HTMLDivElement,
  ScrollableDialogContentProps
>(({ className, maxHeight = "calc(80vh - 160px)", children, ...props }, ref) => {
  return (
    <DialogContent
      ref={ref}
      className={cn("max-h-screen overflow-hidden flex flex-col", className)}
      {...props}
    >
      <div 
        className="overflow-y-auto pr-1 -mr-1"
        style={{ maxHeight }}
      >
        {children}
      </div>
    </DialogContent>
  );
});

ScrollableDialogContent.displayName = "ScrollableDialogContent";

export { ScrollableDialogContent };