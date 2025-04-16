import React from "react";

export const ScrollableDialogContent: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => {
  return (
    <div className={`max-h-[60vh] overflow-y-auto p-6 ${className}`}>
      {children}
    </div>
  );
};