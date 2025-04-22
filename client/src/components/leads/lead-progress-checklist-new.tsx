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
import { 
  BookOpen, Calendar, CheckCircle2, CheckSquare, Circle, 
  Clipboard, Clock, FileCheck, ListChecks, Phone 
} from "lucide-react";
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

export default function LeadProgressChecklistNew({
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
  const [isContactLogOpen, setIsContactLogOpen] = useState(false);
  const [isContactLogHistoryOpen, setIsContactLogHistoryOpen] = useState(false);
  const [contactMethod, setContactMethod] = useState("phone");
  const [contactNotes, setContactNotes] = useState("");
  
  // Track expanded/collapsed state for each step
  const [expandedSteps, setExpandedSteps] = useState({
    contact: !initialContactComplete, // Only expanded if not complete
    items: initialContactComplete && !initialItemsConfirmed, // Expanded if previous step is complete and this one isn't
    design: initialContactComplete && initialItemsConfirmed && !initialSubmittedToDesign // Expanded if both previous steps are complete and this one isn't
  });
  
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'MMM d, yyyy h:mm a');
    } catch (e) {
      console.error("Date formatting error:", e);
      return dateString || 'Unknown date';
    }
  };

  // Mutation to update progress with enhanced error handling and response validation
  const updateProgressMutation = useMutation({
    mutationFn: async (updates: {
      contactComplete?: boolean;
      itemsConfirmed?: boolean;
      submittedToDesign?: boolean;
    }) => {
      console.log("Updating lead progress:", updates);
      try {
        // Add timeout for the request to prevent hanging
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10-second timeout
        
        const response = await apiRequest("PATCH", `/api/leads/${leadId}/progress`, updates, {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          console.error("Server returned error status:", response.status);
          let errorText = await response.text();
          console.error("Error response body:", errorText);
          try {
            // Try to parse as JSON in case the error is in JSON format
            const errorJson = JSON.parse(errorText);
            errorText = errorJson.error || errorText;
          } catch (e) {
            // Not JSON, use the text as is
          }
          throw new Error(`Failed to update lead progress: ${errorText}`);
        }
        
        // Validate the response
        const responseData = await response.json();
        
        // Check if the response data is valid
        if (!responseData || (typeof responseData !== 'object')) {
          throw new Error('Invalid response format from server');
        }
        
        // Normalize data structure in case it's nested
        const normalizedData = responseData.data || responseData;
        
        // Final validation to ensure we have a valid lead object
        if (!normalizedData || !normalizedData.id) {
          console.error("Invalid lead data in response:", normalizedData);
          throw new Error('Missing or incomplete lead data in response');
        }
        
        return responseData;
      } catch (error) {
        // Handle different error types
        if (error.name === 'AbortError') {
          throw new Error('Request timed out. Please try again.');
        } else if (error instanceof SyntaxError) {
          console.error("JSON parsing error:", error);
          throw new Error('Could not parse server response. Please try again.');
        } else {
          console.error("Exception during lead progress update:", error);
          throw error;
        }
      }
    },
    onSuccess: (data) => {
      console.log("Lead progress updated successfully:", data);
      
      try {
        // IMPORTANT: First update the local state before calling onUpdate
        // This ensures our local state is in sync with the server
        // when the dialog might be closed by the parent component
        const updatedLead = data.data || data;
        if (updatedLead && typeof updatedLead === 'object') {
          // Use type checking and fallbacks for robustness
          setContactComplete(updatedLead.contactComplete === true);
          setItemsConfirmed(updatedLead.itemsConfirmed === true);
          setSubmittedToDesign(updatedLead.submittedToDesign === true);
          
          // Invalidate and refetch leads data
          queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
          
          // NOW we can safely call the parent's update function
          // because our local state is already updated
          console.log("Calling parent onUpdate");
          onUpdate();
        } else {
          console.error("Invalid lead data structure:", updatedLead);
          throw new Error("Invalid lead data returned from server");
        }
      } catch (error) {
        console.error("Error processing successful response:", error);
        toast({
          title: "Processing Error",
          description: "There was an error applying your changes. Please refresh the page.",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      console.error("Error updating lead progress:", error);
      toast({
        title: "Update Failed",
        description: `Could not update lead progress: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Mutation to add contact log with enhanced error handling and response validation
  const addContactLogMutation = useMutation({
    mutationFn: async (data: {
      leadId: number;
      contactMethod: string;
      notes: string;
    }) => {
      console.log("Adding contact log:", data);
      try {
        // Add timeout for the request to prevent hanging
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10-second timeout
        
        const response = await apiRequest("POST", `/api/leads/${leadId}/contact-logs`, data, {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          console.error("Server returned error status:", response.status);
          let errorText = await response.text();
          console.error("Error response body:", errorText);
          try {
            // Try to parse as JSON in case the error is in JSON format
            const errorJson = JSON.parse(errorText);
            errorText = errorJson.error || errorText;
          } catch (e) {
            // Not JSON, use the text as is
          }
          throw new Error(`Failed to add contact log: ${errorText}`);
        }
        
        // Validate the response
        const responseData = await response.json();
        
        // Check if the response data is valid
        if (!responseData) {
          throw new Error('Invalid response format from server');
        }
        
        return responseData;
      } catch (error) {
        // Handle different error types
        if (error.name === 'AbortError') {
          throw new Error('Request timed out. Please try again.');
        } else if (error instanceof SyntaxError) {
          console.error("JSON parsing error:", error);
          throw new Error('Could not parse server response. Please try again.');
        } else {
          console.error("Exception during contact log addition:", error);
          throw error;
        }
      }
    },
    onSuccess: (data) => {
      console.log("Contact log added successfully:", data);
      
      try {
        // Update local state first for responsive UI
        setContactComplete(true);
        
        // Reset form and close dialog
        setContactNotes("");
        setIsContactLogOpen(false);
        
        // Then update on server if needed
        if (!contactComplete) {
          // Use a try-catch block to prevent this from breaking the success flow
          try {
            updateProgressMutation.mutate({ contactComplete: true });
          } catch (error) {
            console.error("Error updating lead progress after contact log:", error);
            // We don't throw here since we still want to show success for the contact log
          }
        }
        
        // Show success message
        toast({
          title: "Contact log added",
          description: "The contact log has been added successfully.",
        });
        
        // Call onUpdate to refresh the parent component's UI 
        onUpdate();
        
        // Schedule a background refetch to ensure data consistency
        // Using Promise.all with catch to handle potential network issues
        setTimeout(() => {
          Promise.all([
            queryClient.invalidateQueries({ queryKey: [`/api/leads/${leadId}/contact-logs`] }),
            queryClient.invalidateQueries({ queryKey: [`/api/leads`] })
          ]).catch(err => {
            console.error("Error refreshing data after contact log:", err);
            // Don't throw, this is just background refreshing
          });
        }, 500);
      } catch (error) {
        console.error("Error processing contact log success:", error);
        // Don't throw to prevent UI from getting stuck
        toast({
          title: "Warning",
          description: "Contact log added, but there was an issue refreshing the page. Please refresh manually.",
          variant: "default",
        });
      }
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
    let previousLeadData: any = null;
    let stateUpdated = false;
    let progressUpdates: { 
      contactComplete?: boolean; 
      itemsConfirmed?: boolean; 
      submittedToDesign?: boolean; 
    } = {};

    try {
      console.log(`Starting handleToggleStep for ${step} with value ${value}`);
      
      // This object will track what we're updating
      progressUpdates = {};
      
      // Store the updates but DON'T update UI state yet
      // Instead, wait for the server response to be successful first
      switch (step) {
        case 'contact':
          // Don't call setContactComplete yet
          progressUpdates.contactComplete = value;
          break;
        case 'items':
          // Don't call setItemsConfirmed yet
          progressUpdates.itemsConfirmed = value;
          break;
        case 'design':
          // Don't call setSubmittedToDesign yet
          progressUpdates.submittedToDesign = value;
          break;
        default:
          console.error("Unknown step:", step);
          throw new Error(`Unknown step: ${step}`);
      }
      
      console.log("Preparing update with:", progressUpdates);
      
      // Backup the current state for restoration in case of error
      previousLeadData = queryClient.getQueryData(["/api/leads"]);
      
      // Apply optimistic update to the cache - safely
      try {
        queryClient.setQueryData(["/api/leads"], (oldData: any) => {
          if (!oldData?.data) {
            console.log("No existing lead data in cache");
            return oldData;
          }
          
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
      } catch (cacheError) {
        console.error("Error updating cache:", cacheError);
        // Continue execution despite cache error
      }
      
      console.log("Sending update to server...");
      
      // Configure request with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10-second timeout
      
      try {
        // Send update to the server
        const result = await updateProgressMutation.mutateAsync(progressUpdates);
        
        clearTimeout(timeoutId); // Clear timeout
        
        console.log("Server response:", result);
        
        if (result) {
          // Get the updated lead data - handle both response formats
          const updatedLead = result.data || result;
          
          if (updatedLead && typeof updatedLead === 'object' && 'id' in updatedLead) {
            console.log("Updating local state with:", updatedLead);
            
            // Update local state with server values (using triple equals for strict boolean checking)
            const newContactComplete = updatedLead.contactComplete === true;
            const newItemsConfirmed = updatedLead.itemsConfirmed === true;
            const newSubmittedToDesign = updatedLead.submittedToDesign === true;
            
            // Update state atomically to avoid race conditions
            setContactComplete(newContactComplete);
            setItemsConfirmed(newItemsConfirmed);
            setSubmittedToDesign(newSubmittedToDesign);

            // Mark that we've updated state
            stateUpdated = true;
            
            // Update the expanded state based on completion status and what step was just changed
            if (step === 'contact' && value === true) {
              // When Step 1 is completed, collapse it and expand Step 2
              setExpandedSteps({
                contact: false, // Collapse Step 1
                items: true,   // Expand Step 2
                design: false
              });
            } else if (step === 'items' && value === true) {
              // When Step 2 is completed, collapse it and expand Step 3
              setExpandedSteps({
                contact: false,
                items: false,  // Collapse Step 2
                design: true   // Expand Step 3
              });
            } else if (step === 'design' && value === true) {
              // When Step 3 is completed, collapse all steps
              setExpandedSteps({
                contact: false,
                items: false,
                design: false
              });
            } else {
              // When a step is uncompleted, adjust state naturally
              setExpandedSteps({
                contact: !newContactComplete, // Only expanded if not complete
                items: newContactComplete && !newItemsConfirmed, // Expanded if previous step is complete and this one isn't
                design: newContactComplete && newItemsConfirmed && !newSubmittedToDesign // Expanded if both previous steps are complete and this one isn't
              });
            }
            
            // Show appropriate toast
            switch (step) {
              case 'contact':
                toast({
                  title: value ? "Step 1 Complete" : "Step 1 Reverted",
                  description: value ? 
                    "Lead contact information has been saved" : 
                    "Lead contact step has been marked as incomplete",
                  variant: "default",
                });
                break;
              case 'items':
                toast({
                  title: value ? "Step 2 Complete" : "Step 2 Reverted",
                  description: value ? 
                    "Item requirements have been confirmed" : 
                    "Item requirement step has been marked as incomplete",
                  variant: "default",
                });
                break;
              case 'design':
                toast({
                  title: value ? "Lead Process Complete!" : "Step 3 Reverted",
                  description: value ? 
                    "All steps have been completed successfully" : 
                    "Design submission step has been marked as incomplete",
                  variant: "default",
                });
                break;
            }
            
            // Update the lead data in cache - safely
            try {
              queryClient.setQueryData(["/api/leads"], (oldData: any) => {
                if (!oldData?.data) return oldData;
                
                return {
                  ...oldData,
                  data: oldData.data.map((lead: any) => {
                    if (lead.id === leadId) {
                      return updatedLead;
                    }
                    return lead;
                  })
                };
              });
            } catch (cacheError) {
              console.error("Error updating cache with server response:", cacheError);
              // Continue execution despite cache error
              // Force a background refetch to ensure consistency
              setTimeout(() => {
                queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
              }, 500);
            }
            
            // Call onUpdate to refresh parent component
            onUpdate();
          } else {
            console.error("Invalid lead data in response:", updatedLead);
            throw new Error("Invalid lead data returned from server");
          }
        } else {
          console.error("Received empty response");
          throw new Error("Received empty response from server");
        }
      } catch (requestError) {
        clearTimeout(timeoutId); // Clear timeout if exception occurs
        throw requestError; // Rethrow to be caught by outer try/catch
      }
    } catch (error) {
      // Handle all errors and revert UI
      console.error("Error updating lead progress:", error);
      
      // Revert cache to previous state if we have it
      if (previousLeadData) {
        try {
          queryClient.setQueryData(["/api/leads"], previousLeadData);
        } catch (revertError) {
          console.error("Error reverting cache:", revertError);
          // Force a background refetch if cache reversion fails
          setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
          }, 500);
        }
      }
      
      // Revert local state if it was updated
      if (stateUpdated) {
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
      }
      
      // Generate an appropriate error message
      let errorMessage = "Could not update the lead progress. ";
      
      if (error.name === 'AbortError') {
        errorMessage += "Request timed out.";
      } else if (error.message) {
        // Truncate overly long error messages
        const maxLength = 100;
        errorMessage += error.message.length > maxLength ? 
          error.message.substring(0, maxLength) + '...' : 
          error.message;
      } else {
        errorMessage += "An unexpected error occurred.";
      }
      
      // Show error toast
      toast({
        title: "Update Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      // If there are server connection issues, suggest a page refresh
      if (error.name === 'AbortError' || error.message?.includes('network') || error.message?.includes('connection')) {
        setTimeout(() => {
          toast({
            title: "Connection Issue",
            description: "You may need to refresh the page to reconnect to the server.",
            variant: "default",
          });
        }, 2000);
      }
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-semibold">Lead Progress Checklist</CardTitle>
        <CardDescription>
          Track your progress with this lead through the sales process
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Step 1: Contact Client */}
          <div 
            className={`p-4 rounded-lg border ${contactComplete ? 'bg-green-50 border-green-100' : 'bg-white'} cursor-pointer`}
            onClick={() => {
              if (contactComplete) {
                setExpandedSteps(prev => ({ ...prev, contact: !prev.contact }));
              }
            }}
          >
            <div className="flex items-center mb-3">
              <div className={`h-8 w-8 rounded-full ${contactComplete ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'} flex items-center justify-center mr-3`}>
                {contactComplete ? <CheckCircle2 className="h-5 w-5" /> : <Phone className="h-5 w-5" />}
              </div>
              <div>
                <h3 className={`font-medium ${contactComplete ? 'text-green-800' : 'text-gray-900'}`}>
                  Step 1: Contact Client
                </h3>
                <p className={`text-sm ${contactComplete ? 'text-green-700' : 'text-gray-500'}`}>
                  Initial contact with client to discuss their needs
                </p>
              </div>
              {contactComplete && (
                <Badge className="ml-auto bg-green-600 text-white">Completed</Badge>
              )}
            </div>
            
            {expandedSteps.contact && (
              <div className="ml-11">
                <div className="flex flex-wrap gap-2 mt-2">
                  {contactComplete ? (
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
                
                  <Dialog 
                    open={isContactLogOpen} 
                    onOpenChange={setIsContactLogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="outline" 
                        size="sm"
                      >
                        <Phone className="mr-2 h-3.5 w-3.5" />
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
                  
                  {contactLogs && contactLogs.length > 0 && (
                    <Dialog 
                      open={isContactLogHistoryOpen} 
                      onOpenChange={setIsContactLogHistoryOpen}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="outline" 
                          size="sm" 
                        >
                          <Clock className="mr-2 h-3.5 w-3.5" />
                          View Contact Logs ({contactLogs.length})
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Contact History</DialogTitle>
                          <DialogDescription>
                            Previous communications with this lead
                          </DialogDescription>
                        </DialogHeader>
                        <ScrollArea className="h-96 mt-4">
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
                        </ScrollArea>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Step 2: Confirm Items */}
          <div 
            className={`p-4 rounded-lg border ${itemsConfirmed ? 'bg-green-50 border-green-100' : 'bg-white'} cursor-pointer`}
            onClick={() => {
              if (itemsConfirmed || (contactComplete && !itemsConfirmed)) {
                setExpandedSteps(prev => ({ ...prev, items: !prev.items }));
              }
            }}
          >
            <div className="flex items-center mb-3">
              <div className={`h-8 w-8 rounded-full ${itemsConfirmed ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'} flex items-center justify-center mr-3`}>
                {itemsConfirmed ? <CheckCircle2 className="h-5 w-5" /> : <ListChecks className="h-5 w-5" />}
              </div>
              <div>
                <h3 className={`font-medium ${itemsConfirmed ? 'text-green-800' : 'text-gray-900'}`}>
                  Step 2: Confirm Items
                </h3>
                <p className={`text-sm ${itemsConfirmed ? 'text-green-700' : 'text-gray-500'}`}>
                  Validate and confirm product requirements
                </p>
              </div>
              {itemsConfirmed && (
                <Badge className="ml-auto bg-green-600 text-white">Completed</Badge>
              )}
            </div>
            
            {expandedSteps.items && (
              <div className="ml-11">
                <div className="flex flex-wrap gap-2 mt-2">
                  {contactComplete ? (
                    <>
                      {itemsConfirmed ? (
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
                      ) : (
                        <Button
                          variant="default"
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleStep('items', true);
                          }}
                          disabled={updateProgressMutation.isPending}
                        >
                          <CheckSquare className="mr-1 h-3.5 w-3.5" />
                          {updateProgressMutation.isPending ? "Saving..." : "Mark Complete"}
                        </Button>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-gray-500 italic">
                      Please complete step 1 before confirming items
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Step 3: Submit to Design */}
          <div 
            className={`p-4 rounded-lg border ${submittedToDesign ? 'bg-green-50 border-green-100' : 'bg-white'} cursor-pointer`}
            onClick={() => {
              if (submittedToDesign || (itemsConfirmed && !submittedToDesign)) {
                setExpandedSteps(prev => ({ ...prev, design: !prev.design }));
              }
            }}
          >
            <div className="flex items-center mb-3">
              <div className={`h-8 w-8 rounded-full ${submittedToDesign ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'} flex items-center justify-center mr-3`}>
                {submittedToDesign ? <CheckCircle2 className="h-5 w-5" /> : <FileCheck className="h-5 w-5" />}
              </div>
              <div>
                <h3 className={`font-medium ${submittedToDesign ? 'text-green-800' : 'text-gray-900'}`}>
                  Step 3: Submit to Design
                </h3>
                <p className={`text-sm ${submittedToDesign ? 'text-green-700' : 'text-gray-500'}`}>
                  Forward lead to the design team for processing
                </p>
              </div>
              {submittedToDesign && (
                <Badge className="ml-auto bg-green-600 text-white">Completed</Badge>
              )}
            </div>
            
            {expandedSteps.design && (
              <div className="ml-11">
                <div className="flex flex-wrap gap-2 mt-2">
                  {itemsConfirmed ? (
                    <>
                      {submittedToDesign ? (
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
                      ) : (
                        <Button
                          variant="default"
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleStep('design', true);
                          }}
                          disabled={updateProgressMutation.isPending}
                        >
                          <CheckSquare className="mr-1 h-3.5 w-3.5" />
                          {updateProgressMutation.isPending ? "Saving..." : "Mark Complete"}
                        </Button>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-gray-500 italic">
                      Please complete step 2 before submitting to design
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* All steps completed message */}
          {contactComplete && itemsConfirmed && submittedToDesign && (
            <div className="p-4 bg-green-50 border border-green-100 rounded-lg mt-4">
              <div className="flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-600 mr-2" />
                <h3 className="text-green-800 text-lg font-medium">
                  All Lead Processing Steps Complete!
                </h3>
              </div>
              <p className="text-center text-green-700 mt-2">
                This lead has been successfully processed through all required steps.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}