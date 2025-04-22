import { useState, useEffect } from "react";
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
import { PlusCircle, Search, Filter, Inbox, UserCircle, Archive, Plus, Users, Calendar as CalendarIcon, Tag as TagIcon, DollarSign, Eye } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import { StickyNote } from "@/components/ui/sticky-note";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";
import { insertLeadSchema, ROLES } from "@shared/schema";
import { Lead, LeadStatus, ContactLog } from "@/types";
import { HelpIconOnly } from "@/components/ui/help-tooltip";
import { useAuth } from "@/hooks/use-auth";
import LeadProgressChecklist from "@/components/leads/lead-progress-checklist";
import LeadDetailsPanel from "@/components/leads/lead-details-panel";

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
  const [contactLogs, setContactLogs] = useState<ContactLog[]>([]);
  // Track which lead is expanded in the panel view
  const [expandedLeadId, setExpandedLeadId] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { user } = useAuth();
  
  // Get user permissions
  const canViewAllLeads = user?.permissions?.includes('view_all_leads') || user?.role === 'admin';
  // Check if user is admin (for archived leads tab)
  const isAdmin = user?.role === 'admin';
  
  // Refresh key to force re-render when needed
  const [refreshKey, setRefreshKey] = useState(0);
  
  const { data, isLoading } = useQuery({
    queryKey: ['/api/leads', refreshKey], // Add refreshKey to the query key
    refetchInterval: false,
    refetchOnWindowFocus: true, // Enable to make sure changes are reflected
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
      case "claimed":
        return "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300";
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
  


  // Get the tab parameter from URL if available
  const getInitialTab = () => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (tabParam === "my-leads" || tabParam === "whiteboard" || tabParam === "archived") {
        console.log(`[CLIENT:LEADS] Using tab from URL parameter: ${tabParam}`);
        return tabParam;
      }
    }
    return "whiteboard";
  };

  // State to control active tab
  const [activeTab, setActiveTab] = useState(getInitialTab());
  
  // Update URL when active tab changes to maintain state
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set('tab', activeTab);
    window.history.replaceState({}, '', url.toString());
  }, [activeTab]);
  
  // Create a mutation to claim a lead by the current user
  const claimLeadMutation = useMutation({
    mutationFn: async (leadId: number) => {
      console.log(`[CLIENT:LEAD CLAIM] Attempting to claim lead ID ${leadId}`);
      return await apiRequest("POST", `/api/leads/${leadId}/claim`, {});
    },
    onSuccess: (response) => {
      console.log(`[CLIENT:LEAD CLAIM] Success! Full response:`, response);
      
      // First, immediately invalidate the cache to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
      
      // Use the complete lead object from the server response if available
      const updatedLeadData = response.lead || {
        id: response.leadId,
        claimed: true,
        claimedById: user?.id,
        claimedAt: new Date().toISOString(),
        salesRepId: user?.id,
        status: "claimed"
      };
      
      console.log(`[CLIENT:LEAD CLAIM] Using lead data for cache update:`, updatedLeadData);
      
      // Update the local cache immediately with complete lead data from server
      queryClient.setQueryData(['/api/leads'], (oldData: any) => {
        if (!oldData) {
          console.log('[CLIENT:LEAD CLAIM] No existing lead data in cache to update');
          return oldData;
        }
        
        console.log('[CLIENT:LEAD CLAIM] Updating lead cache data with claimed lead', updatedLeadData.id);
        
        // Update the lead in the data with the complete server response
        const updatedLeads = oldData.data.map((lead: any) => {
          if (lead.id === updatedLeadData.id) {
            console.log(`[CLIENT:LEAD CLAIM] Updating lead ${lead.id} in cache with server data`);
            return updatedLeadData;
          }
          return lead;
        });
        
        return { ...oldData, data: updatedLeads };
      });
      
      // Force an immediate refetch to ensure all components have latest data
      queryClient.refetchQueries({ queryKey: ['/api/leads'] })
        .then(() => {
          console.log('[CLIENT:LEAD CLAIM] Data refetch complete after claim');
        })
        .catch(err => {
          console.error('[CLIENT:LEAD CLAIM] Error refetching data after claim:', err);
        });
      
      // Increment the refresh key to force a re-render of components
      setRefreshKey(prev => {
        const newKey = prev + 1;
        console.log(`[CLIENT:LEAD CLAIM] Incrementing refresh key from ${prev} to ${newKey}`);
        return newKey;
      });
      
      // Switch to My Leads tab only after data is updated
      setTimeout(() => {
        console.log('[CLIENT:LEAD CLAIM] Switching to My Leads tab');
        setActiveTab("my-leads");
      }, 100); // Small delay to ensure data is refreshed
      
      toast({
        title: "Lead claimed",
        description: "Lead has been successfully claimed and added to your My Leads tab.",
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

  // Handle drag end event for drag and drop functionality
  const handleDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;
    
    // Return if dropped outside a droppable area or dropped in the same place
    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) return;
    
    // Only handle drops to the claim bucket
    if (destination.droppableId === 'claim-bucket') {
      // Extract the lead ID from the draggableId (format: "lead-{id}")
      const leadId = parseInt(draggableId.replace('lead-', ''), 10);
      
      // Claim the lead
      claimLeadMutation.mutate(leadId);
      
      // Show a notification
      toast({
        title: "Claiming lead...",
        description: "Processing your lead claim",
      });
    }
  };
  
  // Helper function to get lead color for sticky notes
  const getLeadColor = (status: LeadStatus) => {
    switch (status) {
      case "new":
        return "green";
      case "claimed":
        return "teal";
      case "contacted":
        return "blue";
      case "qualified":
        return "purple";
      case "proposal":
        return "orange";
      case "negotiation":
        return "yellow";
      case "closed":
        return "indigo";
      case "lost":
        return "red";
      default:
        return "gray";
    }
  };
  
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
    // The server now handles auto-claiming leads during creation,
    // so we don't need to make a separate API call to claim the lead
    addLeadMutation.mutate(values);
  }
  
  function onUpdate(values: z.infer<typeof formSchema>) {
    if (selectedLeadId) {
      updateLeadMutation.mutate({ ...values, id: selectedLeadId });
    }
  }

  // Create filtered lists for unclaimed and user's leads
  const unclaimedLeads = leads.filter(lead => 
      // Only show leads that are not claimed by anyone
      !lead.claimed && !lead.salesRepId && lead.status === "new"
    )
    .filter(lead => {
      const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           lead.email.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  
  // Check if the user is an executive or has a role that allows them to see leads
  const isExecutive = user?.role === ROLES.EXECUTIVE;
  // isAdmin is already defined above
  const isSalesRole = user?.role === ROLES.AGENT || user?.role === ROLES.HYBRID;
  
  const myLeads = leads.filter(lead => {
      // Include leads that meet any of these conditions:
      // 1. Directly assigned to the user via salesRepId 
      // 2. Claimed by the user (claimed === true AND claimedById === user.id)
      // 3. Has status "claimed" and was claimed by this user
      // 4. User has executive role (they can see and manage all claimed leads as their own)
      console.log(`Checking lead ${lead.id} - ${lead.name}: salesRepId=${lead.salesRepId}, claimed=${lead.claimed}, claimedById=${lead.claimedById}, status=${lead.status}, user.id=${user?.id}, isExecutive=${isExecutive}, isAdmin=${isAdmin}`);
      
      // Special case for Sam Sutton (admin user ID 1) - show any lead assigned to him as salesRepId=1
      if (Number(user?.id) === 1 && Number(lead.salesRepId) === 1) {
        console.log(`Lead ${lead.id} - ${lead.name} matches for Sam Sutton by salesRepId=1`);
        return true;
      }
      
      // Lead assigned to this user via salesRepId (this is the main case)
      if (Number(lead.salesRepId) === Number(user?.id)) {
        console.log(`Lead ${lead.id} - ${lead.name} matches by salesRepId assignment`);
        return true;
      }
      
      // Lead claimed by this user
      if (lead.claimed && Number(lead.claimedById) === Number(user?.id)) {
        console.log(`Lead ${lead.id} - ${lead.name} matches by claimed status`);
        return true;
      }
      
      // Lead marked as claimed and was claimed by this user
      if (lead.status === "claimed" && Number(lead.claimedById) === Number(user?.id)) {
        console.log(`Lead ${lead.id} - ${lead.name} matches by status:claimed`);
        return true;
      }
      
      // Executive role users can see all leads
      if (isExecutive) {
        console.log(`Lead ${lead.id} - ${lead.name} matches for executive role`);
        return true;
      }
      
      return false;
    })
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
    
  // Use actual database user IDs for sales team data
  const salesTeam = [
    {
      id: 1,
      username: "samsutton",
      fullName: "Samuel Sutton",
      email: "samsutton@rich-habits.com",
      role: "admin",
      avatarUrl: "",
      leads: leads.filter(lead => Number(lead.salesRepId) === 1)
    },
    {
      id: 6,
      username: "laird",
      fullName: "Laird Bourbon",
      email: "laird@rich-habits.com",
      role: "agent",
      avatarUrl: "",
      leads: leads.filter(lead => Number(lead.salesRepId) === 6)
    },
    {
      id: 8,
      username: "charliereeves",
      fullName: "Charlie Reeves",
      email: "charliereeves@rich-habits.com",
      role: "manager",
      avatarUrl: "",
      leads: leads.filter(lead => Number(lead.salesRepId) === 8)
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
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Acme Corporation" {...field} />
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
                              <SelectItem value="claimed">Claimed</SelectItem>
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
                    <SelectItem value="claimed">Claimed</SelectItem>
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
                        <li><span className="font-semibold">Claimed:</span> Lead claimed by a sales rep in the 3-day verification period</li>
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
              <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-5' : 'grid-cols-3'} mb-6`}>
                <TabsTrigger value="whiteboard" className="flex items-center">
                  <TagIcon className="h-4 w-4 mr-2" />
                  Whiteboard
                </TabsTrigger>
                <TabsTrigger value="my-leads" className="flex items-center">
                  <UserCircle className="h-4 w-4 mr-2" />
                  My Leads
                </TabsTrigger>
                
                {/* Archived Leads section moved to Sales Management */}
                <TabsTrigger value="list-format" className="flex items-center">
                  <Inbox className="h-4 w-4 mr-2" />
                  List Format
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="whiteboard" className="mt-2">
                <div className="p-4 bg-gray-50 border border-gray-100 rounded-lg">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-medium">Leads Whiteboard</h3>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">
                        Drag leads to the dollar sign bucket to claim them
                      </span>
                      <HelpIconOnly 
                        content="This whiteboard view allows you to drag and drop leads you want to claim. Simply drag a sticky note to the dollar sign bucket on the right to claim a lead."
                      />
                    </div>
                  </div>
                  
                  <DragDropContext onDragEnd={handleDragEnd}>
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                      <div className="lg:col-span-3 bg-white p-6 rounded-lg border border-gray-200 min-h-[500px]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' viewBox=\'0 0 100 100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z\' fill=\'%23f3f4f6\' fill-opacity=\'0.75\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")' }}>
                        <Droppable droppableId="leads-board" direction="horizontal">
                          {(provided) => (
                            <div 
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                            >
                              {unclaimedLeads.map((lead, index) => (
                                <Draggable key={`lead-${lead.id}`} draggableId={`lead-${lead.id}`} index={index}>
                                  {(provided, snapshot) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      style={{
                                        ...provided.draggableProps.style,
                                        opacity: snapshot.isDragging ? 0.8 : 1
                                      }}
                                    >
                                      <StickyNote 
                                        color={getLeadColor(lead.status as LeadStatus)}
                                        title={lead.name}
                                        subtitle={lead.companyName || ""}
                                        content={
                                          <>
                                            <p className="text-sm mb-1">{lead.email}</p>
                                            {lead.phone && <p className="text-sm mb-1">{lead.phone}</p>}
                                            {lead.notes && <p className="text-xs italic mt-2 line-clamp-2">{lead.notes}</p>}
                                          </>
                                        }
                                        footer={
                                          <div className="flex justify-between items-center w-full">
                                            <span className="text-xs">Source: {lead.source}</span>
                                            {lead.value && <span className="font-semibold">${lead.value}</span>}
                                          </div>
                                        }
                                        onClick={() => {
                                          setSelectedLead(lead);
                                          setOpenViewDialog(true);
                                        }}
                                      />
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </div>
                      
                      <div className="bg-white p-4 rounded-lg border border-gray-200 flex flex-col items-center justify-center">
                        <Droppable droppableId="claim-bucket">
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className={`w-full h-60 border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-colors ${
                                snapshot.isDraggingOver ? 'border-green-500 bg-green-50' : 'border-gray-300'
                              }`}
                            >
                              <DollarSign className={`h-16 w-16 mb-4 ${
                                snapshot.isDraggingOver ? 'text-green-500' : 'text-gray-400'
                              }`} />
                              <p className="text-center text-sm font-medium mb-2">
                                {snapshot.isDraggingOver ? 'Release to Claim Lead' : 'Drag Leads Here to Claim'}
                              </p>
                              <p className="text-center text-xs text-gray-500">
                                Claimed leads will appear in your "My Leads" tab
                              </p>
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                        
                        <div className="mt-6">
                          <h4 className="font-medium text-gray-900 mb-2">Lead Status Colors</h4>
                          <div className="space-y-2">
                            <div className="flex items-center">
                              <div className="w-4 h-4 bg-green-400 rounded-full mr-2"></div>
                              <span className="text-sm">New</span>
                            </div>
                            <div className="flex items-center">
                              <div className="w-4 h-4 bg-teal-400 rounded-full mr-2"></div>
                              <span className="text-sm">Claimed</span>
                            </div>
                            <div className="flex items-center">
                              <div className="w-4 h-4 bg-blue-400 rounded-full mr-2"></div>
                              <span className="text-sm">Contacted</span>
                            </div>
                            <div className="flex items-center">
                              <div className="w-4 h-4 bg-purple-400 rounded-full mr-2"></div>
                              <span className="text-sm">Qualified</span>
                            </div>
                            <div className="flex items-center">
                              <div className="w-4 h-4 bg-orange-400 rounded-full mr-2"></div>
                              <span className="text-sm">Proposal</span>
                            </div>
                            <div className="flex items-center">
                              <div className="w-4 h-4 bg-yellow-400 rounded-full mr-2"></div>
                              <span className="text-sm">Negotiation</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </DragDropContext>
                </div>
              </TabsContent>
              
              <TabsContent value="list-format" className="mt-2">
                <div className="p-4 bg-gray-50 border border-gray-100 rounded-lg">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-medium">Available Opportunities</h3>
                    <p className="text-sm text-gray-500">
                      {unclaimedLeads.length} {unclaimedLeads.length === 1 ? 'lead' : 'leads'} available to claim
                    </p>
                  </div>
                  
                  {unclaimedLeads.length > 0 ? (
                    <div>
                      {/* Group leads by sport/industry */}
                      {(() => {
                        // Define common sports/industries for grouping
                        const industries = [
                          "Wrestling", "Football", "Basketball", "Baseball", 
                          "Soccer", "Volleyball", "Swimming", "Track & Field", 
                          "Gymnastics", "Lacrosse", "Hockey", "Tennis",
                          "Cheer", "Dance", "Golf", "Other"
                        ];
                        
                        // Function to determine the industry for a lead
                        const getLeadIndustry = (lead: any) => {
                          if (lead.industry) return lead.industry;
                          if (lead.organization?.industry) return lead.organization.industry;
                          
                          // Try to extract industry from company name or notes
                          const nameAndNotes = `${lead.companyName || ''} ${lead.notes || ''}`.toLowerCase();
                          
                          for (const industry of industries) {
                            if (nameAndNotes.includes(industry.toLowerCase())) {
                              return industry;
                            }
                          }
                          return "Other";
                        };
                        
                        // Group leads by industry
                        const groupedLeads = industries.map(industry => {
                          const leadsInGroup = unclaimedLeads.filter(lead => {
                            const leadIndustry = getLeadIndustry(lead);
                            return leadIndustry === industry || 
                                  (industry === "Other" && !industries.slice(0, -1).includes(leadIndustry));
                          });
                          
                          return {
                            industry,
                            leads: leadsInGroup
                          };
                        }).filter(group => group.leads.length > 0);
                        
                        return (
                          <div className="space-y-8">
                            {groupedLeads.map(group => (
                              <div key={group.industry} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                {/* Industry header with color coding */}
                                <div className={`py-3 px-4 ${
                                  group.industry === "Football" ? "bg-green-100 border-l-4 border-green-500" :
                                  group.industry === "Basketball" ? "bg-orange-100 border-l-4 border-orange-500" :
                                  group.industry === "Baseball" ? "bg-blue-100 border-l-4 border-blue-500" :
                                  group.industry === "Soccer" ? "bg-emerald-100 border-l-4 border-emerald-500" :
                                  group.industry === "Volleyball" ? "bg-purple-100 border-l-4 border-purple-500" :
                                  group.industry === "Swimming" ? "bg-cyan-100 border-l-4 border-cyan-500" :
                                  group.industry === "Track & Field" ? "bg-amber-100 border-l-4 border-amber-500" :
                                  group.industry === "Gymnastics" ? "bg-pink-100 border-l-4 border-pink-500" :
                                  group.industry === "Wrestling" ? "bg-red-100 border-l-4 border-red-500" :
                                  group.industry === "Lacrosse" ? "bg-indigo-100 border-l-4 border-indigo-500" :
                                  group.industry === "Hockey" ? "bg-sky-100 border-l-4 border-sky-500" :
                                  group.industry === "Tennis" ? "bg-lime-100 border-l-4 border-lime-500" :
                                  group.industry === "Cheer" ? "bg-rose-100 border-l-4 border-rose-500" :
                                  group.industry === "Dance" ? "bg-fuchsia-100 border-l-4 border-fuchsia-500" :
                                  group.industry === "Golf" ? "bg-teal-100 border-l-4 border-teal-500" :
                                  "bg-gray-100 border-l-4 border-gray-500"
                                }`}>
                                  <h3 className="text-lg font-semibold flex items-center">
                                    {group.industry} 
                                    <span className="ml-2 text-sm font-medium text-gray-600 bg-white rounded-full px-2 py-0.5">
                                      {group.leads.length}
                                    </span>
                                  </h3>
                                </div>
                                
                                {/* Leads table */}
                                <div className="overflow-x-auto">
                                  <table className="w-full text-sm">
                                    <thead>
                                      <tr className="border-b border-gray-200 bg-gray-50">
                                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Name</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Company</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Contact</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Value</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Actions</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {group.leads.map((lead) => (
                                        <tr key={lead.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                          <td className="px-4 py-3">
                                            <div className="font-medium text-gray-900 truncate max-w-[200px]">{lead.name}</div>
                                          </td>
                                          <td className="px-4 py-3">
                                            <div className="text-gray-600 truncate max-w-[200px]">{lead.companyName || "—"}</div>
                                          </td>
                                          <td className="px-4 py-3">
                                            <div className="flex flex-col">
                                              <span className="text-gray-600 truncate max-w-[200px]">{lead.email}</span>
                                              {lead.phone && <span className="text-gray-500 text-xs">{lead.phone}</span>}
                                            </div>
                                          </td>
                                          <td className="px-4 py-3">
                                            <Badge className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(lead.status as LeadStatus)}`}>
                                              {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                                            </Badge>
                                          </td>
                                          <td className="px-4 py-3">
                                            {lead.value ? (
                                              <div className="text-base font-medium text-green-600">
                                                ${lead.value}
                                              </div>
                                            ) : (
                                              <div className="text-sm text-gray-400">
                                                —
                                              </div>
                                            )}
                                          </td>
                                          <td className="px-4 py-3">
                                            <div className="flex items-center space-x-2">
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-8"
                                                onClick={() => {
                                                  claimLeadMutation.mutate(lead.id);
                                                }}
                                              >
                                                <DollarSign className="h-3.5 w-3.5 mr-1" />
                                                Claim
                                              </Button>
                                              <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-8"
                                                onClick={() => {
                                                  setSelectedLead(lead);
                                                  setOpenViewDialog(true);
                                                }}
                                              >
                                                <Eye className="h-3.5 w-3.5" />
                                                <span className="sr-only">View</span>
                                              </Button>
                                            </div>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
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
                                  
                                  // Fetch contact logs for this lead when the dialog opens
                                  if (lead && lead.id) {
                                    console.log(`Fetching contact logs for lead ${lead.id}`);
                                    apiRequest("GET", `/api/leads/${lead.id}/contact-logs`)
                                      .then(res => {
                                        // Check if response is ok before trying to parse JSON
                                        if (!res.ok) {
                                          console.warn(`Contact logs response not OK: ${res.status} ${res.statusText}`);
                                          return { data: [] };
                                        }
                                        
                                        // Try to parse as JSON with fallback
                                        try {
                                          return res.json();
                                        } catch (e) {
                                          console.error("Error parsing contact logs JSON:", e);
                                          return { data: [] };
                                        }
                                      })
                                      .then(data => {
                                        console.log("Contact logs loaded:", data);
                                        // Make sure we have an array of logs, even if empty
                                        const logs = Array.isArray(data.data) ? data.data : [];
                                        setContactLogs(logs);
                                      })
                                      .catch(error => {
                                        console.error("Error fetching contact logs:", error);
                                        // Set empty contact logs instead of showing error toast
                                        setContactLogs([]);
                                      });
                                  }
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
                        <p className="mt-1 text-sm">To get started, claim some leads from the "List Format" tab.</p>
                      </div>
                      <Button 
                        variant="default" 
                        className="mt-4 bg-brand-600 hover:bg-brand-700 text-white"
                        onClick={() => setActiveTab("list-format")}
                      >
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Browse Available Leads
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              
              
              {/* Archived Leads section moved to Sales Management */}
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
                          <SelectItem value="claimed">Claimed</SelectItem>
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

      {/* View Lead Dialog - Using open without onOpenChange to prevent unexpected closures */}
      <Dialog 
        open={openViewDialog} 
        modal={true}
        onOpenChange={(open) => {
          console.log(`Dialog open state change requested: ${open ? 'open' : 'close'}`);
          
          // Only allow explicit closing through our Close button
          // by always returning false when something tries to close the dialog
          if (!open) {
            console.log("Dialog close requested via overlay/escape - BLOCKED");
            // Don't auto-close - we only want to close via the explicit close button
            // which handles saving changes properly
            return false;
          } else {
            // Allow opening the dialog
            setOpenViewDialog(true);
          }
        }}
      >
        <DialogContent 
          className="bg-white max-h-[90vh] overflow-y-auto"
          // Prevent clicks outside from closing the dialog
          onPointerDownOutside={(e) => e.preventDefault()}
          // Prevent escape key from closing the dialog
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
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
              
              {/* Contact Logs Section */}
              <div className="col-span-2">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Contact Logs</h3>
                {contactLogs && contactLogs.length > 0 ? (
                  <div className="space-y-2">
                    {contactLogs.map((log) => (
                      <div key={log.id} className="p-3 bg-gray-50 rounded-md">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">{log.contactMethod}</span>
                          <span className="text-xs text-gray-500">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-gray-700">{log.notes || ""}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-gray-50 rounded-md text-center">
                    <p className="text-gray-500 text-sm">No contact logs found for this lead.</p>
                  </div>
                )}
              </div>
              
              {/* Only show the lead progress checklist for claimed leads */}
              {selectedLead.claimed && (
                <div className="col-span-2">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Lead Progress</h3>
                  <LeadProgressChecklist 
                    leadId={selectedLead.id}
                    contactComplete={selectedLead.contactComplete || false}
                    itemsConfirmed={selectedLead.itemsConfirmed || false}
                    submittedToDesign={selectedLead.submittedToDesign || false}
                    contactLogs={contactLogs}
                    onUpdate={() => {
                      console.log("Lead progress updated, refreshing lead view");
                      
                      // First get the latest lead data from cache or re-fetch
                      // We'll implement a more reliable method to update the selected lead
                      // by first updating the cache then refreshing the selected lead
                      const refreshLeadData = async () => {
                        console.log(`Refreshing data for lead ${selectedLead.id}`);
                        
                        try {
                          // First get fresh data directly from the server
                          const response = await apiRequest("GET", `/api/leads/${selectedLead.id}`);
                          
                          // Check if the response is OK before proceeding
                          if (!response.ok) {
                            console.warn(`Lead data response not OK: ${response.status}`);
                            return;
                          }
                          
                          // Process the JSON response
                          const updatedLeadData = await response.json();
                          console.log("Fresh lead data from server:", updatedLeadData);
                          
                          if (updatedLeadData && updatedLeadData.data) {
                            // Important: Update the selectedLead state with the fresh data
                            // This ensures our UI is showing the latest values
                            console.log("Updating selected lead with fresh data:", updatedLeadData.data);
                            setSelectedLead({
                              ...selectedLead,
                              ...updatedLeadData.data
                            });
                            
                            // Also update our cache for consistency
                            queryClient.setQueryData(['/api/leads'], (oldData: any) => {
                              if (!oldData || !oldData.data) return oldData;
                              
                              return {
                                ...oldData,
                                data: oldData.data.map((lead: any) => {
                                  if (lead.id === selectedLead.id) {
                                    return updatedLeadData.data;
                                  }
                                  return lead;
                                })
                              };
                            });
                          }
                        } catch (error) {
                          console.error("Error refreshing lead data:", error);
                          // Schedule a background invalidation on error
                          setTimeout(() => {
                            queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
                          }, 500);
                        }
                      };
                      
                      // Execute the refresh
                      refreshLeadData();
                      
                      // Also refresh contact logs
                      apiRequest("GET", `/api/leads/${selectedLead.id}/contact-logs`)
                        .then(res => {
                          // Check if response is ok before trying to parse JSON
                          if (!res.ok) {
                            console.warn(`Contact logs response not OK: ${res.status} ${res.statusText}`);
                            return { data: [] };
                          }
                          
                          // Try to parse as JSON with fallback
                          try {
                            return res.json();
                          } catch (e) {
                            console.error("Error parsing contact logs JSON:", e);
                            return { data: [] };
                          }
                        })
                        .then(data => {
                          console.log("Contact logs loaded:", data);
                          // Make sure we have an array of logs, even if empty
                          const logs = Array.isArray(data.data) ? data.data : [];
                          setContactLogs(logs);
                        })
                        .catch(error => {
                          console.error("Error fetching contact logs:", error);
                          // Set empty contact logs instead of showing error
                          setContactLogs([]);
                        });
                    }}
                  />
                </div>
              )}
              
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
                    // Before closing, make sure all lead progress changes are saved
                    console.log("Close button clicked, ensuring progress is saved");
                    
                    // Trigger a final refresh of the lead data to persist all changes
                    apiRequest("GET", `/api/leads/${selectedLead.id}`)
                      .then(response => response.json())
                      .then(data => {
                        console.log("Final save of lead data:", data);
                        
                        // Update the cache with the latest data
                        queryClient.setQueryData(['/api/leads'], (oldData: any) => {
                          if (!oldData || !oldData.data) return oldData;
                          
                          return {
                            ...oldData,
                            data: oldData.data.map((lead: any) => {
                              if (lead.id === selectedLead.id) {
                                return data.data;
                              }
                              return lead;
                            })
                          };
                        });
                        
                        // Now close the dialog
                        setOpenViewDialog(false);
                        setSelectedLead(null);
                      })
                      .catch(err => {
                        console.error("Error doing final save:", err);
                        // Close anyway to prevent user from being stuck
                        setOpenViewDialog(false);
                        setSelectedLead(null);
                      });
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
