import React, { useState, useEffect, useRef } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronLeft,
  Plus,
  Search,
  Loader2,
  Calendar,
  Clock,
  Edit,
  Trash2,
  Save,
  PlusCircle,
  ArrowLeft,
  ArrowRight,
  Clipboard,
  ClipboardPaste,
  Download,
  Upload,
  CalendarDays,
  CheckCircle2,
  AlertCircle,
  Users,
  MapPin,
  FileText,
  Copy,
  Layers,
  LucideGripVertical as GripVertical,
  MoreHorizontal,
  Filter
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { ScrollableDialogContent } from "@/components/ui/scrollable-dialog-content";
import { StaffSelector } from "@/components/staff-selector";
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDate } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Types
interface AgendaItem {
  id: number;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  day: number;
  location?: string;
  locationId?: number;
  clinicianId?: number;
  clinician?: Clinician;
  sessionType: SessionType;
  capacity?: number;
  materials?: string;
  notes?: string;
  status: 'draft' | 'scheduled' | 'completed' | 'cancelled';
  color?: string;
  staffAssignments?: StaffMember[];
}

interface StaffMember {
  id: number;
  name: string;
  role?: string;
  email?: string;
  phone?: string;
}

interface AgendaDay {
  day: number;
  date: string;
  title: string;
  items: AgendaItem[] | undefined;
}

interface Clinician {
  id: number;
  name: string;
  email?: string;
  role?: string;
  specialization?: string;
  avatar?: string;
}

interface Location {
  id: number;
  name: string;
  capacity?: number;
  type?: string;
  notes?: string;
}

type SessionType = 
  | 'opening'
  | 'instruction'
  | 'drill'
  | 'scrimmage'
  | 'evaluation'
  | 'break'
  | 'meal'
  | 'lecture'
  | 'activity'
  | 'other';

function AgendaBuilder() {
  const [location, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const campId = searchParams.get('id');
  
  // If no campId is provided, redirect to camps overview
  useEffect(() => {
    if (!campId) {
      setLocation('/events/camps');
      toast({
        title: "Missing camp information",
        description: "Please select a camp to manage its agenda.",
        variant: "destructive"
      });
    }
  }, [campId, setLocation]);
  
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("0"); // Default to first day
  const [activeViewMode, setActiveViewMode] = useState<'timeline' | 'list'>('timeline');
  const [showAddSession, setShowAddSession] = useState(false);
  const [showEditSession, setShowEditSession] = useState(false);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [draggedSession, setDraggedSession] = useState<AgendaItem | null>(null);
  const [selectedSession, setSelectedSession] = useState<AgendaItem | null>(null);
  const [showCopyOptions, setShowCopyOptions] = useState(false);
  const [copyToDays, setCopyToDays] = useState<number[]>([]);
  const [filterSessionType, setFilterSessionType] = useState<string>('all');
  const [filterClinician, setFilterClinician] = useState<number | null>(null);
  const [filterLocation, setFilterLocation] = useState<number | null>(null);
  
  const [newSession, setNewSession] = useState<Partial<AgendaItem>>({
    title: '',
    description: '',
    startTime: '08:00',
    endTime: '09:00',
    day: 1,
    sessionType: 'instruction',
    status: 'draft'
  });
  
  // Fetch camp details
  const { 
    data: camp, 
    isLoading: isLoadingCamp,
    isError: isCampError
  } = useQuery({
    queryKey: ['/api/camps', campId],
    enabled: !!campId,
  });
  
  // Fetch agenda
  const {
    data: agenda,
    isLoading: isLoadingAgenda
  } = useQuery({
    queryKey: ['/api/camps', campId, 'agenda'],
    enabled: !!campId,
  });
  
  // Fetch clinicians
  const {
    data: clinicians,
    isLoading: isLoadingClinicians
  } = useQuery({
    queryKey: ['/api/camps', campId, 'clinicians'],
    enabled: !!campId,
  });
  
  // Fetch locations
  const {
    data: locations,
    isLoading: isLoadingLocations
  } = useQuery({
    queryKey: ['/api/camps', campId, 'locations'],
    enabled: !!campId,
  });
  
  // Add session mutation
  const addSessionMutation = useMutation({
    mutationFn: async (sessionData: Partial<AgendaItem>) => {
      const response = await apiRequest(
        "POST",
        `/api/camps/${campId}/agenda`,
        sessionData
      );
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Session added",
        description: "The session has been added to the agenda."
      });
      
      // Force a complete refetch of the agenda data
      queryClient.invalidateQueries({
        queryKey: ['/api/camps', campId, 'agenda']
      });
      
      // Also invalidate the related queries to ensure all data is fresh
      queryClient.invalidateQueries({
        queryKey: ['/api/camps', campId]
      });
      
      // Wait a moment for the backend to process before closing the dialog
      setTimeout(() => {
        setShowAddSession(false);
        resetNewSession();
      }, 300);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add session",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Update session mutation
  const updateSessionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<AgendaItem> }) => {
      const response = await apiRequest(
        "PUT",
        `/api/camps/${campId}/agenda/${id}`,
        data
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Session updated",
        description: "The session has been updated successfully."
      });
      
      // Force a complete refetch of the agenda data
      queryClient.invalidateQueries({
        queryKey: ['/api/camps', campId, 'agenda']
      });
      
      // Also invalidate the related queries to ensure all data is fresh
      queryClient.invalidateQueries({
        queryKey: ['/api/camps', campId]
      });
      
      // Short timeout to ensure state updates after data refetch
      setTimeout(() => {
        setShowEditSession(false);
        setEditingItemId(null);
      }, 300);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update session",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Delete session mutation
  const deleteSessionMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest(
        "DELETE",
        `/api/camps/${campId}/agenda/${id}`,
        {}
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Session deleted",
        description: "The session has been removed from the agenda."
      });
      
      // Force a complete refetch of the agenda data
      queryClient.invalidateQueries({
        queryKey: ['/api/camps', campId, 'agenda']
      });
      
      // Also invalidate the related queries to ensure all data is fresh
      queryClient.invalidateQueries({
        queryKey: ['/api/camps', campId]
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete session",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Copy session mutation
  const copySessionMutation = useMutation({
    mutationFn: async ({ id, days }: { id: number, days: number[] }) => {
      const response = await apiRequest(
        "POST",
        `/api/camps/${campId}/agenda/${id}/copy`,
        { days }
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Session copied",
        description: "The session has been copied to selected days."
      });
      
      // Force a complete refetch of the agenda data
      queryClient.invalidateQueries({
        queryKey: ['/api/camps', campId, 'agenda']
      });
      
      // Also invalidate the related queries to ensure all data is fresh
      queryClient.invalidateQueries({
        queryKey: ['/api/camps', campId]
      });
      
      // Short timeout to ensure UI updates after data refetch
      setTimeout(() => {
        setShowCopyOptions(false);
        setCopyToDays([]);
      }, 300);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to copy session",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Export agenda mutation
  const exportAgendaMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(
        "GET",
        `/api/camps/${campId}/agenda/export`,
        {}
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Agenda exported",
        description: "The agenda has been exported successfully."
      });
      
      try {
        // Create a simple export
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Day,Date,Start Time,End Time,Title,Type,Location,Clinician,Additional Staff,Status\n";
        
        let sessionCount = 0;
        
        if (agenda?.data && Array.isArray(agenda.data)) {
          agenda.data.forEach((day: AgendaDay) => {
            if (day && day.items && Array.isArray(day.items)) {
              day.items.forEach((item: AgendaItem) => {
                if (!item) return; // Skip undefined items
                
                const clinician = clinicians?.data?.find((c: Clinician) => c.id === item.clinicianId)?.name || '';
                const location = locations?.data?.find((l: Location) => l.id === item.locationId)?.name || '';
                
                // Get staff assignments as comma-separated names
                const staffNames = item.staffAssignments && item.staffAssignments.length > 0 
                  ? item.staffAssignments.map(staff => staff.name).join(", ")
                  : '';
                
                // Escape quotes in text fields to prevent CSV issues
                const escapedTitle = item.title ? item.title.replace(/"/g, '""') : '';
                const escapedStaffNames = staffNames.replace(/"/g, '""');
                
                // Format each field properly for CSV
                csvContent += `${day.day || ''},`;
                csvContent += `"${day.date || ''}",`;
                csvContent += `"${item.startTime || ''}",`;
                csvContent += `"${item.endTime || ''}",`;
                csvContent += `"${escapedTitle}",`;
                csvContent += `"${item.sessionType || ''}",`;
                csvContent += `"${location}",`;
                csvContent += `"${clinician}",`;
                csvContent += `"${escapedStaffNames}",`;
                csvContent += `"${item.status || ''}"\n`;
                
                sessionCount++;
              });
            }
          });
        }
        
        if (sessionCount === 0) {
          toast({
            title: "Export failed",
            description: "No sessions found to export.",
            variant: "destructive"
          });
          return;
        }
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `agenda_camp_${campId || 'unknown'}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({
          title: "Export successful",
          description: `Exported ${sessionCount} sessions to CSV file.`
        });
      } catch (error) {
        console.error("Export error:", error);
        toast({
          title: "Export failed",
          description: error instanceof Error ? error.message : "An unknown error occurred during export.",
          variant: "destructive"
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to export agenda",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Reset new session form
  const resetNewSession = () => {
    setNewSession({
      title: '',
      description: '',
      startTime: '08:00',
      endTime: '09:00',
      day: parseInt(activeTab, 10) + 1,
      sessionType: 'instruction',
      status: 'draft',
      staffAssignments: [] // Initialize with an empty array for staff assignments
    });
  };
  
  // Handle adding session
  const handleAddSession = () => {
    // Validate required fields
    if (!newSession.title || newSession.title.trim() === '') {
      toast({
        title: "Missing information",
        description: "Please provide a title for the session.",
        variant: "destructive"
      });
      return;
    }
    
    if (!newSession.startTime) {
      toast({
        title: "Missing information",
        description: "Please provide a start time for the session.",
        variant: "destructive"
      });
      return;
    }
    
    if (!newSession.endTime) {
      toast({
        title: "Missing information",
        description: "Please provide an end time for the session.",
        variant: "destructive"
      });
      return;
    }
    
    // Validate that endTime is after startTime
    if (newSession.startTime >= newSession.endTime) {
      toast({
        title: "Invalid time range",
        description: "End time must be after start time.",
        variant: "destructive"
      });
      return;
    }
    
    // Validate that sessionType is valid
    if (!newSession.sessionType) {
      toast({
        title: "Missing information",
        description: "Please select a session type.",
        variant: "destructive"
      });
      return;
    }
    
    addSessionMutation.mutate(newSession);
  };
  
  // Handle updating session
  const handleUpdateSession = () => {
    // Validate all required data is present
    if (!selectedSession) {
      toast({
        title: "Error updating session",
        description: "No session data to update.",
        variant: "destructive"
      });
      return;
    }
    
    if (!selectedSession.id) {
      toast({
        title: "Error updating session",
        description: "Session ID is missing.",
        variant: "destructive"
      });
      return;
    }
    
    // Validate required fields
    if (!selectedSession.title || selectedSession.title.trim() === '') {
      toast({
        title: "Error updating session",
        description: "Session title cannot be empty.",
        variant: "destructive"
      });
      return;
    }
    
    if (!selectedSession.startTime) {
      toast({
        title: "Error updating session",
        description: "Start time is required.",
        variant: "destructive"
      });
      return;
    }
    
    if (!selectedSession.endTime) {
      toast({
        title: "Error updating session",
        description: "End time is required.",
        variant: "destructive"
      });
      return;
    }
    
    // Validate that endTime is after startTime
    if (selectedSession.startTime >= selectedSession.endTime) {
      toast({
        title: "Invalid time range",
        description: "End time must be after start time.",
        variant: "destructive"
      });
      return;
    }
    
    updateSessionMutation.mutate({
      id: selectedSession.id,
      data: selectedSession
    });
  };
  
  // Handle deleting session
  const handleDeleteSession = (id: number) => {
    if (!id) {
      toast({
        title: "Error deleting session",
        description: "Invalid session ID.",
        variant: "destructive"
      });
      return;
    }
    
    // Find the session to include details in the confirmation message
    const sessionToDelete = agendaData
      .flatMap(day => day.items || [])
      .find(item => item?.id === id);
    
    const confirmMessage = sessionToDelete 
      ? `Are you sure you want to delete "${sessionToDelete.title}" (${sessionToDelete.startTime} - ${sessionToDelete.endTime})?`
      : "Are you sure you want to delete this session?";
    
    if (window.confirm(confirmMessage)) {
      deleteSessionMutation.mutate(id);
    }
  };
  
  // Handle edit session click
  const handleEditSession = (session: AgendaItem) => {
    if (!session) {
      toast({
        title: "Error editing session",
        description: "Invalid session data.",
        variant: "destructive"
      });
      return;
    }
    
    if (!session.id) {
      toast({
        title: "Error editing session",
        description: "Session ID is missing.",
        variant: "destructive"
      });
      return;
    }
    
    setSelectedSession(session);
    setEditingItemId(session.id);
    setShowEditSession(true);
  };
  
  // Handle copy session
  const handleCopySession = (session: AgendaItem) => {
    if (!session) {
      toast({
        title: "Error preparing copy",
        description: "Invalid session data.",
        variant: "destructive"
      });
      return;
    }
    
    // Reset the copy days selection when opening the dialog
    setCopyToDays([]);
    setSelectedSession(session);
    setShowCopyOptions(true);
  };
  
  // Handle copy session to days
  const handleCopyToDays = () => {
    // Validate that we have all the required data before proceeding
    if (!selectedSession) {
      toast({
        title: "Error copying session",
        description: "No session selected to copy.",
        variant: "destructive"
      });
      return;
    }
    
    if (!selectedSession.id) {
      toast({
        title: "Error copying session",
        description: "Session ID is missing.",
        variant: "destructive"
      });
      return;
    }
    
    if (copyToDays.length === 0) {
      toast({
        title: "Error copying session",
        description: "Please select at least one day to copy to.",
        variant: "destructive"
      });
      return;
    }
    
    copySessionMutation.mutate({
      id: selectedSession.id,
      days: copyToDays
    });
  };
  
  // Handle export agenda
  const handleExportAgenda = () => {
    // Check if there's agenda data to export
    if (!agenda?.data || agenda.data.length === 0) {
      toast({
        title: "Nothing to export",
        description: "There are no agenda items to export.",
        variant: "destructive"
      });
      return;
    }
    
    // Count total sessions
    const totalSessions = agenda.data.reduce((count, day) => {
      return count + (day.items?.length || 0);
    }, 0);
    
    if (totalSessions === 0) {
      toast({
        title: "Nothing to export",
        description: "There are no sessions in the agenda to export.",
        variant: "destructive"
      });
      return;
    }
    
    // Proceed with export
    toast({
      title: "Preparing export",
      description: `Exporting ${totalSessions} sessions from the agenda.`
    });
    
    exportAgendaMutation.mutate();
  };
  
  // Initialize new session when active tab changes
  useEffect(() => {
    if (activeTab) {
      setNewSession(prev => ({
        ...prev,
        day: parseInt(activeTab, 10) + 1
      }));
    }
  }, [activeTab]);
  
  // Toggle day selection for copying
  const toggleDaySelection = (day: number) => {
    setCopyToDays(prev => {
      if (prev.includes(day)) {
        return prev.filter(d => d !== day);
      } else {
        return [...prev, day];
      }
    });
  };
  
  // Get session type display name
  const getSessionTypeDisplayName = (type: SessionType): string => {
    switch (type) {
      case 'opening': return 'Opening Session';
      case 'instruction': return 'Instruction';
      case 'drill': return 'Drill';
      case 'scrimmage': return 'Scrimmage';
      case 'evaluation': return 'Evaluation';
      case 'break': return 'Break';
      case 'meal': return 'Meal';
      case 'lecture': return 'Lecture';
      case 'activity': return 'Activity';
      case 'other': return 'Other';
      default: return 'Unknown';
    }
  };
  
  // Get session type badge color
  const getSessionTypeBadgeClass = (type: SessionType): string => {
    switch (type) {
      case 'opening': return 'bg-purple-100 text-purple-800';
      case 'instruction': return 'bg-blue-100 text-blue-800';
      case 'drill': return 'bg-green-100 text-green-800';
      case 'scrimmage': return 'bg-orange-100 text-orange-800';
      case 'evaluation': return 'bg-red-100 text-red-800';
      case 'break': return 'bg-gray-100 text-gray-800';
      case 'meal': return 'bg-yellow-100 text-yellow-800';
      case 'lecture': return 'bg-indigo-100 text-indigo-800';
      case 'activity': return 'bg-pink-100 text-pink-800';
      case 'other': return 'bg-slate-100 text-slate-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Get status badge
  const getStatusBadge = (status: 'draft' | 'scheduled' | 'completed' | 'cancelled') => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Draft</Badge>;
      case 'scheduled':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Scheduled</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-100 text-red-800">Cancelled</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };
  
  // Filter sessions by type, clinician, location
  const filterSessions = (items: AgendaItem[] | undefined) => {
    if (!items || !Array.isArray(items)) {
      return [];
    }
    
    return items.filter(item => {
      if (!item) return false;
      
      // Ensure consistent handling of 'all' values in filter criteria
      const matchesType = filterSessionType === 'all' || item.sessionType === filterSessionType;
      const matchesClinician = !filterClinician || filterClinician === 0 || item.clinicianId === filterClinician;
      const matchesLocation = !filterLocation || filterLocation === 0 || item.locationId === filterLocation;
      
      return matchesType && matchesClinician && matchesLocation;
    });
  };
  
  // If loading or error
  if (isLoadingCamp || isLoadingAgenda) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  if (isCampError || !camp) {
    return (
      <div className="p-4">
        <Button variant="outline" onClick={() => setLocation('/events/overview')}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Camps
        </Button>
        <div className="mt-4 p-4 border rounded-md bg-red-50">
          <h2 className="text-lg font-semibold text-red-800">Error Loading Camp</h2>
          <p className="text-red-600">Unable to load camp details. Please try again later.</p>
        </div>
      </div>
    );
  }
  
  const campData = camp.data;
  const agendaData = agenda?.data || [];
  
  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="flex items-center mb-4">
        <Button variant="outline" onClick={() => setLocation(`/events/overview`)}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Camps
        </Button>
        <h1 className="text-2xl font-bold ml-4">Agenda Builder</h1>
        <div className="ml-auto flex items-center space-x-2">
          <Button 
            variant="secondary"
            onClick={handleExportAgenda}
          >
            <Download className="h-4 w-4 mr-2" />
            Export Agenda
          </Button>
          
          <Button onClick={() => {
            resetNewSession();
            setShowAddSession(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Session
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{campData.name} - Agenda</CardTitle>
              <CardDescription>
                {campData.startDate && campData.endDate 
                  ? `${formatDate(campData.startDate)} to ${formatDate(campData.endDate)}`
                  : 'Dates not set'
                }
                {campData.location && ` • ${campData.location}`}
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <div className="border rounded-md p-1">
                <Button
                  size="sm"
                  variant={activeViewMode === 'timeline' ? 'default' : 'ghost'}
                  onClick={() => setActiveViewMode('timeline')}
                  className="px-3"
                >
                  <Layers className="h-4 w-4 mr-2" />
                  Timeline
                </Button>
                <Button
                  size="sm"
                  variant={activeViewMode === 'list' ? 'default' : 'ghost'}
                  onClick={() => setActiveViewMode('list')}
                  className="px-3"
                >
                  <Clipboard className="h-4 w-4 mr-2" />
                  List
                </Button>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  <DropdownMenuLabel>Filter Sessions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  <div className="p-2">
                    <Label className="text-xs">Session Type</Label>
                    <Select
                      value={filterSessionType}
                      onValueChange={setFilterSessionType}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="All Types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="opening">Opening Session</SelectItem>
                        <SelectItem value="instruction">Instruction</SelectItem>
                        <SelectItem value="drill">Drill</SelectItem>
                        <SelectItem value="scrimmage">Scrimmage</SelectItem>
                        <SelectItem value="evaluation">Evaluation</SelectItem>
                        <SelectItem value="break">Break</SelectItem>
                        <SelectItem value="meal">Meal</SelectItem>
                        <SelectItem value="lecture">Lecture</SelectItem>
                        <SelectItem value="activity">Activity</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="p-2">
                    <Label className="text-xs">Clinician</Label>
                    <Select
                      value={filterClinician?.toString() || 'all'}
                      onValueChange={(val) => setFilterClinician(val && val !== 'all' ? parseInt(val, 10) : null)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="All Clinicians" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Clinicians</SelectItem>
                        {clinicians?.data?.map((clinician: Clinician) => (
                          <SelectItem key={clinician.id} value={clinician.id.toString()}>
                            {clinician.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="p-2">
                    <Label className="text-xs">Location</Label>
                    <Select
                      value={filterLocation?.toString() || 'all'}
                      onValueChange={(val) => setFilterLocation(val && val !== 'all' ? parseInt(val, 10) : null)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="All Locations" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Locations</SelectItem>
                        {locations?.data?.map((location: Location) => (
                          <SelectItem key={location.id} value={location.id.toString()}>
                            {location.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => {
                    setFilterSessionType('all');
                    setFilterClinician(null);
                    setFilterLocation(null);
                  }}>
                    Reset Filters
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs 
            value={activeTab} 
            onValueChange={setActiveTab} 
            className="mt-4"
          >
            <TabsList className="grid grid-cols-5 mb-4">
              {agendaData.map((day: AgendaDay, index: number) => (
                <TabsTrigger key={index} value={index.toString()}>
                  Day {day.day}
                  <span className="ml-2 text-xs text-gray-500">
                    {day.date && formatDate(day.date)}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
            
            {agendaData.map((day: AgendaDay, index: number) => (
              <TabsContent key={index} value={index.toString()}>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Day {day.day}: {day.title}
                      <span className="ml-2 text-sm font-normal text-gray-500">
                        {day.date && formatDate(day.date)}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {activeViewMode === 'timeline' ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-12 gap-4">
                          <div className="col-span-1 font-medium text-gray-500 text-sm">Time</div>
                          <div className="col-span-4 font-medium text-gray-500 text-sm">Session</div>
                          <div className="col-span-2 font-medium text-gray-500 text-sm">Type</div>
                          <div className="col-span-2 font-medium text-gray-500 text-sm">Location</div>
                          <div className="col-span-2 font-medium text-gray-500 text-sm">Clinician</div>
                          <div className="col-span-1 font-medium text-gray-500 text-sm">Actions</div>
                        </div>
                        
                        {filterSessions(day.items).length > 0 ? (
                          filterSessions(day.items)
                            .sort((a, b) => a.startTime.localeCompare(b.startTime))
                            .map((session: AgendaItem) => (
                              <div 
                                key={session.id} 
                                className="grid grid-cols-12 gap-4 p-2 rounded-md hover:bg-gray-50 border-b"
                              >
                                <div className="col-span-1 flex items-center">
                                  <Clock className="h-4 w-4 mr-1 text-gray-400" />
                                  <span className="text-sm">
                                    {session.startTime} - {session.endTime}
                                  </span>
                                </div>
                                
                                <div className="col-span-4 flex items-center">
                                  <div>
                                    <div className="font-medium">{session.title}</div>
                                    {session.description && (
                                      <div className="text-sm text-gray-500">{session.description}</div>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="col-span-2 flex items-center">
                                  <Badge variant="outline" className={getSessionTypeBadgeClass(session.sessionType)}>
                                    {getSessionTypeDisplayName(session.sessionType)}
                                  </Badge>
                                </div>
                                
                                <div className="col-span-2 flex items-center">
                                  {session.locationId ? (
                                    <div className="flex items-center">
                                      <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                                      <span className="text-sm">
                                        {locations?.data?.find((l: Location) => l.id === session.locationId)?.name || 'Unknown'}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-sm text-gray-400">No location</span>
                                  )}
                                </div>
                                
                                <div className="col-span-2 flex items-center">
                                  <div className="flex flex-col">
                                    {session.clinicianId ? (
                                      <div className="flex items-center">
                                        <Avatar className="h-6 w-6 mr-2">
                                          <AvatarFallback>
                                            {clinicians?.data?.find((c: Clinician) => c.id === session.clinicianId)?.name?.charAt(0) || '?'}
                                          </AvatarFallback>
                                        </Avatar>
                                        <span className="text-sm">
                                          {clinicians?.data?.find((c: Clinician) => c.id === session.clinicianId)?.name || 'Unknown'}
                                        </span>
                                      </div>
                                    ) : (
                                      <span className="text-sm text-gray-400">No clinician</span>
                                    )}
                                    
                                    {session.staffAssignments && session.staffAssignments.length > 0 && (
                                      <div className="mt-1 pl-8">
                                        <div className="flex items-center">
                                          <Users className="h-3 w-3 mr-1 text-gray-400" />
                                          <span className="text-xs text-gray-600">
                                            +{session.staffAssignments.length} staff
                                          </span>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="col-span-1 flex items-center space-x-1">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => handleEditSession(session)}>
                                        <Edit className="h-4 w-4 mr-2" />
                                        Edit Session
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleCopySession(session)}>
                                        <Copy className="h-4 w-4 mr-2" />
                                        Copy to Other Days
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem 
                                        onClick={() => handleDeleteSession(session.id)}
                                        className="text-red-600"
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>
                            ))
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                            <p>No sessions scheduled for this day.</p>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="mt-2"
                              onClick={() => {
                                resetNewSession();
                                setShowAddSession(true);
                              }}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Session
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Time</TableHead>
                            <TableHead>Title</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Clinician</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filterSessions(day.items).length > 0 ? (
                            filterSessions(day.items)
                              .sort((a, b) => a.startTime.localeCompare(b.startTime))
                              .map((session: AgendaItem) => (
                                <TableRow key={session.id}>
                                  <TableCell>
                                    <div className="font-medium">
                                      {session.startTime} - {session.endTime}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="font-medium">{session.title}</div>
                                    {session.description && (
                                      <div className="text-sm text-gray-500">{session.description}</div>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className={getSessionTypeBadgeClass(session.sessionType)}>
                                      {getSessionTypeDisplayName(session.sessionType)}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    {session.locationId ? (
                                      locations?.data?.find((l: Location) => l.id === session.locationId)?.name || 'Unknown'
                                    ) : (
                                      <span className="text-gray-400">-</span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex flex-col">
                                      {session.clinicianId ? (
                                        <div className="text-sm font-medium">
                                          {clinicians?.data?.find((c: Clinician) => c.id === session.clinicianId)?.name || 'Unknown'}
                                        </div>
                                      ) : (
                                        <span className="text-gray-400">-</span>
                                      )}
                                      
                                      {session.staffAssignments && session.staffAssignments.length > 0 && (
                                        <div className="mt-1">
                                          <div className="flex items-center">
                                            <Users className="h-3 w-3 mr-1 text-gray-400" />
                                            <span className="text-xs text-gray-600">
                                              +{session.staffAssignments.length} staff
                                            </span>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    {getStatusBadge(session.status)}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                          <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => handleEditSession(session)}>
                                          <Edit className="h-4 w-4 mr-2" />
                                          Edit Session
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleCopySession(session)}>
                                          <Copy className="h-4 w-4 mr-2" />
                                          Copy to Other Days
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem 
                                          onClick={() => handleDeleteSession(session.id)}
                                          className="text-red-600"
                                        >
                                          <Trash2 className="h-4 w-4 mr-2" />
                                          Delete
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </TableCell>
                                </TableRow>
                              ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={7} className="h-24 text-center">
                                <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                                <p className="text-gray-500">No sessions scheduled for this day</p>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="mt-2"
                                  onClick={() => {
                                    resetNewSession();
                                    setShowAddSession(true);
                                  }}
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  Add Session
                                </Button>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Add Session Dialog */}
      <Dialog 
        open={showAddSession} 
        onOpenChange={setShowAddSession}
      >
        <ScrollableDialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Add New Session</DialogTitle>
            <DialogDescription>{`Add a new session to Day ${parseInt(activeTab, 10) + 1} of the agenda.`}</DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="title">Session Title*</Label>
              <Input
                id="title"
                value={newSession.title}
                onChange={(e) => setNewSession({...newSession, title: e.target.value})}
                placeholder="Enter session title"
              />
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newSession.description || ''}
                onChange={(e) => setNewSession({...newSession, description: e.target.value})}
                placeholder="Enter session description"
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startTime">Start Time*</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={newSession.startTime}
                  onChange={(e) => setNewSession({...newSession, startTime: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="endTime">End Time*</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={newSession.endTime}
                  onChange={(e) => setNewSession({...newSession, endTime: e.target.value})}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sessionType">Session Type*</Label>
                <Select
                  value={newSession.sessionType}
                  onValueChange={(value) => setNewSession({...newSession, sessionType: value as SessionType})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="opening">Opening Session</SelectItem>
                    <SelectItem value="instruction">Instruction</SelectItem>
                    <SelectItem value="drill">Drill</SelectItem>
                    <SelectItem value="scrimmage">Scrimmage</SelectItem>
                    <SelectItem value="evaluation">Evaluation</SelectItem>
                    <SelectItem value="break">Break</SelectItem>
                    <SelectItem value="meal">Meal</SelectItem>
                    <SelectItem value="lecture">Lecture</SelectItem>
                    <SelectItem value="activity">Activity</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={newSession.status}
                  onValueChange={(value) => setNewSession({...newSession, status: value as 'draft' | 'scheduled' | 'completed' | 'cancelled'})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="location">Location</Label>
                <Select
                  value={newSession.locationId?.toString() || 'none'}
                  onValueChange={(value) => setNewSession({...newSession, locationId: value && value !== 'none' ? parseInt(value, 10) : undefined})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No location</SelectItem>
                    {locations?.data?.map((location: Location) => (
                      <SelectItem key={location.id} value={location.id.toString()}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <StaffSelector
                  label="Clinician"
                  selectedStaffId={newSession.clinicianId || null}
                  onStaffSelect={(staffId) => setNewSession({...newSession, clinicianId: staffId || undefined})}
                  allowCreate={true}
                  placeholder="Search clinicians..."
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="staffAssignments">Additional Staff Assignments</Label>
              <div className="border rounded-md p-3">
                <StaffSelector 
                  campId={campId ? parseInt(campId, 10) : undefined}
                  mode="multiple"
                  selectedStaff={newSession.staffAssignments || []}
                  onStaffChange={(staff) => setNewSession({...newSession, staffAssignments: staff})}
                  placeholder="Search and add staff members..."
                  allowCreate={true}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="materials">Materials Needed</Label>
              <Textarea
                id="materials"
                value={newSession.materials || ''}
                onChange={(e) => setNewSession({...newSession, materials: e.target.value})}
                placeholder="List any required materials"
                rows={2}
              />
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={newSession.notes || ''}
                onChange={(e) => setNewSession({...newSession, notes: e.target.value})}
                placeholder="Additional notes"
                rows={2}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddSession(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddSession} disabled={addSessionMutation.isPending}>
              {addSessionMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Session
                </>
              )}
            </Button>
          </DialogFooter>
        </ScrollableDialogContent>
      </Dialog>
      
      {/* Edit Session Dialog */}
      <Dialog
        open={showEditSession}
        onOpenChange={setShowEditSession}
      >
        <ScrollableDialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Session</DialogTitle>
            <DialogDescription>Edit the details of this session.</DialogDescription>
          </DialogHeader>
          
          {selectedSession && (
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="edit-title">Session Title*</Label>
              <Input
                id="edit-title"
                value={selectedSession.title}
                onChange={(e) => setSelectedSession({...selectedSession, title: e.target.value})}
                placeholder="Enter session title"
              />
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={selectedSession.description || ''}
                onChange={(e) => setSelectedSession({...selectedSession, description: e.target.value})}
                placeholder="Enter session description"
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-startTime">Start Time*</Label>
                <Input
                  id="edit-startTime"
                  type="time"
                  value={selectedSession.startTime}
                  onChange={(e) => setSelectedSession({...selectedSession, startTime: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit-endTime">End Time*</Label>
                <Input
                  id="edit-endTime"
                  type="time"
                  value={selectedSession.endTime}
                  onChange={(e) => setSelectedSession({...selectedSession, endTime: e.target.value})}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-sessionType">Session Type*</Label>
                <Select
                  value={selectedSession.sessionType}
                  onValueChange={(value) => setSelectedSession({...selectedSession, sessionType: value as SessionType})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="opening">Opening Session</SelectItem>
                    <SelectItem value="instruction">Instruction</SelectItem>
                    <SelectItem value="drill">Drill</SelectItem>
                    <SelectItem value="scrimmage">Scrimmage</SelectItem>
                    <SelectItem value="evaluation">Evaluation</SelectItem>
                    <SelectItem value="break">Break</SelectItem>
                    <SelectItem value="meal">Meal</SelectItem>
                    <SelectItem value="lecture">Lecture</SelectItem>
                    <SelectItem value="activity">Activity</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={selectedSession.status}
                  onValueChange={(value) => setSelectedSession({...selectedSession, status: value as 'draft' | 'scheduled' | 'completed' | 'cancelled'})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-location">Location</Label>
                <Select
                  value={selectedSession.locationId?.toString() || 'none'}
                  onValueChange={(value) => setSelectedSession({...selectedSession, locationId: value && value !== 'none' ? parseInt(value, 10) : undefined})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No location</SelectItem>
                    {locations?.data?.map((location: Location) => (
                      <SelectItem key={location.id} value={location.id.toString()}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <StaffSelector
                  label="Clinician"
                  selectedStaffId={selectedSession.clinicianId || null}
                  onStaffSelect={(staffId) => setSelectedSession({...selectedSession, clinicianId: staffId || undefined})}
                  allowCreate={true}
                  placeholder="Search clinicians..."
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="edit-staffAssignments">Additional Staff Assignments</Label>
              <div className="border rounded-md p-3">
                <StaffSelector 
                  campId={campId ? parseInt(campId, 10) : undefined}
                  mode="multiple"
                  selectedStaff={selectedSession.staffAssignments || []}
                  onStaffChange={(staff) => setSelectedSession({...selectedSession, staffAssignments: staff})}
                  placeholder="Search and add staff members..."
                  allowCreate={true}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="edit-materials">Materials Needed</Label>
              <Textarea
                id="edit-materials"
                value={selectedSession.materials || ''}
                onChange={(e) => setSelectedSession({...selectedSession, materials: e.target.value})}
                placeholder="List any required materials"
                rows={2}
              />
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={selectedSession.notes || ''}
                onChange={(e) => setSelectedSession({...selectedSession, notes: e.target.value})}
                placeholder="Additional notes"
                rows={2}
              />
            </div>
          </div>
        )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditSession(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateSession} disabled={updateSessionMutation.isPending}>
              {updateSessionMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </ScrollableDialogContent>
      </Dialog>
      
      {/* Copy Session Dialog */}
      <Dialog
        open={showCopyOptions}
        onOpenChange={setShowCopyOptions}
      >
        <ScrollableDialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Copy Session to Other Days</DialogTitle>
            <DialogDescription>Select which days you want to copy this session to.</DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="mb-4">
              <p className="font-medium text-sm text-gray-700">
                Session: {selectedSession?.title}
              </p>
              <p className="text-sm text-gray-500">
                {selectedSession?.startTime} - {selectedSession?.endTime} • {getSessionTypeDisplayName(selectedSession?.sessionType as SessionType)}
              </p>
            </div>
            
            <div className="space-y-2">
              <Label>Select Days to Copy To:</Label>
              {agendaData.map((day: AgendaDay) => (
                day.day !== parseInt(activeTab, 10) + 1 && (
                  <div key={day.day} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`day-${day.day}`}
                      checked={copyToDays.includes(day.day)}
                      onCheckedChange={() => toggleDaySelection(day.day)}
                    />
                    <Label 
                      htmlFor={`day-${day.day}`}
                      className="cursor-pointer"
                    >
                      Day {day.day} ({formatDate(day.date)})
                    </Label>
                  </div>
                )
              ))}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCopyOptions(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCopyToDays} 
              disabled={copySessionMutation.isPending || copyToDays.length === 0}
            >
              {copySessionMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Copying...
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy to Selected Days
                </>
              )}
            </Button>
          </DialogFooter>
        </ScrollableDialogContent>
      </Dialog>
    </div>
  );
}

export default AgendaBuilder;