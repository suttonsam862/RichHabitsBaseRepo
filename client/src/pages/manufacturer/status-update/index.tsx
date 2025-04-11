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
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft,
  ArrowRight,
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
  Hammer,
  Scissors,
  Info,
  SendIcon,
  RotateCcw,
  Percent,
} from "lucide-react";
import { format } from "date-fns";

// Status update schema
const statusUpdateSchema = z.object({
  status: z.enum(["pending", "in_production", "ready_to_ship", "completed"]),
  productionStage: z.string().min(1, "Production stage is required"),
  progress: z.coerce.number().min(0, "Progress cannot be negative").max(100, "Progress cannot exceed 100%"),
  qualityCheck: z.enum(["not_started", "in_progress", "passed", "issues_found"]),
  notes: z.string().optional(),
  estimatedCompletion: z.string().optional(),
  productionIssues: z.boolean(),
  issueDescription: z.string().optional(),
});

type StatusUpdateValues = z.infer<typeof statusUpdateSchema>;

// List of production stages
const productionStages = [
  { value: "material_preparation", label: "Material Preparation" },
  { value: "cutting", label: "Cutting" },
  { value: "assembly", label: "Assembly" },
  { value: "stitching", label: "Stitching" },
  { value: "printing", label: "Printing/Decoration" },
  { value: "quality_check", label: "Quality Check" },
  { value: "finishing", label: "Finishing" },
  { value: "packaging", label: "Packaging" },
  { value: "ready_to_ship", label: "Ready to Ship" },
];

export default function StatusUpdate() {
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
          status: "in_production",
          customerName: "Metro High School",
          productType: "Custom Baseball Uniform",
          itemCount: 25,
          totalCost: 1875.00,
          unitCost: 75.00,
          receivedDate: new Date().toISOString(),
          deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          productionStage: "cutting",
          progress: 45,
          qualityCheck: "not_started",
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
  
  // Initial form values
  const defaultValues: StatusUpdateValues = {
    status: order?.status || "pending",
    productionStage: order?.productionStage || "",
    progress: order?.progress || 0,
    qualityCheck: order?.qualityCheck || "not_started",
    notes: "",
    estimatedCompletion: order?.deadline ? format(new Date(order.deadline), 'yyyy-MM-dd') : "",
    productionIssues: false,
    issueDescription: "",
  };
  
  // Setup form
  const form = useForm<StatusUpdateValues>({
    resolver: zodResolver(statusUpdateSchema),
    defaultValues
  });
  
  // Watch for status changes to show/hide conditional fields
  const hasIssues = form.watch("productionIssues");
  const currentStatus = form.watch("status");
  const currentProgress = form.watch("progress");
  
  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (values: StatusUpdateValues) => {
      // This would post to API in production
      console.log("Submitting status update:", values);
      // Simulate API call
      return new Promise((resolve) => setTimeout(() => resolve({ success: true }), 1000));
    },
    onSuccess: () => {
      toast({
        title: "Production status updated",
        description: "The order status has been successfully updated.",
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
        title: "Error updating status",
        description: "There was a problem updating the production status. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  // Submit handler
  const onSubmit = (values: StatusUpdateValues) => {
    // If moving to ready_to_ship but quality check isn't passed, show warning
    if (values.status === "ready_to_ship" && values.qualityCheck !== "passed") {
      toast({
        title: "Quality check required",
        description: "Orders must pass quality check before being marked as ready to ship.",
        variant: "destructive"
      });
      return;
    }
    
    // If production stage is ready_to_ship, ensure status matches
    if (values.productionStage === "ready_to_ship" && values.status !== "ready_to_ship") {
      values.status = "ready_to_ship";
    }
    
    // If progress is 100%, ensure production stage is at least at quality check
    if (values.progress === 100 && !["quality_check", "finishing", "packaging", "ready_to_ship"].includes(values.productionStage)) {
      toast({
        title: "Progress inconsistency",
        description: "100% progress should only be set when the order is at quality check or later stages.",
        variant: "destructive"
      });
      return;
    }
    
    updateStatusMutation.mutateAsync(values);
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
              {id ? `Production Status Update for Order #${id}` : "Production Status Update"}
            </h1>
            <p className="text-sm text-muted-foreground">
              Update the production status and progress {order ? `for order #${order.id}` : "for manufacturing orders"}
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
                  Information about the order being updated
                </CardDescription>
              </div>
              <Badge className={
                order.status === "pending" ? "bg-blue-100 text-blue-800" : 
                order.status === "in_production" ? "bg-amber-100 text-amber-800" :
                order.status === "ready_to_ship" ? "bg-green-100 text-green-800" :
                "bg-purple-100 text-purple-800"
              }>
                {order.status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
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
                  <Label className="text-muted-foreground">Current Stage:</Label>
                  <span className="font-medium">
                    {productionStages.find(stage => stage.value === order.productionStage)?.label || "Not Started"}
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-1">
                  <Label className="text-muted-foreground">Deadline:</Label>
                  <span className="font-medium">{format(new Date(order.deadline), 'MMM d, yyyy')}</span>
                </div>
                <div className="grid grid-cols-2 gap-1">
                  <Label className="text-muted-foreground">Total Cost:</Label>
                  <span className="font-medium">${order.totalCost.toFixed(2)}</span>
                </div>
                <div className="grid grid-cols-2 gap-1">
                  <Label className="text-muted-foreground">Current Progress:</Label>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>{order.progress}% complete</span>
                    </div>
                    <Progress value={order.progress} className="h-2" />
                  </div>
                </div>
              </div>
            </div>
            
            {order.items && order.items.length > 0 && (
              <>
                <Separator className="my-4" />
                <div className="space-y-2">
                  <h3 className="font-medium">Items Being Produced</h3>
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
                            <span className="text-muted-foreground mr-1">Cost:</span>
                            <span>${item.cost.toFixed(2)}</span>
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
      
      {/* Status Update Form */}
      <Card>
        <CardHeader>
          <CardTitle>Update Production Status</CardTitle>
          <CardDescription>
            Track the current status, progress, and any issues with the production process
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Order Status</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select current order status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="in_production">In Production</SelectItem>
                          <SelectItem value="ready_to_ship">Ready to Ship</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Current overall status of the order
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="productionStage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Production Stage</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select production stage" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {productionStages.map((stage) => (
                            <SelectItem key={stage.value} value={stage.value}>
                              {stage.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Current stage in the production process
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="progress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Production Progress (%)</FormLabel>
                      <div className="space-y-2">
                        <FormControl>
                          <div className="relative">
                            <Percent className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input 
                              type="number" 
                              min="0" 
                              max="100" 
                              className="pl-8" 
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <Progress value={field.value} className="h-2" />
                      </div>
                      <FormDescription>
                        Estimated completion percentage
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="qualityCheck"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quality Check Status</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select quality check status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="not_started">Not Started</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="passed">Passed</SelectItem>
                          <SelectItem value="issues_found">Issues Found</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Current status of quality control inspection
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="estimatedCompletion"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Estimated Completion Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormDescription>
                        Expected date of production completion
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="productionIssues"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Production Issues</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={(value) => field.onChange(value === "true")}
                          defaultValue={field.value ? "true" : "false"}
                          className="flex flex-row space-x-4"
                        >
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="false" />
                            </FormControl>
                            <FormLabel className="font-normal">No issues</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="true" />
                            </FormControl>
                            <FormLabel className="font-normal">Yes, there are issues</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormDescription>
                        Indicate if there are any issues affecting production
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {hasIssues && (
                <FormField
                  control={form.control}
                  name="issueDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Issue Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe the production issues in detail..." 
                          className="min-h-[100px]" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Provide details about the issues affecting production
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Production Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Add any notes about the production process here..." 
                        className="min-h-[100px]" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Additional information about the current production status
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Progress summary */}
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Production Summary</h3>
                    <div>
                      <Badge className={
                        currentStatus === "pending" ? "bg-blue-100 text-blue-800" : 
                        currentStatus === "in_production" ? "bg-amber-100 text-amber-800" :
                        currentStatus === "ready_to_ship" ? "bg-green-100 text-green-800" :
                        "bg-purple-100 text-purple-800"
                      }>
                        {currentStatus.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </Badge>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Current Progress</span>
                      <span>{currentProgress}%</span>
                    </div>
                    <Progress value={currentProgress} className="h-2" />
                  </div>
                </CardContent>
              </Card>
              
              {currentStatus === "ready_to_ship" && form.watch("qualityCheck") !== "passed" && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Quality Check Required</AlertTitle>
                  <AlertDescription>
                    Orders must pass quality check before being marked as ready to ship.
                  </AlertDescription>
                </Alert>
              )}
              
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
                  disabled={updateStatusMutation.isPending}
                >
                  {updateStatusMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Update Status
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      {/* Production Stage Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Production Stage Guide</CardTitle>
          <CardDescription>
            Overview of the production stages and workflow
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="relative pl-8 space-y-6 py-2">
              {/* Vertical line */}
              <div className="absolute top-0 left-3 bottom-0 border-l-2 border-dashed border-gray-200"></div>
              
              {productionStages.map((stage, index) => (
                <div key={stage.value} className="relative">
                  {/* Timeline dot */}
                  <div className={`absolute -left-5 mt-1.5 w-4 h-4 rounded-full ${
                    form.watch("productionStage") === stage.value 
                      ? "bg-primary" 
                      : productionStages.findIndex(s => s.value === form.watch("productionStage")) > index
                      ? "bg-green-500"
                      : "bg-gray-200"
                  }`}></div>
                  
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className={`font-medium ${form.watch("productionStage") === stage.value ? "text-primary" : ""}`}>{stage.label}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {stage.value === "material_preparation" && "Preparing all required materials and components"}
                        {stage.value === "cutting" && "Cutting fabric according to patterns and specifications"}
                        {stage.value === "assembly" && "Assembling cut pieces according to design"}
                        {stage.value === "stitching" && "Stitching and sewing components together"}
                        {stage.value === "printing" && "Adding prints, embroidery, or decorations"}
                        {stage.value === "quality_check" && "Performing quality control checks"}
                        {stage.value === "finishing" && "Final touches and finishing work"}
                        {stage.value === "packaging" && "Packaging items for shipping"}
                        {stage.value === "ready_to_ship" && "Order is ready for shipment"}
                      </p>
                    </div>
                    {form.watch("productionStage") === stage.value && (
                      <Badge variant="outline" className="bg-primary/10 border-primary/20 text-primary">
                        Current Stage
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Production Workflow</AlertTitle>
              <AlertDescription>
                Update the production status regularly to keep all stakeholders informed about order progress.
                Quality checks must be passed before an order can be marked as ready to ship.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}