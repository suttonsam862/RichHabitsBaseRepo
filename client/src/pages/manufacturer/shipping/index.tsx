import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft,
  Package,
  Save,
  CheckCircle,
  Clock,
  Ruler,
  ClipboardList,
  CircleAlert,
  CalendarIcon,
  Loader2,
  TruckIcon,
  AlertTriangle,
  MapPin,
  FileText,
  Send,
  CheckSquare,
  Info,
  Printer,
  ListChecks,
  Mail,
  Plus,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";

// Shipping form schema
const shippingSchema = z.object({
  trackingNumber: z.string().min(1, "Tracking number is required"),
  carrier: z.string().min(1, "Shipping carrier is required"),
  shipmentDate: z.string().min(1, "Shipment date is required"),
  packages: z.array(z.object({
    packageId: z.string(),
    description: z.string().min(1, "Package description is required"),
    weight: z.coerce.number().min(0.1, "Weight must be greater than 0"),
    dimensions: z.object({
      length: z.coerce.number().min(1, "Length must be greater than 0"),
      width: z.coerce.number().min(1, "Width must be greater than 0"),
      height: z.coerce.number().min(1, "Height must be greater than 0"),
    }),
    itemCount: z.coerce.number().min(1, "Package must contain at least one item"),
  })).min(1, "At least one package is required"),
  notifyClient: z.boolean().default(true),
  notifySalesRep: z.boolean().default(true),
  additionalInstructions: z.string().optional(),
  shippingMethod: z.string().min(1, "Shipping method is required"),
  totalItems: z.coerce.number().min(1, "Total items must be at least 1"),
  boxedItemsList: z.string().min(1, "List of items in boxes is required"),
  shippingAddress: z.string().min(1, "Shipping address is required"),
});

type ShippingFormValues = z.infer<typeof shippingSchema>;

// Shipping carriers
const shippingCarriers = [
  { value: "fedex", label: "FedEx" },
  { value: "ups", label: "UPS" },
  { value: "usps", label: "USPS" },
  { value: "dhl", label: "DHL" },
];

// Shipping methods
const shippingMethods = [
  { value: "ground", label: "Ground" },
  { value: "2day", label: "2-Day Express" },
  { value: "overnight", label: "Overnight" },
  { value: "international", label: "International" },
];

export default function Shipping() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // Get order details if id is present
  const { data: orderDetails, isLoading } = useQuery({
    queryKey: id ? [`/api/manufacturer/orders/${id}`] : [null],
    queryFn: async ({ queryKey }) => {
      if (!id) return null;
      // This would fetch from API in production
      return {
        data: {
          id: id,
          status: "ready_to_ship",
          customerName: "Metro High School",
          customerEmail: "athletics@metrohs.edu",
          productType: "Custom Baseball Uniform",
          itemCount: 25,
          totalCost: 1875.00,
          receivedDate: new Date().toISOString(),
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          shippingMethod: "ground",
          shippingAddress: "123 School Ave, Metroville, CA 12345",
          salesRepId: 15,
          salesRepName: "John Smith",
          salesRepEmail: "john.smith@rich-habits.com",
          items: [
            {
              id: 1,
              type: "Jersey",
              size: "Adult M",
              quantity: 15,
              cost: 45.00,
              fabric: "Polyester blend"
            },
            {
              id: 2,
              type: "Pants",
              size: "Adult M",
              quantity: 10,
              cost: 30.00,
              fabric: "Polyester blend"
            }
          ]
        }
      };
    },
    enabled: !!id
  });
  
  const order = orderDetails?.data;
  
  // Generate a unique ID for a new package
  const generatePackageId = () => `pkg_${Math.random().toString(36).substring(2, 9)}`;
  
  // Initial package
  const initialPackage = {
    packageId: generatePackageId(),
    description: "",
    weight: 0,
    dimensions: {
      length: 0,
      width: 0,
      height: 0,
    },
    itemCount: 1,
  };
  
  // Generate a list of items based on order
  const generateItemsList = () => {
    if (!order) return "";
    
    return order.items.map((item: any) => 
      `${item.quantity}x ${item.type} (${item.size}, ${item.fabric})`
    ).join("\n");
  };
  
  // Initial form values
  const defaultValues: ShippingFormValues = {
    trackingNumber: "",
    carrier: "fedex",
    shipmentDate: format(new Date(), 'yyyy-MM-dd'),
    packages: [initialPackage],
    notifyClient: true,
    notifySalesRep: true,
    additionalInstructions: "",
    shippingMethod: order?.shippingMethod || "ground",
    totalItems: order?.itemCount || 0,
    boxedItemsList: generateItemsList(),
    shippingAddress: order?.shippingAddress || "",
  };
  
  // Setup form
  const form = useForm<ShippingFormValues>({
    resolver: zodResolver(shippingSchema),
    defaultValues
  });
  
  // Get packages array value
  const { fields, append, remove } = form.control._formValues.packages;
  
  // Submit shipping info mutation
  const submitShippingMutation = useMutation({
    mutationFn: async (values: ShippingFormValues) => {
      // This would post to API in production
      console.log("Submitting shipping info:", values);
      // Simulate API call
      return new Promise((resolve) => setTimeout(() => resolve({ success: true }), 1000));
    },
    onSuccess: () => {
      toast({
        title: "Shipping information submitted",
        description: order 
          ? `Order #${order.id} has been marked as completed and shipping information has been recorded.`
          : "Shipping information has been submitted successfully.",
      });
      
      // Navigate to manufacturing orders page
      navigate("/manufacturing-orders");
    },
    onError: (error) => {
      toast({
        title: "Error submitting shipping information",
        description: "There was a problem updating the shipping information. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  // Submit handler
  const onSubmit = (values: ShippingFormValues) => {
    // Verify the total item count across all packages matches the order
    if (order) {
      const totalItemsInPackages = values.packages.reduce((sum, pkg) => sum + pkg.itemCount, 0);
      
      if (totalItemsInPackages !== order.itemCount) {
        toast({
          title: "Item count mismatch",
          description: `The total number of items in all packages (${totalItemsInPackages}) doesn't match the order item count (${order.itemCount}).`,
          variant: "destructive"
        });
        return;
      }
    }
    
    submitShippingMutation.mutateAsync(values);
  };
  
  // Add a new package
  const addPackage = () => {
    const newPackage = {
      packageId: generatePackageId(),
      description: "",
      weight: 0,
      dimensions: {
        length: 0,
        width: 0,
        height: 0,
      },
      itemCount: 1,
    };
    
    form.setValue('packages', [...form.getValues().packages, newPackage]);
  };
  
  // Remove a package
  const removePackage = (index: number) => {
    const packages = form.getValues().packages;
    if (packages.length <= 1) {
      toast({
        title: "Cannot remove package",
        description: "At least one package is required.",
        variant: "destructive"
      });
      return;
    }
    
    const updatedPackages = [...packages];
    updatedPackages.splice(index, 1);
    form.setValue('packages', updatedPackages);
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
        <span>Loading order details...</span>
      </div>
    );
  }
  
  // If looking for a specific order but not found
  if (id && !orderDetails?.data) {
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
  
  // If order exists but is not ready to ship
  if (order && order.status !== "ready_to_ship") {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 mx-auto text-amber-500 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Order Not Ready for Shipping</h2>
        <p className="text-muted-foreground mb-6">
          This order is currently in "{order.status}" status and is not ready for shipping.
          Please update the production status to "Ready to Ship" before proceeding.
        </p>
        <div className="flex justify-center gap-4">
          <Button asChild variant="outline">
            <Link href="/manufacturing-orders">Return to Orders</Link>
          </Button>
          <Button asChild>
            <Link href={`/status-update/${id}`}>Update Status</Link>
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" asChild>
            <Link href={id ? `/order-detail/${id}` : "/manufacturing-orders"}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">
              {id ? `Shipping for Order #${id}` : "Shipping"}
            </h1>
            <p className="text-sm text-muted-foreground">
              Enter shipping information {order ? `for order #${order.id}` : "for completed orders"}
            </p>
          </div>
        </div>
      </div>
      
      {/* Order details if specific order */}
      {order && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Order Details</CardTitle>
                <CardDescription>
                  Information about the order being shipped
                </CardDescription>
              </div>
              <Badge className="bg-green-100 text-green-800">
                Ready to Ship
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-1">
                  <Label className="text-muted-foreground">Customer:</Label>
                  <span className="font-medium">{order.customerName}</span>
                </div>
                <div className="grid grid-cols-2 gap-1">
                  <Label className="text-muted-foreground">Product Type:</Label>
                  <span className="font-medium">{order.productType}</span>
                </div>
                <div className="grid grid-cols-2 gap-1">
                  <Label className="text-muted-foreground">Items:</Label>
                  <span className="font-medium">{order.itemCount}</span>
                </div>
                <div className="grid grid-cols-2 gap-1">
                  <Label className="text-muted-foreground">Shipping Method:</Label>
                  <span className="font-medium">{
                    shippingMethods.find(method => method.value === order.shippingMethod)?.label || 
                    order.shippingMethod
                  }</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-1">
                  <Label className="text-muted-foreground">Sales Rep:</Label>
                  <span className="font-medium">{order.salesRepName}</span>
                </div>
                <div className="grid grid-cols-2 gap-1">
                  <Label className="text-muted-foreground">Shipping Address:</Label>
                  <span className="font-medium whitespace-pre-line">{order.shippingAddress}</span>
                </div>
              </div>
            </div>
            
            {order.items && order.items.length > 0 && (
              <>
                <Separator className="my-4" />
                <div className="space-y-2">
                  <h3 className="font-medium">Items to Ship</h3>
                  <div className="grid gap-2">
                    {order.items.map((item: any) => (
                      <div key={item.id} className="border rounded-md p-3">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center">
                            <Package className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span className="font-medium">{item.type}</span>
                          </div>
                          <Badge variant="outline">Qty: {item.quantity}</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm mt-1">
                          <div className="flex items-center">
                            <span className="text-muted-foreground mr-1">Size:</span>
                            <span>{item.size}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="text-muted-foreground mr-1">Fabric:</span>
                            <span>{item.fabric}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Shipping Form */}
      <Card>
        <CardHeader>
          <CardTitle>Shipping Information</CardTitle>
          <CardDescription>
            Enter tracking and package details for the shipment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="trackingNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tracking Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter tracking number" {...field} />
                        </FormControl>
                        <FormDescription>
                          Tracking number provided by the carrier
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="carrier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Shipping Carrier</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select shipping carrier" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {shippingCarriers.map((carrier) => (
                              <SelectItem key={carrier.value} value={carrier.value}>
                                {carrier.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Carrier handling the shipment
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="shipmentDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Shipment Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormDescription>
                          Date when the order will be shipped
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="shippingMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Shipping Method</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select shipping method" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {shippingMethods.map((method) => (
                              <SelectItem key={method.value} value={method.value}>
                                {method.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Method of shipment
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="shippingAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Shipping Address</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter complete shipping address" 
                          className="min-h-[80px]" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Full shipping address including name, street, city, state, and ZIP code
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="totalItems"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Items</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1" 
                          {...field} 
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Total number of items being shipped
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="boxedItemsList"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>List of Items</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter detailed list of items being shipped" 
                          className="min-h-[100px]" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Detailed list of all items included in the shipment
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-base font-medium">Package Information</h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addPackage}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Package
                    </Button>
                  </div>
                  
                  {form.getValues().packages.map((pkg, index) => (
                    <Card key={pkg.packageId} className="bg-muted/30">
                      <CardHeader className="py-3 px-4">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-sm font-medium">Package {index + 1}</CardTitle>
                          {form.getValues().packages.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removePackage(index)}
                              className="h-7 w-7"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="py-3 px-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`packages.${index}.description`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Package Description</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Jerseys Box 1" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name={`packages.${index}.itemCount`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Items in Package</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min="1" 
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name={`packages.${index}.weight`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Weight (lbs)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min="0.1" 
                                  step="0.1" 
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid grid-cols-3 gap-2">
                          <FormField
                            control={form.control}
                            name={`packages.${index}.dimensions.length`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Length</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    min="1" 
                                    {...field}
                                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name={`packages.${index}.dimensions.width`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Width</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    min="1" 
                                    {...field}
                                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name={`packages.${index}.dimensions.height`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Height</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    min="1" 
                                    {...field}
                                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="notifyClient"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Notify Client</FormLabel>
                          <FormDescription>
                            Send an email to the client with shipping details
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="notifySalesRep"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Notify Sales Rep</FormLabel>
                          <FormDescription>
                            Send an email to the sales rep with shipping details
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="additionalInstructions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Instructions</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter any additional shipping instructions..." 
                          className="min-h-[80px]" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Optional instructions or notes for the carrier or recipient
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <Alert className="bg-blue-50 border-blue-200">
                <Info className="h-4 w-4 text-blue-500" />
                <AlertTitle className="text-blue-700">Order Completion</AlertTitle>
                <AlertDescription className="text-blue-600">
                  By submitting this shipping information, the order will be marked as completed.
                  {form.watch("notifyClient") && " The customer will be notified via email."}
                  {form.watch("notifySalesRep") && " The sales representative will also be notified."}
                </AlertDescription>
              </Alert>
              
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => id ? navigate(`/order-detail/${id}`) : navigate("/manufacturing-orders")}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={submitShippingMutation.isPending}
                >
                  {submitShippingMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <TruckIcon className="mr-2 h-4 w-4" />
                      Complete Shipment
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      {/* Shipping checklist */}
      <Card>
        <CardHeader>
          <CardTitle>Shipping Checklist</CardTitle>
          <CardDescription>
            Important steps to complete before shipping
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="bg-amber-100 p-2 rounded-full">
                  <ListChecks className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-medium">Pre-Shipping Checklist</h3>
                  <ul className="mt-2 space-y-2 text-sm">
                    <li className="flex items-center">
                      <CheckSquare className="h-4 w-4 text-green-500 mr-2" />
                      <span>Verify all items are included and counted correctly</span>
                    </li>
                    <li className="flex items-center">
                      <CheckSquare className="h-4 w-4 text-green-500 mr-2" />
                      <span>Confirm production quality has been checked and approved</span>
                    </li>
                    <li className="flex items-center">
                      <CheckSquare className="h-4 w-4 text-green-500 mr-2" />
                      <span>Package all items securely with appropriate padding</span>
                    </li>
                    <li className="flex items-center">
                      <CheckSquare className="h-4 w-4 text-green-500 mr-2" />
                      <span>Attach packing list with detailed item inventory</span>
                    </li>
                    <li className="flex items-center">
                      <CheckSquare className="h-4 w-4 text-green-500 mr-2" />
                      <span>Double-check shipping address for accuracy</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="bg-green-100 p-2 rounded-full">
                  <Printer className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium">Shipping Documents</h3>
                  <ul className="mt-2 space-y-2 text-sm">
                    <li className="flex items-center">
                      <FileText className="h-4 w-4 text-primary mr-2" />
                      <span>Include packing slip with order details</span>
                    </li>
                    <li className="flex items-center">
                      <FileText className="h-4 w-4 text-primary mr-2" />
                      <span>Print and attach shipping labels</span>
                    </li>
                    <li className="flex items-center">
                      <MapPin className="h-4 w-4 text-primary mr-2" />
                      <span>Include return address on all packages</span>
                    </li>
                    <li className="flex items-center">
                      <Mail className="h-4 w-4 text-primary mr-2" />
                      <span>Send notification emails with tracking info</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}