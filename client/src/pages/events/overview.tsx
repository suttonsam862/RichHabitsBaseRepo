import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { format, addDays, differenceInDays } from 'date-fns';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { cn } from '@/lib/utils';

// Icons
import { CalendarIcon, ChevronRight, Filter, Search, Plus, X, Users, MapPin, DollarSign, Clock, CheckCircle, Calendar, UserCheck, Loader2 } from 'lucide-react';

// Sample data for development
const sampleCamps = [
  {
    id: 1,
    name: "Summer Volleyball Camp",
    type: "training",
    clinician: "John Smith",
    startDate: "2025-07-15",
    endDate: "2025-07-20",
    totalDays: 6,
    venue: "Beach City Sports Complex",
    address: "123 Beach Ave, Miami, FL 33139",
    participants: 45,
    campCost: 350,
    selloutCost: 17500,
    staffCount: 5,
    vendorCount: 2,
    status: "upcoming",
    completionPercentage: 0,
    schedule: null,
    tasks: [
      { name: "Secure facility", status: "completed" },
      { name: "Arrange staff travel", status: "in-progress" },
      { name: "Order equipment", status: "not-started" },
    ],
    staffAssignments: [],
    vendorAssignments: [],
  },
  {
    id: 2,
    name: "Elite Basketball Training",
    type: "elite",
    clinician: "Michael Johnson",
    startDate: "2025-06-10",
    endDate: "2025-06-14",
    totalDays: 5,
    venue: "Downtown Arena",
    address: "500 Arena Way, Dallas, TX 75201",
    participants: 30,
    campCost: 500,
    selloutCost: 15000,
    staffCount: 6,
    vendorCount: 3,
    status: "upcoming",
    completionPercentage: 0,
    schedule: null,
    tasks: [],
    staffAssignments: [],
    vendorAssignments: [],
  },
  {
    id: 3,
    name: "Youth Soccer Development",
    type: "youth",
    clinician: "Sarah Williams",
    startDate: "2025-08-05",
    endDate: "2025-08-10",
    totalDays: 6,
    venue: "Community Fields",
    address: "789 Park Lane, Chicago, IL 60007",
    participants: 50,
    campCost: 250,
    selloutCost: 12500,
    staffCount: 8,
    vendorCount: 1,
    status: "upcoming",
    completionPercentage: 0,
    schedule: null,
    tasks: [],
    staffAssignments: [],
    vendorAssignments: [],
  },
];

// Helper function to format dates
const formatDate = (dateString: string) => {
  try {
    return format(new Date(dateString), 'MMM d, yyyy');
  } catch (e) {
    return dateString;
  }
};

// Helper function to get status badge color
const getStatusColor = (status: string) => {
  switch (status) {
    case 'upcoming':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    case 'current':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300';
    case 'completed':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'cancelled':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

// EditCampDialog Component
const EditCampDialog = ({ camp, isOpen, onClose, onSave }: { camp: any, isOpen: boolean, onClose: () => void, onSave: (updatedCamp: any) => void }) => {
  const form = useForm({
    defaultValues: {
      name: camp.name,
      type: camp.type,
      clinician: camp.clinician,
      startDate: camp.startDate,
      endDate: camp.endDate,
      venue: camp.venue,
      address: camp.address,
      budget: camp.budget?.toString() || "",
      notes: camp.notes || "",
      status: camp.status,
    },
  });

  const handleSubmit = (values: any) => {
    const updatedCamp = {
      ...camp,
      name: values.name,
      type: values.type,
      clinician: values.clinician,
      startDate: values.startDate,
      endDate: values.endDate,
      venue: values.venue,
      address: values.address,
      budget: parseFloat(values.budget),
      notes: values.notes,
      status: values.status,
    };
    
    console.log("Updated Camp Data:", updatedCamp);
    // In a real app, you would update the server
    onSave(updatedCamp);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Camp</DialogTitle>
          <DialogDescription>
            Update the details for {camp.name}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Camp Name</label>
              <Input 
                {...form.register("name")}
                className="mt-1"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Type</label>
              <Select 
                value={form.watch("type")}
                onValueChange={(value) => form.setValue("type", value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="training">Training Camp</SelectItem>
                  <SelectItem value="skills">Skills Clinic</SelectItem>
                  <SelectItem value="elite">Elite Training</SelectItem>
                  <SelectItem value="youth">Youth Camp</SelectItem>
                  <SelectItem value="competition">Competition</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Start Date</label>
              <Input 
                type="date"
                {...form.register("startDate")}
                className="mt-1"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">End Date</label>
              <Input 
                type="date"
                {...form.register("endDate")}
                className="mt-1"
              />
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium">Lead Clinician</label>
            <Input 
              {...form.register("clinician")}
              className="mt-1"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">Venue</label>
            <Input 
              {...form.register("venue")}
              className="mt-1"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">Address</label>
            <Input 
              {...form.register("address")}
              className="mt-1"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">Budget</label>
            <Input 
              type="number"
              {...form.register("budget")}
              className="mt-1"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">Status</label>
            <Select 
              value={form.watch("status")}
              onValueChange={(value) => form.setValue("status", value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="current">Current</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium">Notes</label>
            <Textarea
              {...form.register("notes")}
              className="mt-1"
              rows={3}
            />
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// New Camp Form Component
const AddCampForm = ({ onClose }: { onClose: () => void }) => {
  const [selectedTab, setSelectedTab] = useState("details");
  const [clinicianSearchTerm, setClinicianSearchTerm] = useState("");
  const [selectedStaff, setSelectedStaff] = useState<any[]>([]);
  // Add state to track staff rates separately to avoid creating hooks in map function
  const [staffRates, setStaffRates] = useState<Record<number, number>>({});
  
  // Function to update a staff member's rate
  const updateStaffRate = (staffId: number, newRate: string | number) => {
    const rateValue = typeof newRate === 'string' ? parseFloat(newRate) : newRate;
    setStaffRates(prev => ({
      ...prev,
      [staffId]: rateValue
    }));
    
    // Update the staff object with the new rate
    setSelectedStaff(prev => 
      prev.map(s => 
        s.id === staffId ? {...s, campRate: rateValue} : s
      )
    );
  };
  
  // Fetch staff/clinicians from server
  const { 
    data: staffData = [], 
    isLoading: staffLoading,
    error: staffError
  } = useQuery({
    queryKey: ['/api/staff'],
    queryFn: async () => {
      const response = await fetch('/api/staff');
      if (!response.ok) throw new Error('Failed to fetch staff data');
      const data = await response.json();
      
      // Map staff from API to include rate and rateType properties
      return (data.data || []).map((staff: any) => ({
        ...staff,
        rate: staff.payRate || 0,
        rateType: staff.payType || 'day',
        avatar: '' // Add empty avatar since UI expects it
      }));
    },
  });
  
  const form = useForm({
    defaultValues: {
      name: "",
      type: "",
      startDate: undefined,
      endDate: undefined,
      venue: "",
      address: "",
      participants: "",
      campCost: "",
      notes: "",
    },
  });

  const handleSubmit = (values: any) => {
    // Add the selected staff IDs to the submitted data
    const campData = {
      ...values,
      initialStaffIds: selectedStaff.map(staff => staff.id)
    };
    
    console.log("New Camp Data:", campData);
    
    // Submit the camp data to the server
    fetch('/api/camps', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(campData),
    })
    .then(response => {
      if (!response.ok) throw new Error('Failed to create camp');
      return response.json();
    })
    .then(newCamp => {
      console.log('Camp created successfully:', newCamp);
      onClose();
    })
    .catch(error => {
      console.error('Error creating camp:', error);
    });
  };
  
  // Function to add a clinician to selected staff
  const addClinician = (staff: any) => {
    if (!selectedStaff.some(s => s.id === staff.id)) {
      setSelectedStaff([...selectedStaff, staff]);
      // Initialize rate in our staffRates state
      setStaffRates(prev => ({
        ...prev,
        [staff.id]: staff.rate
      }));
    }
    setClinicianSearchTerm("");
  };
  
  // Function to remove a clinician from selected staff
  const removeClinician = (staffId: number) => {
    setSelectedStaff(selectedStaff.filter(s => s.id !== staffId));
    // Also remove from our staffRates state
    setStaffRates(prev => {
      const newRates = {...prev};
      delete newRates[staffId];
      return newRates;
    });
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        {/* Form Tabs for navigating different sections */}
        <Tabs defaultValue="details" value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="details">Camp Details</TabsTrigger>
            <TabsTrigger value="staff">Staff</TabsTrigger>
            <TabsTrigger value="finances">Finances</TabsTrigger>
          </TabsList>
          
          {/* Camp Details Tab */}
          <TabsContent value="details" className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Camp Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Summer Training Camp 2025" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Camp Type</FormLabel>
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
                        <SelectItem value="training">Training Camp</SelectItem>
                        <SelectItem value="skills">Skills Clinic</SelectItem>
                        <SelectItem value="elite">Elite Training</SelectItem>
                        <SelectItem value="competition">Competition Prep</SelectItem>
                        <SelectItem value="youth">Youth Camp</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="venue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Venue Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Training Center Name" {...field} />
                    </FormControl>
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
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(new Date(field.value), "PPP")
                            ) : (
                              <span>Select date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={field.value ? new Date(field.value) : undefined}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date(new Date().setHours(0, 0, 0, 0))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(new Date(field.value), "PPP")
                            ) : (
                              <span>Select date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={field.value ? new Date(field.value) : undefined}
                          onSelect={field.onChange}
                          disabled={(date) => {
                            const startDate = form.getValues("startDate");
                            return startDate 
                              ? date < new Date(startDate) 
                              : date < new Date(new Date().setHours(0, 0, 0, 0));
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Venue Address</FormLabel>
                  <FormControl>
                    <Input placeholder="Full address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>
          
          {/* Staff Tab */}
          <TabsContent value="staff" className="space-y-4">
            {/* Selected Clinicians Section */}
            <div className="bg-gray-50 p-4 rounded-md mb-4">
              <h3 className="text-lg font-medium mb-2">Selected Clinicians</h3>
              {selectedStaff.length === 0 ? (
                <p className="text-gray-500 italic">No clinicians selected yet. Use the search below to add clinicians.</p>
              ) : (
                <div className="space-y-2">
                  {selectedStaff.map(staff => {
                    // Use the staffRates state instead of creating a new useState
                    const currentRate = staffRates[staff.id] !== undefined ? staffRates[staff.id] : staff.rate;
                    
                    return (
                      <div key={staff.id} className="flex items-center justify-between bg-white p-3 rounded border">
                        <div className="flex items-center flex-grow">
                          <Avatar className="h-10 w-10 mr-3">
                            <AvatarImage src={staff.avatar} />
                            <AvatarFallback>
                              {staff.name.split(' ').map((n: string) => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-grow">
                            <div className="font-medium">{staff.name}</div>
                            <div className="text-xs text-gray-500">{staff.role}</div>
                          </div>
                        </div>
                        
                        {/* Camp Rate Input */}
                        <div className="flex items-center mr-4">
                          <div className="flex flex-col">
                            <Label htmlFor={`rate-${staff.id}`} className="text-xs mb-1">Camp Rate</Label>
                            <div className="flex items-center">
                              <span className="text-sm mr-1">$</span>
                              <Input 
                                id={`rate-${staff.id}`}
                                type="number" 
                                className="w-20 h-8 text-sm"
                                value={currentRate}
                                onChange={(e) => {
                                  const newRate = parseFloat(e.target.value);
                                  updateStaffRate(staff.id, newRate);
                                }}
                              />
                              <span className="text-xs text-gray-500 ml-1">/{staff.rateType}</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Remove Button */}
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => removeClinician(staff.id)}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            {/* Clinician Search Section */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-base font-medium">Search for Clinicians</Label>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    // Clear the search and show all available staff
                    setClinicianSearchTerm("");
                  }}
                >
                  Show All Staff
                </Button>
              </div>
              
              <div className="flex gap-2">
                <div className="relative flex-grow">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Search by name, role, or specialty"
                    className="pl-8"
                    value={clinicianSearchTerm}
                    onChange={(e) => setClinicianSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              {/* Search Results with Improved UI */}
              <div className="mt-2 border rounded-md divide-y max-h-[300px] overflow-y-auto bg-white">
                {staffLoading ? (
                  <div className="flex items-center justify-center p-4">
                    <span className="loading loading-spinner loading-sm mr-2"></span>
                    Loading staff...
                  </div>
                ) : staffData
                    .filter(staff => 
                      clinicianSearchTerm.length === 0 || // Show all if search is empty
                      staff.name.toLowerCase().includes(clinicianSearchTerm.toLowerCase()) ||
                      staff.role.toLowerCase().includes(clinicianSearchTerm.toLowerCase())
                    )
                    .filter(staff => !selectedStaff.some(s => s.id === staff.id))
                    .length === 0 ? (
                    <div className="p-4 text-gray-500 text-center">
                      No matching staff found or all staff already selected
                    </div>
                  ) : (
                    staffData
                      .filter(staff => 
                        clinicianSearchTerm.length === 0 || // Show all if search is empty
                        staff.name.toLowerCase().includes(clinicianSearchTerm.toLowerCase()) ||
                        staff.role.toLowerCase().includes(clinicianSearchTerm.toLowerCase())
                      )
                      .filter(staff => !selectedStaff.some(s => s.id === staff.id))
                      .map(staff => (
                        <div 
                          key={staff.id}
                          className="flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer"
                          onClick={() => addClinician(staff)}
                        >
                          <div className="flex items-center">
                            <Avatar className="h-10 w-10 mr-3">
                              <AvatarImage src={staff.avatar} />
                              <AvatarFallback>
                                {staff.name.split(' ').map((n: string) => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{staff.name}</div>
                              <div className="text-sm text-gray-600">{staff.role}</div>
                              <div className="text-xs text-gray-500">Standard Rate: ${staff.rate}/{staff.rateType}</div>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" className="ml-4">
                            <Plus className="h-4 w-4 mr-1" /> Add
                          </Button>
                        </div>
                      ))
                  )}
              </div>
            </div>
          </TabsContent>
          
          {/* Finances Tab */}
          <TabsContent value="finances" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="participants"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Participants</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="50" {...field} />
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
                    <FormLabel>Cost per Participant ($)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="200" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div>
              <Label>Sellout Revenue</Label>
              <div className="bg-gray-50 p-3 rounded-md text-lg font-medium mt-1">
                ${(() => {
                  const participants = form.watch("participants") || 0;
                  const campCost = form.watch("campCost") || 0;
                  return (parseFloat(participants.toString()) * parseFloat(campCost.toString())).toFixed(2);
                })()}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Calculated based on number of participants multiplied by cost per participant
              </p>
            </div>
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Financial Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Additional financial information about the camp"
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Create Camp</Button>
        </DialogFooter>
      </form>
    </Form>
  );
};

export default function CampOverview() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedCamp, setSelectedCamp] = useState<any>(sampleCamps[0]);
  const [isAddCampOpen, setIsAddCampOpen] = useState(false);
  const [isTasksDialogOpen, setIsTasksDialogOpen] = useState(false);
  const [isEditCampOpen, setIsEditCampOpen] = useState(false);
  const [isDeleteCampOpen, setIsDeleteCampOpen] = useState(false);
  const [campData, setCampData] = useState(sampleCamps);
  const [clinicianSearchTerm, setClinicianSearchTerm] = useState("");
  const [selectedClinicians, setSelectedClinicians] = useState<any[]>([]);
  
  // In a real app, you would fetch camps from the server
  const { data: camps = campData, isLoading } = useQuery({
    queryKey: ['/api/camps'],
    enabled: false, // Disabled for now as we're using sample data
  });
  
  // Filter camps based on search term and status
  const filteredCamps = Array.isArray(camps) ? camps.filter((camp: any) => {
    const matchesSearch = camp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          camp.venue.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || camp.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) : [];
  
  const handleEditCamp = (updatedCamp: any) => {
    // Update the camp data
    const updatedCamps = campData.map(camp => 
      camp.id === updatedCamp.id ? updatedCamp : camp
    );
    setCampData(updatedCamps);
    setSelectedCamp(updatedCamp);
    
    // In a real app, you would also update the server
    console.log("Updated camp data:", updatedCamp);
  };
  
  const handleDeleteCamp = () => {
    // Remove the camp from data
    const updatedCamps = campData.filter(camp => camp.id !== selectedCamp.id);
    setCampData(updatedCamps);
    
    // Select a new camp if available, otherwise clear selection
    setSelectedCamp(updatedCamps.length > 0 ? updatedCamps[0] : null);
    setIsDeleteCampOpen(false);
    
    // In a real app, you would also delete from the server
    console.log("Deleted camp:", selectedCamp);
  };

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Camp Overview</h1>
          <p className="text-gray-500 mt-1">Manage all your camp operations in one place</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Dialog open={isAddCampOpen} onOpenChange={setIsAddCampOpen}>
            <DialogTrigger asChild>
              <Button className="bg-brand-600 hover:bg-brand-700">
                <Plus className="mr-2 h-4 w-4" />
                Add New Camp
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-6">
              <DialogHeader className="sticky top-0 bg-white z-10 pb-3 pt-0">
                <DialogTitle>Create New Camp</DialogTitle>
                <DialogDescription>
                  Fill in the details to create a new camp or event.
                </DialogDescription>
              </DialogHeader>
              <AddCampForm onClose={() => setIsAddCampOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      {/* Filters Row */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-grow md:max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search camps..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="upcoming">Upcoming</SelectItem>
            <SelectItem value="current">Current</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
        
        <Button variant="outline" className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          More Filters
        </Button>
        
        <Button variant="outline" className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4" />
          Calendar View
        </Button>
      </div>

      {/* Main Content with Tabs */}
      <Tabs defaultValue="list" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="timeline">Timeline View</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="list" className="space-y-4">
          {/* Camps List */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-medium">Camp Name</th>
                      <th className="text-left p-4 font-medium">Type</th>
                      <th className="text-left p-4 font-medium">Dates</th>
                      <th className="text-left p-4 font-medium">Venue</th>
                      <th className="text-left p-4 font-medium">Participants</th>
                      <th className="text-left p-4 font-medium">Status</th>
                      <th className="text-right p-4 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCamps.map((camp: any) => (
                      <tr 
                        key={camp.id} 
                        className="border-b hover:bg-gray-50 cursor-pointer"
                        onClick={() => setSelectedCamp(camp)}
                      >
                        <td className="p-4">
                          <div className="font-medium">{camp.name}</div>
                          <div className="text-sm text-gray-500">by {camp.clinician}</div>
                        </td>
                        <td className="p-4">{camp.type}</td>
                        <td className="p-4">
                          <div>{formatDate(camp.startDate)}</div>
                          <div className="text-sm text-gray-500">to {formatDate(camp.endDate)}</div>
                        </td>
                        <td className="p-4">
                          <div>{camp.venue}</div>
                        </td>
                        <td className="p-4">{camp.participants}</td>
                        <td className="p-4">
                          <Badge className={getStatusColor(camp.status)}>
                            {camp.status.charAt(0).toUpperCase() + camp.status.slice(1)}
                          </Badge>
                        </td>
                        <td className="p-4 text-right">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCamp(camp);
                              setIsEditCampOpen(true);
                            }}
                          >
                            Edit
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
          
          {/* Selected Camp Details */}
          {selectedCamp && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              {/* Left Column: Basic Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex justify-between items-start">
                    <div>
                      <span className="block text-xl">{selectedCamp.name}</span>
                      <Badge className={`${getStatusColor(selectedCamp.status)} mt-2`}>
                        {selectedCamp.status.charAt(0).toUpperCase() + selectedCamp.status.slice(1)}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setIsEditCampOpen(true)}>
                        Edit
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => setIsDeleteCampOpen(true)}>
                        Delete
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-2">
                    <Calendar className="h-5 w-5 text-gray-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium">Dates</div>
                      <div className="text-sm text-gray-600">
                        {formatDate(selectedCamp.startDate)} - {formatDate(selectedCamp.endDate)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {selectedCamp.totalDays} days
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <MapPin className="h-5 w-5 text-gray-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium">Location</div>
                      <div className="text-sm text-gray-600">{selectedCamp.venue}</div>
                      <div className="text-sm text-gray-600">{selectedCamp.address}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <UserCheck className="h-5 w-5 text-gray-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium">Lead Clinician</div>
                      <div className="text-sm text-gray-600">{selectedCamp.clinician}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <Users className="h-5 w-5 text-gray-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium">Participants</div>
                      <div className="text-sm text-gray-600">
                        {selectedCamp.participants} expected 
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <DollarSign className="h-5 w-5 text-gray-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium">Financial</div>
                      <div className="text-sm text-gray-600">
                        ${selectedCamp.campCost} per participant
                      </div>
                      <div className="text-sm text-gray-600">
                        ${selectedCamp.selloutCost} sellout revenue
                      </div>
                    </div>
                  </div>
                  
                  {selectedCamp.notes && (
                    <div className="border-t pt-4 mt-4">
                      <div className="font-medium mb-1">Notes</div>
                      <div className="text-sm text-gray-600">{selectedCamp.notes}</div>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Middle Column: Staff & Personnel */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span>Staff & Personnel</span>
                    <Button variant="outline" size="sm">Manage Staff</Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-sm font-medium">Assigned Staff</h3>
                      <Badge>{selectedCamp.staffCount}</Badge>
                    </div>
                    {selectedCamp.staffCount > 0 ? (
                      <div className="space-y-2">
                        {/* Placeholder for sample staff - in a real app, you'd map through actual staff */}
                        <div className="flex items-center border p-2 rounded">
                          <Avatar className="h-8 w-8 mr-2">
                            <AvatarFallback>JS</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="text-sm font-medium">John Smith</div>
                            <div className="text-xs text-gray-500">Head Coach</div>
                          </div>
                          <Badge className="ml-auto">Lead</Badge>
                        </div>
                        
                        <div className="flex items-center border p-2 rounded">
                          <Avatar className="h-8 w-8 mr-2">
                            <AvatarFallback>SJ</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="text-sm font-medium">Sarah Johnson</div>
                            <div className="text-xs text-gray-500">Assistant Coach</div>
                          </div>
                        </div>
                        
                        <Button variant="outline" size="sm" className="w-full mt-2">
                          View All Staff
                        </Button>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 italic">No staff assigned yet</div>
                    )}
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-sm font-medium">Vendors & Services</h3>
                      <Badge>{selectedCamp.vendorCount}</Badge>
                    </div>
                    {selectedCamp.vendorCount > 0 ? (
                      <div className="space-y-2">
                        {/* Placeholder for sample vendors - in a real app, you'd map through actual vendors */}
                        <div className="flex items-center border p-2 rounded">
                          <div>
                            <div className="text-sm font-medium">Equipment Rental Co.</div>
                            <div className="text-xs text-gray-500">Sports Equipment</div>
                          </div>
                          <div className="ml-auto text-sm">$1,200</div>
                        </div>
                        
                        <div className="flex items-center border p-2 rounded">
                          <div>
                            <div className="text-sm font-medium">Meal Catering Inc.</div>
                            <div className="text-xs text-gray-500">Food Service</div>
                          </div>
                          <div className="ml-auto text-sm">$3,500</div>
                        </div>
                        
                        <Button variant="outline" size="sm" className="w-full mt-2">
                          View All Vendors
                        </Button>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 italic">No vendors assigned yet</div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              {/* Right Column: Tasks & Schedule */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span>Tasks & Schedule</span>
                    <div className="space-x-2">
                      <Button variant="outline" size="sm" onClick={() => setIsTasksDialogOpen(true)}>Manage Tasks</Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-sm font-medium">Tasks</h3>
                      <div className="text-sm text-gray-500">
                        {selectedCamp.tasks?.filter((t: any) => t.status === "completed").length || 0}/
                        {selectedCamp.tasks?.length || 0} completed
                      </div>
                    </div>
                    
                    {selectedCamp.tasks && selectedCamp.tasks.length > 0 ? (
                      <div className="space-y-2">
                        {selectedCamp.tasks.map((task: any, index: number) => (
                          <div key={index} className="flex items-center border p-2 rounded">
                            <div className={`h-5 w-5 rounded-full mr-2 ${
                              task.status === "completed" ? "bg-green-500" :
                              task.status === "in-progress" ? "bg-amber-500" : "bg-gray-300"
                            }`} />
                            <div className="text-sm">{task.name}</div>
                            <Badge variant="outline" className="ml-auto">
                              {task.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 italic">No tasks created yet</div>
                    )}
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-sm font-medium">Camp Schedule</h3>
                      <Button variant="outline" size="sm">View Schedule</Button>
                    </div>
                    {selectedCamp.schedule ? (
                      <div className="space-y-2">
                        {/* Schedule content would go here */}
                        <div className="text-sm">Schedule available</div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-4">
                        <Calendar className="h-10 w-10 text-gray-300 mb-2" />
                        <div className="text-sm text-gray-500">No schedule created yet</div>
                        <Button variant="default" size="sm" className="mt-2">
                          Create Schedule
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Camp Timeline</CardTitle>
              <CardDescription>View all your camps in a timeline format</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                Timeline view is under development
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="stats" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Camp Statistics</CardTitle>
              <CardDescription>Overview of all your camps and events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                Statistics view is under development
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Confirm Delete Dialog */}
      <Dialog open={isDeleteCampOpen} onOpenChange={setIsDeleteCampOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the camp "{selectedCamp?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteCampOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteCamp}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Camp Dialog */}
      {selectedCamp && (
        <EditCampDialog 
          camp={selectedCamp} 
          isOpen={isEditCampOpen} 
          onClose={() => setIsEditCampOpen(false)} 
          onSave={handleEditCamp}
        />
      )}
    </div>
  );
}