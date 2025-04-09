import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, Search, Filter, Download, Trash2, AlertTriangle, Loader2, Plus, Minus, ShoppingBag } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { insertOrderSchema } from "@shared/schema";
import { Order, OrderStatus, Product } from "@/types";
import { generateOrderId } from "@/lib/utils";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/use-auth";

const formSchema = insertOrderSchema.extend({
  // Override totalAmount to make it optional in the form
  totalAmount: z.string().optional().transform(val => val || "0.00"),
  status: z.enum(["pending", "processing", "paid", "shipped", "delivered", "cancelled", "refunded"]).default("pending"),
  organizationId: z.string().optional(),
  productIds: z.array(z.string()).optional(),
  itemName: z.string().optional(),
});

interface Organization {
  id: number;
  name: string;
  type: string;
  industry: string;
  status: string;
}

export default function Orders() {
  const [searchTerm, setSearchTerm] = useState("");
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Query for orders
  const { data, isLoading } = useQuery({
    queryKey: ['/api/orders'],
    refetchInterval: false,
    refetchOnWindowFocus: false,
  });
  
  // Query for organizations - filtered by current user's assignments if they're a sales agent
  const { data: organizationsData, isLoading: isLoadingOrganizations } = useQuery({
    queryKey: ['/api/organizations'],
    select: (data: any) => {
      // If user has admin role, show all organizations
      // Otherwise, filter to only show organizations assigned to this sales rep
      if (user?.role === 'admin') {
        return data?.data || [];
      } else {
        // In a real system, this would be filtered by the server based on user access
        // This is a simplified client-side filter for demonstration
        return (data?.data || []).filter((org: Organization) => org.status === 'active');
      }
    },
  });
  
  // Query for products
  const { data: productsData, isLoading: isLoadingProducts } = useQuery<Product[]>({
    queryKey: ['/api/products'],
    select: (data: any) => data?.data || [],
  });
  
  // Filter products based on search term
  const filteredProducts = useMemo(() => {
    if (!productsData) return [];
    
    if (!productSearchTerm) return productsData;
    
    const searchLower = productSearchTerm.toLowerCase();
    return productsData.filter((product: any) => 
      product.name?.toLowerCase().includes(searchLower) || 
      product.sport?.toLowerCase().includes(searchLower) || 
      product.sku?.toLowerCase().includes(searchLower) || 
      product.description?.toLowerCase().includes(searchLower)
    );
  }, [productsData, productSearchTerm]);

  // Sample data - would normally come from the API
  const sampleOrders: Order[] = [
    {
      id: 1,
      userId: 1,
      orderId: "#67890",
      customerName: "John Smith",
      amount: "$2,500.00",
      status: "paid",
      notes: "Premium package",
      createdAt: new Date().toISOString(),
    },
    {
      id: 2,
      userId: 1,
      orderId: "#67889",
      customerName: "Emma Davis",
      amount: "$1,200.00",
      status: "processing",
      notes: "Basic package with add-ons",
      createdAt: new Date().toISOString(),
    },
    {
      id: 3,
      userId: 1,
      orderId: "#67888",
      customerName: "Michael Brown",
      amount: "$3,750.00",
      status: "refunded",
      notes: "Enterprise solution - customer requested refund",
      createdAt: new Date().toISOString(),
    },
    {
      id: 4,
      userId: 1,
      orderId: "#67887",
      customerName: "Sarah Johnson",
      amount: "$950.00",
      status: "shipped",
      notes: "Standard package",
      createdAt: new Date().toISOString(),
    },
    {
      id: 5,
      userId: 1,
      orderId: "#67886",
      customerName: "David Lee",
      amount: "$1,850.00",
      status: "delivered",
      notes: "Premium package with coaching sessions",
      createdAt: new Date().toISOString(),
    },
  ];

  const orders = data?.data || sampleOrders;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      orderId: generateOrderId(),
      customerName: "",
      customerEmail: "",
      totalAmount: "",
      status: "pending",
      notes: "",
      items: "",
      shippingAddress: "",
      organizationId: undefined,
      productIds: [],
      itemName: "",
    },
  });

  const addOrderMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      return await apiRequest("POST", "/api/orders", values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      toast({
        title: "Order added",
        description: "New order has been added successfully",
      });
      setOpenAddDialog(false);
      setSelectedProducts([]);
      form.reset({
        orderId: generateOrderId(),
        customerName: "",
        customerEmail: "",
        totalAmount: "",
        status: "pending",
        notes: "",
        items: "",
        shippingAddress: "",
        organizationId: undefined,
        productIds: [],
        itemName: "",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add order",
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
      queryClient.invalidateQueries({ queryKey: ['/api/activities/recent'] });
      // Force refetch to ensure we have the latest data
      queryClient.refetchQueries({ queryKey: ['/api/orders'] });
      toast({
        title: "Order deleted",
        description: "Order has been deleted successfully",
      });
      setOpenDeleteDialog(false);
      setSelectedOrderId(null);
      setSelectedOrder(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete order",
        variant: "destructive",
      });
    },
  });

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = order.orderId.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         order.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "processing":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "paid":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "shipped":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      case "delivered":
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "refunded":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  function onSubmit(values: z.infer<typeof formSchema>) {
    // Set default values for required fields that were removed from the form
    const orderData = {
      ...values,
      totalAmount: values.totalAmount || "0.00",  // Default to 0.00 if not provided
      status: values.status || "pending"          // Default to pending if not provided
    };
    addOrderMutation.mutate(orderData);
  }

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.text("Rich Habits - Orders Report", 14, 22);
    
    // Add date
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
    
    // Add orders table
    const tableColumn = ["Order ID", "Customer Name", "Amount", "Status", "Notes"];
    const tableRows = filteredOrders.map(order => [
      order.orderId,
      order.customerName,
      order.totalAmount,
      order.status.charAt(0).toUpperCase() + order.status.slice(1),
      order.notes || ""
    ]);
    
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      theme: 'striped',
      headStyles: {
        fillColor: [14, 165, 233], // Brand color
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [240, 249, 255], // Light blue
      },
    });
    
    // Save PDF
    doc.save("rich-habits-orders.pdf");
    
    toast({
      title: "PDF Generated",
      description: "Orders report has been downloaded",
    });
  };

  return (
    <>
      {/* View Order Dialog */}
      <Dialog open={openViewDialog} onOpenChange={setOpenViewDialog}>
        <DialogContent className="sm:max-w-3xl bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Order Details</DialogTitle>
            <DialogDescription>
              View complete information about this order.
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Order ID</h3>
                  <p className="mt-1 text-sm text-gray-900">{selectedOrder.orderId}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Date Created</h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(selectedOrder.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Customer Name</h3>
                  <p className="mt-1 text-sm text-gray-900">{selectedOrder.customerName}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Customer Email</h3>
                  <p className="mt-1 text-sm text-gray-900">{selectedOrder.customerEmail || "—"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Amount</h3>
                  <p className="mt-1 text-sm text-gray-900">${selectedOrder.totalAmount}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Status</h3>
                  <div className="mt-1">
                    <Badge className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedOrder.status as OrderStatus)}`}>
                      {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Shipping Address</h3>
                <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                  {selectedOrder.shippingAddress || "No shipping address provided"}
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Notes</h3>
                <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                  {selectedOrder.notes || "No notes provided"}
                </p>
              </div>
              
              {/* Line Items Section */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Line Items</h3>
                <div className="bg-gray-50 rounded-md overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedOrder.items ? (
                        JSON.parse(selectedOrder.items).map((item: any, index: number) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.quantity}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.price}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${(item.quantity * item.price).toFixed(2)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-6 py-4 text-sm text-center text-gray-500">
                            {selectedOrder.itemName || "No items available"}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-gray-200">
                <Button 
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                  onClick={() => {
                    // Would typically send to design system
                    toast({
                      title: "Order sent to design",
                      description: `Order ${selectedOrder.orderId} has been submitted to the design team.`,
                    });
                    setOpenViewDialog(false);
                  }}
                >
                  Submit to Design
                </Button>
                <Button 
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  onClick={() => {
                    // Would typically send to manufacturing
                    toast({
                      title: "Order sent to manufacturing",
                      description: `Order ${selectedOrder.orderId} has been submitted to manufacturing.`,
                    });
                    setOpenViewDialog(false);
                  }}
                >
                  Submit to Manufacturing
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setOpenViewDialog(false)}
                  className="ml-auto"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <AlertDialogContent className="bg-white max-h-[90vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900">Delete Order</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              Are you sure you want to delete this order? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-gray-500">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-500 hover:bg-red-600 text-white"
              onClick={() => {
                if (selectedOrderId) {
                  deleteOrderMutation.mutate(selectedOrderId);
                }
              }}
            >
              {deleteOrderMutation.isPending ? (
                <>
                  <span className="animate-spin mr-2">
                    <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </span>
                  Deleting...
                </>
              ) : (
                <>
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Delete
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-800 py-4 px-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">Orders</h1>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportToPDF}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            
            <Dialog open={openAddDialog} onOpenChange={setOpenAddDialog}>
              <DialogTrigger asChild>
                <Button className="bg-brand-600 hover:bg-brand-700">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Order
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Order</DialogTitle>
                  <DialogDescription>
                    Fill in the details below to add a new order to your system.
                  </DialogDescription>
                </DialogHeader>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                    
                    {/* New Organization Field */}
                    <FormField
                      control={form.control}
                      name="organizationId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Select Organization</FormLabel>
                          <FormControl>
                            <Select 
                              onValueChange={field.onChange} 
                              value={field.value}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select an organization" />
                              </SelectTrigger>
                              <SelectContent>
                                {isLoadingOrganizations ? (
                                  <div className="flex items-center justify-center py-2">
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    <span>Loading organizations...</span>
                                  </div>
                                ) : organizationsData?.length > 0 ? (
                                  organizationsData.map((org: Organization) => (
                                    <SelectItem 
                                      key={org.id} 
                                      value={org.id.toString()}
                                    >
                                      {org.name} ({org.type})
                                    </SelectItem>
                                  ))
                                ) : (
                                  <SelectItem value="no-org" disabled>
                                    No organizations available
                                  </SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                          </FormControl>
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
                            <Input placeholder="John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Item Name Field */}
                    <FormField
                      control={form.control}
                      name="itemName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Item Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Custom Jersey Set" {...field} />
                          </FormControl>
                          <p className="text-xs text-gray-500 mt-1">This is the custom name for the order, distinct from the product selection below.</p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Product Selection Field */}
                    <FormField
                      control={form.control}
                      name="productIds"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Select Products</FormLabel>
                          <div className="space-y-2">
                            <div className="space-y-4">
                              <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                                <Input
                                  placeholder="Search products..."
                                  className="pl-8 w-full"
                                  value={productSearchTerm}
                                  onChange={(e) => setProductSearchTerm(e.target.value)}
                                />
                              </div>
                              
                              {isLoadingProducts ? (
                                <div className="flex items-center justify-center h-40 border rounded-md">
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                  <span>Loading products...</span>
                                </div>
                              ) : filteredProducts?.length > 0 ? (
                                <div className="space-y-2 max-h-60 overflow-y-auto p-2 border rounded-md">
                                  {filteredProducts.map((product: any) => (
                                    <div 
                                      key={product.id} 
                                      className="flex items-center justify-between p-2 border rounded-md hover:bg-gray-50"
                                    >
                                      <div className="flex-1">
                                        <div className="font-medium">
                                          {product.sport} - {product.name}, {product.sku}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                          Wholesale Price: ${product.wholesalePrice}
                                        </div>
                                        {selectedProducts.includes(product.id.toString()) && (
                                          <div className="text-xs text-gray-500 mt-1">
                                            <span className="font-medium">Sizes:</span> XS, S, M, L, XL, XXL (view only)
                                          </div>
                                        )}
                                      </div>
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant={selectedProducts.includes(product.id.toString()) ? "destructive" : "outline"}
                                        className="ml-2"
                                        onClick={() => {
                                          const value = product.id.toString();
                                          if (selectedProducts.includes(value)) {
                                            // Remove the product
                                            const filtered = selectedProducts.filter(id => id !== value);
                                            setSelectedProducts(filtered);
                                            field.onChange(filtered);
                                          } else {
                                            // Add the product
                                            setSelectedProducts([...selectedProducts, value]);
                                            field.onChange([...selectedProducts, value]);
                                          }
                                        }}
                                      >
                                        {selectedProducts.includes(product.id.toString()) ? (
                                          <>
                                            <Minus className="h-4 w-4 mr-1" />
                                            Remove
                                          </>
                                        ) : (
                                          <>
                                            <Plus className="h-4 w-4 mr-1" />
                                            Add
                                          </>
                                        )}
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="flex items-center justify-center h-40 border rounded-md">
                                  <div className="text-center">
                                    <ShoppingBag className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                                    <div className="text-sm text-gray-500">
                                      {productSearchTerm ? "No products match your search" : "No products available"}
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              {selectedProducts.length > 0 && (
                                <div className="border rounded-md p-3 bg-gray-50">
                                  <h4 className="font-medium text-sm mb-2">Selected Products ({selectedProducts.length})</h4>
                                  <div className="text-sm text-gray-600">
                                    {selectedProducts.map((id, index) => {
                                      const product = productsData?.find((p: any) => p.id.toString() === id);
                                      return product ? (
                                        <div key={id} className="mb-1">
                                          {product.sport} - {product.name}, {product.sku}
                                          {index < selectedProducts.length - 1 ? '' : ''}
                                        </div>
                                      ) : null;
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Amount and status fields removed from create dialog */}
                    
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Add any additional notes here..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setOpenAddDialog(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={addOrderMutation.isPending}>
                        {addOrderMutation.isPending ? "Adding..." : "Add Order"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
                <Input
                  placeholder="Search orders..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                <Select
                  value={statusFilter}
                  onValueChange={(value) => setStatusFilter(value as OrderStatus | "all")}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="bg-white">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-center p-4 text-xs font-medium text-gray-500 uppercase tracking-wider w-12"></th>
                    <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                    <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="text-right p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredOrders.length > 0 ? (
                    filteredOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="p-4 text-center">
                          <ShoppingBag className="h-5 w-5 mx-auto text-gray-500" />
                        </td>
                        <td className="p-4 text-sm font-medium text-gray-900">{order.orderId}</td>
                        <td className="p-4 text-sm text-gray-600">{order.customerName}</td>
                        <td className="p-4 text-sm text-gray-600">{order.totalAmount}</td>
                        <td className="p-4">
                          <Badge className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status as OrderStatus)}`}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </Badge>
                        </td>
                        <td className="p-4 text-sm text-gray-600">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-4 text-right">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mr-2"
                            onClick={() => {
                              setSelectedOrder(order);
                              setOpenViewDialog(true);
                            }}
                          >
                            View
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="mr-2"
                            onClick={() => {
                              setSelectedOrder(order);
                              setSelectedOrderId(order.id);
                              form.reset({
                                customerName: order.customerName,
                                customerEmail: order.customerEmail,
                                totalAmount: order.totalAmount,
                                status: order.status as any,
                                items: order.items,
                                shippingAddress: order.shippingAddress || "",
                                notes: order.notes || "",
                                itemName: order.itemName || ""
                              });
                              setOpenEditDialog(true);
                            }}
                          >
                            Edit
                          </Button>
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
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-4 text-center text-gray-500">
                        No orders found matching your criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
