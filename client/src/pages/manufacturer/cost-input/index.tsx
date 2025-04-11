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
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft,
  DollarSign,
  Package,
  Save,
  CheckCircle,
  Clock,
  Ruler,
  ClipboardList,
  CircleAlert,
  CalendarIcon,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";

// Cost input schema
const costInputSchema = z.object({
  materialsCost: z.coerce.number().min(0, "Material costs cannot be negative"),
  laborCost: z.coerce.number().min(0, "Labor cost cannot be negative"),
  overheadCost: z.coerce.number().min(0, "Overhead cost cannot be negative"),
  additionalCosts: z.coerce.number().min(0, "Additional costs cannot be negative"),
  notes: z.string().optional(),
});

type CostInputValues = z.infer<typeof costInputSchema>;

export default function CostInput() {
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
          status: "pending",
          customerName: "Metro High School",
          productType: "Custom Baseball Uniform",
          itemCount: 25,
          totalCost: 0,
          receivedDate: new Date().toISOString(),
          deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          items: [
            {
              id: 1,
              type: "Jersey",
              size: "Adult M",
              quantity: 15,
              cost: 0,
              fabric: "Polyester blend"
            },
            {
              id: 2,
              type: "Pants",
              size: "Adult M",
              quantity: 10,
              cost: 0,
              fabric: "Polyester blend"
            }
          ]
        }
      };
    },
    enabled: !!id
  });
  
  // Initial form values
  const defaultValues: CostInputValues = {
    materialsCost: 0,
    laborCost: 0,
    overheadCost: 0,
    additionalCosts: 0,
    notes: ""
  };
  
  // Setup form
  const form = useForm<CostInputValues>({
    resolver: zodResolver(costInputSchema),
    defaultValues
  });
  
  // Save cost mutation
  const saveCostMutation = useMutation({
    mutationFn: async (values: CostInputValues) => {
      // This would post to API in production
      console.log("Submitting costs:", values);
      // Simulate API call
      return new Promise((resolve) => setTimeout(() => resolve({ success: true }), 1000));
    },
    onSuccess: () => {
      toast({
        title: "Cost information saved",
        description: "Production costs have been successfully updated.",
      });
      
      // If on a specific order detail page, navigate back to it
      if (id) {
        navigate(`/order-detail/${id}`);
      } else {
        // Otherwise go to the manufacturing orders page
        navigate("/manufacturing-orders");
      }
    },
    onError: (error) => {
      toast({
        title: "Error saving costs",
        description: "There was a problem updating the production costs. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  // Submit handler
  const onSubmit = (values: CostInputValues) => {
    saveCostMutation.mutateAsync(values);
  };
  
  // Calculate total cost
  const calculateTotal = () => {
    const values = form.getValues();
    return (
      Number(values.materialsCost || 0) +
      Number(values.laborCost || 0) +
      Number(values.overheadCost || 0) +
      Number(values.additionalCosts || 0)
    );
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
  
  const order = orderDetails?.data;
  
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
              {id ? `Cost Input for Order #${id}` : "Cost Input"}
            </h1>
            <p className="text-sm text-muted-foreground">
              Enter production costs for {order ? `order #${order.id}` : "manufacturing orders"}
            </p>
          </div>
        </div>
      </div>
      
      {/* Order details if specific order */}
      {order && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Order Details</CardTitle>
            <CardDescription>
              Information about the order for cost calculation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <div className="flex justify-between">
                  <Label className="text-muted-foreground">Customer:</Label>
                  <span className="font-medium">{order.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <Label className="text-muted-foreground">Product Type:</Label>
                  <span className="font-medium">{order.productType}</span>
                </div>
                <div className="flex justify-between">
                  <Label className="text-muted-foreground">Items:</Label>
                  <span className="font-medium">{order.itemCount}</span>
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between">
                  <Label className="text-muted-foreground">Order Received:</Label>
                  <span className="font-medium">{format(new Date(order.receivedDate), 'MMM d, yyyy')}</span>
                </div>
                <div className="flex justify-between">
                  <Label className="text-muted-foreground">Deadline:</Label>
                  <span className="font-medium">{format(new Date(order.deadline), 'MMM d, yyyy')}</span>
                </div>
                <div className="flex justify-between">
                  <Label className="text-muted-foreground">Status:</Label>
                  <Badge className="bg-blue-100 text-blue-800">
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </Badge>
                </div>
              </div>
            </div>
            
            {order.items && order.items.length > 0 && (
              <>
                <Separator className="my-4" />
                <div className="space-y-4">
                  <h3 className="font-medium">Items</h3>
                  <div className="grid gap-4">
                    {order.items.map((item: any) => (
                      <div key={item.id} className="border rounded-md p-3">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center">
                            <Package className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span className="font-medium">{item.type}</span>
                          </div>
                          <Badge variant="outline">Qty: {item.quantity}</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
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
      
      {/* Cost Input Form */}
      <Card>
        <CardHeader>
          <CardTitle>Production Cost Input</CardTitle>
          <CardDescription>
            Enter the detailed breakdown of production costs {order ? `for order #${order.id}` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="materialsCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Materials Cost</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input type="number" min="0" step="0.01" className="pl-8" {...field} />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Total cost of raw materials used
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="laborCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Labor Cost</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input type="number" min="0" step="0.01" className="pl-8" {...field} />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Cost of labor for production
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="overheadCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Overhead Cost</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input type="number" min="0" step="0.01" className="pl-8" {...field} />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Facility, utilities, and other overhead costs
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="additionalCosts"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Costs</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input type="number" min="0" step="0.01" className="pl-8" {...field} />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Any other costs not covered above
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cost Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Add any notes about the production costs here..." 
                        className="min-h-[100px]" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Optional details about the cost breakdown
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Total Production Cost</h3>
                    <div className="text-xl font-bold">${calculateTotal().toFixed(2)}</div>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Combined total of all production costs
                  </div>
                </CardContent>
              </Card>
              
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
                  disabled={saveCostMutation.isPending}
                >
                  {saveCostMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Submit Cost Information
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      {/* Cost tracking guidelines */}
      <Card>
        <CardHeader>
          <CardTitle>Cost Tracking Guidelines</CardTitle>
          <CardDescription>
            Important information about cost tracking in the manufacturing process
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert>
              <CircleAlert className="h-4 w-4" />
              <AlertTitle>Cost Tracking Requirements</AlertTitle>
              <AlertDescription>
                All production costs must be entered before production can begin. This ensures accurate 
                tracking and profitability analysis for each order.
              </AlertDescription>
            </Alert>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded p-4">
                <h3 className="font-medium mb-2 flex items-center">
                  <ClipboardList className="h-5 w-5 text-primary mr-2" />
                  Cost Breakdown Guidelines
                </h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Include all raw materials costs with accurate quantities</li>
                  <li>• Labor costs should include all production time</li>
                  <li>• Overhead costs should be proportional to production time</li>
                  <li>• Document any special circumstances in the notes section</li>
                </ul>
              </div>
              
              <div className="border rounded p-4">
                <h3 className="font-medium mb-2 flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  Benefits of Accurate Cost Tracking
                </h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Ensures proper pricing and profitability analysis</li>
                  <li>• Helps identify cost-saving opportunities</li>
                  <li>• Improves future quotes and estimates</li>
                  <li>• Enables better resource allocation</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}