import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Clock,
  Calendar,
  DollarSign,
  FileText,
  Eye,
  Upload,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  PencilRuler,
  ImageIcon,
  FileUp,
  ChevronRight,
  XCircle,
  Info,
  User,
  Clock3,
} from "lucide-react";
import { format, formatDistanceToNow, addDays, differenceInHours } from "date-fns";

export default function DesignJobDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [designFiles, setDesignFiles] = useState<File[]>([]);
  const [designNotes, setDesignNotes] = useState("");
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  
  // Fetch design job details
  const { data: designJob, isLoading } = useQuery({
    queryKey: [`/api/design-jobs/${id}`],
    queryFn: async ({ queryKey }) => {
      // This would fetch from API in production
      return {
        data: {
          id: id,
          orderId: "12345",
          orderName: "Custom Uniform Design",
          status: "in_progress", // in_progress, submitted, approved, revision_requested
          priority: "high", // high, medium, normal
          payout: 75.00,
          claimedAt: new Date().toISOString(),
          deadline: addDays(new Date(), 3).toISOString(),
          description: "Design a custom baseball uniform with team logo on the chest and player numbers on the back.",
          itemCount: 25,
          productType: "Baseball Uniform",
          customerInstructions: "The team colors are blue and gold. The logo should feature a bear mascot. Please make the design modern and appealing to teenagers.",
          referenceImages: [
            { id: "ref1", url: "/path/to/reference1.jpg", caption: "Team logo reference" },
            { id: "ref2", url: "/path/to/reference2.jpg", caption: "Uniform style inspiration" }
          ],
          submissions: [],
          customer: {
            name: "Metro High School Baseball",
            contact: "Coach Johnson",
            email: "coach.johnson@metrohs.edu"
          }
        }
      };
    }
  });
  
  // Submit design mutation
  const submitDesignMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      // This would call API in production
      return { success: true };
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: [`/api/design-jobs/${id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/designer/stats'] });
      
      toast({
        title: "Design submitted successfully",
        description: "Your design has been submitted for review.",
      });
      
      setSubmitDialogOpen(false);
      setDesignFiles([]);
      setDesignNotes("");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to submit design",
        description: error.message || "An error occurred while submitting your design.",
        variant: "destructive",
      });
    },
  });
  
  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setDesignFiles(prevFiles => [...prevFiles, ...filesArray]);
    }
  };
  
  // Remove a file from the selection
  const removeFile = (index: number) => {
    setDesignFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };
  
  // Handle design submission
  const handleSubmitDesign = () => {
    if (designFiles.length === 0) {
      toast({
        title: "No files selected",
        description: "Please upload at least one design file before submitting.",
        variant: "destructive",
      });
      return;
    }
    
    const formData = new FormData();
    formData.append("designJobId", id);
    formData.append("notes", designNotes);
    
    designFiles.forEach((file, index) => {
      formData.append(`designFile-${index}`, file);
    });
    
    submitDesignMutation.mutate(formData);
  };
  
  // Calculate time remaining
  const calculateTimeRemaining = (deadline: string) => {
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const hoursRemaining = Math.max(0, differenceInHours(deadlineDate, now));
    
    const days = Math.floor(hoursRemaining / 24);
    const hours = hoursRemaining % 24;
    
    return { days, hours, total: hoursRemaining };
  };
  
  const job = designJob?.data;
  const timeRemaining = job ? calculateTimeRemaining(job.deadline) : { days: 0, hours: 0, total: 0 };
  
  // Calculate progress
  const getTimeProgress = () => {
    if (!job) return 0;
    
    const claimedDate = new Date(job.claimedAt);
    const deadlineDate = new Date(job.deadline);
    const now = new Date();
    
    const totalDuration = deadlineDate.getTime() - claimedDate.getTime();
    const elapsed = now.getTime() - claimedDate.getTime();
    
    return Math.min(100, Math.round((elapsed / totalDuration) * 100));
  };
  
  // Determine deadline urgency class
  const getDeadlineClass = () => {
    if (!job) return "";
    
    if (timeRemaining.total <= 24) {
      return "text-red-600";
    } else if (timeRemaining.total <= 48) {
      return "text-amber-600";
    } else {
      return "text-green-600";
    }
  };
  
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Skeleton className="h-8 w-64" />
        </div>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
              <Skeleton className="h-32 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!job) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Design Job Not Found</h2>
        <p className="text-muted-foreground mb-6">
          The design job you're looking for doesn't exist or has been assigned to another designer.
        </p>
        <Button asChild>
          <Link href="/dashboard">Return to Dashboard</Link>
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Back button and page title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/design-jobs">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-semibold">{job.orderName}</h1>
            <p className="text-sm text-muted-foreground">
              Order #{job.orderId}
            </p>
          </div>
        </div>
        
        <div className="hidden sm:flex items-center space-x-2">
          <Badge
            className={
              job.priority === "high"
                ? "bg-red-100 text-red-800"
                : job.priority === "medium"
                ? "bg-amber-100 text-amber-800"
                : "bg-blue-100 text-blue-800"
            }
          >
            {job.priority === "high" ? "Urgent" : job.priority === "medium" ? "Priority" : "Standard"}
          </Badge>
          <Badge className="bg-green-100 text-green-800">
            ${job.payout.toFixed(2)}
          </Badge>
        </div>
      </div>
      
      {/* Deadline card */}
      <Card className="border-2 border-orange-200 bg-orange-50">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="p-3 bg-orange-100 rounded-full mr-4">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-medium text-lg">Design Deadline</h3>
                <p className={`font-semibold text-lg ${getDeadlineClass()}`}>
                  {timeRemaining.days > 0 ? `${timeRemaining.days}d ${timeRemaining.hours}h remaining` : `${timeRemaining.hours}h remaining`}
                </p>
                <p className="text-sm text-muted-foreground">
                  Due {format(new Date(job.deadline), "MMM d, yyyy 'at' h:mm a")}
                </p>
              </div>
            </div>
            
            <div className="md:text-right">
              <div className="flex items-center mb-2 md:justify-end">
                <span className="text-sm font-medium mr-2">
                  Claimed {formatDistanceToNow(new Date(job.claimedAt), { addSuffix: true })}
                </span>
                {job.status === "in_progress" ? (
                  <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>
                ) : job.status === "submitted" ? (
                  <Badge className="bg-purple-100 text-purple-800">Submitted</Badge>
                ) : job.status === "approved" ? (
                  <Badge className="bg-green-100 text-green-800">Approved</Badge>
                ) : (
                  <Badge className="bg-amber-100 text-amber-800">Revision Needed</Badge>
                )}
              </div>
              
              {job.status === "in_progress" && (
                <>
                  <div className="w-full md:w-56">
                    <Progress value={getTimeProgress()} className="h-2" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Design progress: {getTimeProgress()}%
                  </p>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Main content tabs */}
      <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="details">Job Details</TabsTrigger>
          <TabsTrigger value="customerInput">Customer Input</TabsTrigger>
          <TabsTrigger value="submission">Submission</TabsTrigger>
        </TabsList>
        
        {/* Job Details Tab */}
        <TabsContent value="details" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Design Job Information</CardTitle>
              <CardDescription>
                Detailed information about this design job
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">Product Type</label>
                  <p className="font-medium">{job.productType}</p>
                </div>
                
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">Number of Items</label>
                  <p className="font-medium">{job.itemCount} items</p>
                </div>
                
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">Customer</label>
                  <p className="font-medium">{job.customer.name}</p>
                </div>
                
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">Contact</label>
                  <p className="font-medium">{job.customer.contact}</p>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Design Description</label>
                <div className="p-3 bg-slate-50 rounded-md">
                  <p>{job.description}</p>
                </div>
              </div>
              
              {job.referenceImages && job.referenceImages.length > 0 && (
                <div className="space-y-3">
                  <label className="text-sm font-medium text-muted-foreground">Reference Images</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {job.referenceImages.map((image) => (
                      <div key={image.id} className="border rounded-md overflow-hidden">
                        <div className="aspect-video bg-slate-100 flex items-center justify-center">
                          <ImageIcon className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <div className="p-2 text-xs text-muted-foreground">
                          {image.caption}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-6">
              <Button variant="outline" asChild>
                <Link href="/customer-input">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  View Customer Input
                </Link>
              </Button>
              <Button onClick={() => setActiveTab("submission")}>
                Go to Submission <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Design Guidelines</CardTitle>
              <CardDescription>
                Important information to ensure your design is approved
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start">
                <div className="p-2 bg-primary/10 rounded-full mr-3">
                  <PencilRuler className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Design Requirements</h3>
                  <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                    <li>• Create both front and back designs when applicable</li>
                    <li>• Use high-resolution (300 DPI) images for all artwork</li>
                    <li>• Follow color guidelines specified by the customer</li>
                    <li>• Provide files in both vector (AI, EPS) and raster (PNG) formats</li>
                    <li>• Ensure all text elements are properly spelled and positioned</li>
                  </ul>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="p-2 bg-primary/10 rounded-full mr-3">
                  <Info className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Submission Tips</h3>
                  <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                    <li>• Include detailed notes explaining your design choices</li>
                    <li>• Provide multiple variations when appropriate</li>
                    <li>• Submit a mockup showing how the design looks on the actual product</li>
                    <li>• Double-check that all required elements are included</li>
                    <li>• Keep original layered files in case revisions are needed</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Customer Input Tab */}
        <TabsContent value="customerInput" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer Requirements</CardTitle>
              <CardDescription>
                Information provided by the customer for this design
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border rounded-md bg-slate-50">
                <div className="flex items-start space-x-3">
                  <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="font-medium">{job.customer.contact}</div>
                    <div className="text-sm text-muted-foreground">{job.customer.email}</div>
                  </div>
                </div>
                
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Design Instructions</label>
                    <div className="p-3 bg-white rounded-md mt-1 border">
                      <p className="whitespace-pre-line">{job.customerInstructions}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {job.referenceImages && job.referenceImages.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-3">Customer Provided Images</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {job.referenceImages.map((image) => (
                      <div key={image.id} className="border rounded-md overflow-hidden">
                        <div className="aspect-video bg-slate-100 flex items-center justify-center">
                          <ImageIcon className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <div className="p-3">
                          <div className="font-medium text-sm">{image.caption}</div>
                          <Button variant="outline" size="sm" className="mt-2 w-full">
                            <Eye className="h-3 w-3 mr-1" /> View Full Size
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="border-t pt-6">
              <Button onClick={() => setActiveTab("submission")}>
                <FileUp className="mr-2 h-4 w-4" />
                Go to Submission
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Submission Tab */}
        <TabsContent value="submission" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Submit Your Design</CardTitle>
              <CardDescription>
                Upload your completed design files for review
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {job.status === "submitted" ? (
                <div className="text-center py-6">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-medium mb-2">Design Already Submitted</h3>
                  <p className="text-muted-foreground mb-4">
                    You've already submitted this design. It's currently under review.
                  </p>
                  <Button variant="outline">
                    View Submission
                  </Button>
                </div>
              ) : (
                <>
                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                    <h3 className="font-medium mb-1">Upload Design Files</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Drag and drop your design files here, or click to browse
                    </p>
                    <Input
                      type="file"
                      className="hidden"
                      id="design-file-upload"
                      multiple
                      accept="image/*,.ai,.eps,.psd"
                      onChange={handleFileSelect}
                    />
                    <Label htmlFor="design-file-upload" asChild>
                      <Button>Select Files</Button>
                    </Label>
                  </div>
                  
                  {designFiles.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium">Selected Files ({designFiles.length})</h3>
                      <ScrollArea className="h-[200px] rounded-md border p-2">
                        <div className="space-y-2">
                          {designFiles.map((file, index) => (
                            <div
                              key={index}
                              className="flex justify-between items-center p-2 bg-slate-50 rounded-md"
                            >
                              <div className="flex items-center">
                                <FileText className="h-4 w-4 text-muted-foreground mr-2" />
                                <div>
                                  <div className="text-sm font-medium">{file.name}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                  </div>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeFile(index)}
                              >
                                <XCircle className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="design-notes">Design Notes</Label>
                    <Textarea
                      id="design-notes"
                      placeholder="Add notes about your design approach, any special considerations, or instructions for the review team..."
                      className="min-h-[120px]"
                      value={designNotes}
                      onChange={(e) => setDesignNotes(e.target.value)}
                    />
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-6">
              <div className="flex items-center text-sm text-muted-foreground">
                <Clock3 className="h-4 w-4 mr-2" />
                <span>
                  {timeRemaining.days > 0
                    ? `${timeRemaining.days}d ${timeRemaining.hours}h until deadline`
                    : `${timeRemaining.hours}h until deadline`}
                </span>
              </div>
              
              {job.status !== "submitted" && (
                <Dialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
                  <DialogTrigger asChild>
                    <Button disabled={designFiles.length === 0}>
                      <FileUp className="mr-2 h-4 w-4" />
                      Submit Design
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Confirm Design Submission</DialogTitle>
                      <DialogDescription>
                        You're about to submit your design for review. Please confirm that everything is ready.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium">Files to be submitted ({designFiles.length})</h3>
                        <ScrollArea className="h-[150px] rounded-md border p-2">
                          <div className="space-y-2">
                            {designFiles.map((file, index) => (
                              <div key={index} className="text-sm">
                                <FileText className="h-3 w-3 inline mr-2" />
                                {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                      
                      <div className="bg-yellow-50 p-3 rounded-md text-sm">
                        <div className="flex items-start">
                          <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 mr-2" />
                          <div>
                            <p className="text-yellow-800 font-medium">Important</p>
                            <ul className="text-yellow-700 mt-1 list-disc list-inside space-y-1">
                              <li>Submissions will be reviewed within 48 hours</li>
                              <li>Once submitted, you cannot edit your design</li>
                              <li>If revisions are requested, you'll have 24 hours to complete them</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setSubmitDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSubmitDesign}
                        disabled={submitDesignMutation.isPending}
                      >
                        {submitDesignMutation.isPending ? (
                          <span className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Processing...
                          </span>
                        ) : (
                          <span className="flex items-center">
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Confirm Submission
                          </span>
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}