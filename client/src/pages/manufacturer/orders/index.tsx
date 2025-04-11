import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Link } from "wouter";
import {
  Search,
  Filter,
  ShoppingCart,
  Hammer,
  TruckIcon,
  CheckCircle,
  Package,
  Clock,
  ArrowUpDown,
  ChevronRight,
  Calendar,
  LayoutList,
  X,
} from "lucide-react";
import { format } from "date-fns";

export default function ManufacturingOrders() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [filterStatus, setFilterStatus] = useState("all");
  
  // Fetch all manufacturing orders
  const { data: orders, isLoading } = useQuery({
    queryKey: ['/api/manufacturer/orders', sortBy, filterStatus],
    queryFn: async ({ queryKey }) => {
      // This would fetch from API in production
      return {
        data: []
      };
    },
  });
  
  // Filter orders based on search term and status
  const filteredOrders = orders?.data?.filter((order: any) => {
    // Filter by search term
    const matchesSearch = 
      !searchTerm || 
      order.id.toString().includes(searchTerm) ||
      (order.customerName && order.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (order.productType && order.productType.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Filter by status
    const matchesStatus = 
      filterStatus === 'all' || 
      order.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });
  
  // Group orders by status for the tabs
  const pendingOrders = filteredOrders?.filter((order: any) => order.status === 'pending') || [];
  const inProductionOrders = filteredOrders?.filter((order: any) => order.status === 'in_production') || [];
  const readyToShipOrders = filteredOrders?.filter((order: any) => order.status === 'ready_to_ship') || [];
  const completedOrders = filteredOrders?.filter((order: any) => order.status === 'completed') || [];
  
  // Get status badge component
  const OrderStatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-blue-100 text-blue-800">New Order</Badge>;
      case 'in_production':
        return <Badge className="bg-amber-100 text-amber-800">In Production</Badge>;
      case 'ready_to_ship':
        return <Badge className="bg-green-100 text-green-800">Ready to Ship</Badge>;
      case 'completed':
        return <Badge className="bg-purple-100 text-purple-800">Completed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Manufacturing Orders</h1>
          <p className="text-muted-foreground">
            View and manage all orders assigned to your manufacturing facility
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/cost-input">
              <Hammer className="mr-2 h-4 w-4" />
              Update Costs
            </Link>
          </Button>
          <Button asChild>
            <Link href="/shipping">
              <TruckIcon className="mr-2 h-4 w-4" />
              Ship Orders
            </Link>
          </Button>
        </div>
      </div>
      
      {/* Filters and search */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by order #, customer, or product type..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-9 w-9"
                  onClick={() => setSearchTerm("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            <div className="flex gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Orders</SelectItem>
                  <SelectItem value="pending">New Orders</SelectItem>
                  <SelectItem value="in_production">In Production</SelectItem>
                  <SelectItem value="ready_to_ship">Ready to Ship</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]">
                  <ArrowUpDown className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="deadline">Deadline</SelectItem>
                  <SelectItem value="priority">Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted-foreground">Quick filters:</span>
            <Button 
              variant={filterStatus === "all" ? "default" : "outline"} 
              size="sm"
              onClick={() => setFilterStatus("all")}
            >
              <LayoutList className="mr-1 h-3 w-3" />
              All
            </Button>
            <Button 
              variant={filterStatus === "pending" ? "default" : "outline"} 
              size="sm"
              onClick={() => setFilterStatus("pending")}
            >
              <ShoppingCart className="mr-1 h-3 w-3" />
              New
            </Button>
            <Button 
              variant={filterStatus === "in_production" ? "default" : "outline"} 
              size="sm"
              onClick={() => setFilterStatus("in_production")}
            >
              <Hammer className="mr-1 h-3 w-3" />
              In Production
            </Button>
            <Button 
              variant={filterStatus === "ready_to_ship" ? "default" : "outline"} 
              size="sm"
              onClick={() => setFilterStatus("ready_to_ship")}
            >
              <TruckIcon className="mr-1 h-3 w-3" />
              Ready to Ship
            </Button>
            <Button 
              variant={filterStatus === "completed" ? "default" : "outline"} 
              size="sm"
              onClick={() => setFilterStatus("completed")}
            >
              <CheckCircle className="mr-1 h-3 w-3" />
              Completed
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Orders list */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Manufacturing Orders</CardTitle>
          <CardDescription>
            {filteredOrders?.length || 0} orders found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Orders</TabsTrigger>
              <TabsTrigger value="pending">New ({pendingOrders.length})</TabsTrigger>
              <TabsTrigger value="in_production">In Production ({inProductionOrders.length})</TabsTrigger>
              <TabsTrigger value="ready_to_ship">Ready to Ship ({readyToShipOrders.length})</TabsTrigger>
              <TabsTrigger value="completed">Completed ({completedOrders.length})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all">
              {renderOrdersList(filteredOrders, isLoading)}
            </TabsContent>
            <TabsContent value="pending">
              {renderOrdersList(pendingOrders, isLoading)}
            </TabsContent>
            <TabsContent value="in_production">
              {renderOrdersList(inProductionOrders, isLoading)}
            </TabsContent>
            <TabsContent value="ready_to_ship">
              {renderOrdersList(readyToShipOrders, isLoading)}
            </TabsContent>
            <TabsContent value="completed">
              {renderOrdersList(completedOrders, isLoading)}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
  
  function renderOrdersList(ordersList: any[], isLoading: boolean) {
    if (isLoading) {
      return <div className="text-center py-6">Loading orders...</div>;
    }
    
    if (!ordersList || ordersList.length === 0) {
      return (
        <div className="text-center py-6">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <h3 className="font-medium">No orders found</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {searchTerm 
              ? `No orders match your search for "${searchTerm}"`
              : "There are no orders matching the selected filters"}
          </p>
          
          {searchTerm && (
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => setSearchTerm("")}
            >
              Clear Search
            </Button>
          )}
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        {ordersList.map((order) => (
          <div 
            key={order.id} 
            className="border rounded-lg overflow-hidden"
          >
            <div className="p-4">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-medium">Order #{order.id}</h3>
                    <OrderStatusBadge status={order.status} />
                    {order.isPriority && (
                      <Badge variant="outline" className="border-red-200 text-red-700">
                        Priority
                      </Badge>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2 text-sm">
                    <div className="flex items-center">
                      <Package className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-muted-foreground mr-1">Product:</span> 
                      <span>{order.productType}</span>
                    </div>
                    
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-muted-foreground mr-1">Received:</span> 
                      <span>{format(new Date(order.receivedDate), 'MMM d, yyyy')}</span>
                    </div>
                    
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-muted-foreground mr-1">Deadline:</span> 
                      <span>{format(new Date(order.deadline), 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2 text-sm mt-2">
                    <div className="flex items-center">
                      <ShoppingCart className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-muted-foreground mr-1">Items:</span> 
                      <span>{order.itemCount}</span>
                    </div>
                    
                    <div className="flex items-center">
                      <TruckIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-muted-foreground mr-1">Shipping:</span> 
                      <span>{order.shippingMethod}</span>
                    </div>
                    
                    <div className="flex items-center">
                      <Hammer className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-muted-foreground mr-1">Stage:</span> 
                      <span>{order.productionStage || "Not Started"}</span>
                    </div>
                  </div>
                  
                  {order.status === 'in_production' && (
                    <div className="mt-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span>Production Progress</span>
                        <span>{order.progress}%</span>
                      </div>
                      <Progress value={order.progress} className="h-1.5" />
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col gap-2">
                  <Button asChild variant="default">
                    <Link href={`/order-detail/${order.id}`}>
                      <Package className="mr-2 h-4 w-4" />
                      View Details
                    </Link>
                  </Button>
                  
                  {order.status === 'pending' && (
                    <Button asChild variant="outline">
                      <Link href={`/cost-input/${order.id}`}>
                        Input Costs
                      </Link>
                    </Button>
                  )}
                  
                  {order.status === 'in_production' && (
                    <Button asChild variant="outline">
                      <Link href={`/status-update/${order.id}`}>
                        Update Status
                      </Link>
                    </Button>
                  )}
                  
                  {order.status === 'ready_to_ship' && (
                    <Button asChild variant="outline">
                      <Link href={`/shipping/${order.id}`}>
                        Ship Order
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }
}