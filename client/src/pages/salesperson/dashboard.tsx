import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Link } from "wouter";
import {
  Users,
  ShoppingBag,
  Bell,
  PlusCircle,
  Clock,
  CheckCircle2,
  ArrowRight,
  Eye,
  XCircle,
  Hourglass,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function SalespersonDashboard() {
  // Fetch leads available for claiming
  const { data: unclaimedLeads, isLoading: isLoadingLeads } = useQuery({
    queryKey: ['/api/leads/unclaimed'],
    queryFn: async ({ queryKey }) => {
      const response = await fetch(queryKey[0] as string);
      if (!response.ok) throw new Error('Failed to fetch unclaimed leads');
      return response.json();
    }
  });

  // Fetch active orders for the salesperson
  const { data: orders, isLoading: isLoadingOrders } = useQuery({
    queryKey: ['/api/orders/mysales'],
    queryFn: async ({ queryKey }) => {
      const response = await fetch(queryKey[0] as string);
      if (!response.ok) throw new Error('Failed to fetch orders');
      return response.json();
    }
  });

  // Fetch recent notifications
  const { data: notifications, isLoading: isLoadingNotifications } = useQuery({
    queryKey: ['/api/notifications'],
    queryFn: async ({ queryKey }) => {
      const response = await fetch(queryKey[0] as string);
      if (!response.ok) throw new Error('Failed to fetch notifications');
      return response.json();
    }
  });

  // Render lead status badge
  const LeadStatusBadge = ({ status }: { status: string }) => {
    switch (status.toLowerCase()) {
      case 'new':
        return <Badge className="bg-green-100 text-green-800 border-green-200">New</Badge>;
      case 'contacted':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Contacted</Badge>;
      case 'qualified':
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Qualified</Badge>;
      case 'unqualified':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Unqualified</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Render order status badge
  const OrderStatusBadge = ({ status }: { status: string }) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>;
      case 'in_design':
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200">In Design</Badge>;
      case 'design_approved':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Design Approved</Badge>;
      case 'in_production':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200">In Production</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Completed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
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

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Sales Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your leads, track your orders, and monitor your notifications
          </p>
        </div>
        <div className="mt-4 md:mt-0 space-x-2">
          <Button asChild>
            <Link href="/orders/create">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create New Order
            </Link>
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Unclaimed Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Users className="h-5 w-5 text-blue-500 mr-2" />
              <div className="text-2xl font-bold">
                {isLoadingLeads ? "..." : unclaimedLeads?.data?.length || 0}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">Available for you to claim</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Active Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <ShoppingBag className="h-5 w-5 text-green-500 mr-2" />
              <div className="text-2xl font-bold">
                {isLoadingOrders ? "..." : orders?.data?.filter((o: any) => o.status !== 'completed').length || 0}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">Orders in progress</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Bell className="h-5 w-5 text-yellow-500 mr-2" />
              <div className="text-2xl font-bold">
                {isLoadingNotifications ? "..." : notifications?.data?.filter((n: any) => !n.read).length || 0}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">Unread notifications</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="leads">
        <TabsList className="mb-4">
          <TabsTrigger value="leads">Unclaimed Leads</TabsTrigger>
          <TabsTrigger value="orders">Active Orders</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>
        
        {/* Unclaimed Leads Tab */}
        <TabsContent value="leads">
          <Card>
            <CardHeader>
              <CardTitle>Available Leads</CardTitle>
              <CardDescription>
                Claim leads to convert them into customers
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingLeads ? (
                <div className="text-center py-4">Loading available leads...</div>
              ) : unclaimedLeads?.data?.length ? (
                <div className="space-y-4">
                  {unclaimedLeads.data.map((lead: any) => (
                    <div key={lead.id} className="flex items-start justify-between border p-4 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{lead.fullName || 'Unknown Contact'}</h3>
                          <LeadStatusBadge status={lead.status || 'New'} />
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{lead.company || 'Individual'}</p>
                        <p className="text-sm text-gray-700 mt-2">{lead.notes || 'No additional information provided.'}</p>
                        <div className="text-xs text-gray-500 mt-2">
                          <Clock className="inline-block h-3 w-3 mr-1" />
                          {lead.createdAt 
                            ? `Added ${formatDistanceToNow(new Date(lead.createdAt))} ago` 
                            : 'Recently added'}
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        Claim Lead
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">
                    <Users className="h-6 w-6 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium">No unclaimed leads</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    There are currently no unclaimed leads in the system
                  </p>
                </div>
              )}
              
              <div className="mt-4 text-center">
                <Button asChild variant="outline">
                  <Link href="/leads">
                    View All Leads
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Active Orders Tab */}
        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>Your Orders</CardTitle>
              <CardDescription>
                Track the progress of your active orders
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingOrders ? (
                <div className="text-center py-4">Loading your orders...</div>
              ) : orders?.data?.length ? (
                <div className="space-y-4">
                  {orders.data
                    .filter((order: any) => order.status !== 'completed')
                    .map((order: any) => (
                      <div key={order.id} className="flex items-start justify-between border p-4 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">Order #{order.id}</h3>
                            <OrderStatusBadge status={order.status || 'Pending'} />
                          </div>
                          <p className="text-sm text-gray-500 mt-1">{order.customer?.name || 'Unknown Customer'}</p>
                          <div className="flex items-center text-sm text-gray-700 mt-2">
                            <span className="font-medium mr-2">Items:</span>
                            {order.itemCount || '0'} | 
                            <span className="font-medium mx-2">Total:</span>
                            ${order.totalAmount?.toFixed(2) || '0.00'}
                          </div>
                          <div className="text-xs text-gray-500 mt-2">
                            <Clock className="inline-block h-3 w-3 mr-1" />
                            {order.updatedAt 
                              ? `Updated ${formatDistanceToNow(new Date(order.updatedAt))} ago` 
                              : 'Recently updated'}
                          </div>
                        </div>
                        <Button size="sm" asChild>
                          <Link href={`/orders/${order.id}`}>
                            View Details
                          </Link>
                        </Button>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">
                    <ShoppingBag className="h-6 w-6 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium">No active orders</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    You don't have any active orders at the moment
                  </p>
                </div>
              )}
              
              <div className="mt-4 text-center">
                <Button asChild variant="outline">
                  <Link href="/orders">
                    View All Orders
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Recent Notifications</CardTitle>
              <CardDescription>
                Important updates about your orders and designs
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingNotifications ? (
                <div className="text-center py-4">Loading notifications...</div>
              ) : notifications?.data?.length ? (
                <div className="space-y-4">
                  {notifications.data.map((notification: any) => (
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
                        <Button size="sm" variant="ghost" className="text-xs">
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
                    You don't have any notifications at the moment
                  </p>
                </div>
              )}
              
              <div className="mt-4 text-center">
                <Button asChild variant="outline">
                  <Link href="/notifications">
                    View All Notifications
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Quick Tips */}
      <div className="mt-6">
        <Alert>
          <Bell className="h-4 w-4" />
          <AlertTitle>Quick Tip</AlertTitle>
          <AlertDescription>
            The Sales Process Guide is now available! Check it out for step-by-step instructions on managing leads and orders.
            <Button asChild variant="link" className="p-0 h-auto ml-2 text-brand-600 font-medium">
              <Link href="/sales-process-guide">View Guide</Link>
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}