import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  AlertCircle,
  CheckCircle2,
  Clock,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Star,
  AlertTriangle,
  Loader2,
  Plus,
  Filter,
  Trash2,
  Edit,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { cn } from "@/lib/utils";

// Define the feedback form schema
const feedbackFormSchema = z.object({
  title: z.string().min(5, {
    message: "Title must be at least 5 characters.",
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }),
  type: z.enum(["feedback", "bug", "feature"], {
    required_error: "Please select a feedback type.",
  }),
  priority: z.enum(["low", "medium", "high", "critical"], {
    required_error: "Please select a priority level.",
  }),
  category: z.string().optional(),
  screenshotUrl: z.string().optional(),
});

// Define the comment form schema
const commentFormSchema = z.object({
  comment: z.string().min(1, {
    message: "Comment cannot be empty.",
  }),
});

export default function FeedbackPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedFeedbackId, setSelectedFeedbackId] = useState<number | null>(null);
  const [filterType, setFilterType] = useState<string>("all_types");
  const [filterStatus, setFilterStatus] = useState<string>("all_statuses");
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  
  // Define feedback form
  const feedbackForm = useForm<z.infer<typeof feedbackFormSchema>>({
    resolver: zodResolver(feedbackFormSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "feedback",
      priority: "medium",
      category: "",
      screenshotUrl: "",
    },
  });

  // Define comment form
  const commentForm = useForm<z.infer<typeof commentFormSchema>>({
    resolver: zodResolver(commentFormSchema),
    defaultValues: {
      comment: "",
    },
  });
  
  // Status Icon Function - shows icon based on feedback status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "new":
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case "in_review":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "in_progress":
        return <Loader2 className="h-4 w-4 text-orange-500" />;
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "rejected":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };
  
  // Type Icon Function - shows icon based on feedback type
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "feedback":
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case "bug":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "feature":
        return <Star className="h-4 w-4 text-yellow-500" />;
      default:
        return <MessageSquare className="h-4 w-4 text-gray-500" />;
    }
  };
  
  // Status Badge Function - shows badge based on feedback status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "new":
        return <Badge variant="outline" className="bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200">New</Badge>;
      case "in_review":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-600 hover:bg-yellow-100 border-yellow-200">In Review</Badge>;
      case "in_progress":
        return <Badge variant="outline" className="bg-orange-50 text-orange-600 hover:bg-orange-100 border-orange-200">In Progress</Badge>;
      case "completed":
        return <Badge variant="outline" className="bg-green-50 text-green-600 hover:bg-green-100 border-green-200">Completed</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-red-50 text-red-600 hover:bg-red-100 border-red-200">Rejected</Badge>;
      default:
        return <Badge variant="outline" className="bg-gray-50 text-gray-600 hover:bg-gray-100 border-gray-200">Unknown</Badge>;
    }
  };
  
  // Type Badge Function - shows badge based on feedback type
  const getTypeBadge = (type: string) => {
    switch (type) {
      case "feedback":
        return <Badge variant="outline" className="bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200">Feedback</Badge>;
      case "bug":
        return <Badge variant="outline" className="bg-red-50 text-red-600 hover:bg-red-100 border-red-200">Bug</Badge>;
      case "feature":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-600 hover:bg-yellow-100 border-yellow-200">Feature Request</Badge>;
      default:
        return <Badge variant="outline" className="bg-gray-50 text-gray-600 hover:bg-gray-100 border-gray-200">Unknown</Badge>;
    }
  };
  
  // Priority Badge Function - shows badge based on priority
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "low":
        return <Badge variant="outline" className="bg-gray-50 text-gray-600 hover:bg-gray-100 border-gray-200">Low</Badge>;
      case "medium":
        return <Badge variant="outline" className="bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200">Medium</Badge>;
      case "high":
        return <Badge variant="outline" className="bg-orange-50 text-orange-600 hover:bg-orange-100 border-orange-200">High</Badge>;
      case "critical":
        return <Badge variant="outline" className="bg-red-50 text-red-600 hover:bg-red-100 border-red-200">Critical</Badge>;
      default:
        return <Badge variant="outline" className="bg-gray-50 text-gray-600 hover:bg-gray-100 border-gray-200">Unknown</Badge>;
    }
  };
  
  // Get all feedback with optional filters
  const { data: feedbackData, isLoading: isLoadingFeedback, refetch: refetchFeedback } = useQuery({
    queryKey: ["/api/feedback", filterType, filterStatus],
    queryFn: async () => {
      let url = "/api/feedback";
      const params = new URLSearchParams();
      
      if (filterType && filterType !== "all_types") {
        params.append("type", filterType);
      }
      
      if (filterStatus && filterStatus !== "all_statuses") {
        params.append("status", filterStatus);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch feedback");
      }
      return response.json();
    },
  });
  
  // Get specific feedback by ID
  const { data: selectedFeedback, isLoading: isLoadingSelectedFeedback, refetch: refetchSelectedFeedback } = useQuery({
    queryKey: ["/api/feedback", selectedFeedbackId],
    queryFn: async () => {
      if (!selectedFeedbackId) return null;
      
      const response = await fetch(`/api/feedback/${selectedFeedbackId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch feedback details");
      }
      return response.json();
    },
    enabled: !!selectedFeedbackId,
  });
  
  // Get comments for selected feedback
  const { data: commentsData, isLoading: isLoadingComments, refetch: refetchComments } = useQuery({
    queryKey: ["/api/feedback/comments", selectedFeedbackId],
    queryFn: async () => {
      if (!selectedFeedbackId) return null;
      
      const response = await fetch(`/api/feedback/${selectedFeedbackId}/comments`);
      if (!response.ok) {
        throw new Error("Failed to fetch comments");
      }
      return response.json();
    },
    enabled: !!selectedFeedbackId,
  });
  
  // Submit new feedback mutation
  const submitFeedbackMutation = useMutation({
    mutationFn: async (data: z.infer<typeof feedbackFormSchema>) => {
      const response = await apiRequest("POST", "/api/feedback", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Feedback submitted",
        description: "Your feedback has been submitted successfully.",
        variant: "default",
      });
      setIsSubmitDialogOpen(false);
      feedbackForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/feedback"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to submit feedback",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });
  
  // Submit new comment mutation
  const submitCommentMutation = useMutation({
    mutationFn: async (data: z.infer<typeof commentFormSchema>) => {
      const response = await apiRequest("POST", `/api/feedback/${selectedFeedbackId}/comments`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Comment added",
        description: "Your comment has been added successfully.",
        variant: "default",
      });
      commentForm.reset();
      refetchComments();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to add comment",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });
  
  // Vote mutation
  const voteMutation = useMutation({
    mutationFn: async ({ feedbackId, voteType }: { feedbackId: number, voteType: string }) => {
      const response = await apiRequest("POST", `/api/feedback/${feedbackId}/vote`, { voteType });
      return response.json();
    },
    onSuccess: () => {
      refetchFeedback();
      if (selectedFeedbackId) {
        refetchSelectedFeedback();
      }
    },
    onError: (error: any) => {
      toast({
        title: "Failed to vote",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });
  
  // Remove vote mutation
  const removeVoteMutation = useMutation({
    mutationFn: async (feedbackId: number) => {
      const response = await apiRequest("DELETE", `/api/feedback/${feedbackId}/vote`);
      return response.json();
    },
    onSuccess: () => {
      refetchFeedback();
      if (selectedFeedbackId) {
        refetchSelectedFeedback();
      }
    },
    onError: (error: any) => {
      toast({
        title: "Failed to remove vote",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });
  
  // Delete feedback mutation
  const deleteFeedbackMutation = useMutation({
    mutationFn: async (feedbackId: number) => {
      const response = await apiRequest("DELETE", `/api/feedback/${feedbackId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Feedback deleted",
        description: "The feedback has been deleted successfully.",
        variant: "default",
      });
      setSelectedFeedbackId(null);
      refetchFeedback();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete feedback",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });
  
  // Handle feedback submission
  const onSubmitFeedback = (data: z.infer<typeof feedbackFormSchema>) => {
    submitFeedbackMutation.mutate(data);
  };
  
  // Handle comment submission
  const onSubmitComment = (data: z.infer<typeof commentFormSchema>) => {
    submitCommentMutation.mutate(data);
  };
  
  // Handle voting
  const handleVote = (feedbackId: number, voteType: string) => {
    voteMutation.mutate({ feedbackId, voteType });
  };
  
  // Handle removing vote
  const handleRemoveVote = (feedbackId: number) => {
    removeVoteMutation.mutate(feedbackId);
  };
  
  // Handle deleting feedback
  const handleDeleteFeedback = (feedbackId: number) => {
    if (window.confirm("Are you sure you want to delete this feedback? This action cannot be undone.")) {
      deleteFeedbackMutation.mutate(feedbackId);
    }
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Feedback System</h1>
          <p className="text-gray-500">Share your feedback, report bugs, or request new features</p>
        </div>
        <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus size={16} />
              New Feedback
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Submit Feedback</DialogTitle>
              <DialogDescription>
                Share your thoughts, report a bug, or suggest a new feature.
              </DialogDescription>
            </DialogHeader>
            <Form {...feedbackForm}>
              <form onSubmit={feedbackForm.handleSubmit(onSubmitFeedback)} className="space-y-4">
                <FormField
                  control={feedbackForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="feedback">Feedback</SelectItem>
                          <SelectItem value="bug">Bug Report</SelectItem>
                          <SelectItem value="feature">Feature Request</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={feedbackForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Title of your feedback" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={feedbackForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Provide details about your feedback"
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={feedbackForm.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={feedbackForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="E.g., UI, Performance, etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={feedbackForm.control}
                  name="screenshotUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Screenshot URL (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="URL to a screenshot" {...field} />
                      </FormControl>
                      <FormDescription>
                        You can upload an image to a service like Imgur and paste the link here.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" disabled={submitFeedbackMutation.isPending}>
                    {submitFeedbackMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Feedback"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <div className="mb-4 flex items-center gap-2">
            <Select
              value={filterType}
              onValueChange={setFilterType}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_types">All Types</SelectItem>
                <SelectItem value="feedback">Feedback</SelectItem>
                <SelectItem value="bug">Bug Report</SelectItem>
                <SelectItem value="feature">Feature Request</SelectItem>
              </SelectContent>
            </Select>
            
            <Select
              value={filterStatus}
              onValueChange={setFilterStatus}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_statuses">All Statuses</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="in_review">In Review</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => {
                setFilterType("all_types");
                setFilterStatus("all_statuses");
              }}
              title="Clear filters"
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="space-y-2">
            {isLoadingFeedback ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : feedbackData?.data?.length > 0 ? (
              feedbackData.data.map((feedback: any) => (
                <Card
                  key={feedback.id}
                  className={cn(
                    "cursor-pointer hover:bg-gray-50 transition-colors",
                    selectedFeedbackId === feedback.id && "border-primary bg-primary/5"
                  )}
                  onClick={() => setSelectedFeedbackId(feedback.id)}
                >
                  <CardHeader className="p-4 pb-0">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(feedback.type)}
                        <CardTitle className="text-base">{feedback.title}</CardTitle>
                      </div>
                      <div>{getStatusIcon(feedback.status)}</div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-2">
                    <div className="flex flex-wrap gap-2 mt-2">
                      {getTypeBadge(feedback.type)}
                      {getStatusBadge(feedback.status)}
                      {getPriorityBadge(feedback.priority)}
                    </div>
                    <div className="flex justify-between items-center mt-2 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <ThumbsUp className="h-3.5 w-3.5" />
                        <span>{feedback.voteCount}</span>
                      </div>
                      <span>{formatDate(feedback.createdAt)}</span>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center p-8 bg-gray-50 rounded-lg">
                <p className="text-gray-500">No feedback found</p>
                <Button
                  variant="link"
                  onClick={() => setIsSubmitDialogOpen(true)}
                  className="mt-2"
                >
                  Be the first to submit feedback
                </Button>
              </div>
            )}
          </div>
        </div>
        
        <div className="md:col-span-2">
          {isLoadingSelectedFeedback ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : selectedFeedback?.data ? (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      {getTypeIcon(selectedFeedback.data.type)}
                      <CardTitle>{selectedFeedback.data.title}</CardTitle>
                    </div>
                    <CardDescription>
                      Submitted on {formatDate(selectedFeedback.data.createdAt)}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {user?.id === selectedFeedback.data.userId && (
                      <>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDeleteFeedback(selectedFeedback.data.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {getTypeBadge(selectedFeedback.data.type)}
                  {getStatusBadge(selectedFeedback.data.status)}
                  {getPriorityBadge(selectedFeedback.data.priority)}
                  {selectedFeedback.data.category && (
                    <Badge variant="outline">{selectedFeedback.data.category}</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <p>{selectedFeedback.data.description}</p>
                  
                  {selectedFeedback.data.screenshotUrl && (
                    <div className="mt-4">
                      <p className="font-medium mb-2">Screenshot:</p>
                      <img
                        src={selectedFeedback.data.screenshotUrl}
                        alt="Screenshot"
                        className="max-w-full h-auto rounded-md border"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t pt-4">
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => handleVote(selectedFeedback.data.id, "upvote")}
                  >
                    <ThumbsUp className="h-4 w-4" />
                    <span>Upvote ({selectedFeedback.data.voteCount})</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => handleVote(selectedFeedback.data.id, "downvote")}
                  >
                    <ThumbsDown className="h-4 w-4" />
                    <span>Downvote</span>
                  </Button>
                </div>
                <div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveVote(selectedFeedback.data.id)}
                  >
                    Remove Vote
                  </Button>
                </div>
              </CardFooter>
              
              <div className="p-6 pt-0">
                <h3 className="font-medium mb-4">Comments</h3>
                
                <Form {...commentForm}>
                  <form 
                    onSubmit={commentForm.handleSubmit(onSubmitComment)} 
                    className="space-y-4 mb-6"
                  >
                    <FormField
                      control={commentForm.control}
                      name="comment"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea
                              placeholder="Add a comment..."
                              rows={2}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end">
                      <Button 
                        type="submit" 
                        disabled={submitCommentMutation.isPending}
                        size="sm"
                      >
                        {submitCommentMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Posting...
                          </>
                        ) : (
                          "Post Comment"
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
                
                <div className="space-y-4">
                  {isLoadingComments ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : commentsData?.data?.length > 0 ? (
                    commentsData.data.map((comment: any) => (
                      <div key={comment.id} className="p-4 border rounded-md">
                        <div className="flex justify-between">
                          <div className="font-medium">User #{comment.userId}</div>
                          <div className="text-sm text-gray-500">
                            {formatDate(comment.createdAt)}
                          </div>
                        </div>
                        <p className="mt-2">{comment.comment}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-gray-500">No comments yet</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-12 bg-gray-50 rounded-lg">
              <MessageSquare className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">No feedback selected</h3>
              <p className="text-gray-500 text-center mb-4">
                Select a feedback item from the list to view details or create a new one.
              </p>
              <Button onClick={() => setIsSubmitDialogOpen(true)}>
                Submit New Feedback
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}