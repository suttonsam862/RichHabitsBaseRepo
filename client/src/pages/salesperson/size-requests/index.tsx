import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  ArrowLeft, 
  Mail, 
  Send, 
  Ruler, 
  CheckCircle, 
  Clock, 
  FileText,
  ClipboardList,
  AlertCircle,
  Eye,
  RotateCcw
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link, useParams } from "wouter";

// Size request form schema
const sizeRequestSchema = z.object({
  orderId: z.number(),
  customerEmail: z.string().email("Invalid email address"),
  message: z.string().min(10, "Message must be at least 10 characters"),
  includeTemplates: z.boolean().default(true),
  includeMeasurementInstructions: z.boolean().default(true),
  dueDate: z.string().optional(),
});

type SizeRequestFormValues = z.infer<typeof sizeRequestSchema>;

export default function SizeRequests() {
  const [params] = useParams();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [requestFormOpen, setRequestFormOpen] = useState(false);
  
  // Fetch orders eligible for size requests (orders with design_approved status)
  const { data: eligibleOrders, isLoading: isLoadingOrders } = useQuery({
    queryKey: ['/api/orders/eligible-for-size-requests'],
    queryFn: async ({ queryKey }) => {
      const response = await apiRequest('GET', queryKey[0] as string);
      return response.json();
    },
  });
  
  // Fetch size requests
  const { data: sizeRequests, isLoading: isLoadingRequests } = useQuery({
    queryKey: ['/api/size-requests'],
    queryFn: async ({ queryKey }) => {
      const response = await apiRequest('GET', queryKey[0] as string);
      return response.json();
    },
  });
  
  // Create size request form
  const form = useForm<SizeRequestFormValues>({
    resolver: zodResolver(sizeRequestSchema),
    defaultValues: {
      orderId: 0,
      customerEmail: "",
      message: "Hello,\n\nIn order to proceed with production of your order, we need to collect accurate size information. Please follow the link below to provide your measurements.\n\nThank you for your cooperation.",
      includeTemplates: true,
      includeMeasurementInstructions: true,
      dueDate: "",
    },
  });
  
  // Create size request mutation
  const createSizeRequestMutation = useMutation({
    mutationFn: async (values: SizeRequestFormValues) => {
      const response = await apiRequest('POST', '/api/size-requests', values);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/size-requests'] });
      toast({
        title: "Size request sent",
        description: "The size request has been sent to the customer.",
      });
      setRequestFormOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send size request",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Resend size request mutation
  const resendSizeRequestMutation = useMutation({
    mutationFn: async (requestId: number) => {
      const response = await apiRequest('POST', `/api/size-requests/${requestId}/resend`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/size-requests'] });
      toast({
        title: "Size request resent",
        description: "The size request has been resent to the customer.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to resend size request",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle order selection for size request
  const handleSelectOrder = (order: any) => {
    setSelectedOrderId(order.id);
    form.setValue("orderId", order.id);
    form.setValue("customerEmail", order.customer?.email || "");
    setRequestFormOpen(true);
  };
  
  // Handle form submission
  const onSubmit = (values: SizeRequestFormValues) => {
    createSizeRequestMutation.mutate(values);
  };
  
  // Handle resending a size request
  const handleResendRequest = (requestId: number) => {
    resendSizeRequestMutation.mutate(requestId);
  };
  
  // Filter size requests by status
  const pendingRequests = sizeRequests?.data?.filter((req: any) => !req.completed) || [];
  const completedRequests = sizeRequests?.data?.filter((req: any) => req.completed) || [];
  
  // Render status badge
  const RequestStatusBadge = ({ request }: { request: any }) => {
    if (request.completed) {
      return <Badge className="bg-green-100 text-green-800 border-green-200">Completed</Badge>;
    } else if (request.opened) {
      return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Viewed</Badge>;
    } else {
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>;
    }
  };
  
  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="flex items-center mb-6">
        <Button variant="ghost" className="mr-4" asChild>
          <Link href="/orders">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Orders
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">Size Requests</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage size collection from customers for orders
          </p>
        </div>
      </div>
      
      {/* Request Form Dialog */}
      {requestFormOpen && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Create New Size Request</CardTitle>
            <CardDescription>
              Send an email to the customer requesting size information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="customerEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer Email*</FormLabel>
                      <FormControl>
                        <Input placeholder="customer@example.com" {...field} />
                      </FormControl>
                      <FormDescription>
                        The customer will receive an email at this address
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Message*</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter the message to send to the customer"
                          className="min-h-[120px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        This message will be included in the email to the customer
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="includeTemplates"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <input
                            type="checkbox"
                            className="h-4 w-4 mt-1"
                            checked={field.value}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Include Size Templates</FormLabel>
                          <FormDescription>
                            Attach printable measurement templates to the email
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="includeMeasurementInstructions"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <input
                            type="checkbox"
                            className="h-4 w-4 mt-1"
                            checked={field.value}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Include Instructions</FormLabel>
                          <FormDescription>
                            Attach detailed measurement instructions to the email
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Request Due Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormDescription>
                        Optional deadline for the customer to submit measurements
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="hidden">
                  <FormField
                    control={form.control}
                    name="orderId"
                    render={({ field }) => (
                      <Input type="hidden" {...field} />
                    )}
                  />
                </div>
                
                <div className="flex justify-end gap-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setRequestFormOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={createSizeRequestMutation.isPending}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    {createSizeRequestMutation.isPending ? "Sending..." : "Send Request"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
      
      <Tabs defaultValue="pending" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="pending">Pending Requests</TabsTrigger>
          <TabsTrigger value="completed">Completed Requests</TabsTrigger>
          <TabsTrigger value="eligible">Eligible Orders</TabsTrigger>
        </TabsList>
        
        {/* Pending Requests Tab */}
        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pending Size Requests</CardTitle>
              <CardDescription>
                Size requests that have been sent but not yet completed by the customer
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingRequests ? (
                <div className="text-center py-4">Loading size requests...</div>
              ) : pendingRequests.length > 0 ? (
                <div className="space-y-4">
                  {pendingRequests.map((request: any) => (
                    <div key={request.id} className="border rounded-lg p-4">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-medium">Order #{request.orderId}</h3>
                            <RequestStatusBadge request={request} />
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                            <div className="flex items-center text-sm text-gray-600">
                              <Mail className="h-4 w-4 mr-2 text-gray-400" />
                              {request.customerEmail}
                            </div>
                            
                            <div className="flex items-center text-sm text-gray-600">
                              <Clock className="h-4 w-4 mr-2 text-gray-400" />
                              Sent {request.createdAt
                                ? formatDistanceToNow(new Date(request.createdAt)) + ' ago'
                                : 'recently'}
                            </div>
                            
                            {request.dueDate && (
                              <div className="flex items-center text-sm text-gray-600">
                                <AlertCircle className="h-4 w-4 mr-2 text-gray-400" />
                                Due by {new Date(request.dueDate).toLocaleDateString()}
                              </div>
                            )}
                            
                            {request.opened && (
                              <div className="flex items-center text-sm text-gray-600">
                                <Eye className="h-4 w-4 mr-2 text-blue-500" />
                                Viewed {request.openedAt
                                  ? formatDistanceToNow(new Date(request.openedAt)) + ' ago'
                                  : 'recently'}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="mt-4 md:mt-0 md:ml-4 flex flex-col gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleResendRequest(request.id)}
                            disabled={resendSizeRequestMutation.isPending}
                          >
                            <RotateCcw className="mr-1 h-4 w-4" />
                            Resend
                          </Button>
                          
                          <Button asChild size="sm" variant="default">
                            <Link href={`/orders/${request.orderId}`}>
                              <Eye className="mr-1 h-4 w-4" />
                              View Order
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
                    <Mail className="h-6 w-6 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium">No pending size requests</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    You don't have any size requests waiting for customer response
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setActiveTab("eligible")}
                  >
                    Create New Request
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Completed Requests Tab */}
        <TabsContent value="completed">
          <Card>
            <CardHeader>
              <CardTitle>Completed Size Requests</CardTitle>
              <CardDescription>
                Size requests that have been completed by the customer
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingRequests ? (
                <div className="text-center py-4">Loading completed requests...</div>
              ) : completedRequests.length > 0 ? (
                <div className="space-y-4">
                  {completedRequests.map((request: any) => (
                    <div key={request.id} className="border rounded-lg p-4">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-medium">Order #{request.orderId}</h3>
                            <Badge className="bg-green-100 text-green-800">Completed</Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                            <div className="flex items-center text-sm text-gray-600">
                              <Mail className="h-4 w-4 mr-2 text-gray-400" />
                              {request.customerEmail}
                            </div>
                            
                            <div className="flex items-center text-sm text-gray-600">
                              <Clock className="h-4 w-4 mr-2 text-gray-400" />
                              Sent {request.createdAt
                                ? formatDistanceToNow(new Date(request.createdAt)) + ' ago'
                                : 'recently'}
                            </div>
                            
                            <div className="flex items-center text-sm text-gray-600">
                              <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                              Completed {request.completedAt
                                ? formatDistanceToNow(new Date(request.completedAt)) + ' ago'
                                : 'recently'}
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-4 md:mt-0 md:ml-4">
                          <Button asChild size="sm" variant="default">
                            <Link href={`/orders/${request.orderId}`}>
                              <Eye className="mr-1 h-4 w-4" />
                              View Order
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
                  <h3 className="text-lg font-medium">No completed size requests</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    No customers have completed their size requests yet
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Eligible Orders Tab */}
        <TabsContent value="eligible">
          <Card>
            <CardHeader>
              <CardTitle>Orders Eligible for Size Requests</CardTitle>
              <CardDescription>
                Orders that are ready for size collection from customers
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingOrders ? (
                <div className="text-center py-4">Loading eligible orders...</div>
              ) : eligibleOrders?.data?.length > 0 ? (
                <div className="space-y-4">
                  {eligibleOrders.data.map((order: any) => (
                    <div key={order.id} className="border rounded-lg p-4">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-medium">Order #{order.id}</h3>
                            <Badge className="bg-blue-100 text-blue-800">Ready for Sizes</Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                            <div className="flex items-center text-sm text-gray-600">
                              <FileText className="h-4 w-4 mr-2 text-gray-400" />
                              {order.product?.name || 'Custom Product'}
                            </div>
                            
                            <div className="flex items-center text-sm text-gray-600">
                              <Mail className="h-4 w-4 mr-2 text-gray-400" />
                              {order.customer?.email || 'No email provided'}
                            </div>
                            
                            <div className="flex items-center text-sm text-gray-600">
                              <Ruler className="h-4 w-4 mr-2 text-gray-400" />
                              {order.itemCount || '0'} items need sizing
                            </div>
                          </div>
                          
                          <div className="mt-3">
                            <p className="text-sm text-gray-600">
                              Customer: {order.customer?.name || 'Unknown'}
                              {order.customer?.company ? ` (${order.customer.company})` : ''}
                            </p>
                          </div>
                        </div>
                        
                        <div className="mt-4 md:mt-0 md:ml-4 flex flex-col gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleSelectOrder(order)}
                          >
                            <Send className="mr-1 h-4 w-4" />
                            Request Sizes
                          </Button>
                          
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/orders/${order.id}`}>
                              <Eye className="mr-1 h-4 w-4" />
                              View Order
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
                    <ClipboardList className="h-6 w-6 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium">No eligible orders</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    No orders are currently eligible for size collection
                  </p>
                  <p className="text-sm text-gray-500">
                    Orders become eligible after the design is approved
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Quick Guide */}
      <div className="mt-6">
        <Alert>
          <Ruler className="h-4 w-4" />
          <AlertTitle>Size Collection Guide</AlertTitle>
          <AlertDescription>
            <ul className="mt-2 ml-4 list-disc space-y-1 text-sm">
              <li>Size requests can be sent after design approval</li>
              <li>Customers receive an email with a secure link to submit their measurements</li>
              <li>You'll be notified when a customer submits their measurements</li>
              <li>Accurate sizes are crucial for production quality</li>
            </ul>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}