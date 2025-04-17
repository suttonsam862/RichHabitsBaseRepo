import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { useParams } from "wouter/react";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  ArrowLeft, 
  Calendar, 
  Edit, 
  Trash2, 
  Clock, 
  Mail, 
  Phone, 
  MapPin,
  Send,
  Download,
  School,
  Weight,
  Shirt,
  AlarmClock,
  AlertTriangle,
  Ban
} from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
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
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useHasPermission } from "@/lib/permissions-helper";
import { PageHeader } from "@/components/page-header";

// Form validation schema
const communicationFormSchema = z.object({
  type: z.string().min(1, "Communication type is required"),
  subject: z.string().optional(),
  content: z.string().min(1, "Message content is required"),
});

// Form validation schema for editing registration
const registrationFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  tierId: z.coerce.number().int().positive("Please select a registration tier"),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  school: z.string().optional(),
  grade: z.string().optional(),
  weightClass: z.string().optional(),
  shirtSize: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  allergies: z.string().optional(),
  specialRequirements: z.string().optional(),
  notes: z.string().optional(),
  registrationStatus: z.string(),
  paymentStatus: z.string(),
  paymentAmount: z.coerce.number().optional(),
});

function RegistrationDetails() {
  const { id } = useParams();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("details");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCommunicationDialogOpen, setIsCommunicationDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const isAdmin = useHasPermission("MANAGE_EVENTS");
  
  // Get registration details
  const { data: registrationData, isLoading: isLoadingRegistration } = useQuery({
    queryKey: ["/api/registrations", id],
    enabled: !!id,
  });
  
  const registration = registrationData?.data;
  
  // Get camp details
  const { data: camp, isLoading: isLoadingCamp } = useQuery({
    queryKey: ["/api/camps", registration?.campId],
    enabled: !!registration?.campId,
  });
  
  // Get registration tiers
  const { data: tiers, isLoading: isLoadingTiers } = useQuery({
    queryKey: ["/api/camp", registration?.campId, "registration-tiers"],
    enabled: !!registration?.campId,
  });
  
  // Communication form
  const communicationForm = useForm({
    resolver: zodResolver(communicationFormSchema),
    defaultValues: {
      type: "email",
      subject: "",
      content: "",
    }
  });
  
  // Registration edit form
  const registrationForm = useForm({
    resolver: zodResolver(registrationFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      tierId: undefined,
      address: "",
      city: "",
      state: "",
      zipCode: "",
      dateOfBirth: "",
      gender: "",
      school: "",
      grade: "",
      weightClass: "",
      shirtSize: "",
      emergencyContactName: "",
      emergencyContactPhone: "",
      allergies: "",
      specialRequirements: "",
      notes: "",
      registrationStatus: "confirmed",
      paymentStatus: "pending",
      paymentAmount: undefined,
    }
  });
  
  // Set edit form values when dialog opens
  React.useEffect(() => {
    if (isEditDialogOpen && registration) {
      registrationForm.reset({
        firstName: registration.firstName,
        lastName: registration.lastName,
        email: registration.email,
        phone: registration.phone || "",
        tierId: registration.tierId,
        address: registration.address || "",
        city: registration.city || "",
        state: registration.state || "",
        zipCode: registration.zipCode || "",
        dateOfBirth: registration.dateOfBirth || "",
        gender: registration.gender || "",
        school: registration.school || "",
        grade: registration.grade || "",
        weightClass: registration.weightClass || "",
        shirtSize: registration.shirtSize || "",
        emergencyContactName: registration.emergencyContactName || "",
        emergencyContactPhone: registration.emergencyContactPhone || "",
        allergies: registration.allergies || "",
        specialRequirements: registration.specialRequirements || "",
        notes: registration.notes || "",
        registrationStatus: registration.registrationStatus,
        paymentStatus: registration.paymentStatus,
        paymentAmount: registration.paymentAmount,
      });
    }
  }, [isEditDialogOpen, registration, registrationForm]);
  
  // Send communication mutation
  const sendCommunicationMutation = useMutation({
    mutationFn: async (data) => {
      const response = await apiRequest(
        "POST", 
        `/api/registrations/${id}/communications`,
        data
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Communication logged",
        description: "The communication has been logged successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/registrations", id] });
      setIsCommunicationDialogOpen(false);
      communicationForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Error sending communication",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Update registration mutation
  const updateRegistrationMutation = useMutation({
    mutationFn: async (data) => {
      const response = await apiRequest(
        "PUT", 
        `/api/registrations/${id}`,
        data
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Registration updated",
        description: "The registration has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/registrations", id] });
      queryClient.invalidateQueries({ 
        queryKey: ["/api/camp", registration?.campId, "registrations"] 
      });
      setIsEditDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error updating registration",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Delete registration mutation
  const deleteRegistrationMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(
        "DELETE", 
        `/api/registrations/${id}`
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Registration deleted",
        description: "The registration has been deleted successfully.",
      });
      queryClient.invalidateQueries({ 
        queryKey: ["/api/camp", registration?.campId, "registrations"] 
      });
      setIsDeleteDialogOpen(false);
      // Redirect to registration management
      setLocation(`/events/registration/${registration?.campId}`);
    },
    onError: (error) => {
      toast({
        title: "Error deleting registration",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle communication form submission
  const onSubmitCommunication = (data) => {
    sendCommunicationMutation.mutate({
      ...data,
      registrationId: Number(id),
      status: "sent", // For manually logged communications, mark as sent
    });
  };
  
  // Handle registration edit form submission
  const onSubmitEdit = (data) => {
    updateRegistrationMutation.mutate(data);
  };
  
  // Format status badges
  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">Pending</Badge>;
      case 'confirmed':
        return <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Confirmed</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  // Format payment status badges
  const getPaymentBadge = (status) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">Pending</Badge>;
      case 'paid':
        return <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Paid</Badge>;
      case 'refunded':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">Refunded</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  // Format communication type badges
  const getCommunicationTypeBadge = (type) => {
    switch (type) {
      case 'email':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"><Mail className="h-3 w-3 mr-1" /> Email</Badge>;
      case 'sms':
        return <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"><Phone className="h-3 w-3 mr-1" /> SMS</Badge>;
      case 'phone':
        return <Badge variant="outline" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"><Phone className="h-3 w-3 mr-1" /> Phone</Badge>;
      case 'system':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300">System</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };
  
  // Format communication status badges
  const getCommunicationStatusBadge = (status) => {
    switch (status) {
      case 'sent':
        return <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Sent</Badge>;
      case 'failed':
        return <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">Failed</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  // Loading state
  if (isLoadingRegistration || isLoadingCamp) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!registration && !isLoadingRegistration) {
    return (
      <div className="flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-2">Registration Not Found</h1>
        <p className="text-muted-foreground mb-4">The registration you're looking for doesn't exist.</p>
        <Button asChild>
          <Link href="/events/overview">Back to Camps</Link>
        </Button>
      </div>
    );
  }
  
  // Find tier name
  const tierName = tiers?.data?.find(t => t.id === registration.tierId)?.name || "Unknown Tier";
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <PageHeader
          title={`${registration.firstName} ${registration.lastName}`}
          description="Registration Details"
        />
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/events/registration/${registration.campId}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Registrations
            </Link>
          </Button>
          {isAdmin && (
            <Button 
              variant="outline" 
              className="text-destructive hover:text-destructive"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          )}
          <Button onClick={() => setIsEditDialogOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Registration Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {getStatusBadge(registration.registrationStatus)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Registered on {formatDate(registration.createdAt)}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Payment Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {getPaymentBadge(registration.paymentStatus)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {registration.paymentStatus === 'paid' && registration.paymentDate
                ? `Paid on ${formatDate(registration.paymentDate)}`
                : `Amount: ${formatCurrency(registration.paymentAmount || 0)}`}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Registration Tier</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{tierName}</div>
            <p className="text-sm text-muted-foreground mt-1">
              Source: <span className="capitalize">{registration.source || 'manual'}</span>
              {registration.shopifyOrderId && (
                <> (Shopify Order #{registration.shopifyOrderId})</>
              )}
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="details">Registration Details</TabsTrigger>
          <TabsTrigger value="communications">Communications</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                <div className="flex items-start gap-2">
                  <Mail className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">{registration.email}</p>
                  </div>
                </div>
                
                {registration.phone && (
                  <div className="flex items-start gap-2">
                    <Phone className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Phone</p>
                      <p className="text-sm text-muted-foreground">{registration.phone}</p>
                    </div>
                  </div>
                )}
                
                {(registration.address || registration.city || registration.state) && (
                  <div className="flex items-start gap-2 col-span-2">
                    <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Address</p>
                      <p className="text-sm text-muted-foreground">
                        {registration.address && <>{registration.address}<br /></>}
                        {registration.city && <>{registration.city}, </>}
                        {registration.state && <>{registration.state} </>}
                        {registration.zipCode && <>{registration.zipCode}</>}
                      </p>
                    </div>
                  </div>
                )}
                
                {(registration.emergencyContactName || registration.emergencyContactPhone) && (
                  <div className="flex items-start gap-2 col-span-2">
                    <AlarmClock className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Emergency Contact</p>
                      <p className="text-sm text-muted-foreground">
                        {registration.emergencyContactName && <>{registration.emergencyContactName}</>}
                        {registration.emergencyContactPhone && <> - {registration.emergencyContactPhone}</>}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Participant Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                {registration.dateOfBirth && (
                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Date of Birth</p>
                      <p className="text-sm text-muted-foreground">{registration.dateOfBirth}</p>
                    </div>
                  </div>
                )}
                
                {registration.gender && (
                  <div className="flex items-start gap-2">
                    <div>
                      <p className="font-medium">Gender</p>
                      <p className="text-sm text-muted-foreground capitalize">{registration.gender}</p>
                    </div>
                  </div>
                )}
                
                {registration.school && (
                  <div className="flex items-start gap-2">
                    <School className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">School</p>
                      <p className="text-sm text-muted-foreground">{registration.school}</p>
                    </div>
                  </div>
                )}
                
                {registration.grade && (
                  <div className="flex items-start gap-2">
                    <div>
                      <p className="font-medium">Grade</p>
                      <p className="text-sm text-muted-foreground">{registration.grade}</p>
                    </div>
                  </div>
                )}
                
                {registration.weightClass && (
                  <div className="flex items-start gap-2">
                    <Weight className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Weight Class</p>
                      <p className="text-sm text-muted-foreground">{registration.weightClass}</p>
                    </div>
                  </div>
                )}
                
                {registration.shirtSize && (
                  <div className="flex items-start gap-2">
                    <Shirt className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Shirt Size</p>
                      <p className="text-sm text-muted-foreground">{registration.shirtSize}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {(registration.allergies || registration.specialRequirements) && (
            <Card>
              <CardHeader>
                <CardTitle>Health Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {registration.allergies && (
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 mt-0.5 text-amber-600" />
                    <div>
                      <p className="font-medium">Allergies</p>
                      <p className="text-sm text-muted-foreground">{registration.allergies}</p>
                    </div>
                  </div>
                )}
                
                {registration.specialRequirements && (
                  <div className="flex items-start gap-2">
                    <div>
                      <p className="font-medium">Special Requirements</p>
                      <p className="text-sm text-muted-foreground">{registration.specialRequirements}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          
          {registration.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Administrative Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{registration.notes}</p>
              </CardContent>
            </Card>
          )}
          
          {(registration.checkInDate || registration.checkOutDate) && (
            <Card>
              <CardHeader>
                <CardTitle>Check-In Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                  {registration.checkInDate && (
                    <div className="flex items-start gap-2">
                      <div>
                        <p className="font-medium">Checked In</p>
                        <p className="text-sm text-muted-foreground">{formatDate(registration.checkInDate)}</p>
                      </div>
                    </div>
                  )}
                  
                  {registration.checkOutDate && (
                    <div className="flex items-start gap-2">
                      <div>
                        <p className="font-medium">Checked Out</p>
                        <p className="text-sm text-muted-foreground">{formatDate(registration.checkOutDate)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="communications" className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Communication History</h2>
            <Button onClick={() => setIsCommunicationDialogOpen(true)}>
              <Send className="mr-2 h-4 w-4" />
              Log Communication
            </Button>
          </div>
          
          {registration.communications?.length > 0 ? (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Content</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {registration.communications.map((comm) => (
                      <TableRow key={comm.id}>
                        <TableCell>{formatDate(comm.communicationDate || comm.createdAt)}</TableCell>
                        <TableCell>{getCommunicationTypeBadge(comm.type)}</TableCell>
                        <TableCell>{comm.subject || "-"}</TableCell>
                        <TableCell className="max-w-md">
                          <div className="truncate">{comm.content}</div>
                        </TableCell>
                        <TableCell>{getCommunicationStatusBadge(comm.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <Card className="p-8 flex flex-col items-center justify-center">
              <p className="text-muted-foreground mb-4">No communications have been logged for this registration.</p>
              <Button onClick={() => setIsCommunicationDialogOpen(true)}>
                <Send className="mr-2 h-4 w-4" />
                Log Communication
              </Button>
            </Card>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Log Communication Dialog */}
      <Dialog open={isCommunicationDialogOpen} onOpenChange={setIsCommunicationDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Log Communication</DialogTitle>
            <DialogDescription>
              Record a communication with the participant or guardian.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...communicationForm}>
            <form onSubmit={communicationForm.handleSubmit(onSubmitCommunication)} className="space-y-4">
              <FormField
                control={communicationForm.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Communication Type*</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="sms">SMS</SelectItem>
                        <SelectItem value="phone">Phone Call</SelectItem>
                        <SelectItem value="system">System Message</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={communicationForm.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Email subject or brief summary"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={communicationForm.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content*</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter the message content or call summary"
                        className="min-h-[150px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCommunicationDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={sendCommunicationMutation.isPending}
                >
                  {sendCommunicationMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Log Communication
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Edit Registration Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Registration</DialogTitle>
            <DialogDescription>
              Update the registration details.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...registrationForm}>
            <form onSubmit={registrationForm.handleSubmit(onSubmitEdit)} className="space-y-6">
              {/* Registration Tier Selection */}
              <FormField
                control={registrationForm.control}
                name="tierId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Registration Tier*</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(parseInt(value));
                        // Auto-fill payment amount based on tier price
                        const selectedTier = tiers?.data?.find(tier => tier.id === parseInt(value));
                        if (selectedTier) {
                          registrationForm.setValue("paymentAmount", selectedTier.price);
                        }
                      }}
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a registration tier" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {tiers?.data?.map((tier) => (
                          <SelectItem key={tier.id} value={tier.id.toString()}>
                            {tier.name} - ${tier.price}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={registrationForm.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name*</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={registrationForm.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name*</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={registrationForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email*</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={registrationForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Status Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={registrationForm.control}
                  name="registrationStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Registration Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="confirmed">Confirmed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={registrationForm.control}
                  name="paymentStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select payment status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                          <SelectItem value="refunded">Refunded</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={registrationForm.control}
                  name="paymentAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Amount</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Other Fields */}
              <Separator />
              <h3 className="text-lg font-medium">Additional Information</h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={registrationForm.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Birth</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={registrationForm.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                            <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={registrationForm.control}
                    name="school"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>School</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={registrationForm.control}
                    name="grade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Grade</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={registrationForm.control}
                    name="weightClass"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Weight Class</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={registrationForm.control}
                    name="shirtSize"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Shirt Size</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select shirt size" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="XS">XS</SelectItem>
                            <SelectItem value="S">S</SelectItem>
                            <SelectItem value="M">M</SelectItem>
                            <SelectItem value="L">L</SelectItem>
                            <SelectItem value="XL">XL</SelectItem>
                            <SelectItem value="XXL">XXL</SelectItem>
                            <SelectItem value="XXXL">XXXL</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={registrationForm.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Street Address</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <FormField
                    control={registrationForm.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={registrationForm.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={registrationForm.control}
                    name="zipCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Zip Code</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={registrationForm.control}
                    name="emergencyContactName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Emergency Contact Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={registrationForm.control}
                    name="emergencyContactPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Emergency Contact Phone</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={registrationForm.control}
                  name="allergies"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Allergies</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="List any allergies or 'None' if none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={registrationForm.control}
                  name="specialRequirements"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Special Requirements</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="List any special requirements, dietary restrictions, etc."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={registrationForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Administrative Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add any internal notes about this registration"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateRegistrationMutation.isPending}
                >
                  {updateRegistrationMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Update Registration
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Delete Registration</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this registration? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800 font-medium">Warning: This will permanently delete:</p>
            <ul className="text-sm text-red-800 list-disc pl-4 mt-2">
              <li>Registration information for {registration.firstName} {registration.lastName}</li>
              <li>All communication history</li>
              <li>Any attached files or waivers</li>
            </ul>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteRegistrationMutation.isPending}
              onClick={() => deleteRegistrationMutation.mutate()}
            >
              {deleteRegistrationMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete Registration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default RegistrationDetails;