import React, { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  ArrowLeft,
  Plus,
  Trash2,
  DollarSign,
  ShoppingBag,
  User,
  Building,
  Phone,
  Mail,
  Check,
  Info,
  AlertCircle,
} from "lucide-react";

// Order form validation schema
const orderFormSchema = z.object({
  customerName: z.string().min(2, "Customer name is required"),
  customerEmail: z.string().email("Invalid email address").optional().or(z.literal("")),
  customerPhone: z.string().optional().or(z.literal("")),
  company: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  organizationId: z.string().optional(),
  leadId: z.string().optional(),
  items: z.array(
    z.object({
      productId: z.string().min(1, "Product selection is required"),
      quantity: z.string().min(1, "Quantity is required"),
      size: z.string().optional(),
      color: z.string().optional(),
      design: z.string().optional(),
      notes: z.string().optional(),
    })
  ).min(1, "At least one order item is required"),
  shipping: z.object({
    address: z.string().min(1, "Shipping address is required"),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    zip: z.string().min(1, "Zip code is required"),
    specialInstructions: z.string().optional(),
  }),
  billingIsSame: z.boolean().default(true),
  billing: z.object({
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zip: z.string().optional(),
  }).optional(),
  urgentOrder: z.boolean().default(false),
  tentativeDeliveryDate: z.string().optional(),
});

type OrderFormValues = z.infer<typeof orderFormSchema>;

const defaultOrderItem = {
  productId: "",
  quantity: "1",
  size: "",
  color: "",
  design: "",
  notes: "",
};

export default function CreateOrder() {
  const { toast } = useToast();
  const [location, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("customer-info");
  const [formSubmitted, setFormSubmitted] = useState(false);
  
  // Extract lead ID from URL query parameter if available
  const searchParams = new URLSearchParams(window.location.search);
  const leadIdFromUrl = searchParams.get('lead');
  
  // Get lead data if lead ID is provided
  const { data: leadData, isLoading: isLoadingLead } = useQuery({
    queryKey: ['/api/leads', leadIdFromUrl],
    queryFn: async ({ queryKey }) => {
      if (!leadIdFromUrl) return null;
      const response = await apiRequest('GET', `/api/leads/${leadIdFromUrl}`);
      return response.json();
    },
    enabled: !!leadIdFromUrl,
  });
  
  // Fetch catalog products
  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['/api/catalog'],
    queryFn: async ({ queryKey }) => {
      const response = await apiRequest('GET', queryKey[0] as string);
      return response.json();
    }
  });
  
  // Fetch organizations
  const { data: organizations, isLoading: isLoadingOrganizations } = useQuery({
    queryKey: ['/api/organizations'],
    queryFn: async ({ queryKey }) => {
      const response = await apiRequest('GET', queryKey[0] as string);
      return response.json();
    }
  });
  
  // Form initialization with optional lead data
  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      company: "",
      notes: "",
      organizationId: "",
      leadId: leadIdFromUrl || "",
      items: [defaultOrderItem],
      shipping: {
        address: "",
        city: "",
        state: "",
        zip: "",
        specialInstructions: "",
      },
      billingIsSame: true,
      billing: {
        address: "",
        city: "",
        state: "",
        zip: "",
      },
      urgentOrder: false,
      tentativeDeliveryDate: "",
    }
  });
  
  // Populate form with lead data if available
  useEffect(() => {
    if (leadData?.data) {
      const lead = leadData.data;
      form.setValue('customerName', lead.fullName || "");
      form.setValue('customerEmail', lead.email || "");
      form.setValue('customerPhone', lead.phone || "");
      form.setValue('company', lead.company || "");
      form.setValue('notes', lead.notes || "");
      form.setValue('organizationId', lead.organizationId?.toString() || "");
    }
  }, [leadData, form]);
  
  // Update billing fields based on billingIsSame checkbox
  const watchBillingIsSame = form.watch("billingIsSame");
  
  useEffect(() => {
    if (watchBillingIsSame) {
      form.setValue('billing.address', form.getValues('shipping.address'));
      form.setValue('billing.city', form.getValues('shipping.city'));
      form.setValue('billing.state', form.getValues('shipping.state'));
      form.setValue('billing.zip', form.getValues('shipping.zip'));
    }
  }, [watchBillingIsSame, form]);
  
  // Add a new order item
  const addOrderItem = () => {
    const currentItems = form.getValues("items") || [];
    form.setValue("items", [...currentItems, defaultOrderItem]);
  };
  
  // Remove an order item
  const removeOrderItem = (index: number) => {
    const currentItems = form.getValues("items");
    if (currentItems.length > 1) {
      form.setValue("items", currentItems.filter((_, i) => i !== index));
    } else {
      toast({
        title: "Cannot remove item",
        description: "An order must have at least one item",
        variant: "destructive",
      });
    }
  };
  
  // Handle form submission
  const createOrderMutation = useMutation({
    mutationFn: async (values: OrderFormValues) => {
      const response = await apiRequest('POST', '/api/orders', values);
      return response.json();
    },
    onSuccess: (data) => {
      setFormSubmitted(true);
      toast({
        title: "Order created successfully",
        description: `Order #${data.id} has been created and submitted for processing.`,
      });
      
      // Navigate to the order details page
      setTimeout(() => {
        navigate(`/orders/${data.id}`);
      }, 2000);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create order",
        description: error.message || "There was an error creating your order. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (values: OrderFormValues) => {
    // If billingIsSame is true, copy shipping address to billing
    if (values.billingIsSame) {
      values.billing = values.shipping;
    }
    
    createOrderMutation.mutate(values);
  };
  
  // Navigate between tabs
  const goToNextTab = () => {
    if (activeTab === "customer-info") {
      // Validate the customer info fields before proceeding
      const isValid = form.trigger(['customerName', 'customerEmail', 'customerPhone', 'company', 'notes', 'organizationId']);
      if (isValid) {
        setActiveTab("order-items");
      }
    } else if (activeTab === "order-items") {
      // Validate the order items before proceeding
      const isValid = form.trigger(['items']);
      if (isValid) {
        setActiveTab("shipping-billing");
      }
    }
  };
  
  const goToPreviousTab = () => {
    if (activeTab === "order-items") {
      setActiveTab("customer-info");
    } else if (activeTab === "shipping-billing") {
      setActiveTab("order-items");
    }
  };
  
  // Render product select options
  const renderProductOptions = () => {
    if (!products || !products.data) return null;
    
    return products.data.map((product: any) => (
      <SelectItem key={product.id} value={product.id.toString()}>
        {product.name} (${product.basePrice.toFixed(2)})
      </SelectItem>
    ));
  };
  
  // Render organization select options
  const renderOrganizationOptions = () => {
    if (!organizations || !organizations.data) return null;
    
    return organizations.data.map((org: any) => (
      <SelectItem key={org.id} value={org.id.toString()}>
        {org.name}
      </SelectItem>
    ));
  };
  
  // If form was submitted successfully, show success message
  if (formSubmitted) {
    return (
      <div className="container mx-auto py-8 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-green-600">Order Created Successfully</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="rounded-full bg-green-100 p-3 w-12 h-12 mx-auto mb-4">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <p className="mb-6">Your order has been created and is now being processed. You'll be redirected to the order details page shortly.</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="flex items-center mb-6">
        <Button variant="ghost" className="mr-4" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">Create New Order</h1>
          <p className="text-sm text-gray-500 mt-1">
            Fill out the details to create a new customer order
          </p>
        </div>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          {/* Lead info banner if coming from a lead */}
          {leadData?.data && (
            <Alert className="mb-6">
              <Info className="h-4 w-4" />
              <AlertTitle>Creating order from lead</AlertTitle>
              <AlertDescription>
                You're creating an order for lead: <strong>{leadData.data.fullName}</strong>. 
                The customer information has been pre-filled based on the lead data.
              </AlertDescription>
            </Alert>
          )}
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6 grid w-full grid-cols-3">
              <TabsTrigger value="customer-info">Customer Info</TabsTrigger>
              <TabsTrigger value="order-items">Order Items</TabsTrigger>
              <TabsTrigger value="shipping-billing">Shipping & Billing</TabsTrigger>
            </TabsList>
            
            {/* Customer Info Tab */}
            <TabsContent value="customer-info">
              <Card>
                <CardHeader>
                  <CardTitle>Customer Information</CardTitle>
                  <CardDescription>
                    Enter the customer's contact information and any relevant notes
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="customerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer Name*</FormLabel>
                        <FormControl>
                          <Input placeholder="Full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="customerEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="email@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="customerPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input placeholder="(555) 123-4567" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="company"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company/Organization</FormLabel>
                        <FormControl>
                          <Input placeholder="Company name (if applicable)" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="organizationId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Link to Organization</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select an organization (optional)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">None</SelectItem>
                            {renderOrganizationOptions()}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Associate this order with an existing organization
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Notes</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Add any additional information about the customer or order"
                            className="min-h-[100px]" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Hidden field for leadId */}
                  <FormField
                    control={form.control}
                    name="leadId"
                    render={({ field }) => (
                      <input type="hidden" {...field} />
                    )}
                  />
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button type="button" onClick={goToNextTab}>
                    Continue to Order Items
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            {/* Order Items Tab */}
            <TabsContent value="order-items">
              <Card>
                <CardHeader>
                  <CardTitle>Order Items</CardTitle>
                  <CardDescription>
                    Add the products that the customer wants to order
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* If products are loading, show loading message */}
                  {isLoadingProducts ? (
                    <div className="text-center py-4">Loading products...</div>
                  ) : (
                    <div className="space-y-6">
                      {form.getValues("items").map((_, index) => (
                        <div key={index} className="border p-4 rounded-lg">
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="font-medium">Item #{index + 1}</h3>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeOrderItem(index)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" /> Remove
                            </Button>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name={`items.${index}.productId`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Product*</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select a product" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {renderProductOptions()}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name={`items.${index}.quantity`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Quantity*</FormLabel>
                                  <FormControl>
                                    <Input type="number" min="1" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <FormField
                              control={form.control}
                              name={`items.${index}.size`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Size</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Size (if applicable)" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name={`items.${index}.color`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Color</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Color (if applicable)" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <div className="mt-4">
                            <FormField
                              control={form.control}
                              name={`items.${index}.design`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Design/Style Notes</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Design specifications" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <div className="mt-4">
                            <FormField
                              control={form.control}
                              name={`items.${index}.notes`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Item Notes</FormLabel>
                                  <FormControl>
                                    <Textarea
                                      placeholder="Additional notes about this specific item"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      ))}
                      
                      <Button
                        type="button"
                        variant="outline"
                        onClick={addOrderItem}
                        className="w-full"
                      >
                        <Plus className="mr-2 h-4 w-4" /> Add Another Item
                      </Button>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button type="button" variant="outline" onClick={goToPreviousTab}>
                    Back to Customer Info
                  </Button>
                  <Button type="button" onClick={goToNextTab}>
                    Continue to Shipping & Billing
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            {/* Shipping & Billing Tab */}
            <TabsContent value="shipping-billing">
              <Card>
                <CardHeader>
                  <CardTitle>Shipping & Billing Details</CardTitle>
                  <CardDescription>
                    Enter the shipping information and billing details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Shipping Information */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Shipping Information</h3>
                    
                    <FormField
                      control={form.control}
                      name="shipping.address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Street Address*</FormLabel>
                          <FormControl>
                            <Input placeholder="123 Main St" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <FormField
                        control={form.control}
                        name="shipping.city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City*</FormLabel>
                            <FormControl>
                              <Input placeholder="City" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="shipping.state"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>State*</FormLabel>
                              <FormControl>
                                <Input placeholder="State" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="shipping.zip"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Zip Code*</FormLabel>
                              <FormControl>
                                <Input placeholder="12345" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <FormField
                        control={form.control}
                        name="shipping.specialInstructions"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Special Delivery Instructions</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Any special instructions for delivery"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Billing Information */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Billing Information</h3>
                    
                    <FormField
                      control={form.control}
                      name="billingIsSame"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 mb-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Billing address is the same as shipping address</FormLabel>
                            <FormDescription>
                              Uncheck this if you need to enter a different billing address
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    {!form.watch("billingIsSame") && (
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="billing.address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Billing Address</FormLabel>
                              <FormControl>
                                <Input placeholder="123 Main St" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="billing.city"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>City</FormLabel>
                                <FormControl>
                                  <Input placeholder="City" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="billing.state"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>State</FormLabel>
                                  <FormControl>
                                    <Input placeholder="State" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="billing.zip"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Zip Code</FormLabel>
                                  <FormControl>
                                    <Input placeholder="12345" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <Separator />
                  
                  {/* Order Options */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Order Options</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="urgentOrder"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Mark as Urgent Order</FormLabel>
                              <FormDescription>
                                This will flag the order for expedited processing
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="tentativeDeliveryDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Requested Delivery Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormDescription>
                              Optional target date for delivery
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button type="button" variant="outline" onClick={goToPreviousTab}>
                    Back to Order Items
                  </Button>
                  <Button 
                    type="submit"
                    disabled={createOrderMutation.isPending}
                  >
                    {createOrderMutation.isPending ? "Submitting..." : "Submit Order"}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </form>
      </Form>
      
      {/* Order Creation Guide */}
      <div className="mt-6">
        <Alert variant="outline">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Order Creation Guide</AlertTitle>
          <AlertDescription>
            <ul className="mt-2 ml-4 list-disc space-y-1 text-sm">
              <li>Complete all required fields marked with an asterisk (*)</li>
              <li>Add as many order items as needed for this customer</li>
              <li>Provide accurate shipping information to ensure delivery</li>
              <li>Once submitted, the order will be sent to the design team</li>
            </ul>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}