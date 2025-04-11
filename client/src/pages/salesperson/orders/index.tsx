import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ShoppingBag,
  Search,
  Filter,
  PlusCircle,
  Clock,
  CheckCircle,
  Eye,
  FileText,
  Package,
  ArrowRight,
  Calendar,
  DollarSign,
  BarChart4,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { Link } from "wouter";

export default function SalespersonOrders() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  
  // Fetch orders for the logged-in salesperson
  const { data: orders, isLoading } = useQuery({
    queryKey: ['/api/orders/mysales'],
    queryFn: async ({ queryKey }) => {
      const response = await apiRequest('GET', queryKey[0] as string);
      return response.json();
    }
  });
  
  // Filter orders based on search term and status filter
  const filteredOrders = React.useMemo(() => {
    if (!orders?.data) return [];
    
    return orders.data.filter((order: any) => {
      // Text search
      const searchLower = searchTerm.toLowerCase();
      const orderIdMatch = order.id?.toString().includes(searchLower);
      const customerMatch = order.customer?.name?.toLowerCase().includes(searchLower);
      const companyMatch = order.customer?.company?.toLowerCase().includes(searchLower);
      
      // Status filter
      const statusMatch = statusFilter === "all" || order.status === statusFilter;
      
      return (orderIdMatch || customerMatch || companyMatch) && statusMatch;
    });
  }, [orders, searchTerm, statusFilter]);
  
  // Sort orders based on sort order
  const sortedOrders = React.useMemo(() => {
    if (!filteredOrders) return [];
    
    return [...filteredOrders].sort((a, b) => {
      if (sortOrder === "newest") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (sortOrder === "oldest") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortOrder === "highest-value") {
        return b.totalAmount - a.totalAmount;
      } else if (sortOrder === "lowest-value") {
        return a.totalAmount - b.totalAmount;
      }
      return 0;
    });
  }, [filteredOrders, sortOrder]);
  
  // Render order status badge
  const OrderStatusBadge = ({ status }: { status: string }) => {
    switch (status?.toLowerCase()) {
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
      case 'canceled':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Canceled</Badge>;
      default:
        return <Badge>{status || 'Unknown'}</Badge>;
    }
  };
  
  // Group orders by status for dashboard view
  const ordersByStatus = React.useMemo(() => {
    if (!orders?.data) return {};
    
    return orders.data.reduce((acc: any, order: any) => {
      if (!acc[order.status]) {
        acc[order.status] = [];
      }
      acc[order.status].push(order);
      return acc;
    }, {});
  }, [orders]);
  
  // Count orders by status
  const orderCounts = React.useMemo(() => {
    return {
      pending: ordersByStatus['pending']?.length || 0,
      in_design: ordersByStatus['in_design']?.length || 0,
      design_approved: ordersByStatus['design_approved']?.length || 0,
      in_production: ordersByStatus['in_production']?.length || 0,
      completed: ordersByStatus['completed']?.length || 0,
      total: orders?.data?.length || 0,
    };
  }, [ordersByStatus, orders]);
  
  return (
    <div className="container mx-auto py-8 max-w-7xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Orders Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            View and track all your orders through the production process
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button asChild>
            <Link href="/orders/create">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create New Order
            </Link>
          </Button>
        </div>
      </div>
      
      {/* Order Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <ShoppingBag className="h-5 w-5 text-blue-500 mr-2" />
              <div className="text-2xl font-bold">{orderCounts.total}</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-yellow-500 mr-2" />
              <div className="text-2xl font-bold">{orderCounts.pending}</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">In Design</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <FileText className="h-5 w-5 text-purple-500 mr-2" />
              <div className="text-2xl font-bold">{orderCounts.in_design}</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">In Production</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Package className="h-5 w-5 text-orange-500 mr-2" />
              <div className="text-2xl font-bold">{orderCounts.in_production}</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              <div className="text-2xl font-bold">{orderCounts.completed}</div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Search and Filter */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <Input
                placeholder="Search orders by ID, customer or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <div className="flex items-center">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_design">In Design</SelectItem>
                <SelectItem value="design_approved">Design Approved</SelectItem>
                <SelectItem value="in_production">In Production</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="canceled">Canceled</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger>
                <div className="flex items-center">
                  <ArrowRight className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Sort orders" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="highest-value">Highest Value First</SelectItem>
                <SelectItem value="lowest-value">Lowest Value First</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      
      <Tabs defaultValue="all">
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Orders</TabsTrigger>
          <TabsTrigger value="active">Active Orders</TabsTrigger>
          <TabsTrigger value="completed">Completed Orders</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>All Orders</CardTitle>
              <CardDescription>
                View and manage all your orders in one place
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-4">Loading your orders...</div>
              ) : sortedOrders.length > 0 ? (
                <div className="space-y-4">
                  {sortedOrders.map((order: any) => (
                    <div key={order.id} className="border rounded-lg p-4">
                      <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-medium">Order #{order.id}</h3>
                            <OrderStatusBadge status={order.status} />
                            {order.urgentOrder && (
                              <Badge className="bg-red-100 text-red-800">Urgent</Badge>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                            <div className="flex items-center text-sm text-gray-600">
                              <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                              {order.createdAt
                                ? format(new Date(order.createdAt), 'MMM d, yyyy')
                                : 'Date not available'}
                            </div>
                            
                            <div className="flex items-center text-sm text-gray-600">
                              <DollarSign className="h-4 w-4 mr-2 text-gray-400" />
                              ${order.totalAmount?.toFixed(2) || '0.00'}
                            </div>
                            
                            <div className="flex items-center text-sm text-gray-600">
                              <ShoppingBag className="h-4 w-4 mr-2 text-gray-400" />
                              {order.itemCount || '0'} items
                            </div>
                            
                            <div className="flex items-center text-sm text-gray-600">
                              <Clock className="h-4 w-4 mr-2 text-gray-400" />
                              {order.updatedAt
                                ? `Updated ${formatDistanceToNow(new Date(order.updatedAt))} ago`
                                : 'Recently updated'}
                            </div>
                          </div>
                          
                          <div className="mt-3 flex items-center">
                            <span className="text-sm font-medium mr-2">Customer:</span>
                            <span className="text-sm text-gray-600">
                              {order.customer?.name || 'Unknown'} 
                              {order.customer?.company ? ` (${order.customer.company})` : ''}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-2 md:min-w-[140px] justify-center">
                          <Button asChild variant="default" size="sm">
                            <Link href={`/orders/${order.id}`}>
                              <Eye className="mr-1 h-4 w-4" />
                              View Details
                            </Link>
                          </Button>
                          
                          {/* Show different action buttons based on status */}
                          {order.status === 'pending' && (
                            <Button asChild variant="outline" size="sm">
                              <Link href={`/orders/${order.id}/edit`}>
                                Edit Order
                              </Link>
                            </Button>
                          )}
                          
                          {order.status === 'design_approved' && (
                            <Button asChild variant="outline" size="sm">
                              <Link href={`/size-requests/${order.id}`}>
                                Request Sizes
                              </Link>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">
                    <ShoppingBag className="h-6 w-6 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium">No orders found</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {searchTerm || statusFilter !== 'all'
                      ? "No orders match your search criteria"
                      : "You haven't created any orders yet"}
                  </p>
                  {!searchTerm && statusFilter === 'all' && (
                    <Button asChild className="mt-4">
                      <Link href="/orders/create">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create Your First Order
                      </Link>
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
            {sortedOrders.length > 0 && (
              <CardFooter className="border-t pt-4 px-6">
                <div className="w-full text-center text-sm text-gray-500">
                  Showing {sortedOrders.length} of {orders?.data?.length || 0} orders
                </div>
              </CardFooter>
            )}
          </Card>
        </TabsContent>
        
        <TabsContent value="active">
          <Card>
            <CardHeader>
              <CardTitle>Active Orders</CardTitle>
              <CardDescription>
                Orders that are currently in process
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-4">Loading active orders...</div>
              ) : sortedOrders.filter((o: any) => o.status !== 'completed' && o.status !== 'canceled').length > 0 ? (
                <div className="space-y-4">
                  {sortedOrders
                    .filter((o: any) => o.status !== 'completed' && o.status !== 'canceled')
                    .map((order: any) => (
                      <div key={order.id} className="border rounded-lg p-4">
                        <div className="flex flex-col md:flex-row gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-medium">Order #{order.id}</h3>
                              <OrderStatusBadge status={order.status} />
                              {order.urgentOrder && (
                                <Badge className="bg-red-100 text-red-800">Urgent</Badge>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                              <div className="flex items-center text-sm text-gray-600">
                                <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                                {order.createdAt
                                  ? format(new Date(order.createdAt), 'MMM d, yyyy')
                                  : 'Date not available'}
                              </div>
                              
                              <div className="flex items-center text-sm text-gray-600">
                                <DollarSign className="h-4 w-4 mr-2 text-gray-400" />
                                ${order.totalAmount?.toFixed(2) || '0.00'}
                              </div>
                              
                              <div className="flex items-center text-sm text-gray-600">
                                <ShoppingBag className="h-4 w-4 mr-2 text-gray-400" />
                                {order.itemCount || '0'} items
                              </div>
                              
                              <div className="flex items-center text-sm text-gray-600">
                                <Clock className="h-4 w-4 mr-2 text-gray-400" />
                                {order.updatedAt
                                  ? `Updated ${formatDistanceToNow(new Date(order.updatedAt))} ago`
                                  : 'Recently updated'}
                              </div>
                            </div>
                            
                            <div className="mt-3 flex items-center">
                              <span className="text-sm font-medium mr-2">Customer:</span>
                              <span className="text-sm text-gray-600">
                                {order.customer?.name || 'Unknown'} 
                                {order.customer?.company ? ` (${order.customer.company})` : ''}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex flex-col gap-2 md:min-w-[140px] justify-center">
                            <Button asChild variant="default" size="sm">
                              <Link href={`/orders/${order.id}`}>
                                <Eye className="mr-1 h-4 w-4" />
                                View Details
                              </Link>
                            </Button>
                            
                            {order.status === 'pending' && (
                              <Button asChild variant="outline" size="sm">
                                <Link href={`/orders/${order.id}/edit`}>
                                  Edit Order
                                </Link>
                              </Button>
                            )}
                            
                            {order.status === 'design_approved' && (
                              <Button asChild variant="outline" size="sm">
                                <Link href={`/size-requests/${order.id}`}>
                                  Request Sizes
                                </Link>
                              </Button>
                            )}
                          </div>
                        </div>
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
                    You don't have any orders in progress
                  </p>
                  <Button asChild className="mt-4">
                    <Link href="/orders/create">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Create New Order
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="completed">
          <Card>
            <CardHeader>
              <CardTitle>Completed Orders</CardTitle>
              <CardDescription>
                Orders that have been completed and delivered
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-4">Loading completed orders...</div>
              ) : sortedOrders.filter((o: any) => o.status === 'completed').length > 0 ? (
                <div className="space-y-4">
                  {sortedOrders
                    .filter((o: any) => o.status === 'completed')
                    .map((order: any) => (
                      <div key={order.id} className="border rounded-lg p-4">
                        <div className="flex flex-col md:flex-row gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-medium">Order #{order.id}</h3>
                              <OrderStatusBadge status={order.status} />
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                              <div className="flex items-center text-sm text-gray-600">
                                <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                                {order.createdAt
                                  ? format(new Date(order.createdAt), 'MMM d, yyyy')
                                  : 'Date not available'}
                              </div>
                              
                              <div className="flex items-center text-sm text-gray-600">
                                <DollarSign className="h-4 w-4 mr-2 text-gray-400" />
                                ${order.totalAmount?.toFixed(2) || '0.00'}
                              </div>
                              
                              <div className="flex items-center text-sm text-gray-600">
                                <ShoppingBag className="h-4 w-4 mr-2 text-gray-400" />
                                {order.itemCount || '0'} items
                              </div>
                              
                              <div className="flex items-center text-sm text-gray-600">
                                <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                                Completed {order.completedAt
                                  ? formatDistanceToNow(new Date(order.completedAt)) + ' ago'
                                  : ''}
                              </div>
                            </div>
                            
                            <div className="mt-3 flex items-center">
                              <span className="text-sm font-medium mr-2">Customer:</span>
                              <span className="text-sm text-gray-600">
                                {order.customer?.name || 'Unknown'} 
                                {order.customer?.company ? ` (${order.customer.company})` : ''}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex flex-col gap-2 md:min-w-[140px] justify-center">
                            <Button asChild variant="default" size="sm">
                              <Link href={`/orders/${order.id}`}>
                                <Eye className="mr-1 h-4 w-4" />
                                View Details
                              </Link>
                            </Button>
                            
                            <Button asChild variant="outline" size="sm">
                              <Link href={`/orders/create?duplicate=${order.id}`}>
                                Create Similar
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">
                    <CheckCircle className="h-6 w-6 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium">No completed orders</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    You don't have any completed orders yet
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Order Metrics */}
      <div className="mt-8">
        <h2 className="text-lg font-medium mb-4">Order Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Total Orders Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <DollarSign className="h-5 w-5 text-green-500 mr-2" />
                <div className="text-2xl font-bold">
                  ${orders?.data?.reduce((acc: number, order: any) => acc + (order.totalAmount || 0), 0).toFixed(2) || '0.00'}
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Total value of all your orders
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Average Order Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <BarChart4 className="h-5 w-5 text-blue-500 mr-2" />
                <div className="text-2xl font-bold">
                  {orders?.data?.length > 0
                    ? '$' + (orders.data.reduce((acc: number, order: any) => acc + (order.totalAmount || 0), 0) / orders.data.length).toFixed(2)
                    : '$0.00'}
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Average value per order
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Completion Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                <div className="text-2xl font-bold">
                  {orders?.data?.length > 0
                    ? Math.round((orderCounts.completed / orders.data.length) * 100) + '%'
                    : '0%'}
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Percentage of orders completed
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}