import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DialogScrollPlugin } from '@/components/ui/dialog-scroll-plugin';

interface ScrollableDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
  maxHeight?: string
  className?: string
}

/**
 * A pre-configured dialog component with scroll functionality
 * This component simplifies the creation of scrollable dialogs throughout the application
 */
export function ScrollableDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  maxHeight = "65vh",
  className = ""
}: ScrollableDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={className}>
        {(title || description) && (
          <DialogHeader>
            {title && <DialogTitle>{title}</DialogTitle>}
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
        )}
        
        <DialogScrollPlugin maxHeight={maxHeight}>
          {children}
        </DialogScrollPlugin>
        
        {footer && (
          <div className="flex justify-end space-x-2 mt-4">
            {footer}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}