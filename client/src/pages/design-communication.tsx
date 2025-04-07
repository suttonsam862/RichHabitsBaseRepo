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
import { Loader2, FileUp, MessageSquare } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface Design {
  id: number;
  orderId: number;
  orderName: string;
  clientName: string;
  designerName?: string;
  status: "pending" | "in_progress" | "completed" | "approved" | "revisions_needed";
  createdAt: string;
  deadline: string;
  description: string;
  designNotes?: string;
  designFiles?: string[];
  revisionRequests?: DesignRevision[];
}

interface DesignRevision {
  id: number;
  designId: number;
  requestedBy: string;
  requestedAt: string;
  description: string;
  status: "pending" | "completed";
}

interface DesignMessage {
  id: number;
  designId: number;
  senderId: number;
  senderName: string;
  senderRole: string;
  message: string;
  sentAt: string;
  attachments?: string[];
}

export default function DesignCommunicationPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDesign, setSelectedDesign] = useState<Design | null>(null);
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const [isViewingDesign, setIsViewingDesign] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [fileAttachments, setFileAttachments] = useState<File[]>([]);

  // Fetch designs for the current user
  const { data: designs, isLoading: isLoadingDesigns } = useQuery({
    queryKey: ['/api/designs'],
    refetchInterval: 30000, // Refresh every 30 seconds
    enabled: !!user,
  });

  // Fetch messages for the selected design
  const { data: messages, isLoading: isLoadingMessages } = useQuery({
    queryKey: ['/api/designs', selectedDesign?.id, 'messages'],
    enabled: !!selectedDesign,
  });

  // Send a new message
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { designId: number; message: string; attachments?: File[] }) => {
      // If there are attachments, send as FormData
      if (data.attachments && data.attachments.length > 0) {
        const formData = new FormData();
        formData.append('designId', data.designId.toString());
        formData.append('message', data.message);
        data.attachments.forEach(file => {
          formData.append('attachments', file);
        });
        
        const response = await fetch('/api/designs/messages', {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          throw new Error('Failed to send message');
        }
        
        return response.json();
      }
      
      // Otherwise send as JSON
      const response = await apiRequest('POST', '/api/designs/messages', {
        designId: data.designId,
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
      queryClient.invalidateQueries({ queryKey: ['/api/designs', selectedDesign?.id, 'messages'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Request a revision
  const requestRevisionMutation = useMutation({
    mutationFn: async (data: { designId: number; description: string }) => {
      const response = await apiRequest('POST', '/api/designs/revisions', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Revision requested",
        description: "Your revision request has been submitted.",
      });
      
      // Close the dialogs
      setIsMessageDialogOpen(false);
      setIsViewingDesign(false);
      
      // Refresh the designs list
      queryClient.invalidateQueries({ queryKey: ['/api/designs'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to request revision",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Approve a design
  const approveDesignMutation = useMutation({
    mutationFn: async (designId: number) => {
      const response = await apiRequest('POST', `/api/designs/${designId}/approve`, {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Design approved",
        description: "The design has been approved and will move to the next stage.",
      });
      
      // Close the dialogs
      setIsViewingDesign(false);
      
      // Refresh the designs list
      queryClient.invalidateQueries({ queryKey: ['/api/designs'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to approve design",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  function handleSendMessage() {
    if (!selectedDesign || !newMessage.trim()) return;
    
    sendMessageMutation.mutate({
      designId: selectedDesign.id,
      message: newMessage,
      attachments: fileAttachments.length > 0 ? fileAttachments : undefined,
    });
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      setFileAttachments(Array.from(e.target.files));
    }
  }

  function handleRequestRevision() {
    if (!selectedDesign) return;
    
    requestRevisionMutation.mutate({
      designId: selectedDesign.id,
      description: newMessage,
    });
  }

  function handleApproveDesign() {
    if (!selectedDesign) return;
    approveDesignMutation.mutate(selectedDesign.id);
  }

  function getStatusBadge(status: string) {
    const statusColors: { [key: string]: string } = {
      pending: "bg-yellow-100 text-yellow-800",
      in_progress: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      approved: "bg-purple-100 text-purple-800",
      revisions_needed: "bg-red-100 text-red-800",
    };
    
    const statusLabels: { [key: string]: string } = {
      pending: "Pending",
      in_progress: "In Progress",
      completed: "Completed",
      approved: "Approved",
      revisions_needed: "Needs Revision",
    };
    
    return (
      <Badge className={statusColors[status] || "bg-gray-100 text-gray-800"}>
        {statusLabels[status] || status}
      </Badge>
    );
  }

  if (isLoadingDesigns) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Design Communication</h1>
      </div>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Your Design Projects</CardTitle>
            <CardDescription>
              View and communicate about designs for your orders
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="active">
              <TabsList>
                <TabsTrigger value="active">Active Designs</TabsTrigger>
                <TabsTrigger value="completed">Completed Designs</TabsTrigger>
              </TabsList>
              
              <TabsContent value="active">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Designer</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Deadline</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {designs && designs.data && designs.data
                      .filter((design: Design) => !['approved'].includes(design.status))
                      .map((design: Design) => (
                        <TableRow key={design.id}>
                          <TableCell className="font-medium">{design.orderName}</TableCell>
                          <TableCell>{design.clientName}</TableCell>
                          <TableCell>{design.designerName || "Unassigned"}</TableCell>
                          <TableCell>{getStatusBadge(design.status)}</TableCell>
                          <TableCell>{format(new Date(design.createdAt), "MMM d, yyyy")}</TableCell>
                          <TableCell>{format(new Date(design.deadline), "MMM d, yyyy")}</TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="outline" 
                              className="mr-2"
                              onClick={() => {
                                setSelectedDesign(design);
                                setIsMessageDialogOpen(true);
                              }}
                            >
                              <MessageSquare className="w-4 h-4 mr-1" />
                              Message
                            </Button>
                            <Button
                              onClick={() => {
                                setSelectedDesign(design);
                                setIsViewingDesign(true);
                              }}
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    {(!designs || !designs.data || designs.data.filter((design: Design) => !['approved'].includes(design.status)).length === 0) && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No active designs found
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
                      <TableHead>Designer</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Completed</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {designs && designs.data && designs.data
                      .filter((design: Design) => ['approved'].includes(design.status))
                      .map((design: Design) => (
                        <TableRow key={design.id}>
                          <TableCell className="font-medium">{design.orderName}</TableCell>
                          <TableCell>{design.clientName}</TableCell>
                          <TableCell>{design.designerName || "Unknown"}</TableCell>
                          <TableCell>{getStatusBadge(design.status)}</TableCell>
                          <TableCell>{format(new Date(design.createdAt), "MMM d, yyyy")}</TableCell>
                          <TableCell>{design.deadline ? format(new Date(design.deadline), "MMM d, yyyy") : "N/A"}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setSelectedDesign(design);
                                setIsViewingDesign(true);
                              }}
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    {(!designs || !designs.data || designs.data.filter((design: Design) => ['approved'].includes(design.status)).length === 0) && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No completed designs found
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
              Communicate with the design team about order #{selectedDesign?.orderId}: {selectedDesign?.orderName}
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
      
      {/* View Design Dialog */}
      <Dialog open={isViewingDesign} onOpenChange={setIsViewingDesign}>
        <DialogContent className="sm:max-w-[800px] lg:max-w-[900px]">
          <DialogHeader>
            <DialogTitle>Design Details</DialogTitle>
            <DialogDescription>
              Order #{selectedDesign?.orderId}: {selectedDesign?.orderName} for {selectedDesign?.clientName}
            </DialogDescription>
          </DialogHeader>
          
          <ScrollableDialogContent>
            {selectedDesign && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                    <div className="mt-1">{getStatusBadge(selectedDesign.status)}</div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Designer</h3>
                    <div className="mt-1">{selectedDesign.designerName || "Unassigned"}</div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Created</h3>
                    <div className="mt-1">{format(new Date(selectedDesign.createdAt), "MMM d, yyyy")}</div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Deadline</h3>
                    <div className="mt-1">{format(new Date(selectedDesign.deadline), "MMM d, yyyy")}</div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
                  <div className="mt-1 whitespace-pre-wrap">{selectedDesign.description}</div>
                </div>
                
                {selectedDesign.designNotes && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Designer Notes</h3>
                    <div className="mt-1 whitespace-pre-wrap">{selectedDesign.designNotes}</div>
                  </div>
                )}
                
                {selectedDesign.designFiles && selectedDesign.designFiles.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Design Files</h3>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {selectedDesign.designFiles.map((file, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          className="text-left justify-start"
                          onClick={() => window.open(file, '_blank')}
                        >
                          <FileUp className="w-4 h-4 mr-2" />
                          {file.split('/').pop()}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
                
                {selectedDesign.revisionRequests && selectedDesign.revisionRequests.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Revision History</h3>
                    <div className="mt-2 space-y-3">
                      {selectedDesign.revisionRequests.map((revision) => (
                        <div key={revision.id} className="bg-muted p-3 rounded-md">
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">Requested by {revision.requestedBy}</span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(revision.requestedAt), "MMM d, yyyy 'at' h:mm a")}
                            </span>
                          </div>
                          <p className="mt-1 text-sm whitespace-pre-wrap">{revision.description}</p>
                          <Badge 
                            className={revision.status === "completed" 
                              ? "bg-green-100 text-green-800 mt-2" 
                              : "bg-yellow-100 text-yellow-800 mt-2"
                            }
                          >
                            {revision.status === "completed" ? "Completed" : "Pending"}
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
                        messages.data.map((msg: DesignMessage) => (
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
                        {selectedDesign.status === 'completed' && (
                          <>
                            <Button 
                              variant="outline" 
                              className="border-yellow-500 text-yellow-500 hover:bg-yellow-50"
                              onClick={handleRequestRevision}
                              disabled={!newMessage.trim() || requestRevisionMutation.isPending}
                            >
                              {requestRevisionMutation.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              )}
                              Request Revision
                            </Button>
                            
                            <Button 
                              className="bg-green-600 hover:bg-green-700"
                              onClick={handleApproveDesign}
                              disabled={approveDesignMutation.isPending}
                            >
                              {approveDesignMutation.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              )}
                              Approve Design
                            </Button>
                          </>
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