import { Menu, Bell, User } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

interface MobileMenuProps {
  onMenuToggle: () => void;
}

export default function MobileMenu({ onMenuToggle }: MobileMenuProps) {
  const { user } = useAuth();
  
  return (
    <div className="md:hidden fixed top-0 left-0 right-0 h-16 border-b bg-white dark:bg-gray-950 z-30 flex items-center px-4 shadow-sm">
      <Button 
        variant="ghost"
        size="icon"
        className="text-gray-700 dark:text-gray-300 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-800 mr-3"
        onClick={onMenuToggle}
        aria-label="Toggle menu"
      >
        <Menu size={22} />
      </Button>
      
      <h1 className="text-lg font-bold">
        <span className="text-primary">Rich</span> <span className="dark:text-white">Habits</span>
      </h1>
      
      <div className="ml-auto flex items-center gap-3">
        <div className="relative">
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Bell size={18} />
            <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
          </Button>
        </div>
        
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-primary/10 text-primary text-xs">
            {user?.username?.substring(0, 2).toUpperCase() || <User size={14} />}
          </AvatarFallback>
        </Avatar>
      </div>
    </div>
  );
}
