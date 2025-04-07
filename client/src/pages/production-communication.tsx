import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollableDialogContent } from "@/components/ui/scrollable-dialog-content";
import { Loader2, FileUp, MessageSquare, Truck, AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface Production {
  id: number;
  orderId: number;
  orderName: string;
  clientName: string;
  salesRepName: string;
  manufacturerName?: string;
  status: "pending" | "in_progress" | "completed" | "shipped" | "delivered" | "issues";
  createdAt: string;
  deadline: string;
  totalItems: number;
  completedItems: number;
  productionNotes?: string;
  shippingNotes?: string;
  issues?: ProductionIssue[];
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

export default function ProductionCommunicationPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedProduction, setSelectedProduction] = useState<Production | null>(null);
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const [isViewingProduction, setIsViewingProduction] = useState(false);
  const [isReportingIssue, setIsReportingIssue] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [fileAttachments, setFileAttachments] = useState<File[]>([]);
  const [issueDescription, setIssueDescription] = useState("");
  const [issuePriority, setIssuePriority] = useState<"low" | "medium" | "high" | "critical">("medium");

  // Fetch productions for the current user
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

  // Report a production issue
  const reportIssueMutation = useMutation({
    mutationFn: async (data: { productionId: number; description: string; priority: string }) => {
      const response = await apiRequest('POST', '/api/productions/issues', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Issue reported",
        description: "Your issue has been reported and will be addressed by the team.",
      });
      
      // Close the dialog
      setIsReportingIssue(false);
      
      // Clear the input
      setIssueDescription("");
      setIssuePriority("medium");
      
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

  // Confirm receipt of production
  const confirmReceiptMutation = useMutation({
    mutationFn: async (productionId: number) => {
      const response = await apiRequest('POST', `/api/productions/${productionId}/confirm-receipt`, {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Receipt confirmed",
        description: "You have confirmed receipt of this production.",
      });
      
      // Close the dialog
      setIsViewingProduction(false);
      
      // Refresh the productions list
      queryClient.invalidateQueries({ queryKey: ['/api/productions'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to confirm receipt",
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
    if (!selectedProduction || !issueDescription.trim()) return;
    
    reportIssueMutation.mutate({
      productionId: selectedProduction.id,
      description: issueDescription,
      priority: issuePriority,
    });
  }

  function handleConfirmReceipt() {
    if (!selectedProduction) return;
    confirmReceiptMutation.mutate(selectedProduction.id);
  }

  function getStatusBadge(status: string) {
    const statusColors: { [key: string]: string } = {
      pending: "bg-yellow-100 text-yellow-800",
      in_progress: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      shipped: "bg-purple-100 text-purple-800",
      delivered: "bg-teal-100 text-teal-800",
      issues: "bg-red-100 text-red-800",
    };
    
    const statusLabels: { [key: string]: string } = {
      pending: "Pending",
      in_progress: "In Production",
      completed: "Completed",
      shipped: "Shipped",
      delivered: "Delivered",
      issues: "Issues Reported",
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
    
    const priorityLabels: { [key: string]: string } = {
      low: "Low",
      medium: "Medium",
      high: "High",
      critical: "Critical",
    };
    
    return (
      <Badge className={priorityColors[priority] || "bg-gray-100 text-gray-800"}>
        {priorityLabels[priority] || priority}
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Production Communication</h1>
      </div>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Your Productions</CardTitle>
            <CardDescription>
              Monitor and communicate about your orders in production
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
                      <TableHead>Progress</TableHead>
                      <TableHead>Deadline</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productions && productions.data && productions.data
                      .filter((production: Production) => !['delivered'].includes(production.status))
                      .map((production: Production) => (
                        <TableRow key={production.id}>
                          <TableCell className="font-medium">{production.orderName}</TableCell>
                          <TableCell>{production.clientName}</TableCell>
                          <TableCell>{production.manufacturerName || "Unassigned"}</TableCell>
                          <TableCell>{getStatusBadge(production.status)}</TableCell>
                          <TableCell>
                            {production.totalItems > 0 
                              ? `${Math.round((production.completedItems / production.totalItems) * 100)}%` 
                              : "0%"}
                          </TableCell>
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
                    {(!productions || !productions.data || productions.data.filter((production: Production) => !['delivered'].includes(production.status)).length === 0) && (
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
                      <TableHead>Completed Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productions && productions.data && productions.data
                      .filter((production: Production) => ['delivered'].includes(production.status))
                      .map((production: Production) => (
                        <TableRow key={production.id}>
                          <TableCell className="font-medium">{production.orderName}</TableCell>
                          <TableCell>{production.clientName}</TableCell>
                          <TableCell>{production.manufacturerName || "Unknown"}</TableCell>
                          <TableCell>{getStatusBadge(production.status)}</TableCell>
                          <TableCell>{format(new Date(production.createdAt), "MMM d, yyyy")}</TableCell>
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
                    {(!productions || !productions.data || productions.data.filter((production: Production) => ['delivered'].includes(production.status)).length === 0) && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
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
      
      {/* Report Issue Dialog */}
      <Dialog open={isReportingIssue} onOpenChange={setIsReportingIssue}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Report Production Issue</DialogTitle>
            <DialogDescription>
              Report an issue with order #{selectedProduction?.orderId}: {selectedProduction?.orderName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 my-4">
            <div>
              <Label htmlFor="issue-priority">Issue Priority</Label>
              <Select 
                value={issuePriority} 
                onValueChange={(value) => setIssuePriority(value as any)}
              >
                <SelectTrigger id="issue-priority">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="issue-description">Description</Label>
              <Textarea
                id="issue-description"
                placeholder="Describe the issue in detail..."
                value={issueDescription}
                onChange={(e) => setIssueDescription(e.target.value)}
                rows={5}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsReportingIssue(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleReportIssue}
              disabled={!issueDescription.trim() || reportIssueMutation.isPending}
            >
              {reportIssueMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Report Issue
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
                    <h3 className="text-sm font-medium text-muted-foreground">Sales Rep</h3>
                    <div className="mt-1">{selectedProduction.salesRepName}</div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Deadline</h3>
                    <div className="mt-1">{format(new Date(selectedProduction.deadline), "MMM d, yyyy")}</div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Progress</h3>
                    <div className="mt-1">
                      {selectedProduction.completedItems} of {selectedProduction.totalItems} items
                      {" "}
                      ({selectedProduction.totalItems > 0 
                        ? `${Math.round((selectedProduction.completedItems / selectedProduction.totalItems) * 100)}%` 
                        : "0%"})
                    </div>
                  </div>
                </div>
                
                {selectedProduction.productionNotes && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Production Notes</h3>
                    <div className="mt-1 whitespace-pre-wrap">{selectedProduction.productionNotes}</div>
                  </div>
                )}
                
                {selectedProduction.shippingNotes && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Shipping Notes</h3>
                    <div className="mt-1 whitespace-pre-wrap">{selectedProduction.shippingNotes}</div>
                  </div>
                )}
                
                {selectedProduction.issues && selectedProduction.issues.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Issues</h3>
                    <div className="mt-2 space-y-3">
                      {selectedProduction.issues.map((issue) => (
                        <div key={issue.id} className="bg-muted p-3 rounded-md">
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">Reported by {issue.reportedBy}</span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(issue.reportedAt), "MMM d, yyyy 'at' h:mm a")}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs">Priority:</span>
                            {getPriorityBadge(issue.priority)}
                          </div>
                          <p className="mt-1 text-sm whitespace-pre-wrap">{issue.description}</p>
                          <Badge 
                            className={
                              issue.status === "resolved"
                                ? "bg-green-100 text-green-800 mt-2"
                                : issue.status === "in_progress"
                                ? "bg-blue-100 text-blue-800 mt-2"
                                : "bg-yellow-100 text-yellow-800 mt-2"
                            }
                          >
                            {issue.status === "resolved" 
                              ? "Resolved" 
                              : issue.status === "in_progress"
                              ? "In Progress"
                              : "Open"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="border-t pt-4">
                  <h3 className="text-sm font-medium">Communication</h3>
                  
                  {isLoadingMessages ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : (
                    <div className="mt-2 space-y-3">
                      {messages && messages.data && messages.data.length > 0 ? (
                        messages.data.map((msg: ProductionMessage) => (
                          <div key={msg.id} className="bg-muted p-3 rounded-md">
                            <div className="flex justify-between">
                              <span className="text-sm font-medium">
                                {msg.senderName} ({msg.senderRole})
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(msg.sentAt), "MMM d, yyyy 'at' h:mm a")}
                              </span>
                            </div>
                            <p className="mt-1 text-sm whitespace-pre-wrap">{msg.message}</p>
                            
                            {msg.attachments && msg.attachments.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-2">
                                {msg.attachments.map((file, index) => (
                                  <Button
                                    key={index}
                                    variant="outline"
                                    size="sm"
                                    className="text-xs"
                                    onClick={() => window.open(file, '_blank')}
                                  >
                                    <FileUp className="w-3 h-3 mr-1" />
                                    {file.split('/').pop()}
                                  </Button>
                                ))}
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-center text-sm text-muted-foreground py-4">
                          No messages yet
                        </p>
                      )}
                    </div>
                  )}
                  
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
                        type="button"
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || sendMessageMutation.isPending}
                      >
                        {sendMessageMutation.isPending && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Send Message
                      </Button>
                      
                      <div className="space-x-2">
                        {selectedProduction.status !== 'delivered' && (
                          <Button 
                            variant="outline" 
                            className="border-red-500 text-red-500 hover:bg-red-50"
                            onClick={() => {
                              setIsViewingProduction(false);
                              setIsReportingIssue(true);
                            }}
                          >
                            <AlertTriangle className="w-4 h-4 mr-1" />
                            Report Issue
                          </Button>
                        )}
                        
                        {selectedProduction.status === 'shipped' && (
                          <Button 
                            className="bg-green-600 hover:bg-green-700"
                            onClick={handleConfirmReceipt}
                            disabled={confirmReceiptMutation.isPending}
                          >
                            {confirmReceiptMutation.isPending && (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            <Truck className="w-4 h-4 mr-1" />
                            Confirm Receipt
                          </Button>
                        )}
                      </div>
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