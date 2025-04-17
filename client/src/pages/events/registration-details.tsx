import React, { useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { 
  ChevronLeft, 
  CalendarRange, 
  User, 
  CreditCard, 
  Edit, 
  Download, 
  Mail, 
  Clock, 
  File, 
  Printer,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDate, formatCurrency } from "@/lib/utils";

function RegistrationDetails() {
  const { registrationId } = useParams();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  
  // Fetch registration details
  const { 
    data: registration, 
    isLoading: isLoadingRegistration,
    isError: isRegistrationError,
    error: registrationError
  } = useQuery({
    queryKey: ['/api/registrations', registrationId],
    enabled: !!registrationId,
  });
  
  // Fetch camp details
  const { data: camp } = useQuery({
    queryKey: ['/api/camps', registration?.data?.campId],
    enabled: !!registration?.data?.campId,
  });
  
  // Fetch registration tier details
  const { data: tier } = useQuery({
    queryKey: ['/api/registration-tiers', registration?.data?.tierId],
    enabled: !!registration?.data?.tierId,
  });
  
  // Fetch communication history
  const { 
    data: communications,
    isLoading: isLoadingCommunications 
  } = useQuery({
    queryKey: ['/api/registrations', registrationId, 'communications'],
    enabled: !!registrationId,
  });
  
  // Update registration status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ status, notes }: { status: string, notes?: string }) => {
      const response = await apiRequest(
        "PATCH",
        `/api/registrations/${registrationId}/status`,
        { status, notes }
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Status updated",
        description: "Registration status has been updated successfully.",
      });
      queryClient.invalidateQueries({ 
        queryKey: ['/api/registrations', registrationId] 
      });
      setCancelDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Send confirmation email mutation
  const sendEmailMutation = useMutation({
    mutationFn: async ({ template, subject }: { template: string, subject: string }) => {
      const response = await apiRequest(
        "POST",
        `/api/registrations/${registrationId}/send-email`,
        { template, subject }
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Email sent",
        description: "Communication has been sent successfully.",
      });
      queryClient.invalidateQueries({ 
        queryKey: ['/api/registrations', registrationId, 'communications'] 
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send email",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle cancel registration
  const handleCancelRegistration = () => {
    updateStatusMutation.mutate({ 
      status: "cancelled",
      notes: "Cancelled by admin"
    });
  };
  
  // Handle status change
  const handleStatusChange = (newStatus: string) => {
    updateStatusMutation.mutate({ status: newStatus });
  };
  
  // Handle send confirmation email
  const handleSendConfirmation = () => {
    sendEmailMutation.mutate({
      template: "registration_confirmation",
      subject: "Registration Confirmation"
    });
  };
  
  // Back to registrations
  const handleBackToList = () => {
    setLocation("/events/registration");
  };
  
  // Handle printing
  const handlePrint = () => {
    window.print();
  };
  
  // Loading state
  if (isLoadingRegistration) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // Error state
  if (isRegistrationError) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <Button variant="outline" onClick={handleBackToList}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Registrations
          </Button>
        </div>
        
        <Card className="mx-auto max-w-md text-center p-6">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle>Registration Not Found</CardTitle>
            <CardDescription>
              {registrationError?.message || "The registration you are looking for does not exist or you don't have permission to view it."}
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button onClick={handleBackToList}>
              View All Registrations
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  // Extract registration data
  const registrationData = registration?.data;
  const tierData = tier?.data;
  const campData = camp?.data;
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleBackToList} className="mr-2">
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:block ml-1">Back to Registrations</span>
            </Button>
            <h1 className="text-2xl font-bold md:text-3xl">Registration #{registrationId}</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            Created on {formatDate(registrationData?.createdAt)}
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={handlePrint}>
                  <Printer className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Print Registration</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon">
                  <Download className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Download PDF</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={handleSendConfirmation}>
                  <Mail className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Email Confirmation</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <Button variant="outline" asChild>
            <Link href={`/events/registration-form/${registrationData?.campId}`}>
              <Edit className="mr-2 h-4 w-4" />
              <span>Edit</span>
            </Link>
          </Button>
          
          <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <XCircle className="mr-2 h-4 w-4" />
                <span>Cancel Registration</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Cancel Registration</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to cancel this registration? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>No, keep registration</AlertDialogCancel>
                <AlertDialogAction onClick={handleCancelRegistration} className="bg-red-600 hover:bg-red-700">
                  Yes, cancel registration
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      
      {/* Status Section */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <Card className="flex-grow">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Registration Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Badge
                className={`
                  ${registrationData?.status === 'confirmed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 
                  registrationData?.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' : 
                  registrationData?.status === 'cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' : 
                  registrationData?.status === 'waiting' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                  'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'}`
                }
                variant="outline"
                className="text-base py-1 px-3"
              >
                {registrationData?.status?.charAt(0).toUpperCase() + registrationData?.status?.slice(1)}
              </Badge>
              
              <div className="flex-shrink-0">
                {registrationData?.status !== 'confirmed' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-green-600 border-green-200 hover:bg-green-50"
                    onClick={() => handleStatusChange('confirmed')}
                  >
                    <CheckCircle2 className="mr-1 h-4 w-4" />
                    Confirm
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="flex-grow">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Payment Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <Badge
                  className={`
                    ${registrationData?.paymentStatus === 'paid' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 
                    registrationData?.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' : 
                    registrationData?.paymentStatus === 'refunded' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                    'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'}`
                  }
                  variant="outline"
                  className="text-base py-1 px-3"
                >
                  {registrationData?.paymentStatus?.charAt(0).toUpperCase() + registrationData?.paymentStatus?.slice(1)}
                </Badge>
                <div className="mt-1 text-muted-foreground text-sm">
                  {formatCurrency(registrationData?.amount || tierData?.price || 0)}
                </div>
              </div>
              
              <div className="flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                >
                  <CreditCard className="mr-1 h-4 w-4" />
                  View Details
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="flex-grow">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Shopify Order</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                {registrationData?.shopifyOrderId ? (
                  <>
                    <div className="font-medium">Order #{registrationData.shopifyOrderId}</div>
                    <div className="text-muted-foreground text-sm">
                      {formatDate(registrationData.shopifyOrderDate)}
                    </div>
                  </>
                ) : (
                  <div className="text-muted-foreground">No Shopify order linked</div>
                )}
              </div>
              
              {registrationData?.shopifyOrderId && (
                <div className="flex-shrink-0">
                  <Button variant="outline" size="sm">
                    <File className="mr-1 h-4 w-4" />
                    View
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column - Registration Details */}
        <div className="md:col-span-2 space-y-6">
          <Tabs defaultValue="details">
            <TabsList className="mb-4">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="communications">Communications</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="mr-2 h-5 w-5 text-primary" />
                    Participant Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Full Name</h4>
                      <p className="font-medium">{registrationData?.firstName} {registrationData?.lastName}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Email</h4>
                      <p className="font-medium">{registrationData?.email}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Phone</h4>
                      <p className="font-medium">{registrationData?.phone || "N/A"}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Date of Birth</h4>
                      <p className="font-medium">{registrationData?.dateOfBirth ? formatDate(registrationData.dateOfBirth) : "N/A"}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Gender</h4>
                      <p className="font-medium">{registrationData?.gender ? registrationData.gender.charAt(0).toUpperCase() + registrationData.gender.slice(1) : "N/A"}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Shirt Size</h4>
                      <p className="font-medium">{registrationData?.shirtSize || "N/A"}</p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Address</h4>
                    <div className="space-y-1">
                      {registrationData?.address ? (
                        <>
                          <p>{registrationData.address}</p>
                          <p>
                            {registrationData.city}{registrationData.city && registrationData.state ? ", " : ""}
                            {registrationData.state} {registrationData.zipCode}
                          </p>
                        </>
                      ) : (
                        <p>No address provided</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CalendarRange className="mr-2 h-5 w-5 text-primary" />
                    Camp & Registration Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Camp</h4>
                      <p className="font-medium">{campData?.name}</p>
                      <p className="text-sm text-muted-foreground">{campData?.type || "Sports Camp"}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Date</h4>
                      <p className="font-medium">
                        {campData?.startDate && campData?.endDate ? (
                          <>{formatDate(campData.startDate)} - {formatDate(campData.endDate)}</>
                        ) : (
                          "Date not set"
                        )}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Registration Package</h4>
                      <p className="font-medium">{tierData?.name}</p>
                      <p className="text-sm text-muted-foreground">{formatCurrency(tierData?.price || 0)}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Source</h4>
                      <p className="font-medium capitalize">{registrationData?.source || "Website"}</p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">School</h4>
                      <p className="font-medium">{registrationData?.school || "N/A"}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Grade</h4>
                      <p className="font-medium">{registrationData?.grade || "N/A"}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Weight Class</h4>
                      <p className="font-medium">{registrationData?.weightClass || "N/A"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="mr-2 h-5 w-5 text-primary" />
                    Emergency Contact
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Name</h4>
                      <p className="font-medium">{registrationData?.emergencyContactName || "N/A"}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Phone</h4>
                      <p className="font-medium">{registrationData?.emergencyContactPhone || "N/A"}</p>
                    </div>
                    <div className="md:col-span-2">
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Allergies</h4>
                      <p className="font-medium">{registrationData?.allergies || "None"}</p>
                    </div>
                    <div className="md:col-span-2">
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Special Requirements</h4>
                      <p className="font-medium">{registrationData?.specialRequirements || "None"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="communications">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Communication History</CardTitle>
                    <CardDescription>All emails and messages sent to this registrant</CardDescription>
                  </div>
                  <Button>
                    <Mail className="mr-2 h-4 w-4" />
                    Send Message
                  </Button>
                </CardHeader>
                <CardContent>
                  {isLoadingCommunications ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : communications?.data?.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No communications have been sent yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {communications?.data?.map((comm) => (
                        <div key={comm.id} className="flex gap-4 border-b pb-4">
                          <div className="flex-shrink-0 mt-1">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <Mail className="h-4 w-4 text-primary" />
                            </div>
                          </div>
                          <div className="flex-grow">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium">{comm.subject}</h4>
                              <div className="flex items-center text-muted-foreground text-sm">
                                <Clock className="h-3 w-3 mr-1" />
                                {formatDate(comm.sentAt)}
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              To: {registrationData?.email}
                            </p>
                            <p className="mt-2">{comm.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="documents">
              <Card>
                <CardHeader>
                  <CardTitle>Documents</CardTitle>
                  <CardDescription>Waiver, forms, and other documents</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No documents uploaded yet.</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="notes">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Notes & Activity</CardTitle>
                    <CardDescription>Notes and activity log for this registration</CardDescription>
                  </div>
                  <Button>Add Note</Button>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No notes have been added yet.</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Right Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full justify-start" onClick={handleSendConfirmation}>
                <Mail className="mr-2 h-4 w-4" />
                Send Confirmation Email
              </Button>
              
              <Button variant="outline" className="w-full justify-start">
                <Edit className="mr-2 h-4 w-4" />
                Edit Registration
              </Button>
              
              <Button variant="outline" className="w-full justify-start">
                <Download className="mr-2 h-4 w-4" />
                Download Registration PDF
              </Button>
              
              <Separator />
              
              <Button variant="destructive" className="w-full justify-start" onClick={() => setCancelDialogOpen(true)}>
                <XCircle className="mr-2 h-4 w-4" />
                Cancel Registration
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative pl-6 border-l space-y-6">
                <div className="relative">
                  <div className="absolute -left-[25px] h-4 w-4 rounded-full bg-primary"></div>
                  <div>
                    <p className="font-medium">Registration Created</p>
                    <p className="text-sm text-muted-foreground">{formatDate(registrationData?.createdAt)}</p>
                  </div>
                </div>
                
                {registrationData?.status === 'confirmed' && (
                  <div className="relative">
                    <div className="absolute -left-[25px] h-4 w-4 rounded-full bg-green-500"></div>
                    <div>
                      <p className="font-medium">Registration Confirmed</p>
                      <p className="text-sm text-muted-foreground">{formatDate(registrationData?.confirmedAt || registrationData?.updatedAt)}</p>
                    </div>
                  </div>
                )}
                
                {registrationData?.paymentStatus === 'paid' && (
                  <div className="relative">
                    <div className="absolute -left-[25px] h-4 w-4 rounded-full bg-blue-500"></div>
                    <div>
                      <p className="font-medium">Payment Received</p>
                      <p className="text-sm text-muted-foreground">{formatDate(registrationData?.paidAt || registrationData?.updatedAt)}</p>
                      <p className="text-sm">{formatCurrency(registrationData?.amount || 0)}</p>
                    </div>
                  </div>
                )}
                
                {communications?.data?.length > 0 && communications.data[0] && (
                  <div className="relative">
                    <div className="absolute -left-[25px] h-4 w-4 rounded-full bg-purple-500"></div>
                    <div>
                      <p className="font-medium">Confirmation Email Sent</p>
                      <p className="text-sm text-muted-foreground">{formatDate(communications.data[0].sentAt)}</p>
                    </div>
                  </div>
                )}
                
                {registrationData?.status === 'cancelled' && (
                  <div className="relative">
                    <div className="absolute -left-[25px] h-4 w-4 rounded-full bg-red-500"></div>
                    <div>
                      <p className="font-medium">Registration Cancelled</p>
                      <p className="text-sm text-muted-foreground">{formatDate(registrationData?.cancelledAt || registrationData?.updatedAt)}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default RegistrationDetails;