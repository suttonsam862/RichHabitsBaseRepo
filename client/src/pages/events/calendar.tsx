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
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight,
  Plus,
  Search,
  Filter,
  Clock,
  MapPin,
  Users,
  Tag,
  Calendar as CalendarIconFull,
  ListChecks,
  MoreHorizontal,
  Layers,
  ArrowDownUp,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  XCircle,
  AlertCircle
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger
} from "@/components/ui/dialog";

// Sample data for the page
const MONTHS = [
  "January", "February", "March", "April", "May", "June", 
  "July", "August", "September", "October", "November", "December"
];

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const CURRENT_YEAR = 2025;

// Sample camps data
const sampleCamps = [
  {
    id: 1,
    name: "Summer Wrestling Camp 2025",
    startDate: "2025-06-15",
    endDate: "2025-06-22",
    location: "Mountain View Training Center",
    address: "123 Pine Road, Boulder, CO 80302",
    status: "upcoming",
    primaryColor: "#4f46e5", // indigo-600
    type: "Multi-day Camp",
    description: "Annual summer wrestling camp featuring intensive training and skill development",
    participants: 45
  },
  {
    id: 2,
    name: "Spring Training Clinic",
    startDate: "2025-04-10",
    endDate: "2025-04-12",
    location: "Lakeside Sports Complex",
    address: "456 Shore Drive, Tampa, FL 33601",
    status: "upcoming",
    primaryColor: "#0891b2", // cyan-600
    type: "Weekend Clinic",
    description: "Focused weekend training clinic for technique refinement",
    participants: 30
  },
  {
    id: 3,
    name: "Winter Training Camp",
    startDate: "2025-01-05",
    endDate: "2025-01-10",
    location: "Alpine Training Facility",
    address: "789 Mountain Road, Denver, CO 80205",
    status: "completed",
    primaryColor: "#0f766e", // teal-700
    type: "Training Camp",
    description: "Winter intensive training focusing on advanced techniques",
    participants: 25
  },
  {
    id: 4,
    name: "Fall Technique Workshop",
    startDate: "2025-09-15",
    endDate: "2025-09-16",
    location: "University Fieldhouse",
    address: "555 University Ave, Boulder, CO 80303",
    status: "planned",
    primaryColor: "#b45309", // amber-700
    type: "Workshop",
    description: "Two-day technique workshop focused on fundamentals",
    participants: 35
  }
];

// Sample tasks/schedules for camps
const sampleScheduleItems = [
  // Summer Wrestling Camp
  {
    id: 101,
    campId: 1,
    date: "2025-06-15",
    startTime: "08:00 AM",
    endTime: "09:00 AM",
    title: "Check-in & Registration",
    location: "Main Entrance",
    type: "administrative",
    status: "scheduled",
    assignedTo: ["John Smith", "Sarah Thompson"],
    description: "Participant check-in, paperwork collection, and welcome packets distribution"
  },
  {
    id: 102,
    campId: 1,
    date: "2025-06-15",
    startTime: "09:30 AM",
    endTime: "11:30 AM",
    title: "Opening Session & Orientation",
    location: "Main Training Area",
    type: "training",
    status: "scheduled",
    assignedTo: ["John Smith"],
    description: "Introduction to camp schedule, safety procedures, and initial skill assessment"
  },
  {
    id: 103,
    campId: 1,
    date: "2025-06-15",
    startTime: "12:00 PM",
    endTime: "01:00 PM",
    title: "Lunch",
    location: "Dining Hall",
    type: "meal",
    status: "scheduled",
    assignedTo: ["Mountain View Catering"],
    description: "Nutritious lunch with options for dietary restrictions"
  },
  {
    id: 104,
    campId: 1,
    date: "2025-06-15",
    startTime: "01:30 PM",
    endTime: "04:00 PM",
    title: "Technique Session: Takedowns",
    location: "Main Training Area",
    type: "training",
    status: "scheduled",
    assignedTo: ["John Smith", "Sarah Thompson"],
    description: "Focused technique work on takedowns and entries"
  },
  {
    id: 105,
    campId: 1,
    date: "2025-06-15",
    startTime: "04:30 PM",
    endTime: "06:00 PM",
    title: "Conditioning & Strength",
    location: "Weight Room & Track",
    type: "training",
    status: "scheduled",
    assignedTo: ["Michael Wilson"],
    description: "Sport-specific strength training and conditioning circuits"
  },
  {
    id: 106,
    campId: 1,
    date: "2025-06-15",
    startTime: "06:30 PM",
    endTime: "07:30 PM",
    title: "Dinner",
    location: "Dining Hall",
    type: "meal",
    status: "scheduled",
    assignedTo: ["Mountain View Catering"],
    description: "Balanced dinner with appropriate nutrition for recovery"
  },
  {
    id: 107,
    campId: 1,
    date: "2025-06-15",
    startTime: "08:00 PM",
    endTime: "09:00 PM",
    title: "Team Building Activities",
    location: "Recreation Room",
    type: "social",
    status: "scheduled",
    assignedTo: ["Sarah Thompson"],
    description: "Interactive games and activities to build camaraderie"
  },
  
  // Second day of Summer Wrestling Camp
  {
    id: 108,
    campId: 1,
    date: "2025-06-16",
    startTime: "07:00 AM",
    endTime: "08:00 AM",
    title: "Morning Conditioning",
    location: "Track",
    type: "training",
    status: "scheduled",
    assignedTo: ["Michael Wilson"],
    description: "Light cardio, dynamic stretching, and mobility work"
  },
  {
    id: 109,
    campId: 1,
    date: "2025-06-16",
    startTime: "08:30 AM",
    endTime: "09:30 AM",
    title: "Breakfast",
    location: "Dining Hall",
    type: "meal",
    status: "scheduled",
    assignedTo: ["Mountain View Catering"],
    description: "Nutritious breakfast to fuel morning training sessions"
  },
  
  // Spring Training Clinic
  {
    id: 201,
    campId: 2,
    date: "2025-04-10",
    startTime: "09:00 AM",
    endTime: "10:00 AM",
    title: "Registration & Welcome",
    location: "Main Entrance",
    type: "administrative",
    status: "scheduled",
    assignedTo: ["Sarah Thompson"],
    description: "Participant check-in and welcome packets"
  },
  {
    id: 202,
    campId: 2,
    date: "2025-04-10",
    startTime: "10:30 AM",
    endTime: "12:30 PM",
    title: "Technical Session: Defense",
    location: "Main Training Area",
    type: "training",
    status: "scheduled",
    assignedTo: ["Robert Davis"],
    description: "Defensive techniques and counter attacks"
  },
  
  // Winter Training Camp
  {
    id: 301,
    campId: 3,
    date: "2025-01-05",
    startTime: "08:30 AM",
    endTime: "09:30 AM",
    title: "Opening Session",
    location: "Conference Room",
    type: "administrative",
    status: "completed",
    assignedTo: ["John Smith"],
    description: "Introduction to camp goals and expectations"
  },
  
  // Fall Technique Workshop
  {
    id: 401,
    campId: 4,
    date: "2025-09-15",
    startTime: "09:00 AM",
    endTime: "10:00 AM",
    title: "Registration",
    location: "Main Lobby",
    type: "administrative",
    status: "planned",
    assignedTo: [],
    description: "Participant check-in and materials distribution"
  }
];

// Format date for display
const formatDate = (dateString: string) => {
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
};

// Format time range
const formatTimeRange = (startTime: string, endTime: string) => {
  return `${startTime} - ${endTime}`;
};

// Get the days in a month
const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

// Get the first day of the month (0 = Sunday, 1 = Monday, etc.)
const getFirstDayOfMonth = (year: number, month: number) => {
  return new Date(year, month, 1).getDay();
};

// Check if a date is today
const isToday = (date: Date) => {
  const today = new Date();
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
};

// Check if a date is in a camp's range
const isDateInCampRange = (date: Date, camp: any) => {
  const startDate = new Date(camp.startDate);
  const endDate = new Date(camp.endDate);
  
  // Reset the time portion for comparison
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);
  date.setHours(12, 0, 0, 0);
  
  return date >= startDate && date <= endDate;
};

// Check if a date has any events
const getEventsForDate = (date: Date, scheduleItems: any[]) => {
  const formattedDate = date.toISOString().split('T')[0];
  return scheduleItems.filter(item => item.date === formattedDate);
};

// Get status badge color
const getStatusColor = (status: string) => {
  switch(status.toLowerCase()) {
    case 'upcoming':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    case 'active':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'completed':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    case 'cancelled':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    case 'planned':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
    case 'scheduled':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    case 'completed':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'cancelled':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  }
};

// Get type icon for schedule items
const getTypeIcon = (type: string) => {
  switch(type.toLowerCase()) {
    case 'training':
      return <Users className="h-4 w-4" />;
    case 'meal':
      return <Clock className="h-4 w-4" />;
    case 'administrative':
      return <ListChecks className="h-4 w-4" />;
    case 'social':
      return <Users className="h-4 w-4" />;
    default:
      return <Tag className="h-4 w-4" />;
  }
};

// Calendar Component
const CalendarView = ({ 
  selectedMonth, 
  selectedYear, 
  camps, 
  scheduleItems,
  onMonthChange,
  onDateSelect
}: { 
  selectedMonth: number; 
  selectedYear: number; 
  camps: any[];
  scheduleItems: any[];
  onMonthChange: (month: number, year: number) => void;
  onDateSelect: (date: Date) => void;
}) => {
  const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
  const firstDayOfMonth = getFirstDayOfMonth(selectedYear, selectedMonth);
  
  // Generate calendar days
  const calendarDays = [];
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }
  
  // Add cells for each day of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(new Date(selectedYear, selectedMonth, day));
  }
  
  // Handle previous month
  const handlePrevMonth = () => {
    let newMonth = selectedMonth - 1;
    let newYear = selectedYear;
    
    if (newMonth < 0) {
      newMonth = 11;
      newYear--;
    }
    
    onMonthChange(newMonth, newYear);
  };
  
  // Handle next month
  const handleNextMonth = () => {
    let newMonth = selectedMonth + 1;
    let newYear = selectedYear;
    
    if (newMonth > 11) {
      newMonth = 0;
      newYear++;
    }
    
    onMonthChange(newMonth, newYear);
  };
  
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">{MONTHS[selectedMonth]} {selectedYear}</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={handlePrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {/* Weekday headers */}
        {WEEKDAYS.map((day, index) => (
          <div key={index} className="text-center font-medium py-2 text-sm">
            {day.substring(0, 3)}
          </div>
        ))}
        
        {/* Calendar days */}
        {calendarDays.map((date, index) => {
          if (!date) {
            return <div key={`empty-${index}`} className="p-1 bg-gray-50 border border-transparent"></div>;
          }
          
          const dateEvents = getEventsForDate(date, scheduleItems);
          const isCurrentDay = isToday(date);
          
          // Find camps that include this date
          const activeCamps = camps.filter(camp => isDateInCampRange(new Date(date), camp));
          
          return (
            <div 
              key={`day-${index}`} 
              className={`
                min-h-[100px] p-1 border hover:border-brand-300 cursor-pointer
                ${isCurrentDay ? 'bg-blue-50 border-blue-200' : 'border-gray-200'}
              `}
              onClick={() => onDateSelect(date)}
            >
              <div className="flex justify-between mb-1">
                <span className={`text-sm font-medium ${isCurrentDay ? 'text-blue-700' : ''}`}>
                  {date.getDate()}
                </span>
                {dateEvents.length > 0 && (
                  <Badge className="text-xs" variant="outline">
                    {dateEvents.length}
                  </Badge>
                )}
              </div>
              
              {/* Camp indicators */}
              {activeCamps.length > 0 && (
                <div className="space-y-1 mb-1">
                  {activeCamps.slice(0, 2).map(camp => (
                    <div 
                      key={camp.id} 
                      className="text-xs px-1.5 py-0.5 rounded-sm truncate"
                      style={{ backgroundColor: `${camp.primaryColor}20`, color: camp.primaryColor }}
                    >
                      {camp.name}
                    </div>
                  ))}
                  {activeCamps.length > 2 && (
                    <div className="text-xs text-gray-500">+{activeCamps.length - 2} more</div>
                  )}
                </div>
              )}
              
              {/* Event indicators */}
              {dateEvents.length > 0 && (
                <div className="space-y-1">
                  {dateEvents.slice(0, 2).map(event => (
                    <div 
                      key={event.id} 
                      className="text-xs bg-gray-100 px-1.5 py-0.5 rounded-sm truncate"
                    >
                      {event.title}
                    </div>
                  ))}
                  {dateEvents.length > 2 && (
                    <div className="text-xs text-gray-500">+{dateEvents.length - 2} more</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Schedule Item Component
const ScheduleItem = ({ item, onEdit }: { item: any, onEdit: (item: any) => void }) => {
  const campInfo = sampleCamps.find(camp => camp.id === item.campId);
  
  return (
    <Card className="mb-3 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div style={{ color: campInfo?.primaryColor }}>
                {getTypeIcon(item.type)}
              </div>
              <h3 className="font-medium">{item.title}</h3>
            </div>
            <div className="text-sm text-gray-500 mb-2">
              {formatTimeRange(item.startTime, item.endTime)} • {item.location}
            </div>
            <div className="text-sm mb-3">{item.description}</div>
            <div className="flex flex-wrap gap-2">
              <Badge className={getStatusColor(item.status)} variant="secondary">
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </Badge>
              {campInfo && (
                <Badge 
                  className="text-white" 
                  style={{ backgroundColor: campInfo.primaryColor }}
                >
                  {campInfo.name}
                </Badge>
              )}
            </div>
          </div>
          <div className="mt-3 md:mt-0 md:ml-4 md:min-w-[120px] flex flex-col items-end justify-between">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(item)}>Edit Item</DropdownMenuItem>
                <DropdownMenuItem>Mark Complete</DropdownMenuItem>
                <DropdownMenuItem>Duplicate</DropdownMenuItem>
                <DropdownMenuItem>Cancel</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {item.assignedTo.length > 0 && (
              <div className="text-sm text-gray-500 mt-4 text-right">
                <div className="mb-1">Assigned to:</div>
                {item.assignedTo.map((person: string, index: number) => (
                  <div key={index} className="text-sm">{person}</div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function CalendarScheduling() {
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<Date | null>(today);
  const [selectedCamp, setSelectedCamp] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [viewMode, setViewMode] = useState<"calendar" | "agenda">("calendar");
  const [editingScheduleItem, setEditingScheduleItem] = useState<any | null>(null);
  
  // In a real app, you would fetch these from the server
  const { data: camps = sampleCamps, isLoading: isLoadingCamps } = useQuery({
    queryKey: ['/api/camps'],
    enabled: false, // Disabled for now as we're using sample data
  });
  
  const { data: scheduleItems = sampleScheduleItems, isLoading: isLoadingSchedule } = useQuery({
    queryKey: ['/api/schedule-items'],
    enabled: false, // Disabled for now as we're using sample data
  });
  
  // Handle month change
  const handleMonthChange = (month: number, year: number) => {
    setSelectedMonth(month);
    setSelectedYear(year);
  };
  
  // Handle date selection
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };
  
  // Filter schedule items
  const filteredScheduleItems = scheduleItems.filter(item => {
    // Filter by camp
    const matchesCamp = selectedCamp === "all" || item.campId.toString() === selectedCamp;
    
    // Filter by type
    const matchesType = selectedType === "all" || item.type.toLowerCase() === selectedType.toLowerCase();
    
    // Filter by status
    const matchesStatus = selectedStatus === "all" || item.status.toLowerCase() === selectedStatus.toLowerCase();
    
    // Filter by search term
    const matchesSearch = 
      !searchTerm || 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filter by selected date in agenda view
    const matchesDate = !selectedDate || 
      (viewMode === "agenda" ? true : item.date === selectedDate.toISOString().split('T')[0]);
    
    return matchesCamp && matchesType && matchesStatus && matchesSearch && matchesDate;
  });
  
  // Get unique categories for filters
  const eventTypes = Array.from(new Set(scheduleItems.map(item => item.type)));
  
  // Handle schedule item edit
  const handleEditScheduleItem = (item: any) => {
    setEditingScheduleItem(item);
  };
  
  // Handle close edit dialog
  const handleCloseEditDialog = () => {
    setEditingScheduleItem(null);
  };

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Calendar & Scheduling</h1>
          <p className="text-gray-500 mt-1">Manage camp schedules, events, and activities</p>
        </div>
        <div className="mt-4 md:mt-0 space-x-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-brand-600 hover:bg-brand-700">
                <Plus className="mr-2 h-4 w-4" />
                Add Event
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Event</DialogTitle>
                <DialogDescription>
                  Create a new event or schedule item for the calendar
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid w-full items-center gap-2">
                  <label htmlFor="title" className="text-sm font-medium">Title</label>
                  <Input id="title" placeholder="Event title" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid w-full items-center gap-2">
                    <label htmlFor="date" className="text-sm font-medium">Date</label>
                    <Input id="date" type="date" placeholder="Event date" />
                  </div>
                  <div className="grid w-full items-center gap-2">
                    <label htmlFor="time" className="text-sm font-medium">Time</label>
                    <Input id="time" type="time" placeholder="Event time" />
                  </div>
                </div>
                <div className="grid w-full items-center gap-2">
                  <label htmlFor="camp" className="text-sm font-medium">Camp</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select camp" />
                    </SelectTrigger>
                    <SelectContent>
                      {camps.map(camp => (
                        <SelectItem key={camp.id} value={camp.id.toString()}>
                          {camp.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid w-full items-center gap-2">
                  <label htmlFor="type" className="text-sm font-medium">Event Type</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select event type" />
                    </SelectTrigger>
                    <SelectContent>
                      {eventTypes.map((type, index) => (
                        <SelectItem key={index} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid w-full items-center gap-2">
                  <label htmlFor="description" className="text-sm font-medium">Description</label>
                  <Input id="description" placeholder="Event description" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline">Cancel</Button>
                <Button className="bg-brand-600">Create Event</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Button variant="outline">
            <CalendarIconFull className="mr-2 h-4 w-4" />
            Export Calendar
          </Button>
        </div>
      </div>
      
      {/* Filters Row */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-grow md:max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search schedule..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Select value={selectedCamp} onValueChange={setSelectedCamp}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Filter by camp" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Camps</SelectItem>
            {camps.map(camp => (
              <SelectItem key={camp.id} value={camp.id.toString()}>
                {camp.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {eventTypes.map((type, index) => (
              <SelectItem key={index} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* View Toggle */}
      <div className="mb-6">
        <Tabs 
          defaultValue={viewMode} 
          value={viewMode} 
          onValueChange={(value) => setViewMode(value as "calendar" | "agenda")}
          className="w-full"
        >
          <TabsList>
            <TabsTrigger value="calendar">Calendar View</TabsTrigger>
            <TabsTrigger value="agenda">Agenda View</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar/Schedule Panel */}
        <div className={`${viewMode === "calendar" ? "lg:col-span-2" : "lg:col-span-1"}`}>
          {viewMode === "calendar" ? (
            <Card>
              <CardContent className="p-4">
                <CalendarView 
                  selectedMonth={selectedMonth}
                  selectedYear={selectedYear}
                  camps={camps}
                  scheduleItems={scheduleItems}
                  onMonthChange={handleMonthChange}
                  onDateSelect={handleDateSelect}
                />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Camp Timeline</CardTitle>
                <CardDescription>Overview of upcoming camps and events</CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-6">
                  {camps.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()).map(camp => (
                    <div key={camp.id} className="relative pl-6 pb-4 border-l-2 border-gray-200">
                      <div className="absolute top-0 left-[-8px] w-4 h-4 rounded-full" style={{ backgroundColor: camp.primaryColor }}></div>
                      <div className="space-y-1">
                        <h3 className="font-medium">{camp.name}</h3>
                        <p className="text-sm text-gray-500">
                          {formatDate(camp.startDate)} to {formatDate(camp.endDate)}
                        </p>
                        <p className="text-sm">{camp.location}</p>
                        <Badge className={getStatusColor(camp.status)}>
                          {camp.status.charAt(0).toUpperCase() + camp.status.slice(1)}
                        </Badge>
                        <div className="text-sm text-gray-500 mt-2">
                          {camp.participants} participants • {camp.type}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* Schedule Details Panel */}
        <div className={`${viewMode === "calendar" ? "lg:col-span-1" : "lg:col-span-2"}`}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>
                {selectedDate ? formatDate(selectedDate) : "All Scheduled Events"}
              </CardTitle>
              <CardDescription>
                {selectedDate ? 
                  `${filteredScheduleItems.length} events scheduled` : 
                  "Schedule for all upcoming events"}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              {filteredScheduleItems.length > 0 ? (
                <div className="space-y-2">
                  {filteredScheduleItems
                    .sort((a, b) => {
                      // First sort by date
                      const dateComparison = new Date(a.date).getTime() - new Date(b.date).getTime();
                      if (dateComparison !== 0) return dateComparison;
                      
                      // Then sort by start time
                      const timeA = a.startTime.split(' ')[0].split(':');
                      const timeB = b.startTime.split(' ')[0].split(':');
                      
                      const hourA = parseInt(timeA[0]);
                      const hourB = parseInt(timeB[0]);
                      
                      if (hourA !== hourB) return hourA - hourB;
                      
                      const minuteA = parseInt(timeA[1]);
                      const minuteB = parseInt(timeB[1]);
                      
                      return minuteA - minuteB;
                    })
                    .map(item => (
                      <div key={item.id} className="mb-4">
                        {!selectedDate && (
                          <div className="text-sm font-medium text-gray-500 mb-2">
                            {formatDate(item.date)}
                          </div>
                        )}
                        <ScheduleItem 
                          item={item}
                          onEdit={handleEditScheduleItem}
                        />
                      </div>
                    ))
                  }
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No events scheduled for this date</p>
                  <Button>Add Event</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Edit Schedule Item Dialog */}
      {editingScheduleItem && (
        <Dialog open={true} onOpenChange={handleCloseEditDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Schedule Item</DialogTitle>
              <DialogDescription>
                Update the details for this schedule item
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid w-full items-center gap-2">
                <label htmlFor="edit-title" className="text-sm font-medium">Title</label>
                <Input id="edit-title" defaultValue={editingScheduleItem.title} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid w-full items-center gap-2">
                  <label htmlFor="edit-date" className="text-sm font-medium">Date</label>
                  <Input id="edit-date" type="date" defaultValue={editingScheduleItem.date} />
                </div>
                <div className="grid w-full items-center gap-2">
                  <label htmlFor="edit-time" className="text-sm font-medium">Start Time</label>
                  <Input id="edit-time" type="time" defaultValue={editingScheduleItem.startTime.split(' ')[0]} />
                </div>
              </div>
              <div className="grid w-full items-center gap-2">
                <label htmlFor="edit-location" className="text-sm font-medium">Location</label>
                <Input id="edit-location" defaultValue={editingScheduleItem.location} />
              </div>
              <div className="grid w-full items-center gap-2">
                <label htmlFor="edit-description" className="text-sm font-medium">Description</label>
                <Input id="edit-description" defaultValue={editingScheduleItem.description} />
              </div>
              <div className="grid w-full items-center gap-2">
                <label htmlFor="edit-status" className="text-sm font-medium">Status</label>
                <Select defaultValue={editingScheduleItem.status}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleCloseEditDialog}>Cancel</Button>
              <Button className="bg-brand-600">Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}