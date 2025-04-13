import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Company Settings Schema
const companySchema = z.object({
  companyName: z.string().min(2, { message: "Company name must be at least 2 characters" }),
  website: z.string().url({ message: "Please enter a valid URL" }).optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
});

// Notification Settings Schema
const notificationSchema = z.object({
  emailNotifications: z.boolean().default(true),
  leadAssignments: z.boolean().default(true),
  orderUpdates: z.boolean().default(true),
  marketingEmails: z.boolean().default(false),
  systemUpdates: z.boolean().default(true),
});

// API Connection Schema
const apiConnectionSchema = z.object({
  quickbooksEnabled: z.boolean().default(false),
  quickbooksKey: z.string().optional(),
  quickbooksSecret: z.string().optional(),
  airtableEnabled: z.boolean().default(false),
  airtableKey: z.string().optional(),
  airtableBase: z.string().optional(),
});

// System Settings Schema
const systemSchema = z.object({
  dateFormat: z.enum(["MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD"]),
  timeFormat: z.enum(["12h", "24h"]),
  timezone: z.string(),
  language: z.enum(["en", "es", "fr", "de"]),
  currency: z.enum(["USD", "EUR", "GBP", "CAD", "AUD"]),
});

// Navigation Settings Schema
const navigationItemSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
  enabled: z.boolean().default(true),
});

const navigationGroupSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Title is required"),
  collapsed: z.boolean().default(false),
  items: z.array(navigationItemSchema),
});

const navigationSchema = z.object({
  groups: z.array(navigationGroupSchema),
});

type CompanyFormValues = z.infer<typeof companySchema>;
type NotificationFormValues = z.infer<typeof notificationSchema>;
type ApiConnectionFormValues = z.infer<typeof apiConnectionSchema>;
type SystemFormValues = z.infer<typeof systemSchema>;
type NavigationFormValues = z.infer<typeof navigationSchema>;

export default function Settings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Company Settings Form
  const companyForm = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      companyName: "Rich Habits",
      website: "https://richhabits.com",
      phone: "+1 (555) 123-4567",
      address: "123 Business Ave",
      city: "San Francisco",
      state: "CA",
      zipCode: "94105",
      country: "United States",
    },
  });

  // Notification Settings Form
  const notificationForm = useForm<NotificationFormValues>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      emailNotifications: true,
      leadAssignments: true,
      orderUpdates: true,
      marketingEmails: false,
      systemUpdates: true,
    },
  });

  // API Connection Form
  const apiConnectionForm = useForm<ApiConnectionFormValues>({
    resolver: zodResolver(apiConnectionSchema),
    defaultValues: {
      quickbooksEnabled: false,
      quickbooksKey: "",
      quickbooksSecret: "",
      airtableEnabled: false,
      airtableKey: "",
      airtableBase: "",
    },
  });

  // System Settings Form
  const systemForm = useForm<SystemFormValues>({
    resolver: zodResolver(systemSchema),
    defaultValues: {
      dateFormat: "MM/DD/YYYY",
      timeFormat: "12h",
      timezone: "America/Los_Angeles",
      language: "en",
      currency: "USD",
    },
  });
  
  // Navigation Settings Form
  const [navigationGroups, setNavigationGroups] = useState(() => {
    // Try to load from localStorage first
    const savedGroups = localStorage.getItem('sidebarGroups');
    if (savedGroups) {
      try {
        return JSON.parse(savedGroups);
      } catch (e) {
        console.error("Error parsing saved navigation groups:", e);
      }
    }
    
    // Default groups if nothing in localStorage
    return [
      {
        id: "main",
        title: "Main",
        collapsed: false,
        items: [
          { id: "dashboard", name: "Dashboard", enabled: true },
          { id: "leads", name: "Leads", enabled: true },
          { id: "orders", name: "Orders", enabled: true },
          { id: "design", name: "Design", enabled: true },
          { id: "manufacturing", name: "Manufacturing", enabled: true },
          { id: "organizations", name: "Organizations", enabled: true },
          { id: "messages", name: "Messages", enabled: true },
          { id: "catalog", name: "Product Catalog", enabled: true },
        ]
      },
      {
        id: "admin",
        title: "Admin",
        collapsed: false,
        items: [
          { id: "product-management", name: "Product Management", enabled: true },
          { id: "sales-team", name: "Sales Team", enabled: true },
          { id: "design-team", name: "Design Team", enabled: true },
          { id: "manufacturing-team", name: "Manufacturing Team", enabled: true },
          { id: "corporate", name: "Corporate", enabled: true },
          { id: "reports", name: "Reports", enabled: true },
          { id: "user-management", name: "User Management", enabled: true },
        ]
      },
      {
        id: "camps",
        title: "Camps & Teams",
        collapsed: false,
        items: [
          { id: "order-tracking", name: "Order Tracking", enabled: true },
          { id: "design-communication", name: "Design Communication", enabled: true },
          { id: "production-communication", name: "Production Communication", enabled: true },
        ]
      },
      {
        id: "settings",
        title: "Settings",
        collapsed: false,
        items: [
          { id: "profile", name: "Profile", enabled: true },
          { id: "settings", name: "Settings", enabled: true },
        ]
      }
    ];
  });
  
  // Handle drag and drop reordering
  const onDragEnd = (result: any) => {
    const { destination, source, type } = result;
    
    // If item was dropped outside of any droppable area
    if (!destination) {
      return;
    }
    
    // If the item was dropped back in the same position
    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return;
    }
    
    const newGroups = [...navigationGroups];
    
    // Handle items being reordered within the same group
    if (type === "item" && source.droppableId === destination.droppableId) {
      const groupId = source.droppableId;
      const groupIndex = newGroups.findIndex((g: { id: string }) => g.id === groupId);
      
      if (groupIndex === -1) return;
      
      const group = {...newGroups[groupIndex]};
      const items = [...group.items];
      
      // Remove the item from its original position and insert it at the new position
      const [reorderedItem] = items.splice(source.index, 1);
      items.splice(destination.index, 0, reorderedItem);
      
      group.items = items;
      newGroups[groupIndex] = group;
    } 
    // Handle items being moved between groups
    else if (type === "item" && source.droppableId !== destination.droppableId) {
      // Find source and destination group indexes
      const sourceGroupIndex = newGroups.findIndex((g: { id: string }) => g.id === source.droppableId);
      const destGroupIndex = newGroups.findIndex((g: { id: string }) => g.id === destination.droppableId);
      
      if (sourceGroupIndex === -1 || destGroupIndex === -1) return;
      
      // Create copies of the source and destination groups
      const sourceGroup = {...newGroups[sourceGroupIndex]};
      const destGroup = {...newGroups[destGroupIndex]};
      
      // Create copies of the items arrays
      const sourceItems = [...sourceGroup.items];
      const destItems = [...destGroup.items];
      
      // Remove the item from the source group
      const [movedItem] = sourceItems.splice(source.index, 1);
      
      // Add the item to the destination group
      destItems.splice(destination.index, 0, movedItem);
      
      // Update the groups with their new items arrays
      sourceGroup.items = sourceItems;
      destGroup.items = destItems;
      
      // Update the groups in the newGroups array
      newGroups[sourceGroupIndex] = sourceGroup;
      newGroups[destGroupIndex] = destGroup;
    }
    
    setNavigationGroups(newGroups);
  };

  const navigationForm = useForm<NavigationFormValues>({
    resolver: zodResolver(navigationSchema),
    defaultValues: {
      groups: navigationGroups,
    },
  });

  // Save Company Settings
  const saveCompanySettings = useMutation({
    mutationFn: async (values: CompanyFormValues) => {
      return await apiRequest("POST", "/api/settings/company", values);
    },
    onSuccess: () => {
      toast({
        title: "Company settings saved",
        description: "Your company settings have been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save company settings",
        variant: "destructive",
      });
    },
  });

  // Save Notification Settings
  const saveNotificationSettings = useMutation({
    mutationFn: async (values: NotificationFormValues) => {
      return await apiRequest("POST", "/api/settings/notifications", values);
    },
    onSuccess: () => {
      toast({
        title: "Notification settings saved",
        description: "Your notification preferences have been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save notification settings",
        variant: "destructive",
      });
    },
  });

  // Save API Connection Settings
  const saveApiConnectionSettings = useMutation({
    mutationFn: async (values: ApiConnectionFormValues) => {
      return await apiRequest("POST", "/api/settings/api-connections", values);
    },
    onSuccess: () => {
      toast({
        title: "API connection settings saved",
        description: "Your API connection settings have been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save API connection settings",
        variant: "destructive",
      });
    },
  });

  // Save System Settings
  const saveSystemSettings = useMutation({
    mutationFn: async (values: SystemFormValues) => {
      return await apiRequest("POST", "/api/settings/system", values);
    },
    onSuccess: () => {
      toast({
        title: "System settings saved",
        description: "Your system settings have been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save system settings",
        variant: "destructive",
      });
    },
  });
  
  // Save Navigation Settings
  const saveNavigationSettings = useMutation({
    mutationFn: async (values: NavigationFormValues) => {
      // Update local state
      setNavigationGroups(values.groups);
      // Save to localStorage to keep state between refreshes
      localStorage.setItem('sidebarGroups', JSON.stringify(values.groups));
      
      return await apiRequest("POST", "/api/settings/navigation", values);
    },
    onSuccess: () => {
      toast({
        title: "Navigation settings saved",
        description: "Your navigation settings have been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save navigation settings",
        variant: "destructive",
      });
    },
  });
  
  // Clear Example Data
  const clearExampleData = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/data/clear-example-data", {});
    },
    onSuccess: () => {
      // Invalidate all queries to refresh the data
      queryClient.invalidateQueries();
      
      toast({
        title: "Data cleared",
        description: "All example data has been cleared successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to clear example data",
        variant: "destructive",
      });
    },
  });
  
  // Clear All Products
  const clearAllProducts = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/data/clear-all-products", {});
    },
    onSuccess: () => {
      // Invalidate product-related queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/fabric-options'] });
      queryClient.invalidateQueries({ queryKey: ['/api/fabric-cuts'] });
      
      toast({
        title: "Products deleted",
        description: "All products, fabric options, and cutting patterns have been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete all products",
        variant: "destructive",
      });
    },
  });

  // Timezones for the dropdown
  const timezones = [
    { value: "America/Los_Angeles", label: "Pacific Time (US & Canada)" },
    { value: "America/Denver", label: "Mountain Time (US & Canada)" },
    { value: "America/Chicago", label: "Central Time (US & Canada)" },
    { value: "America/New_York", label: "Eastern Time (US & Canada)" },
    { value: "UTC", label: "UTC" },
    { value: "Europe/London", label: "London" },
    { value: "Europe/Paris", label: "Paris" },
    { value: "Asia/Tokyo", label: "Tokyo" },
    { value: "Australia/Sydney", label: "Sydney" },
  ];

  return (
    <>
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-800 py-4 px-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">Settings</h1>
      </div>

      {/* Content */}
      <div className="p-6">
        <Tabs defaultValue="company" className="space-y-6">
          <TabsList>
            <TabsTrigger value="company">Company</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="navigation">Navigation</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>
          
          {/* Company Settings Tab */}
          <TabsContent value="company">
            <Card>
              <CardHeader>
                <CardTitle>Company Settings</CardTitle>
                <CardDescription>
                  Manage your company information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...companyForm}>
                  <form onSubmit={companyForm.handleSubmit((data) => saveCompanySettings.mutate(data))} className="space-y-6">
                    <FormField
                      control={companyForm.control}
                      name="companyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Company Name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={companyForm.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Website</FormLabel>
                          <FormControl>
                            <Input placeholder="https://example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={companyForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="+1 (555) 123-4567" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={companyForm.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address</FormLabel>
                            <FormControl>
                              <Input placeholder="123 Business Ave" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={companyForm.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                              <Input placeholder="San Francisco" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={companyForm.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>State/Province</FormLabel>
                            <FormControl>
                              <Input placeholder="CA" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={companyForm.control}
                        name="zipCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ZIP/Postal Code</FormLabel>
                            <FormControl>
                              <Input placeholder="94105" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={companyForm.control}
                        name="country"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Country</FormLabel>
                            <FormControl>
                              <Input placeholder="United States" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <Button 
                      type="submit" 
                      disabled={saveCompanySettings.isPending}
                    >
                      {saveCompanySettings.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Manage how you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...notificationForm}>
                  <form onSubmit={notificationForm.handleSubmit((data) => saveNotificationSettings.mutate(data))} className="space-y-6">
                    <FormField
                      control={notificationForm.control}
                      name="emailNotifications"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Email Notifications</FormLabel>
                            <FormDescription>
                              Receive email notifications for important updates
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
                    
                    <FormField
                      control={notificationForm.control}
                      name="leadAssignments"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Lead Assignments</FormLabel>
                            <FormDescription>
                              Get notified when a new lead is assigned to you
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
                    
                    <FormField
                      control={notificationForm.control}
                      name="orderUpdates"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Order Updates</FormLabel>
                            <FormDescription>
                              Get notified when orders change status
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
                    
                    <FormField
                      control={notificationForm.control}
                      name="marketingEmails"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Marketing Emails</FormLabel>
                            <FormDescription>
                              Receive marketing and promotional emails
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
                    
                    <FormField
                      control={notificationForm.control}
                      name="systemUpdates"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">System Updates</FormLabel>
                            <FormDescription>
                              Get notified about system updates and maintenance
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
                    
                    <Button 
                      type="submit" 
                      disabled={saveNotificationSettings.isPending}
                    >
                      {saveNotificationSettings.isPending ? "Saving..." : "Save Preferences"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Integrations Tab */}
          <TabsContent value="integrations">
            <Card>
              <CardHeader>
                <CardTitle>API Connections</CardTitle>
                <CardDescription>
                  Manage your API connections and integrations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...apiConnectionForm}>
                  <form onSubmit={apiConnectionForm.handleSubmit((data) => saveApiConnectionSettings.mutate(data))} className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">QuickBooks Integration</h3>
                      
                      <FormField
                        control={apiConnectionForm.control}
                        name="quickbooksEnabled"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Enable QuickBooks</FormLabel>
                              <FormDescription>
                                Connect to QuickBooks to sync financial data
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
                      
                      {apiConnectionForm.watch("quickbooksEnabled") && (
                        <div className="space-y-4 rounded-lg border p-4">
                          <FormField
                            control={apiConnectionForm.control}
                            name="quickbooksKey"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>API Key</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter your QuickBooks API key" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={apiConnectionForm.control}
                            name="quickbooksSecret"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>API Secret</FormLabel>
                                <FormControl>
                                  <Input type="password" placeholder="Enter your QuickBooks API secret" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Airtable Integration</h3>
                      
                      <FormField
                        control={apiConnectionForm.control}
                        name="airtableEnabled"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Enable Airtable</FormLabel>
                              <FormDescription>
                                Connect to Airtable to sync data
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
                      
                      {apiConnectionForm.watch("airtableEnabled") && (
                        <div className="space-y-4 rounded-lg border p-4">
                          <FormField
                            control={apiConnectionForm.control}
                            name="airtableKey"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>API Key</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter your Airtable API key" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={apiConnectionForm.control}
                            name="airtableBase"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Base ID</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter your Airtable Base ID" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                    </div>
                    
                    <Button 
                      type="submit" 
                      disabled={saveApiConnectionSettings.isPending}
                    >
                      {saveApiConnectionSettings.isPending ? "Saving..." : "Save Connections"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Navigation Tab */}
          <TabsContent value="navigation">
            <Card>
              <CardHeader>
                <CardTitle>Navigation Settings</CardTitle>
                <CardDescription>
                  Customize the sidebar navigation and page names
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DragDropContext onDragEnd={onDragEnd}>
                  <div className="space-y-6">
                    <Accordion type="multiple" className="w-full border rounded-md">
                      {navigationGroups.map((group, groupIndex) => (
                        <AccordionItem key={group.id} value={group.id}>
                          <AccordionTrigger className="px-4">
                            <div className="flex items-center space-x-2">
                              <span>{group.title}</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-4 pt-2 pb-4">
                            <div className="space-y-4">
                              <div className="flex items-center space-x-4">
                                <Input 
                                  value={group.title} 
                                  onChange={(e) => {
                                    const updatedGroups = [...navigationGroups];
                                    updatedGroups[groupIndex].title = e.target.value;
                                    setNavigationGroups(updatedGroups);
                                  }}
                                  placeholder="Group name"
                                  className="max-w-xs"
                                />
                                <div className="flex items-center space-x-2">
                                  <Switch
                                    checked={!group.collapsed}
                                    onCheckedChange={(checked) => {
                                      const updatedGroups = [...navigationGroups];
                                      updatedGroups[groupIndex].collapsed = !checked;
                                      setNavigationGroups(updatedGroups);
                                    }}
                                    id={`${group.id}-expanded`}
                                  />
                                  <label htmlFor={`${group.id}-expanded`} className="text-sm font-medium">
                                    Expanded by default
                                  </label>
                                </div>
                              </div>
                              
                              <Droppable droppableId={group.id} type="item">
                                {(provided) => (
                                  <div
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                    className="w-full"
                                  >
                                    <Table>
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead className="w-[5%]"></TableHead>
                                          <TableHead className="w-[45%]">Page Name</TableHead>
                                          <TableHead className="w-[30%]">ID</TableHead>
                                          <TableHead className="w-[20%]">Visible</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {group.items.map((item, itemIndex) => (
                                          <Draggable
                                            key={item.id}
                                            draggableId={`${group.id}-${item.id}`}
                                            index={itemIndex}
                                          >
                                            {(provided) => (
                                              <TableRow
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                key={item.id}
                                              >
                                                <TableCell className="p-2 w-[40px]">
                                                  <div 
                                                    {...provided.dragHandleProps}
                                                    className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 cursor-grab"
                                                  >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
                                                      <circle cx="8" cy="8" r="1"/>
                                                      <circle cx="8" cy="16" r="1"/>
                                                      <circle cx="16" cy="8" r="1"/>
                                                      <circle cx="16" cy="16" r="1"/>
                                                    </svg>
                                                  </div>
                                                </TableCell>
                                                <TableCell>
                                                  <Input 
                                                    value={item.name} 
                                                    onChange={(e) => {
                                                      const updatedGroups = [...navigationGroups];
                                                      updatedGroups[groupIndex].items[itemIndex].name = e.target.value;
                                                      setNavigationGroups(updatedGroups);
                                                    }}
                                                    placeholder="Page name"
                                                  />
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                  {item.id}
                                                </TableCell>
                                                <TableCell>
                                                  <Switch
                                                    checked={item.enabled}
                                                    onCheckedChange={(checked) => {
                                                      const updatedGroups = [...navigationGroups];
                                                      updatedGroups[groupIndex].items[itemIndex].enabled = checked;
                                                      setNavigationGroups(updatedGroups);
                                                    }}
                                                  />
                                                </TableCell>
                                              </TableRow>
                                            )}
                                          </Draggable>
                                        ))}
                                        {provided.placeholder}
                                      </TableBody>
                                    </Table>
                                  </div>
                                )}
                              </Droppable>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  
                    <div className="flex justify-end space-x-4">
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          // Reset to defaults by reloading the page
                          window.location.reload();
                        }}
                      >
                        Reset to Defaults
                      </Button>
                      <Button 
                        onClick={() => {
                          saveNavigationSettings.mutate({ groups: navigationGroups });
                        }}
                        disabled={saveNavigationSettings.isPending}
                      >
                        {saveNavigationSettings.isPending ? "Saving..." : "Save Navigation Settings"}
                      </Button>
                    </div>
                  </div>
                </DragDropContext>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* System Settings Tab */}
          <TabsContent value="system">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>System Settings</CardTitle>
                  <CardDescription>
                    Configure system-wide settings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...systemForm}>
                    <form onSubmit={systemForm.handleSubmit((data) => saveSystemSettings.mutate(data))} className="space-y-6">
                      <FormField
                        control={systemForm.control}
                        name="dateFormat"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date Format</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select date format" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                                <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                                <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={systemForm.control}
                        name="timeFormat"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Time Format</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select time format" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="12h">12-hour (1:30 PM)</SelectItem>
                                <SelectItem value="24h">24-hour (13:30)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={systemForm.control}
                        name="timezone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Timezone</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select timezone" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {timezones.map((timezone) => (
                                  <SelectItem key={timezone.value} value={timezone.value}>
                                    {timezone.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={systemForm.control}
                        name="language"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Language</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select language" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="en">English</SelectItem>
                                <SelectItem value="es">Spanish</SelectItem>
                                <SelectItem value="fr">French</SelectItem>
                                <SelectItem value="de">German</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={systemForm.control}
                        name="currency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Currency</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select currency" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="USD">US Dollar (USD)</SelectItem>
                                <SelectItem value="EUR">Euro (EUR)</SelectItem>
                                <SelectItem value="GBP">British Pound (GBP)</SelectItem>
                                <SelectItem value="CAD">Canadian Dollar (CAD)</SelectItem>
                                <SelectItem value="AUD">Australian Dollar (AUD)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        disabled={saveSystemSettings.isPending}
                      >
                        {saveSystemSettings.isPending ? "Saving..." : "Save Settings"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
              
              {/* Data Management Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Data Management</CardTitle>
                  <CardDescription>
                    Manage system data
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="border rounded-lg p-4">
                      <div className="flex flex-col gap-2">
                        <h3 className="text-lg font-medium">Clear Example Data</h3>
                        <p className="text-sm text-muted-foreground">
                          Remove all example data from the system, keeping only the admin user account. 
                          This action cannot be undone.
                        </p>
                        <div className="flex items-center mt-2">
                          <Button 
                            variant="destructive"
                            onClick={() => clearExampleData.mutate()}
                            disabled={clearExampleData.isPending}
                          >
                            {clearExampleData.isPending ? "Clearing..." : "Clear Example Data"}
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border rounded-lg p-4">
                      <div className="flex flex-col gap-2">
                        <h3 className="text-lg font-medium">Delete All Products</h3>
                        <p className="text-sm text-muted-foreground">
                          Remove all products, fabric options, and cutting patterns from the system.
                          This action cannot be undone.
                        </p>
                        <div className="flex items-center mt-2">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="destructive"
                                disabled={clearAllProducts.isPending}
                              >
                                {clearAllProducts.isPending ? "Deleting..." : "Delete All Products"}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action will permanently delete all products, fabric options, and cutting patterns from the system.
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => clearAllProducts.mutate()}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete All Products
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
