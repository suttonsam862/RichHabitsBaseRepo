import React, { useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  ChevronLeft,
  Calendar,
  Users,
  ClipboardCheck,
  Building,
  DollarSign,
  Clock,
  MapPin,
  Truck,
  FileText,
  Clipboard,
  LineChart,
  PlusCircle,
  Edit,
  UserCircle,
  Settings,
  Loader2,
  CheckCircle2,
  CircleDashed,
  ShoppingBag,
  Share2,
  Newspaper,
  UserPlus,
  Tablet
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatDate, formatCurrency } from "@/lib/utils";

// Status type definition
type CampStatus = 'planning' | 'confirmed' | 'active' | 'completed' | 'cancelled';

// Task type definition
interface Task {
  id: number;
  title: string;
  description?: string;
  completed: boolean;
  dueDate?: string;
  assignedTo?: string;
  priority: 'low' | 'medium' | 'high';
  category: 'registration' | 'venue' | 'staff' | 'equipment' | 'travel' | 'marketing' | 'other';
}

function CampProject() {
  const [location] = useLocation();
  const { toast } = useToast();
  const searchParams = new URLSearchParams(window.location.search);
  const campId = searchParams.get('id');
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [templateName, setTemplateName] = useState("");
  
  // Fetch camp details
  const { 
    data: camp, 
    isLoading: isLoadingCamp,
    isError: isCampError
  } = useQuery({
    queryKey: [`/api/camps/${campId}`],
    enabled: !!campId,
  });
  
  // Fetch camp tasks
  const {
    data: tasks,
    isLoading: isLoadingTasks
  } = useQuery({
    queryKey: [`/api/camps/${campId}/tasks`],
    enabled: !!campId,
  });
  
  // Fetch camp staff
  const {
    data: staff,
    isLoading: isLoadingStaff
  } = useQuery({
    queryKey: [`/api/camps/${campId}/staff`],
    enabled: !!campId,
  });
  
  // Fetch registration stats
  const {
    data: registrationStats,
    isLoading: isLoadingRegistrationStats
  } = useQuery({
    queryKey: [`/api/camps/${campId}/registration-stats`],
    enabled: !!campId,
  });
  
  // Fetch budget summary
  const {
    data: budgetSummary,
    isLoading: isLoadingBudget
  } = useQuery({
    queryKey: [`/api/camps/${campId}/budget-summary`],
    enabled: !!campId,
  });
  
  // Create template from camp mutation
  const createTemplateMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(
        "POST", 
        `/api/camp-templates/from-camp/${campId}`,
        { name: templateName || `${campData?.name} Template` }
      );
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Template created",
        description: "The camp has been successfully converted to a template."
      });
      setShowTemplateDialog(false);
      setTemplateName("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating template",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Handle template creation
  const handleCreateTemplate = () => {
    if (!templateName) {
      toast({
        title: "Template name required",
        description: "Please provide a name for the template.",
        variant: "destructive"
      });
      return;
    }
    createTemplateMutation.mutate();
  };
  
  // Go back to planning (camp list)
  const handleBackToOverview = () => {
    window.location.href = '/events/planning';
  };
  
  // Navigate to a module
  const navigateToModule = (module: string) => {
    window.location.href = `/events/${module}?id=${campId}`;
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
          <Button variant="outline" onClick={handleBackToOverview}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Camp Planning
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
            <Button onClick={handleBackToOverview}>
              Go to Camp Planning
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  const campData = camp.data;
  const taskData = tasks?.data || [];
  const staffData = staff?.data || [];
  const registrationData = registrationStats?.data;
  const budgetData = budgetSummary?.data;
  
  // Calculate camp status
  const getCampStatus = (): CampStatus => {
    if (!campData.startDate || !campData.endDate) return 'planning';
    
    const now = new Date();
    const startDate = new Date(campData.startDate);
    const endDate = new Date(campData.endDate);
    
    if (campData.status === 'cancelled') return 'cancelled';
    if (now > endDate) return 'completed';
    if (now >= startDate && now <= endDate) return 'active';
    if (campData.status === 'confirmed') return 'confirmed';
    
    return 'planning';
  };
  
  const campStatus = getCampStatus();
  
  // Calculate days until camp
  const getDaysUntilCamp = (): number | null => {
    if (!campData.startDate) return null;
    
    const now = new Date();
    const startDate = new Date(campData.startDate);
    
    // If camp is already over, return null
    if (campStatus === 'completed' || campStatus === 'cancelled') return null;
    
    const differenceInTime = startDate.getTime() - now.getTime();
    const differenceInDays = Math.ceil(differenceInTime / (1000 * 3600 * 24));
    
    return differenceInDays;
  };
  
  const daysUntilCamp = getDaysUntilCamp();
  
  // Calculate task completion percentage
  const getTaskCompletionPercentage = (): number => {
    if (!taskData.length) return 0;
    
    const completedTasks = taskData.filter(task => task.completed).length;
    return Math.round((completedTasks / taskData.length) * 100);
  };
  
  const taskCompletionPercentage = getTaskCompletionPercentage();
  
  // Get status badge color
  const getStatusColor = (status: CampStatus): string => {
    switch (status) {
      case 'planning':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'confirmed':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'completed':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };
  
  // Format status text
  const formatStatus = (status: CampStatus): string => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };
  
  // Get module icon
  const getModuleIcon = (module: string) => {
    switch (module) {
      case 'agenda-builder':
        return <Calendar className="h-5 w-5" />;
      case 'registration':
        return <ClipboardCheck className="h-5 w-5" />;
      case 'venue-planner':
        return <Building className="h-5 w-5" />;
      case 'budget-tracker':
        return <DollarSign className="h-5 w-5" />;
      case 'travel':
        return <Truck className="h-5 w-5" />;
      case 'staff':
        return <Users className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };
  
  return (
    <div className="container mx-auto py-6">
      {/* Template Creation Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Template</DialogTitle>
            <DialogDescription>
              Create a reusable template from this camp. This will copy camp details, agenda, staff requirements, and other associated data.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="template-name">Template Name</Label>
              <Input
                id="template-name"
                placeholder="Enter template name..."
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowTemplateDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateTemplate}
              disabled={createTemplateMutation.isPending}
            >
              {createTemplateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Template"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleBackToOverview} className="mr-2">
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:block ml-1">Back to Camp Planning</span>
            </Button>
            <h1 className="text-2xl font-bold md:text-3xl">{campData.name}</h1>
            <Badge
              variant="outline"
              className={getStatusColor(campStatus)}
            >
              {formatStatus(campStatus)}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            <span>{campData.type || 'Camp'}</span>
            {campData.startDate && (
              <span> • {formatDate(campData.startDate)} to {formatDate(campData.endDate)}</span>
            )}
            {daysUntilCamp !== null && (
              <span> • {daysUntilCamp} {daysUntilCamp === 1 ? 'day' : 'days'} until camp</span>
            )}
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-2">
          <Button 
            variant="outline" 
            className="hidden md:flex"
            onClick={() => setShowTemplateDialog(true)}
          >
            <Share2 className="mr-2 h-4 w-4" />
            Save as Template
          </Button>
          <Button variant="outline" className="hidden md:flex">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
          <Button>
            <Edit className="mr-2 h-4 w-4" />
            Edit Camp
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column - Camp Details & Team */}
        <div className="space-y-6">
          {/* Camp Details */}
          <Card>
            <CardHeader>
              <CardTitle>Camp Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Dates</span>
                </div>
                <span className="text-sm font-medium">
                  {campData.startDate ? (
                    <>{formatDate(campData.startDate)} - {formatDate(campData.endDate)}</>
                  ) : (
                    'Not set'
                  )}
                </span>
              </div>
              
              <div className="flex justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Location</span>
                </div>
                <span className="text-sm font-medium">
                  {campData.venue || 'Not set'}
                </span>
              </div>
              
              <div className="flex justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Capacity</span>
                </div>
                <span className="text-sm font-medium">
                  {campData.participants || 'Not set'}
                </span>
              </div>
              
              <div className="flex justify-between">
                <div className="flex items-center gap-2">
                  <UserCircle className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Director</span>
                </div>
                <span className="text-sm font-medium">
                  {campData.clinician || 'Not assigned'}
                </span>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="text-sm font-medium mb-2">Description</h4>
                <p className="text-sm text-muted-foreground">
                  {campData.notes || 'No description available.'}
                </p>
              </div>
            </CardContent>
          </Card>
          
          {/* Team Members */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle>Team</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => navigateToModule('staff')}>
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingStaff ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : staffData.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">No team members assigned yet.</p>
                  <Button variant="outline" className="mt-2" onClick={() => navigateToModule('staff')}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Staff
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {staffData.slice(0, 5).map((member) => (
                    <div key={member.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                          {member.avatarUrl && (
                            <AvatarImage src={member.avatarUrl} alt={member.name} />
                          )}
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{member.name}</p>
                          <p className="text-xs text-muted-foreground">{member.role}</p>
                        </div>
                      </div>
                      <Badge variant="outline">{member.payAmount || 'N/A'}</Badge>
                    </div>
                  ))}
                  
                  {staffData.length > 5 && (
                    <Button variant="outline" className="w-full" onClick={() => navigateToModule('staff')}>
                      View All {staffData.length} Team Members
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Progress */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Task Completion</span>
                  <span className="font-medium">{taskCompletionPercentage}%</span>
                </div>
                <Progress value={taskCompletionPercentage} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Registration</span>
                  <span className="font-medium">
                    {registrationData ? (
                      `${registrationData.currentRegistrations}/${registrationData.capacity || '∞'}`
                    ) : (
                      'N/A'
                    )}
                  </span>
                </div>
                <Progress 
                  value={registrationData ? (
                    registrationData.capacity ? 
                    (registrationData.currentRegistrations / registrationData.capacity) * 100 : 
                    0
                  ) : 0} 
                  className="h-2" 
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Budget</span>
                  <span className="font-medium">
                    {budgetData ? (
                      `${budgetData.expensesCompleted}/${budgetData.totalExpenses} expenses`
                    ) : (
                      'N/A'
                    )}
                  </span>
                </div>
                <Progress 
                  value={budgetData ? (
                    budgetData.totalExpenses ? 
                    (budgetData.expensesCompleted / budgetData.totalExpenses) * 100 : 
                    0
                  ) : 0} 
                  className="h-2" 
                />
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Right Column - Modules and Tasks */}
        <div className="md:col-span-2 space-y-6">
          {/* Camp Modules */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Agenda Builder */}
            <Card className="group hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center">
                  <Calendar className="mr-2 h-5 w-5 text-primary" />
                  Agenda Builder
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-2">
                <p className="text-sm text-muted-foreground">
                  Build daily schedules, organize sessions, and assign staff.
                </p>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full group-hover:bg-primary/90"
                  onClick={() => navigateToModule('agenda-builder')}
                >
                  Open Agenda
                </Button>
              </CardFooter>
            </Card>
            
            {/* Registration */}
            <Card className="group hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center">
                  <ClipboardCheck className="mr-2 h-5 w-5 text-primary" />
                  Registration
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-2">
                <p className="text-sm text-muted-foreground">
                  Manage participants, view registrations, and set up tiers.
                </p>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full group-hover:bg-primary/90"
                  onClick={() => navigateToModule('registration')}
                >
                  Manage Registrations
                </Button>
              </CardFooter>
            </Card>
            
            {/* Venue Planner */}
            <Card className="group hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center">
                  <Building className="mr-2 h-5 w-5 text-primary" />
                  Venue Planner
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-2">
                <p className="text-sm text-muted-foreground">
                  Design floor layouts, manage equipment, and coordinate vendors.
                </p>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full group-hover:bg-primary/90"
                  onClick={() => navigateToModule('venue-planner')}
                >
                  Plan Venue
                </Button>
              </CardFooter>
            </Card>
            
            {/* Budget Tracker */}
            <Card className="group hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center">
                  <DollarSign className="mr-2 h-5 w-5 text-primary" />
                  Budget Tracker
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-2">
                <p className="text-sm text-muted-foreground">
                  Track revenue, expenses, and manage financial operations.
                </p>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full group-hover:bg-primary/90"
                  onClick={() => navigateToModule('budget-tracker')}
                >
                  Track Finances
                </Button>
              </CardFooter>
            </Card>
            
            {/* Staff Manager */}
            <Card className="group hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center">
                  <Users className="mr-2 h-5 w-5 text-primary" />
                  Staff Manager
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-2">
                <p className="text-sm text-muted-foreground">
                  Assign roles, manage contracts, and coordinate staff needs.
                </p>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full group-hover:bg-primary/90"
                  onClick={() => navigateToModule('staff')}
                >
                  Manage Team
                </Button>
              </CardFooter>
            </Card>
            
            {/* Travel Coordinator */}
            <Card className="group hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center">
                  <Truck className="mr-2 h-5 w-5 text-primary" />
                  Travel Coordinator
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-2">
                <p className="text-sm text-muted-foreground">
                  Track flights, accommodations, and transportation needs.
                </p>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full group-hover:bg-primary/90"
                  onClick={() => navigateToModule('travel')}
                >
                  Plan Travel
                </Button>
              </CardFooter>
            </Card>
            
            {/* Swag Pack Manager */}
            <Card className="group hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center">
                  <ShoppingBag className="mr-2 h-5 w-5 text-primary" />
                  Swag Pack Manager
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-2">
                <p className="text-sm text-muted-foreground">
                  Track merchandise distribution, sizing, and generate packing slips.
                </p>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full group-hover:bg-primary/90"
                  onClick={() => navigateToModule('swag-manager')}
                >
                  Manage Swag
                </Button>
              </CardFooter>
            </Card>
            
            {/* Marketing & Media Panel */}
            <Card className="group hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center">
                  <Newspaper className="mr-2 h-5 w-5 text-primary" />
                  Marketing & Media
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-2">
                <p className="text-sm text-muted-foreground">
                  Manage social media, email campaigns, and sponsor assets.
                </p>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full group-hover:bg-primary/90"
                  onClick={() => navigateToModule('media-panel')}
                >
                  Open Media Panel
                </Button>
              </CardFooter>
            </Card>
            
            {/* Team Portal */}
            <Card className="group hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center">
                  <UserPlus className="mr-2 h-5 w-5 text-primary" />
                  Team Portal
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-2">
                <p className="text-sm text-muted-foreground">
                  Manage staff, assign roles, and coordinate team tasks.
                </p>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full group-hover:bg-primary/90"
                  onClick={() => navigateToModule('team-portal')}
                >
                  Manage Team
                </Button>
              </CardFooter>
            </Card>
            
            {/* Check-In & Onsite Tools */}
            <Card className="group hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center">
                  <Tablet className="mr-2 h-5 w-5 text-primary" />
                  Check-In & Onsite Tools
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-2">
                <p className="text-sm text-muted-foreground">
                  Digital check-in, QR scanning, and real-time camp management.
                </p>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full group-hover:bg-primary/90"
                  onClick={() => navigateToModule('checkin-tools')}
                >
                  Open Onsite Tools
                </Button>
              </CardFooter>
            </Card>
          </div>
          
          {/* Task Management */}
          <Tabs defaultValue="all" className="space-y-4">
            <div className="flex justify-between items-center">
              <TabsList>
                <TabsTrigger value="all">All Tasks</TabsTrigger>
                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
              </TabsList>
              <Button variant="outline">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Task
              </Button>
            </div>
            
            <TabsContent value="all">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Camp Tasks</CardTitle>
                  <CardDescription>
                    Manage and track tasks for this camp
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingTasks ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : taskData.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No tasks have been created yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {taskData.map((task) => (
                        <div 
                          key={task.id} 
                          className={`flex items-start p-3 rounded-md border ${
                            task.completed ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
                          }`}
                        >
                          <div className="mr-3 mt-0.5">
                            {task.completed ? (
                              <CheckCircle2 className="h-5 w-5 text-green-500" />
                            ) : (
                              <CircleDashed className="h-5 w-5 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-grow">
                            <div className="flex justify-between">
                              <h4 className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                                {task.title}
                              </h4>
                              <div className="flex items-center gap-2">
                                {task.dueDate && (
                                  <span className="text-xs text-muted-foreground">
                                    Due: {formatDate(task.dueDate)}
                                  </span>
                                )}
                                <Badge 
                                  variant="outline"
                                  className={
                                    task.priority === 'high' ? 'bg-red-100 text-red-800' :
                                    task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-blue-100 text-blue-800'
                                  }
                                >
                                  {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                                </Badge>
                                <Badge variant="outline">
                                  {task.category.charAt(0).toUpperCase() + task.category.slice(1)}
                                </Badge>
                              </div>
                            </div>
                            {task.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {task.description}
                              </p>
                            )}
                            {task.assignedTo && (
                              <div className="flex items-center mt-2">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Avatar className="h-6 w-6">
                                        <AvatarFallback className="text-xs">
                                          {task.assignedTo.split(' ').map(n => n[0]).join('')}
                                        </AvatarFallback>
                                      </Avatar>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Assigned to: {task.assignedTo}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="upcoming">
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Tasks</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingTasks ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : taskData.filter(t => !t.completed).length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No upcoming tasks available.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {taskData
                        .filter(task => !task.completed)
                        .sort((a, b) => {
                          if (a.dueDate && b.dueDate) {
                            return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
                          }
                          return 0;
                        })
                        .map((task) => (
                          <div 
                            key={task.id} 
                            className="flex items-start p-3 rounded-md border bg-white border-gray-200"
                          >
                            <div className="mr-3 mt-0.5">
                              <CircleDashed className="h-5 w-5 text-gray-400" />
                            </div>
                            <div className="flex-grow">
                              <div className="flex justify-between">
                                <h4 className="font-medium">
                                  {task.title}
                                </h4>
                                <div className="flex items-center gap-2">
                                  {task.dueDate && (
                                    <span className="text-xs text-muted-foreground">
                                      Due: {formatDate(task.dueDate)}
                                    </span>
                                  )}
                                  <Badge 
                                    variant="outline"
                                    className={
                                      task.priority === 'high' ? 'bg-red-100 text-red-800' :
                                      task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-blue-100 text-blue-800'
                                    }
                                  >
                                    {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                                  </Badge>
                                </div>
                              </div>
                              {task.description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {task.description}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="completed">
              <Card>
                <CardHeader>
                  <CardTitle>Completed Tasks</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingTasks ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : taskData.filter(t => t.completed).length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No completed tasks available.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {taskData
                        .filter(task => task.completed)
                        .map((task) => (
                          <div 
                            key={task.id} 
                            className="flex items-start p-3 rounded-md border bg-green-50 border-green-200"
                          >
                            <div className="mr-3 mt-0.5">
                              <CheckCircle2 className="h-5 w-5 text-green-500" />
                            </div>
                            <div className="flex-grow">
                              <div className="flex justify-between">
                                <h4 className="font-medium line-through text-muted-foreground">
                                  {task.title}
                                </h4>
                                <Badge variant="outline">
                                  {task.category.charAt(0).toUpperCase() + task.category.slice(1)}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

export default CampProject;