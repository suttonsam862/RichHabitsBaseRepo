import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle, 
  CardFooter
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Calendar, 
  MapPin, 
  Users, 
  DollarSign, 
  Briefcase,
  ShoppingBag, 
  Clock, 
  FileText, 
  Calendar as CalendarIcon,
  Plus,
  Search,
  Filter,
  ChevronRight,
  Info,
  CheckCircle2,
  Clock3,
  AlertCircle,
  BarChart3,
  LineChart,
  PieChart,
  Activity,
  Settings,
  X,
  Save
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

// Sample data for the page
const sampleCamps = [
  {
    id: 1,
    name: "Summer Wrestling Camp 2025",
    type: "Training Camp",
    clinician: "Coach John Smith",
    startDate: "2025-06-15",
    endDate: "2025-06-22",
    totalDays: 7,
    venue: "Mountain View Training Center",
    address: "123 Pine Road, Boulder, CO 80302",
    participants: 45,
    budget: 12500,
    staffCount: 8,
    vendorCount: 4,
    status: "upcoming",
    completionPercentage: 85,
    tasks: [
      { name: "Venue booking", status: "completed" },
      { name: "Staff assignments", status: "completed" },
      { name: "Equipment ordering", status: "in-progress" },
      { name: "Participant registrations", status: "in-progress" },
      { name: "Travel arrangements", status: "pending" }
    ]
  },
  {
    id: 2,
    name: "Spring Training Clinic",
    type: "Skills Clinic",
    clinician: "Coach Sarah Thompson",
    startDate: "2025-04-10",
    endDate: "2025-04-12",
    totalDays: 3,
    venue: "Lakeside Sports Complex",
    address: "456 Shore Drive, Tampa, FL 33601",
    participants: 30,
    budget: 5200,
    staffCount: 4,
    vendorCount: 2,
    status: "current",
    completionPercentage: 50,
    tasks: [
      { name: "Venue booking", status: "completed" },
      { name: "Staff assignments", status: "completed" },
      { name: "Equipment ordering", status: "completed" },
      { name: "Participant registrations", status: "completed" },
      { name: "Daily operations", status: "in-progress" }
    ]
  },
  {
    id: 3,
    name: "Winter Training Camp",
    type: "Elite Training",
    clinician: "Coach Robert Davis",
    startDate: "2025-01-05",
    endDate: "2025-01-10",
    totalDays: 5,
    venue: "Alpine Training Facility",
    address: "789 Mountain Road, Denver, CO 80205",
    participants: 25,
    budget: 8900,
    staffCount: 6,
    vendorCount: 3,
    status: "completed",
    completionPercentage: 100,
    tasks: [
      { name: "Venue booking", status: "completed" },
      { name: "Staff assignments", status: "completed" },
      { name: "Equipment ordering", status: "completed" },
      { name: "Participant registrations", status: "completed" },
      { name: "Camp execution", status: "completed" },
      { name: "Post-event reporting", status: "completed" }
    ]
  }
];

// Format date for display
const formatDate = (dateString: string) => {
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
};

// Get status badge color
const getStatusColor = (status: string) => {
  switch(status) {
    case 'upcoming':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    case 'current':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'completed':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  }
};

// Task status indicator
const TaskStatusIndicator = ({ status }: { status: string }) => {
  const getColor = () => {
    switch(status) {
      case 'completed':
        return 'bg-green-500';
      case 'in-progress':
        return 'bg-yellow-500';
      case 'pending':
        return 'bg-gray-300';
      default:
        return 'bg-gray-300';
    }
  };

  return (
    <div className="flex items-center">
      <div className={`h-3 w-3 rounded-full ${getColor()} mr-2`}></div>
      <span className="text-sm capitalize">{status}</span>
    </div>
  );
};

// Camp Details Component
const CampDetails = ({ camp }: { camp: any }) => {
  return (
    <div className="mt-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column - Camp Info */}
        <div className="flex-1 space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-brand-600" />
                Schedule Overview
              </CardTitle>
              <CardDescription>Camp duration and key dates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Start Date</h4>
                  <p className="font-medium">{formatDate(camp.startDate)}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">End Date</h4>
                  <p className="font-medium">{formatDate(camp.endDate)}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Duration</h4>
                  <p className="font-medium">{camp.totalDays} days</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Clinician</h4>
                  <p className="font-medium">{camp.clinician}</p>
                </div>
              </div>
              
              <Separator className="my-4" />
              
              <div className="flex justify-between mt-2">
                <Button variant="outline" size="sm" className="text-xs">
                  View Detailed Schedule
                </Button>
                <Button variant="outline" size="sm" className="text-xs">
                  Download Calendar
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-brand-600" />
                Venue Information
              </CardTitle>
              <CardDescription>Address and directions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-500">Venue Name</h4>
                <p className="font-medium">{camp.venue}</p>
              </div>
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-500">Address</h4>
                <p className="font-medium">{camp.address}</p>
              </div>
              
              {/* Map Placeholder */}
              <div className="h-40 mb-4 bg-gray-100 rounded-md flex items-center justify-center">
                <span className="text-gray-400">Interactive Map</span>
              </div>
              
              <div className="flex justify-between mt-2">
                <Button variant="outline" size="sm" className="text-xs">
                  Get Directions
                </Button>
                <Button variant="outline" size="sm" className="text-xs">
                  View Facilities
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Right Column - Additional Info */}
        <div className="flex-1 space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl flex items-center">
                <FileText className="h-5 w-5 mr-2 text-brand-600" />
                Camp Tasks & Checklist
              </CardTitle>
              <CardDescription>Track progress of camp preparation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Overall Completion</span>
                  <span className="text-sm font-medium">{camp.completionPercentage}%</span>
                </div>
                <Progress value={camp.completionPercentage} className="h-2" />
              </div>
              
              <div className="space-y-3">
                {camp.tasks.map((task: any, index: number) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm">{task.name}</span>
                    <TaskStatusIndicator status={task.status} />
                  </div>
                ))}
              </div>
              
              <div className="flex justify-end mt-4">
                <Button variant="outline" size="sm" className="text-xs">
                  View All Tasks
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Users className="h-5 w-5 mr-2 text-brand-600" />
                  Staffing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-1">{camp.staffCount}</div>
                <p className="text-sm text-gray-500">Staff members assigned</p>
                <Button variant="link" size="sm" className="p-0 h-auto mt-2">
                  View Staff Details <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <DollarSign className="h-5 w-5 mr-2 text-brand-600" />
                  Budget
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-1">${camp.budget.toLocaleString()}</div>
                <p className="text-sm text-gray-500">Total budget allocated</p>
                <Button variant="link" size="sm" className="p-0 h-auto mt-2">
                  View Financial Details <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Briefcase className="h-5 w-5 mr-2 text-brand-600" />
                  Participants
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-1">{camp.participants}</div>
                <p className="text-sm text-gray-500">Registered participants</p>
                <Button variant="link" size="sm" className="p-0 h-auto mt-2">
                  View Registrations <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <ShoppingBag className="h-5 w-5 mr-2 text-brand-600" />
                  Vendors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-1">{camp.vendorCount}</div>
                <p className="text-sm text-gray-500">Vendor relationships</p>
                <Button variant="link" size="sm" className="p-0 h-auto mt-2">
                  View Vendor Details <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

// New Camp Form Component
const AddCampForm = ({ onClose }: { onClose: () => void }) => {
  const form = useForm({
    defaultValues: {
      name: "",
      type: "",
      clinician: "",
      startDate: undefined,
      endDate: undefined,
      venue: "",
      address: "",
      budget: "",
      notes: "",
    },
  });

  const handleSubmit = (values: any) => {
    console.log("New Camp Data:", values);
    // In a real app, you would save the data to the server
    onClose();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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
            name="clinician"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lead Clinician</FormLabel>
                <FormControl>
                  <Input placeholder="Coach Name" {...field} />
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          
          <FormField
            control={form.control}
            name="budget"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Budget</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="10000" {...field} />
                </FormControl>
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
        
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Additional information about the camp"
                  className="min-h-[80px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
  
  // In a real app, you would fetch camps from the server
  const { data: camps = sampleCamps, isLoading } = useQuery({
    queryKey: ['/api/camps'],
    enabled: false, // Disabled for now as we're using sample data
  });
  
  // Filter camps based on search term and status
  const filteredCamps = camps.filter((camp: any) => {
    const matchesSearch = camp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         camp.venue.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || camp.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
            <DialogContent className="max-w-3xl">
              <DialogHeader>
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
                          <Button variant="ghost" size="sm">View</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
          
          {/* Selected Camp Details */}
          {selectedCamp && <CampDetails camp={selectedCamp} />}
        </TabsContent>
        
        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Timeline View</CardTitle>
              <CardDescription>
                View your camps in a timeline format
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center items-center h-[300px]">
              <div className="text-center">
                <p className="text-muted-foreground">Timeline view will be available soon</p>
                <Button variant="outline" className="mt-4">Return to List View</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="stats">
          <Card>
            <CardHeader>
              <CardTitle>Camp Statistics</CardTitle>
              <CardDescription>
                Analytics and statistics about your camps
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center items-center h-[300px]">
              <div className="text-center">
                <p className="text-muted-foreground">Statistics will be available soon</p>
                <Button variant="outline" className="mt-4">Return to List View</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}