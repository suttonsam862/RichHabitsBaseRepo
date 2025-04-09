import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { hasPermission } from "@shared/permissions";
import { PERMISSIONS } from "@shared/schema";

// UI Components
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Icons
import { 
  Search, 
  PlusCircle, 
  Download, 
  Edit, 
  Trash2, 
  AlertTriangle, 
  ShoppingBag, 
  UserPlus,
  Factory,
  Palette,
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Calendar,
  Truck,
  Package,
  Filter,
  ArrowUpDown, 
  Save,
  ArrowLeft,
  FileEdit,
  CheckSquare,
  Banknote
} from "lucide-react";

// Order schema for form validation
const orderSchema = z.object({
  orderId: z.string(),
  customerName: z.string().min(2, "Customer name is required"),
  customerEmail: z.string().email().optional().nullable(),
  totalAmount: z.string().optional(),
  status: z.enum(["pending", "processing", "paid", "shipped", "delivered", "cancelled", "refunded"]),
  shippingAddress: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  assignedDesignerId: z.string().optional().nullable(),
  assignedSalesRepId: z.string().optional().nullable(),
  assignedManufacturerId: z.string().optional().nullable(),
  organizationId: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  priorityLevel: z.enum(["low", "medium", "high", "urgent"]).optional(),
  customFields: z.record(z.string()).optional(),
});

type OrderStatus = "pending" | "processing" | "paid" | "shipped" | "delivered" | "cancelled" | "refunded";

type OrderFormValues = z.infer<typeof orderSchema>;

export default function OrderManagement() {
  const [selectedTab, setSelectedTab] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [openEditDialog, setOpenEditDialog] = useState<boolean>(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState<boolean>(false);
  const [isAdvancedFiltering, setIsAdvancedFiltering] = useState<boolean>(false);
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // Query for orders
  const { data: ordersData, isLoading: isLoadingOrders } = useQuery({
    queryKey: ['/api/orders'],
    refetchInterval: false,
    refetchOnWindowFocus: false,
  });
  
  // Queries for related entities
  const { data: salesTeamData, isLoading: isLoadingSalesTeam } = useQuery({
    queryKey: ['/api/admin/sales-team'],
    select: (data: any) => data?.data || [],
  });
  
  const { data: designTeamData, isLoading: isLoadingDesignTeam } = useQuery({
    queryKey: ['/api/admin/design-team'],
    select: (data: any) => data?.data || [],
  });
  
  const { data: manufacturersData, isLoading: isLoadingManufacturers } = useQuery({
    queryKey: ['/api/admin/manufacturing-team'],
    select: (data: any) => data?.data || [],
  });
  
  const { data: organizationsData, isLoading: isLoadingOrganizations } = useQuery({
    queryKey: ['/api/organizations'],
    select: (data: any) => data?.data || [],
  });
  
  const { data: designProjectsData, isLoading: isLoadingDesignProjects } = useQuery({
    queryKey: ['/api/design-projects'],
    select: (data: any) => data?.data || [],
  });
  
  // Query for products
  const { data: productsData, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['/api/products'],
    select: (data: any) => data?.data || [],
  });
  
  // Default form
  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      orderId: "",
      customerName: "",
      customerEmail: "",
      totalAmount: "",
      status: "pending",
      shippingAddress: "",
      notes: "",
      assignedDesignerId: "",
      assignedSalesRepId: "",
      assignedManufacturerId: "",
      organizationId: "",
      dueDate: "",
      priorityLevel: "medium",
      customFields: {},
    },
  });
  
  // Set form values when an order is selected for editing
  useEffect(() => {
    if (selectedOrder) {
      form.reset({
        orderId: selectedOrder.orderId,
        customerName: selectedOrder.customerName,
        customerEmail: selectedOrder.customerEmail || "",
        totalAmount: selectedOrder.totalAmount?.toString() || "",
        status: selectedOrder.status as OrderStatus,
        shippingAddress: selectedOrder.shippingAddress || "",
        notes: selectedOrder.notes || "",
        assignedDesignerId: selectedOrder.assignedDesignerId?.toString() || "",
        assignedSalesRepId: selectedOrder.assignedSalesRepId?.toString() || "",
        assignedManufacturerId: selectedOrder.assignedManufacturerId?.toString() || "",
        organizationId: selectedOrder.organizationId?.toString() || "",
        dueDate: selectedOrder.dueDate || "",
        priorityLevel: selectedOrder.priorityLevel || "medium",
        customFields: selectedOrder.customFields || {},
      });
    }
  }, [selectedOrder, form]);
  
  // Mutations
  const updateOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      return await apiRequest("PATCH", `/api/orders/${orderData.id}`, orderData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      toast({
        title: "Order updated",
        description: "Order has been updated successfully",
      });
      setOpenEditDialog(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update order",
        variant: "destructive",
      });
    },
  });
  
  const deleteOrderMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/orders/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      toast({
        title: "Order deleted",
        description: "Order has been deleted successfully",
      });
      setOpenDeleteDialog(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete order",
        variant: "destructive",
      });
    },
  });
  
  // Filter and sort orders based on selected filters and search term
  const filteredOrders = useMemo(() => {
    if (!ordersData?.data) return [];
    
    let filtered = [...ordersData.data];
    
    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }
    
    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (order) =>
          order.orderId?.toLowerCase().includes(searchLower) ||
          order.customerName?.toLowerCase().includes(searchLower) ||
          order.customerEmail?.toLowerCase().includes(searchLower)
      );
    }
    
    // Filter by tab
    if (selectedTab === "design-pending") {
      filtered = filtered.filter((order) => {
        const hasDesignProject = designProjectsData?.some(
          (project: any) => project.orderId === order.orderId
        );
        return !hasDesignProject;
      });
    } else if (selectedTab === "design-assigned") {
      filtered = filtered.filter((order) => {
        const hasDesignProject = designProjectsData?.some(
          (project: any) => 
            project.orderId === order.orderId && 
            project.designerId !== null
        );
        return hasDesignProject;
      });
    } else if (selectedTab === "manufacturing-pending") {
      filtered = filtered.filter((order) => 
        order.status === "processing" && !order.assignedManufacturerId
      );
    } else if (selectedTab === "manufacturing-assigned") {
      filtered = filtered.filter((order) => 
        order.assignedManufacturerId !== null
      );
    }
    
    // Sort by date (newest first)
    filtered.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    
    return filtered;
  }, [ordersData, searchTerm, statusFilter, selectedTab, designProjectsData]);
  
  // Helper function to get status color
  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "paid":
        return "bg-green-100 text-green-800";
      case "shipped":
        return "bg-purple-100 text-purple-800";
      case "delivered":
        return "bg-indigo-100 text-indigo-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "refunded":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  
  // Handle form submission
  const onSubmit = (values: OrderFormValues) => {
    const orderData = {
      ...values,
      id: selectedOrder.id,
    };
    
    updateOrderMutation.mutate(orderData);
  };
  
  return (
    <>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 py-4 px-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Order Management</h1>
          
          <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-3">
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => setIsAdvancedFiltering(!isAdvancedFiltering)}>
              <Filter className="mr-2 h-4 w-4" />
              {isAdvancedFiltering ? "Simple Filters" : "Advanced Filters"}
            </Button>
            
            <Button variant="outline" className="w-full sm:w-auto">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="container py-6 space-y-6">
        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Order Filters</CardTitle>
            <CardDescription>
              Filter orders by status, search terms, or use advanced filters
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Search orders..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as OrderStatus | "all")}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
              
              {isAdvancedFiltering && (
                <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by Sales Rep" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sales Reps</SelectItem>
                      {salesTeamData?.map((rep: any) => (
                        <SelectItem key={rep.id} value={rep.id.toString()}>
                          {rep.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by Designer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Designers</SelectItem>
                      {designTeamData?.map((designer: any) => (
                        <SelectItem key={designer.id} value={designer.id.toString()}>
                          {designer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by Manufacturer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Manufacturers</SelectItem>
                      {manufacturersData?.map((manufacturer: any) => (
                        <SelectItem key={manufacturer.id} value={manufacturer.id.toString()}>
                          {manufacturer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Tabs and Table */}
        <Card>
          <CardHeader className="pb-3">
            <Tabs defaultValue="all" value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList>
                <TabsTrigger value="all">All Orders</TabsTrigger>
                <TabsTrigger value="design-pending">Design Pending</TabsTrigger>
                <TabsTrigger value="design-assigned">Design Assigned</TabsTrigger>
                <TabsTrigger value="manufacturing-pending">Manufacturing Pending</TabsTrigger>
                <TabsTrigger value="manufacturing-assigned">Manufacturing Assigned</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Status</TableHead>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingOrders ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        Loading orders...
                      </TableCell>
                    </TableRow>
                  ) : filteredOrders.length > 0 ? (
                    filteredOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>
                          <Badge className={`${getStatusColor(order.status)}`}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{order.orderId}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{order.customerName}</div>
                            {order.customerEmail && (
                              <div className="text-xs text-gray-500">{order.customerEmail}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>${order.totalAmount || "0.00"}</TableCell>
                        <TableCell>
                          {new Date(order.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {order.assignedSalesRepId && (
                              <div className="text-xs flex items-center">
                                <UserPlus className="h-3 w-3 mr-1 text-blue-500" />
                                <span>
                                  {salesTeamData?.find((rep: any) => rep.id === order.assignedSalesRepId)?.name || "Sales Rep"}
                                </span>
                              </div>
                            )}
                            {order.assignedDesignerId && (
                              <div className="text-xs flex items-center">
                                <Palette className="h-3 w-3 mr-1 text-purple-500" />
                                <span>
                                  {designTeamData?.find((designer: any) => designer.id === order.assignedDesignerId)?.name || "Designer"}
                                </span>
                              </div>
                            )}
                            {order.assignedManufacturerId && (
                              <div className="text-xs flex items-center">
                                <Factory className="h-3 w-3 mr-1 text-orange-500" />
                                <span>
                                  {manufacturersData?.find((mfg: any) => mfg.id === order.assignedManufacturerId)?.name || "Manufacturer"}
                                </span>
                              </div>
                            )}
                            {!order.assignedSalesRepId && !order.assignedDesignerId && !order.assignedManufacturerId && (
                              <span className="text-xs text-gray-500">Unassigned</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            className="mr-2"
                            onClick={() => {
                              setSelectedOrder(order);
                              setSelectedOrderId(order.id);
                              setOpenEditDialog(true);
                            }}
                          >
                            <FileEdit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          
                          {hasPermission(user?.role || 'viewer', user?.permissions, PERMISSIONS.DELETE_ORDERS) && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => {
                                setSelectedOrder(order);
                                setSelectedOrderId(order.id);
                                setOpenDeleteDialog(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center text-gray-500">
                        No orders found matching your criteria.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Edit Order Dialog */}
      <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Order</DialogTitle>
            <DialogDescription>
              Update order details, assignments, and tracking information
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Tabs defaultValue="details">
                  <TabsList className="mb-4">
                    <TabsTrigger value="details">Order Details</TabsTrigger>
                    <TabsTrigger value="assignments">Assignments</TabsTrigger>
                    <TabsTrigger value="products">Products</TabsTrigger>
                    <TabsTrigger value="tracking">Tracking</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="details" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="orderId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Order ID</FormLabel>
                            <FormControl>
                              <Input {...field} readOnly />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value || "pending"}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="processing">Processing</SelectItem>
                                <SelectItem value="paid">Paid</SelectItem>
                                <SelectItem value="shipped">Shipped</SelectItem>
                                <SelectItem value="delivered">Delivered</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                                <SelectItem value="refunded">Refunded</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="customerName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Customer Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="customerEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Customer Email</FormLabel>
                            <FormControl>
                              <Input {...field} type="email" value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="totalAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Total Amount</FormLabel>
                            <FormControl>
                              <Input {...field} type="text" value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="priorityLevel"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Priority</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value || "medium"}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select priority" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="urgent">Urgent</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="organizationId"
                        render={({ field }) => (
                          <FormItem className="col-span-2">
                            <FormLabel>Organization</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value || "none"}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select organization" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="none">No Organization</SelectItem>
                                {organizationsData?.map((org: any) => (
                                  <SelectItem key={org.id} value={org.id.toString()}>
                                    {org.name} ({org.type})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="shippingAddress"
                        render={({ field }) => (
                          <FormItem className="col-span-2">
                            <FormLabel>Shipping Address</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Enter shipping address"
                                className="resize-none"
                                {...field}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem className="col-span-2">
                            <FormLabel>Notes</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Add notes about this order"
                                className="resize-none"
                                {...field}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="assignments" className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <FormField
                        control={form.control}
                        name="assignedSalesRepId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Assigned Sales Representative</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value || "unassigned"}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select sales rep" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="unassigned">Unassigned</SelectItem>
                                {salesTeamData?.map((rep: any) => (
                                  <SelectItem key={rep.id} value={rep.id.toString()}>
                                    {rep.name} - {rep.role}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Select the sales rep responsible for this order
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="assignedDesignerId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Assigned Designer</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value || "unassigned"}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select designer" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="unassigned">Unassigned</SelectItem>
                                {designTeamData?.map((designer: any) => (
                                  <SelectItem key={designer.id} value={designer.id.toString()}>
                                    {designer.name} - {designer.specialization || "Designer"}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Assign a designer to handle artwork and mockups
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="assignedManufacturerId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Assigned Manufacturer</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value || "unassigned"}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select manufacturer" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="unassigned">Unassigned</SelectItem>
                                {manufacturersData?.map((manufacturer: any) => (
                                  <SelectItem key={manufacturer.id} value={manufacturer.id.toString()}>
                                    {manufacturer.name} - {manufacturer.specialization || "Manufacturer"}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Assign a manufacturer for production
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="products" className="space-y-4">
                    {selectedOrder.items ? (
                      <div className="space-y-4">
                        <div className="border rounded-md">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Product</TableHead>
                                <TableHead>Sizes</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead>Quantity</TableHead>
                                <TableHead>Total</TableHead>
                                <TableHead className="w-16">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {JSON.parse(selectedOrder.items).map((item: any, index: number) => {
                                const totalQuantity = Object.values(item.sizes || {}).reduce(
                                  (sum: number, qty: any) => sum + (parseInt(qty) || 0), 0
                                );
                                const totalPrice = (parseFloat(item.price) || 0) * totalQuantity;
                                
                                return (
                                  <TableRow key={index}>
                                    <TableCell>
                                      <div className="font-medium">{item.name}</div>
                                      <div className="text-xs text-gray-500">{item.sku}</div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex flex-wrap gap-1">
                                        {Object.entries(item.sizes || {}).map(([size, qty]) => 
                                          parseInt(qty as string) > 0 ? (
                                            <Badge key={size} variant="outline" className="text-xs">
                                              {size}: {qty}
                                            </Badge>
                                          ) : null
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell>${item.price}</TableCell>
                                    <TableCell>{totalQuantity}</TableCell>
                                    <TableCell>${totalPrice.toFixed(2)}</TableCell>
                                    <TableCell>
                                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                        
                        <Button type="button" variant="outline" className="mt-4">
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Add Product
                        </Button>
                      </div>
                    ) : (
                      <div className="border border-dashed rounded-md p-6 text-center">
                        <ShoppingBag className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <h3 className="text-lg font-medium">No Products</h3>
                        <p className="text-sm text-gray-500 mb-4">This order doesn't have any products yet.</p>
                        <Button type="button" variant="outline">
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Add Product
                        </Button>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="tracking" className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <FormField
                        control={form.control}
                        name="dueDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Due Date</FormLabel>
                            <FormControl>
                              <Input 
                                type="date" 
                                {...field} 
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="border rounded-md p-4">
                        <h3 className="text-lg font-medium mb-2">Order Timeline</h3>
                        <div className="space-y-4">
                          <div className="flex items-start">
                            <div className="flex-shrink-0 h-4 w-4 rounded-full bg-blue-500 mt-1"></div>
                            <div className="ml-3">
                              <p className="text-sm font-medium">Order Created</p>
                              <p className="text-xs text-gray-500">
                                {new Date(selectedOrder.createdAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          {selectedOrder.updatedAt && (
                            <div className="flex items-start">
                              <div className="flex-shrink-0 h-4 w-4 rounded-full bg-green-500 mt-1"></div>
                              <div className="ml-3">
                                <p className="text-sm font-medium">Last Updated</p>
                                <p className="text-xs text-gray-500">
                                  {new Date(selectedOrder.updatedAt).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="border rounded-md p-4">
                        <h3 className="text-lg font-medium mb-2">Quick Actions</h3>
                        <div className="grid grid-cols-2 gap-2">
                          <Button type="button" variant="outline" className="justify-start">
                            <Palette className="mr-2 h-4 w-4" /> Send to Design
                          </Button>
                          <Button type="button" variant="outline" className="justify-start">
                            <Factory className="mr-2 h-4 w-4" /> Send to Manufacturing
                          </Button>
                          <Button type="button" variant="outline" className="justify-start">
                            <Truck className="mr-2 h-4 w-4" /> Mark as Shipped
                          </Button>
                          <Button type="button" variant="outline" className="justify-start">
                            <CheckCircle2 className="mr-2 h-4 w-4" /> Mark as Delivered
                          </Button>
                          <Button type="button" variant="outline" className="justify-start">
                            <Banknote className="mr-2 h-4 w-4" /> Mark as Paid
                          </Button>
                          <Button type="button" variant="outline" className="justify-start text-red-500 hover:text-red-700 hover:bg-red-50">
                            <XCircle className="mr-2 h-4 w-4" /> Mark as Cancelled
                          </Button>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpenEditDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateOrderMutation.isPending}>
                    {updateOrderMutation.isPending ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Order</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this order? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="border rounded-md p-4 bg-red-50 text-red-800">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Warning</AlertTitle>
              <AlertDescription>
                Deleting this order will permanently remove all associated data, including products, design projects, and manufacturing details.
              </AlertDescription>
            </Alert>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDeleteDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => {
                if (selectedOrderId) {
                  deleteOrderMutation.mutate(selectedOrderId);
                }
              }}
              disabled={deleteOrderMutation.isPending}
            >
              {deleteOrderMutation.isPending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Order
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}