import { Link, useLocation, useRoute } from "wouter";
import { cn } from "@/lib/utils";
import { AuthUser } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import {
  LayoutDashboard,
  PenTool,
  ClipboardList,
  Clock,
  User,
  LogOut,
  CheckSquare,
  FileBarChart,
  Bell,
  FileUp,
  MessagesSquare,
  Palette,
  StickyNote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Menu } from "lucide-react";

export function DesignerSidebar({ user }: { user: AuthUser }) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { logoutMutation } = useAuth();
  const [openMobileMenu, setOpenMobileMenu] = useState(false);
  
  // Base navigation items for designers
  const defaultNavigation = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboard className="mr-2" size={16} />,
      id: "dashboard",
    },
    {
      name: "Unclaimed Designs",
      href: "/unclaimed-designs",
      icon: <PenTool className="mr-2" size={16} />,
      id: "unclaimed-designs",
    },
    {
      name: "My Design Jobs",
      href: "/design-jobs",
      icon: <ClipboardList className="mr-2" size={16} />,
      id: "design-jobs",
    },
    {
      name: "Design Submission",
      href: "/design-submission",
      icon: <FileUp className="mr-2" size={16} />,
      id: "design-submission",
    },
    {
      name: "Revision Requests",
      href: "/revisions",
      icon: <StickyNote className="mr-2" size={16} />,
      id: "revisions",
    },
    {
      name: "Customer Input",
      href: "/customer-input",
      icon: <MessagesSquare className="mr-2" size={16} />,
      id: "customer-input",
    },
    {
      name: "Notifications",
      href: "/notifications",
      icon: <Bell className="mr-2" size={16} />,
      id: "notifications",
    },
    {
      name: "Design Process Guide",
      href: "/design-process-guide",
      icon: <FileBarChart className="mr-2" size={16} />,
      id: "design-process-guide",
    },
  ];

  // Logout handler
  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      navigate("/auth");
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "There was an error logging out. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Hide mobile menu when navigating
  useEffect(() => {
    setOpenMobileMenu(false);
  }, [useLocation()[0]]);

  // Navigation item with route matching
  const NavItem = ({ item }: { item: any }) => {
    const [isActive] = useRoute(item.href);
    
    return (
      <Link
        href={item.href}
        className={cn(
          "flex items-center py-2 px-3 rounded-md text-sm font-medium transition-colors",
          isActive
            ? "bg-brand-100 text-brand-900"
            : "text-gray-700 hover:bg-gray-100",
        )}
      >
        {item.icon}
        {item.name}
      </Link>
    );
  };

  const NavContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={``} />
            <AvatarFallback>{user.fullName?.charAt(0) || user.username?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="text-sm font-semibold">{user.fullName}</div>
            <div className="text-xs text-gray-500">Designer</div>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-1 mb-8">
          {defaultNavigation.map((item) => (
            <NavItem key={item.id} item={item} />
          ))}
        </div>
      </ScrollArea>
      
      <div className="p-4 border-t mt-auto">
        <div className="flex flex-col gap-3">
          <Link
            href="/profile"
            className="flex items-center py-2 px-3 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <User className="mr-2" size={16} />
            My Profile
          </Link>
          
          <Button
            variant="outline"
            className="w-full justify-start bg-white"
            onClick={handleLogout}
          >
            <LogOut className="mr-2" size={16} />
            Logout
          </Button>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full justify-start bg-white">
                <FileBarChart className="mr-2" size={16} />
                Send Feedback
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Send Feedback</DialogTitle>
                <DialogDescription>
                  Share your thoughts or report issues to help us improve the platform.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <p className="text-sm text-gray-500">
                  Please use this form to submit feedback about your experience with the platform.
                </p>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:flex-col md:fixed md:inset-y-0 z-10 bg-white border-r w-60">
        <NavContent />
      </div>
      
      {/* Mobile Menu Button */}
      <div className="md:hidden fixed top-0 left-0 z-30 p-4">
        <Sheet open={openMobileMenu} onOpenChange={setOpenMobileMenu}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Menu size={20} />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-60">
            <NavContent />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}