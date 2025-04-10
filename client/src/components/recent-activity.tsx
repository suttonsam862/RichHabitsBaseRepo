import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ShoppingBag, Users, MessageSquare, FileText, Bell, 
  UserPlus, Pencil, CheckCircle, UserCheck, AlertCircle,
  Settings, Zap, Calendar, ArrowRight, MoreHorizontal
} from "lucide-react";
import { getRelativeTime } from "@/lib/utils";
import { ActivityItem } from "@/types";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";

export default function RecentActivity() {
  const { user } = useAuth();
  
  // Use filtered activities endpoint if user is not an admin
  const isAdmin = user?.role === 'admin';
  const queryEndpoint = isAdmin 
    ? '/api/activities/recent'
    : `/api/activities/recent/filtered?userId=${user?.id}&includeTeam=true&includeRelated=true`;

  const { data, isLoading } = useQuery({
    queryKey: [queryEndpoint],
    refetchInterval: false,
    refetchOnWindowFocus: false,
    // Only run the query when we have a user object
    enabled: !!user,
  });

  // Process API data with icon mapping
  const processActivities = (activities: any[]) => {
    if (!activities) return [];

    return activities.map(activity => {
      // Determine icon based on activity type and content
      let icon = <Bell size={18} />;
      let iconBg = "bg-gray-100";
      let iconColor = "text-gray-600";
      
      if (activity.type === "user") {
        icon = <UserPlus size={18} />;
        iconBg = "bg-blue-50";
        iconColor = "text-blue-600";
      } else if (activity.type === "order") {
        icon = <ShoppingBag size={18} />;
        iconBg = "bg-green-50";
        iconColor = "text-green-600";
      } else if (activity.type === "lead") {
        icon = <Users size={18} />;
        iconBg = "bg-purple-50";
        iconColor = "text-purple-600";
      } else if (activity.type === "message") {
        icon = <MessageSquare size={18} />;
        iconBg = "bg-violet-50";
        iconColor = "text-violet-600";
      } else if (activity.content.includes("password")) {
        icon = <Settings size={18} />;
        iconBg = "bg-amber-50";
        iconColor = "text-amber-600";
      } else if (activity.content.includes("visible pages")) {
        icon = <Pencil size={18} />;
        iconBg = "bg-cyan-50";
        iconColor = "text-cyan-600";
      }

      return {
        ...activity,
        icon,
        iconBg,
        iconColor
      };
    });
  };

  // Get activities from API or default to empty array
  const activities = processActivities(data?.data || []);
  
  // Filter for different types of messages
  const corporateMessages = [
    {
      id: 101,
      title: "New Design Templates Available",
      content: "Marketing has released 12 new design templates for jerseys and uniforms.",
      importance: "low",
      time: "2 hours ago",
      icon: <Zap size={18} />,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      id: 102,
      title: "Q2 Sales Targets Updated",
      content: "Management has revised the Q2 sales targets. All sales reps should review.",
      importance: "high",
      time: "Yesterday",
      icon: <AlertCircle size={18} />,
      iconBg: "bg-red-50",
      iconColor: "text-red-600",
    },
    {
      id: 103,
      title: "Team Meeting Reminder",
      content: "Virtual team meeting tomorrow at 10:00 AM to discuss new product launches.",
      importance: "medium",
      time: "Yesterday",
      icon: <Calendar size={18} />,
      iconBg: "bg-purple-50",
      iconColor: "text-purple-600",
    }
  ];

  const customerMessages = [
    {
      id: 201,
      title: "Order Status Request",
      content: "Customer Jesse Vasquez asked about order #41654 status.",
      importance: "high",
      time: "30 minutes ago",
      icon: <UserCheck size={18} />,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
    },
    {
      id: 202,
      title: "Premium Package Review",
      content: "New 5-star review from Emma Johnson for Premium Custom Jersey.",
      importance: "medium",
      time: "4 hours ago",
      icon: <CheckCircle size={18} />,
      iconBg: "bg-green-50",
      iconColor: "text-green-600",
    }
  ];

  return (
    <Card className="col-span-1 overflow-hidden border border-gray-200 shadow-sm">
      <CardHeader className="pb-0 border-b border-gray-100">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl font-semibold text-gray-900">Activity Feed</CardTitle>
            <CardDescription className="text-gray-500 mt-1">
              Recent activity and messages
            </CardDescription>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Options</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Mark all as read</DropdownMenuItem>
              <DropdownMenuItem>Notification settings</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <Tabs defaultValue="activity" className="w-full">
        <div className="px-6 pt-3">
          <TabsList className="w-full">
            <TabsTrigger value="activity" className="flex-1">System Activity</TabsTrigger>
            <TabsTrigger value="corporate" className="flex-1">
              Corporate
              <Badge className="ml-2 bg-blue-500" variant="default">3</Badge>
            </TabsTrigger>
            <TabsTrigger value="customer" className="flex-1">
              Customer
              <Badge className="ml-2 bg-green-500" variant="default">2</Badge>
            </TabsTrigger>
          </TabsList>
        </div>

        <CardContent className="p-0">
          {/* System Activity Tab */}
          <div className={`p-4 ${activities.length === 0 ? 'block' : 'hidden'} text-center py-12`}>
            <Bell className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900">No recent activity</h3>
            <p className="text-sm text-gray-500 mt-1">System activity will appear here when available</p>
          </div>

          <div data-state-tab="activity" className="pt-2 px-6 pb-4 space-y-5 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
            {activities.map((activity, index) => (
              <div key={activity.id} className="flex items-start group">
                <div className="relative mr-4">
                  <div className={`w-10 h-10 flex items-center justify-center rounded-full ${activity.iconBg} ${activity.iconColor} shadow-sm`}>
                    {activity.icon}
                  </div>
                  {index < activities.length - 1 && (
                    <div className="absolute top-10 bottom-0 left-1/2 w-0.5 -ml-px bg-gray-100 group-last:hidden"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {activity.content}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 flex items-center">
                    {getRelativeTime(activity.createdAt)}
                    <span className="inline-block h-1 w-1 rounded-full bg-gray-300 mx-2"></span>
                    {activity.type}
                  </p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  View
                </Button>
              </div>
            ))}
          </div>

          {/* Corporate Messages Tab */}
          <div data-state-tab="corporate" className="pt-2 px-6 pb-4 space-y-4 max-h-80 overflow-y-auto">
            {corporateMessages.map((message) => (
              <div key={message.id} className="flex gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full ${message.iconBg} ${message.iconColor} shadow-sm`}>
                  {message.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-semibold text-gray-900">{message.title}</h4>
                    <Badge 
                      variant="outline" 
                      className={`
                        ${message.importance === 'high' ? 'border-red-200 bg-red-50 text-red-700' : 
                          message.importance === 'medium' ? 'border-amber-200 bg-amber-50 text-amber-700' : 
                          'border-blue-200 bg-blue-50 text-blue-700'}
                      `}
                    >
                      {message.importance === 'high' ? 'Important' : 
                        message.importance === 'medium' ? 'Noteworthy' : 'Info'}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{message.content}</p>
                  <p className="text-xs text-gray-500 mt-1">{message.time}</p>
                </div>
              </div>
            ))}
            <div className="mt-3 pt-3 border-t border-gray-100 text-center">
              <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                View all corporate messages
                <ArrowRight size={14} className="ml-1" />
              </Button>
            </div>
          </div>

          {/* Customer Messages Tab */}
          <div data-state-tab="customer" className="pt-2 px-6 pb-4 space-y-4 max-h-80 overflow-y-auto">
            {customerMessages.map((message) => (
              <div key={message.id} className="flex gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full ${message.iconBg} ${message.iconColor} shadow-sm`}>
                  {message.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-semibold text-gray-900">{message.title}</h4>
                    <Badge 
                      variant="outline" 
                      className={`
                        ${message.importance === 'high' ? 'border-red-200 bg-red-50 text-red-700' : 
                          message.importance === 'medium' ? 'border-amber-200 bg-amber-50 text-amber-700' : 
                          'border-blue-200 bg-blue-50 text-blue-700'}
                      `}
                    >
                      {message.importance === 'high' ? 'Urgent' : 
                        message.importance === 'medium' ? 'New' : 'FYI'}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{message.content}</p>
                  <p className="text-xs text-gray-500 mt-1">{message.time}</p>
                </div>
              </div>
            ))}
            <div className="mt-3 pt-3 border-t border-gray-100 text-center">
              <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                View all customer messages
                <ArrowRight size={14} className="ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Tabs>
    </Card>
  );
}
