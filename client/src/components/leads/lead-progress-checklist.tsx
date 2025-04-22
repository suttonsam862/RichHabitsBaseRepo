import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BookOpen, Calendar, CheckCircle2, CheckSquare, Circle, Clipboard, Clock, FileCheck, ListChecks, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format, parseISO } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface ContactLog {
  id: number;
  leadId: number;
  userId: number;
  contactMethod: string;
  notes: string | null;
  timestamp: string;
}

interface LeadProgressChecklistProps {
  leadId: number;
  contactComplete: boolean;
  itemsConfirmed: boolean;
  submittedToDesign: boolean;
  contactLogs: ContactLog[];
  onUpdate: () => void;
}

export default function LeadProgressChecklist({
  leadId,
  contactComplete: initialContactComplete,
  itemsConfirmed: initialItemsConfirmed,
  submittedToDesign: initialSubmittedToDesign,
  contactLogs,
  onUpdate,
}: LeadProgressChecklistProps) {
  const { toast } = useToast();
  const [contactComplete, setContactComplete] = useState(initialContactComplete);
  const [itemsConfirmed, setItemsConfirmed] = useState(initialItemsConfirmed);
  const [submittedToDesign, setSubmittedToDesign] = useState(initialSubmittedToDesign);
  const [expandedPanel, setExpandedPanel] = useState<string | null>(null);
  const [isContactLogOpen, setIsContactLogOpen] = useState(false);
  const [isContactLogHistoryOpen, setIsContactLogHistoryOpen] = useState(false);
  const [contactMethod, setContactMethod] = useState("phone");
  const [contactNotes, setContactNotes] = useState("");
  
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'MMM d, yyyy h:mm a');
    } catch (e) {
      console.error("Date formatting error:", e);
      return dateString || 'Unknown date';
    }
  };

  // Mutation to update progress
  const updateProgressMutation = useMutation({
    mutationFn: async (updates: {
      contactComplete?: boolean;
      itemsConfirmed?: boolean;
      submittedToDesign?: boolean;
    }) => {
      console.log("Updating lead progress:", updates);
      const response = await apiRequest("PATCH", `/api/leads/${leadId}/progress`, updates);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update lead progress: ${errorText}`);
      }
      return response.json();
    },
    onSuccess: () => {
      console.log("Lead progress updated successfully");
      // Invalidate and refetch leads data
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
    },
    onError: (error: Error) => {
      console.error("Error updating lead progress:", error);
      toast({
        title: "Error",
        description: `Failed to update lead progress: ${error.message}`,
        variant: "destructive",
      });
    },
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
      // Update local state first for responsive UI
      setContactComplete(true);
      
      // Reset form and close dialog
      setContactNotes("");
      setIsContactLogOpen(false);
      
      // Then update on server if needed
      if (!contactComplete) {
        updateProgressMutation.mutate({ contactComplete: true });
      }
      
      // Show success message
      toast({
        title: "Contact log added",
        description: "The contact log has been added successfully.",
      });
      
      // Call onUpdate to refresh the parent component's UI 
      onUpdate();
      
      // Schedule a background refetch to ensure data consistency
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: [`/api/leads/${leadId}/contact-logs`] });
        queryClient.invalidateQueries({ queryKey: [`/api/leads`] });
      }, 500);
    },
    onError: (error: Error) => {
      console.error('Error adding contact log:', error);
      toast({
        title: "Failed to add contact log",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAddContactLog = () => {
    if (!contactNotes.trim()) {
      toast({
        title: "Missing information",
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

  const handleToggleStep = async (step: string, value: boolean) => {
    try {
      // This object will track what we're updating
      let progressUpdates: { 
        contactComplete?: boolean; 
        itemsConfirmed?: boolean; 
        submittedToDesign?: boolean; 
      } = {};
      
      // First update the UI state directly for immediate feedback
      switch (step) {
        case 'contact': {
          setContactComplete(value);
          progressUpdates.contactComplete = value;
          break;
        }
        case 'items': {
          setItemsConfirmed(value);
          progressUpdates.itemsConfirmed = value;
          break;
        }
        case 'design': {
          setSubmittedToDesign(value);
          progressUpdates.submittedToDesign = value;
          break;
        }
      }
      
      // Apply optimistic update to the cache
      queryClient.setQueryData(["/api/leads"], (oldData: any) => {
        if (!oldData?.data) return oldData;
        
        return {
          ...oldData,
          data: oldData.data.map((lead: any) => {
            if (lead.id === leadId) {
              return { ...lead, ...progressUpdates };
            }
            return lead;
          })
        };
      });
      
      // Send update to the server
      const result = await updateProgressMutation.mutateAsync(progressUpdates);
      
      if (result?.success && result?.data) {
        // Update local state with server values
        setContactComplete(!!result.data.contactComplete);
        setItemsConfirmed(!!result.data.itemsConfirmed);
        setSubmittedToDesign(!!result.data.submittedToDesign);
        
        // Automatically show the next step if completing a step
        if (value) {
          // Show appropriate toast
          switch (step) {
            case 'contact':
              toast({
                title: "Step 1 Complete",
                description: "Lead contact information has been saved",
                variant: "default",
              });
              
              // Force tab to stay on progress
              (document.querySelector('[data-value="progress"]') as HTMLElement)?.click();
              
              // Expand the next panel if it's not already completed
              if (!itemsConfirmed) {
                setExpandedPanel('items');
              }
              break;
              
            case 'items':
              toast({
                title: "Step 2 Complete",
                description: "Item requirements have been confirmed",
                variant: "default",
              });
              
              // Force tab to stay on progress
              (document.querySelector('[data-value="progress"]') as HTMLElement)?.click();
              
              // Expand the next panel if it's not already completed
              if (!submittedToDesign) {
                setExpandedPanel('design');
              }
              break;
              
            case 'design':
              toast({
                title: "Lead Process Complete!",
                description: "All steps have been completed successfully",
                variant: "default",
              });
              
              // Force tab to stay on progress
              (document.querySelector('[data-value="progress"]') as HTMLElement)?.click();
              
              // Show the complete panel
              setExpandedPanel('complete');
              break;
          }
        }
        
        // Update the lead data in cache
        queryClient.setQueryData(["/api/leads"], (oldData: any) => {
          if (!oldData?.data) return oldData;
          
          return {
            ...oldData,
            data: oldData.data.map((lead: any) => {
              if (lead.id === leadId) {
                return result.data;
              }
              return lead;
            })
          };
        });
        
        // Call parent update function
        onUpdate();
      }
    } catch (error) {
      // Handle errors and revert UI
      console.error("Error updating lead progress:", error);
      
      // Revert local state
      switch (step) {
        case 'contact':
          setContactComplete(!value);
          break;
        case 'items':
          setItemsConfirmed(!value);
          break;
        case 'design':
          setSubmittedToDesign(!value);
          break;
      }
      
      // Show error toast
      toast({
        title: "Update Failed",
        description: "Could not update the lead progress. Please try again.",
        variant: "destructive",
      });
    }
  };

  const togglePanel = (panel: string) => {
    setExpandedPanel(expandedPanel === panel ? null : panel);
  };

  return (
    <Card className="w-full lead-progress-checklist-container">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-semibold">Lead Progress Checklist</CardTitle>
        <CardDescription>
          Track your progress with this lead through the sales process
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Step 1: Contact Client */}
          <div 
            className={`rounded-lg border overflow-hidden ${contactComplete ? 'bg-green-50 border-green-100' : ''}`}
            data-progress-panel-id="contact"
          >
            {/* Step Header */}
            <div 
              className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center"
              onClick={() => togglePanel('contact')}
            >
              <div className="flex items-start space-x-3 w-full">
                <div className={`h-8 w-8 rounded-full ${contactComplete ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'} flex items-center justify-center`}>
                  {contactComplete ? <CheckCircle2 className="h-5 w-5" /> : <Phone className="h-5 w-5" />}
                </div>
                <div className="flex-1 text-left">
                  <h3 className={`font-medium ${contactComplete ? 'text-green-800' : 'text-gray-900'}`}>
                    Step 1: Contact Client
                  </h3>
                  <p className={`text-sm ${contactComplete ? 'text-green-700' : 'text-gray-500'}`}>
                    Initial contact with client to discuss their needs
                    {contactComplete && <span className="ml-2 font-medium">✓ Complete</span>}
                  </p>
                </div>
                <div className="ml-auto">
                  <svg 
                    width="24" 
                    height="24" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    className={`transition-transform ${expandedPanel === 'contact' ? 'rotate-180' : ''}`}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </div>
            </div>
            
            {/* Step Content */}
            {expandedPanel === 'contact' && (
              <div className="px-4 pb-4">
                <div className="mt-3 mb-4 flex justify-end">
                  {contactComplete ? (
                    <div className="flex items-center">
                      <Badge className="bg-green-600 text-white mr-2">Completed</Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-gray-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleStep('contact', false);
                        }}
                        disabled={updateProgressMutation.isPending}
                      >
                        <Circle className="mr-1 h-3.5 w-3.5" /> Undo
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="default"
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleStep('contact', true);
                      }}
                      disabled={updateProgressMutation.isPending}
                    >
                      <CheckSquare className="mr-1 h-3.5 w-3.5" /> 
                      {updateProgressMutation.isPending ? "Saving..." : "Mark Complete"}
                    </Button>
                  )}
                </div>
                
                <div className="flex space-x-2 mt-4">
                  <Dialog 
                    open={isContactLogOpen} 
                    modal={true}
                    onOpenChange={setIsContactLogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="outline" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsContactLogOpen(true);
                        }}
                      >
                        <Phone className="mr-2 h-3.5 w-3.5" />
                        Log Contact
                      </Button>
                    </DialogTrigger>
                    <DialogContent onClick={(e) => e.stopPropagation()}>
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
                              <SelectItem value="in-person">In Person</SelectItem>
                              <SelectItem value="video">Video Call</SelectItem>
                              <SelectItem value="text">Text Message</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="notes">Notes</Label>
                          <Textarea
                            id="notes"
                            placeholder="What did you discuss?"
                            value={contactNotes}
                            onChange={(e) => setContactNotes(e.target.value)}
                            rows={5}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          type="button" 
                          variant="outline" 
                          onClick={() => setIsContactLogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleAddContactLog}
                          disabled={addContactLogMutation.isPending}
                        >
                          {addContactLogMutation.isPending ? "Saving..." : "Add Log"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  
                  <Dialog 
                    open={isContactLogHistoryOpen} 
                    modal={true}
                    onOpenChange={setIsContactLogHistoryOpen}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="outline" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsContactLogHistoryOpen(true);
                        }}
                      >
                        <Calendar className="mr-2 h-3.5 w-3.5" />
                        View History
                      </Button>
                    </DialogTrigger>
                    <DialogContent 
                      className="sm:max-w-[600px]" 
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DialogHeader>
                        <DialogTitle>Contact History</DialogTitle>
                        <DialogDescription>
                          Past communications with this lead
                        </DialogDescription>
                      </DialogHeader>
                      <ScrollArea className="h-[400px] mt-4">
                        {contactLogs && contactLogs.length > 0 ? (
                          <div className="space-y-6">
                            {contactLogs.map((log) => (
                              <div key={log.id} className="p-4 border rounded-lg bg-gray-50">
                                <div className="flex justify-between mb-2">
                                  <Badge variant="outline" className="capitalize">
                                    {log.contactMethod}
                                  </Badge>
                                  <span className="text-xs text-gray-500">
                                    {formatDate(log.timestamp)}
                                  </span>
                                </div>
                                <p className="text-sm whitespace-pre-wrap">{log.notes || "No notes provided"}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center p-8 text-gray-500">
                            <BookOpen className="mx-auto h-10 w-10 opacity-20 mb-2" />
                            <p>No contact history available</p>
                          </div>
                        )}
                      </ScrollArea>
                      <DialogFooter>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setIsContactLogHistoryOpen(false)}
                        >
                          Close
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            )}
          </div>
          
          {/* Step 2: Confirm Items */}
          <div 
            className={`rounded-lg border overflow-hidden 
              ${itemsConfirmed ? 'bg-green-50 border-green-100' : ''} 
              ${!contactComplete ? 'opacity-70' : ''}`}
            data-progress-panel-id="items"
          >
            {/* Step Header */}
            <div 
              className={`px-4 py-3 ${contactComplete ? 'hover:bg-gray-50 cursor-pointer' : 'cursor-not-allowed'} flex items-center`}
              onClick={() => contactComplete && togglePanel('items')}
            >
              <div className="flex items-start space-x-3 w-full">
                <div className={`h-8 w-8 rounded-full ${itemsConfirmed ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'} flex items-center justify-center`}>
                  {itemsConfirmed ? <CheckCircle2 className="h-5 w-5" /> : <FileCheck className="h-5 w-5" />}
                </div>
                <div className="flex-1 text-left">
                  <h3 className={`font-medium ${itemsConfirmed ? 'text-green-800' : 'text-gray-900'}`}>
                    Step 2: Confirm Items
                  </h3>
                  <p className={`text-sm ${itemsConfirmed ? 'text-green-700' : 'text-gray-500'}`}>
                    Confirm specific items, quantities, and requirements
                    {itemsConfirmed && <span className="ml-2 font-medium">✓ Complete</span>}
                  </p>
                </div>
                <div className="ml-auto">
                  <svg 
                    width="24" 
                    height="24" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    className={`transition-transform ${expandedPanel === 'items' ? 'rotate-180' : ''}`}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </div>
            </div>
            
            {/* Step Content */}
            {expandedPanel === 'items' && (
              <div className="px-4 pb-4">
                <div className="mt-3 mb-4 flex justify-end">
                  {itemsConfirmed ? (
                    <div className="flex items-center">
                      <Badge className="bg-green-600 text-white mr-2">Completed</Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-gray-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleStep('items', false);
                        }}
                        disabled={updateProgressMutation.isPending}
                      >
                        <Circle className="mr-1 h-3.5 w-3.5" /> Undo
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="default"
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleStep('items', true);
                      }}
                      disabled={updateProgressMutation.isPending || !contactComplete}
                    >
                      <CheckSquare className="mr-1 h-3.5 w-3.5" /> 
                      {updateProgressMutation.isPending ? "Saving..." : "Mark Complete"}
                    </Button>
                  )}
                </div>
                <div className="mt-4 p-3 bg-gray-50 rounded-md">
                  <h4 className="text-sm font-medium mb-2">Item Confirmation Checklist</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start">
                      <CheckSquare className="h-4 w-4 mr-2 text-gray-500 mt-0.5" />
                      <span>Determine quantities of each item needed</span>
                    </li>
                    <li className="flex items-start">
                      <CheckSquare className="h-4 w-4 mr-2 text-gray-500 mt-0.5" />
                      <span>Confirm sizes and customization details</span>
                    </li>
                    <li className="flex items-start">
                      <CheckSquare className="h-4 w-4 mr-2 text-gray-500 mt-0.5" />
                      <span>Verify delivery timeline expectations</span>
                    </li>
                    <li className="flex items-start">
                      <CheckSquare className="h-4 w-4 mr-2 text-gray-500 mt-0.5" />
                      <span>Obtain necessary logos or branding materials</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>
          
          {/* Step 3: Submit to Design */}
          <div 
            className={`rounded-lg border overflow-hidden 
              ${submittedToDesign ? 'bg-green-50 border-green-100' : ''} 
              ${(!contactComplete || !itemsConfirmed) ? 'opacity-70' : ''}`}
            data-progress-panel-id="design"
          >
            {/* Step Header */}
            <div 
              className={`px-4 py-3 ${(contactComplete && itemsConfirmed) ? 'hover:bg-gray-50 cursor-pointer' : 'cursor-not-allowed'} flex items-center`}
              onClick={() => (contactComplete && itemsConfirmed) && togglePanel('design')}
            >
              <div className="flex items-start space-x-3 w-full">
                <div className={`h-8 w-8 rounded-full ${submittedToDesign ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'} flex items-center justify-center`}>
                  {submittedToDesign ? <CheckCircle2 className="h-5 w-5" /> : <ListChecks className="h-5 w-5" />}
                </div>
                <div className="flex-1 text-left">
                  <h3 className={`font-medium ${submittedToDesign ? 'text-green-800' : 'text-gray-900'}`}>
                    Step 3: Submit to Design
                  </h3>
                  <p className={`text-sm ${submittedToDesign ? 'text-green-700' : 'text-gray-500'}`}>
                    Submit final requirements to the design team
                    {submittedToDesign && <span className="ml-2 font-medium">✓ Complete</span>}
                  </p>
                </div>
                <div className="ml-auto">
                  <svg 
                    width="24" 
                    height="24" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    className={`transition-transform ${expandedPanel === 'design' ? 'rotate-180' : ''}`}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </div>
            </div>
            
            {/* Step Content */}
            {expandedPanel === 'design' && (
              <div className="px-4 pb-4">
                <div className="mt-3 mb-4 flex justify-end">
                  {submittedToDesign ? (
                    <div className="flex items-center">
                      <Badge className="bg-green-600 text-white mr-2">Completed</Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-gray-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleStep('design', false);
                        }}
                        disabled={updateProgressMutation.isPending}
                      >
                        <Circle className="mr-1 h-3.5 w-3.5" /> Undo
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="default"
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleStep('design', true);
                      }}
                      disabled={updateProgressMutation.isPending || !contactComplete || !itemsConfirmed}
                    >
                      <CheckSquare className="mr-1 h-3.5 w-3.5" /> 
                      {updateProgressMutation.isPending ? "Saving..." : "Mark Complete"}
                    </Button>
                  )}
                </div>
                <div className="mt-4 p-3 bg-gray-50 rounded-md">
                  <h4 className="text-sm font-medium mb-2">Design Submission Requirements</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start">
                      <CheckSquare className="h-4 w-4 mr-2 text-gray-500 mt-0.5" />
                      <span>Gather all client-provided logos and graphics</span>
                    </li>
                    <li className="flex items-start">
                      <CheckSquare className="h-4 w-4 mr-2 text-gray-500 mt-0.5" />
                      <span>Document color preferences and style guide</span>
                    </li>
                    <li className="flex items-start">
                      <CheckSquare className="h-4 w-4 mr-2 text-gray-500 mt-0.5" />
                      <span>Detail placement instructions for customization</span>
                    </li>
                    <li className="flex items-start">
                      <CheckSquare className="h-4 w-4 mr-2 text-gray-500 mt-0.5" />
                      <span>Specify any special production considerations</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>
          
          {/* Complete */}
          <div 
            className={`rounded-lg border overflow-hidden 
              ${contactComplete && itemsConfirmed && submittedToDesign ? 'bg-green-50 border-green-100' : ''} 
              ${(!contactComplete || !itemsConfirmed || !submittedToDesign) ? 'opacity-70' : ''}`}
            data-progress-panel-id="complete"
          >
            {/* Step Header */}
            <div 
              className={`px-4 py-3 ${(contactComplete && itemsConfirmed && submittedToDesign) ? 'hover:bg-gray-50 cursor-pointer' : 'cursor-not-allowed'} flex items-center`}
              onClick={() => (contactComplete && itemsConfirmed && submittedToDesign) && togglePanel('complete')}
            >
              <div className="flex items-start space-x-3 w-full">
                <div className={`h-8 w-8 rounded-full ${contactComplete && itemsConfirmed && submittedToDesign ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'} flex items-center justify-center`}>
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className={`font-medium ${contactComplete && itemsConfirmed && submittedToDesign ? 'text-green-800' : 'text-gray-900'}`}>
                    Lead Process Complete
                  </h3>
                  <p className={`text-sm ${contactComplete && itemsConfirmed && submittedToDesign ? 'text-green-700' : 'text-gray-500'}`}>
                    All steps have been completed
                  </p>
                </div>
                <div className="ml-auto">
                  <svg 
                    width="24" 
                    height="24" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    className={`transition-transform ${expandedPanel === 'complete' ? 'rotate-180' : ''}`}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </div>
            </div>
            
            {/* Step Content */}
            {expandedPanel === 'complete' && (
              <div className="px-4 pb-4">
                <div className="mt-3 text-center p-4 bg-green-50 rounded-md">
                  <CheckCircle2 className="h-10 w-10 mx-auto mb-2 text-green-600" />
                  <h3 className="text-lg font-medium text-green-800 mb-1">All Steps Completed!</h3>
                  <p className="text-sm text-green-700">
                    Lead has been successfully processed through all required steps.
                    The design team will continue the process from here.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}