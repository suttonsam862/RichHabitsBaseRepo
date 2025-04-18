import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface DialogScrollPluginProps {
  children: React.ReactNode;
  maxHeight?: string;
  className?: string;
}

/**
 * A component that adds scrolling functionality to dialog content
 * Use this component inside DialogContent to make dialogs scrollable
 */
export function DialogScrollPlugin({ 
  children, 
  maxHeight = "65vh",
  className = "" 
}: DialogScrollPluginProps) {
  return (
    <ScrollArea className={`overflow-y-auto ${className}`} style={{ maxHeight }}>
      <div className="p-1">
        {children}
      </div>
    </ScrollArea>
  );
}