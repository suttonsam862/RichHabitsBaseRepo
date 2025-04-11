import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  Users, 
  User, 
  PlusCircle, 
  Clock, 
  CheckCircle, 
  Phone, 
  Mail, 
  Search, 
  Building, 
  Filter, 
  AlertCircle,
  ArrowRight,
  Info
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

export default function UnclaimedLeads() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("unclaimed");
  const [notes, setNotes] = useState("");
  
  // Fetch unclaimed leads
  const { data: unclaimedLeads, isLoading: isLoadingUnclaimed } = useQuery({
    queryKey: ['/api/leads/unclaimed'],
    queryFn: async ({ queryKey }) => {
      const response = await apiRequest('GET', queryKey[0] as string);
      return response.json();
    },
  });
  
  // Fetch my leads
  const { data: myLeads, isLoading: isLoadingMyLeads } = useQuery({
    queryKey: ['/api/leads/my-leads'],
    queryFn: async ({ queryKey }) => {
      const response = await apiRequest('GET', queryKey[0] as string);
      return response.json();
    },
  });
  
  // Claim lead mutation
  const claimLeadMutation = useMutation({
    mutationFn: async ({ leadId, notes }: { leadId: number; notes: string }) => {
      await apiRequest('POST', `/api/leads/${leadId}/claim`, { notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/leads/unclaimed'] });
      queryClient.invalidateQueries({ queryKey: ['/api/leads/my-leads'] });
      toast({
        title: "Lead claimed successfully",
        description: "You can now create an order for this lead.",
      });
      setConfirmDialogOpen(false);
      setSelectedLead(null);
      setNotes("");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to claim lead",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle lead claiming
  const handleClaimLead = (lead: any) => {
    setSelectedLead(lead);
    setConfirmDialogOpen(true);
  };
  
  // Confirm lead claim
  const confirmClaimLead = () => {
    if (selectedLead) {
      claimLeadMutation.mutate({ 
        leadId: selectedLead.id,
        notes: notes
      });
    }
  };
  
  // Render lead status badge
  const LeadStatusBadge = ({ status }: { status: string }) => {
    switch (status?.toLowerCase()) {
      case 'new':
        return <Badge className="bg-green-100 text-green-800 border-green-200">New</Badge>;
      case 'contacted':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Contacted</Badge>;
      case 'qualified':
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Qualified</Badge>;
      case 'unqualified':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Unqualified</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };
  
  // Filter leads based on search term
  const filterLeads = (leads: any[]) => {
    if (!leads) return [];
    
    return leads.filter((lead) => {
      const searchString = searchTerm.toLowerCase();
      const nameMatch = lead.fullName?.toLowerCase().includes(searchString);
      const companyMatch = lead.company?.toLowerCase().includes(searchString);
      const emailMatch = lead.email?.toLowerCase().includes(searchString);
      const phoneMatch = lead.phone?.includes(searchString);
      
      return nameMatch || companyMatch || emailMatch || phoneMatch;
    });
  };
  
  const filteredUnclaimedLeads = filterLeads(unclaimedLeads?.data || []);
  const filteredMyLeads = filterLeads(myLeads?.data || []);
  
  return (
    <div className="container mx-auto py-8 max-w-7xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Leads Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            View and claim available leads to convert into customers
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-2">
          {/* Add ability to create leads if user has permission */}
          <Button asChild variant="outline">
            <Link href="/orders/create">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Order
            </Link>
          </Button>
        </div>
      </div>
      
      {/* Search and filter */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input
            placeholder="Search leads by name, company, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
      
      <Tabs defaultValue="unclaimed" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="unclaimed">Unclaimed Leads</TabsTrigger>
          <TabsTrigger value="my-leads">My Leads</TabsTrigger>
        </TabsList>
        
        {/* Unclaimed Leads Tab */}
        <TabsContent value="unclaimed">
          <Card>
            <CardHeader>
              <CardTitle>Available Leads</CardTitle>
              <CardDescription>
                Claim leads to convert them into orders. Once claimed, you will be the primary contact for this lead.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingUnclaimed ? (
                <div className="text-center py-4">Loading available leads...</div>
              ) : filteredUnclaimedLeads.length > 0 ? (
                <div className="space-y-4">
                  {filteredUnclaimedLeads.map((lead: any) => (
                    <div key={lead.id} className="border rounded-lg p-4">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium">{lead.fullName || 'Unknown Contact'}</h3>
                            <LeadStatusBadge status={lead.status || 'New'} />
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 mt-2">
                            {lead.company && (
                              <div className="flex items-center text-sm text-gray-600">
                                <Building className="h-4 w-4 mr-2 text-gray-400" />
                                {lead.company}
                              </div>
                            )}
                            
                            {lead.phone && (
                              <div className="flex items-center text-sm text-gray-600">
                                <Phone className="h-4 w-4 mr-2 text-gray-400" />
                                {lead.phone}
                              </div>
                            )}
                            
                            {lead.email && (
                              <div className="flex items-center text-sm text-gray-600">
                                <Mail className="h-4 w-4 mr-2 text-gray-400" />
                                {lead.email}
                              </div>
                            )}
                            
                            <div className="flex items-center text-sm text-gray-600">
                              <Clock className="h-4 w-4 mr-2 text-gray-400" />
                              {lead.createdAt 
                                ? `Added ${formatDistanceToNow(new Date(lead.createdAt))} ago` 
                                : 'Recently added'}
                            </div>
                          </div>
                          
                          {lead.notes && (
                            <div className="mt-3 text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
                              <p className="font-medium mb-1">Notes:</p>
                              <p>{lead.notes}</p>
                            </div>
                          )}
                        </div>
                        
                        <div className="mt-4 md:mt-0 md:ml-4 flex flex-col gap-2">
                          <Button onClick={() => handleClaimLead(lead)}>
                            Claim Lead
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">
                    <Users className="h-6 w-6 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium">No unclaimed leads</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {searchTerm 
                      ? "No unclaimed leads match your search criteria" 
                      : "There are currently no unclaimed leads in the system"}
                  </p>
                </div>
              )}
            </CardContent>
            {filteredUnclaimedLeads.length > 0 && (
              <CardFooter className="border-t pt-4 pb-2 px-6">
                <div className="w-full text-center text-sm text-gray-500">
                  Showing {filteredUnclaimedLeads.length} of {unclaimedLeads?.data?.length || 0} unclaimed leads
                </div>
              </CardFooter>
            )}
          </Card>
        </TabsContent>
        
        {/* My Leads Tab */}
        <TabsContent value="my-leads">
          <Card>
            <CardHeader>
              <CardTitle>My Leads</CardTitle>
              <CardDescription>
                These are leads you have claimed and can now create orders for.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingMyLeads ? (
                <div className="text-center py-4">Loading your leads...</div>
              ) : filteredMyLeads.length > 0 ? (
                <div className="space-y-4">
                  {filteredMyLeads.map((lead: any) => (
                    <div key={lead.id} className="border rounded-lg p-4">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium">{lead.fullName || 'Unknown Contact'}</h3>
                            <LeadStatusBadge status={lead.status || 'New'} />
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 mt-2">
                            {lead.company && (
                              <div className="flex items-center text-sm text-gray-600">
                                <Building className="h-4 w-4 mr-2 text-gray-400" />
                                {lead.company}
                              </div>
                            )}
                            
                            {lead.phone && (
                              <div className="flex items-center text-sm text-gray-600">
                                <Phone className="h-4 w-4 mr-2 text-gray-400" />
                                {lead.phone}
                              </div>
                            )}
                            
                            {lead.email && (
                              <div className="flex items-center text-sm text-gray-600">
                                <Mail className="h-4 w-4 mr-2 text-gray-400" />
                                {lead.email}
                              </div>
                            )}
                            
                            <div className="flex items-center text-sm text-gray-600">
                              <Clock className="h-4 w-4 mr-2 text-gray-400" />
                              {lead.claimedAt 
                                ? `Claimed ${formatDistanceToNow(new Date(lead.claimedAt))} ago` 
                                : 'Recently claimed'}
                            </div>
                          </div>
                          
                          {lead.notes && (
                            <div className="mt-3 text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
                              <p className="font-medium mb-1">Notes:</p>
                              <p>{lead.notes}</p>
                            </div>
                          )}
                        </div>
                        
                        <div className="mt-4 md:mt-0 md:ml-4 flex flex-col gap-2">
                          <Button asChild variant="default">
                            <Link href={`/orders/create?lead=${lead.id}`}>
                              Create Order
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
                    <User className="h-6 w-6 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium">No leads claimed</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {searchTerm 
                      ? "No claimed leads match your search criteria" 
                      : "You haven't claimed any leads yet"}
                  </p>
                  {!searchTerm && (
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => setActiveTab("unclaimed")}
                    >
                      View Available Leads
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
            {filteredMyLeads.length > 0 && (
              <CardFooter className="border-t pt-4 pb-2 px-6">
                <div className="w-full text-center text-sm text-gray-500">
                  Showing {filteredMyLeads.length} of {myLeads?.data?.length || 0} of your leads
                </div>
              </CardFooter>
            )}
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Quick Tips */}
      <div className="mt-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Lead Management Tips</AlertTitle>
          <AlertDescription>
            To maximize your success with lead conversion:
            <ul className="mt-2 ml-4 list-disc space-y-1 text-sm">
              <li>Review the Sales Process Guide for best practices</li>
              <li>Contact leads within 24 hours of claiming them</li>
              <li>Add detailed notes about your interactions</li>
              <li>Convert leads to orders as soon as they are qualified</li>
            </ul>
            <Button asChild variant="link" className="p-0 h-auto ml-1 text-brand-600 font-medium">
              <Link href="/sales-process-guide">View Sales Process Guide</Link>
            </Button>
          </AlertDescription>
        </Alert>
      </div>
      
      {/* Claim Lead Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Claim Lead</DialogTitle>
            <DialogDescription>
              You are about to claim this lead. Once claimed, you will be responsible for following up with the client.
            </DialogDescription>
          </DialogHeader>
          
          {selectedLead && (
            <div className="py-4">
              <div className="mb-4 p-3 bg-gray-50 rounded-md">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-medium">{selectedLead.fullName || 'Unknown Contact'}</h3>
                  <LeadStatusBadge status={selectedLead.status || 'New'} />
                </div>
                {selectedLead.company && (
                  <p className="text-sm text-gray-600 mb-1">
                    <Building className="inline-block h-4 w-4 mr-1 text-gray-400" />
                    {selectedLead.company}
                  </p>
                )}
                {selectedLead.email && (
                  <p className="text-sm text-gray-600 mb-1">
                    <Mail className="inline-block h-4 w-4 mr-1 text-gray-400" />
                    {selectedLead.email}
                  </p>
                )}
                {selectedLead.phone && (
                  <p className="text-sm text-gray-600">
                    <Phone className="inline-block h-4 w-4 mr-1 text-gray-400" />
                    {selectedLead.phone}
                  </p>
                )}
              </div>
              
              <div className="space-y-4">
                <div className="grid w-full gap-1.5">
                  <Label htmlFor="claim-notes">Additional Notes</Label>
                  <Textarea
                    id="claim-notes"
                    placeholder="Add any notes about your plan to contact this lead..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                  <p className="text-sm text-gray-500">
                    These notes will be added to the lead's record.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={confirmClaimLead}
              disabled={claimLeadMutation.isPending}
            >
              {claimLeadMutation.isPending ? "Claiming..." : "Confirm Claim"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}