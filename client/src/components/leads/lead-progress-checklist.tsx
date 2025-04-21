import React from "react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { 
  CheckCircle2, 
  Circle, 
  Phone, 
  FileCheck, 
  FileText,
  Calendar, 
  BookOpen, 
  ArrowRight,
  CheckSquare,
  Package,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDate } from "@/lib/utils";

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

const LeadProgressChecklist: React.FC<LeadProgressChecklistProps> = ({
  leadId,
  contactComplete: initialContactComplete,
  itemsConfirmed: initialItemsConfirmed,
  submittedToDesign: initialSubmittedToDesign,
  contactLogs = [],
  onUpdate,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [contactMethod, setContactMethod] = React.useState<string>("email");
  const [contactNotes, setContactNotes] = React.useState<string>("");
  const [isContactLogOpen, setIsContactLogOpen] = React.useState<boolean>(false);
  const [isContactLogHistoryOpen, setIsContactLogHistoryOpen] = React.useState<boolean>(false);
  
  // Create state values from props so we can update them properly
  const [contactComplete, setContactComplete] = React.useState<boolean>(initialContactComplete);
  const [itemsConfirmed, setItemsConfirmed] = React.useState<boolean>(initialItemsConfirmed);
  const [submittedToDesign, setSubmittedToDesign] = React.useState<boolean>(initialSubmittedToDesign);
  
  // Track which step is currently open in the accordion
  const [openStep, setOpenStep] = React.useState<string>(() => {
    // Initialize with the first incomplete step
    if (!initialContactComplete) return "contact";
    if (!initialItemsConfirmed) return "items";
    if (!initialSubmittedToDesign) return "design";
    return "complete"; // All steps complete
  });

  // Progress update mutation
  const updateProgressMutation = useMutation({
    mutationFn: async (progress: { 
      contactComplete?: boolean; 
      itemsConfirmed?: boolean; 
      submittedToDesign?: boolean; 
    }) => {
      // Log the actual request for debugging
      console.log(`Sending PATCH to /api/leads/${leadId}/progress with data:`, progress);
      
      const res = await apiRequest(
        "PATCH", 
        `/api/leads/${leadId}/progress`, 
        progress
      );
      
      // Handle response - always handle non-JSON responses gracefully
      try {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const json = await res.json();
          console.log("Server response:", json);
          return json;
        } else {
          // Not JSON, just return success status
          console.log("Non-JSON response, status:", res.status);
          return { success: res.ok, data: { ...progress } };
        }
      } catch (err) {
        console.log('Error parsing progress update response:', err);
        // If JSON parsing fails, return success status based on HTTP status with the requested progress data
        return { success: res.ok, data: { ...progress } };
      }
    },
    // We'll handle the success case in the handleToggleStep function itself
    // since we're using mutateAsync and await there
    onError: (error: Error) => {
      console.error('Error updating lead progress:', error);
      toast({
        title: "Failed to update progress",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Contact log mutation
  const addContactLogMutation = useMutation({
    mutationFn: async (contactLog: { 
      leadId: number; 
      contactMethod: string; 
      notes: string | null; 
    }) => {
      const res = await apiRequest(
        "POST", 
        `/api/leads/${leadId}/contact-logs`, 
        contactLog
      );
      
      // Handle response - always handle non-JSON responses gracefully
      try {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          return await res.json();
        } else {
          // Not JSON, just return success status with the submitted data
          return { 
            success: res.ok, 
            data: { 
              ...contactLog,
              id: Date.now(), // Temporary ID in case we can't get the real one
              userId: 0, // Placeholder
              timestamp: new Date().toISOString()
            } 
          };
        }
      } catch (err) {
        console.log('Error parsing contact log response:', err);
        // If JSON parsing fails, return success status based on HTTP status
        return { 
          success: res.ok, 
          data: { 
            ...contactLog,
            id: Date.now(), // Temporary ID in case we can't get the real one
            userId: 0, // Placeholder
            timestamp: new Date().toISOString()
          } 
        };
      }
    },
    onSuccess: (data) => {
      // Instead of invalidating immediately, update the contact logs cache directly
      // This prevents UI navigation issues by not causing a full refetch
      queryClient.setQueryData([`/api/leads/${leadId}/contact-logs`], (oldData: any) => {
        // If we don't have previous data, create an array with the new log
        if (!oldData || !oldData.data) {
          return { data: [data.data] };
        }
        
        // Add the new contact log to the existing array
        return { 
          ...oldData,
          data: [...oldData.data, data.data]
        };
      });
      
      // Update the lead data in the cache to avoid full refetch
      queryClient.setQueryData(["/api/leads"], (oldData: any) => {
        if (!oldData || !oldData.data) return oldData;
        
        // Find and update the specific lead
        const updatedLeads = oldData.data.map((lead: any) => {
          if (lead.id === leadId) {
            return {
              ...lead,
              contactComplete: true // Since we've added a contact log, this should be true
            };
          }
          return lead;
        });
        
        return { ...oldData, data: updatedLeads };
      });
      
      // Also mark contact as complete if this is the first contact
      if (!contactComplete) {
        // Update local state first for responsive UI
        setContactComplete(true);
        // Then update on server
        updateProgressMutation.mutate({ contactComplete: true });
      }
      
      // Reset form and close dialog
      setContactNotes("");
      setIsContactLogOpen(false);
      
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

  // Improved function that implements accordion-style step flow
  const handleToggleStep = async (step: string, value: boolean) => {
    try {
      // This object will track what we're updating
      let progressUpdates: { 
        contactComplete?: boolean; 
        itemsConfirmed?: boolean; 
        submittedToDesign?: boolean; 
      } = {};
      
      // First update the UI state directly for immediate feedback
      console.log(`Updating step ${step} to ${value}`);
      
      // If this is completing a step, we need to handle step transitions
      let nextStep = step;
      
      switch (step) {
        case 'contact': {
          // Update local component state
          setContactComplete(value);
          progressUpdates.contactComplete = value;
          
          if (value) {
            // If completing this step, we should advance to the next one
            nextStep = 'items';
          }
          break;
        }
        
        case 'items': {
          // Update local component state
          setItemsConfirmed(value);
          progressUpdates.itemsConfirmed = value;
          
          if (value) {
            // If completing this step, we should advance to the next one
            nextStep = 'design';
          }
          break;
        }
        
        case 'design': {
          // Update local component state
          setSubmittedToDesign(value);
          progressUpdates.submittedToDesign = value;
          
          if (value) {
            // If completing this step, we mark "complete" as active
            nextStep = 'complete';
          }
          break;
        }
      }
      
      // Apply optimistic update to the cache so UI is immediately responsive
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
      
      // Now send the update to the server with more robust handling
      console.log("Sending update to server:", progressUpdates);
      const result = await updateProgressMutation.mutateAsync(progressUpdates);
      
      // Verify success and process the updated data from server
      if (result?.success && result?.data) {
        // Update the local state with the server-returned values (making sure local state is in sync)
        setContactComplete(!!result.data.contactComplete);
        setItemsConfirmed(!!result.data.itemsConfirmed);
        setSubmittedToDesign(!!result.data.submittedToDesign);

        // If this was a completion (not an undo), update the open step to the next one
        if (value) {
          console.log(`Completed step ${step}, transitioning to ${nextStep}`);
          setOpenStep(nextStep);
          
          // Show success message specific to this step
          switch (step) {
            case 'contact':
              toast({
                title: "Step 1 Complete",
                description: "You can now move on to confirming items in Step 2",
                variant: "default",
              });
              break;
            case 'items':
              toast({
                title: "Step 2 Complete",
                description: "You can now submit to design in Step 3",
                variant: "default",
              });
              break;
            case 'design':
              toast({
                title: "Lead Process Complete!",
                description: "All steps have been completed successfully",
                variant: "default",
              });
              break;
          }
        } else {
          // If this was an undo, we also need to adjust the open step accordingly
          if (step === 'contact') {
            setOpenStep('contact');
          } else if (step === 'items' && !result.data.contactComplete) {
            setOpenStep('contact');
          } else if (step === 'items') {
            setOpenStep('items');
          } else if (step === 'design' && !result.data.itemsConfirmed) {
            setOpenStep('items');
          } else if (step === 'design') {
            setOpenStep('design');
          }
        }
        
        // Make sure our cache is updated with the latest data from server
        queryClient.setQueryData(["/api/leads"], (oldData: any) => {
          if (!oldData?.data) return oldData;
          
          // Update the specific lead with all server-provided values 
          return {
            ...oldData,
            data: oldData.data.map((lead: any) => {
              if (lead.id === leadId) {
                // Use the full lead object returned from the server
                return result.data;
              }
              return lead;
            })
          };
        });
        
        // Also, explicitly call the parent's update function to sync the parent state
        console.log("Calling parent's onUpdate function");
        onUpdate();
      }
    } catch (error) {
      // Handle errors and revert UI if needed
      console.error("Error updating lead progress:", error);
      
      // Revert the local state changes to match server state
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

  const getStepIcon = (completed: boolean, Icon: React.ElementType) => {
    return completed ? (
      <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
        <CheckCircle2 className="h-5 w-5" />
      </div>
    ) : (
      <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
        <Icon className="h-5 w-5" />
      </div>
    );
  };

  const renderProgressStep = (
    title: string,
    description: string,
    completed: boolean,
    stepName: string,
    icon: React.ElementType,
    isDisabled: boolean = false
  ) => (
    <div className={`flex items-start space-x-4 mb-6 ${completed ? 'bg-green-50 p-3 rounded-md border border-green-100' : isDisabled ? 'opacity-60' : ''}`}>
      {getStepIcon(completed, icon)}
      <div className="flex-1">
        <div className="flex justify-between">
          <div>
            <h3 className={`font-medium ${completed ? 'text-green-800' : 'text-gray-900'}`}>{title}</h3>
            <p className={`text-sm ${completed ? 'text-green-700' : 'text-gray-500'}`}>
              {description}
              {completed && <span className="ml-2 font-medium">✓ Complete</span>}
            </p>
          </div>
          <div>
            {completed ? (
              <div className="flex items-center">
                <Badge className="bg-green-600 text-white mr-2">Completed</Badge>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-gray-600"
                  onClick={() => handleToggleStep(stepName, false)}
                  disabled={updateProgressMutation.isPending}
                >
                  <Circle className="mr-1 h-3.5 w-3.5" /> Undo
                </Button>
              </div>
            ) : (
              <Button
                variant={isDisabled ? "outline" : "default"}
                size="sm"
                className={isDisabled ? "text-gray-400" : "bg-green-600 hover:bg-green-700 text-white"}
                onClick={() => handleToggleStep(stepName, true)}
                disabled={isDisabled || updateProgressMutation.isPending}
              >
                <CheckSquare className="mr-1 h-3.5 w-3.5" /> 
                {updateProgressMutation.isPending ? "Saving..." : "Mark Complete"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-semibold">Lead Progress Checklist</CardTitle>
        <CardDescription>
          Track your progress with this lead through the sales process
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {/* Step 1: Contact Client */}
          <div className="mb-6">
            {renderProgressStep(
              "Step 1: Contact Client",
              "Initial contact with client to discuss their needs",
              contactComplete,
              "contact",
              Phone
            )}
            <div className="ml-12 mt-2 flex space-x-2">
              <Dialog 
                open={isContactLogOpen} 
                onOpenChange={(open) => {
                  console.log(`Contact log dialog ${open ? 'opening' : 'closing'}`);
                  // Only allow changes we explicitly control to prevent bubbling up to parent dialog
                  if (open !== isContactLogOpen) {
                    setIsContactLogOpen(open);
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Phone className="mr-2 h-3.5 w-3.5" />
                    Log Contact
                  </Button>
                </DialogTrigger>
                <DialogContent onClick={(e) => {
                  // Prevent click events from bubbling up to parent dialog
                  e.stopPropagation();
                }}>
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
                onOpenChange={(open) => {
                  console.log(`Contact history dialog ${open ? 'opening' : 'closing'}`);
                  // Only allow changes we explicitly control to prevent bubbling up to parent dialog
                  if (open !== isContactLogHistoryOpen) {
                    setIsContactLogHistoryOpen(open);
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Calendar className="mr-2 h-3.5 w-3.5" />
                    View History
                  </Button>
                </DialogTrigger>
                <DialogContent 
                  className="sm:max-w-[600px]" 
                  onClick={(e) => {
                    // Prevent click events from bubbling up to parent dialog
                    e.stopPropagation();
                  }}
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
                    <Button type="button" variant="outline" onClick={() => setIsContactLogHistoryOpen(false)}>
                      Close
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          <Separator className="my-4" />
          
          {/* Step 2: Confirm Items */}
          {renderProgressStep(
            "Step 2: Confirm Items",
            "Confirm specific items, quantities, and requirements",
            itemsConfirmed,
            "items",
            FileCheck,
            !contactComplete // Disabled if contact is not complete
          )}
          
          <Separator className="my-4" />
          
          {/* Step 3: Submit to Design */}
          {renderProgressStep(
            "Step 3: Submit to Design",
            "Send confirmed requirements to the design team",
            submittedToDesign,
            "design",
            FileText,
            !itemsConfirmed // Disabled if items are not confirmed
          )}
          
          {submittedToDesign && (
            <div className="mt-6 p-4 bg-green-50 border border-green-100 rounded-lg">
              <div className="flex items-center">
                <CheckCircle2 className="h-5 w-5 text-green-600 mr-2" />
                <h4 className="font-medium text-green-800">Lead Processing Complete</h4>
              </div>
              <p className="text-sm text-green-700 mt-1 ml-7">
                All steps completed! The design team is now working on this lead.
              </p>
              <div className="ml-7 mt-2">
                <Button size="sm" className="bg-green-600 hover:bg-green-700">
                  <Package className="mr-2 h-3.5 w-3.5" />
                  View in Design Queue
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default LeadProgressChecklist;