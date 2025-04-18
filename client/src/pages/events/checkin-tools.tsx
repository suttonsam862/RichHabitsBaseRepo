import React, { useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronLeft,
  QrCode,
  CheckSquare,
  Search,
  Loader2,
  Users,
  Package,
  AlertTriangle,
  Info,
  Phone,
  MessageSquare,
  ScanLine,
  CalendarCheck,
  Tablet,
  Eye,
  EyeOff,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  History,
  CloudSun,
  Clock,
  Download
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
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDate, formatCurrency } from "@/lib/utils";

// Types
interface Participant {
  id: number;
  name: string;
  email: string;
  phone?: string;
  registrationType: string;
  registeredAt: string;
  checkInStatus: 'not_checked_in' | 'checked_in' | 'no_show';
  swagStatus: 'not_distributed' | 'distributed';
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  notes?: string;
  orderNumber?: string;
  isVip?: boolean;
  lastActivity?: string;
  shirtSize?: string;
  medicalInfo?: string;
  dietaryRestrictions?: string;
  specialRequests?: string;
  waiverSigned?: boolean;
  parentName?: string;
  qrCode?: string;
}

interface CheckInSession {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  staffAssigned: number[];
  checkedInCount: number;
  totalExpected: number;
  status: 'upcoming' | 'active' | 'completed';
  notes?: string;
}

interface AlertNotification {
  id: number;
  type: 'weather' | 'schedule_change' | 'emergency' | 'info';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  sentAt: string;
  sentBy: string;
  expiresAt?: string;
  sendToAll: boolean;
  requireConfirmation: boolean;
  confirmedBy?: number[];
}

interface ActivityLog {
  id: number;
  participantId: number;
  participantName: string;
  action: 'check_in' | 'swag_pickup' | 'waiver_signed' | 'note_added' | 'alert_sent';
  timestamp: string;
  performedBy: string;
  details?: string;
}

function CheckInTools() {
  const [location, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const campId = searchParams.get('campId');
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("participants");
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [showAddAlert, setShowAddAlert] = useState(false);
  const [showParticipantDetails, setShowParticipantDetails] = useState(false);
  const [selectedParticipantId, setSelectedParticipantId] = useState<number | null>(null);
  const [currentWeather, setCurrentWeather] = useState<{
    condition: string;
    temperature: number;
    feelsLike: number;
    humidity: number;
    windSpeed: number;
    forecast: string;
  } | null>(null);
  const [showCheckInConfirm, setShowCheckInConfirm] = useState(false);
  const [checkinData, setCheckinData] = useState({
    participantId: null as number | null,
    swagDistributed: false,
    notes: ''
  });
  const [newAlert, setNewAlert] = useState({
    type: 'info' as 'weather' | 'schedule_change' | 'emergency' | 'info',
    title: '',
    message: '',
    severity: 'medium' as 'low' | 'medium' | 'high',
    expiresAt: '',
    sendToAll: true,
    requireConfirmation: false
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
  
  // Fetch participants
  const {
    data: participants,
    isLoading: isLoadingParticipants,
    refetch: refetchParticipants
  } = useQuery({
    queryKey: ['/api/camps', campId, 'participants'],
    enabled: !!campId,
  });
  
  // Fetch check-in sessions
  const {
    data: checkInSessions,
    isLoading: isLoadingCheckInSessions
  } = useQuery({
    queryKey: ['/api/camps', campId, 'check-in-sessions'],
    enabled: !!campId,
  });
  
  // Fetch alerts
  const {
    data: alerts,
    isLoading: isLoadingAlerts
  } = useQuery({
    queryKey: ['/api/camps', campId, 'alerts'],
    enabled: !!campId,
  });
  
  // Fetch activity logs
  const {
    data: activityLogs,
    isLoading: isLoadingActivityLogs
  } = useQuery({
    queryKey: ['/api/camps', campId, 'activity-logs'],
    enabled: !!campId,
  });
  
  // Check-in participant mutation
  const checkInParticipantMutation = useMutation({
    mutationFn: async (data: typeof checkinData) => {
      const response = await apiRequest(
        "POST",
        `/api/camps/${campId}/check-in`,
        data
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Check-in successful",
        description: "Participant has been checked in successfully."
      });
      queryClient.invalidateQueries({
        queryKey: ['/api/camps', campId, 'participants']
      });
      queryClient.invalidateQueries({
        queryKey: ['/api/camps', campId, 'activity-logs']
      });
      setShowCheckInConfirm(false);
      setCheckinData({
        participantId: null,
        swagDistributed: false,
        notes: ''
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Check-in failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Create alert notification mutation
  const createAlertMutation = useMutation({
    mutationFn: async (alertData: typeof newAlert) => {
      const response = await apiRequest(
        "POST",
        `/api/camps/${campId}/alerts`,
        alertData
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Alert created",
        description: "Your alert notification has been sent successfully."
      });
      queryClient.invalidateQueries({
        queryKey: ['/api/camps', campId, 'alerts']
      });
      setShowAddAlert(false);
      setNewAlert({
        type: 'info',
        title: '',
        message: '',
        severity: 'medium',
        expiresAt: '',
        sendToAll: true,
        requireConfirmation: false
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create alert",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Download participant list mutation
  const downloadParticipantsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(
        "GET",
        `/api/camps/${campId}/participants/export`,
        {}
      );
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Export successful",
        description: "Participant list has been exported successfully."
      });
      
      // Create a simple CSV export
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += "Name,Email,Phone,Registration Type,Check-in Status,Swag Status\n";
      
      participants?.data?.forEach((participant: Participant) => {
        csvContent += `${participant.name},${participant.email},${participant.phone || 'N/A'},${participant.registrationType},${participant.checkInStatus},${participant.swagStatus}\n`;
      });
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `participants_camp_${campId}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    onError: (error: Error) => {
      toast({
        title: "Export failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Mark swag as distributed mutation
  const markSwagDistributedMutation = useMutation({
    mutationFn: async (participantId: number) => {
      const response = await apiRequest(
        "POST",
        `/api/camps/${campId}/swag-distribution`,
        { participantId, distributed: true }
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Swag distributed",
        description: "Swag has been marked as distributed."
      });
      queryClient.invalidateQueries({
        queryKey: ['/api/camps', campId, 'participants']
      });
      queryClient.invalidateQueries({
        queryKey: ['/api/camps', campId, 'activity-logs']
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update swag status",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Handle participant check-in
  const handleCheckIn = () => {
    if (!checkinData.participantId) return;
    
    checkInParticipantMutation.mutate(checkinData);
  };
  
  // Handle creating alert notification
  const handleCreateAlert = () => {
    if (!newAlert.title || !newAlert.message) {
      toast({
        title: "Missing information",
        description: "Please provide a title and message for the alert.",
        variant: "destructive"
      });
      return;
    }
    
    createAlertMutation.mutate(newAlert);
  };
  
  // Handle QR code scan
  const handleQrScan = (result: string) => {
    const participantData = participants?.data?.find((p: Participant) => p.qrCode === result);
    
    if (participantData) {
      setCheckinData({
        ...checkinData,
        participantId: participantData.id
      });
      setShowQrScanner(false);
      setShowCheckInConfirm(true);
    } else {
      toast({
        title: "Invalid QR code",
        description: "No matching participant found for this QR code.",
        variant: "destructive"
      });
    }
  };
  
  // Handle swag distribution
  const handleDistributeSwag = (participantId: number) => {
    markSwagDistributedMutation.mutate(participantId);
  };
  
  // Handle export participants
  const handleExportParticipants = () => {
    downloadParticipantsMutation.mutate();
  };
  
  // Fetch weather data
  const fetchWeather = async () => {
    try {
      // This would be a real API call in a production app
      // For now, we'll simulate a response
      setCurrentWeather({
        condition: 'Sunny',
        temperature: 75,
        feelsLike: 78,
        humidity: 40,
        windSpeed: 5,
        forecast: 'Clear skies throughout the day.'
      });
      
      toast({
        title: "Weather updated",
        description: "Current weather information has been updated."
      });
    } catch (error) {
      toast({
        title: "Failed to fetch weather",
        description: "Could not retrieve current weather data.",
        variant: "destructive"
      });
    }
  };
  
  // Go back to camp project
  const handleBackToCamp = () => {
    window.location.href = `/events/camp-project?campId=${campId}`;
  };
  
  // Get check-in status badge
  const getCheckInStatusBadge = (status: 'not_checked_in' | 'checked_in' | 'no_show') => {
    switch (status) {
      case 'checked_in':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Checked In</Badge>;
      case 'not_checked_in':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Not Checked In</Badge>;
      case 'no_show':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800">No Show</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };
  
  // Get swag status badge
  const getSwagStatusBadge = (status: 'not_distributed' | 'distributed') => {
    switch (status) {
      case 'distributed':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Distributed</Badge>;
      case 'not_distributed':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Not Distributed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };
  
  // Get alert type icon
  const getAlertTypeIcon = (type: string) => {
    switch (type) {
      case 'weather':
        return <CloudSun className="h-5 w-5 text-blue-500" />;
      case 'schedule_change':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'emergency':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'info':
        return <Info className="h-5 w-5 text-green-500" />;
      default:
        return <Info className="h-5 w-5" />;
    }
  };
  
  // Get alert severity badge
  const getAlertSeverityBadge = (severity: 'low' | 'medium' | 'high') => {
    switch (severity) {
      case 'low':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Low</Badge>;
      case 'medium':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Medium</Badge>;
      case 'high':
        return <Badge variant="outline" className="bg-red-100 text-red-800">High</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };
  
  // Loading state
  if (isLoadingCamp) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // Error state
  if (isCampError || !camp?.data) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <Button variant="outline" onClick={handleBackToCamp}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Camp
          </Button>
        </div>
        
        <Card className="mx-auto max-w-md text-center p-6">
          <CardHeader>
            <CardTitle>Camp Not Found</CardTitle>
            <CardDescription>
              The camp you are looking for does not exist or you don't have permission to view it.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button onClick={() => window.location.href = '/events/overview'}>
              View All Camps
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  const campData = camp.data;
  const participantsData = participants?.data || [];
  const checkInSessionsData = checkInSessions?.data || [];
  const alertsData = alerts?.data || [];
  const activityLogsData = activityLogs?.data || [];
  
  // Calculate check-in progress
  const checkedInCount = participantsData.filter((p: Participant) => p.checkInStatus === 'checked_in').length;
  const checkInPercentage = participantsData.length > 0 
    ? Math.round((checkedInCount / participantsData.length) * 100) 
    : 0;
  
  // Calculate swag distribution progress
  const swagDistributedCount = participantsData.filter((p: Participant) => p.swagStatus === 'distributed').length;
  const swagDistributionPercentage = participantsData.length > 0 
    ? Math.round((swagDistributedCount / participantsData.length) * 100) 
    : 0;
  
  // Filter participants based on search and status filter
  const filteredParticipants = participantsData.filter((participant: Participant) => {
    const matchesSearch = 
      participant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      participant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (participant.phone && participant.phone.includes(searchTerm)) ||
      (participant.orderNumber && participant.orderNumber.includes(searchTerm));
    
    const matchesStatus = statusFilter === 'all' || participant.checkInStatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  });
  
  // Get active check-in session
  const activeSession = checkInSessionsData.find((session: CheckInSession) => session.status === 'active');
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleBackToCamp} className="mr-2">
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:block ml-1">Back to Camp</span>
            </Button>
            <h1 className="text-2xl font-bold md:text-3xl">Check-In & Onsite Tools</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            {campData.name} - {formatDate(campData.startDate)} to {formatDate(campData.endDate)}
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setShowQrScanner(true)}>
            <ScanLine className="mr-2 h-4 w-4" />
            Scan QR Code
          </Button>
          
          <Button onClick={() => setShowAddAlert(true)}>
            <AlertTriangle className="mr-2 h-4 w-4" />
            Send Alert
          </Button>
        </div>
      </div>
      
      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Check-in Stats */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center">
              <CheckCircle2 className="mr-2 h-4 w-4 text-primary" />
              Check-in Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {checkedInCount} / {participantsData.length}
            </div>
            <div className="text-xs text-muted-foreground mb-2">
              participants checked in
            </div>
            <Progress value={checkInPercentage} className="h-2" />
          </CardContent>
        </Card>
        
        {/* Swag Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center">
              <Package className="mr-2 h-4 w-4 text-primary" />
              Swag Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {swagDistributedCount} / {participantsData.length}
            </div>
            <div className="text-xs text-muted-foreground mb-2">
              swag packs distributed
            </div>
            <Progress value={swagDistributionPercentage} className="h-2" />
          </CardContent>
        </Card>
        
        {/* Active Session */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center">
              <CalendarCheck className="mr-2 h-4 w-4 text-primary" />
              Check-in Session
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeSession ? (
              <div>
                <div className="text-xl font-bold">{activeSession.location}</div>
                <div className="text-sm mb-1">
                  {activeSession.startTime} - {activeSession.endTime}
                </div>
                <Badge className="bg-green-100 text-green-800">Active Now</Badge>
              </div>
            ) : (
              <div>
                <div className="text-xl font-bold">No Active Session</div>
                <div className="text-sm text-muted-foreground mb-2">
                  No check-in session is currently active
                </div>
                <Button variant="outline" size="sm" className="w-full">
                  Start Session
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Current Weather */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center">
              <CloudSun className="mr-2 h-4 w-4 text-primary" />
              Current Weather
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentWeather ? (
              <div>
                <div className="text-xl font-bold">{currentWeather.condition}</div>
                <div className="text-sm mb-1">
                  {currentWeather.temperature}°F (feels like {currentWeather.feelsLike}°F)
                </div>
                <div className="text-xs text-muted-foreground">
                  {currentWeather.forecast}
                </div>
              </div>
            ) : (
              <div>
                <div className="text-xl font-bold">Weather Data</div>
                <div className="text-sm text-muted-foreground mb-2">
                  Fetch current weather conditions
                </div>
                <Button variant="outline" size="sm" className="w-full" onClick={fetchWeather}>
                  Get Weather
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-4 md:w-[800px]">
          <TabsTrigger value="participants">Participants</TabsTrigger>
          <TabsTrigger value="emergency">Emergency Contacts</TabsTrigger>
          <TabsTrigger value="alerts">Alerts & Notifications</TabsTrigger>
          <TabsTrigger value="activity">Activity Log</TabsTrigger>
        </TabsList>
        
        {/* Participants Tab */}
        <TabsContent value="participants" className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex w-full md:w-auto gap-4">
              <div className="relative flex-grow w-full md:w-auto">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search participants..."
                  className="pl-8 w-full md:w-[300px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="checked_in">Checked In</SelectItem>
                  <SelectItem value="not_checked_in">Not Checked In</SelectItem>
                  <SelectItem value="no_show">No Show</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex w-full md:w-auto gap-2">
              <Button
                variant="outline"
                onClick={handleExportParticipants}
                className="w-full md:w-auto"
              >
                <Download className="mr-2 h-4 w-4" />
                Export List
              </Button>
              
              <Button 
                onClick={() => setShowQrScanner(true)}
                className="w-full md:w-auto"
              >
                <ScanLine className="mr-2 h-4 w-4" />
                Scan QR
              </Button>
            </div>
          </div>
          
          <Card>
            <CardContent className="p-0">
              {isLoadingParticipants ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredParticipants.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No participants {searchTerm ? 'match your search criteria' : 'have registered yet'}.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Participant</TableHead>
                      <TableHead>Registration</TableHead>
                      <TableHead>Check-in Status</TableHead>
                      <TableHead>Swag Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredParticipants.map((participant: Participant) => (
                      <TableRow key={participant.id}>
                        <TableCell>
                          <div className="font-medium">{participant.name}</div>
                          <div className="text-xs text-muted-foreground">{participant.email}</div>
                          {participant.phone && (
                            <div className="text-xs text-muted-foreground">
                              {participant.phone}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div>{participant.registrationType}</div>
                          {participant.orderNumber && (
                            <div className="text-xs text-muted-foreground">
                              Order #{participant.orderNumber}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {getCheckInStatusBadge(participant.checkInStatus)}
                        </TableCell>
                        <TableCell>
                          {getSwagStatusBadge(participant.swagStatus)}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedParticipantId(participant.id);
                                  setShowParticipantDetails(true);
                                }}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              
                              {participant.checkInStatus !== 'checked_in' && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setCheckinData({
                                      participantId: participant.id,
                                      swagDistributed: false,
                                      notes: ''
                                    });
                                    setShowCheckInConfirm(true);
                                  }}
                                >
                                  <CheckSquare className="mr-2 h-4 w-4" />
                                  Check In
                                </DropdownMenuItem>
                              )}
                              
                              {participant.swagStatus !== 'distributed' && participant.checkInStatus === 'checked_in' && (
                                <DropdownMenuItem
                                  onClick={() => handleDistributeSwag(participant.id)}
                                >
                                  <Package className="mr-2 h-4 w-4" />
                                  Distribute Swag
                                </DropdownMenuItem>
                              )}
                              
                              <DropdownMenuItem>
                                <MessageSquare className="mr-2 h-4 w-4" />
                                Add Note
                              </DropdownMenuItem>
                              
                              {participant.checkInStatus === 'not_checked_in' && (
                                <DropdownMenuItem>
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Mark as No-Show
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Emergency Contacts Tab */}
        <TabsContent value="emergency" className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold">Emergency Contacts</h2>
              <p className="text-muted-foreground">
                Access participant emergency contact information
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <Phone className="mr-2 h-4 w-4" />
                Call List
              </Button>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
          
          <Card>
            <CardContent className="p-0">
              {isLoadingParticipants ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : participantsData.filter(p => p.emergencyContact).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No emergency contact information available.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Participant</TableHead>
                      <TableHead>Registration</TableHead>
                      <TableHead>Emergency Contact</TableHead>
                      <TableHead>Contact Phone</TableHead>
                      <TableHead>Relationship</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {participantsData
                      .filter(p => p.emergencyContact)
                      .map((participant: Participant) => (
                        <TableRow key={participant.id}>
                          <TableCell>
                            <div className="font-medium">{participant.name}</div>
                            <div className="text-xs text-muted-foreground">{participant.email}</div>
                          </TableCell>
                          <TableCell>
                            <div>{participant.registrationType}</div>
                            <div className="text-xs text-muted-foreground">
                              {getCheckInStatusBadge(participant.checkInStatus)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{participant.emergencyContact?.name}</div>
                          </TableCell>
                          <TableCell>
                            <Button variant="link" className="p-0 h-auto" asChild>
                              <a href={`tel:${participant.emergencyContact?.phone}`}>
                                {participant.emergencyContact?.phone}
                              </a>
                            </Button>
                          </TableCell>
                          <TableCell>
                            {participant.emergencyContact?.relationship}
                          </TableCell>
                        </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Alerts & Notifications Tab */}
        <TabsContent value="alerts" className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold">Alerts & Notifications</h2>
              <p className="text-muted-foreground">
                Send and manage alerts to participants and staff
              </p>
            </div>
            <Button onClick={() => setShowAddAlert(true)}>
              <AlertTriangle className="mr-2 h-4 w-4" />
              Send Alert
            </Button>
          </div>
          
          {isLoadingAlerts ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : alertsData.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Alerts Sent</h3>
                <p className="text-muted-foreground text-center max-w-md mb-6">
                  Send notifications about weather, schedule changes, or other important information.
                </p>
                <Button onClick={() => setShowAddAlert(true)}>
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Send Your First Alert
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {alertsData.map((alert: AlertNotification) => (
                <Card key={alert.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        {getAlertTypeIcon(alert.type)}
                        <CardTitle className="text-lg">{alert.title}</CardTitle>
                      </div>
                      {getAlertSeverityBadge(alert.severity)}
                    </div>
                    <CardDescription>
                      Sent by {alert.sentBy} on {formatDate(alert.sentAt)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <p className="text-sm">{alert.message}</p>
                    
                    <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                      <div>
                        {alert.sendToAll ? 'Sent to all participants' : 'Sent to selected participants'}
                      </div>
                      {alert.expiresAt && (
                        <div>Expires: {formatDate(alert.expiresAt)}</div>
                      )}
                    </div>
                  </CardContent>
                  {alert.requireConfirmation && (
                    <CardFooter className="pt-0 text-xs">
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                        <span>{alert.confirmedBy?.length || 0} confirmations received</span>
                      </div>
                    </CardFooter>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        {/* Activity Log Tab */}
        <TabsContent value="activity" className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold">Activity Log</h2>
              <p className="text-muted-foreground">
                Track all check-ins, swag distribution, and other activities
              </p>
            </div>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export Log
            </Button>
          </div>
          
          <Card>
            <CardContent className="p-0">
              {isLoadingActivityLogs ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : activityLogsData.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No activity has been recorded yet.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Participant</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Performed By</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activityLogsData.map((log: ActivityLog) => (
                      <TableRow key={log.id}>
                        <TableCell className="whitespace-nowrap">
                          {formatDate(log.timestamp)}
                        </TableCell>
                        <TableCell>
                          {log.participantName}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={
                            log.action === 'check_in' ? 'bg-green-100 text-green-800' :
                            log.action === 'swag_pickup' ? 'bg-yellow-100 text-yellow-800' :
                            log.action === 'alert_sent' ? 'bg-red-100 text-red-800' :
                            'bg-blue-100 text-blue-800'
                          }>
                            {log.action.replace(/_/g, ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {log.performedBy}
                        </TableCell>
                        <TableCell>
                          {log.details || '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* QR Scanner Dialog */}
      <Dialog open={showQrScanner} onOpenChange={setShowQrScanner}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Scan Participant QR Code</DialogTitle>
            <DialogDescription>
              Position the QR code within the scanner area
            </DialogDescription>
          </DialogHeader>
          <div className="py-8 flex flex-col items-center justify-center">
            <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg w-64 h-64 flex items-center justify-center mb-4">
              <div className="text-center p-4">
                <QrCode className="h-20 w-20 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  QR scanner would appear here in a production app
                </p>
              </div>
            </div>
            <div className="space-y-2 w-full max-w-xs">
              <Button 
                className="w-full" 
                onClick={() => {
                  // Simulate a successful scan
                  if (participantsData.length > 0) {
                    const randomParticipant = participantsData[0];
                    handleQrScan(randomParticipant.qrCode || 'sample-qr-code');
                  } else {
                    toast({
                      title: "No participants",
                      description: "There are no participants to simulate a scan.",
                      variant: "destructive"
                    });
                  }
                }}
              >
                Simulate Successful Scan
              </Button>
              <Button variant="outline" className="w-full" onClick={() => setShowQrScanner(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Check-in Confirmation Dialog */}
      <Dialog open={showCheckInConfirm} onOpenChange={setShowCheckInConfirm}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Check In Participant</DialogTitle>
            <DialogDescription>
              Confirm check-in details for this participant
            </DialogDescription>
          </DialogHeader>
          {checkinData.participantId && (
            <div className="py-4">
              {participantsData
                .filter(p => p.id === checkinData.participantId)
                .map((participant: Participant) => (
                  <div key={participant.id} className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-medium text-lg">{participant.name}</h3>
                      <div className="text-sm text-muted-foreground mb-2">{participant.email}</div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Registration:</span>{' '}
                          <span>{participant.registrationType}</span>
                        </div>
                        
                        {participant.orderNumber && (
                          <div>
                            <span className="text-muted-foreground">Order:</span>{' '}
                            <span>#{participant.orderNumber}</span>
                          </div>
                        )}
                        
                        {participant.shirtSize && (
                          <div>
                            <span className="text-muted-foreground">Shirt Size:</span>{' '}
                            <span>{participant.shirtSize}</span>
                          </div>
                        )}
                        
                        <div>
                          <span className="text-muted-foreground">Waiver:</span>{' '}
                          <span>{participant.waiverSigned ? 'Signed' : 'Not Signed'}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="distribute-swag"
                          checked={checkinData.swagDistributed}
                          onCheckedChange={(checked) => setCheckinData({
                            ...checkinData,
                            swagDistributed: !!checked
                          })}
                        />
                        <Label htmlFor="distribute-swag">Also distribute swag pack to participant</Label>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="check-in-notes">Notes (optional)</Label>
                        <Textarea
                          id="check-in-notes"
                          placeholder="Add any notes about this check-in"
                          value={checkinData.notes}
                          onChange={(e) => setCheckinData({
                            ...checkinData,
                            notes: e.target.value
                          })}
                        />
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCheckInConfirm(false)}>
              Cancel
            </Button>
            <Button onClick={handleCheckIn}>
              Confirm Check-In
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Participant Details Dialog */}
      <Dialog open={showParticipantDetails} onOpenChange={setShowParticipantDetails}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Participant Details</DialogTitle>
            <DialogDescription>
              View complete information for this participant
            </DialogDescription>
          </DialogHeader>
          {selectedParticipantId && (
            <div className="py-4">
              {participantsData
                .filter(p => p.id === selectedParticipantId)
                .map((participant: Participant) => (
                  <div key={participant.id} className="space-y-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-lg">{participant.name}</h3>
                        <div className="text-sm text-muted-foreground">{participant.email}</div>
                        {participant.phone && (
                          <div className="text-sm text-muted-foreground">{participant.phone}</div>
                        )}
                      </div>
                      <div className="space-y-1">
                        {getCheckInStatusBadge(participant.checkInStatus)}
                        <div className="text-xs text-right text-muted-foreground">
                          Registered: {formatDate(participant.registeredAt)}
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium">Registration Details</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Type:</span>
                            <span>{participant.registrationType}</span>
                          </div>
                          {participant.orderNumber && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Order Number:</span>
                              <span>#{participant.orderNumber}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Swag Status:</span>
                            <span>{getSwagStatusBadge(participant.swagStatus)}</span>
                          </div>
                          {participant.waiverSigned !== undefined && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Waiver:</span>
                              <span>{participant.waiverSigned ? 'Signed' : 'Not Signed'}</span>
                            </div>
                          )}
                          {participant.isVip !== undefined && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">VIP Status:</span>
                              <span>{participant.isVip ? 'VIP' : 'Standard'}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium">Personal Information</h4>
                        <div className="space-y-2 text-sm">
                          {participant.shirtSize && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Shirt Size:</span>
                              <span>{participant.shirtSize}</span>
                            </div>
                          )}
                          {participant.dietaryRestrictions && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Dietary Restrictions:</span>
                              <span>{participant.dietaryRestrictions}</span>
                            </div>
                          )}
                          {participant.medicalInfo && (
                            <div className="flex flex-col gap-1">
                              <span className="text-muted-foreground">Medical Information:</span>
                              <span className="text-right">{participant.medicalInfo}</span>
                            </div>
                          )}
                          {participant.specialRequests && (
                            <div className="flex flex-col gap-1">
                              <span className="text-muted-foreground">Special Requests:</span>
                              <span className="text-right">{participant.specialRequests}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {participant.emergencyContact && (
                      <>
                        <Separator />
                        
                        <div className="space-y-3">
                          <h4 className="text-sm font-medium">Emergency Contact</h4>
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <div className="font-medium">{participant.emergencyContact.name}</div>
                            <div className="text-sm">
                              {participant.emergencyContact.relationship}
                            </div>
                            <Button variant="link" className="p-0 h-auto text-sm" asChild>
                              <a href={`tel:${participant.emergencyContact.phone}`}>
                                {participant.emergencyContact.phone}
                              </a>
                            </Button>
                          </div>
                        </div>
                      </>
                    )}
                    
                    {participant.notes && (
                      <>
                        <Separator />
                        
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">Notes</h4>
                          <p className="text-sm">{participant.notes}</p>
                        </div>
                      </>
                    )}
                  </div>
                ))}
            </div>
          )}
          <DialogFooter>
            {selectedParticipantId && (
              <div className="flex w-full justify-between">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <a href={`tel:${participantsData.find(p => p.id === selectedParticipantId)?.phone}`}>
                      <Phone className="mr-2 h-4 w-4" />
                      Call
                    </a>
                  </Button>
                  <Button variant="outline" size="sm">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Add Note
                  </Button>
                </div>
                <Button onClick={() => setShowParticipantDetails(false)}>
                  Close
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Add Alert Dialog */}
      <Dialog open={showAddAlert} onOpenChange={setShowAddAlert}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Send Alert Notification</DialogTitle>
            <DialogDescription>
              Create an alert to notify participants and staff
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="alert-type" className="text-right">
                Alert Type
              </Label>
              <Select 
                value={newAlert.type}
                onValueChange={(value: any) => setNewAlert({...newAlert, type: value})}
              >
                <SelectTrigger id="alert-type" className="col-span-3">
                  <SelectValue placeholder="Select alert type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Information</SelectItem>
                  <SelectItem value="weather">Weather Alert</SelectItem>
                  <SelectItem value="schedule_change">Schedule Change</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="alert-title" className="text-right">
                Title
              </Label>
              <Input
                id="alert-title"
                value={newAlert.title}
                onChange={(e) => setNewAlert({...newAlert, title: e.target.value})}
                className="col-span-3"
                placeholder="Alert title"
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="alert-message" className="text-right pt-2">
                Message
              </Label>
              <Textarea
                id="alert-message"
                value={newAlert.message}
                onChange={(e) => setNewAlert({...newAlert, message: e.target.value})}
                className="col-span-3"
                placeholder="Alert message"
                rows={4}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="alert-severity" className="text-right">
                Severity
              </Label>
              <Select 
                value={newAlert.severity}
                onValueChange={(value: any) => setNewAlert({...newAlert, severity: value})}
              >
                <SelectTrigger id="alert-severity" className="col-span-3">
                  <SelectValue placeholder="Select severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="alert-expiry" className="text-right">
                Expires
              </Label>
              <Input
                id="alert-expiry"
                type="datetime-local"
                value={newAlert.expiresAt}
                onChange={(e) => setNewAlert({...newAlert, expiresAt: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <div className="text-right">
                <Label htmlFor="send-to-all">Recipients</Label>
              </div>
              <div className="col-span-3 space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="send-to-all" 
                    checked={newAlert.sendToAll}
                    onCheckedChange={(checked) => setNewAlert({...newAlert, sendToAll: !!checked})}
                  />
                  <Label htmlFor="send-to-all">Send to all participants</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="require-confirmation" 
                    checked={newAlert.requireConfirmation}
                    onCheckedChange={(checked) => setNewAlert({...newAlert, requireConfirmation: !!checked})}
                  />
                  <Label htmlFor="require-confirmation">Require confirmation</Label>
                </div>
                
                <p className="text-xs text-muted-foreground">
                  Recipients will need to confirm they've seen this alert.
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddAlert(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateAlert}
              variant={newAlert.type === 'emergency' ? 'destructive' : 'default'}
            >
              <AlertTriangle className="mr-2 h-4 w-4" />
              Send Alert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default CheckInTools;