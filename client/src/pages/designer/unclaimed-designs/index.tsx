import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";
import {
  Clock,
  Calendar,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Search,
  FileText,
  Filter,
  X,
  PenTool,
  HandGrab,
  Eye,
  Sparkles,
  Timer,
  Hourglass,
} from "lucide-react";
import { format, formatDistance, formatDistanceToNow } from "date-fns";

export default function UnclaimedDesigns() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [showClaimDialog, setShowClaimDialog] = useState(false);
  const [selectedDesign, setSelectedDesign] = useState<any>(null);
  const [sortBy, setSortBy] = useState("newest");
  
  // Fetch unclaimed design jobs
  const { data: unclaimedDesigns, isLoading: isLoadingDesigns } = useQuery({
    queryKey: ['/api/designs/unclaimed', sortBy],
    queryFn: async ({ queryKey }) => {
      // This would fetch from API in production
      return {
        data: [],
      };
    },
  });
  
  // Claim design job mutation
  const claimDesignMutation = useMutation({
    mutationFn: async (designId: string) => {
      // This would call API in production
      return { success: true };
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/designs/unclaimed'] });
      queryClient.invalidateQueries({ queryKey: ['/api/designer/jobs/pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/designer/stats'] });
      
      toast({
        title: "Design job claimed",
        description: `You've successfully claimed the design job for order #${selectedDesign?.orderId}.`,
      });
      
      setShowClaimDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to claim design job",
        description: error.message || "An error occurred while claiming the design job.",
        variant: "destructive",
      });
    },
  });
  
  // Filter designs based on search term
  const filteredDesigns = unclaimedDesigns?.data?.filter((design: any) => {
    if (!searchTerm) return true;
    
    const lowerSearchTerm = searchTerm.toLowerCase();
    return (
      (design.orderName && design.orderName.toLowerCase().includes(lowerSearchTerm)) ||
      (design.orderId && design.orderId.toString().includes(lowerSearchTerm)) ||
      (design.description && design.description.toLowerCase().includes(lowerSearchTerm)) ||
      (design.productType && design.productType.toLowerCase().includes(lowerSearchTerm))
    );
  });
  
  // Handle opening claim dialog
  const handleOpenClaimDialog = (design: any) => {
    setSelectedDesign(design);
    setShowClaimDialog(true);
  };
  
  // Handle claiming a design
  const handleClaimDesign = () => {
    if (selectedDesign?.id) {
      claimDesignMutation.mutate(selectedDesign.id);
    }
  };
  
  // Get sorting button class
  const getSortButtonClass = (value: string) => {
    return sortBy === value
      ? "bg-primary text-primary-foreground"
      : "bg-transparent border-input";
  };
  
  // Priority badge component
  const PriorityBadge = ({ priority }: { priority: string }) => {
    switch (priority) {
      case "high":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <Sparkles className="h-3 w-3 mr-1" /> Urgent
          </Badge>
        );
      case "medium":
        return (
          <Badge className="bg-amber-100 text-amber-800 border-amber-200">
            <Timer className="h-3 w-3 mr-1" /> Priority
          </Badge>
        );
      default:
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            <Hourglass className="h-3 w-3 mr-1" /> Standard
          </Badge>
        );
    }
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Unclaimed Design Jobs</CardTitle>
              <CardDescription>
                View and claim available design jobs
              </CardDescription>
            </div>
            <div className="mt-4 sm:mt-0">
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className={getSortButtonClass("newest")}
                  onClick={() => setSortBy("newest")}
                >
                  Newest First
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className={getSortButtonClass("deadline")}
                  onClick={() => setSortBy("deadline")}
                >
                  Deadline
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className={getSortButtonClass("payout")}
                  onClick={() => setSortBy("payout")}
                >
                  Highest Payout
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className={getSortButtonClass("priority")}
                  onClick={() => setSortBy("priority")}
                >
                  Urgent First
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search orders by name, ID, or product type..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-9 w-9"
                  onClick={() => setSearchTerm("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          
          {isLoadingDesigns ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
              <p>Loading available design jobs...</p>
            </div>
          ) : filteredDesigns?.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredDesigns.map((design: any) => (
                <div
                  key={design.id}
                  className="border rounded-lg overflow-hidden hover:border-primary/50 transition-colors"
                >
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-lg">{design.orderName}</h3>
                          <PriorityBadge priority={design.priority} />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Order #{design.orderId} • {design.productType}
                        </p>
                      </div>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="bg-green-50 px-3 py-1 rounded-full flex items-center">
                              <DollarSign className="h-3 w-3 text-green-600 mr-1" />
                              <span className="font-medium text-green-700">${design.payout?.toFixed(2)}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            <p>Payout upon successful completion</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    
                    <div className="mt-3 space-y-2">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1 text-muted-foreground" />
                          <span>Created: {formatDistanceToNow(new Date(design.createdAt), { addSuffix: true })}</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 mr-1 text-muted-foreground" />
                          <span>Due: {format(new Date(design.deadline), 'MMM d, h:mm a')}</span>
                        </div>
                      </div>
                      
                      {design.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                          {design.description}
                        </p>
                      )}
                    </div>
                    
                    <div className="mt-4 flex justify-between items-center">
                      <div className="flex items-center text-sm">
                        <FileText className="h-3 w-3 mr-1 text-muted-foreground" />
                        <span>{design.itemCount || 1} items</span>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8"
                          asChild
                        >
                          <Link href={`/design-preview/${design.id}`}>
                            <Eye className="h-3 w-3 mr-1" />
                            Preview
                          </Link>
                        </Button>
                        
                        <Button
                          size="sm"
                          className="h-8"
                          onClick={() => handleOpenClaimDialog(design)}
                        >
                          <HandGrab className="h-3 w-3 mr-1" />
                          Claim Job
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border rounded-lg">
              <PenTool className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              {searchTerm ? (
                <>
                  <h3 className="font-medium">No matching design jobs found</h3>
                  <p className="text-sm text-muted-foreground mt-1 mb-4">
                    Try adjusting your search terms
                  </p>
                  <Button variant="outline" onClick={() => setSearchTerm("")}>
                    Clear Search
                  </Button>
                </>
              ) : (
                <>
                  <h3 className="font-medium">No unclaimed design jobs available</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    All available design jobs have been claimed. Check back later for new jobs.
                  </p>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Design Job Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>How Design Jobs Work</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-50 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <div className="bg-primary/10 w-8 h-8 rounded-full flex items-center justify-center mr-2">
                  <HandGrab className="h-4 w-4 text-primary" />
                </div>
                <h3 className="font-medium">1. Claim a Design Job</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Browse available jobs and claim ones that match your skills and availability.
              </p>
            </div>
            
            <div className="bg-slate-50 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <div className="bg-primary/10 w-8 h-8 rounded-full flex items-center justify-center mr-2">
                  <PenTool className="h-4 w-4 text-primary" />
                </div>
                <h3 className="font-medium">2. Complete the Design</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Create the design according to specifications within the 72-hour deadline.
              </p>
            </div>
            
            <div className="bg-slate-50 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <div className="bg-primary/10 w-8 h-8 rounded-full flex items-center justify-center mr-2">
                  <DollarSign className="h-4 w-4 text-primary" />
                </div>
                <h3 className="font-medium">3. Get Paid</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Once your design is approved, you'll receive the payout on the next payment cycle.
              </p>
            </div>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-2" />
              <div>
                <h3 className="font-medium text-yellow-800">Important Notes</h3>
                <ul className="text-sm text-yellow-700 mt-1 list-disc list-inside space-y-1">
                  <li>Design jobs must be completed within 72 hours of claiming</li>
                  <li>Urgent jobs have higher payouts but tighter deadlines</li>
                  <li>You can have a maximum of 10 active design jobs at once</li>
                  <li>Consistently meeting deadlines improves your completion rate and access to premium jobs</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="justify-center border-t pt-4">
          <Button asChild variant="outline">
            <Link href="/design-process-guide">
              <FileText className="h-4 w-4 mr-2" />
              View Complete Designer Guide
            </Link>
          </Button>
        </CardFooter>
      </Card>
      
      {/* Claim Design Dialog */}
      <Dialog open={showClaimDialog} onOpenChange={setShowClaimDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Claim Design Job</DialogTitle>
            <DialogDescription>
              You're about to claim this design job. You'll have 72 hours to complete it once claimed.
            </DialogDescription>
          </DialogHeader>
          
          {selectedDesign && (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{selectedDesign.orderName}</h3>
                  <p className="text-sm text-muted-foreground">
                    Order #{selectedDesign.orderId}
                  </p>
                </div>
                <PriorityBadge priority={selectedDesign.priority} />
              </div>
              
              <Separator />
              
              <ScrollArea className="max-h-[200px]">
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium">Deadline</h4>
                    <p className="text-sm">
                      Due by {format(new Date(selectedDesign.deadline), 'MMM d, yyyy, h:mm a')}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium">Payout</h4>
                    <p className="text-sm">${selectedDesign.payout?.toFixed(2)}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium">Items to Design</h4>
                    <p className="text-sm">{selectedDesign.itemCount || 1} items</p>
                  </div>
                  
                  {selectedDesign.description && (
                    <div>
                      <h4 className="text-sm font-medium">Description</h4>
                      <p className="text-sm whitespace-pre-line">{selectedDesign.description}</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
              
              <div className="bg-yellow-50 p-3 rounded-md text-sm">
                <div className="flex">
                  <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 mr-2" />
                  <p className="text-yellow-800">
                    By claiming this job, you commit to completing it within the 72-hour deadline. 
                    Failure to meet deadlines may affect your completion rate and access to future jobs.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowClaimDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleClaimDesign}
              disabled={claimDesignMutation.isPending}
            >
              {claimDesignMutation.isPending ? (
                <span className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </span>
              ) : (
                <span className="flex items-center">
                  <HandGrab className="h-4 w-4 mr-2" />
                  Claim Design Job
                </span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}