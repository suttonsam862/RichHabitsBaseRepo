import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  Package,
  User,
  Calendar,
  Clock,
  Ruler,
  DollarSign,
  ShoppingCart,
  Truck,
  FileText,
  Hammer,
  Scissors,
  CircleAlert,
  TruckIcon,
  CheckCircle2,
  BarChart,
  Info,
  Palette,
  ImageIcon,
  ShirtIcon,
  ActivityIcon,
} from "lucide-react";
import { format } from "date-fns";

export default function OrderDetail() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("specs");
  
  // Fetch order details
  const { data: orderDetails, isLoading } = useQuery({
    queryKey: [`/api/manufacturer/orders/${id}`],
    queryFn: async ({ queryKey }) => {
      // This would fetch from API in production
      return {
        data: {
          id: id,
          status: "in_production",
          customerName: "Metro High School",
          customerCompany: "Metro High School Athletics",
          productType: "Custom Baseball Uniform",
          receivedDate: new Date().toISOString(),
          deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          itemCount: 25,
          totalCost: 1875.00,
          unitCost: 75.00,
          shippingMethod: "Ground",
          shippingAddress: "123 School Ave, Metroville, CA 12345",
          progress: 45,
          productionStage: "Cutting",
          isPriority: true,
          notes: "Team colors are blue and gold. Logo printed on chest, numbers on back.",
          designUrl: "",
          items: [
            {
              id: 1,
              type: "Jersey",
              size: "Adult M",
              quantity: 15,
              cost: 45.00,
              fabric: "Polyester blend",
              colors: "Blue/Gold",
              measurements: {
                chest: "40\"",
                length: "28\"",
                sleeve: "9\""
              }
            },
            {
              id: 2,
              type: "Pants",
              size: "Adult M",
              quantity: 15,
              cost: 30.00,
              fabric: "Polyester blend",
              colors: "White",
              measurements: {
                waist: "32-34\"",
                inseam: "32\"",
                outseam: "42\""
              }
            }
          ],
          designSpecs: {
            logoPlacement: "Left chest",
            numberPlacement: "Back center",
            fontStyle: "Athletic block",
            specialInstructions: "Gold trim on blue background, school mascot (bear) logo"
          },
          productionHistory: [
            {
              date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
              stage: "Order Received",
              notes: "Order received and specifications reviewed"
            },
            {
              date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
              stage: "Materials Prepared",
              notes: "All fabrics and materials prepared for production"
            },
            {
              date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
              stage: "Cutting",
              notes: "Cutting process initiated for all items"
            }
          ]
        }
      };
    }
  });
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-3">Loading order details...</span>
      </div>
    );
  }
  
  if (!orderDetails || !orderDetails.data) {
    return (
      <div className="text-center py-12">
        <CircleAlert className="h-12 w-12 mx-auto text-red-500 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Order Not Found</h2>
        <p className="text-muted-foreground mb-6">
          The order you're looking for doesn't exist or you don't have permission to view it.
        </p>
        <Button asChild>
          <Link href="/manufacturing-orders">Return to Orders</Link>
        </Button>
      </div>
    );
  }
  
  const order = orderDetails.data;
  
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
      {/* Back button and page title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/manufacturing-orders">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">Order #{order.id}</h1>
            <p className="text-sm text-muted-foreground">
              {order.productType} • {order.itemCount} items
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <OrderStatusBadge status={order.status} />
          {order.isPriority && (
            <Badge variant="outline" className="border-red-200 text-red-700">
              Priority
            </Badge>
          )}
        </div>
      </div>
      
      {/* Order summary card */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Customer</p>
              <div className="flex items-center">
                <User className="h-4 w-4 mr-2 text-muted-foreground" />
                <p className="font-medium">{order.customerName}</p>
              </div>
              {order.customerCompany && (
                <p className="text-sm text-muted-foreground pl-6">{order.customerCompany}</p>
              )}
            </div>
            
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Order Dates</p>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                <p className="font-medium">Received: {format(new Date(order.receivedDate), 'MMM d, yyyy')}</p>
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                <p className="font-medium">Deadline: {format(new Date(order.deadline), 'MMM d, yyyy')}</p>
              </div>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Production</p>
              <div className="flex items-center">
                <Hammer className="h-4 w-4 mr-2 text-muted-foreground" />
                <p className="font-medium">Stage: {order.productionStage || "Not Started"}</p>
              </div>
              <div className="flex items-center">
                <ActivityIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                <p className="font-medium">Progress: {order.progress}%</p>
              </div>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Costs</p>
              <div className="flex items-center">
                <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                <p className="font-medium">Total: ${order.totalCost.toFixed(2)}</p>
              </div>
              <div className="flex items-center">
                <Scissors className="h-4 w-4 mr-2 text-muted-foreground" />
                <p className="font-medium">Unit: ${order.unitCost.toFixed(2)}</p>
              </div>
            </div>
          </div>
          
          {order.status === 'in_production' && (
            <div className="mt-6">
              <div className="flex justify-between text-sm mb-1">
                <span>Production Progress</span>
                <span>{order.progress}%</span>
              </div>
              <Progress value={order.progress} className="h-2" />
            </div>
          )}
          
          {/* Quick action buttons */}
          <div className="flex flex-wrap gap-3 mt-6">
            {order.status === 'pending' && (
              <Button asChild>
                <Link href={`/cost-input/${order.id}`}>
                  <DollarSign className="mr-2 h-4 w-4" />
                  Input Costs
                </Link>
              </Button>
            )}
            
            {order.status === 'in_production' && (
              <Button asChild>
                <Link href={`/status-update/${order.id}`}>
                  <Hammer className="mr-2 h-4 w-4" />
                  Update Status
                </Link>
              </Button>
            )}
            
            {order.status === 'ready_to_ship' && (
              <Button asChild>
                <Link href={`/shipping/${order.id}`}>
                  <TruckIcon className="mr-2 h-4 w-4" />
                  Ship Order
                </Link>
              </Button>
            )}
            
            <Button variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              Download Production Sheet
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Order details tabs */}
      <Card>
        <CardHeader className="pb-0">
          <CardTitle>Order Details</CardTitle>
          <CardDescription>
            Comprehensive specifications and production information
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="specs">Production Specs</TabsTrigger>
              <TabsTrigger value="designs">Design Details</TabsTrigger>
              <TabsTrigger value="items">Item List</TabsTrigger>
              <TabsTrigger value="history">Production History</TabsTrigger>
            </TabsList>
            
            <TabsContent value="specs">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Product Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-1">
                          <div className="text-sm font-medium text-muted-foreground">Product Type:</div>
                          <div className="text-sm col-span-2">{order.productType}</div>
                        </div>
                        <div className="grid grid-cols-3 gap-1">
                          <div className="text-sm font-medium text-muted-foreground">Total Items:</div>
                          <div className="text-sm col-span-2">{order.itemCount}</div>
                        </div>
                        <div className="grid grid-cols-3 gap-1">
                          <div className="text-sm font-medium text-muted-foreground">Production Notes:</div>
                          <div className="text-sm col-span-2 whitespace-pre-line">{order.notes}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Shipping Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-1">
                          <div className="text-sm font-medium text-muted-foreground">Shipping Method:</div>
                          <div className="text-sm col-span-2">{order.shippingMethod}</div>
                        </div>
                        <div className="grid grid-cols-3 gap-1">
                          <div className="text-sm font-medium text-muted-foreground">Shipping Address:</div>
                          <div className="text-sm col-span-2 whitespace-pre-line">{order.shippingAddress}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Production Requirements</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="flex items-start space-x-3">
                          <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                          <div>
                            <h3 className="font-medium">Quality Standards</h3>
                            <p className="text-sm mt-1">
                              All items must pass quality control inspection before shipping. Check for proper stitching, 
                              print quality, and accurate sizing according to specifications.
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {order.status === 'pending' && (
                        <div className="bg-amber-50 p-4 rounded-lg">
                          <div className="flex items-start space-x-3">
                            <CircleAlert className="h-5 w-5 text-amber-600 mt-0.5" />
                            <div>
                              <h3 className="font-medium">Required Action</h3>
                              <p className="text-sm mt-1">
                                This order requires cost input before production can begin. Please submit production costs
                                using the "Input Costs" button.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {order.isPriority && (
                        <div className="bg-red-50 p-4 rounded-lg">
                          <div className="flex items-start space-x-3">
                            <CircleAlert className="h-5 w-5 text-red-600 mt-0.5" />
                            <div>
                              <h3 className="font-medium">Priority Order</h3>
                              <p className="text-sm mt-1">
                                This is a priority order that requires expedited production. Please prioritize this
                                order in your production schedule.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="designs">
              <div className="space-y-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Design Specifications</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {order.designSpecs && Object.entries(order.designSpecs).map(([key, value]) => (
                        <div key={key} className="grid grid-cols-3 gap-1">
                          <div className="text-sm font-medium text-muted-foreground">
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}:
                          </div>
                          <div className="text-sm col-span-2">{value as string}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Design Preview</CardTitle>
                    </CardHeader>
                    <CardContent className="flex justify-center">
                      {order.designUrl ? (
                        <img 
                          src={order.designUrl} 
                          alt="Design Preview" 
                          className="max-w-full h-auto rounded-md"
                        />
                      ) : (
                        <div className="p-12 border rounded-md flex flex-col items-center justify-center">
                          <ImageIcon className="h-12 w-12 text-muted-foreground opacity-50 mb-2" />
                          <p className="text-sm text-muted-foreground">No design image available</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Color Palette</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-3">
                          <div className="flex flex-col items-center">
                            <div className="h-12 w-12 rounded-md bg-blue-600 mb-1"></div>
                            <span className="text-xs">Primary</span>
                          </div>
                          <div className="flex flex-col items-center">
                            <div className="h-12 w-12 rounded-md bg-amber-400 mb-1"></div>
                            <span className="text-xs">Secondary</span>
                          </div>
                          <div className="flex flex-col items-center">
                            <div className="h-12 w-12 rounded-md bg-white border mb-1"></div>
                            <span className="text-xs">Base</span>
                          </div>
                        </div>
                        
                        <div className="pt-3">
                          <p className="text-sm text-muted-foreground">
                            Ensure all colors match exactly with the specified team colors. Primary color (blue) should be
                            used for the main jersey body, with secondary color (gold) for accents and trim.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Logo and Graphics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        Team logo should be placed on the left chest of the jersey. Player numbers should be centered
                        on the back using Athletic Block font. Graphics should be heat pressed according to specifications.
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div className="border rounded-md p-4 flex items-center justify-center">
                          <ImageIcon className="h-12 w-12 text-muted-foreground opacity-50" />
                          <div className="ml-4">
                            <h4 className="font-medium">Front Logo</h4>
                            <p className="text-xs text-muted-foreground">School mascot (bear) logo on chest</p>
                          </div>
                        </div>
                        <div className="border rounded-md p-4 flex items-center justify-center">
                          <ShirtIcon className="h-12 w-12 text-muted-foreground opacity-50" />
                          <div className="ml-4">
                            <h4 className="font-medium">Back Number</h4>
                            <p className="text-xs text-muted-foreground">8-inch numbers centered on back</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="items">
              <div className="space-y-6">
                {order.items && order.items.map((item) => (
                  <Card key={item.id}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-base">{item.type}</CardTitle>
                        <Badge variant="outline">{item.quantity} items</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                        <div className="grid grid-cols-3 gap-1">
                          <div className="text-sm font-medium text-muted-foreground">Size:</div>
                          <div className="text-sm col-span-2">{item.size}</div>
                        </div>
                        <div className="grid grid-cols-3 gap-1">
                          <div className="text-sm font-medium text-muted-foreground">Unit Cost:</div>
                          <div className="text-sm col-span-2">${item.cost.toFixed(2)}</div>
                        </div>
                        <div className="grid grid-cols-3 gap-1">
                          <div className="text-sm font-medium text-muted-foreground">Fabric:</div>
                          <div className="text-sm col-span-2">{item.fabric}</div>
                        </div>
                        <div className="grid grid-cols-3 gap-1">
                          <div className="text-sm font-medium text-muted-foreground">Colors:</div>
                          <div className="text-sm col-span-2">{item.colors}</div>
                        </div>
                      </div>
                      
                      <Separator className="my-4" />
                      
                      <div>
                        <h4 className="text-sm font-medium mb-2">Measurements</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2">
                          {item.measurements && Object.entries(item.measurements).map(([key, value]) => (
                            <div key={key} className="flex items-center">
                              <Ruler className="h-3 w-3 text-muted-foreground mr-2" />
                              <span className="text-sm text-muted-foreground mr-1 capitalize">
                                {key}:
                              </span>
                              <span className="text-sm">{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-1">
                        <div className="text-sm font-medium">Total Items:</div>
                        <div className="text-sm col-span-2">{order.itemCount}</div>
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        <div className="text-sm font-medium">Total Cost:</div>
                        <div className="text-sm col-span-2">${order.totalCost.toFixed(2)}</div>
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        <div className="text-sm font-medium">Unit Cost:</div>
                        <div className="text-sm col-span-2">${order.unitCost.toFixed(2)}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="history">
              <div className="space-y-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Production Timeline</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="relative pl-8 space-y-6 py-2">
                      {/* Vertical line */}
                      <div className="absolute top-0 left-3 bottom-0 border-l-2 border-dashed border-gray-200"></div>
                      
                      {order.productionHistory && order.productionHistory.map((event, index) => (
                        <div key={index} className="relative">
                          {/* Timeline dot */}
                          <div className="absolute -left-5 mt-1.5 w-4 h-4 rounded-full bg-primary"></div>
                          
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium">{event.stage}</h4>
                              <p className="text-sm text-muted-foreground mt-1">{event.notes}</p>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {format(new Date(event.date), 'MMM d, yyyy')}
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {/* Future milestone */}
                      {order.status !== 'completed' && (
                        <div className="relative">
                          <div className="absolute -left-5 mt-1.5 w-4 h-4 rounded-full bg-gray-200 border border-gray-300"></div>
                          
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium text-muted-foreground">
                                {order.status === 'ready_to_ship' ? 'Shipping' : 
                                 order.status === 'in_production' ? 'Production Complete' : 'Begin Production'}
                              </h4>
                              <p className="text-sm text-muted-foreground mt-1">Upcoming milestone</p>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Pending
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Target completion */}
                      <div className="relative">
                        <div className="absolute -left-5 mt-1.5 w-4 h-4 rounded-full bg-gray-200 border border-gray-300"></div>
                        
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-muted-foreground">Target Completion</h4>
                            <p className="text-sm text-muted-foreground mt-1">Final deadline for completion</p>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(order.deadline), 'MMM d, yyyy')}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Production Metrics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <BarChart className="h-4 w-4 text-muted-foreground mr-2" />
                            <span className="text-sm">Production Progress</span>
                          </div>
                          <span className="text-sm font-medium">{order.progress}%</span>
                        </div>
                        <Progress value={order.progress} className="h-2" />
                        
                        <div className="grid grid-cols-2 gap-4 pt-2">
                          <div>
                            <p className="text-xs text-muted-foreground">Current Stage</p>
                            <p className="text-sm font-medium">{order.productionStage || "Not Started"}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Estimated Completion</p>
                            <p className="text-sm font-medium">
                              {format(new Date(order.deadline), 'MMM d, yyyy')}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Next Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {order.status === 'pending' && (
                          <div className="flex items-start space-x-3">
                            <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                              <p className="text-sm font-medium">Input Production Costs</p>
                              <p className="text-xs text-muted-foreground">Required before production can begin</p>
                              <Button size="sm" className="mt-2" asChild>
                                <Link href={`/cost-input/${order.id}`}>Input Costs</Link>
                              </Button>
                            </div>
                          </div>
                        )}
                        
                        {order.status === 'in_production' && (
                          <div className="flex items-start space-x-3">
                            <Hammer className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                              <p className="text-sm font-medium">Update Production Status</p>
                              <p className="text-xs text-muted-foreground">
                                Current stage: {order.productionStage || "Not Started"}
                              </p>
                              <Button size="sm" className="mt-2" asChild>
                                <Link href={`/status-update/${order.id}`}>Update Status</Link>
                              </Button>
                            </div>
                          </div>
                        )}
                        
                        {order.status === 'ready_to_ship' && (
                          <div className="flex items-start space-x-3">
                            <TruckIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                              <p className="text-sm font-medium">Complete Shipping</p>
                              <p className="text-xs text-muted-foreground">Enter tracking information and finalize order</p>
                              <Button size="sm" className="mt-2" asChild>
                                <Link href={`/shipping/${order.id}`}>Ship Order</Link>
                              </Button>
                            </div>
                          </div>
                        )}
                        
                        {order.status === 'completed' && (
                          <div className="flex items-start space-x-3">
                            <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium">Order Completed</p>
                              <p className="text-xs text-muted-foreground">No further actions required</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}