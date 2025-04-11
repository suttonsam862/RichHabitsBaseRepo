import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "wouter";
import {
  Clock,
  AlertTriangle,
  CheckCircle,
  TruckIcon,
  Package,
  FileBarChart,
  Hammer,
  ChevronRight,
  ShoppingCart,
  BoxIcon,
  Calendar,
  AlertCircle,
  ClipboardList,
  DollarSign,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { useAuth } from "@/hooks/use-auth";

export default function ManufacturerDashboard() {
  const { user } = useAuth();
  
  // Fetch manufacturing dashboard stats
  const { data: dashboardStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['/api/manufacturer/stats'],
    queryFn: async ({ queryKey }) => {
      // This would fetch from API in production
      return {
        data: {
          pendingOrders: 0,
          inProductionOrders: 0,
          readyToShipOrders: 0,
          completedThisMonth: 0,
          averageProductionTime: 0,
          totalItems: 0,
          productionCapacity: {
            current: 0,
            max: 100
          }
        }
      };
    },
  });
  
  // Fetch new/pending manufacturing orders
  const { data: pendingOrders, isLoading: isLoadingPending } = useQuery({
    queryKey: ['/api/manufacturer/orders/pending'],
    queryFn: async ({ queryKey }) => {
      // This would fetch from API in production
      return {
        data: []
      };
    },
  });
  
  // Fetch in-production orders
  const { data: inProductionOrders, isLoading: isLoadingProduction } = useQuery({
    queryKey: ['/api/manufacturer/orders/in-production'],
    queryFn: async ({ queryKey }) => {
      // This would fetch from API in production
      return {
        data: []
      };
    },
  });
  
  // Fetch recent alerts
  const { data: recentAlerts, isLoading: isLoadingAlerts } = useQuery({
    queryKey: ['/api/manufacturer/alerts'],
    queryFn: async ({ queryKey }) => {
      // This would fetch from API in production
      return {
        data: []
      };
    },
  });
  
  const stats = dashboardStats?.data || {
    pendingOrders: 0,
    inProductionOrders: 0,
    readyToShipOrders: 0,
    completedThisMonth: 0,
    averageProductionTime: 0,
    totalItems: 0,
    productionCapacity: {
      current: 0,
      max: 100
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Welcome message and stats summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">Welcome, {user?.fullName || "Manufacturing Partner"}</CardTitle>
          <CardDescription>
            Here's an overview of your production orders and metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
            {/* New orders */}
            <Card>
              <CardContent className="p-4 flex items-center space-x-4">
                <div className="p-2 bg-blue-50 rounded-full">
                  <ShoppingCart className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending Orders</p>
                  <h4 className="text-2xl font-bold">{stats.pendingOrders}</h4>
                </div>
              </CardContent>
            </Card>
            
            {/* In production */}
            <Card>
              <CardContent className="p-4 flex items-center space-x-4">
                <div className="p-2 bg-amber-50 rounded-full">
                  <Hammer className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">In Production</p>
                  <h4 className="text-2xl font-bold">{stats.inProductionOrders}</h4>
                </div>
              </CardContent>
            </Card>
            
            {/* Ready to ship */}
            <Card>
              <CardContent className="p-4 flex items-center space-x-4">
                <div className="p-2 bg-green-50 rounded-full">
                  <TruckIcon className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Ready to Ship</p>
                  <h4 className="text-2xl font-bold">{stats.readyToShipOrders}</h4>
                </div>
              </CardContent>
            </Card>
            
            {/* Completed this month */}
            <Card>
              <CardContent className="p-4 flex items-center space-x-4">
                <div className="p-2 bg-purple-50 rounded-full">
                  <CheckCircle className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Completed this Month</p>
                  <h4 className="text-2xl font-bold">{stats.completedThisMonth}</h4>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
      
      {/* Production capacity and metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Production capacity */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Production Capacity</CardTitle>
            <CardDescription>
              Current production load and capacity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span>{stats.productionCapacity.current}% utilized</span>
                <span className="text-muted-foreground">Max: {stats.productionCapacity.max}%</span>
              </div>
              <Progress 
                value={stats.productionCapacity.current} 
                className="h-2" 
                indicatorClassName={
                  stats.productionCapacity.current > 90 
                    ? "bg-red-500" 
                    : stats.productionCapacity.current > 75 
                    ? "bg-amber-500" 
                    : "bg-green-500"
                }
              />
              
              <div className="pt-4 space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <BoxIcon className="h-4 w-4 text-blue-500 mr-2" />
                    <span className="text-sm">Total Items</span>
                  </div>
                  <span className="text-sm font-medium">{stats.totalItems}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 text-amber-500 mr-2" />
                    <span className="text-sm">Avg. Production Time</span>
                  </div>
                  <span className="text-sm font-medium">{stats.averageProductionTime} days</span>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/metrics">
                <FileBarChart className="mr-2 h-4 w-4" />
                View All Metrics
              </Link>
            </Button>
          </CardFooter>
        </Card>
        
        {/* Orders tabs */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Production Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="pending">
              <TabsList className="mb-4">
                <TabsTrigger value="pending">New Orders</TabsTrigger>
                <TabsTrigger value="production">In Production</TabsTrigger>
              </TabsList>
              
              <TabsContent value="pending">
                {isLoadingPending ? (
                  <div className="text-center py-6">Loading pending orders...</div>
                ) : pendingOrders?.data?.length > 0 ? (
                  <div className="space-y-4">
                    {pendingOrders.data.map((order: any) => (
                      <div 
                        key={order.id} 
                        className="border rounded-lg p-4 hover:border-primary/50 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium">Order #{order.id}</h3>
                              <Badge className="bg-blue-100 text-blue-800">New Order</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Items: {order.itemCount} • {order.productType}
                            </p>
                          </div>
                          <div className="text-sm text-right">
                            <div className="font-medium">Deadline</div>
                            <div className="text-muted-foreground">
                              {format(new Date(order.deadline), 'MMM d, yyyy')}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex justify-end mt-3">
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/manufacturing-orders/${order.id}`}>
                              View Details <ChevronRight className="ml-1 h-3 w-3" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Package className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <h3 className="font-medium">No new orders</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      There are no new orders waiting for production
                    </p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="production">
                {isLoadingProduction ? (
                  <div className="text-center py-6">Loading production orders...</div>
                ) : inProductionOrders?.data?.length > 0 ? (
                  <div className="space-y-4">
                    {inProductionOrders.data.map((order: any) => (
                      <div 
                        key={order.id} 
                        className="border rounded-lg p-4 hover:border-primary/50 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium">Order #{order.id}</h3>
                              <Badge className="bg-amber-100 text-amber-800">In Production</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Items: {order.itemCount} • {order.productType} • Stage: {order.productionStage}
                            </p>
                          </div>
                          <div className="text-sm text-right">
                            <div className="font-medium">Progress</div>
                            <div className="text-muted-foreground">
                              {order.progress}%
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-2">
                          <Progress value={order.progress} className="h-1.5" />
                        </div>
                        
                        <div className="flex justify-end mt-3">
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/status-update/${order.id}`}>
                              Update Status <ChevronRight className="ml-1 h-3 w-3" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Hammer className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <h3 className="font-medium">No orders in production</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      There are no orders currently in the production process
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/manufacturing-orders">
                View All Orders
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      {/* Recent alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Alerts</CardTitle>
          <CardDescription>
            Important updates and notifications about orders
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingAlerts ? (
            <div className="text-center py-6">Loading alerts...</div>
          ) : recentAlerts?.data?.length > 0 ? (
            <div className="space-y-4">
              {recentAlerts.data.map((alert: any) => (
                <div 
                  key={alert.id} 
                  className={`border rounded-lg p-4 ${
                    alert.severity === 'high' 
                      ? 'border-red-200 bg-red-50' 
                      : alert.severity === 'medium'
                      ? 'border-amber-200 bg-amber-50'
                      : 'border-blue-200 bg-blue-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {alert.severity === 'high' ? (
                      <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                    ) : alert.severity === 'medium' ? (
                      <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                    )}
                    
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium">{alert.title}</h3>
                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm mt-1">{alert.message}</p>
                      
                      {alert.orderId && (
                        <div className="mt-2">
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/manufacturing-orders/${alert.orderId}`}>
                              View Order #{alert.orderId}
                            </Link>
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-3" />
              <h3 className="font-medium">No active alerts</h3>
              <p className="text-sm text-muted-foreground mt-1">
                You have no urgent alerts or notifications at this time
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Quick access shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-primary/10 rounded-full mr-3">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-medium">Input Costs</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Update production costs for orders to maintain accurate tracking
            </p>
            <Button asChild variant="default" size="sm">
              <Link href="/cost-input">
                Enter Production Costs
              </Link>
            </Button>
          </CardContent>
        </Card>
        
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-blue-100 rounded-full mr-3">
                <ClipboardList className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="font-medium">View All Orders</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Access the complete list of orders assigned to your manufacturing facility
            </p>
            <Button asChild variant="outline" size="sm">
              <Link href="/manufacturing-orders">
                Manufacturing Orders
              </Link>
            </Button>
          </CardContent>
        </Card>
        
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-green-100 rounded-full mr-3">
                <TruckIcon className="h-5 w-5 text-green-600" />
              </div>
              <h3 className="font-medium">Ship Completed Orders</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Enter tracking info and finalize shipping for completed production
            </p>
            <Button asChild variant="outline" size="sm" className="border-green-200 bg-white">
              <Link href="/shipping">
                Completion & Shipping
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}