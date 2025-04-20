import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const stickyNoteVariants = cva(
  "relative p-4 rounded-sm shadow-md transform rotate-[-1deg] transition-all duration-300 hover:rotate-[0deg] hover:z-10 cursor-pointer text-black overflow-hidden",
  {
    variants: {
      color: {
        pink: "bg-pink-300 hover:bg-pink-200 border-pink-400 border-t-2 border-l-2 border-r-4 border-b-4",
        yellow: "bg-yellow-300 hover:bg-yellow-200 border-yellow-400 border-t-2 border-l-2 border-r-4 border-b-4",
        blue: "bg-blue-300 hover:bg-blue-200 border-blue-400 border-t-2 border-l-2 border-r-4 border-b-4",
        green: "bg-green-300 hover:bg-green-200 border-green-400 border-t-2 border-l-2 border-r-4 border-b-4",
        purple: "bg-purple-300 hover:bg-purple-200 border-purple-400 border-t-2 border-l-2 border-r-4 border-b-4",
      },
      size: {
        sm: "w-40 h-40",
        md: "w-56 h-56",
        lg: "w-64 h-64",
      },
      glow: {
        true: "after:content-[''] after:absolute after:inset-0 after:opacity-40 after:blur-md after:-z-10",
        false: "",
      }
    },
    compoundVariants: [
      {
        color: "pink",
        glow: true,
        className: "after:bg-pink-400",
      },
      {
        color: "yellow",
        glow: true,
        className: "after:bg-yellow-400",
      },
      {
        color: "blue",
        glow: true,
        className: "after:bg-blue-400",
      },
      {
        color: "green",
        glow: true,
        className: "after:bg-green-400",
      },
      {
        color: "purple",
        glow: true,
        className: "after:bg-purple-400",
      },
    ],
    defaultVariants: {
      color: "yellow",
      size: "md",
      glow: false,
    },
  }
);

export interface StickyNoteProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'color'>,
    VariantProps<typeof stickyNoteVariants> {
  title?: string;
  status?: string;
  rotation?: number;
}

const StickyNote = React.forwardRef<HTMLDivElement, StickyNoteProps>(
  ({ className, color, size, glow, title, status, rotation, children, ...props }, ref) => {
    // Generate random rotation between -5 and 5 degrees if not provided
    const noteRotation = rotation !== undefined ? rotation : Math.floor(Math.random() * 10) - 5;
    
    return (
      <div
        className={cn(stickyNoteVariants({ color, size, glow, className }))}
        ref={ref}
        style={{ 
          transform: `rotate(${noteRotation}deg)`,
          transformOrigin: 'center'
        }}
        {...props}
      >
        {title && (
          <h3 className="font-handwriting text-xl mb-2 font-bold break-words">{title}</h3>
        )}
        {status && (
          <div className="absolute top-2 right-2 px-2 py-1 text-xs rounded-full bg-white/70 font-bold">
            {status}
          </div>
        )}
        <div className="font-handwriting">{children}</div>
      </div>
    );
  }
);

StickyNote.displayName = "StickyNote";

export { StickyNote, stickyNoteVariants };