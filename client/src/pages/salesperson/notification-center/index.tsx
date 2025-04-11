import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, Bell, CheckCircle2, XCircle, Hourglass, Clock, ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function NotificationCenter() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("all");
  
  // Fetch notifications
  const { data: notifications, isLoading } = useQuery({
    queryKey: ['/api/notifications'],
    queryFn: async ({ queryKey }) => {
      const response = await apiRequest('GET', queryKey[0] as string);
      return response.json();
    },
  });
  
  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      await apiRequest('PATCH', `/api/notifications/${notificationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      toast({
        title: "Notification marked as read",
        description: "The notification has been updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update notification",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Mark all notifications as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('POST', '/api/notifications/mark-all-read');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      toast({
        title: "All notifications marked as read",
        description: "Your notifications have been updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update notifications",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle marking a notification as read
  const handleMarkAsRead = (notificationId: number) => {
    markAsReadMutation.mutate(notificationId);
  };
  
  // Handle marking all notifications as read
  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };
  
  // Notification type icon
  const NotificationIcon = ({ type }: { type: string }) => {
    switch (type.toLowerCase()) {
      case 'design_approval':
        return <Eye className="h-5 w-5 text-blue-500" />;
      case 'design_rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'design_completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'production_started':
        return <Hourglass className="h-5 w-5 text-orange-500" />;
      case 'order_completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };
  
  // Filter notifications based on selected tab
  const filteredNotifications = notifications?.data?.filter((notification: any) => {
    if (activeTab === "all") return true;
    if (activeTab === "unread") return !notification.read;
    if (activeTab === "order") return notification.type.includes("order");
    if (activeTab === "design") return notification.type.includes("design");
    if (activeTab === "production") return notification.type.includes("production");
    return true;
  });
  
  return (
    <div className="container max-w-6xl mx-auto py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Notification Center</h1>
          <p className="text-sm text-gray-500 mt-1">
            Stay updated with order, design, and production progress
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button 
            variant="outline" 
            onClick={handleMarkAllAsRead}
            disabled={isLoading || markAllAsReadMutation.isPending || !notifications?.data?.some((n: any) => !n.read)}
          >
            Mark All as Read
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">Unread</TabsTrigger>
            <TabsTrigger value="order">Order Updates</TabsTrigger>
            <TabsTrigger value="design">Design Updates</TabsTrigger>
            <TabsTrigger value="production">Production Updates</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value={activeTab}>
          <Card>
            <CardHeader>
              <CardTitle>
                {activeTab === "all" && "All Notifications"}
                {activeTab === "unread" && "Unread Notifications"}
                {activeTab === "order" && "Order Updates"}
                {activeTab === "design" && "Design Updates"}
                {activeTab === "production" && "Production Updates"}
              </CardTitle>
              <CardDescription>
                {activeTab === "all" && "All your notifications from orders, designs, and production"}
                {activeTab === "unread" && "New notifications that require your attention"}
                {activeTab === "order" && "Updates about order status changes and approvals"}
                {activeTab === "design" && "Updates about design submissions and approvals"}
                {activeTab === "production" && "Updates about production status and completion"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-4">Loading notifications...</div>
              ) : filteredNotifications?.length ? (
                <div className="space-y-4">
                  {filteredNotifications.map((notification: any) => (
                    <div 
                      key={notification.id} 
                      className={`flex items-start p-4 rounded-lg ${notification.read ? 'bg-gray-50' : 'bg-blue-50 border border-blue-100'}`}
                    >
                      <div className="mr-3 mt-0.5">
                        <NotificationIcon type={notification.type} />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium">{notification.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                        {notification.orderId && (
                          <div className="mt-2">
                            <Link href={`/orders/${notification.orderId}`} className="text-xs text-brand-600 hover:text-brand-800 font-medium">
                              View Order #{notification.orderId}
                            </Link>
                          </div>
                        )}
                        <div className="text-xs text-gray-500 mt-1">
                          <Clock className="inline-block h-3 w-3 mr-1" />
                          {notification.createdAt 
                            ? `${formatDistanceToNow(new Date(notification.createdAt))} ago` 
                            : 'Recently received'}
                        </div>
                      </div>
                      {!notification.read && (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-xs"
                          onClick={() => handleMarkAsRead(notification.id)}
                          disabled={markAsReadMutation.isPending}
                        >
                          Mark as Read
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">
                    <Bell className="h-6 w-6 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium">No notifications</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {activeTab === "all" && "You don't have any notifications at the moment"}
                    {activeTab === "unread" && "You don't have any unread notifications"}
                    {activeTab === "order" && "You don't have any order updates"}
                    {activeTab === "design" && "You don't have any design updates"}
                    {activeTab === "production" && "You don't have any production updates"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}