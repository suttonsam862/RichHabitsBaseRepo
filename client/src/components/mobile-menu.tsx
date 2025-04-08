import { Menu, Bell, Settings as SettingsIcon } from "lucide-react";
import ThemeToggle from "./ui/theme-toggle";

interface MobileMenuProps {
  onMenuToggle: () => void;
}

export default function MobileMenu({ onMenuToggle }: MobileMenuProps) {
  return (
    <div className="md:hidden fixed top-0 left-0 right-0 h-16 border-b bg-white z-30 flex items-center px-4 shadow-sm">
      <button 
        className="text-gray-700 hover:text-primary mr-3"
        onClick={onMenuToggle}
      >
        <Menu size={24} />
      </button>
      <h1 className="text-lg font-bold">
        <span className="text-primary">Rich</span> Habits
      </h1>
      
      <div className="ml-auto flex items-center gap-3">
        <div className="relative">
          <button className="p-1.5 rounded-full text-gray-700 hover:bg-gray-100">
            <Bell size={20} />
          </button>
          <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
        </div>
      </div>
    </div>
  );
}
