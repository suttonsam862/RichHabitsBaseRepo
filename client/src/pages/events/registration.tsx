import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { useParams } from "wouter/react";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Calendar, Edit, Trash2, Download, Upload, RefreshCw } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useHasPermission } from "@/lib/permissions-helper";
import { PageHeader } from "@/components/page-header";
import { PaginationBar } from "@/components/pagination-bar";

// Form validation schemas
const tierFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  price: z.coerce.number().positive("Price must be greater than 0"),
  maxParticipants: z.coerce.number().int().nonnegative().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  isActive: z.boolean().default(true),
  shopifyProductId: z.string().optional(),
  shopifyVariantId: z.string().optional(),
});

const shopifyImportSchema = z.object({
  shopName: z.string().min(1, "Shop name is required"),
  apiKey: z.string().min(1, "API key is required"),
  accessToken: z.string().min(1, "Access token is required"),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  productId: z.string().optional(),
});

function RegistrationManagement() {
  const { campId } = useParams();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("tiers");
  const [isAddTierOpen, setIsAddTierOpen] = useState(false);
  const [isEditTierOpen, setIsEditTierOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  
  const isAdmin = useHasPermission("MANAGE_EVENTS");
  
  // Get camp details
  const { data: camp, isLoading: isLoadingCamp } = useQuery({
    queryKey: ["/api/camps", Number(campId)],
    enabled: !!campId,
  });
  
  // Get registration tiers
  const { data: tiers, isLoading: isLoadingTiers } = useQuery({
    queryKey: ["/api/camp", campId, "registration-tiers"],
    enabled: !!campId,
  });
  
  // Get registrations
  const { data: registrationsData, isLoading: isLoadingRegistrations } = useQuery({
    queryKey: ["/api/camp", campId, "registrations"],
    enabled: !!campId,
  });
  
  // Format registrations data with pagination
  const registrations = registrationsData?.data || [];
  const totalPages = Math.ceil(registrations.length / pageSize);
  const paginatedRegistrations = registrations.slice((page - 1) * pageSize, page * pageSize);
  
  // Form for adding/editing registration tiers
  const tierForm = useForm({
    resolver: zodResolver(tierFormSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      maxParticipants: undefined,
      startDate: "",
      endDate: "",
      isActive: true,
      shopifyProductId: "",
      shopifyVariantId: "",
    }
  });
  
  // Reset form when dialog closes
  React.useEffect(() => {
    if (!isAddTierOpen && !isEditTierOpen) {
      tierForm.reset();
    }
  }, [isAddTierOpen, isEditTierOpen, tierForm]);
  
  // Set form values when editing a tier
  React.useEffect(() => {
    if (selectedTier && isEditTierOpen) {
      tierForm.reset({
        name: selectedTier.name,
        description: selectedTier.description || "",
        price: selectedTier.price,
        maxParticipants: selectedTier.maxParticipants || undefined,
        startDate: selectedTier.startDate ? new Date(selectedTier.startDate).toISOString().slice(0, 10) : "",
        endDate: selectedTier.endDate ? new Date(selectedTier.endDate).toISOString().slice(0, 10) : "",
        isActive: selectedTier.isActive,
        shopifyProductId: selectedTier.shopifyProductId || "",
        shopifyVariantId: selectedTier.shopifyVariantId || "",
      });
    }
  }, [selectedTier, isEditTierOpen, tierForm]);
  
  // Form for Shopify import
  const shopifyImportForm = useForm({
    resolver: zodResolver(shopifyImportSchema),
    defaultValues: {
      shopName: "",
      apiKey: "",
      accessToken: "",
      dateFrom: "",
      dateTo: "",
      productId: "",
    }
  });
  
  // Create tier mutation
  const createTierMutation = useMutation({
    mutationFn: async (data) => {
      const response = await apiRequest(
        "POST", 
        `/api/camp/${campId}/registration-tiers`,
        data
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Registration tier created",
        description: "The registration tier has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/camp", campId, "registration-tiers"] });
      setIsAddTierOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error creating registration tier",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Update tier mutation
  const updateTierMutation = useMutation({
    mutationFn: async (data) => {
      const { id, ...tierData } = data;
      const response = await apiRequest(
        "PUT", 
        `/api/registration-tiers/${id}`,
        tierData
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Registration tier updated",
        description: "The registration tier has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/camp", campId, "registration-tiers"] });
      setIsEditTierOpen(false);
      setSelectedTier(null);
    },
    onError: (error) => {
      toast({
        title: "Error updating registration tier",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Delete tier mutation
  const deleteTierMutation = useMutation({
    mutationFn: async (id) => {
      const response = await apiRequest(
        "DELETE", 
        `/api/registration-tiers/${id}`
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Registration tier deleted",
        description: "The registration tier has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/camp", campId, "registration-tiers"] });
    },
    onError: (error) => {
      toast({
        title: "Error deleting registration tier",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Import Shopify orders mutation
  const importShopifyMutation = useMutation({
    mutationFn: async (data) => {
      const response = await apiRequest(
        "POST", 
        `/api/camp/${campId}/import-shopify-orders`,
        data
      );
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Shopify orders imported",
        description: `Imported ${data.data.newRegistrations} new registrations and updated ${data.data.updatedRegistrations} existing registrations.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/camp", campId, "registrations"] });
      setIsImportDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error importing Shopify orders",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle tier form submission
  const onSubmitTier = (data) => {
    if (isEditTierOpen && selectedTier) {
      updateTierMutation.mutate({ id: selectedTier.id, ...data });
    } else {
      createTierMutation.mutate(data);
    }
  };
  
  // Handle Shopify import form submission
  const onSubmitShopifyImport = (data) => {
    importShopifyMutation.mutate(data);
  };
  
  // Format registration status badges
  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">Pending</Badge>;
      case 'confirmed':
        return <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Confirmed</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  // Format payment status badges
  const getPaymentBadge = (status) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">Pending</Badge>;
      case 'paid':
        return <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Paid</Badge>;
      case 'refunded':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">Refunded</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  // Loading state
  if (isLoadingCamp) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!camp && !isLoadingCamp) {
    return (
      <div className="flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-2">Camp Not Found</h1>
        <p className="text-muted-foreground mb-4">The camp you're looking for doesn't exist.</p>
        <Button asChild>
          <Link href="/events/overview">Back to Camps</Link>
        </Button>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <PageHeader
            title="Registration Management"
            description={camp?.data?.name ? `${camp.data.name} - Registration Management` : "Loading..."}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/events/camp-project/${campId}`}>
              <Calendar className="mr-2 h-4 w-4" />
              Back to Camp
            </Link>
          </Button>
          {isAdmin && (
            <Button onClick={() => setIsImportDialogOpen(true)}>
              <Download className="mr-2 h-4 w-4" />
              Import Shopify Orders
            </Button>
          )}
        </div>
      </div>
      
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tiers">Registration Tiers</TabsTrigger>
          <TabsTrigger value="registrations">Registrations</TabsTrigger>
        </TabsList>
        
        <TabsContent value="tiers" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Registration Tiers</h2>
            {isAdmin && (
              <Button onClick={() => setIsAddTierOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Tier
              </Button>
            )}
          </div>
          
          {isLoadingTiers ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {tiers?.data?.length ? (
                tiers.data.map((tier) => (
                  <Card key={tier.id} className={`${!tier.isActive ? 'opacity-70' : ''}`}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{tier.name}</CardTitle>
                          <CardDescription>
                            {formatCurrency(tier.price)}
                          </CardDescription>
                        </div>
                        {!tier.isActive && (
                          <Badge variant="outline" className="bg-gray-100 text-gray-800">Inactive</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="text-sm">
                      <p className="mb-3">{tier.description}</p>
                      
                      {(tier.startDate || tier.endDate) && (
                        <div className="flex flex-col gap-1 mb-3">
                          {tier.startDate && (
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Start Date:</span>
                              <span>{formatDate(tier.startDate)}</span>
                            </div>
                          )}
                          {tier.endDate && (
                            <div className="flex items-center gap-2">
                              <span className="font-medium">End Date:</span>
                              <span>{formatDate(tier.endDate)}</span>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {tier.maxParticipants && (
                        <div className="flex items-center gap-2 mb-3">
                          <span className="font-medium">Limit:</span>
                          <span>{tier.maxParticipants} participants</span>
                        </div>
                      )}
                      
                      {(tier.shopifyProductId || tier.shopifyVariantId) && (
                        <div className="flex flex-col gap-1 mb-3">
                          {tier.shopifyProductId && (
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Shopify Product:</span>
                              <span className="text-xs text-muted-foreground truncate">{tier.shopifyProductId}</span>
                            </div>
                          )}
                          {tier.shopifyVariantId && (
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Shopify Variant:</span>
                              <span className="text-xs text-muted-foreground truncate">{tier.shopifyVariantId}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                    
                    {isAdmin && (
                      <CardFooter className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedTier(tier);
                            setIsEditTierOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete "${tier.name}"?`)) {
                              deleteTierMutation.mutate(tier.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </CardFooter>
                    )}
                  </Card>
                ))
              ) : (
                <div className="col-span-full text-center p-8 border rounded-md">
                  <p className="text-muted-foreground mb-4">No registration tiers created yet.</p>
                  {isAdmin && (
                    <Button onClick={() => setIsAddTierOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Registration Tier
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="registrations" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Registrations</h2>
            <Button asChild>
              <Link href={`/events/registration-form/${campId}`}>
                <Plus className="mr-2 h-4 w-4" />
                Add Registration
              </Link>
            </Button>
          </div>
          
          {isLoadingRegistrations ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {registrations?.length ? (
                <>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Tier</TableHead>
                          <TableHead>Registration Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Payment</TableHead>
                          <TableHead>Source</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedRegistrations.map((registration) => {
                          const tierName = tiers?.data?.find(t => t.id === registration.tierId)?.name || "Unknown";
                          
                          return (
                            <TableRow key={registration.id}>
                              <TableCell className="font-medium">
                                {registration.firstName} {registration.lastName}
                              </TableCell>
                              <TableCell>{tierName}</TableCell>
                              <TableCell>{formatDate(registration.createdAt)}</TableCell>
                              <TableCell>{getStatusBadge(registration.registrationStatus)}</TableCell>
                              <TableCell>{getPaymentBadge(registration.paymentStatus)}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="capitalize">
                                  {registration.source || 'manual'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  asChild
                                >
                                  <Link href={`/events/registration-details/${registration.id}`}>
                                    <Edit className="h-4 w-4 mr-1" />
                                    View
                                  </Link>
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                  
                  {totalPages > 1 && (
                    <div className="mt-4 flex justify-center">
                      <PaginationBar 
                        currentPage={page}
                        totalPages={totalPages}
                        onPageChange={setPage}
                      />
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center p-8 border rounded-md">
                  <p className="text-muted-foreground mb-4">No registrations found.</p>
                  <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    <Button asChild>
                      <Link href={`/events/registration-form/${campId}`}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Registration
                      </Link>
                    </Button>
                    {isAdmin && (
                      <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}>
                        <Download className="mr-2 h-4 w-4" />
                        Import Shopify Orders
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Add/Edit Tier Dialog */}
      <Dialog open={isAddTierOpen || isEditTierOpen} onOpenChange={(open) => {
        if (!open) {
          setIsAddTierOpen(false);
          setIsEditTierOpen(false);
          setSelectedTier(null);
        }
      }}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>{isEditTierOpen ? "Edit Registration Tier" : "Add Registration Tier"}</DialogTitle>
            <DialogDescription>
              {isEditTierOpen
                ? "Update the details of this registration tier."
                : "Create a new registration tier for camp participants."}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...tierForm}>
            <form onSubmit={tierForm.handleSubmit(onSubmitTier)} className="space-y-4">
              <FormField
                control={tierForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name*</FormLabel>
                    <FormControl>
                      <Input placeholder="Early Bird, Standard, VIP, etc." {...field} />
                    </FormControl>
                    <FormDescription>
                      The name of the registration tier.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={tierForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Describe what's included in this tier..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={tierForm.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price*</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={tierForm.control}
                  name="maxParticipants"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Participants</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          step="1" 
                          placeholder="No limit" 
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormDescription>
                        Leave empty for no limit
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={tierForm.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormDescription>
                        When registration opens
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={tierForm.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormDescription>
                        When registration closes
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={tierForm.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Active</FormLabel>
                      <FormDescription>
                        Make this tier available for registration
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <Separator />
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Shopify Integration</h3>
                <p className="text-sm text-muted-foreground">
                  Connect this tier to a Shopify product for order imports
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={tierForm.control}
                  name="shopifyProductId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Shopify Product ID</FormLabel>
                      <FormControl>
                        <Input placeholder="Product ID" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={tierForm.control}
                  name="shopifyVariantId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Shopify Variant ID</FormLabel>
                      <FormControl>
                        <Input placeholder="Variant ID" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddTierOpen(false);
                    setIsEditTierOpen(false);
                    setSelectedTier(null);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={createTierMutation.isPending || updateTierMutation.isPending}
                >
                  {(createTierMutation.isPending || updateTierMutation.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isEditTierOpen ? "Update Tier" : "Create Tier"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Shopify Import Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Import Registrations from Shopify</DialogTitle>
            <DialogDescription>
              Connect to your Shopify store to import orders as camp registrations.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...shopifyImportForm}>
            <form onSubmit={shopifyImportForm.handleSubmit(onSubmitShopifyImport)} className="space-y-4">
              <FormField
                control={shopifyImportForm.control}
                name="shopName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Shop Name*</FormLabel>
                    <FormControl>
                      <Input placeholder="your-store" {...field} />
                    </FormControl>
                    <FormDescription>
                      The subdomain of your Shopify store (e.g., 'your-store' from your-store.myshopify.com)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={shopifyImportForm.control}
                name="apiKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>API Key*</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={shopifyImportForm.control}
                name="accessToken"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Access Token*</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Separator />
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Filter Options</h3>
                <p className="text-sm text-muted-foreground">
                  Optionally filter orders by date range or product
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={shopifyImportForm.control}
                  name="dateFrom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date From</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={shopifyImportForm.control}
                  name="dateTo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date To</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={shopifyImportForm.control}
                name="productId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product ID (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Filter by specific product ID" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-sm">
                <p className="font-medium text-yellow-800">Important</p>
                <p className="text-yellow-700">
                  Make sure you have configured the Shopify Product ID and/or Variant ID in your registration tiers before importing orders.
                </p>
              </div>
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsImportDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={importShopifyMutation.isPending}
                >
                  {importShopifyMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Import Orders
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default RegistrationManagement;