import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { PlusCircle, Search, Filter, Inbox, UserCircle, Archive, Plus, Users, Calendar as CalendarIcon, Tag as TagIcon } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";
import { insertLeadSchema } from "@shared/schema";
import { Lead, LeadStatus } from "@/types";
import { HelpIconOnly } from "@/components/ui/help-tooltip";
import { useAuth } from "@/hooks/use-auth";
import { StickyNote } from "@/components/ui/sticky-note";

const formSchema = insertLeadSchema.extend({
  companyName: z.string().optional().nullable(),
  status: z.enum(["new", "contacted", "qualified", "proposal", "negotiation", "closed", "lost"]),
  value: z.string().optional().nullable(),
  autoClaimLead: z.boolean().optional(),
  // Additional fields for organization creation
  website: z.string().optional(),
  industry: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  country: z.string().optional().default("USA"),
  organizationType: z.string().optional().default("client"),
});

export default function LeadsWhiteboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "all">("all");
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { user } = useAuth();
  
  // Get user permissions
  const canViewAllLeads = user?.permissions?.includes('view_all_leads') || user?.role === 'admin';
  // Check if user is admin (for archived leads tab)
  const isAdmin = user?.role === 'admin';
  
  const { data, isLoading } = useQuery({
    queryKey: ['/api/leads'],
    refetchInterval: false,
    refetchOnWindowFocus: false,
  });

  // Use data from the API
  const leads = data?.data || [];

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      source: "",
      status: "new",
      notes: "",
      value: "",
      autoClaimLead: false,
      // Default values for organization fields
      website: "",
      industry: "",
      address: "",
      city: "",
      state: "",
      zip: "",
      country: "USA",
      organizationType: "client",
    },
  });

  const addLeadMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      return await apiRequest("POST", "/api/leads", values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
      toast({
        title: "Lead added",
        description: "New lead has been added successfully",
      });
      setOpenAddDialog(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add lead",
        variant: "destructive",
      });
    },
  });
  
  const updateLeadMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema> & { id: number }) => {
      const { id, ...data } = values;
      return await apiRequest("PATCH", `/api/leads/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
      toast({
        title: "Lead updated",
        description: "Lead has been updated successfully",
      });
      setOpenEditDialog(false);
      setSelectedLeadId(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update lead",
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: LeadStatus) => {
    switch (status) {
      case "new":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "contacted":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "qualified":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      case "proposal":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      case "negotiation":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "closed":
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300";
      case "lost":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  // State to control active tab
  const [activeTab, setActiveTab] = useState("unclaimed");
  // Refresh key to force re-render when needed
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Create a mutation to claim a lead by the current user
  const claimLeadMutation = useMutation({
    mutationFn: async (leadId: number) => {
      return await apiRequest("POST", `/api/leads/${leadId}/claim`, {});
    },
    onSuccess: (response) => {
      // Invalidate to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
      
      // Update the local cache immediately to show the lead in My Leads tab
      queryClient.setQueryData(['/api/leads'], (oldData: any) => {
        if (!oldData) return oldData;
        
        // Update the lead in the data to mark it as claimed by current user
        const updatedLeads = oldData.data.map((lead: any) => {
          if (lead.id === response.leadId) {
            return {
              ...lead,
              claimed: true,
              claimedById: user.id,
              claimedAt: new Date().toISOString(),
              salesRepId: user.id
            };
          }
          return lead;
        });
        
        return { ...oldData, data: updatedLeads };
      });
      
      // Switch to My Leads tab and force refresh
      setActiveTab("my-leads");
      setRefreshKey(prev => prev + 1);
      
      toast({
        title: "Lead claimed",
        description: "Lead has been successfully claimed. You'll be able to convert it to an order after the 3-day verification period.",
      });
    },
    onError: (error: any) => {
      // Check if the error is because lead is already claimed
      if (error.message?.includes("already claimed")) {
        toast({
          title: "Lead already claimed",
          description: "This lead has already been claimed by another sales representative.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to claim lead",
          variant: "destructive",
        });
      }
    },
  });
  
  // Create a mutation to convert a lead into an order (after verification period)
  const convertToOrderMutation = useMutation({
    mutationFn: async (leadId: number) => {
      return await apiRequest("POST", `/api/leads/${leadId}/convert-to-order`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      toast({
        title: "Lead converted",
        description: "Lead has been successfully converted to an order",
      });
    },
    onError: (error: any) => {
      // Check if error is related to verification period
      if (error.message?.includes("verification period")) {
        toast({
          title: "Verification period not complete",
          description: "The 3-day verification period has not been completed yet. Please wait until verification is complete to convert this lead.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to convert lead to order",
          variant: "destructive",
        });
      }
    },
  });

  // Create a mutation to delete a lead
  const deleteLeadMutation = useMutation({
    mutationFn: async (leadId: number) => {
      return await apiRequest("DELETE", `/api/leads/${leadId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
      queryClient.invalidateQueries({ queryKey: ['/api/activities/recent'] });
      // Force refetch to ensure we have the latest data
      queryClient.refetchQueries({ queryKey: ['/api/leads'] });
      toast({
        title: "Lead deleted",
        description: "Lead has been successfully deleted",
      });
      setOpenViewDialog(false);
      setSelectedLead(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete lead",
        variant: "destructive",
      });
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    addLeadMutation.mutate(values, {
      onSuccess: (data) => {
        // If autoClaimLead is true, claim the newly created lead
        if (values.autoClaimLead && data.data?.id) {
          claimLeadMutation.mutate(data.data.id);
        }
      }
    });
  }
  
  function onUpdate(values: z.infer<typeof formSchema>) {
    if (selectedLeadId) {
      updateLeadMutation.mutate({ ...values, id: selectedLeadId });
    }
  }

  // Create filtered lists for unclaimed and user's leads
  const unclaimedLeads = leads.filter(lead => lead.status === "new" && !lead.salesRepId)
    .filter(lead => {
      const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         lead.email.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  
  const myLeads = leads.filter(lead => lead.salesRepId === user?.id)
    .filter(lead => {
      const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         lead.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
    
  // Create filtered list for archived leads (for admin only)
  const archivedLeads = leads.filter(lead => lead.status === "closed" || lead.status === "lost")
    .filter(lead => {
      const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         lead.email.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });

  // Get a color based on lead status
  const getLeadColor = (status: LeadStatus) => {
    switch (status) {
      case "new": return "green";
      case "contacted": return "blue";
      case "qualified": return "purple";
      case "proposal": return "pink";
      case "negotiation": return "yellow";
      case "closed": return "blue";
      case "lost": return "pink";
      default: return "yellow";
    }
  };

  // Create a ViewLeadDialog component
  const ViewLeadDialog = () => {
    if (!selectedLead) return null;
    
    return (
      <Dialog open={openViewDialog} onOpenChange={setOpenViewDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedLead.name}</DialogTitle>
            <DialogDescription>
              Lead details and information
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Contact Information</h3>
              <div className="space-y-2">
                <p><span className="font-medium">Email:</span> {selectedLead.email}</p>
                {selectedLead.phone && <p><span className="font-medium">Phone:</span> {selectedLead.phone}</p>}
              </div>
              
              <h3 className="text-sm font-medium text-gray-500 mt-4 mb-1">Lead Status</h3>
              <Badge className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedLead.status as LeadStatus)}`}>
                {selectedLead.status.charAt(0).toUpperCase() + selectedLead.status.slice(1)}
              </Badge>
              
              <h3 className="text-sm font-medium text-gray-500 mt-4 mb-1">Lead Details</h3>
              <div className="space-y-2">
                <p><span className="font-medium">Source:</span> {selectedLead.source}</p>
                <p><span className="font-medium">Created:</span> {formatDate(selectedLead.createdAt)}</p>
                {selectedLead.value && (
                  <p>
                    <span className="font-medium">Est. Value:</span> 
                    <span className="text-green-600 font-bold"> ${parseFloat(selectedLead.value).toLocaleString()}</span>
                  </p>
                )}
              </div>
            </div>
            
            <div>
              {selectedLead.notes && (
                <>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Notes</h3>
                  <div className="bg-gray-50 p-3 rounded-md mb-4">
                    <p className="text-sm text-gray-700 whitespace-pre-line">{selectedLead.notes}</p>
                  </div>
                </>
              )}
              
              {selectedLead.salesRepId === user?.id && (
                <div className="space-y-3 mt-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Actions</h3>
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSelectedLeadId(selectedLead.id);
                        setOpenEditDialog(true);
                        setOpenViewDialog(false);
                        // Populate the form with the selected lead data
                        form.reset({
                          name: selectedLead.name,
                          email: selectedLead.email,
                          phone: selectedLead.phone || "",
                          source: selectedLead.source || "",
                          status: selectedLead.status,
                          notes: selectedLead.notes || "",
                          value: selectedLead.value || "",
                        });
                      }}
                    >
                      Edit Lead
                    </Button>
                    
                    {/* Only show Convert to Order if claimed by current user and not already converted */}
                    {selectedLead.salesRepId === user?.id && selectedLead.status !== "closed" && (
                      <Button 
                        size="sm"
                        onClick={() => convertToOrderMutation.mutate(selectedLead.id)}
                        disabled={convertToOrderMutation.isPending}
                      >
                        {convertToOrderMutation.isPending ? "Converting..." : "Convert to Order"}
                      </Button>
                    )}
                    
                    {/* Only show Delete button for admin */}
                    {isAdmin && (
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => deleteLeadMutation.mutate(selectedLead.id)}
                        disabled={deleteLeadMutation.isPending}
                      >
                        {deleteLeadMutation.isPending ? "Deleting..." : "Delete Lead"}
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenViewDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <>
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-800 py-4 px-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">Leads Board</h1>
          
          <Dialog open={openAddDialog} onOpenChange={setOpenAddDialog}>
            <DialogTrigger asChild>
              <Button className="bg-brand-600 hover:bg-brand-700 text-white">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Lead
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Lead</DialogTitle>
                <DialogDescription>
                  Fill in the details below to add a new lead to your system.
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="john@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
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
                  
                  <FormField
                    control={form.control}
                    name="source"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Source</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select lead source" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Website">Website</SelectItem>
                            <SelectItem value="Referral">Referral</SelectItem>
                            <SelectItem value="Social Media">Social Media</SelectItem>
                            <SelectItem value="Email Campaign">Email Campaign</SelectItem>
                            <SelectItem value="Trade Show">Trade Show</SelectItem>
                            <SelectItem value="Cold Call">Cold Call</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estimated Value ($)</FormLabel>
                        <FormControl>
                          <Input type="text" placeholder="10000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Add any relevant notes about this lead" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="autoClaimLead"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Auto-claim this lead</FormLabel>
                          <p className="text-sm text-muted-foreground">
                            If checked, you will automatically claim this lead after creation
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  {/* Organization information section */}
                  <div className="border-t pt-4 mt-6">
                    <h3 className="text-base font-medium mb-3">Organization Information</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      A new organization record will be created for this lead. 
                      You can provide additional details about the organization below.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
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
                        control={form.control}
                        name="industry"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Industry</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select industry" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Technology">Technology</SelectItem>
                                <SelectItem value="Healthcare">Healthcare</SelectItem>
                                <SelectItem value="Education">Education</SelectItem>
                                <SelectItem value="Finance">Finance</SelectItem>
                                <SelectItem value="Retail">Retail</SelectItem>
                                <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                                <SelectItem value="Services">Services</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="mt-3">
                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address</FormLabel>
                            <FormControl>
                              <Input placeholder="123 Main St." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                              <Input placeholder="New York" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>State</FormLabel>
                            <FormControl>
                              <Input placeholder="NY" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="zip"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ZIP</FormLabel>
                            <FormControl>
                              <Input placeholder="10001" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="country"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Country</FormLabel>
                            <FormControl>
                              <Input placeholder="USA" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button type="submit" disabled={addLeadMutation.isPending}>
                      {addLeadMutation.isPending ? "Saving..." : "Add Lead"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      {/* Main content */}
      <div className="container mx-auto py-6 px-4">
        {/* Search and filter */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search leads..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="w-full md:w-52">
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as LeadStatus | "all")}
            >
              <SelectTrigger>
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="qualified">Qualified</SelectItem>
                <SelectItem value="proposal">Proposal</SelectItem>
                <SelectItem value="negotiation">Negotiation</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Leads tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} key={refreshKey} className="space-y-4">
          <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-4' : 'grid-cols-2'} mb-6`}>
            <TabsTrigger value="unclaimed" className="flex items-center">
              <Inbox className="h-4 w-4 mr-2" />
              Unclaimed Leads
            </TabsTrigger>
            <TabsTrigger value="my-leads" className="flex items-center">
              <UserCircle className="h-4 w-4 mr-2" />
              My Leads
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="by-salesperson" className="flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Leads By Salesperson
              </TabsTrigger>
            )}
            {isAdmin && (
              <TabsTrigger value="archived-leads" className="flex items-center">
                <Archive className="h-4 w-4 mr-2" />
                Archived Leads
              </TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="unclaimed" className="mt-2">
            <div className="p-6 bg-whiteboard bg-whiteboard-grid bg-grid border border-gray-100 rounded-lg min-h-[600px]">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium">Available Opportunities</h3>
                <p className="text-sm text-gray-500">
                  {unclaimedLeads.length} {unclaimedLeads.length === 1 ? 'lead' : 'leads'} available to claim
                </p>
              </div>
              
              {unclaimedLeads.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 p-4">
                  {unclaimedLeads.map((lead, index) => {
                    // Assign a color based on the lead source or status
                    const leadColor = getLeadColor(lead.status as LeadStatus);
                    
                    // Random rotation between -3 and 3 degrees
                    const rotation = Math.floor(Math.random() * 7) - 3;
                    
                    return (
                      <div key={lead.id} className="flex justify-center">
                        <StickyNote 
                          color={leadColor as any} 
                          size="md" 
                          glow={true}
                          title={lead.name}
                          status={lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                          rotation={rotation}
                          onClick={() => {
                            setSelectedLead(lead);
                            setOpenViewDialog(true);
                          }}
                          className="w-full"
                        >
                          <div className="space-y-2 mt-2">
                            <p>{lead.email}</p>
                            {lead.phone && <p>{lead.phone}</p>}
                            
                            <div className="flex items-center mt-2">
                              <span className="text-xs font-bold mr-1">Source:</span>
                              <span className="text-xs">{lead.source}</span>
                            </div>
                            
                            {lead.notes && (
                              <p className="mt-2 text-sm line-clamp-2 opacity-80">{lead.notes}</p>
                            )}
                            
                            <div className="mt-3 pt-3 border-t border-black/10">
                              {lead.value ? (
                                <p className="font-bold">
                                  Est. Value: ${parseFloat(lead.value).toLocaleString()}
                                </p>
                              ) : (
                                <p className="opacity-75">
                                  Value: Unknown
                                </p>
                              )}
                            </div>
                            
                            <Button
                              variant="default"
                              size="sm"
                              className="mt-2 w-full shadow-md"
                              onClick={(e) => {
                                e.stopPropagation();
                                claimLeadMutation.mutate(lead.id);
                              }}
                              disabled={claimLeadMutation.isPending}
                            >
                              {claimLeadMutation.isPending ? "Claiming..." : "Claim Lead"}
                            </Button>
                          </div>
                        </StickyNote>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-10">
                  <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-gray-100">
                    <Inbox className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">No Unclaimed Leads</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    There are currently no unclaimed leads available for you to claim.
                  </p>
                  <Button variant="outline" className="mt-6" onClick={() => setOpenAddDialog(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create New Lead
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="my-leads" className="mt-2">
            <div className="p-6 bg-whiteboard bg-whiteboard-grid bg-grid border border-gray-100 rounded-lg min-h-[600px]">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium">My Assigned Leads</h3>
                <p className="text-sm text-gray-500">
                  {myLeads.length} {myLeads.length === 1 ? 'lead' : 'leads'} assigned to you
                </p>
              </div>
              
              {myLeads.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 p-4">
                  {myLeads.map((lead, index) => {
                    // Assign a color based on the lead status
                    const leadColor = getLeadColor(lead.status as LeadStatus);
                    
                    // Random rotation between -3 and 3 degrees
                    const rotation = Math.floor(Math.random() * 7) - 3;
                    
                    return (
                      <div key={lead.id} className="flex justify-center">
                        <StickyNote 
                          color={leadColor as any} 
                          size="md" 
                          glow={true}
                          title={lead.name}
                          status={lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                          rotation={rotation}
                          onClick={() => {
                            setSelectedLead(lead);
                            setOpenViewDialog(true);
                          }}
                          className="w-full"
                        >
                          <div className="space-y-2 mt-2">
                            <p>{lead.email}</p>
                            {lead.phone && <p>{lead.phone}</p>}
                            
                            <div className="flex items-center mt-2">
                              <span className="text-xs font-bold mr-1">Source:</span>
                              <span className="text-xs">{lead.source}</span>
                            </div>
                            
                            {lead.notes && (
                              <p className="mt-2 text-sm line-clamp-2 opacity-80">{lead.notes}</p>
                            )}
                            
                            <div className="mt-3 pt-3 border-t border-black/10">
                              {lead.value ? (
                                <p className="font-bold">
                                  Est. Value: ${parseFloat(lead.value).toLocaleString()}
                                </p>
                              ) : (
                                <p className="opacity-75">
                                  Value: Unknown
                                </p>
                              )}
                            </div>
                            
                            {lead.status !== "closed" && (
                              <Button
                                variant="default"
                                size="sm"
                                className="mt-2 w-full shadow-md"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  convertToOrderMutation.mutate(lead.id);
                                }}
                                disabled={convertToOrderMutation.isPending}
                              >
                                {convertToOrderMutation.isPending ? "Converting..." : "Convert to Order"}
                              </Button>
                            )}
                          </div>
                        </StickyNote>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-10">
                  <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-gray-100">
                    <UserCircle className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">No Leads Assigned to You</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    You don't have any leads assigned to you yet. Try claiming an unclaimed lead or create a new one.
                  </p>
                  <div className="flex gap-4 justify-center mt-6">
                    <Button variant="outline" onClick={() => setActiveTab("unclaimed")}>
                      View Unclaimed Leads
                    </Button>
                    <Button onClick={() => setOpenAddDialog(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create New Lead
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* Show View Dialog when a lead is selected */}
          {selectedLead && <ViewLeadDialog />}
        </Tabs>
      </div>
    </>
  );
}