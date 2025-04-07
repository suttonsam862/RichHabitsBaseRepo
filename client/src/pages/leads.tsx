import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, Search, Filter } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { insertLeadSchema } from "@shared/schema";
import { Lead, LeadStatus } from "@/types";

const formSchema = insertLeadSchema.extend({
  status: z.enum(["new", "contacted", "qualified", "proposal", "negotiation", "closed", "lost"]),
});

export default function Leads() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "all">("all");
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['/api/leads'],
    refetchInterval: false,
    refetchOnWindowFocus: false,
  });

  // Sample data - would normally come from the API
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

  function onSubmit(values: z.infer<typeof formSchema>) {
    addLeadMutation.mutate(values);
  }
  
  function onUpdate(values: z.infer<typeof formSchema>) {
    if (selectedLeadId) {
      updateLeadMutation.mutate({ ...values, id: selectedLeadId });
    }
  }

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
            <DialogContent>
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
              </div>
            </div>
          </CardHeader>
          <CardContent className="bg-white">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                    <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                    <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-right p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredLeads.length > 0 ? (
                    filteredLeads.map((lead) => (
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
                        <td className="p-4 text-right">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mr-2" 
                            onClick={() => {
                              // Display lead details
                              toast({
                                title: `Viewing ${lead.name}`,
                                description: `${lead.name} - ${lead.email} (${lead.status})`,
                              });
                            }}
                          >
                            View
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              // Open edit dialog with lead details
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
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-4 text-center text-gray-500">
                        No leads found matching your criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
