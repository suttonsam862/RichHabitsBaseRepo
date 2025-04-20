import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Calendar, MapPin, ArrowLeft, Users, DollarSign, Plus, X, UserCheck } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

// Camp form schema
const campFormSchema = z.object({
  name: z.string().min(1, "Camp name is required"),
  location: z.string().optional(),
  sportType: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.string().optional(),
  description: z.string().optional(),
  participants: z.string().optional(),
  campCost: z.string().optional(),
  selloutCost: z.string().optional(),
  registrations: z.string().optional(),
  avgCost: z.string().optional(),
  totalPaid: z.string().optional(),
  notes: z.string().optional(),
  contactName: z.string().optional(),
  contactEmail: z.string().optional(),
  contactPhone: z.string().optional(),
  // Add array of initial staff IDs for new camp creation
  initialStaffIds: z.array(z.number()).optional(),
});

// Ensure the form defaults cover the needed fields
export type CampFormValues = z.infer<typeof campFormSchema>;

export default function CampDetailPage() {
  const params = useParams();
  const id = params.id;
  const isNewCamp = id === "new";
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("details");
  // Track selected staff IDs for new camp creation
  const [selectedStaff, setSelectedStaff] = useState<any[]>([]);
  const [staffDialogOpen, setStaffDialogOpen] = useState(false);
  
  // Update form field with selected staff IDs
  useEffect(() => {
    if (isNewCamp && selectedStaff.length > 0) {
      const staffIds = selectedStaff.map(staff => staff.id);
      form.setValue('initialStaffIds', staffIds);
    }
  }, [selectedStaff, isNewCamp]);

  // Fetch camp data if editing an existing camp
  const {
    data: campResponse,
    isLoading: isLoadingCamp,
    error: campError,
  } = useQuery({
    queryKey: ["/api/camps", id],
    enabled: !isNewCamp,
  });
  
  // Extract the camp object from the API response
  const camp = campResponse?.data;
  
  // Fetch available staff for selection
  const {
    data: staffData,
    isLoading: isLoadingStaff,
  } = useQuery({
    queryKey: ["/api/staff"],
  });
  
  // Extract the staff array from the API response
  const availableStaff = staffData?.data || [];
  
  // Fetch staff assigned to this camp
  const {
    data: campStaffData,
    isLoading: isLoadingCampStaff,
    refetch: refetchCampStaff,
  } = useQuery({
    queryKey: ["/api/camps", id, "staff"],
    enabled: !isNewCamp,
  });
  
  // Extract the camp staff array from the API response
  const campStaff = campStaffData?.data || [];

  // Initialize form with default values or existing camp data
  const form = useForm<CampFormValues>({
    resolver: zodResolver(campFormSchema),
    defaultValues: {
      name: "",
      location: "",
      sportType: "",
      startDate: "",
      endDate: "",
      status: "upcoming",
      description: "",
      participants: "",
      campCost: "",
      selloutCost: "",
      registrations: "0",
      avgCost: "",
      totalPaid: "0",
      notes: "",
      contactName: "",
      contactEmail: "",
      contactPhone: "",
    },
  });

  // Update form values when camp data is loaded
  useEffect(() => {
    // Add debug logging to check what data we're receiving
    console.log("Camp data received:", campResponse);
    console.log("Extracted camp data:", camp);
    
    if (camp) {
      const startDate = camp.startDate 
        ? new Date(camp.startDate).toISOString().split('T')[0]
        : '';
        
      const endDate = camp.endDate
        ? new Date(camp.endDate).toISOString().split('T')[0]
        : '';
        
      // Format numerical values to string for the form
      const participants = camp.participants?.toString() || '';
      const campCost = camp.campCost?.toString() || '';
      const selloutCost = camp.selloutCost?.toString() || '';
      const registrations = camp.registrations?.toString() || '0';
      const avgCost = camp.avgCost?.toString() || '';
      const totalPaid = camp.totalPaid?.toString() || '0';
      
      console.log("Attempting to populate form with:", {
        name: camp.name || "",
        location: camp.venue || "", // Note: API has venue but form has location
        sportType: camp.type || "", // Note: API has type but form has sportType
        startDate,
        endDate,
        status: camp.status || "upcoming",
        description: camp.description || "",
      });
      
      form.reset({
        name: camp.name || "",
        location: camp.venue || "", // Changed to match API field name
        sportType: camp.type || "", // Changed to match API field name
        startDate,
        endDate,
        status: camp.status || "upcoming",
        description: camp.description || "",
        participants,
        campCost,
        selloutCost,
        registrations,
        avgCost,
        totalPaid,
        notes: camp.notes || "",
        contactName: camp.contactName || "",
        contactEmail: camp.contactEmail || "",
        contactPhone: camp.contactPhone || "",
      });
    }
  }, [camp, form, campResponse]);

  // Create new camp mutation
  const createCampMutation = useMutation({
    mutationFn: async (values: CampFormValues) => {
      const response = await fetch("/api/camps", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create camp");
      }

      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Camp created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/camps"] });
      navigate(`/events/camp/${data.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update existing camp mutation
  const updateCampMutation = useMutation({
    mutationFn: async (values: CampFormValues) => {
      const response = await fetch(`/api/camps/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update camp");
      }

      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Camp updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/camps", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/camps"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Mutation to add staff to the camp
  const addStaffToCampMutation = useMutation({
    mutationFn: async (staffId: number) => {
      const response = await fetch(`/api/camps/${id}/staff`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ staffId, action: 'add' }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add staff to camp");
      }

      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Staff member added to camp",
      });
      refetchCampStaff();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Mutation to remove staff from the camp
  const removeStaffFromCampMutation = useMutation({
    mutationFn: async (staffId: number) => {
      const response = await fetch(`/api/camps/${id}/staff`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ staffId, action: 'remove' }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to remove staff from camp");
      }

      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Staff member removed from camp",
      });
      refetchCampStaff();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (values: CampFormValues) => {
    if (isNewCamp) {
      createCampMutation.mutate(values);
    } else {
      updateCampMutation.mutate(values);
    }
  };

  // Auto-calculate sellout cost when participants or camp cost changes
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'participants' || name === 'campCost') {
        const participants = parseFloat(value.participants || '0');
        const campCost = parseFloat(value.campCost || '0');
        
        if (!isNaN(participants) && !isNaN(campCost)) {
          const selloutCost = (participants * campCost).toString();
          form.setValue('selloutCost', selloutCost);
        }
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form]);

  // Format currency for display
  const formatCurrency = (value: string | undefined) => {
    if (!value) return '$0';
    const num = parseFloat(value);
    return isNaN(num) ? '$0' : `$${num.toLocaleString('en-US')}`;
  };

  // Loading state
  if (!isNewCamp && isLoadingCamp) {
    return (
      <div className="container mx-auto py-10 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Error state
  if (!isNewCamp && campError) {
    return (
      <div className="container mx-auto py-10">
        <Button variant="outline" onClick={() => navigate("/events/camps")} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Camps
        </Button>
        <Card>
          <CardHeader className="bg-destructive text-destructive-foreground">
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <p>Failed to load camp details: {campError instanceof Error ? campError.message : "Unknown error"}</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => navigate("/events/camps")}>Return to Camp List</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center mb-6">
        <Button variant="outline" onClick={() => navigate("/events/camps")} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <h1 className="text-3xl font-bold">
          {isNewCamp ? "Create New Camp" : camp?.name || "Camp Details"}
        </h1>
        {!isNewCamp && camp?.status && (
          <Badge variant="outline" className="ml-3">
            {camp.status}
          </Badge>
        )}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="details">Basic Details</TabsTrigger>
              <TabsTrigger value="financial">Financial</TabsTrigger>
              <TabsTrigger value="staff">Staff & Clinicians</TabsTrigger>
              <TabsTrigger value="contact">Contact Information</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>

            <TabsContent value="details">
              <Card>
                <CardHeader>
                  <CardTitle>Camp Details</CardTitle>
                  <CardDescription>
                    Basic information about the camp
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Camp Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter camp name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location</FormLabel>
                          <FormControl>
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                              <Input placeholder="Enter location" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="sportType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sport Type</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select sport type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="baseball">Baseball</SelectItem>
                              <SelectItem value="basketball">Basketball</SelectItem>
                              <SelectItem value="football">Football</SelectItem>
                              <SelectItem value="soccer">Soccer</SelectItem>
                              <SelectItem value="volleyball">Volleyball</SelectItem>
                              <SelectItem value="wrestling">Wrestling</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Date</FormLabel>
                          <FormControl>
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                              <Input type="date" placeholder="Select start date" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Date</FormLabel>
                          <FormControl>
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                              <Input type="date" placeholder="Select end date" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
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
                            <SelectItem value="upcoming">Upcoming</SelectItem>
                            <SelectItem value="scheduled">Scheduled</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="in-progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter camp description"
                            className="min-h-[120px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="financial">
              <Card>
                <CardHeader>
                  <CardTitle>Financial Information</CardTitle>
                  <CardDescription>
                    Manage participant numbers and financial projections
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="participants"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Maximum Participants</FormLabel>
                          <FormControl>
                            <div className="flex items-center">
                              <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                              <Input type="number" placeholder="Enter maximum participants" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="campCost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cost Per Participant</FormLabel>
                          <FormControl>
                            <div className="flex items-center">
                              <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                              <Input type="number" placeholder="Enter cost per participant" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="p-4 bg-muted rounded-lg mb-4">
                    <div className="font-semibold mb-2">Sellout Revenue Potential</div>
                    <div className="text-2xl font-bold mb-2">
                      {formatCurrency(form.watch('selloutCost'))}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Maximum revenue potential based on {form.watch('participants') || '0'} participants 
                      at {formatCurrency(form.watch('campCost'))} each
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <FormField
                    control={form.control}
                    name="selloutCost"
                    render={({ field }) => (
                      <FormItem className="hidden">
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="registrations"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Registrations</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Enter current registrations"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="avgCost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Average Cost Per Registration</FormLabel>
                          <FormControl>
                            <div className="flex items-center">
                              <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                              <Input
                                type="number"
                                placeholder="Enter average cost"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="totalPaid"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Total Paid Amount</FormLabel>
                          <FormControl>
                            <div className="flex items-center">
                              <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                              <Input
                                type="number"
                                placeholder="Enter total paid"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <div className="font-semibold mb-1">Estimated Revenue</div>
                      <div className="text-xl font-bold">
                        {formatCurrency(
                          (parseFloat(form.watch('registrations') || '0') * 
                          parseFloat(form.watch('avgCost') || '0')).toString()
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Based on current registrations and average cost
                      </div>
                    </div>

                    <div className="p-4 bg-muted/50 rounded-lg">
                      <div className="font-semibold mb-1">Actual Revenue</div>
                      <div className="text-xl font-bold">
                        {formatCurrency(form.watch('totalPaid'))}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Total confirmed payments received
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="staff">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Staff & Clinicians</CardTitle>
                    <CardDescription>
                      Manage staff assigned to this camp
                    </CardDescription>
                  </div>
                  <Dialog open={staffDialogOpen} onOpenChange={setStaffDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="flex items-center gap-1">
                        <Plus className="h-4 w-4" /> Add Clinician
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Clinician to Camp</DialogTitle>
                      </DialogHeader>
                      <div className="py-4">
                        <h3 className="mb-4 text-sm font-medium">Select a clinician to add:</h3>
                        <ScrollArea className="h-[300px]">
                          {isLoadingStaff ? (
                            <div className="flex justify-center p-4">
                              <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            </div>
                          ) : availableStaff.length === 0 ? (
                            <div className="p-4 text-center text-muted-foreground">
                              No staff members available
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {availableStaff
                                .filter(staff => isNewCamp 
                                  ? !selectedStaff.some(s => s.id === staff.id) 
                                  : !campStaff.some(cs => cs.id === staff.id)
                                )
                                .map(staff => (
                                  <div 
                                    key={staff.id} 
                                    className="flex items-center justify-between p-3 rounded-md hover:bg-muted"
                                  >
                                    <div className="flex items-center gap-3">
                                      <Avatar>
                                        <AvatarFallback>{staff.name ? staff.name.charAt(0) : '?'}</AvatarFallback>
                                      </Avatar>
                                      <div>
                                        <p className="font-medium">{staff.name}</p>
                                        <p className="text-sm text-muted-foreground">{staff.role || 'Clinician'}</p>
                                      </div>
                                    </div>
                                    <Button 
                                      size="sm" 
                                      onClick={() => {
                                        if (isNewCamp) {
                                          setSelectedStaff(prev => [...prev, staff]);
                                        } else {
                                          addStaffToCampMutation.mutate(staff.id);
                                        }
                                        setStaffDialogOpen(false);
                                      }}
                                    >
                                      <Plus className="h-4 w-4 mr-1" /> Add
                                    </Button>
                                  </div>
                                ))}
                            </div>
                          )}
                        </ScrollArea>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  {isNewCamp ? (
                    selectedStaff.length > 0 ? (
                      <div className="space-y-3">
                        <p className="text-sm text-muted-foreground mb-2">
                          Selected clinicians will be added when the camp is created:
                        </p>
                        {selectedStaff.map(staff => (
                          <div 
                            key={staff.id} 
                            className="flex items-center justify-between p-3 border rounded-md"
                          >
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarFallback>{staff.name ? staff.name.charAt(0) : '?'}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{staff.name}</p>
                                <p className="text-sm text-muted-foreground">{staff.role || 'Clinician'}</p>
                              </div>
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setSelectedStaff(prev => prev.filter(s => s.id !== staff.id));
                              }}
                            >
                              <X className="h-4 w-4 mr-1" /> Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center p-6 border rounded-md">
                        <UserCheck className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                        <h3 className="text-lg font-medium mb-1">No Clinicians Selected</h3>
                        <p className="text-muted-foreground mb-4">
                          Click the "Add Clinician" button to select clinicians for this camp
                        </p>
                        <Button 
                          onClick={() => setStaffDialogOpen(true)}
                          className="flex items-center gap-1"
                        >
                          <Plus className="h-4 w-4" /> Add Clinician
                        </Button>
                      </div>
                    )
                  ) : isLoadingCampStaff ? (
                    <div className="flex justify-center p-6">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : campStaff.length === 0 ? (
                    <div className="text-center p-6 border rounded-md">
                      <UserCheck className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                      <h3 className="text-lg font-medium mb-1">No Staff Assigned</h3>
                      <p className="text-muted-foreground mb-4">
                        Click the "Add Clinician" button to assign staff to this camp
                      </p>
                      <Button 
                        onClick={() => setStaffDialogOpen(true)}
                        className="flex items-center gap-1"
                      >
                        <Plus className="h-4 w-4" /> Add Clinician
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {campStaff.map(staff => (
                        <div 
                          key={staff.id} 
                          className="flex items-center justify-between p-3 border rounded-md"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback>{staff.name ? staff.name.charAt(0) : '?'}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{staff.name}</p>
                              <p className="text-sm text-muted-foreground">{staff.role || 'Clinician'}</p>
                            </div>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              if (confirm(`Remove ${staff.name} from this camp?`)) {
                                removeStaffFromCampMutation.mutate(staff.id);
                              }
                            }}
                          >
                            <X className="h-4 w-4 mr-1" /> Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="contact">
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                  <CardDescription>
                    Primary contact information for this camp
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="contactName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter contact name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="contactEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Email</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="Enter contact email"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="contactPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Phone</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter contact phone"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notes">
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                  <CardDescription>
                    Additional information about this camp
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea
                            placeholder="Enter notes about this camp"
                            className="min-h-[200px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end mt-6 gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/events/camps")}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isLoadingCamp ||
                createCampMutation.isPending ||
                updateCampMutation.isPending
              }
            >
              {(createCampMutation.isPending || updateCampMutation.isPending) && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {isNewCamp ? "Create Camp" : "Save Changes"}
            </Button>
          </div>
        </form>
      </Form>

      {!isNewCamp && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center"
              onClick={() => navigate(`/events/camp/${id}/schedule`)}
            >
              <Calendar className="h-5 w-5 mb-2" />
              <span>Manage Schedule</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center"
              onClick={() => navigate(`/events/camp/${id}/staff`)}
            >
              <Users className="h-5 w-5 mb-2" />
              <span>Staff Assignments</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center"
              onClick={() => navigate(`/events/camp/${id}/tasks`)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 mb-2">
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
              </svg>
              <span>Task Management</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}