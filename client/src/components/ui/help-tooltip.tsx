import React, { useState } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HelpTooltipProps {
  content: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  sideOffset?: number;
  children?: React.ReactNode;
  className?: string;
  iconSize?: number;
  highlightEffect?: boolean;
}

export function HelpTooltip({
  content,
  side = "top",
  align = "center",
  sideOffset = 4,
  children,
  className,
  iconSize = 16,
  highlightEffect = true,
}: HelpTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <TooltipProvider>
      <Tooltip 
        delayDuration={300} 
        onOpenChange={setIsOpen}
      >
        <TooltipTrigger asChild>
          <div 
            className={cn(
              "inline-flex items-center gap-1 cursor-help",
              highlightEffect && isOpen && "tooltip-highlight-effect",
              className
            )}
          >
            {children}
            <HelpCircle 
              className={cn(
                "text-muted-foreground hover:text-primary transition-colors", 
                isOpen && "text-primary"
              )} 
              size={iconSize} 
            />
          </div>
        </TooltipTrigger>
        <TooltipContent 
          side={side} 
          align={align} 
          sideOffset={sideOffset}
          className="max-w-[300px] p-4 text-sm bg-card border shadow-lg rounded-lg"
        >
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function HelpIconOnly({
  content,
  side = "top",
  align = "center",
  sideOffset = 4,
  className,
  iconSize = 16,
}: Omit<HelpTooltipProps, 'children' | 'highlightEffect'>) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <TooltipProvider>
      <Tooltip 
        delayDuration={300}
        onOpenChange={setIsOpen}
      >
        <TooltipTrigger asChild>
          <div className={cn("inline-flex cursor-help", className)}>
            <HelpCircle 
              className={cn(
                "text-muted-foreground hover:text-primary transition-colors", 
                isOpen && "text-primary"
              )} 
              size={iconSize} 
            />
          </div>
        </TooltipTrigger>
        <TooltipContent 
          side={side} 
          align={align} 
          sideOffset={sideOffset}
          className="max-w-[300px] p-4 text-sm bg-card border shadow-lg rounded-lg"
        >
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}