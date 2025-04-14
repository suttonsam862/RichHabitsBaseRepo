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
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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

// Schedule Details Dialog Component
const ScheduleDetailsDialog = ({ camp, isOpen, onClose }: { camp: any, isOpen: boolean, onClose: () => void }) => {
  const [scheduleItems, setScheduleItems] = useState([
    { id: 1, day: 1, startTime: '08:00', endTime: '10:00', activity: 'Check-in & Registration', location: 'Main Entrance', notes: 'Staff needed: 3' },
    { id: 2, day: 1, startTime: '10:30', endTime: '12:00', activity: 'Opening Ceremony', location: 'Main Hall', notes: 'All staff and participants required' },
    { id: 3, day: 1, startTime: '13:00', endTime: '15:00', activity: 'Session 1: Fundamentals', location: 'Training Area A', notes: 'Equipment needed: mats, projector' },
    { id: 4, day: 1, startTime: '15:30', endTime: '17:00', activity: 'Session 2: Technique Development', location: 'Training Area B', notes: 'Divide into skill level groups' },
    { id: 5, day: 2, startTime: '08:30', endTime: '10:00', activity: 'Morning Conditioning', location: 'Outdoor Field', notes: 'Weather dependent; indoor backup ready' },
    { id: 6, day: 2, startTime: '10:30', endTime: '12:30', activity: 'Session 3: Advanced Techniques', location: 'Training Area A', notes: 'Video recording scheduled' },
  ]);
  
  const [newItem, setNewItem] = useState({
    day: 1,
    startTime: '09:00',
    endTime: '10:00',
    activity: '',
    location: '',
    notes: ''
  });
  
  const [editingDay, setEditingDay] = useState<number | null>(null);
  
  const handleAddItem = () => {
    if (!newItem.activity.trim()) return;
    
    setScheduleItems([
      ...scheduleItems,
      { 
        id: Math.max(0, ...scheduleItems.map(item => item.id)) + 1,
        ...newItem
      }
    ]);
    
    // Reset form
    setNewItem({
      day: newItem.day,
      startTime: '09:00',
      endTime: '10:00',
      activity: '',
      location: '',
      notes: ''
    });
  };
  
  const handleDeleteItem = (id: number) => {
    setScheduleItems(scheduleItems.filter(item => item.id !== id));
  };
  
  const handleSave = () => {
    // In a real app, you would update the server
    console.log("Saving updated schedule:", scheduleItems);
    onClose();
  };
  
  // Group schedule items by day
  const groupedByDay = scheduleItems.reduce((acc, item) => {
    if (!acc[item.day]) {
      acc[item.day] = [];
    }
    acc[item.day].push(item);
    return acc;
  }, {} as Record<number, typeof scheduleItems>);
  
  // Get array of unique days
  const days = Object.keys(groupedByDay).map(Number).sort((a, b) => a - b);
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader className="sticky top-0 bg-white z-10 pb-3 pt-0">
          <DialogTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Detailed Camp Schedule
          </DialogTitle>
          <DialogDescription>
            Manage the daily schedule and activities for {camp.name}
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4 space-y-6 overflow-y-auto">
          <Tabs defaultValue={days[0]?.toString() || "1"} className="mt-2">
            <div className="flex justify-between items-center mb-4 sticky top-16 bg-white z-10 pb-2">
              <TabsList className="overflow-x-auto flex-wrap">
                {days.map(day => (
                  <TabsTrigger key={day} value={day.toString()}>
                    Day {day}
                  </TabsTrigger>
                ))}
                {/* Add day button */}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="ml-2 h-9"
                  onClick={() => {
                    const newDay = Math.max(...days) + 1;
                    setNewItem({...newItem, day: newDay});
                    setEditingDay(newDay);
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Day
                </Button>
              </TabsList>
            </div>
            
            {days.map(day => (
              <TabsContent key={day} value={day.toString()} className="space-y-4 pt-2">
                <div className="border rounded-md overflow-hidden">
                  <div className="grid grid-cols-12 border-b bg-muted p-3 font-medium sticky top-28 z-10">
                    <div className="col-span-2">Time</div>
                    <div className="col-span-3">Activity</div>
                    <div className="col-span-2">Location</div>
                    <div className="col-span-4">Notes</div>
                    <div className="col-span-1 text-right">Actions</div>
                  </div>
                  
                  <div className="divide-y max-h-[40vh] overflow-y-auto">
                    {groupedByDay[day]?.sort((a, b) => a.startTime.localeCompare(b.startTime)).map((item) => (
                      <div key={item.id} className="grid grid-cols-12 p-3 items-center">
                        <div className="col-span-2 text-sm">
                          {item.startTime} - {item.endTime}
                        </div>
                        <div className="col-span-3 font-medium">{item.activity}</div>
                        <div className="col-span-2 text-sm">{item.location}</div>
                        <div className="col-span-4 text-sm text-gray-500">{item.notes}</div>
                        <div className="col-span-1 flex justify-end">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDeleteItem(item.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    {(!groupedByDay[day] || groupedByDay[day].length === 0) && (
                      <div className="p-4 text-center text-muted-foreground">
                        No activities scheduled for Day {day}. Add an activity below.
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Add schedule item form */}
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-md">Add New Activity for Day {day}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                      <div className="md:col-span-2">
                        <label className="text-sm font-medium">Time:</label>
                        <div className="grid grid-cols-2 gap-2 mt-1">
                          <Input
                            type="time"
                            value={newItem.startTime}
                            onChange={(e) => setNewItem({...newItem, startTime: e.target.value})}
                            className="text-xs"
                          />
                          <Input
                            type="time"
                            value={newItem.endTime}
                            onChange={(e) => setNewItem({...newItem, endTime: e.target.value})}
                            className="text-xs"
                          />
                        </div>
                      </div>
                      <div className="md:col-span-3">
                        <label className="text-sm font-medium">Activity:</label>
                        <Input
                          value={newItem.activity}
                          onChange={(e) => setNewItem({...newItem, activity: e.target.value})}
                          placeholder="Activity name"
                          className="mt-1"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-sm font-medium">Location:</label>
                        <Input
                          value={newItem.location}
                          onChange={(e) => setNewItem({...newItem, location: e.target.value})}
                          placeholder="Location"
                          className="mt-1"
                        />
                      </div>
                      <div className="md:col-span-4">
                        <label className="text-sm font-medium">Notes:</label>
                        <Input
                          value={newItem.notes}
                          onChange={(e) => setNewItem({...newItem, notes: e.target.value})}
                          placeholder="Additional information"
                          className="mt-1"
                        />
                      </div>
                      <div className="md:col-span-1 flex items-end">
                        <Button 
                          onClick={() => {
                            setNewItem({...newItem, day: day});
                            handleAddItem();
                          }}
                          className="w-full"
                        >
                          Add
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </div>
        
        <DialogFooter className="sticky bottom-0 bg-white pt-4 mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Schedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Camp Details Component
const CampDetails = ({ camp }: { camp: any }) => {
  const [isTasksDialogOpen, setIsTasksDialogOpen] = useState(false);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  
  return (
    <div className="mt-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column - Camp Info */}
        <div className="flex-1 space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-brand-600" />
                Schedule Overviews
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
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs"
                  onClick={() => setIsScheduleDialogOpen(true)}
                >
                  View Detailed Schedule
                </Button>
                <Button variant="outline" size="sm" className="text-xs">
                  Download Calendar
                </Button>
              </div>
              
              {isScheduleDialogOpen && (
                <ScheduleDetailsDialog
                  camp={camp}
                  isOpen={isScheduleDialogOpen}
                  onClose={() => setIsScheduleDialogOpen(false)}
                />
              )}
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
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs"
                  onClick={() => setIsTasksDialogOpen(true)}
                >
                  View All Tasks
                </Button>
              </div>
              
              {isTasksDialogOpen && (
                <TasksDialog
                  camp={camp}
                  isOpen={isTasksDialogOpen}
                  onClose={() => setIsTasksDialogOpen(false)}
                />
              )}
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

// Tasks Dialog Component
const TasksDialog = ({ camp, isOpen, onClose }: { camp: any, isOpen: boolean, onClose: () => void }) => {
  const [tasks, setTasks] = useState(camp.tasks);
  const [newTask, setNewTask] = useState("");
  
  const handleAddTask = () => {
    if (!newTask.trim()) return;
    setTasks([...tasks, { name: newTask, status: "pending" }]);
    setNewTask("");
  };
  
  const handleChangeStatus = (index: number, status: string) => {
    const updatedTasks = [...tasks];
    updatedTasks[index] = { ...updatedTasks[index], status };
    setTasks(updatedTasks);
  };
  
  const handleDeleteTask = (index: number) => {
    const updatedTasks = [...tasks];
    updatedTasks.splice(index, 1);
    setTasks(updatedTasks);
  };
  
  const handleSave = () => {
    // In a real app, you would update the server
    console.log("Saving updated tasks:", tasks);
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Camp Tasks & Checklist
          </DialogTitle>
          <DialogDescription>
            Manage and track progress of tasks for {camp.name}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 my-4">
          <div className="flex items-center space-x-2">
            <Input 
              placeholder="Add a new task..."
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddTask();
              }}
            />
            <Button type="button" onClick={handleAddTask}>
              Add Task
            </Button>
          </div>
          
          <div className="border rounded-md">
            <div className="grid grid-cols-5 border-b bg-muted p-3 font-medium">
              <div className="col-span-2">Task</div>
              <div className="col-span-2">Status</div>
              <div className="text-right">Actions</div>
            </div>
            
            <div className="divide-y">
              {tasks.map((task: any, index: number) => (
                <div key={index} className="grid grid-cols-5 p-3 items-center">
                  <div className="col-span-2">{task.name}</div>
                  <div className="col-span-2">
                    <Select 
                      defaultValue={task.status}
                      onValueChange={(value) => handleChangeStatus(index, value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">
                          <div className="flex items-center">
                            <div className="h-2 w-2 rounded-full bg-gray-300 mr-2"></div>
                            Pending
                          </div>
                        </SelectItem>
                        <SelectItem value="in-progress">
                          <div className="flex items-center">
                            <div className="h-2 w-2 rounded-full bg-yellow-500 mr-2"></div>
                            In Progress
                          </div>
                        </SelectItem>
                        <SelectItem value="completed">
                          <div className="flex items-center">
                            <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                            Completed
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDeleteTask(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              
              {tasks.length === 0 && (
                <div className="p-4 text-center text-muted-foreground">
                  No tasks added yet. Add a task to get started.
                </div>
              )}
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <div>
              <span className="text-sm font-medium">Overall Completion: </span>
              <span className="text-sm">
                {Math.round((tasks.filter((t: any) => t.status === "completed").length / tasks.length) * 100 || 0)}%
              </span>
            </div>
            <Progress 
              value={Math.round((tasks.filter((t: any) => t.status === "completed").length / tasks.length) * 100 || 0)} 
              className="h-2 w-1/2" 
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
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
      budget: camp.budget.toString(),
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
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Edit Camp</DialogTitle>
          <DialogDescription>
            Update the details for {camp.name}
          </DialogDescription>
        </DialogHeader>
        
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
                              : false;
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
                      <SelectItem value="upcoming">
                        <div className="flex items-center">
                          <div className="h-2 w-2 rounded-full bg-blue-500 mr-2"></div>
                          Upcoming
                        </div>
                      </SelectItem>
                      <SelectItem value="current">
                        <div className="flex items-center">
                          <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                          Current
                        </div>
                      </SelectItem>
                      <SelectItem value="completed">
                        <div className="flex items-center">
                          <div className="h-2 w-2 rounded-full bg-gray-400 mr-2"></div>
                          Completed
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
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
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

// DeleteCampDialog Component
const DeleteCampDialog = ({ camp, isOpen, onClose, onDelete }: { camp: any, isOpen: boolean, onClose: () => void, onDelete: () => void }) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Delete Camp
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{camp.name}"? This action cannot be undone and will remove all associated data.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground">
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
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
          {selectedCamp && <CampDetails camp={selectedCamp} />}
        </TabsContent>
        
        <TabsContent value="timeline">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Timeline View</CardTitle>
                <CardDescription>
                  View your camps in a timeline format
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Calendar className="h-4 w-4 mr-2" /> 
                  Month
                </Button>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" /> 
                  Filter
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="p-4 space-y-8">
                {/* Timeline header */}
                <div className="flex items-center gap-2 mb-6">
                  <Button variant="outline" size="sm">
                    <ChevronRight className="h-4 w-4 rotate-180" />
                  </Button>
                  <h3 className="text-lg font-medium">2025</h3>
                  <Button variant="outline" size="sm">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Timeline visualization */}
                <div className="space-y-12">
                  {/* Q1 */}
                  <div>
                    <h4 className="text-md font-medium mb-4">Q1 (Jan - Mar)</h4>
                    <div className="relative">
                      <div className="absolute left-0 right-0 h-1 bg-gray-100 top-8"></div>
                      
                      {/* Months labels */}
                      <div className="relative grid grid-cols-3 mb-6">
                        <div className="text-center text-sm text-gray-500">January</div>
                        <div className="text-center text-sm text-gray-500">February</div>
                        <div className="text-center text-sm text-gray-500">March</div>
                      </div>
                      
                      {/* Events */}
                      <div className="relative h-24 mb-6">
                        {campData
                          .filter(camp => {
                            const startDate = new Date(camp.startDate);
                            return startDate.getMonth() >= 0 && startDate.getMonth() <= 2; // Jan-Mar (0-2)
                          })
                          .map(camp => {
                            const startDate = new Date(camp.startDate);
                            const endDate = new Date(camp.endDate);
                            
                            // Calculate position and width
                            const monthPercentage = 100 / 3; // 3 months per quarter
                            const startMonth = startDate.getMonth() % 3; // 0-2 within the quarter
                            const startDay = startDate.getDate();
                            const daysInMonth = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0).getDate();
                            
                            // Position based on month and day
                            const leftPosition = (startMonth * monthPercentage) + 
                              ((startDay / daysInMonth) * monthPercentage);
                            
                            // Width based on duration (days)
                            const campDuration = camp.totalDays;
                            const daysIn90Days = 90; // Approximate days in a quarter
                            const widthPercentage = (campDuration / daysIn90Days) * 100;
                            
                            // Color based on status
                            const bgColor = 
                              camp.status === 'upcoming' ? 'bg-blue-50 border-blue-200' :
                              camp.status === 'current' ? 'bg-green-50 border-green-200' :
                              'bg-gray-50 border-gray-200';
                            
                            return (
                              <div 
                                key={camp.id}
                                className={`absolute top-0 h-16 rounded-md ${bgColor} p-2 cursor-pointer`}
                                style={{ 
                                  left: `${leftPosition}%`,
                                  width: `${widthPercentage}%`,
                                  minWidth: '80px'
                                }}
                                onClick={() => setSelectedCamp(camp)}
                              >
                                <div className="font-medium text-sm truncate">{camp.name}</div>
                                <div className="text-xs text-gray-500">
                                  {format(startDate, "MMM d")} - {format(endDate, "MMM d")}
                                </div>
                              </div>
                            );
                          })}
                        {campData.filter(camp => {
                          const startDate = new Date(camp.startDate);
                          return startDate.getMonth() >= 0 && startDate.getMonth() <= 2;
                        }).length === 0 && (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-sm text-gray-400 italic">No events scheduled</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Q2 */}
                  <div>
                    <h4 className="text-md font-medium mb-4">Q2 (Apr - Jun)</h4>
                    <div className="relative">
                      <div className="absolute left-0 right-0 h-1 bg-gray-100 top-8"></div>
                      
                      {/* Months labels */}
                      <div className="relative grid grid-cols-3 mb-6">
                        <div className="text-center text-sm text-gray-500">April</div>
                        <div className="text-center text-sm text-gray-500">May</div>
                        <div className="text-center text-sm text-gray-500">June</div>
                      </div>
                      
                      {/* Events */}
                      <div className="relative h-24 mb-6">
                        {campData
                          .filter(camp => {
                            const startDate = new Date(camp.startDate);
                            return startDate.getMonth() >= 3 && startDate.getMonth() <= 5; // Apr-Jun (3-5)
                          })
                          .map(camp => {
                            const startDate = new Date(camp.startDate);
                            const endDate = new Date(camp.endDate);
                            
                            // Calculate position and width
                            const monthPercentage = 100 / 3; // 3 months per quarter
                            const startMonth = startDate.getMonth() % 3; // 0-2 within the quarter
                            const startDay = startDate.getDate();
                            const daysInMonth = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0).getDate();
                            
                            // Position based on month and day
                            const leftPosition = (startMonth * monthPercentage) + 
                              ((startDay / daysInMonth) * monthPercentage);
                            
                            // Width based on duration (days)
                            const campDuration = camp.totalDays;
                            const daysIn90Days = 90; // Approximate days in a quarter
                            const widthPercentage = (campDuration / daysIn90Days) * 100;
                            
                            // Color based on status
                            const bgColor = 
                              camp.status === 'upcoming' ? 'bg-blue-50 border-blue-200' :
                              camp.status === 'current' ? 'bg-green-50 border-green-200' :
                              'bg-gray-50 border-gray-200';
                            
                            return (
                              <div 
                                key={camp.id}
                                className={`absolute top-0 h-16 rounded-md ${bgColor} p-2 cursor-pointer`}
                                style={{ 
                                  left: `${leftPosition}%`,
                                  width: `${widthPercentage}%`,
                                  minWidth: '80px'
                                }}
                                onClick={() => setSelectedCamp(camp)}
                              >
                                <div className="font-medium text-sm truncate">{camp.name}</div>
                                <div className="text-xs text-gray-500">
                                  {format(startDate, "MMM d")} - {format(endDate, "MMM d")}
                                </div>
                              </div>
                            );
                          })}
                        {campData.filter(camp => {
                          const startDate = new Date(camp.startDate);
                          return startDate.getMonth() >= 3 && startDate.getMonth() <= 5;
                        }).length === 0 && (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-sm text-gray-400 italic">No events scheduled</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Q3 */}
                  <div>
                    <h4 className="text-md font-medium mb-4">Q3 (Jul - Sep)</h4>
                    <div className="relative">
                      <div className="absolute left-0 right-0 h-1 bg-gray-100 top-8"></div>
                      
                      {/* Months labels */}
                      <div className="relative grid grid-cols-3 mb-6">
                        <div className="text-center text-sm text-gray-500">July</div>
                        <div className="text-center text-sm text-gray-500">August</div>
                        <div className="text-center text-sm text-gray-500">September</div>
                      </div>
                      
                      {/* Events */}
                      <div className="relative h-24 mb-6">
                        {campData
                          .filter(camp => {
                            const startDate = new Date(camp.startDate);
                            return startDate.getMonth() >= 6 && startDate.getMonth() <= 8; // Jul-Sep (6-8)
                          })
                          .map(camp => {
                            const startDate = new Date(camp.startDate);
                            const endDate = new Date(camp.endDate);
                            
                            // Calculate position and width
                            const monthPercentage = 100 / 3; // 3 months per quarter
                            const startMonth = startDate.getMonth() % 3; // 0-2 within the quarter
                            const startDay = startDate.getDate();
                            const daysInMonth = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0).getDate();
                            
                            // Position based on month and day
                            const leftPosition = (startMonth * monthPercentage) + 
                              ((startDay / daysInMonth) * monthPercentage);
                            
                            // Width based on duration (days)
                            const campDuration = camp.totalDays;
                            const daysIn90Days = 90; // Approximate days in a quarter
                            const widthPercentage = (campDuration / daysIn90Days) * 100;
                            
                            // Color based on status
                            const bgColor = 
                              camp.status === 'upcoming' ? 'bg-blue-50 border-blue-200' :
                              camp.status === 'current' ? 'bg-green-50 border-green-200' :
                              'bg-gray-50 border-gray-200';
                            
                            return (
                              <div 
                                key={camp.id}
                                className={`absolute top-0 h-16 rounded-md ${bgColor} p-2 cursor-pointer`}
                                style={{ 
                                  left: `${leftPosition}%`,
                                  width: `${widthPercentage}%`,
                                  minWidth: '80px'
                                }}
                                onClick={() => setSelectedCamp(camp)}
                              >
                                <div className="font-medium text-sm truncate">{camp.name}</div>
                                <div className="text-xs text-gray-500">
                                  {format(startDate, "MMM d")} - {format(endDate, "MMM d")}
                                </div>
                              </div>
                            );
                          })}
                        {campData.filter(camp => {
                          const startDate = new Date(camp.startDate);
                          return startDate.getMonth() >= 6 && startDate.getMonth() <= 8;
                        }).length === 0 && (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-sm text-gray-400 italic">No events scheduled</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Q4 */}
                  <div>
                    <h4 className="text-md font-medium mb-4">Q4 (Oct - Dec)</h4>
                    <div className="relative">
                      <div className="absolute left-0 right-0 h-1 bg-gray-100 top-8"></div>
                      
                      {/* Months labels */}
                      <div className="relative grid grid-cols-3 mb-6">
                        <div className="text-center text-sm text-gray-500">October</div>
                        <div className="text-center text-sm text-gray-500">November</div>
                        <div className="text-center text-sm text-gray-500">December</div>
                      </div>
                      
                      {/* Events */}
                      <div className="relative h-24 mb-6">
                        {campData
                          .filter(camp => {
                            const startDate = new Date(camp.startDate);
                            return startDate.getMonth() >= 9 && startDate.getMonth() <= 11; // Oct-Dec (9-11)
                          })
                          .map(camp => {
                            const startDate = new Date(camp.startDate);
                            const endDate = new Date(camp.endDate);
                            
                            // Calculate position and width
                            const monthPercentage = 100 / 3; // 3 months per quarter
                            const startMonth = startDate.getMonth() % 3; // 0-2 within the quarter
                            const startDay = startDate.getDate();
                            const daysInMonth = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0).getDate();
                            
                            // Position based on month and day
                            const leftPosition = (startMonth * monthPercentage) + 
                              ((startDay / daysInMonth) * monthPercentage);
                            
                            // Width based on duration (days)
                            const campDuration = camp.totalDays;
                            const daysIn90Days = 90; // Approximate days in a quarter
                            const widthPercentage = (campDuration / daysIn90Days) * 100;
                            
                            // Color based on status
                            const bgColor = 
                              camp.status === 'upcoming' ? 'bg-blue-50 border-blue-200' :
                              camp.status === 'current' ? 'bg-green-50 border-green-200' :
                              'bg-gray-50 border-gray-200';
                            
                            return (
                              <div 
                                key={camp.id}
                                className={`absolute top-0 h-16 rounded-md ${bgColor} p-2 cursor-pointer`}
                                style={{ 
                                  left: `${leftPosition}%`,
                                  width: `${widthPercentage}%`,
                                  minWidth: '80px'
                                }}
                                onClick={() => setSelectedCamp(camp)}
                              >
                                <div className="font-medium text-sm truncate">{camp.name}</div>
                                <div className="text-xs text-gray-500">
                                  {format(startDate, "MMM d")} - {format(endDate, "MMM d")}
                                </div>
                              </div>
                            );
                          })}
                        {campData.filter(camp => {
                          const startDate = new Date(camp.startDate);
                          return startDate.getMonth() >= 9 && startDate.getMonth() <= 11;
                        }).length === 0 && (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-sm text-gray-400 italic">No events scheduled</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-center mt-6">
                <Button variant="outline" size="sm" onClick={() => {
                  const tabsList = document.querySelector('[role="tablist"]');
                  const listTab = tabsList?.querySelector('[data-value="list"]');
                  if (listTab) {
                    (listTab as HTMLElement).click();
                  }
                }}>
                  Return to List View
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="stats">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-xl">Camp Participants</CardTitle>
                  <CardDescription>Total participants by camp</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="h-80">
                  {/* Bar Chart Visualization */}
                  <div className="flex flex-col h-full">
                    <div className="flex justify-between mb-2">
                      <div className="text-sm font-medium">Camp Name</div>
                      <div className="text-sm font-medium">Participants</div>
                    </div>
                    
                    {campData.map((camp) => (
                      <div key={camp.id} className="mb-3">
                        <div className="flex justify-between mb-1">
                          <div className="text-sm truncate max-w-[180px]">{camp.name}</div>
                          <div className="text-sm">{camp.participants}</div>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2.5">
                          <div 
                            className="bg-brand-600 h-2.5 rounded-full" 
                            style={{ width: `${(camp.participants / 50) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-xl">Budget Allocation</CardTitle>
                  <CardDescription>Funds allocated per camp</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <PieChart className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="h-80">
                  {/* Pie Chart Visualization */}
                  <div className="h-full flex flex-col justify-between">
                    <div className="flex-1 flex items-center justify-center">
                      <div className="relative w-48 h-48">
                        <div className="absolute inset-0 rounded-full bg-gray-100 overflow-hidden">
                          <div className="absolute inset-0" style={{ 
                            clipPath: 'polygon(50% 50%, 100% 0%, 100% 100%, 0% 100%, 0% 0%)',
                            background: 'conic-gradient(#4f46e5 0% 40%, #f59e0b 40% 55%, #10b981 55% 100%)'
                          }}></div>
                          <div className="absolute inset-[15%] bg-white rounded-full flex items-center justify-center">
                            <div className="text-lg font-semibold">
                              ${campData.reduce((acc, camp) => acc + camp.budget, 0).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-6 grid grid-cols-1 gap-2">
                      {campData.map((camp, index) => (
                        <div key={camp.id} className="flex items-center">
                          <div className={`h-3 w-3 rounded-full mr-2 ${
                            index === 0 ? 'bg-indigo-500' : 
                            index === 1 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}></div>
                          <div className="text-sm truncate flex-1">{camp.name}</div>
                          <div className="text-sm font-medium">${camp.budget.toLocaleString()}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-xl">Task Completion</CardTitle>
                  <CardDescription>Progress on camp preparation</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Activity className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-6">
                  {campData.map((camp) => (
                    <div key={camp.id}>
                      <div className="flex justify-between mb-1">
                        <div className="text-sm font-medium">{camp.name}</div>
                        <div className="text-sm">{camp.completionPercentage}%</div>
                      </div>
                      <Progress value={camp.completionPercentage} className="h-2" />
                      <div className="mt-2 grid grid-cols-3 text-xs text-gray-500">
                        <div className="flex items-center">
                          <div className="h-2 w-2 rounded-full bg-green-500 mr-1"></div>
                          <span>
                            {camp.tasks.filter(t => t.status === 'completed').length} Completed
                          </span>
                        </div>
                        <div className="flex items-center">
                          <div className="h-2 w-2 rounded-full bg-yellow-500 mr-1"></div>
                          <span>
                            {camp.tasks.filter(t => t.status === 'in-progress').length} In Progress
                          </span>
                        </div>
                        <div className="flex items-center">
                          <div className="h-2 w-2 rounded-full bg-gray-300 mr-1"></div>
                          <span>
                            {camp.tasks.filter(t => t.status === 'pending').length} Pending
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-xl">Camp Timeline</CardTitle>
                  <CardDescription>Duration and dates of camps</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <LineChart className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="h-80">
                  {/* Timeline Visualization */}
                  <div className="relative h-full flex flex-col justify-center">
                    <div className="absolute left-0 right-0 h-1 bg-gray-100"></div>
                    
                    {campData.map((camp, index) => {
                      const startDate = new Date(camp.startDate);
                      const endDate = new Date(camp.endDate);
                      const startMonth = startDate.getMonth();
                      const startPercentage = (startMonth / 12) * 100;
                      const duration = Math.max(5, (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 3));
                      
                      return (
                        <div 
                          key={camp.id} 
                          className="absolute h-14 rounded-md p-2 flex flex-col justify-center"
                          style={{ 
                            left: `${startPercentage}%`, 
                            width: `${duration}%`,
                            top: `${20 + index * 20}%`,
                            backgroundColor: index === 0 ? '#fef3c7' : 
                                             index === 1 ? '#e0f2fe' : '#dcfce7',
                            borderLeft: `4px solid ${index === 0 ? '#f59e0b' : 
                                                     index === 1 ? '#0ea5e9' : '#10b981'}`
                          }}
                        >
                          <div className="text-xs font-medium truncate">{camp.name}</div>
                          <div className="text-xs text-gray-500">{formatDate(camp.startDate)} - {formatDate(camp.endDate)}</div>
                        </div>
                      );
                    })}
                    
                    <div className="absolute -bottom-6 left-0 right-0 flex justify-between text-xs text-gray-500">
                      <div>Jan</div>
                      <div>Feb</div>
                      <div>Mar</div>
                      <div>Apr</div>
                      <div>May</div>
                      <div>Jun</div>
                      <div>Jul</div>
                      <div>Aug</div>
                      <div>Sep</div>
                      <div>Oct</div>
                      <div>Nov</div>
                      <div>Dec</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="flex justify-center mt-6">
            <Button variant="outline" onClick={() => {
              const tabsList = document.querySelector('[role="tablist"]');
              const listTab = tabsList?.querySelector('[data-value="list"]');
              if (listTab) {
                (listTab as HTMLElement).click();
              }
            }}>
              Return to List View
            </Button>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Edit Camp Dialog */}
      {isEditCampOpen && selectedCamp && (
        <Dialog open={isEditCampOpen} onOpenChange={(open) => {
          if (!open) setIsEditCampOpen(false);
        }}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Edit Camp</DialogTitle>
              <DialogDescription>
                Update the details for {selectedCamp.name}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Camp Name</label>
                  <Input 
                    defaultValue={selectedCamp.name}
                    className="mt-1"
                    onChange={(e) => {
                      setSelectedCamp({
                        ...selectedCamp,
                        name: e.target.value
                      });
                    }}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Camp Type</label>
                  <Select 
                    defaultValue={selectedCamp.type} 
                    onValueChange={(value) => {
                      setSelectedCamp({
                        ...selectedCamp,
                        type: value
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Training Camp">Training Camp</SelectItem>
                      <SelectItem value="Skills Clinic">Skills Clinic</SelectItem>
                      <SelectItem value="Elite Training">Elite Training</SelectItem>
                      <SelectItem value="Competition">Competition</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Start Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal mt-1"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedCamp.startDate ? format(new Date(selectedCamp.startDate), "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={new Date(selectedCamp.startDate)}
                        onSelect={(date) => {
                          if (date) {
                            setSelectedCamp({
                              ...selectedCamp,
                              startDate: format(date, "yyyy-MM-dd")
                            });
                          }
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div>
                  <label className="text-sm font-medium">End Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal mt-1"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedCamp.endDate ? format(new Date(selectedCamp.endDate), "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={new Date(selectedCamp.endDate)}
                        onSelect={(date) => {
                          if (date) {
                            setSelectedCamp({
                              ...selectedCamp,
                              endDate: format(date, "yyyy-MM-dd")
                            });
                          }
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">Venue</label>
                <Input 
                  defaultValue={selectedCamp.venue}
                  className="mt-1"
                  onChange={(e) => {
                    setSelectedCamp({
                      ...selectedCamp,
                      venue: e.target.value
                    });
                  }}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Address</label>
                <Input 
                  defaultValue={selectedCamp.address}
                  className="mt-1"
                  onChange={(e) => {
                    setSelectedCamp({
                      ...selectedCamp,
                      address: e.target.value
                    });
                  }}
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Participants</label>
                  <Input 
                    type="number"
                    defaultValue={selectedCamp.participants}
                    className="mt-1"
                    onChange={(e) => {
                      const participants = parseInt(e.target.value);
                      const campCost = selectedCamp.campCost || 0;
                      const totalRevenue = participants * campCost;
                      
                      setSelectedCamp({
                        ...selectedCamp,
                        participants: participants,
                        budget: totalRevenue // Update budget based on participants x camp cost
                      });
                    }}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Camp Cost (per participant)</label>
                  <Input 
                    type="number"
                    defaultValue={selectedCamp.campCost || 0}
                    className="mt-1"
                    onChange={(e) => {
                      const campCost = parseInt(e.target.value);
                      const participants = selectedCamp.participants || 0;
                      const totalRevenue = participants * campCost;
                      
                      setSelectedCamp({
                        ...selectedCamp,
                        campCost: campCost,
                        budget: totalRevenue // Update budget based on participants x camp cost
                      });
                    }}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Total Revenue</label>
                  <Input 
                    type="number"
                    value={(selectedCamp.participants || 0) * (selectedCamp.campCost || 0)}
                    className="mt-1 bg-gray-50"
                    disabled
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <Select 
                    defaultValue={selectedCamp.status} 
                    onValueChange={(value) => {
                      setSelectedCamp({
                        ...selectedCamp,
                        status: value
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="upcoming">Upcoming</SelectItem>
                      <SelectItem value="current">Current</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="mb-6">
                <label className="text-sm font-medium mb-2 block">Assigned Clinicians</label>
                
                {/* Selected clinicians display */}
                <div className="border rounded-md p-2 mb-2 max-h-48 overflow-y-auto">
                  {selectedCamp.clinicians?.length > 0 ? (
                    <div className="space-y-2">
                      {selectedCamp.clinicians.map((clinician: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={clinician.avatar} />
                              <AvatarFallback>
                                {clinician.name.split(' ').map((n: string) => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium text-sm">{clinician.name}</div>
                              <div className="text-xs text-gray-500">{clinician.role}</div>
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 h-auto"
                            onClick={() => {
                              const updatedClinicians = selectedCamp.clinicians.filter((_: any, i: number) => i !== index);
                              setSelectedCamp({
                                ...selectedCamp,
                                clinicians: updatedClinicians
                              });
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-400 text-center py-4">No clinicians assigned yet</div>
                  )}
                </div>
                
                {/* Clinician search and add */}
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <div className="relative flex-grow">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                      <Input 
                        placeholder="Search clinicians by name..."
                        className="pl-8"
                        value={clinicianSearchTerm}
                        onChange={(e) => setClinicianSearchTerm(e.target.value)}
                      />
                    </div>
                    <Button 
                      variant="outline"
                      onClick={() => {
                        // In a real app, this would open a dialog to add a new clinician
                        // or navigate to the staff page
                        alert("This would redirect to the Staff Management page to add a new clinician.");
                      }}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      New
                    </Button>
                  </div>
                  
                  {/* Clinician search results */}
                  <div className="border rounded-md p-2 max-h-60 overflow-y-auto">
                    {/* Mock data for clinician search */}
                    {[
                      {
                        id: 1,
                        name: "John Smith",
                        role: "Head Coach",
                        avatar: "",
                        rate: 250,
                        rateType: "daily"
                      },
                      {
                        id: 2,
                        name: "Sarah Thompson",
                        role: "Assistant Coach",
                        avatar: "",
                        rate: 200,
                        rateType: "daily"
                      },
                      {
                        id: 3,
                        name: "David Johnson",
                        role: "Athletic Trainer",
                        avatar: "",
                        rate: 220,
                        rateType: "daily"
                      },
                      {
                        id: 4,
                        name: "Michael Wilson",
                        role: "Strength & Conditioning",
                        avatar: "",
                        rate: 200,
                        rateType: "daily"
                      },
                      {
                        id: 5,
                        name: "Robert Davis",
                        role: "Head Coach",
                        avatar: "",
                        rate: 275,
                        rateType: "daily"
                      }
                    ]
                      .filter(staff => 
                        staff.name.toLowerCase().includes(clinicianSearchTerm.toLowerCase()) ||
                        staff.role.toLowerCase().includes(clinicianSearchTerm.toLowerCase())
                      )
                      .slice(0, 5) // Limit results
                      .map((staff, index) => (
                        <div 
                          key={index} 
                          className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer"
                          onClick={() => {
                            const isAlreadySelected = selectedCamp.clinicians?.some(
                              (c: any) => c.id === staff.id
                            );
                            
                            if (!isAlreadySelected) {
                              const updatedClinicians = [...(selectedCamp.clinicians || []), staff];
                              setSelectedCamp({
                                ...selectedCamp,
                                clinicians: updatedClinicians
                              });
                              setClinicianSearchTerm(""); // Clear search after selection
                            }
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={staff.avatar} />
                              <AvatarFallback>
                                {staff.name.split(' ').map((n: string) => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium text-sm">{staff.name}</div>
                              <div className="text-xs text-gray-500">{staff.role} • ${staff.rate}/{staff.rateType}</div>
                            </div>
                          </div>
                          <Badge variant="outline" className="bg-gray-50">
                            Add
                          </Badge>
                        </div>
                      ))}
                      
                    {clinicianSearchTerm && [
                      {
                        id: 1,
                        name: "John Smith",
                        role: "Head Coach",
                        avatar: "",
                        rate: 250,
                        rateType: "daily"
                      },
                      {
                        id: 2,
                        name: "Sarah Thompson",
                        role: "Assistant Coach",
                        avatar: "",
                        rate: 200,
                        rateType: "daily"
                      },
                      {
                        id: 3,
                        name: "David Johnson",
                        role: "Athletic Trainer",
                        avatar: "",
                        rate: 220,
                        rateType: "daily"
                      },
                      {
                        id: 4,
                        name: "Michael Wilson",
                        role: "Strength & Conditioning",
                        avatar: "",
                        rate: 200,
                        rateType: "daily"
                      },
                      {
                        id: 5,
                        name: "Robert Davis",
                        role: "Head Coach",
                        avatar: "",
                        rate: 275,
                        rateType: "daily"
                      }
                    ].filter(staff => 
                      staff.name.toLowerCase().includes(clinicianSearchTerm.toLowerCase()) ||
                      staff.role.toLowerCase().includes(clinicianSearchTerm.toLowerCase())
                    ).length === 0 && (
                      <div className="text-gray-400 text-center py-4">No matching clinicians found</div>
                    )}
                    
                    {!clinicianSearchTerm && (
                      <div className="text-gray-400 text-center py-4">Type to search for clinicians</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter className="flex justify-between">
              <Button 
                variant="outline" 
                type="button"
                className="bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20 hover:text-destructive hover:border-destructive/30"
                onClick={() => {
                  setIsEditCampOpen(false);
                  setIsDeleteCampOpen(true);
                }}
              >
                Delete Camp
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsEditCampOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => {
                  // Calculate total days
                  const start = new Date(selectedCamp.startDate);
                  const end = new Date(selectedCamp.endDate);
                  const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1;
                  
                  // Update camp with new data
                  const updatedCamp = {
                    ...selectedCamp,
                    totalDays
                  };
                  
                  handleEditCamp(updatedCamp);
                  setIsEditCampOpen(false);
                }}>
                  Save Changes
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Delete Camp Dialog */}
      {isDeleteCampOpen && selectedCamp && (
        <AlertDialog open={isDeleteCampOpen} onOpenChange={(open) => {
          if (!open) setIsDeleteCampOpen(false);
        }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete <strong>{selectedCamp.name}</strong> and all related data.
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setIsDeleteCampOpen(false)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteCamp} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}