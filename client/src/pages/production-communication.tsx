import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  FileUp, 
  Loader2, 
  MessageSquare 
} from "lucide-react";
import { ScrollableDialogContent } from "@/components/scrollable-dialog-content";

interface Production {
  id: number;
  orderId: number;
  orderName: string;
  clientName: string;
  manufacturerName?: string;
  status: "pending" | "in_progress" | "completed" | "shipped" | "on_hold";
  createdAt: string;
  deadline: string;
  description: string;
  productionNotes?: string;
  productionFiles?: string[];
  issueReports?: ProductionIssue[];
}

interface ProductionIssue {
  id: number;
  productionId: number;
  reportedBy: string;
  reportedAt: string;
  description: string;
  status: "open" | "in_progress" | "resolved";
  priority: "low" | "medium" | "high" | "critical";
}

interface ProductionMessage {
  id: number;
  productionId: number;
  senderId: number;
  senderName: string;
  senderRole: string;
  message: string;
  sentAt: string;
  attachments?: string[];
}

interface ProductionCommunicationProps {
  isEmbedded?: boolean;
}

export default function ProductionCommunication({ isEmbedded = false }: ProductionCommunicationProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedProduction, setSelectedProduction] = useState<Production | null>(null);
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const [isViewingProduction, setIsViewingProduction] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [fileAttachments, setFileAttachments] = useState<File[]>([]);

  // Fetch production data for the current user
  const { data: productions, isLoading: isLoadingProductions } = useQuery({
    queryKey: ['/api/productions'],
    refetchInterval: 30000, // Refresh every 30 seconds
    enabled: !!user,
  });

  // Fetch messages for the selected production
  const { data: messages, isLoading: isLoadingMessages } = useQuery({
    queryKey: ['/api/productions', selectedProduction?.id, 'messages'],
    enabled: !!selectedProduction,
  });

  // Send a new message
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { productionId: number; message: string; attachments?: File[] }) => {
      // If there are attachments, send as FormData
      if (data.attachments && data.attachments.length > 0) {
        const formData = new FormData();
        formData.append('productionId', data.productionId.toString());
        formData.append('message', data.message);
        data.attachments.forEach(file => {
          formData.append('attachments', file);
        });
        
        const response = await fetch('/api/productions/messages', {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          throw new Error('Failed to send message');
        }
        
        return response.json();
      }
      
      // Otherwise send as JSON
      const response = await apiRequest('POST', '/api/productions/messages', {
        productionId: data.productionId,
        message: data.message,
      });
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Message sent",
        description: "Your message has been sent successfully.",
      });
      
      // Clear the input
      setNewMessage("");
      setFileAttachments([]);
      
      // Refresh the messages list
      queryClient.invalidateQueries({ queryKey: ['/api/productions', selectedProduction?.id, 'messages'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Report an issue
  const reportIssueMutation = useMutation({
    mutationFn: async (data: { productionId: number; description: string; priority: string }) => {
      const response = await apiRequest('POST', '/api/productions/issues', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Issue reported",
        description: "Your issue report has been submitted.",
      });
      
      // Close the dialogs
      setIsMessageDialogOpen(false);
      setIsViewingProduction(false);
      
      // Refresh the productions list
      queryClient.invalidateQueries({ queryKey: ['/api/productions'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to report issue",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  function handleSendMessage() {
    if (!selectedProduction || !newMessage.trim()) return;
    
    sendMessageMutation.mutate({
      productionId: selectedProduction.id,
      message: newMessage,
      attachments: fileAttachments.length > 0 ? fileAttachments : undefined,
    });
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      setFileAttachments(Array.from(e.target.files));
    }
  }

  function handleReportIssue() {
    if (!selectedProduction) return;
    
    reportIssueMutation.mutate({
      productionId: selectedProduction.id,
      description: newMessage,
      priority: "medium", // Default priority
    });
  }

  function getStatusBadge(status: string) {
    const statusColors: { [key: string]: string } = {
      pending: "bg-yellow-100 text-yellow-800",
      in_progress: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      shipped: "bg-purple-100 text-purple-800",
      on_hold: "bg-red-100 text-red-800",
    };
    
    const statusLabels: { [key: string]: string } = {
      pending: "Pending",
      in_progress: "In Progress",
      completed: "Completed",
      shipped: "Shipped",
      on_hold: "On Hold",
    };
    
    return (
      <Badge className={statusColors[status] || "bg-gray-100 text-gray-800"}>
        {statusLabels[status] || status}
      </Badge>
    );
  }

  function getPriorityBadge(priority: string) {
    const priorityColors: { [key: string]: string } = {
      low: "bg-blue-100 text-blue-800",
      medium: "bg-yellow-100 text-yellow-800",
      high: "bg-orange-100 text-orange-800",
      critical: "bg-red-100 text-red-800",
    };
    
    return (
      <Badge className={priorityColors[priority] || "bg-gray-100 text-gray-800"}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </Badge>
    );
  }

  if (isLoadingProductions) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Production data will be loaded from API in a real implementation
  // Using sample data structure here
  const sampleProductions = [
    {
      id: 1,
      orderId: 12345,
      orderName: "Team Uniforms",
      clientName: "Westlake High School",
      manufacturerName: "TextilePro Manufacturing",
      status: "in_progress",
      createdAt: "2023-08-15T14:30:00Z",
      deadline: "2023-09-15T00:00:00Z",
      description: "25 custom team jerseys with screen printing",
      productionNotes: "Material supply delayed - expected arrival on Aug 20th",
    },
    {
      id: 2,
      orderId: 12346,
      orderName: "Corporate Polos",
      clientName: "Acme Inc",
      manufacturerName: "Premium Embroidery",
      status: "pending",
      createdAt: "2023-08-16T09:15:00Z",
      deadline: "2023-09-30T00:00:00Z",
      description: "50 polos with embroidered logo",
      productionNotes: null,
    },
    {
      id: 3,
      orderId: 12347,
      orderName: "Event T-Shirts",
      clientName: "City Marathon",
      manufacturerName: "TextilePro Manufacturing",
      status: "completed",
      createdAt: "2023-07-10T11:00:00Z",
      deadline: "2023-08-01T00:00:00Z",
      description: "500 event t-shirts with full color printing",
      productionNotes: "Completed ahead of schedule",
    }
  ];

  // Use API data when available, fallback to sample data for development
  const productionData = productions?.data || sampleProductions;

  return (
    <div className="space-y-6">
      {!isEmbedded && (
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Production Communication</h1>
        </div>
      )}
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Production Projects</CardTitle>
            <CardDescription>
              View and communicate about manufacturing projects
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="active">
              <TabsList>
                <TabsTrigger value="active">Active Productions</TabsTrigger>
                <TabsTrigger value="completed">Completed Productions</TabsTrigger>
              </TabsList>
              
              <TabsContent value="active">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Manufacturer</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Deadline</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productionData
                      .filter((production: any) => !['completed', 'shipped'].includes(production.status))
                      .map((production: any) => (
                        <TableRow key={production.id}>
                          <TableCell className="font-medium">{production.orderName}</TableCell>
                          <TableCell>{production.clientName}</TableCell>
                          <TableCell>{production.manufacturerName || "Unassigned"}</TableCell>
                          <TableCell>{getStatusBadge(production.status)}</TableCell>
                          <TableCell>{format(new Date(production.createdAt), "MMM d, yyyy")}</TableCell>
                          <TableCell>{format(new Date(production.deadline), "MMM d, yyyy")}</TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="outline" 
                              className="mr-2"
                              onClick={() => {
                                setSelectedProduction(production);
                                setIsMessageDialogOpen(true);
                              }}
                            >
                              <MessageSquare className="w-4 h-4 mr-1" />
                              Message
                            </Button>
                            <Button
                              onClick={() => {
                                setSelectedProduction(production);
                                setIsViewingProduction(true);
                              }}
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    {productionData.filter((production: any) => !['completed', 'shipped'].includes(production.status)).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No active productions found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TabsContent>
              
              <TabsContent value="completed">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Manufacturer</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Completed</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productionData
                      .filter((production: any) => ['completed', 'shipped'].includes(production.status))
                      .map((production: any) => (
                        <TableRow key={production.id}>
                          <TableCell className="font-medium">{production.orderName}</TableCell>
                          <TableCell>{production.clientName}</TableCell>
                          <TableCell>{production.manufacturerName || "Unknown"}</TableCell>
                          <TableCell>{getStatusBadge(production.status)}</TableCell>
                          <TableCell>{format(new Date(production.createdAt), "MMM d, yyyy")}</TableCell>
                          <TableCell>{production.deadline ? format(new Date(production.deadline), "MMM d, yyyy") : "N/A"}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setSelectedProduction(production);
                                setIsViewingProduction(true);
                              }}
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    {productionData.filter((production: any) => ['completed', 'shipped'].includes(production.status)).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No completed productions found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      
      {/* Message Dialog */}
      <Dialog open={isMessageDialogOpen} onOpenChange={setIsMessageDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Send Message</DialogTitle>
            <DialogDescription>
              Communicate with the manufacturing team about order #{selectedProduction?.orderId}: {selectedProduction?.orderName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 my-4">
            <Textarea
              placeholder="Type your message here..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              rows={5}
            />
            
            <div className="flex items-center space-x-2">
              <Label className="flex items-center space-x-2 cursor-pointer">
                <FileUp className="w-5 h-5" />
                <span>Add Attachments</span>
                <Input 
                  type="file" 
                  className="hidden" 
                  multiple 
                  onChange={handleFileChange}
                />
              </Label>
              {fileAttachments.length > 0 && (
                <span className="text-sm text-muted-foreground">
                  {fileAttachments.length} file(s) selected
                </span>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsMessageDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || sendMessageMutation.isPending}
            >
              {sendMessageMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Send Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* View Production Dialog */}
      <Dialog open={isViewingProduction} onOpenChange={setIsViewingProduction}>
        <DialogContent className="sm:max-w-[800px] lg:max-w-[900px]">
          <DialogHeader>
            <DialogTitle>Production Details</DialogTitle>
            <DialogDescription>
              Order #{selectedProduction?.orderId}: {selectedProduction?.orderName} for {selectedProduction?.clientName}
            </DialogDescription>
          </DialogHeader>
          
          <ScrollableDialogContent>
            {selectedProduction && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                    <div className="mt-1">{getStatusBadge(selectedProduction.status)}</div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Manufacturer</h3>
                    <div className="mt-1">{selectedProduction.manufacturerName || "Unassigned"}</div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Created</h3>
                    <div className="mt-1">{format(new Date(selectedProduction.createdAt), "MMM d, yyyy")}</div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Deadline</h3>
                    <div className="mt-1">{format(new Date(selectedProduction.deadline), "MMM d, yyyy")}</div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
                  <div className="mt-1 whitespace-pre-wrap">{selectedProduction.description}</div>
                </div>
                
                {selectedProduction.productionNotes && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Production Notes</h3>
                    <div className="mt-1 whitespace-pre-wrap">{selectedProduction.productionNotes}</div>
                  </div>
                )}
                
                {/* Sample communication area */}
                <div className="border-t pt-4">
                  <h3 className="text-sm font-medium">Communication</h3>
                  
                  <div className="mt-2 space-y-3">
                    <p className="text-center text-sm text-muted-foreground py-4">
                      No messages yet
                    </p>
                  </div>
                  
                  <div className="mt-4 space-y-3">
                    <Textarea
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      rows={3}
                    />
                    
                    <div className="flex items-center space-x-2">
                      <Label className="flex items-center space-x-2 cursor-pointer">
                        <FileUp className="w-5 h-5" />
                        <span>Add Attachments</span>
                        <Input 
                          type="file" 
                          className="hidden" 
                          multiple 
                          onChange={handleFileChange}
                        />
                      </Label>
                      {fileAttachments.length > 0 && (
                        <span className="text-sm text-muted-foreground">
                          {fileAttachments.length} file(s) selected
                        </span>
                      )}
                    </div>
                    
                    <div className="flex justify-between">
                      <Button 
                        variant="outline"
                        onClick={handleReportIssue}
                        disabled={!newMessage.trim() || reportIssueMutation.isPending}
                      >
                        {reportIssueMutation.isPending && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Report Issue
                      </Button>
                      
                      <Button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || sendMessageMutation.isPending}
                      >
                        {sendMessageMutation.isPending && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Send Message
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </ScrollableDialogContent>
        </DialogContent>
      </Dialog>
    </div>
  );
}