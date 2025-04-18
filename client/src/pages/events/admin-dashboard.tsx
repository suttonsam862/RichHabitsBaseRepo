import React, { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  CalendarIcon,
  Filter,
  Search,
  Loader2,
  Users,
  Calendar,
  DollarSign,
  Building,
  Truck,
  Clock,
  CalendarCheck,
  Download,
  FileText,
  Copy,
  BarChart3,
  TrendingUp,
  CheckCircle2,
  Pin,
  Package,
  Circle,
  MapPin,
  ArrowUpRight,
  Layers,
  AlertTriangle
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
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

// Types
interface Camp {
  id: number;
  name: string;
  type: string;
  startDate: string;
  endDate: string;
  venue: string;
  location: string;
  status: 'planning' | 'confirmed' | 'active' | 'completed' | 'cancelled';
  registrationsCount: number;
  capacity: number;
  revenue: number;
  expenses: number;
  profit: number;
  teamSize: number;
  clinician: string;
  notes?: string;
}

interface GlobalStats {
  totalCamps: number;
  upcomingCamps: number;
  totalRevenue: number;
  totalProfit: number;
  totalRegistrations: number;
  totalCapacity: number;
  occupancyRate: number;
  avgCampSize: number;
  avgTeamSize: number;
  topLocation: string;
  inventoryStatus: {
    lowStock: number;
    reorderNeeded: number;
    totalItems: number;
  };
  staffMetrics: {
    totalActive: number;
    assignmentsCompleted: number;
    assignmentsPending: number;
  };
}

interface InventoryItem {
  id: number;
  name: string;
  category: string;
  stockLevel: number;
  minStockLevel: number;
  reorderPoint: number;
  location: string;
  lastRestocked: string;
  reserved: number;
  vendor: string;
  unitPrice: number;
  totalValue: number;
}

interface StaffAssignment {
  id: number;
  staffName: string;
  role: string;
  assignedToCamps: {
    campId: number;
    campName: string;
    dates: string;
  }[];
  totalAssignments: number;
  nextAssignment?: string;
  status: 'available' | 'assigned' | 'unavailable';
}

function AdminDashboard() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [selectedCampId, setSelectedCampId] = useState<number | null>(null);
  const [newCampName, setNewCampName] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [locationFilter, setLocationFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCalendarPopover, setShowCalendarPopover] = useState(false);
  
  // Fetch all camps
  const {
    data: camps,
    isLoading: isLoadingCamps
  } = useQuery({
    queryKey: ['/api/camps'],
  });
  
  // Fetch global stats
  const {
    data: globalStats,
    isLoading: isLoadingStats
  } = useQuery({
    queryKey: ['/api/camps/stats'],
  });
  
  // Fetch inventory data
  const {
    data: inventory,
    isLoading: isLoadingInventory
  } = useQuery({
    queryKey: ['/api/inventory/global'],
  });
  
  // Fetch staff assignments
  const {
    data: staffAssignments,
    isLoading: isLoadingStaff
  } = useQuery({
    queryKey: ['/api/staff/assignments'],
  });
  
  // Handle duplicating a camp
  const handleDuplicateCamp = () => {
    if (!selectedCampId || !newCampName) {
      toast({
        title: "Error",
        description: "Please select a camp and provide a name for the new camp.",
        variant: "destructive"
      });
      return;
    }
    
    // This would be a mutation in a real app
    toast({
      title: "Camp Duplicated",
      description: `"${newCampName}" has been created as a copy of the selected camp.`,
    });
    
    setShowDuplicateDialog(false);
    setSelectedCampId(null);
    setNewCampName("");
  };
  
  // Navigate to camp detail page
  const navigateToCamp = (campId: number) => {
    window.location.href = `/events/camp-project?id=${campId}`;
  };
  
  // Export camp data (CSV)
  const handleExportCSV = () => {
    // This would handle actual CSV export in a real app
    toast({
      title: "Export Complete",
      description: "Camp data has been exported to CSV successfully.",
    });
    
    // Create a simple CSV export
    if (camps?.data) {
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += "ID,Name,Type,Start Date,End Date,Location,Status,Registrations,Capacity,Revenue,Expenses,Profit\n";
      
      camps.data.forEach((camp: Camp) => {
        csvContent += `${camp.id},${camp.name},${camp.type},${camp.startDate},${camp.endDate},${camp.location},${camp.status},${camp.registrationsCount},${camp.capacity},${camp.revenue},${camp.expenses},${camp.profit}\n`;
      });
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "rich_habits_camps_export.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };
  
  // Export camp data (PDF)
  const handleExportPDF = () => {
    // This would handle actual PDF export in a real app
    toast({
      title: "Export Complete",
      description: "Camp data has been exported to PDF successfully.",
    });
  };
  
  // Format status badge
  const formatStatusBadge = (status: string) => {
    switch (status) {
      case 'planning':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Planning</Badge>;
      case 'confirmed':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Confirmed</Badge>;
      case 'active':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Active</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-purple-100 text-purple-800">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-100 text-red-800">Cancelled</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };
  
  // Calculate days until camp
  const getDaysUntilCamp = (startDate: string): number | null => {
    const now = new Date();
    const start = new Date(startDate);
    
    if (now > start) return null;
    
    const differenceInTime = start.getTime() - now.getTime();
    const differenceInDays = Math.ceil(differenceInTime / (1000 * 3600 * 24));
    
    return differenceInDays;
  };
  
  // Calculate registration progress percentage
  const getRegistrationPercentage = (current: number, capacity: number): number => {
    if (!capacity) return 0;
    return Math.min(100, Math.round((current / capacity) * 100));
  };
  
  // Filter camps based on search, date range, location, and status
  const filteredCamps = camps?.data?.filter((camp: Camp) => {
    // Search term filter
    const matchesSearch = 
      camp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      camp.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      camp.venue.toLowerCase().includes(searchTerm.toLowerCase()) ||
      camp.type.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Date range filter
    let matchesDateRange = true;
    if (dateRange.from || dateRange.to) {
      const campStartDate = new Date(camp.startDate);
      const campEndDate = new Date(camp.endDate);
      
      if (dateRange.from && dateRange.to) {
        matchesDateRange = campStartDate >= dateRange.from && campEndDate <= dateRange.to;
      } else if (dateRange.from) {
        matchesDateRange = campStartDate >= dateRange.from;
      } else if (dateRange.to) {
        matchesDateRange = campEndDate <= dateRange.to;
      }
    }
    
    // Location filter
    const matchesLocation = locationFilter === 'all' || camp.location === locationFilter;
    
    // Status filter
    const matchesStatus = statusFilter === 'all' || camp.status === statusFilter;
    
    return matchesSearch && matchesDateRange && matchesLocation && matchesStatus;
  }) || [];
  
  // Get unique locations for filter
  const uniqueLocations = camps?.data ? 
    Array.from(new Set(camps.data.map((camp: Camp) => camp.location)))
    : [];
  
  // Extract stats for display
  const stats = globalStats?.data || {
    totalCamps: 0,
    upcomingCamps: 0,
    totalRevenue: 0,
    totalProfit: 0,
    totalRegistrations: 0,
    totalCapacity: 0,
    occupancyRate: 0,
    avgCampSize: 0,
    avgTeamSize: 0,
    topLocation: '',
    inventoryStatus: {
      lowStock: 0,
      reorderNeeded: 0,
      totalItems: 0
    },
    staffMetrics: {
      totalActive: 0,
      assignmentsCompleted: 0,
      assignmentsPending: 0
    }
  };
  
  // Extract inventory data
  const inventoryData = inventory?.data || [];
  
  // Extract staff assignment data
  const staffData = staffAssignments?.data || [];
  
  // Loading state
  if (isLoadingCamps && isLoadingStats) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Global Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive overview of all Rich Habits Camps
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={handleExportCSV}>
                <FileText className="mr-2 h-4 w-4" />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportPDF}>
                <FileText className="mr-2 h-4 w-4" />
                Export as PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button onClick={() => { window.location.href = '/events/overview'; }}>
            <Calendar className="mr-2 h-4 w-4" />
            Camp Overview
          </Button>
        </div>
      </div>
      
      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center">
              <Calendar className="mr-2 h-4 w-4 text-primary" />
              Total Camps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalCamps}
            </div>
            <div className="text-xs text-muted-foreground">
              {stats.upcomingCamps} upcoming
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center">
              <DollarSign className="mr-2 h-4 w-4 text-primary" />
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.totalRevenue)}
            </div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="mr-1 h-3 w-3" />
              {formatCurrency(stats.totalProfit)} profit
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center">
              <Users className="mr-2 h-4 w-4 text-primary" />
              Registrations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalRegistrations} / {stats.totalCapacity}
            </div>
            <div className="flex flex-col gap-1">
              <div className="text-xs text-muted-foreground">
                {stats.occupancyRate}% occupancy rate
              </div>
              <Progress value={stats.occupancyRate} className="h-1" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center">
              <Package className="mr-2 h-4 w-4 text-primary" />
              Inventory Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.inventoryStatus.totalItems}
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-yellow-600">
                {stats.inventoryStatus.lowStock} low stock
              </span>
              <span className="text-red-600">
                {stats.inventoryStatus.reorderNeeded} reorder needed
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 md:w-[600px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="staff">Staff Assignments</TabsTrigger>
          <TabsTrigger value="inventory">Global Inventory</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab - Table of all camps */}
        <TabsContent value="overview" className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="w-full flex flex-col sm:flex-row gap-4">
              <div className="relative flex-grow">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search camps..."
                  className="pl-8 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex gap-2">
                <Popover 
                  open={showCalendarPopover} 
                  onOpenChange={setShowCalendarPopover}
                >
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="flex-shrink-0">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.from ? (
                        dateRange.to ? (
                          <>
                            {formatDate(dateRange.from)} - {formatDate(dateRange.to)}
                          </>
                        ) : (
                          formatDate(dateRange.from)
                        )
                      ) : (
                        "Date Range"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange.from}
                      selected={dateRange}
                      onSelect={setDateRange}
                      numberOfMonths={2}
                    />
                    <div className="flex justify-end p-3 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setDateRange({});
                          setShowCalendarPopover(false);
                        }}
                      >
                        Clear
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
                
                <Select value={locationFilter} onValueChange={setLocationFilter}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="All Locations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    {uniqueLocations.map((location) => (
                      <SelectItem key={location} value={location}>{location}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="planning">Planning</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Button
              onClick={() => {
                setSelectedCampId(null);
                setNewCampName("");
                setShowDuplicateDialog(true);
              }}
              className="whitespace-nowrap"
            >
              <Copy className="mr-2 h-4 w-4" />
              Duplicate Camp
            </Button>
          </div>
          
          <Card>
            <CardContent className="p-0">
              {isLoadingCamps ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredCamps.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No camps found matching your criteria.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Camp Name</TableHead>
                      <TableHead>Dates</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Registrations</TableHead>
                      <TableHead>Revenue</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCamps.map((camp: Camp) => {
                      const daysUntil = getDaysUntilCamp(camp.startDate);
                      const registrationPercentage = getRegistrationPercentage(camp.registrationsCount, camp.capacity);
                      
                      return (
                        <TableRow 
                          key={camp.id}
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => navigateToCamp(camp.id)}
                        >
                          <TableCell>
                            <div className="font-medium">{camp.name}</div>
                            <div className="text-xs text-muted-foreground">{camp.type}</div>
                          </TableCell>
                          <TableCell>
                            <div>{formatDate(camp.startDate)} - {formatDate(camp.endDate)}</div>
                            {daysUntil !== null && (
                              <div className="text-xs text-muted-foreground">
                                In {daysUntil} days
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>{camp.location}</span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {camp.venue}
                            </div>
                          </TableCell>
                          <TableCell>
                            {formatStatusBadge(camp.status)}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <div className="flex justify-between text-sm">
                                <span>
                                  {camp.registrationsCount}/{camp.capacity}
                                </span>
                                <span className="text-xs">
                                  {registrationPercentage}%
                                </span>
                              </div>
                              <Progress value={registrationPercentage} className="h-1" />
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{formatCurrency(camp.revenue)}</div>
                            <div className={`text-xs ${camp.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatCurrency(camp.profit)} profit
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedCampId(camp.id);
                                setNewCampName(`${camp.name} (Copy)`);
                                setShowDuplicateDialog(true);
                              }}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Calendar Tab */}
        <TabsContent value="calendar" className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold">Events Calendar</h2>
              <p className="text-muted-foreground">
                Schedule of all upcoming and past camps
              </p>
            </div>
            <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
              <Button variant="outline">
                <Calendar className="mr-2 h-4 w-4" />
                Month
              </Button>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export Calendar
              </Button>
            </div>
          </div>
          
          <Card>
            <CardContent className="p-6">
              <div className="text-center p-12 border border-dashed rounded-lg">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Calendar View</h3>
                <p className="text-muted-foreground max-w-md mx-auto mb-6">
                  Calendar view would display all events, color-coded by status, 
                  with the ability to click on dates to see details or create new camps.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  <Badge variant="outline" className="bg-blue-100 text-blue-800">
                    <Circle className="mr-1 h-2 w-2 fill-current" /> Planning
                  </Badge>
                  <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                    <Circle className="mr-1 h-2 w-2 fill-current" /> Confirmed
                  </Badge>
                  <Badge variant="outline" className="bg-green-100 text-green-800">
                    <Circle className="mr-1 h-2 w-2 fill-current" /> Active
                  </Badge>
                  <Badge variant="outline" className="bg-purple-100 text-purple-800">
                    <Circle className="mr-1 h-2 w-2 fill-current" /> Completed
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upcoming Camps */}
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Camps</CardTitle>
                <CardDescription>
                  Next 30 days of scheduled events
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredCamps
                  .filter(camp => {
                    const daysUntil = getDaysUntilCamp(camp.startDate);
                    return daysUntil !== null && daysUntil <= 30;
                  })
                  .sort((a, b) => {
                    return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
                  })
                  .slice(0, 5)
                  .map(camp => (
                    <div 
                      key={camp.id}
                      className="flex items-center justify-between p-3 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer rounded-sm"
                      onClick={() => navigateToCamp(camp.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center 
                          ${
                            camp.status === 'active' ? 'bg-green-100' :
                            camp.status === 'confirmed' ? 'bg-yellow-100' : 'bg-blue-100'
                          }`}
                        >
                          <CalendarCheck className={`h-5 w-5 
                            ${
                              camp.status === 'active' ? 'text-green-600' :
                              camp.status === 'confirmed' ? 'text-yellow-600' : 'text-blue-600'
                            }`} 
                          />
                        </div>
                        <div>
                          <div className="font-medium">{camp.name}</div>
                          <div className="text-xs text-muted-foreground">{formatDate(camp.startDate)} - {formatDate(camp.endDate)}</div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <Badge variant="outline" className={
                          camp.status === 'active' ? 'bg-green-100 text-green-800' :
                          camp.status === 'confirmed' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                        }>
                          {camp.status.charAt(0).toUpperCase() + camp.status.slice(1)}
                        </Badge>
                        <div className="text-xs text-muted-foreground mt-1">
                          {getDaysUntilCamp(camp.startDate)} days left
                        </div>
                      </div>
                    </div>
                  ))
                }
                
                {filteredCamps.filter(camp => {
                  const daysUntil = getDaysUntilCamp(camp.startDate);
                  return daysUntil !== null && daysUntil <= 30;
                }).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No upcoming camps in the next 30 days.</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Schedule Conflicts */}
            <Card>
              <CardHeader>
                <CardTitle>Resource Overlaps</CardTitle>
                <CardDescription>
                  Camps that share staff or resources
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex justify-between mb-2">
                      <h3 className="font-medium">Staff Overlaps</h3>
                      <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                        3 identified
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      The following staff members are assigned to overlapping camps:
                    </p>
                    <div className="space-y-2">
                      <div className="text-sm flex justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback>JD</AvatarFallback>
                          </Avatar>
                          <span>John Doe</span>
                        </div>
                        <span className="text-muted-foreground">2 overlapping camps</span>
                      </div>
                      <div className="text-sm flex justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback>AS</AvatarFallback>
                          </Avatar>
                          <span>Amy Smith</span>
                        </div>
                        <span className="text-muted-foreground">1 overlapping camp</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex justify-between mb-2">
                      <h3 className="font-medium">Venue Overlaps</h3>
                      <Badge variant="outline" className="bg-blue-100 text-blue-800">
                        1 identified
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      The following venues have multiple camps scheduled:
                    </p>
                    <div className="space-y-2">
                      <div className="text-sm flex justify-between">
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-blue-600" />
                          <span>Main Gym - Austin</span>
                        </div>
                        <span className="text-muted-foreground">Dates: Jun 15-18</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Staff Assignments Tab */}
        <TabsContent value="staff" className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold">Staff Assignments</h2>
              <p className="text-muted-foreground">
                Track and manage staff across all camps
              </p>
            </div>
            <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export Assignments
              </Button>
              <Button>
                <Users className="mr-2 h-4 w-4" />
                Staff Directory
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center">
                  <Users className="mr-2 h-4 w-4 text-primary" />
                  Total Active Staff
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.staffMetrics.totalActive}
                </div>
                <div className="text-xs text-muted-foreground">
                  Across all camps and roles
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center">
                  <CheckCircle2 className="mr-2 h-4 w-4 text-primary" />
                  Assignments Completed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.staffMetrics.assignmentsCompleted}
                </div>
                <div className="text-xs text-muted-foreground">
                  {stats.staffMetrics.assignmentsPending} pending
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center">
                  <BarChart3 className="mr-2 h-4 w-4 text-primary" />
                  Avg Team Size
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.avgTeamSize}
                </div>
                <div className="text-xs text-muted-foreground">
                  Staff members per camp
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardContent className="p-0">
              {isLoadingStaff ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : staffData.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No staff assignments found.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Staff Member</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Current Assignments</TableHead>
                      <TableHead>Next Assignment</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staffData.map((staff: StaffAssignment) => (
                      <TableRow key={staff.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback>
                                {staff.staffName.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{staff.staffName}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-gray-100">
                            {staff.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <span>{staff.totalAssignments}</span>
                            {staff.assignedToCamps.length > 0 && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-6 w-6">
                                    <ArrowUpRight className="h-3 w-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  <DropdownMenuLabel>Assigned Camps</DropdownMenuLabel>
                                  {staff.assignedToCamps.map(camp => (
                                    <DropdownMenuItem 
                                      key={camp.campId}
                                      onClick={() => navigateToCamp(camp.campId)}
                                    >
                                      <Calendar className="mr-2 h-4 w-4" />
                                      {camp.campName}
                                      <span className="ml-2 text-xs text-muted-foreground">
                                        {camp.dates}
                                      </span>
                                    </DropdownMenuItem>
                                  ))}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {staff.nextAssignment || 'None scheduled'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={
                            staff.status === 'available' ? 'bg-green-100 text-green-800' :
                            staff.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }>
                            {staff.status.charAt(0).toUpperCase() + staff.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Inventory Tab */}
        <TabsContent value="inventory" className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold">Global Inventory</h2>
              <p className="text-muted-foreground">
                Track supplies and equipment across all camps
              </p>
            </div>
            <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Button>
                <Truck className="mr-2 h-4 w-4" />
                Manage Vendors
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="bg-green-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center">
                  <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                  In Stock Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-700">
                  {inventoryData.filter((item: InventoryItem) => 
                    item.stockLevel > item.reorderPoint
                  ).length}
                </div>
                <div className="text-xs text-green-700">
                  Healthy inventory levels
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-yellow-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center">
                  <Clock className="mr-2 h-4 w-4 text-yellow-600" />
                  Low Stock Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-700">
                  {inventoryData.filter((item: InventoryItem) => 
                    item.stockLevel <= item.reorderPoint && item.stockLevel > item.minStockLevel
                  ).length}
                </div>
                <div className="text-xs text-yellow-700">
                  Below reorder point
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-red-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center">
                  <AlertTriangle className="mr-2 h-4 w-4 text-red-600" />
                  Critical Stock Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-700">
                  {inventoryData.filter((item: InventoryItem) => 
                    item.stockLevel <= item.minStockLevel
                  ).length}
                </div>
                <div className="text-xs text-red-700">
                  Immediate reorder required
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardContent className="p-0">
              {isLoadingInventory ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : inventoryData.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No inventory items found.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Stock Level</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventoryData.map((item: InventoryItem) => {
                      const stockStatus = 
                        item.stockLevel <= item.minStockLevel ? 'critical' : 
                        item.stockLevel <= item.reorderPoint ? 'low' : 'good';
                      
                      return (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="font-medium">{item.name}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-gray-100">
                              {item.category}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className={
                                stockStatus === 'critical' ? 'text-red-600 font-medium' :
                                stockStatus === 'low' ? 'text-yellow-600 font-medium' :
                                'font-medium'
                              }>
                                {item.stockLevel}
                              </span>
                              <Badge variant="outline" className={
                                stockStatus === 'critical' ? 'bg-red-100 text-red-800' :
                                stockStatus === 'low' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }>
                                {stockStatus === 'critical' ? 'Critical' :
                                 stockStatus === 'low' ? 'Low' : 'Good'}
                              </Badge>
                            </div>
                            {item.reserved > 0 && (
                              <div className="text-xs text-muted-foreground">
                                {item.reserved} reserved
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Pin className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>{item.location}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>{formatCurrency(item.totalValue)}</div>
                            <div className="text-xs text-muted-foreground">
                              @ {formatCurrency(item.unitPrice)} each
                            </div>
                          </TableCell>
                          <TableCell>
                            {item.vendor}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">
                              {stockStatus === 'critical' || stockStatus === 'low' ? 'Reorder' : 'View'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Inventory by Category */}
            <Card>
              <CardHeader>
                <CardTitle>Inventory by Category</CardTitle>
                <CardDescription>Distribution of items by category</CardDescription>
              </CardHeader>
              <CardContent className="h-64 flex items-center justify-center">
                <div className="text-center">
                  <Layers className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Category Breakdown</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    A pie chart would display inventory distribution by category.
                  </p>
                </div>
              </CardContent>
            </Card>
            
            {/* Inventory Value Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Inventory Value Trends</CardTitle>
                <CardDescription>Historical inventory value over time</CardDescription>
              </CardHeader>
              <CardContent className="h-64 flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Value Trend</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    A line chart would display inventory value trends over time.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Duplicate Camp Dialog */}
      <Dialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Duplicate Camp</DialogTitle>
            <DialogDescription>
              Create a new camp using an existing one as a template.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="template-camp">Template Camp</Label>
              <Select 
                value={selectedCampId?.toString() || ""} 
                onValueChange={(value) => {
                  const campId = parseInt(value);
                  setSelectedCampId(campId);
                  
                  // Auto-set the name based on the selected camp
                  const selectedCamp = camps?.data?.find((c: Camp) => c.id === campId);
                  if (selectedCamp) {
                    setNewCampName(`${selectedCamp.name} (Copy)`);
                  }
                }}
              >
                <SelectTrigger id="template-camp">
                  <SelectValue placeholder="Select a camp to duplicate" />
                </SelectTrigger>
                <SelectContent>
                  {camps?.data?.map((camp: Camp) => (
                    <SelectItem key={camp.id} value={camp.id.toString()}>
                      {camp.name} ({formatDate(camp.startDate)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="new-camp-name">New Camp Name</Label>
              <Input
                id="new-camp-name"
                value={newCampName}
                onChange={(e) => setNewCampName(e.target.value)}
                placeholder="Enter name for the new camp"
              />
            </div>
            
            <div className="space-y-2">
              <Label>What to Include</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="flex items-center space-x-2">
                  <Checkbox id="include-schedule" defaultChecked />
                  <Label htmlFor="include-schedule">Schedule & Agenda</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="include-staff" defaultChecked />
                  <Label htmlFor="include-staff">Staff Assignments</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="include-venue" defaultChecked />
                  <Label htmlFor="include-venue">Venue Setup</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="include-swag" defaultChecked />
                  <Label htmlFor="include-swag">Swag & Equipment</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="include-marketing" defaultChecked />
                  <Label htmlFor="include-marketing">Marketing Content</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="include-registrations" />
                  <Label htmlFor="include-registrations">Registrations</Label>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDuplicateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleDuplicateCamp}>
              <Copy className="mr-2 h-4 w-4" />
              Duplicate Camp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminDashboard;