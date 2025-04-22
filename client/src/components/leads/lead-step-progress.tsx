import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  CheckCircle2, 
  ChevronDown, 
  ChevronRight, 
  Clipboard, 
  FileCheck, 
  ListChecks, 
  Phone, 
  Save,
  CheckSquare,
  AlertCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
import { format } from "date-fns";

interface LeadStepProgressProps {
  leadId: number;
  initialContactComplete: boolean;
  initialItemsConfirmed: boolean;
  initialSubmittedToDesign: boolean;
  onUpdate: () => void;
}

interface ContactLog {
  id: number;
  leadId: number;
  userId: number;
  contactMethod: string;
  notes: string | null;
  timestamp: string;
}

export default function LeadStepProgress({
  leadId,
  initialContactComplete,
  initialItemsConfirmed,
  initialSubmittedToDesign,
  onUpdate,
}: LeadStepProgressProps) {
  const { toast } = useToast();
  const [contactComplete, setContactComplete] = useState(initialContactComplete);
  const [itemsConfirmed, setItemsConfirmed] = useState(initialItemsConfirmed);
  const [submittedToDesign, setSubmittedToDesign] = useState(initialSubmittedToDesign);
  
  // State for expanded sections
  const [expandedSections, setExpandedSections] = useState({
    contactClient: !initialContactComplete,
    confirmItems: initialContactComplete && !initialItemsConfirmed,
    submitDesign: initialContactComplete && initialItemsConfirmed && !initialSubmittedToDesign
  });
  
  // Contact log form state
  const [contactMethod, setContactMethod] = useState("phone");
  const [contactNotes, setContactNotes] = useState("");
  const [isContactLogDialogOpen, setIsContactLogDialogOpen] = useState(false);
  
  // Items confirmation state
  const [itemDescription, setItemDescription] = useState("");
  const [itemQuantity, setItemQuantity] = useState("");
  const [itemDeadline, setItemDeadline] = useState("");
  const [itemNotes, setItemNotes] = useState("");
  
  // Design submission state
  const [designNotes, setDesignNotes] = useState("");
  const [designRequirements, setDesignRequirements] = useState("");
  
  // Fetch contact logs
  const { data: contactLogsData, isLoading: isLoadingLogs } = useQuery({
    queryKey: [`/api/leads/${leadId}/contact-logs`],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", `/api/leads/${leadId}/contact-logs`);
        if (!response.ok) {
          throw new Error("Failed to fetch contact logs");
        }
        return response.json();
      } catch (error) {
        console.error("Error fetching contact logs:", error);
        return { data: [] }; // Return empty array on error
      }
    },
    retry: 1,
    refetchOnWindowFocus: false
  });
  
  const contactLogs: ContactLog[] = contactLogsData?.data || [];
  
  // Update expanded sections when props change
  useEffect(() => {
    setContactComplete(initialContactComplete);
    setItemsConfirmed(initialItemsConfirmed);
    setSubmittedToDesign(initialSubmittedToDesign);
    
    setExpandedSections({
      contactClient: !initialContactComplete,
      confirmItems: initialContactComplete && !initialItemsConfirmed,
      submitDesign: initialContactComplete && initialItemsConfirmed && !initialSubmittedToDesign
    });
  }, [initialContactComplete, initialItemsConfirmed, initialSubmittedToDesign]);
  
  // Format date function
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch (error) {
      return dateString || 'Unknown date';
    }
  };
  
  // Mutation to update lead progress
  const updateProgressMutation = useMutation({
    mutationFn: async (updates: {
      contactComplete?: boolean;
      itemsConfirmed?: boolean;
      submittedToDesign?: boolean;
    }) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      try {
        const response = await apiRequest("PATCH", `/api/leads/${leadId}/progress`, updates, {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to update progress: ${errorText}`);
        }
        
        return response.json();
      } catch (error) {
        console.error("Error updating lead progress:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      const updatedLead = data.data || data;
      
      // Update local state
      setContactComplete(!!updatedLead.contactComplete);
      setItemsConfirmed(!!updatedLead.itemsConfirmed);
      setSubmittedToDesign(!!updatedLead.submittedToDesign);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      
      // Call parent update function
      onUpdate();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Update Progress",
        description: error.message || "An error occurred while updating lead progress.",
        variant: "destructive",
      });
    }
  });
  
  // Mutation to add contact log
  const addContactLogMutation = useMutation({
    mutationFn: async (data: {
      leadId: number;
      contactMethod: string;
      notes: string;
    }) => {
      const response = await apiRequest("POST", `/api/leads/${leadId}/contact-logs`, data);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to add contact log: ${errorText}`);
      }
      return response.json();
    },
    onSuccess: () => {
      // Reset form
      setContactNotes("");
      setIsContactLogDialogOpen(false);
      
      // Update progress
      if (!contactComplete) {
        updateProgressMutation.mutate({ contactComplete: true });
      }
      
      // Refresh contact logs
      queryClient.invalidateQueries({ queryKey: [`/api/leads/${leadId}/contact-logs`] });
      
      // Show success message
      toast({
        title: "Contact Log Added",
        description: "The contact log has been added successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Add Contact Log",
        description: error.message || "An error occurred while adding the contact log.",
        variant: "destructive",
      });
    }
  });
  
  // Function to handle step toggle
  const handleToggleStep = (step: string, value: boolean) => {
    console.log(`Toggling step ${step} to ${value}`);
    
    // Create updates object
    const updates: {
      contactComplete?: boolean;
      itemsConfirmed?: boolean;
      submittedToDesign?: boolean;
    } = {};
    
    switch (step) {
      case 'contact':
        updates.contactComplete = value;
        break;
      case 'items':
        updates.itemsConfirmed = value;
        break;
      case 'design':
        updates.submittedToDesign = value;
        break;
    }
    
    // Update on server
    updateProgressMutation.mutate(updates);
    
    // Optimistically update UI (will be reverted on error by mutation)
    switch (step) {
      case 'contact':
        setContactComplete(value);
        setExpandedSections({
          contactClient: !value,
          confirmItems: value,
          submitDesign: false
        });
        break;
      case 'items':
        setItemsConfirmed(value);
        setExpandedSections({
          contactClient: false,
          confirmItems: !value,
          submitDesign: value
        });
        break;
      case 'design':
        setSubmittedToDesign(value);
        setExpandedSections({
          contactClient: false,
          confirmItems: false,
          submitDesign: !value
        });
        break;
    }
  };
  
  // Function to handle contact log submission
  const handleAddContactLog = () => {
    if (!contactNotes.trim()) {
      toast({
        title: "Missing Information",
        description: "Please add notes about the contact.",
        variant: "destructive",
      });
      return;
    }
    
    addContactLogMutation.mutate({
      leadId,
      contactMethod,
      notes: contactNotes,
    });
  };
  
  // Function to handle saving items confirmation
  const handleSaveItems = () => {
    if (!itemDescription.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide a description of the items.",
        variant: "destructive",
      });
      return;
    }
    
    // Update lead progress
    handleToggleStep('items', true);
    
    // Show success message
    toast({
      title: "Items Confirmed",
      description: "The item requirements have been confirmed.",
    });
    
    // Reset form
    setItemDescription("");
    setItemQuantity("");
    setItemDeadline("");
    setItemNotes("");
  };
  
  // Function to handle saving design submission
  const handleSubmitToDesign = () => {
    if (!designRequirements.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide design requirements.",
        variant: "destructive",
      });
      return;
    }
    
    // Update lead progress
    handleToggleStep('design', true);
    
    // Show success message
    toast({
      title: "Submitted to Design",
      description: "The lead has been submitted to the design team.",
    });
    
    // Reset form
    setDesignRequirements("");
    setDesignNotes("");
  };
  
  return (
    <div className="space-y-6">
      {/* Step 1: Contact Client */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl flex items-center">
            <div 
              className={`mr-3 h-8 w-8 rounded-full flex items-center justify-center ${
                contactComplete ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {contactComplete ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <Phone className="h-5 w-5" />
              )}
            </div>
            <span>Step 1: Contact Client</span>
            {contactComplete && (
              <Badge className="ml-2 bg-green-600 text-white">Completed</Badge>
            )}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpandedSections(prev => ({ 
              ...prev, 
              contactClient: !prev.contactClient 
            }))}
          >
            {expandedSections.contactClient ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </CardHeader>
        
        {expandedSections.contactClient && (
          <CardContent>
            <p className="text-gray-600 mb-4">
              Make initial contact with the client to discuss their needs and establish a relationship.
              Record your communication logs to keep track of all interactions.
            </p>
            
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <Dialog open={isContactLogDialogOpen} onOpenChange={setIsContactLogDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Phone className="mr-2 h-4 w-4" />
                      Log Contact
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Contact Log</DialogTitle>
                      <DialogDescription>
                        Record your communication with the client.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="contactMethod">Contact Method</Label>
                        <Select
                          value={contactMethod}
                          onValueChange={setContactMethod}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select contact method" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="phone">Phone</SelectItem>
                            <SelectItem value="meeting">Meeting</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="contactNotes">Notes</Label>
                        <Textarea
                          id="contactNotes"
                          value={contactNotes}
                          onChange={(e) => setContactNotes(e.target.value)}
                          placeholder="Enter details about the contact..."
                          className="h-24"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        type="submit"
                        onClick={handleAddContactLog}
                        disabled={addContactLogMutation.isPending}
                      >
                        {addContactLogMutation.isPending ? "Saving..." : "Save Log"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                
                {contactComplete ? (
                  <Button
                    variant="outline"
                    onClick={() => handleToggleStep('contact', false)}
                    disabled={updateProgressMutation.isPending}
                  >
                    Mark as Incomplete
                  </Button>
                ) : (
                  <Button
                    variant="default"
                    onClick={() => handleToggleStep('contact', true)}
                    disabled={updateProgressMutation.isPending}
                  >
                    <CheckSquare className="mr-2 h-4 w-4" />
                    {updateProgressMutation.isPending ? "Saving..." : "Mark as Complete"}
                  </Button>
                )}
              </div>
              
              <Separator />
              
              <div>
                <h4 className="text-sm font-medium mb-2">Contact History</h4>
                {isLoadingLogs ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
                  </div>
                ) : contactLogs.length > 0 ? (
                  <div className="space-y-3">
                    {contactLogs.map((log) => (
                      <div key={log.id} className="p-3 bg-gray-50 rounded-md">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium capitalize">{log.contactMethod}</span>
                          <span className="text-xs text-gray-500">
                            {formatDate(log.timestamp)}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">
                          {log.notes || "No notes provided for this contact."}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <Clipboard className="mx-auto h-8 w-8 mb-2 text-gray-400" />
                    <p>No contact logs yet. Use the "Log Contact" button to record communications.</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        )}
      </Card>
      
      {/* Step 2: Confirm Items */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl flex items-center">
            <div 
              className={`mr-3 h-8 w-8 rounded-full flex items-center justify-center ${
                itemsConfirmed ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {itemsConfirmed ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <ListChecks className="h-5 w-5" />
              )}
            </div>
            <span>Step 2: Confirm Items</span>
            {itemsConfirmed && (
              <Badge className="ml-2 bg-green-600 text-white">Completed</Badge>
            )}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpandedSections(prev => ({ 
              ...prev, 
              confirmItems: !prev.confirmItems 
            }))}
            disabled={!contactComplete}
          >
            {expandedSections.confirmItems ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </CardHeader>
        
        {expandedSections.confirmItems && contactComplete && (
          <CardContent>
            <p className="text-gray-600 mb-4">
              Confirm the items, quantities, and specifications with the client.
              Document all requirements to ensure the design team has all the necessary information.
            </p>
            
            <div className="space-y-4">
              {itemsConfirmed ? (
                <div>
                  <div className="flex justify-between mb-4">
                    <h4 className="text-sm font-medium">Item Requirements</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleStep('items', false)}
                      disabled={updateProgressMutation.isPending}
                    >
                      Edit Requirements
                    </Button>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-md">
                    <p className="text-green-600 font-medium mb-2">
                      <CheckCircle2 className="inline h-4 w-4 mr-1" />
                      Items have been confirmed with the client
                    </p>
                    <p className="text-sm text-gray-700">
                      You've verified and documented all the required items for this lead.
                      If you need to make changes, click "Edit Requirements" above.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid gap-3">
                    <Label htmlFor="itemDescription">Item Description</Label>
                    <Textarea
                      id="itemDescription"
                      value={itemDescription}
                      onChange={(e) => setItemDescription(e.target.value)}
                      placeholder="Describe the items requested by the client..."
                      className="h-24"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="itemQuantity">Quantity</Label>
                      <Input
                        id="itemQuantity"
                        value={itemQuantity}
                        onChange={(e) => setItemQuantity(e.target.value)}
                        placeholder="Enter quantity"
                      />
                    </div>
                    <div>
                      <Label htmlFor="itemDeadline">Deadline</Label>
                      <Input
                        id="itemDeadline"
                        type="date"
                        value={itemDeadline}
                        onChange={(e) => setItemDeadline(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="itemNotes">Additional Notes</Label>
                    <Textarea
                      id="itemNotes"
                      value={itemNotes}
                      onChange={(e) => setItemNotes(e.target.value)}
                      placeholder="Any additional information about the items..."
                      className="h-20"
                    />
                  </div>
                  
                  <div className="flex justify-end">
                    <Button 
                      onClick={handleSaveItems}
                      disabled={updateProgressMutation.isPending || !itemDescription.trim()}
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {updateProgressMutation.isPending ? "Saving..." : "Save and Complete"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        )}
        
        {!contactComplete && (
          <CardContent>
            <div className="p-4 bg-amber-50 rounded-md flex items-center text-amber-800">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
              <p>Please complete Step 1 before confirming items.</p>
            </div>
          </CardContent>
        )}
      </Card>
      
      {/* Step 3: Submit to Design */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl flex items-center">
            <div 
              className={`mr-3 h-8 w-8 rounded-full flex items-center justify-center ${
                submittedToDesign ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {submittedToDesign ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <FileCheck className="h-5 w-5" />
              )}
            </div>
            <span>Step 3: Submit to Design</span>
            {submittedToDesign && (
              <Badge className="ml-2 bg-green-600 text-white">Completed</Badge>
            )}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpandedSections(prev => ({ 
              ...prev, 
              submitDesign: !prev.submitDesign 
            }))}
            disabled={!contactComplete || !itemsConfirmed}
          >
            {expandedSections.submitDesign ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </CardHeader>
        
        {expandedSections.submitDesign && contactComplete && itemsConfirmed && (
          <CardContent>
            <p className="text-gray-600 mb-4">
              Submit the lead to the design team with all necessary requirements and specifications.
              Add any design-specific notes or instructions to ensure the design meets client expectations.
            </p>
            
            <div className="space-y-4">
              {submittedToDesign ? (
                <div>
                  <div className="flex justify-between mb-4">
                    <h4 className="text-sm font-medium">Design Submission</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleStep('design', false)}
                      disabled={updateProgressMutation.isPending}
                    >
                      Edit Submission
                    </Button>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-md">
                    <p className="text-green-600 font-medium mb-2">
                      <CheckCircle2 className="inline h-4 w-4 mr-1" />
                      Lead has been submitted to the design team
                    </p>
                    <p className="text-sm text-gray-700">
                      The design team has received all requirements and will begin working on designs.
                      You'll be notified when designs are ready for review.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid gap-3">
                    <Label htmlFor="designRequirements">Design Requirements</Label>
                    <Textarea
                      id="designRequirements"
                      value={designRequirements}
                      onChange={(e) => setDesignRequirements(e.target.value)}
                      placeholder="Specify design requirements, colors, styles, etc..."
                      className="h-24"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="designNotes">Additional Notes for Design Team</Label>
                    <Textarea
                      id="designNotes"
                      value={designNotes}
                      onChange={(e) => setDesignNotes(e.target.value)}
                      placeholder="Any additional instructions or context for the design team..."
                      className="h-20"
                    />
                  </div>
                  
                  <div className="flex justify-end">
                    <Button 
                      onClick={handleSubmitToDesign}
                      disabled={updateProgressMutation.isPending || !designRequirements.trim()}
                    >
                      <FileCheck className="mr-2 h-4 w-4" />
                      {updateProgressMutation.isPending ? "Submitting..." : "Submit to Design"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        )}
        
        {(!contactComplete || !itemsConfirmed) && (
          <CardContent>
            <div className="p-4 bg-amber-50 rounded-md flex items-center text-amber-800">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
              <p>Please complete Steps 1 and 2 before submitting to design.</p>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}