import { Menu, Bell, Settings as SettingsIcon } from "lucide-react";
import ThemeToggle from "./ui/theme-toggle";

interface MobileMenuProps {
  onMenuToggle: () => void;
}

export default function MobileMenu({ onMenuToggle }: MobileMenuProps) {
  return (
    <div className="md:hidden fixed top-0 left-0 right-0 h-14 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 z-30 flex items-center px-4">
      <button 
        className="text-gray-500 dark:text-gray-400 mr-3"
        onClick={onMenuToggle}
      >
        <Menu size={24} />
      </button>
      <h1 className="text-lg font-semibold">
        <span className="text-brand-600 dark:text-brand-400">Rich</span> Habits
      </h1>
      
      <div className="ml-auto flex items-center gap-2">
        <div className="relative">
          <button className="p-1.5 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
            <Bell size={20} />
          </button>
          <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
        </div>
        <ThemeToggle />
      </div>
    </div>
  );
}
