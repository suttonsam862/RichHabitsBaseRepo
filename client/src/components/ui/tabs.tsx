import * as React from "react";
import { cn } from "@/lib/utils";

const TabsContext = React.createContext<{
  activeTab: string;
  setActiveTab: (id: string) => void;
}>({
  activeTab: "",
  setActiveTab: () => {}
});

interface TabsProps {
  defaultValue: string;
  children: React.ReactNode;
  className?: string;
}

export function Tabs({ defaultValue, children, className }: TabsProps) {
  const [activeTab, setActiveTab] = React.useState(defaultValue);

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={cn("space-y-6", className)}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

interface TabsListProps {
  children: React.ReactNode;
  className?: string;
}

export function TabsList({ children, className }: TabsListProps) {
  return (
    <div className={cn("border-b", className)}>
      <nav className="-mb-px flex space-x-8">
        {children}
      </nav>
    </div>
  );
}

interface TabTriggerProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export function TabTrigger({ value, children, className }: TabTriggerProps) {
  const { activeTab, setActiveTab } = React.useContext(TabsContext);
  const isActive = activeTab === value;

  return (
    <button
      onClick={() => setActiveTab(value)}
      className={cn(
        "py-4 px-1 border-b-2 font-medium text-sm",
        isActive
          ? "border-primary text-primary"
          : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted",
        className
      )}
    >
      {children}
    </button>
  );
}

interface TabContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export function TabContent({ value, children, className }: TabContentProps) {
  const { activeTab } = React.useContext(TabsContext);
  
  if (activeTab !== value) {
    return null;
  }

  return (
    <div className={cn("", className)}>
      {children}
    </div>
  );
}
