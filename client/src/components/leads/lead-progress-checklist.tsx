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
  Package
} from "lucide-react";
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
  notes: string;
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
  contactComplete,
  itemsConfirmed,
  submittedToDesign,
  contactLogs = [],
  onUpdate,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [contactMethod, setContactMethod] = React.useState<string>("email");
  const [contactNotes, setContactNotes] = React.useState<string>("");
  const [isContactLogOpen, setIsContactLogOpen] = React.useState<boolean>(false);
  const [isContactLogHistoryOpen, setIsContactLogHistoryOpen] = React.useState<boolean>(false);

  // Progress update mutation
  const updateProgressMutation = useMutation({
    mutationFn: async (progress: { 
      contactComplete?: boolean; 
      itemsConfirmed?: boolean; 
      submittedToDesign?: boolean; 
    }) => {
      const res = await apiRequest(
        "PATCH", 
        `/api/leads/${leadId}/progress`, 
        progress
      );
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      onUpdate();
    },
    onError: (error: Error) => {
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
      notes: string; 
    }) => {
      const res = await apiRequest(
        "POST", 
        `/api/leads/${leadId}/contact-logs`, 
        contactLog
      );
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/leads/${leadId}/contact-logs`] });
      
      // Also mark contact as complete
      if (!contactComplete) {
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
      
      onUpdate();
    },
    onError: (error: Error) => {
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

  const handleToggleStep = (step: string, value: boolean) => {
    switch (step) {
      case 'contact':
        updateProgressMutation.mutate({ contactComplete: value });
        break;
      case 'items':
        updateProgressMutation.mutate({ itemsConfirmed: value });
        break;
      case 'design':
        updateProgressMutation.mutate({ submittedToDesign: value });
        break;
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
    <div className="flex items-start space-x-4 mb-6">
      {getStepIcon(completed, icon)}
      <div className="flex-1">
        <div className="flex justify-between">
          <div>
            <h3 className="font-medium text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500">{description}</p>
          </div>
          <div>
            {completed ? (
              <Button
                variant="outline"
                size="sm"
                className="text-gray-600"
                onClick={() => handleToggleStep(stepName, false)}
                disabled={isDisabled || updateProgressMutation.isPending}
              >
                <Circle className="mr-1 h-3.5 w-3.5" /> Mark Incomplete
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="text-green-600"
                onClick={() => handleToggleStep(stepName, true)}
                disabled={isDisabled || updateProgressMutation.isPending}
              >
                <CheckSquare className="mr-1 h-3.5 w-3.5" /> Mark Complete
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
              <Dialog open={isContactLogOpen} onOpenChange={setIsContactLogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
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
                    <DialogClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button 
                      onClick={handleAddContactLog}
                      disabled={addContactLogMutation.isPending}
                    >
                      {addContactLogMutation.isPending ? "Saving..." : "Add Log"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              
              <Dialog open={isContactLogHistoryOpen} onOpenChange={setIsContactLogHistoryOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Calendar className="mr-2 h-3.5 w-3.5" />
                    View History
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
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
                            <p className="text-sm whitespace-pre-wrap">{log.notes}</p>
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
                    <Button variant="outline" onClick={() => setIsContactLogHistoryOpen(false)}>
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