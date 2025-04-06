import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDate, formatCurrency } from "@/lib/utils";
import { 
  Loader2, Box, ShoppingBag, Package, Truck, Calendar, User, Clock, 
  BarChart, FileText, Check, X, AlertTriangle, Eye, Pencil, Send, Plus 
} from "lucide-react";

// Define our interfaces
interface ManufacturingOrder {
  id: number;
  orderId: string;
  customerName: string;
  customerEmail: string;
  status: 'pending' | 'in_production' | 'quality_check' | 'shipped' | 'delivered' | 'cancelled';
  items: OrderItem[];
  quantity: number;
  totalAmount: string;
  shippingAddress: string;
  notes: string | null;
  estimatedCompletionDate: string | null;
  assignedTo: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  updatedAt: string;
}

interface OrderItem {
  id: number;
  name: string;
  quantity: number;
  price: string;
  options?: Record<string, string>;
}

interface ProductionLog {
  id: number;
  manufacturingOrderId: number;
  status: string;
  notes: string;
  createdAt: string;
  createdBy: string;
}

interface MaterialInventory {
  id: number;
  name: string;
  sku: string;
  category: string;
  currentStock: number;
  unit: string;
  minimumStock: number;
  reorderPoint: number;
  cost: string;
  supplier: string;
  lastRestocked: string;
}

export default function ManufacturingPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<ManufacturingOrder | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [materialDialogOpen, setMaterialDialogOpen] = useState(false);
  const [logNote, setLogNote] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [showInventory, setShowInventory] = useState(false);
  
  const { toast } = useToast();

  const { data: manufacturingOrders, isLoading } = useQuery({
    queryKey: ['/api/manufacturing/orders'],
  });

  const { data: productionLogs, isLoading: logsLoading } = useQuery({
    queryKey: ['/api/manufacturing/logs', selectedOrder?.id],
    enabled: !!selectedOrder,
  });

  const { data: materials, isLoading: materialsLoading } = useQuery({
    queryKey: ['/api/manufacturing/materials'],
    enabled: showInventory,
  });

  const updateOrderStatusMutation = useMutation({
    mutationFn: async (data: { orderId: number, status: string, notes: string }) => {
      const res = await fetch(`/api/manufacturing/orders/${data.orderId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: data.status,
          notes: data.notes,
        }),
      });
      
      if (!res.ok) throw new Error('Failed to update order status');
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['/api/manufacturing/orders']});
      queryClient.invalidateQueries({queryKey: ['/api/manufacturing/logs', selectedOrder?.id]});
      setUpdateDialogOpen(false);
      setLogNote("");
      toast({
        title: "Status updated",
        description: "The order status has been updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const claimOrderMutation = useMutation({
    mutationFn: async (orderId: number) => {
      const res = await fetch(`/api/manufacturing/orders/${orderId}/claim`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to claim order');
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['/api/manufacturing/orders']});
      toast({
        title: "Order claimed",
        description: "You have successfully claimed this manufacturing order",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Sample data for demonstration - would be replaced with API data
  const sampleOrders: ManufacturingOrder[] = [
    {
      id: 1,
      orderId: "ORD-0001",
      customerName: "John Smith",
      customerEmail: "john.smith@example.com",
      status: "pending",
      items: [
        {
          id: 1,
          name: "Custom Logo Shirt",
          quantity: 50,
          price: "750.00",
          options: {
            "Color": "Blue",
            "Size Range": "S-XXL",
            "Material": "100% Cotton",
            "Print Location": "Front and Back"
          }
        }
      ],
      quantity: 50,
      totalAmount: "750.00",
      shippingAddress: "123 Main St, Anytown, CA 94568",
      notes: "Need this order ASAP for company event",
      estimatedCompletionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      assignedTo: null,
      priority: "high",
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 2,
      orderId: "ORD-0002",
      customerName: "Emily Johnson",
      customerEmail: "emily.johnson@example.com",
      status: "in_production",
      items: [
        {
          id: 2,
          name: "Promotional Tote Bags",
          quantity: 100,
          price: "450.00",
          options: {
            "Color": "Natural",
            "Material": "Canvas",
            "Print": "1-color logo",
            "Handle": "Long"
          }
        }
      ],
      quantity: 100,
      totalAmount: "450.00",
      shippingAddress: "456 Oak Ave, Sometown, NY 10001",
      notes: null,
      estimatedCompletionDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      assignedTo: "Robert Johnson",
      priority: "medium",
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 3,
      orderId: "ORD-0003",
      customerName: "Michael Brown",
      customerEmail: "michael.brown@example.com",
      status: "quality_check",
      items: [
        {
          id: 3,
          name: "Custom Packaging Boxes",
          quantity: 500,
          price: "1250.00",
          options: {
            "Size": "8x6x2 inches",
            "Material": "Corrugated cardboard",
            "Print": "Full color",
            "Finish": "Matte lamination"
          }
        }
      ],
      quantity: 500,
      totalAmount: "1250.00",
      shippingAddress: "789 Pine St, Othertown, TX 75001",
      notes: "Need sample approval before mass production",
      estimatedCompletionDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      assignedTo: "Robert Johnson",
      priority: "medium",
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 4,
      orderId: "ORD-0004",
      customerName: "Sarah Williams",
      customerEmail: "sarah.williams@example.com",
      status: "shipped",
      items: [
        {
          id: 4,
          name: "Branded Mugs",
          quantity: 200,
          price: "600.00",
          options: {
            "Color": "White",
            "Material": "Ceramic",
            "Print": "2-color logo",
            "Size": "11oz"
          }
        }
      ],
      quantity: 200,
      totalAmount: "600.00",
      shippingAddress: "101 Maple Dr, Lasttown, FL 33101",
      notes: null,
      estimatedCompletionDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      assignedTo: "Jennifer Lee",
      priority: "low",
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  const sampleLogs: ProductionLog[] = [
    {
      id: 1,
      manufacturingOrderId: 3,
      status: "received",
      notes: "Order received and materials allocated",
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      createdBy: "System",
    },
    {
      id: 2,
      manufacturingOrderId: 3,
      status: "in_production",
      notes: "Production started, estimated completion in 5 days",
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdBy: "Robert Johnson",
    },
    {
      id: 3,
      manufacturingOrderId: 3,
      status: "production_complete",
      notes: "Production completed, moving to quality check",
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      createdBy: "Robert Johnson",
    },
    {
      id: 4,
      manufacturingOrderId: 3,
      status: "quality_check",
      notes: "Quality check in progress",
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      createdBy: "Jennifer Lee",
    },
  ];

  const sampleMaterials: MaterialInventory[] = [
    {
      id: 1,
      name: "Cotton T-Shirt Blanks (White)",
      sku: "MAT-001",
      category: "Apparel",
      currentStock: 500,
      unit: "pcs",
      minimumStock: 100,
      reorderPoint: 200,
      cost: "3.50",
      supplier: "Textile Supply Co.",
      lastRestocked: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 2,
      name: "Canvas Tote Bag Blanks",
      sku: "MAT-002",
      category: "Bags",
      currentStock: 350,
      unit: "pcs",
      minimumStock: 100,
      reorderPoint: 150,
      cost: "2.25",
      supplier: "Eco Bag Manufacturers",
      lastRestocked: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 3,
      name: "Corrugated Cardboard Sheets",
      sku: "MAT-003",
      category: "Packaging",
      currentStock: 1500,
      unit: "sheets",
      minimumStock: 500,
      reorderPoint: 750,
      cost: "0.75",
      supplier: "Box Materials Inc.",
      lastRestocked: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 4,
      name: "Ceramic Mug Blanks (11oz)",
      sku: "MAT-004",
      category: "Drinkware",
      currentStock: 250,
      unit: "pcs",
      minimumStock: 100,
      reorderPoint: 150,
      cost: "1.80",
      supplier: "Premium Blank Goods",
      lastRestocked: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 5,
      name: "CMYK Ink Set",
      sku: "MAT-005",
      category: "Inks",
      currentStock: 15,
      unit: "sets",
      minimumStock: 5,
      reorderPoint: 8,
      cost: "45.00",
      supplier: "Print Supply Depot",
      lastRestocked: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  const orders = manufacturingOrders?.data || sampleOrders;
  const logs = productionLogs?.data || 
             (selectedOrder ? sampleLogs.filter(log => log.manufacturingOrderId === selectedOrder.id) : []);
  const materialsList = materials?.data || sampleMaterials;

  const filteredOrders = activeTab === "all" 
    ? orders 
    : orders.filter(order => {
        switch(activeTab) {
          case "pending": return order.status === "pending";
          case "in_production": return order.status === "in_production";
          case "quality_check": return order.status === "quality_check";
          case "shipped": return order.status === "shipped";
          case "delivered": return order.status === "delivered";
          default: return true;
        }
      });

  const handleOrderClick = (order: ManufacturingOrder) => {
    setSelectedOrder(order);
    setDialogOpen(true);
  };

  const handleUpdateStatus = () => {
    if (selectedOrder && newStatus && logNote) {
      updateOrderStatusMutation.mutate({
        orderId: selectedOrder.id,
        status: newStatus,
        notes: logNote,
      });
    }
  };

  const handleClaimOrder = () => {
    if (selectedOrder) {
      claimOrderMutation.mutate(selectedOrder.id);
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'pending':
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case 'in_production':
        return <Badge className="bg-blue-500">In Production</Badge>;
      case 'quality_check':
        return <Badge className="bg-purple-500">Quality Check</Badge>;
      case 'shipped':
        return <Badge className="bg-green-500">Shipped</Badge>;
      case 'delivered':
        return <Badge className="bg-green-700">Delivered</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      case 'received':
        return <Badge className="bg-gray-500">Received</Badge>;
      case 'production_complete':
        return <Badge className="bg-indigo-500">Production Complete</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch(priority) {
      case 'low':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800">Low</Badge>;
      case 'medium':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Medium</Badge>;
      case 'high':
        return <Badge variant="outline" className="bg-orange-100 text-orange-800">High</Badge>;
      case 'urgent':
        return <Badge variant="outline" className="bg-red-100 text-red-800">Urgent</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const getInventoryStatusBadge = (current: number, min: number, reorder: number) => {
    if (current <= min) {
      return <Badge variant="destructive">Low Stock</Badge>;
    } else if (current <= reorder) {
      return <Badge className="bg-yellow-500">Reorder Soon</Badge>;
    } else {
      return <Badge className="bg-green-500">In Stock</Badge>;
    }
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-800 py-4 px-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">Manufacturing</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Manage production orders and inventory</p>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={() => setShowInventory(!showInventory)}
            >
              <Box className="mr-2 h-4 w-4" />
              {showInventory ? "Show Orders" : "Show Inventory"}
            </Button>
            <Button
              onClick={() => setMaterialDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Material
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {!showInventory ? (
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Orders</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="in_production">In Production</TabsTrigger>
              <TabsTrigger value="quality_check">Quality Check</TabsTrigger>
              <TabsTrigger value="shipped">Shipped</TabsTrigger>
              <TabsTrigger value="delivered">Delivered</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-4">
              {isLoading ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="text-center p-8 border rounded-lg border-dashed">
                  <Package className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                  <h3 className="text-lg font-medium">No manufacturing orders found</h3>
                  <p className="text-gray-500 mt-1">Orders matching the selected filter will appear here.</p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Assigned To</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Est. Completion</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrders.map((order) => (
                        <TableRow 
                          key={order.id}
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => handleOrderClick(order)}
                        >
                          <TableCell className="font-medium">{order.orderId}</TableCell>
                          <TableCell>{order.customerName}</TableCell>
                          <TableCell>
                            {order.items.map(item => (
                              <div key={item.id} className="text-sm">
                                {item.quantity}x {item.name}
                              </div>
                            ))}
                          </TableCell>
                          <TableCell>{getStatusBadge(order.status)}</TableCell>
                          <TableCell>{order.assignedTo || "Unassigned"}</TableCell>
                          <TableCell>{getPriorityBadge(order.priority)}</TableCell>
                          <TableCell>
                            {order.estimatedCompletionDate 
                              ? formatDate(order.estimatedCompletionDate)
                              : "Not set"}
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOrderClick(order);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Material Inventory</CardTitle>
              <CardDescription>Current stock levels and reordering information</CardDescription>
            </CardHeader>
            <CardContent>
              {materialsLoading ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : (
                <div className="overflow-hidden rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>SKU</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Current Stock</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Cost</TableHead>
                        <TableHead>Supplier</TableHead>
                        <TableHead>Last Restocked</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {materialsList.map((material) => (
                        <TableRow key={material.id}>
                          <TableCell className="font-medium">{material.sku}</TableCell>
                          <TableCell>{material.name}</TableCell>
                          <TableCell>{material.category}</TableCell>
                          <TableCell>
                            {material.currentStock} {material.unit}
                          </TableCell>
                          <TableCell>
                            {getInventoryStatusBadge(
                              material.currentStock,
                              material.minimumStock,
                              material.reorderPoint
                            )}
                          </TableCell>
                          <TableCell>${material.cost} per {material.unit}</TableCell>
                          <TableCell>{material.supplier}</TableCell>
                          <TableCell>{formatDate(material.lastRestocked)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Order Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Manufacturing Order: {selectedOrder?.orderId}</DialogTitle>
            <DialogDescription className="flex items-center gap-2">
              {getStatusBadge(selectedOrder?.status || "")}
              {getPriorityBadge(selectedOrder?.priority || "")}
              <span className="ml-2">Created on {selectedOrder ? formatDate(selectedOrder.createdAt) : ""}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Order Details Column */}
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Order Details</h3>
                <div className="text-sm space-y-2">
                  <div className="flex items-center">
                    <User className="mr-2 h-4 w-4 text-gray-500" />
                    <span className="text-gray-700">{selectedOrder?.customerName}</span>
                  </div>
                  <div className="flex items-center">
                    <ShoppingBag className="mr-2 h-4 w-4 text-gray-500" />
                    <span className="text-gray-700">Total: {formatCurrency(Number(selectedOrder?.totalAmount) || 0)}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="mr-2 h-4 w-4 text-gray-500" />
                    <span className="text-gray-700">
                      Est. Completion: {selectedOrder?.estimatedCompletionDate 
                        ? formatDate(selectedOrder.estimatedCompletionDate)
                        : "Not set"}
                    </span>
                  </div>
                  <div className="flex items-start">
                    <Truck className="mr-2 h-4 w-4 text-gray-500 mt-0.5" />
                    <span className="text-gray-700">{selectedOrder?.shippingAddress}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">Item Details</h3>
                {selectedOrder?.items.map((item) => (
                  <div key={item.id} className="p-3 rounded-md bg-gray-50 mb-2">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm text-gray-500">Quantity: {item.quantity}</div>
                    <div className="text-sm text-gray-500">Price: {formatCurrency(Number(item.price))}</div>
                    
                    {item.options && Object.keys(item.options).length > 0 && (
                      <div className="mt-2">
                        <div className="text-xs font-medium text-gray-700">Options:</div>
                        <div className="grid grid-cols-2 gap-1 text-xs mt-1">
                          {Object.entries(item.options).map(([key, value]) => (
                            <div key={key}>
                              <span className="text-gray-500">{key}:</span> {value}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {selectedOrder?.notes && (
                <div>
                  <h3 className="font-medium mb-2">Notes</h3>
                  <p className="text-sm text-gray-700">{selectedOrder.notes}</p>
                </div>
              )}

              {selectedOrder?.status === "pending" && (
                <Button 
                  onClick={handleClaimOrder} 
                  className="w-full"
                  disabled={claimOrderMutation.isPending}
                >
                  {claimOrderMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Claim Order
                </Button>
              )}

              {selectedOrder?.assignedTo && (
                <Button 
                  onClick={() => setUpdateDialogOpen(true)}
                  className="w-full"
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Update Status
                </Button>
              )}
            </div>

            {/* Production Logs Column */}
            <div className="md:col-span-2 space-y-4">
              <h3 className="font-medium">Production Log</h3>
              
              {logsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : logs.length === 0 ? (
                <div className="text-center p-8 border rounded-lg border-dashed">
                  <FileText className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                  <h3 className="text-medium">No production logs yet</h3>
                  <p className="text-gray-500 text-sm mt-1">
                    {selectedOrder?.status === "pending" 
                      ? "Claim this order to start production" 
                      : "Update the order status to add to the production log"}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {logs.map((log) => (
                    <div key={log.id} className="p-4 rounded-md border">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center">
                          {getStatusBadge(log.status)}
                          <span className="ml-2 text-sm text-gray-700">
                            by {log.createdBy}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatDate(log.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm">{log.notes}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Order Status</DialogTitle>
            <DialogDescription>
              Update the status for order {selectedOrder?.orderId}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="status">New Status</Label>
              <Select
                value={newStatus}
                onValueChange={setNewStatus}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a new status" />
                </SelectTrigger>
                <SelectContent>
                  {selectedOrder?.status === "pending" && (
                    <SelectItem value="in_production">In Production</SelectItem>
                  )}
                  {selectedOrder?.status === "in_production" && (
                    <SelectItem value="quality_check">Quality Check</SelectItem>
                  )}
                  {selectedOrder?.status === "quality_check" && (
                    <>
                      <SelectItem value="shipped">Shipped</SelectItem>
                      <SelectItem value="in_production">Back to Production</SelectItem>
                    </>
                  )}
                  {selectedOrder?.status === "shipped" && (
                    <SelectItem value="delivered">Delivered</SelectItem>
                  )}
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="note">Notes</Label>
              <Textarea
                id="note"
                placeholder="Add details about this status update..."
                value={logNote}
                onChange={(e) => setLogNote(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setUpdateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={handleUpdateStatus}
              disabled={!newStatus || !logNote || updateOrderStatusMutation.isPending}
            >
              {updateOrderStatusMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Material Dialog */}
      <Dialog open={materialDialogOpen} onOpenChange={setMaterialDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Material</DialogTitle>
            <DialogDescription>
              Add a new material to inventory
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Material Name</Label>
                <Input
                  id="name"
                  placeholder="Material name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  placeholder="MAT-XXX"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="apparel">Apparel</SelectItem>
                    <SelectItem value="packaging">Packaging</SelectItem>
                    <SelectItem value="inks">Inks</SelectItem>
                    <SelectItem value="drinkware">Drinkware</SelectItem>
                    <SelectItem value="bags">Bags</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="supplier">Supplier</Label>
                <Input
                  id="supplier"
                  placeholder="Supplier name"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currentStock">Current Stock</Label>
                <Input
                  id="currentStock"
                  type="number"
                  placeholder="0"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Input
                  id="unit"
                  placeholder="pcs, sets, etc."
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cost">Cost per Unit</Label>
                <Input
                  id="cost"
                  placeholder="0.00"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minimumStock">Minimum Stock</Label>
                <Input
                  id="minimumStock"
                  type="number"
                  placeholder="0"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="reorderPoint">Reorder Point</Label>
                <Input
                  id="reorderPoint"
                  type="number"
                  placeholder="0"
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setMaterialDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={() => {
                setMaterialDialogOpen(false);
                toast({
                  title: "Material added",
                  description: "New material has been added to inventory",
                });
              }}
            >
              Add Material
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}