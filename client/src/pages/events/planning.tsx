import React, { useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronLeft,
  Plus,
  Search,
  Loader2,
  Pencil,
  Calendar,
  MapPin,
  Users,
  BarChart,
  TrendingUp,
  FileCheck,
  Save,
  Trash2,
  ChevronRight,
  Check,
  X,
  CalendarRange,
  Building,
  User2,
  CopyCheck,
  ClipboardCheck,
  CheckCircle2,
  Clock,
  Info,
  AlertCircle,
  HelpCircle,
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
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollableDialog } from "@/components/ui/scrollable-dialog";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDate } from "@/lib/utils";

// Types
interface CampTemplate {
  id: number;
  name: string;
  description?: string;
  duration: number;
  type: CampType;
  category: CampCategory;
  targetAgeGroup?: string;
  targetParticipants?: number;
  registrationPrice?: number;
  includesSwag: boolean;
  facilities?: string[];
  staffingRequirements?: StaffingRequirement[];
  agendaTemplate?: AgendaTemplateItem[];
  created?: string;
  lastUsed?: string;
  useCount?: number;
}

interface StaffingRequirement {
  role: string;
  count: number;
  skillsRequired?: string[];
}

interface AgendaTemplateItem {
  day: number;
  title: string;
  startTime: string;
  endTime: string;
  type: string;
  description?: string;
}

interface Camp {
  id: number;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  location?: string;
  venue?: string;
  city?: string;
  state?: string;
  type: CampType;
  category: CampCategory;
  status: CampStatus;
  targetParticipants?: number;
  currentRegistrations?: number;
  targetAgeGroup?: string;
  registrationPrice?: number;
  includesSwag: boolean;
  budgetTotal?: number;
  budgetAllocated?: number;
  organizerId?: number;
  organizerName?: string;
  requiresMeals?: boolean;
  requiresAccommodation?: boolean;
  requiresTransportation?: boolean;
  specialRequirements?: string;
  notes?: string;
  setupStartDate?: string;
  teardownEndDate?: string;
  checklistCompletion?: number;
}

type CampStatus = 
  | 'draft'
  | 'planning'
  | 'scheduled'
  | 'open'
  | 'closed'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

type CampType = 
  | 'camp'
  | 'clinic'
  | 'tournament'
  | 'retreat'
  | 'workshop'
  | 'seminar'
  | 'other';

type CampCategory = 
  | 'youth'
  | 'highschool'
  | 'college'
  | 'elite'
  | 'professional'
  | 'recreational'
  | 'mixed'
  | 'other';

interface ChecklistItem {
  id: number;
  campId: number;
  task: string;
  category: string;
  completed: boolean;
  dueDate?: string;
  assignedTo?: string;
  priority: 'low' | 'medium' | 'high';
  notes?: string;
}

function CampPlanning() {
  const { campId } = useParams();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("new");
  const [showNewCampDialog, setShowNewCampDialog] = useState(false);
  const [showFromTemplateDialog, setShowFromTemplateDialog] = useState(false);
  const [showTemplateDetailsDialog, setShowTemplateDetailsDialog] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const [newCamp, setNewCamp] = useState<Partial<Camp>>({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    location: '',
    venue: '',
    city: '',
    state: '',
    type: 'camp',
    category: 'youth',
    status: 'draft',
    includesSwag: true
  });
  
  // Fetch templates
  const {
    data: templates,
    isLoading: isLoadingTemplates
  } = useQuery({
    queryKey: ['/api/camp-templates'],
    enabled: true,
  });
  
  // Fetch camps
  const {
    data: camps,
    isLoading: isLoadingCamps
  } = useQuery({
    queryKey: ['/api/camps'],
    enabled: true,
  });
  
  // Create camp mutation
  const createCampMutation = useMutation({
    mutationFn: async (campData: Partial<Camp>) => {
      const response = await apiRequest(
        "POST",
        `/api/camps`,
        campData
      );
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Camp created",
        description: "The camp has been created successfully."
      });
      queryClient.invalidateQueries({
        queryKey: ['/api/camps']
      });
      setShowNewCampDialog(false);
      
      // Navigate to the new camp's project page
      setLocation(`/events/camp-project/${data.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create camp",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Create camp from template mutation
  const createFromTemplateMutation = useMutation({
    mutationFn: async ({ templateId, campData }: { templateId: number, campData: Partial<Camp> }) => {
      const response = await apiRequest(
        "POST",
        `/api/camps/from-template/${templateId}`,
        campData
      );
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Camp created from template",
        description: "The camp has been created successfully from the template."
      });
      queryClient.invalidateQueries({
        queryKey: ['/api/camps']
      });
      setShowFromTemplateDialog(false);
      
      // Navigate to the new camp's project page
      setLocation(`/events/camp-project/${data.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create camp",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Delete camp mutation
  const deleteCampMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest(
        "DELETE",
        `/api/camps/${id}`,
        {}
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Camp deleted",
        description: "The camp has been deleted successfully."
      });
      queryClient.invalidateQueries({
        queryKey: ['/api/camps']
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete camp",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Create new camp
  const handleCreateCamp = () => {
    if (!newCamp.name || !newCamp.startDate || !newCamp.endDate) {
      toast({
        title: "Missing information",
        description: "Please provide a name, start date, and end date for the camp.",
        variant: "destructive"
      });
      return;
    }
    
    createCampMutation.mutate(newCamp);
  };
  
  // Create camp from template
  const handleCreateFromTemplate = () => {
    if (!selectedTemplateId || !newCamp.name || !newCamp.startDate || !newCamp.endDate) {
      toast({
        title: "Missing information",
        description: "Please provide a name, start date, end date, and select a template.",
        variant: "destructive"
      });
      return;
    }
    
    createFromTemplateMutation.mutate({
      templateId: selectedTemplateId,
      campData: newCamp
    });
  };
  
  // Delete camp
  const handleDeleteCamp = (id: number) => {
    if (window.confirm("Are you sure you want to delete this camp? This action cannot be undone.")) {
      deleteCampMutation.mutate(id);
    }
  };
  
  // Open template details dialog
  const openTemplateDetails = (id: number) => {
    setSelectedTemplateId(id);
    setShowTemplateDetailsDialog(true);
  };
  
  // Open create from template dialog with selected template
  const selectTemplateForCamp = (id: number) => {
    const template = templates?.data?.find((t: CampTemplate) => t.id === id);
    if (!template) return;
    
    setSelectedTemplateId(id);
    
    // Calculate endDate based on template duration
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() + 30); // Default to 30 days from now
    
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + (template.duration - 1));
    
    setNewCamp({
      ...newCamp,
      name: template.name,
      description: template.description,
      type: template.type,
      category: template.category,
      targetAgeGroup: template.targetAgeGroup,
      targetParticipants: template.targetParticipants,
      registrationPrice: template.registrationPrice,
      includesSwag: template.includesSwag,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    });
    
    setShowFromTemplateDialog(true);
  };
  
  // Calculate days between two dates
  const calculateDuration = (startDate: string, endDate: string): number => {
    if (!startDate || !endDate) return 0;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Calculate the difference in days
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Include start and end days
  };
  
  // Format date to display format
  const formatDisplayDate = (dateString: string): string => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    };
    
    return date.toLocaleDateString('en-US', options);
  };
  
  // Get status badge
  const getStatusBadge = (status: CampStatus) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800">Draft</Badge>;
      case 'planning':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Planning</Badge>;
      case 'scheduled':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Scheduled</Badge>;
      case 'open':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Registration Open</Badge>;
      case 'closed':
        return <Badge variant="outline" className="bg-red-100 text-red-800">Registration Closed</Badge>;
      case 'in_progress':
        return <Badge variant="outline" className="bg-purple-100 text-purple-800">In Progress</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-indigo-100 text-indigo-800">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-100 text-red-800">Cancelled</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };
  
  // Get type badge
  const getTypeBadge = (type: CampType) => {
    switch (type) {
      case 'camp':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Camp</Badge>;
      case 'clinic':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Clinic</Badge>;
      case 'tournament':
        return <Badge variant="outline" className="bg-red-100 text-red-800">Tournament</Badge>;
      case 'retreat':
        return <Badge variant="outline" className="bg-purple-100 text-purple-800">Retreat</Badge>;
      case 'workshop':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Workshop</Badge>;
      case 'seminar':
        return <Badge variant="outline" className="bg-orange-100 text-orange-800">Seminar</Badge>;
      case 'other':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800">Other</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };
  
  // Get category badge
  const getCategoryBadge = (category: CampCategory) => {
    switch (category) {
      case 'youth':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Youth</Badge>;
      case 'highschool':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">High School</Badge>;
      case 'college':
        return <Badge variant="outline" className="bg-purple-100 text-purple-800">College</Badge>;
      case 'elite':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Elite</Badge>;
      case 'professional':
        return <Badge variant="outline" className="bg-red-100 text-red-800">Professional</Badge>;
      case 'recreational':
        return <Badge variant="outline" className="bg-teal-100 text-teal-800">Recreational</Badge>;
      case 'mixed':
        return <Badge variant="outline" className="bg-indigo-100 text-indigo-800">Mixed</Badge>;
      case 'other':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800">Other</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };
  
  // Filter camps based on search, type, and status
  const getFilteredCamps = () => {
    if (!camps?.data) return [];
    
    return camps.data
      .filter((camp: Camp) => {
        const matchesSearch = 
          camp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          camp.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          camp.venue?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesType = typeFilter === 'all' || camp.type === typeFilter;
        const matchesStatus = statusFilter === 'all' || camp.status === statusFilter;
        
        return matchesSearch && matchesType && matchesStatus;
      })
      .sort((a: Camp, b: Camp) => {
        // Sort by start date (most recent first)
        return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
      });
  };
  
  // Calculate completion percentage
  const calculateCompletion = (camp: Camp): number => {
    // Simple implementation, real one would be more complex
    return camp.checklistCompletion || 0;
  };
  
  // If loading
  if (isLoadingCamps && isLoadingTemplates) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="flex items-center mb-4">
        <Button variant="outline" onClick={() => setLocation('/events/overview')}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Overview
        </Button>
        <h1 className="text-2xl font-bold ml-4">Camp Planning</h1>
        <div className="ml-auto space-x-2">
          <Button 
            variant="secondary"
            onClick={() => setShowFromTemplateDialog(true)}
          >
            <ClipboardCheck className="mr-2 h-4 w-4" />
            Create from Template
          </Button>
          <Button onClick={() => setShowNewCampDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create New Camp
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="new">New Camp</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>
        
        <div className="flex items-center mt-4 mb-6 gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search camps or templates..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {activeTab === 'new' && (
            <>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="camp">Camp</SelectItem>
                  <SelectItem value="clinic">Clinic</SelectItem>
                  <SelectItem value="tournament">Tournament</SelectItem>
                  <SelectItem value="retreat">Retreat</SelectItem>
                  <SelectItem value="workshop">Workshop</SelectItem>
                  <SelectItem value="seminar">Seminar</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="open">Registration Open</SelectItem>
                  <SelectItem value="closed">Registration Closed</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </>
          )}
        </div>
        
        <TabsContent value="new" className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-b from-primary/5 to-primary/10 border-primary/20 shadow-sm cursor-pointer transition-transform hover:scale-[1.01]" 
                  onClick={() => setShowNewCampDialog(true)}>
              <CardContent className="pt-6 flex flex-col items-center justify-center h-56">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Plus className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl mb-2">Create New Camp</CardTitle>
                <CardDescription className="text-center">
                  Start from scratch and create a completely custom camp
                </CardDescription>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-b from-blue-50 to-blue-100 border-blue-200 shadow-sm cursor-pointer transition-transform hover:scale-[1.01]"
                  onClick={() => setShowFromTemplateDialog(true)}>
              <CardContent className="pt-6 flex flex-col items-center justify-center h-56">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                  <ClipboardCheck className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle className="text-xl mb-2">Use a Template</CardTitle>
                <CardDescription className="text-center">
                  Start with a pre-configured template to save time
                </CardDescription>
              </CardContent>
            </Card>
            
            {getFilteredCamps().map((camp: Camp) => (
              <Card key={camp.id} className="shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex justify-between">
                    <div className="flex flex-col">
                      <CardTitle className="mb-1">{camp.name}</CardTitle>
                      <CardDescription className="text-sm">
                        {camp.location && `${camp.location}`}
                      </CardDescription>
                    </div>
                    <div className="flex items-start">
                      {getStatusBadge(camp.status)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div>
                      <p className="text-xs text-gray-500">Dates</p>
                      <p className="text-sm font-medium">
                        {formatDisplayDate(camp.startDate)} - {formatDisplayDate(camp.endDate)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Type & Category</p>
                      <div className="flex items-center gap-1 mt-1">
                        {getTypeBadge(camp.type)}
                        {getCategoryBadge(camp.category)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 mb-1">Completion</p>
                    <div className="flex items-center gap-2">
                      <Progress value={calculateCompletion(camp)} className="h-2" />
                      <span className="text-xs font-medium">{calculateCompletion(camp)}%</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs text-gray-500">Registration</p>
                      <p className="text-sm font-medium">
                        {camp.currentRegistrations || 0}/{camp.targetParticipants || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Budget</p>
                      <p className="text-sm font-medium">
                        ${camp.budgetAllocated?.toLocaleString() || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between pt-1">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleDeleteCamp(camp.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setLocation(`/events/camp-project/${camp.id}`)}
                  >
                    Manage
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="templates" className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates?.data
              ?.filter((template: CampTemplate) => 
                template.name.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((template: CampTemplate) => (
                <Card key={template.id} className="shadow-sm">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between">
                      <CardTitle className="mb-1">{template.name}</CardTitle>
                      <div className="flex items-start">
                        {getTypeBadge(template.type)}
                      </div>
                    </div>
                    <CardDescription className="line-clamp-2">
                      {template.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div>
                        <p className="text-xs text-gray-500">Duration</p>
                        <p className="text-sm font-medium">
                          {template.duration} {template.duration === 1 ? 'day' : 'days'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Category</p>
                        <div className="mt-1">
                          {getCategoryBadge(template.category)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-xs text-gray-500">Target Group</p>
                        <p className="text-sm font-medium">
                          {template.targetAgeGroup || 'All Ages'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Price</p>
                        <p className="text-sm font-medium">
                          ${template.registrationPrice?.toLocaleString() || 'Not set'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between pt-1">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openTemplateDetails(template.id)}
                    >
                      <Info className="h-4 w-4 mr-1" />
                      Details
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => selectTemplateForCamp(template.id)}
                    >
                      Use Template
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
          </div>
        </TabsContent>
      </Tabs>
      
      {/* New Camp Dialog */}
      <ScrollableDialog 
        open={showNewCampDialog} 
        onOpenChange={setShowNewCampDialog}
        title="Create New Camp"
        description="Enter the details for your new camp."
        className="sm:max-w-[600px]"
        maxHeight="80vh"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowNewCampDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCamp} disabled={createCampMutation.isPending}>
              {createCampMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Camp
                </>
              )}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 gap-2">
            <Label htmlFor="campName">Camp Name*</Label>
            <Input
              id="campName"
              value={newCamp.name}
              onChange={(e) => setNewCamp({...newCamp, name: e.target.value})}
              placeholder="Enter camp name"
            />
          </div>
          
          <div className="grid grid-cols-1 gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={newCamp.description || ''}
              onChange={(e) => setNewCamp({...newCamp, description: e.target.value})}
              placeholder="Enter camp description"
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date*</Label>
              <Input
                id="startDate"
                type="date"
                value={newCamp.startDate}
                onChange={(e) => setNewCamp({...newCamp, startDate: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date*</Label>
              <Input
                id="endDate"
                type="date"
                value={newCamp.endDate}
                onChange={(e) => setNewCamp({...newCamp, endDate: e.target.value})}
              />
            </div>
          </div>
          
          {newCamp.startDate && newCamp.endDate && (
            <div className="bg-blue-50 p-2 rounded-md text-sm text-blue-800 flex items-center">
              <Info className="h-4 w-4 mr-2" />
              <span>Duration: {calculateDuration(newCamp.startDate, newCamp.endDate)} days</span>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={newCamp.location || ''}
                onChange={(e) => setNewCamp({...newCamp, location: e.target.value})}
                placeholder="Location name"
              />
            </div>
            <div>
              <Label htmlFor="venue">Venue</Label>
              <Input
                id="venue"
                value={newCamp.venue || ''}
                onChange={(e) => setNewCamp({...newCamp, venue: e.target.value})}
                placeholder="Venue name"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={newCamp.city || ''}
                onChange={(e) => setNewCamp({...newCamp, city: e.target.value})}
                placeholder="City"
              />
            </div>
            <div>
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={newCamp.state || ''}
                onChange={(e) => setNewCamp({...newCamp, state: e.target.value})}
                placeholder="State/Province"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">Camp Type</Label>
              <Select
                value={newCamp.type}
                onValueChange={(value) => setNewCamp({...newCamp, type: value as CampType})}
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="camp">Camp</SelectItem>
                  <SelectItem value="clinic">Clinic</SelectItem>
                  <SelectItem value="tournament">Tournament</SelectItem>
                  <SelectItem value="retreat">Retreat</SelectItem>
                  <SelectItem value="workshop">Workshop</SelectItem>
                  <SelectItem value="seminar">Seminar</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                value={newCamp.category}
                onValueChange={(value) => setNewCamp({...newCamp, category: value as CampCategory})}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="youth">Youth</SelectItem>
                  <SelectItem value="highschool">High School</SelectItem>
                  <SelectItem value="college">College</SelectItem>
                  <SelectItem value="elite">Elite</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="recreational">Recreational</SelectItem>
                  <SelectItem value="mixed">Mixed</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="targetParticipants">Target Participants</Label>
              <Input
                id="targetParticipants"
                type="number"
                value={newCamp.targetParticipants || ''}
                onChange={(e) => setNewCamp({
                  ...newCamp, 
                  targetParticipants: e.target.value ? parseInt(e.target.value) : undefined
                })}
                placeholder="Number of participants"
              />
            </div>
            <div>
              <Label htmlFor="registrationPrice">Registration Price ($)</Label>
              <Input
                id="registrationPrice"
                type="number"
                value={newCamp.registrationPrice || ''}
                onChange={(e) => setNewCamp({
                  ...newCamp, 
                  registrationPrice: e.target.value ? parseInt(e.target.value) : undefined
                })}
                placeholder="Price per participant"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="includesSwag"
              checked={newCamp.includesSwag}
              onCheckedChange={(checked) => setNewCamp({
                ...newCamp,
                includesSwag: !!checked
              })}
            />
            <Label htmlFor="includesSwag">Includes swag pack for participants</Label>
          </div>
        </div>
      </ScrollableDialog>
      
      {/* Create from Template Dialog */}
      <ScrollableDialog 
        open={showFromTemplateDialog} 
        onOpenChange={setShowFromTemplateDialog}
        title="Create Camp from Template"
        description="Customize the details for your new camp."
        className="sm:max-w-[600px]"
        maxHeight="80vh"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowFromTemplateDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateFromTemplate} 
              disabled={createFromTemplateMutation.isPending || !selectedTemplateId}
            >
              {createFromTemplateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Create Camp
                </>
              )}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 py-4">
          {!selectedTemplateId ? (
            <div className="bg-amber-50 p-3 rounded-md flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-800">No Template Selected</h4>
                <p className="text-sm text-amber-700">
                  Please select a template first or go back to choose one.
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => {
                    setShowFromTemplateDialog(false);
                    setActiveTab("templates");
                  }}
                >
                  View Templates
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-blue-50 p-3 rounded-md flex items-start">
                <Info className="h-5 w-5 mr-2 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-800">Using Template</h4>
                  <p className="text-sm text-blue-700">
                    {templates?.data?.find((t: CampTemplate) => t.id === selectedTemplateId)?.name}
                  </p>
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="px-0 text-blue-600"
                    onClick={() => openTemplateDetails(selectedTemplateId)}
                  >
                    View Template Details
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="templateCampName">Camp Name*</Label>
                <Input
                  id="templateCampName"
                  value={newCamp.name}
                  onChange={(e) => setNewCamp({...newCamp, name: e.target.value})}
                  placeholder="Enter camp name"
                />
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="templateDescription">Description</Label>
                <Textarea
                  id="templateDescription"
                  value={newCamp.description || ''}
                  onChange={(e) => setNewCamp({...newCamp, description: e.target.value})}
                  placeholder="Enter camp description"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="templateStartDate">Start Date*</Label>
                  <Input
                    id="templateStartDate"
                    type="date"
                    value={newCamp.startDate}
                    onChange={(e) => setNewCamp({...newCamp, startDate: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="templateEndDate">End Date*</Label>
                  <Input
                    id="templateEndDate"
                    type="date"
                    value={newCamp.endDate}
                    onChange={(e) => setNewCamp({...newCamp, endDate: e.target.value})}
                  />
                </div>
              </div>
              
              {newCamp.startDate && newCamp.endDate && (
                <div className="bg-blue-50 p-2 rounded-md text-sm text-blue-800 flex items-center">
                  <Info className="h-4 w-4 mr-2" />
                  <span>Duration: {calculateDuration(newCamp.startDate, newCamp.endDate)} days</span>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="templateLocation">Location</Label>
                  <Input
                    id="templateLocation"
                    value={newCamp.location || ''}
                    onChange={(e) => setNewCamp({...newCamp, location: e.target.value})}
                    placeholder="Location name"
                  />
                </div>
                <div>
                  <Label htmlFor="templateVenue">Venue</Label>
                  <Input
                    id="templateVenue"
                    value={newCamp.venue || ''}
                    onChange={(e) => setNewCamp({...newCamp, venue: e.target.value})}
                    placeholder="Venue name"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="templateCity">City</Label>
                  <Input
                    id="templateCity"
                    value={newCamp.city || ''}
                    onChange={(e) => setNewCamp({...newCamp, city: e.target.value})}
                    placeholder="City"
                  />
                </div>
                <div>
                  <Label htmlFor="templateState">State</Label>
                  <Input
                    id="templateState"
                    value={newCamp.state || ''}
                    onChange={(e) => setNewCamp({...newCamp, state: e.target.value})}
                    placeholder="State/Province"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="templateParticipants">Target Participants</Label>
                  <Input
                    id="templateParticipants"
                    type="number"
                    value={newCamp.targetParticipants || ''}
                    onChange={(e) => setNewCamp({
                      ...newCamp, 
                      targetParticipants: e.target.value ? parseInt(e.target.value) : undefined
                    })}
                    placeholder="Number of participants"
                  />
                </div>
                <div>
                  <Label htmlFor="templatePrice">Registration Price ($)</Label>
                  <Input
                    id="templatePrice"
                    type="number"
                    value={newCamp.registrationPrice || ''}
                    onChange={(e) => setNewCamp({
                      ...newCamp, 
                      registrationPrice: e.target.value ? parseInt(e.target.value) : undefined
                    })}
                    placeholder="Price per participant"
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </ScrollableDialog>
      
      {/* Template Details Dialog */}
      <ScrollableDialog 
        open={showTemplateDetailsDialog} 
        onOpenChange={setShowTemplateDetailsDialog}
        title="Template Details"
        description="View details of this camp template."
        className="sm:max-w-[800px]"
        maxHeight="80vh"
        footer={
          <div className="flex justify-between w-full">
            <div>
              <Button variant="outline" onClick={() => setShowTemplateDetailsDialog(false)}>
                Close
              </Button>
            </div>
            <div>
              <Button 
                onClick={() => {
                  setShowTemplateDetailsDialog(false);
                  selectTemplateForCamp(selectedTemplateId!);
                }}
                disabled={!selectedTemplateId}
              >
                Use This Template
              </Button>
            </div>
          </div>
        }
      >
        {selectedTemplateId && templates?.data && (
          <div className="py-4">
            {(() => {
              const template = templates.data.find((t: CampTemplate) => t.id === selectedTemplateId);
              if (!template) return <p>Template not found</p>;
              
              return (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold">{template.name}</h3>
                    <p className="text-gray-600 mt-1">{template.description}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-700">Basic Info</h4>
                      <div className="mt-2 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Type:</span>
                          <span className="font-medium">{template.type}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Category:</span>
                          <span className="font-medium">{template.category}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Duration:</span>
                          <span className="font-medium">{template.duration} days</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Target Age Group:</span>
                          <span className="font-medium">{template.targetAgeGroup || 'All Ages'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Target Participants:</span>
                          <span className="font-medium">{template.targetParticipants || 'Not specified'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Registration Price:</span>
                          <span className="font-medium">${template.registrationPrice?.toLocaleString() || 'Not set'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Includes Swag:</span>
                          <span className="font-medium">{template.includesSwag ? 'Yes' : 'No'}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-700">Usage Info</h4>
                      <div className="mt-2 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Created:</span>
                          <span className="font-medium">{template.created ? formatDate(template.created) : 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Last Used:</span>
                          <span className="font-medium">{template.lastUsed ? formatDate(template.lastUsed) : 'Never'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Use Count:</span>
                          <span className="font-medium">{template.useCount || 0} times</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {template.staffingRequirements && template.staffingRequirements.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-700">Staffing Requirements</h4>
                      <Table className="mt-2">
                        <TableHeader>
                          <TableRow>
                            <TableHead>Role</TableHead>
                            <TableHead className="text-center">Count</TableHead>
                            <TableHead>Skills Required</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {template.staffingRequirements.map((req, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{req.role}</TableCell>
                              <TableCell className="text-center">{req.count}</TableCell>
                              <TableCell>
                                {req.skillsRequired?.join(', ') || 'None specified'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                  
                  {template.agendaTemplate && template.agendaTemplate.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-700">Agenda Template</h4>
                      <Table className="mt-2">
                        <TableHeader>
                          <TableRow>
                            <TableHead>Day</TableHead>
                            <TableHead>Time</TableHead>
                            <TableHead>Title</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Description</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {template.agendaTemplate.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell>{item.day}</TableCell>
                              <TableCell>{item.startTime} - {item.endTime}</TableCell>
                              <TableCell className="font-medium">{item.title}</TableCell>
                              <TableCell>{item.type}</TableCell>
                              <TableCell className="max-w-xs truncate">
                                {item.description || 'No description'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                  
                  {template.facilities && template.facilities.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-700">Facility Requirements</h4>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {template.facilities.map((facility, index) => (
                          <Badge key={index} variant="outline" className="bg-gray-100">
                            {facility}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}
      </ScrollableDialog>
    </div>
  );
}

export default CampPlanning;