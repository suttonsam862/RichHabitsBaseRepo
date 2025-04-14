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

export default function Leads() {
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
  const sampleLeads: Lead[] = [
    {
      id: 1,
      userId: 1,
      name: "Emily Davis",
      email: "emily@example.com",
      phone: "+1 (555) 123-4567",
      source: "Website",
      status: "new",
      notes: "Interested in the premium package",
      createdAt: new Date().toISOString(),
    },
    {
      id: 2,
      userId: 1,
      name: "Mark Wilson",
      email: "mark@example.com",
      phone: "+1 (555) 987-6543",
      source: "Referral",
      status: "contacted",
      notes: "Looking for custom solutions",
      createdAt: new Date().toISOString(),
    },
    {
      id: 3,
      userId: 1,
      name: "Sarah Johnson",
      email: "sarah@example.com",
      phone: "+1 (555) 789-0123",
      source: "Social Media",
      status: "qualified",
      notes: "Ready for a demo",
      createdAt: new Date().toISOString(),
    },
    {
      id: 4,
      userId: 1,
      name: "John Smith",
      email: "john@example.com",
      phone: "+1 (555) 456-7890",
      source: "Email Campaign",
      status: "proposal",
      notes: "Sent proposal, waiting for response",
      createdAt: new Date().toISOString(),
    },
    {
      id: 5,
      userId: 1,
      name: "Lisa Brown",
      email: "lisa@example.com",
      phone: "+1 (555) 234-5678",
      source: "Trade Show",
      status: "negotiation",
      notes: "Negotiating contract terms",
      createdAt: new Date().toISOString(),
    },
  ];

  const leads = data?.data || sampleLeads;

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

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         lead.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
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
    
  // Sample sales team data (in a real app, this would come from an API)
  const salesTeam = [
    {
      id: 1,
      username: "laird",
      fullName: "Laird Bourbon",
      email: "laird@rich-habits.com",
      role: "agent",
      avatarUrl: "",
      leads: leads.filter(lead => lead.salesRepId === 1)
    },
    {
      id: 2,
      username: "julia",
      fullName: "Julia Reynolds",
      email: "julia@rich-habits.com",
      role: "agent",
      avatarUrl: "",
      leads: leads.filter(lead => lead.salesRepId === 2)
    },
    {
      id: 3,
      username: "thomas",
      fullName: "Thomas Ferguson",
      email: "thomas@rich-habits.com",
      role: "agent",
      avatarUrl: "",
      leads: leads.filter(lead => lead.salesRepId === 3)
    }
  ];

  return (
    <>
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-800 py-4 px-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">Leads</h1>
          
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
                          <Input placeholder="john@example.com" type="email" {...field} />
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
                        <FormControl>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a source" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Website">Website</SelectItem>
                              <SelectItem value="Referral">Referral</SelectItem>
                              <SelectItem value="Social Media">Social Media</SelectItem>
                              <SelectItem value="Email Campaign">Email Campaign</SelectItem>
                              <SelectItem value="Trade Show">Trade Show</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="new">New</SelectItem>
                              <SelectItem value="contacted">Contacted</SelectItem>
                              <SelectItem value="qualified">Qualified</SelectItem>
                              <SelectItem value="proposal">Proposal</SelectItem>
                              <SelectItem value="negotiation">Negotiation</SelectItem>
                              <SelectItem value="closed">Closed</SelectItem>
                              <SelectItem value="lost">Lost</SelectItem>
                            </SelectContent>
                          </Select>
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
                          <Textarea placeholder="Add any additional notes here..." {...field} />
                        </FormControl>
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
                          <Input 
                            type="text" 
                            placeholder="0.00"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Organization fields section */}
                  <Separator className="my-4" />
                  <h3 className="text-md font-medium mb-2">Organization Information</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    An organization will be automatically created with this information.
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
                          <FormControl>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select industry" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Education">Education</SelectItem>
                                <SelectItem value="Sports">Sports</SelectItem>
                                <SelectItem value="Fitness">Fitness</SelectItem>
                                <SelectItem value="Healthcare">Healthcare</SelectItem>
                                <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                                <SelectItem value="Retail">Retail</SelectItem>
                                <SelectItem value="Technology">Technology</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="organizationType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organization Type</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select organization type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="client">Client</SelectItem>
                              <SelectItem value="school">School</SelectItem>
                              <SelectItem value="sports_team">Sports Team</SelectItem>
                              <SelectItem value="club">Club</SelectItem>
                              <SelectItem value="gym">Gym</SelectItem>
                              <SelectItem value="vendor">Vendor</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Input placeholder="123 Main St" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input placeholder="Anytown" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State</FormLabel>
                          <FormControl>
                            <Input placeholder="CA" {...field} />
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
                          <FormLabel>ZIP Code</FormLabel>
                          <FormControl>
                            <Input placeholder="12345" {...field} />
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
                  
                  <Separator className="my-4" />
                  
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
                          <FormLabel>
                            Automatically Claim Lead
                          </FormLabel>
                          <p className="text-sm text-muted-foreground">
                            Converts this lead into an order assigned to you
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setOpenAddDialog(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={addLeadMutation.isPending}>
                      {addLeadMutation.isPending ? "Adding..." : "Add Lead"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <Card className="bg-white">
          <CardHeader className="pb-3 bg-white">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
                <Input
                  placeholder="Search leads..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="absolute right-2 top-2.5">
                  <HelpIconOnly 
                    content={
                      <div>
                        <p className="font-semibold mb-1">Lead Search Tips</p>
                        <p>Search through all leads by name, email, phone, or company.</p>
                        <ul className="list-disc pl-4 mt-2 space-y-1">
                          <li>Enter a client name like "John Smith"</li>
                          <li>Search by email domain (e.g., "@company.com")</li>
                          <li>Enter a phone number with or without formatting</li>
                          <li>Type a company name to find all leads from that organization</li>
                        </ul>
                      </div>
                    }
                    side="top"
                    iconSize={14}
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                <Select
                  value={statusFilter}
                  onValueChange={(value) => setStatusFilter(value as LeadStatus | "all")}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="qualified">Qualified</SelectItem>
                    <SelectItem value="proposal">Proposal</SelectItem>
                    <SelectItem value="negotiation">Negotiation</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
                  </SelectContent>
                </Select>
                <HelpIconOnly 
                  content={
                    <div>
                      <p className="font-semibold mb-1">Understanding Lead Status</p>
                      <p>Filter leads by their current status in your sales pipeline:</p>
                      <ul className="list-disc pl-4 mt-2 space-y-1">
                        <li><span className="font-semibold">New:</span> Recently added, not yet contacted</li>
                        <li><span className="font-semibold">Contacted:</span> Initial outreach has been made</li>
                        <li><span className="font-semibold">Qualified:</span> Confirmed interest and fit for your products</li>
                        <li><span className="font-semibold">Proposal:</span> Formal quote/proposal has been sent</li>
                        <li><span className="font-semibold">Negotiation:</span> Discussing terms and finalizing details</li>
                        <li><span className="font-semibold">Closed:</span> Lead has converted to a customer</li>
                        <li><span className="font-semibold">Lost:</span> Opportunity is no longer viable</li>
                      </ul>
                    </div>
                  }
                  side="left"
                  iconSize={14}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="bg-white">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
                <div className="p-4 bg-gray-50 border border-gray-100 rounded-lg">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-medium">Available Opportunities</h3>
                    <p className="text-sm text-gray-500">
                      {unclaimedLeads.length} {unclaimedLeads.length === 1 ? 'lead' : 'leads'} available to claim
                    </p>
                  </div>
                  
                  {unclaimedLeads.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {unclaimedLeads.map((lead) => (
                        <div 
                          key={lead.id} 
                          className="bg-white border border-gray-200 hover:border-brand-300 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
                        >
                          <div className="flex justify-between items-center p-4 border-b border-gray-100">
                            <Badge className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(lead.status as LeadStatus)}`}>
                              {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                            </Badge>
                            <div className="flex items-center">
                              <span className="text-gray-500 text-sm mr-1">From:</span>
                              <span className="text-gray-700 text-sm font-medium">{lead.source}</span>
                            </div>
                          </div>
                          
                          <div className="p-4">
                            <h4 className="text-lg font-semibold text-gray-900 truncate">{lead.name}</h4>
                            
                            <div className="mt-2 space-y-1">
                              <div className="flex items-center text-sm text-gray-600">
                                <span className="truncate">{lead.email}</span>
                              </div>
                              {lead.phone && (
                                <div className="flex items-center text-sm text-gray-600">
                                  <span>{lead.phone}</span>
                                </div>
                              )}
                            </div>
                            
                            {lead.notes && (
                              <div className="mt-3">
                                <p className="text-sm text-gray-700 truncate-2-lines">{lead.notes}</p>
                              </div>
                            )}
                          </div>
                          
                          <div className="bg-gray-50 p-4 flex justify-between items-center">
                            {lead.value ? (
                              <div className="text-base font-bold text-green-600">
                                Est. Value: ${parseFloat(lead.value).toLocaleString()}
                              </div>
                            ) : (
                              <div className="text-base text-gray-500">
                                Value: Unknown
                              </div>
                            )}
                            
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex items-center justify-center"
                                onClick={() => {
                                  setSelectedLead(lead);
                                  setOpenViewDialog(true);
                                }}
                              >
                                View
                              </Button>
                              <Button
                                variant="default"
                                className="flex items-center justify-center bg-brand-600 hover:bg-brand-700 text-white"
                                size="sm"
                                onClick={() => {
                                  // Claim this lead with 3-day verification
                                  claimLeadMutation.mutate(lead.id);
                                }}
                              >
                                Claim Lead
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center bg-white border border-gray-200 rounded-lg">
                      <div className="text-gray-500 mb-2">
                        <Inbox className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-medium text-gray-900">No unclaimed leads available</h3>
                        <p className="mt-1 text-sm">All leads have been claimed or there are no leads matching your criteria.</p>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="my-leads" className="mt-2">
                <div className="p-4 bg-gray-50 border border-gray-100 rounded-lg mb-4">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-medium">My Assigned Leads</h3>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">
                        {myLeads.length} {myLeads.length === 1 ? 'lead' : 'leads'} assigned to you
                      </span>
                      <HelpIconOnly 
                        content="Leads you've claimed will appear here. You can convert them to orders, update their status, or add notes as you progress through the sales cycle."
                      />
                    </div>
                  </div>
                  
                  {myLeads.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {myLeads.map((lead) => (
                        <div 
                          key={lead.id} 
                          className="bg-white border border-gray-200 hover:border-brand-300 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
                        >
                          <div className="p-4 border-b border-gray-100">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="text-lg font-semibold text-gray-900 truncate">{lead.name}</h4>
                                <p className="text-sm text-gray-600 mt-1">
                                  {lead.email} {lead.phone && <span>• {lead.phone}</span>}
                                </p>
                              </div>
                              <Badge className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(lead.status as LeadStatus)}`}>
                                {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                              </Badge>
                            </div>
                            
                            <div className="flex items-center mt-3 space-x-4">
                              <div className="flex items-center text-sm text-gray-600">
                                <CalendarIcon className="h-4 w-4 mr-1" />
                                <span>Claimed: {formatDate(lead.claimedAt || "")}</span>
                              </div>
                              <div className="flex items-center text-sm text-gray-600">
                                <TagIcon className="h-4 w-4 mr-1" />
                                <span>{lead.source}</span>
                              </div>
                            </div>
                            
                            {lead.notes && (
                              <div className="mt-3 pt-3 border-t border-gray-100">
                                <p className="text-sm text-gray-700 line-clamp-2">{lead.notes}</p>
                              </div>
                            )}
                          </div>
                          
                          <div className="bg-gray-50 p-3 flex justify-between items-center">
                            {lead.value ? (
                              <div className="text-base font-bold text-green-600">
                                Est. Value: ${parseFloat(lead.value).toLocaleString()}
                              </div>
                            ) : (
                              <div className="text-base text-gray-500">
                                Value: Unknown
                              </div>
                            )}
                            
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedLead(lead);
                                  setOpenViewDialog(true);
                                }}
                              >
                                View
                              </Button>
                              
                              {/* Only show Convert if lead is not already converted */}
                              {lead.status !== 'converted' && (
                                <Button
                                  size="sm"
                                  className="bg-brand-600 hover:bg-brand-700 text-white"
                                  onClick={() => {
                                    convertToOrderMutation.mutate(lead.id);
                                  }}
                                >
                                  Convert
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center bg-white border border-gray-200 rounded-lg">
                      <div className="text-gray-500 mb-2">
                        <UserCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-medium text-gray-900">No leads assigned to you</h3>
                        <p className="mt-1 text-sm">To get started, claim some leads from the "Unclaimed Leads" tab.</p>
                      </div>
                      <Button 
                        variant="default" 
                        className="mt-4 bg-brand-600 hover:bg-brand-700 text-white"
                        onClick={() => setActiveTab("unclaimed")}
                      >
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Browse Available Leads
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              {isAdmin && (
                <TabsContent value="by-salesperson" className="mt-2">
                  <div className="p-4 bg-gray-50 border border-gray-100 rounded-lg">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-medium">Leads By Salesperson</h3>
                      <p className="text-sm text-gray-500">
                        Showing leads grouped by sales representative
                      </p>
                    </div>
                    
                    <div className="space-y-6">
                      {salesTeam.length > 0 ? (
                        salesTeam.map((salesperson) => (
                          <div key={salesperson.id} className="bg-white border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center mb-4">
                              <Avatar className="h-12 w-12 mr-4">
                                <AvatarImage src={salesperson.avatarUrl || ""} />
                                <AvatarFallback className="bg-brand-100 text-brand-800">
                                  {salesperson.fullName?.charAt(0) || salesperson.username?.charAt(0) || "?"}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <h4 className="text-lg font-semibold">{salesperson.fullName || salesperson.username}</h4>
                                <p className="text-sm text-gray-500">{salesperson.email}</p>
                              </div>
                              <div className="ml-auto">
                                <Badge variant="outline" className="ml-2">
                                  {salesperson.leads?.length || 0} Leads
                                </Badge>
                              </div>
                            </div>
                            
                            {salesperson.leads && salesperson.leads.length > 0 ? (
                              <div className="overflow-hidden border border-gray-100 rounded-lg">
                                <table className="min-w-full divide-y divide-gray-200">
                                  <thead className="bg-gray-50">
                                    <tr>
                                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Lead
                                      </th>
                                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                      </th>
                                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Value
                                      </th>
                                      <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="bg-white divide-y divide-gray-200">
                                    {salesperson.leads.map((lead) => (
                                      <tr key={lead.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 whitespace-nowrap">
                                          <div className="text-sm font-medium text-gray-900">{lead.name}</div>
                                          <div className="text-sm text-gray-500">{lead.email}</div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                          <Badge className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(lead.status as LeadStatus)}`}>
                                            {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                                          </Badge>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                          {lead.value ? (
                                            <span className="text-sm font-medium text-green-600">
                                              ${parseFloat(lead.value).toLocaleString()}
                                            </span>
                                          ) : (
                                            <span className="text-sm text-gray-500">Unknown</span>
                                          )}
                                        </td>
                                        <td className="px-4 py-3 text-right whitespace-nowrap">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="mr-2"
                                            onClick={() => {
                                              setSelectedLead(lead);
                                              setOpenViewDialog(true);
                                            }}
                                          >
                                            View
                                          </Button>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                              form.reset({
                                                name: lead.name,
                                                email: lead.email,
                                                phone: lead.phone || "",
                                                source: lead.source,
                                                status: lead.status as any,
                                                notes: lead.notes || ""
                                              });
                                              setSelectedLeadId(lead.id);
                                              setOpenEditDialog(true);
                                            }}
                                          >
                                            Edit
                                          </Button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <div className="text-center py-8 bg-gray-50 rounded-lg">
                                <UserCircle className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-sm font-medium text-gray-900">No leads assigned</h3>
                                <p className="mt-1 text-sm text-gray-500">This salesperson has no active leads.</p>
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
                          <Users className="mx-auto h-12 w-12 text-gray-400" />
                          <h3 className="mt-2 text-sm font-medium text-gray-900">No sales representatives found</h3>
                          <p className="mt-1 text-sm text-gray-500">Add members to your sales team to see them here.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
              )}
              
              {isAdmin && (
                <TabsContent value="archived-leads" className="mt-2">
                  <div className="p-4 bg-gray-50 border border-gray-100 rounded-lg">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-medium">Archived Leads</h3>
                      <p className="text-sm text-gray-500">
                        {archivedLeads.length} {archivedLeads.length === 1 ? 'lead' : 'leads'} archived
                      </p>
                    </div>
                  
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                            <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                            <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                            <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Date Archived</th>
                            <th className="text-right p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                          {archivedLeads.length > 0 ? (
                            archivedLeads.map((lead) => (
                              <tr key={lead.id} className="hover:bg-gray-50">
                                <td className="p-4 text-sm text-gray-900">{lead.name}</td>
                                <td className="p-4 text-sm text-gray-600">{lead.email}</td>
                                <td className="p-4 text-sm text-gray-600">{lead.phone}</td>
                                <td className="p-4 text-sm text-gray-600">{lead.source}</td>
                                <td className="p-4">
                                  <Badge className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(lead.status as LeadStatus)}`}>
                                    {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                                  </Badge>
                                </td>
                                <td className="p-4 text-sm text-gray-600">{formatDate(lead.updatedAt || lead.createdAt)}</td>
                                <td className="p-4 text-right">
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="mr-2" 
                                    onClick={() => {
                                      setSelectedLead(lead);
                                      setOpenViewDialog(true);
                                    }}
                                  >
                                    View
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => {
                                      form.reset({
                                        name: lead.name,
                                        email: lead.email,
                                        phone: lead.phone || "",
                                        source: lead.source,
                                        status: lead.status as any,
                                        notes: lead.notes || "",
                                        value: lead.value || ""
                                      });
                                      setSelectedLeadId(lead.id);
                                      setOpenEditDialog(true);
                                    }}
                                  >
                                    Edit
                                  </Button>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={7} className="p-4 text-center text-gray-500">
                                <div className="py-8">
                                  <Archive className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                  <h3 className="text-lg font-medium text-gray-900 mb-1">No archived leads found</h3>
                                  <p className="text-sm text-gray-500">Leads marked as "closed" or "lost" will appear here</p>
                                </div>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </TabsContent>
              )}
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Edit Lead Dialog */}
      <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Lead</DialogTitle>
            <DialogDescription>
              Update the lead information below.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onUpdate)} className="space-y-4">
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
                      <Input placeholder="john@example.com" type="email" {...field} />
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
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a source" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Website">Website</SelectItem>
                          <SelectItem value="Referral">Referral</SelectItem>
                          <SelectItem value="Social Media">Social Media</SelectItem>
                          <SelectItem value="Email Campaign">Email Campaign</SelectItem>
                          <SelectItem value="Trade Show">Trade Show</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="contacted">Contacted</SelectItem>
                          <SelectItem value="qualified">Qualified</SelectItem>
                          <SelectItem value="proposal">Proposal</SelectItem>
                          <SelectItem value="negotiation">Negotiation</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                          <SelectItem value="lost">Lost</SelectItem>
                        </SelectContent>
                      </Select>
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
                      <Textarea placeholder="Add any additional notes here..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => {
                  setOpenEditDialog(false);
                  setSelectedLeadId(null);
                }}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-brand-600 hover:bg-brand-700 text-white"
                  disabled={updateLeadMutation.isPending}
                >
                  {updateLeadMutation.isPending ? "Updating..." : "Update Lead"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* View Lead Dialog */}
      <Dialog open={openViewDialog} onOpenChange={setOpenViewDialog}>
        <DialogContent className="bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Lead Details</DialogTitle>
            <DialogDescription>
              Detailed information about this lead.
            </DialogDescription>
          </DialogHeader>
          
          {selectedLead && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Name</h3>
                  <p className="mt-1 text-base text-gray-900">{selectedLead.name}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Email</h3>
                  <p className="mt-1 text-base text-gray-900">{selectedLead.email}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Phone</h3>
                  <p className="mt-1 text-base text-gray-900">{selectedLead.phone || "—"}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Source</h3>
                  <p className="mt-1 text-base text-gray-900">{selectedLead.source}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Status</h3>
                  <div className="mt-1">
                    <Badge className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedLead.status as LeadStatus)}`}>
                      {selectedLead.status.charAt(0).toUpperCase() + selectedLead.status.slice(1)}
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Date Added</h3>
                  <p className="mt-1 text-base text-gray-900">{formatDate(selectedLead.createdAt)}</p>
                </div>
              </div>
              
              <div className="col-span-2">
                <h3 className="text-sm font-medium text-gray-500">Notes</h3>
                <p className="mt-1 text-base text-gray-900 whitespace-pre-wrap">{selectedLead.notes || "No notes available."}</p>
              </div>
              
              <DialogFooter className="mt-6">
                <div className="flex space-x-2 mr-auto">
                  {/* Admin-only Edit button */}
                  {isAdmin && (
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => {
                        // Set the form values based on the selected lead
                        form.reset({
                          name: selectedLead.name,
                          email: selectedLead.email,
                          phone: selectedLead.phone || "",
                          source: selectedLead.source || "",
                          status: selectedLead.status as any,
                          notes: selectedLead.notes || "",
                          value: selectedLead.value?.toString() || "",
                          autoClaimLead: false,
                          website: selectedLead.website || "",
                          industry: selectedLead.industry || "",
                          address: selectedLead.address || "",
                          city: selectedLead.city || "",
                          state: selectedLead.state || "",
                          zip: selectedLead.zip || "",
                          country: selectedLead.country || "USA",
                          organizationType: selectedLead.organizationType || "client",
                        });
                        // Set the selected lead ID for the update operation
                        setSelectedLeadId(selectedLead.id);
                        // Close the view dialog and open the edit dialog
                        setOpenViewDialog(false);
                        setOpenEditDialog(true);
                      }}
                    >
                      Edit Lead
                    </Button>
                  )}
                  
                  <Button 
                    type="button" 
                    variant="destructive" 
                    onClick={() => {
                      if (confirm("Are you sure you want to delete this lead? This action cannot be undone.")) {
                        deleteLeadMutation.mutate(selectedLead.id);
                      }
                    }}
                  >
                    Delete Lead
                  </Button>
                  
                  {/* Only show Convert to Order for claimed leads */}
                  {selectedLead.claimed ? (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        convertToOrderMutation.mutate(selectedLead.id);
                      }}
                    >
                      Convert to Order
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="secondary"
                      className="bg-brand-600 hover:bg-brand-700 text-white"
                      onClick={() => {
                        // Close dialog first
                        setOpenViewDialog(false);
                        // Claim the lead
                        claimLeadMutation.mutate(selectedLead.id);
                      }}
                    >
                      Claim Lead
                    </Button>
                  )}
                </div>
                <div className="flex space-x-2">
                  <Button type="button" variant="outline" onClick={() => {
                    setOpenViewDialog(false);
                    setSelectedLead(null);
                  }}>
                    Close
                  </Button>
                </div>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
