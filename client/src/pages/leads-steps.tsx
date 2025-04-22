import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Loader2, 
  Users, 
  User, 
  Filter 
} from "lucide-react";
import LeadStepProgress from "@/components/leads/lead-step-progress";
import { useAuth } from "@/hooks/use-auth";
import { ROLES } from "@shared/schema";

// Interface for lead data structure
interface Lead {
  id: number;
  companyName?: string;
  contactName?: string;
  phone?: string;
  email?: string;
  source?: string;
  status: string;
  assignedTo?: number | null;
  assignedToName?: string;
  notes?: string;
  value?: string | null;
  createdAt: string;
  updatedAt?: string;
  contactComplete?: boolean;
  itemsConfirmed?: boolean;
  submittedToDesign?: boolean;
}

export default function LeadsStepsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("all");
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);
  
  // Filter options
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [showOnlyMine, setShowOnlyMine] = useState(true);
  
  // Query to fetch all leads
  const { data: leadsResponse, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/leads"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/leads");
        if (!response.ok) {
          throw new Error("Failed to fetch leads");
        }
        return response.json();
      } catch (error) {
        console.error("Error fetching leads:", error);
        throw error;
      }
    },
  });
  
  // All leads from the response
  const allLeads: Lead[] = leadsResponse?.data || [];
  
  // Filter leads based on active tab and filters
  const filteredLeads = allLeads.filter((lead) => {
    // Filter by ownership if showOnlyMine is true
    if (showOnlyMine && user) {
      const userOwnsLead = lead.assignedTo === user.id;
      // Special case for admin with executive role - include their leads specifically
      const isExecutiveAdmin = user.role === ROLES.Admin && user.isExecutive;
      
      // If not the lead owner or executive admin, skip this lead
      if (!userOwnsLead && !isExecutiveAdmin) {
        return false;
      }
    }
    
    // Filter by status if a filter is applied
    if (filterStatus && lead.status !== filterStatus) {
      return false;
    }
    
    // Filter based on the active tab
    switch (activeTab) {
      case "step1":
        return !lead.contactComplete;
      case "step2":
        return lead.contactComplete && !lead.itemsConfirmed;
      case "step3":
        return lead.contactComplete && lead.itemsConfirmed && !lead.submittedToDesign;
      case "completed":
        return lead.contactComplete && lead.itemsConfirmed && lead.submittedToDesign;
      case "all":
      default:
        return true;
    }
  });
  
  // Function to calculate lead progress percentage
  function calculateProgress(lead: Lead): number {
    let steps = 0;
    let completed = 0;
    
    // Count total steps
    steps = 3;
    
    // Count completed steps
    if (lead.contactComplete) completed++;
    if (lead.itemsConfirmed) completed++;
    if (lead.submittedToDesign) completed++;
    
    // Calculate percentage
    return (completed / steps) * 100;
  }
  
  // Get the selected lead object
  const selectedLead = selectedLeadId ? allLeads.find(lead => lead.id === selectedLeadId) : null;
  
  // Handle lead update (refresh data)
  const handleLeadUpdate = () => {
    refetch();
  };

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lead Progress Steps</h1>
          <p className="text-gray-500 mt-1">
            Manage and track the progress of your leads through the sales pipeline.
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowOnlyMine(!showOnlyMine)}
            className={showOnlyMine ? "bg-primary/10" : ""}
          >
            <User className="mr-2 h-4 w-4" />
            {showOnlyMine ? "My Leads Only" : "All Leads"}
          </Button>
          <Button variant="outline" onClick={() => refetch()}>
            Refresh
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column: Lead list with tabs */}
        <div className="md:col-span-1 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Leads by Progress Stage</CardTitle>
              <CardDescription>
                Select a lead to view and update its progress through the sales pipeline.
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-2">
              <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full">
                  <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
                  <TabsTrigger value="step1" className="flex-1">Step 1</TabsTrigger>
                  <TabsTrigger value="step2" className="flex-1">Step 2</TabsTrigger>
                  <TabsTrigger value="step3" className="flex-1">Step 3</TabsTrigger>
                  <TabsTrigger value="completed" className="flex-1">Done</TabsTrigger>
                </TabsList>
                
                <div className="mt-4">
                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : error ? (
                    <div className="flex items-center justify-center py-8 text-red-500">
                      <AlertCircle className="h-5 w-5 mr-2" />
                      <span>Error loading leads</span>
                    </div>
                  ) : filteredLeads.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="h-8 w-8 mx-auto mb-2" />
                      <h3 className="font-medium">No leads found</h3>
                      <p className="text-sm mt-1">
                        {showOnlyMine 
                          ? "You don't have any leads in this category yet." 
                          : "There are no leads in this category yet."}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                      {filteredLeads.map((lead) => {
                        const progress = calculateProgress(lead);
                        return (
                          <div
                            key={lead.id}
                            className={`p-3 rounded-md border cursor-pointer transition-colors ${
                              selectedLeadId === lead.id
                                ? "bg-primary/10 border-primary"
                                : "bg-card hover:bg-muted/50"
                            }`}
                            onClick={() => setSelectedLeadId(lead.id)}
                          >
                            <div className="flex justify-between items-start mb-1">
                              <h4 className="font-medium truncate">
                                {lead.companyName || "Unnamed Lead"}
                              </h4>
                              <Badge 
                                variant={
                                  lead.status === "new" ? "default" :
                                  lead.status === "contacted" ? "secondary" :
                                  lead.status === "qualified" ? "outline" :
                                  lead.status === "converted" ? "success" :
                                  lead.status === "closed" ? "destructive" :
                                  "outline"
                                }
                                className="ml-1 text-xs"
                              >
                                {lead.status}
                              </Badge>
                            </div>
                            
                            <div className="text-sm text-gray-500 mb-2">
                              {lead.contactName && (
                                <div className="truncate">{lead.contactName}</div>
                              )}
                              <div className="flex items-center text-xs mt-1">
                                <Clock className="h-3 w-3 mr-1" />
                                <span>
                                  {new Date(lead.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            
                            {/* Progress bar */}
                            <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${
                                  progress === 100
                                    ? "bg-green-500"
                                    : progress > 66
                                    ? "bg-blue-500"
                                    : progress > 33
                                    ? "bg-yellow-500"
                                    : "bg-gray-400"
                                }`}
                                style={{ width: `${progress}%` }}
                              ></div>
                            </div>
                            
                            {/* Progress status */}
                            <div className="flex items-center mt-2 text-xs text-gray-600">
                              <span className="flex items-center mr-3">
                                {lead.contactComplete ? (
                                  <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                                ) : (
                                  <span className="h-3 w-3 rounded-full bg-gray-300 mr-1"></span>
                                )}
                                Contact
                              </span>
                              <span className="flex items-center mr-3">
                                {lead.itemsConfirmed ? (
                                  <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                                ) : (
                                  <span className="h-3 w-3 rounded-full bg-gray-300 mr-1"></span>
                                )}
                                Items
                              </span>
                              <span className="flex items-center">
                                {lead.submittedToDesign ? (
                                  <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                                ) : (
                                  <span className="h-3 w-3 rounded-full bg-gray-300 mr-1"></span>
                                )}
                                Design
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </Tabs>
            </CardContent>
          </Card>
        </div>
        
        {/* Right column: Lead details with progress steps */}
        <div className="md:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>
                {selectedLead ? (
                  <>Lead Details: {selectedLead.companyName || "Unnamed Lead"}</>
                ) : (
                  <>Select a Lead</>
                )}
              </CardTitle>
              <CardDescription>
                {selectedLead
                  ? "Track lead progress through the sales pipeline steps"
                  : "Choose a lead from the list to view and update its progress"}
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {selectedLead ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Lead Information</h3>
                      <div className="mt-2 space-y-2">
                        <div className="flex">
                          <span className="text-sm font-medium w-28">Company:</span>
                          <span className="text-sm">{selectedLead.companyName || "N/A"}</span>
                        </div>
                        <div className="flex">
                          <span className="text-sm font-medium w-28">Contact:</span>
                          <span className="text-sm">{selectedLead.contactName || "N/A"}</span>
                        </div>
                        <div className="flex">
                          <span className="text-sm font-medium w-28">Phone:</span>
                          <span className="text-sm">{selectedLead.phone || "N/A"}</span>
                        </div>
                        <div className="flex">
                          <span className="text-sm font-medium w-28">Email:</span>
                          <span className="text-sm">{selectedLead.email || "N/A"}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Lead Status</h3>
                      <div className="mt-2 space-y-2">
                        <div className="flex">
                          <span className="text-sm font-medium w-28">Assigned To:</span>
                          <span className="text-sm">{selectedLead.assignedToName || "Unassigned"}</span>
                        </div>
                        <div className="flex">
                          <span className="text-sm font-medium w-28">Status:</span>
                          <span className="text-sm">
                            <Badge variant="outline" className="font-normal">
                              {selectedLead.status}
                            </Badge>
                          </span>
                        </div>
                        <div className="flex">
                          <span className="text-sm font-medium w-28">Est. Value:</span>
                          <span className="text-sm">{selectedLead.value || "Not specified"}</span>
                        </div>
                        <div className="flex">
                          <span className="text-sm font-medium w-28">Created:</span>
                          <span className="text-sm">
                            {new Date(selectedLead.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <LeadStepProgress
                    leadId={selectedLead.id}
                    initialContactComplete={!!selectedLead.contactComplete}
                    initialItemsConfirmed={!!selectedLead.itemsConfirmed}
                    initialSubmittedToDesign={!!selectedLead.submittedToDesign}
                    onUpdate={handleLeadUpdate}
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Users className="h-12 w-12 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-600 mb-1">No Lead Selected</h3>
                  <p className="text-gray-500 max-w-md">
                    Select a lead from the list on the left to view details and track its progress
                    through the sales pipeline.
                  </p>
                </div>
              )}
            </CardContent>
            
            {selectedLead && (
              <CardFooter className="flex justify-between border-t pt-4">
                <Button variant="outline" onClick={() => setSelectedLeadId(null)}>
                  Close
                </Button>
                <div className="flex items-center">
                  <div className="w-36 h-2 bg-gray-200 rounded-full overflow-hidden mr-3">
                    <div
                      className={`h-full ${
                        calculateProgress(selectedLead) === 100
                          ? "bg-green-500"
                          : calculateProgress(selectedLead) > 66
                          ? "bg-blue-500"
                          : calculateProgress(selectedLead) > 33
                          ? "bg-yellow-500"
                          : "bg-gray-400"
                      }`}
                      style={{ width: `${calculateProgress(selectedLead)}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600">
                    {calculateProgress(selectedLead)}% Complete
                  </span>
                </div>
              </CardFooter>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}