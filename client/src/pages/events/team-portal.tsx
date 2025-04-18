import React, { useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronLeft,
  Plus,
  Search,
  Loader2,
  UserPlus,
  Users,
  User,
  Shield,
  CheckCircle2,
  Clock,
  ClipboardList,
  Eye,
  EyeOff,
  MoreHorizontal,
  Send,
  Mail,
  Phone,
  Edit,
  Trash2,
  Download,
  Filter,
  FileCheck,
  Share2
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDate } from "@/lib/utils";

// Types
interface StaffMember {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: TeamRole;
  status: 'active' | 'invited' | 'inactive';
  avatar?: string;
  bio?: string;
  department?: string;
  assignedTasks?: number;
  completedTasks?: number;
  joinedDate?: string;
  lastActive?: string;
  permissions: Permission[];
}

type TeamRole = 
  | 'director'
  | 'manager'
  | 'logistics'
  | 'media'
  | 'clinician'
  | 'check-in'
  | 'staff'
  | 'other';

type Permission = 
  | 'view_registrations'
  | 'edit_registrations'
  | 'view_schedule'
  | 'edit_schedule'
  | 'view_swag'
  | 'edit_swag'
  | 'view_budget'
  | 'edit_budget'
  | 'view_venue'
  | 'edit_venue'
  | 'edit_team'
  | 'admin';

interface Task {
  id: number;
  title: string;
  description?: string;
  assignedTo?: number;
  dueDate?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  priority: 'low' | 'medium' | 'high';
  tags?: string[];
  createdAt: string;
  createdBy?: number;
  updatedAt?: string;
}

interface RoleTemplate {
  id: number;
  name: string;
  description: string;
  permissions: Permission[];
  defaultTasks: {
    title: string;
    description?: string;
    priority: 'low' | 'medium' | 'high';
  }[];
}

function TeamPortal() {
  const [location, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const campId = searchParams.get('campId');
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("team");
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showAddMember, setShowAddMember] = useState(false);
  const [showEditPermissions, setShowEditPermissions] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [showAssignTask, setShowAssignTask] = useState(false);
  const [showRoleTemplates, setShowRoleTemplates] = useState(false);
  const [selectedRoleTemplate, setSelectedRoleTemplate] = useState<RoleTemplate | null>(null);
  const [newMember, setNewMember] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'staff' as TeamRole,
    useTemplate: true
  });
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    dueDate: '',
    assignedTo: null as number | null
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
  
  // Fetch team members
  const {
    data: teamMembers,
    isLoading: isLoadingTeam
  } = useQuery({
    queryKey: ['/api/camps', campId, 'team'],
    enabled: !!campId,
  });
  
  // Fetch tasks
  const {
    data: tasks,
    isLoading: isLoadingTasks
  } = useQuery({
    queryKey: ['/api/camps', campId, 'tasks'],
    enabled: !!campId,
  });
  
  // Fetch role templates
  const {
    data: roleTemplates,
    isLoading: isLoadingTemplates
  } = useQuery({
    queryKey: ['/api/role-templates'],
    enabled: true,
  });
  
  // Add team member mutation
  const addTeamMemberMutation = useMutation({
    mutationFn: async (memberData: typeof newMember) => {
      const response = await apiRequest(
        "POST",
        `/api/camps/${campId}/team`,
        memberData
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Team member added",
        description: "An invitation has been sent to join the team."
      });
      queryClient.invalidateQueries({
        queryKey: ['/api/camps', campId, 'team']
      });
      setShowAddMember(false);
      setNewMember({
        name: '',
        email: '',
        phone: '',
        role: 'staff',
        useTemplate: true
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add team member",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Update member permissions mutation
  const updatePermissionsMutation = useMutation({
    mutationFn: async ({ id, permissions }: { id: number, permissions: Permission[] }) => {
      const response = await apiRequest(
        "PUT",
        `/api/camps/${campId}/team/${id}`,
        { permissions }
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Permissions updated",
        description: "Team member permissions have been updated successfully."
      });
      queryClient.invalidateQueries({
        queryKey: ['/api/camps', campId, 'team']
      });
      setShowEditPermissions(false);
      setSelectedMemberId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update permissions",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Assign task mutation
  const assignTaskMutation = useMutation({
    mutationFn: async (taskData: typeof newTask) => {
      const response = await apiRequest(
        "POST",
        `/api/camps/${campId}/tasks`,
        taskData
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Task assigned",
        description: "The task has been assigned successfully."
      });
      queryClient.invalidateQueries({
        queryKey: ['/api/camps', campId, 'tasks']
      });
      setShowAssignTask(false);
      setNewTask({
        title: '',
        description: '',
        priority: 'medium',
        dueDate: '',
        assignedTo: null
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to assign task",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Remove team member mutation
  const removeTeamMemberMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest(
        "DELETE",
        `/api/camps/${campId}/team/${id}`,
        {}
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Team member removed",
        description: "The team member has been removed from this camp."
      });
      queryClient.invalidateQueries({
        queryKey: ['/api/camps', campId, 'team']
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to remove team member",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Send reminder mutation
  const sendReminderMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest(
        "POST",
        `/api/camps/${campId}/team/${id}/remind`,
        {}
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Reminder sent",
        description: "A reminder has been sent to the team member."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send reminder",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Export team list mutation
  const exportTeamListMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(
        "GET",
        `/api/camps/${campId}/team/export`,
        {}
      );
      return response.json();
    },
    onSuccess: (data) => {
      // In a real implementation, this would download a CSV
      toast({
        title: "Team list exported",
        description: "Your team list has been exported successfully."
      });
      
      // Create a simple CSV export
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += "Name,Email,Phone,Role,Status\n";
      
      teamMembers?.data?.forEach((member: StaffMember) => {
        csvContent += `${member.name},${member.email},${member.phone || 'N/A'},${member.role},${member.status}\n`;
      });
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `team_list_camp_${campId}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to export team list",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Handle adding team member
  const handleAddTeamMember = () => {
    if (!newMember.name || !newMember.email) {
      toast({
        title: "Missing information",
        description: "Please provide at least a name and email for the new team member.",
        variant: "destructive"
      });
      return;
    }
    
    addTeamMemberMutation.mutate(newMember);
  };
  
  // Handle updating permissions
  const handleUpdatePermissions = () => {
    const member = teamMembers?.data?.find((m: StaffMember) => m.id === selectedMemberId);
    if (!member) return;
    
    updatePermissionsMutation.mutate({
      id: member.id,
      permissions: member.permissions
    });
  };
  
  // Handle assigning task
  const handleAssignTask = () => {
    if (!newTask.title) {
      toast({
        title: "Missing information",
        description: "Please provide a title for the task.",
        variant: "destructive"
      });
      return;
    }
    
    assignTaskMutation.mutate(newTask);
  };
  
  // Handle removing team member
  const handleRemoveTeamMember = (id: number) => {
    if (window.confirm("Are you sure you want to remove this team member?")) {
      removeTeamMemberMutation.mutate(id);
    }
  };
  
  // Handle sending reminder
  const handleSendReminder = (id: number) => {
    sendReminderMutation.mutate(id);
  };
  
  // Handle exporting team list
  const handleExportTeamList = () => {
    exportTeamListMutation.mutate();
  };
  
  // Apply role template
  const applyRoleTemplate = (templateId: number) => {
    const template = roleTemplates?.data?.find((t: RoleTemplate) => t.id === templateId);
    if (!template) return;
    
    setSelectedRoleTemplate(template);
    
    // In a real implementation, we would also set up default tasks
    toast({
      title: "Role template applied",
      description: `Applied the ${template.name} template with ${template.permissions.length} permissions and ${template.defaultTasks.length} default tasks.`
    });
  };
  
  // Toggle permission for a team member
  const togglePermission = (member: StaffMember, permission: Permission) => {
    const memberIndex = teamMembers?.data?.findIndex((m: StaffMember) => m.id === member.id);
    if (memberIndex === -1) return;
    
    const updatedTeamMembers = [...teamMembers?.data];
    const updatedMember = {...updatedTeamMembers[memberIndex]};
    
    if (updatedMember.permissions.includes(permission)) {
      updatedMember.permissions = updatedMember.permissions.filter(p => p !== permission);
    } else {
      updatedMember.permissions = [...updatedMember.permissions, permission];
    }
    
    updatedTeamMembers[memberIndex] = updatedMember;
    queryClient.setQueryData(['/api/camps', campId, 'team'], { data: updatedTeamMembers });
  };
  
  // Get role display name
  const getRoleDisplayName = (role: TeamRole): string => {
    switch (role) {
      case 'director': return 'Event Director';
      case 'manager': return 'Onsite Manager';
      case 'logistics': return 'Logistics Coordinator';
      case 'media': return 'Media Team';
      case 'clinician': return 'Clinician';
      case 'check-in': return 'Check-in Staff';
      case 'staff': return 'Staff';
      case 'other': return 'Other';
      default: return 'Unknown Role';
    }
  };
  
  // Get role badge color
  const getRoleBadgeClass = (role: TeamRole): string => {
    switch (role) {
      case 'director': return 'bg-purple-100 text-purple-800';
      case 'manager': return 'bg-blue-100 text-blue-800';
      case 'logistics': return 'bg-green-100 text-green-800';
      case 'media': return 'bg-yellow-100 text-yellow-800';
      case 'clinician': return 'bg-orange-100 text-orange-800';
      case 'check-in': return 'bg-pink-100 text-pink-800';
      case 'staff': return 'bg-gray-100 text-gray-800';
      case 'other': return 'bg-slate-100 text-slate-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Get status badge
  const getStatusBadge = (status: 'active' | 'invited' | 'inactive') => {
    switch (status) {
      case 'active':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Active</Badge>;
      case 'invited':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Invited</Badge>;
      case 'inactive':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800">Inactive</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };
  
  // Get task status badge
  const getTaskStatusBadge = (status: 'pending' | 'in_progress' | 'completed' | 'blocked') => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'in_progress':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">In Progress</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Completed</Badge>;
      case 'blocked':
        return <Badge variant="outline" className="bg-red-100 text-red-800">Blocked</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };
  
  // Get task priority badge
  const getTaskPriorityBadge = (priority: 'low' | 'medium' | 'high') => {
    switch (priority) {
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
  
  // Go back to camp project
  const handleBackToCamp = () => {
    window.location.href = `/events/camp-project?campId=${campId}`;
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
  const teamData = teamMembers?.data || [];
  const tasksData = tasks?.data || [];
  const roleTemplatesData = roleTemplates?.data || [];
  
  // Filter team members based on search and role filter
  const filteredTeamMembers = teamData.filter((member: StaffMember) => {
    const matchesSearch = 
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || member.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleBackToCamp} className="mr-2">
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:block ml-1">Back to Camp</span>
            </Button>
            <h1 className="text-2xl font-bold md:text-3xl">Team Portal</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            {campData.name} - {formatDate(campData.startDate)} to {formatDate(campData.endDate)}
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
              <DropdownMenuItem onClick={handleExportTeamList}>
                Export Team List
              </DropdownMenuItem>
              <DropdownMenuItem>
                Export Task Assignments
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button onClick={() => setShowAddMember(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Team Member
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
          <TabsTrigger value="team">Team Members</TabsTrigger>
          <TabsTrigger value="tasks">Task Management</TabsTrigger>
        </TabsList>
        
        {/* Team Members Tab */}
        <TabsContent value="team" className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-64 space-y-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search team members..."
                  className="pl-8 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="bg-white border rounded-md overflow-hidden">
                <div className="p-3 font-medium border-b">Role Filter</div>
                <div className="p-2 space-y-1">
                  <div 
                    className={`flex items-center space-x-2 px-2 py-1.5 rounded cursor-pointer ${roleFilter === 'all' ? 'bg-primary/10' : 'hover:bg-gray-100'}`}
                    onClick={() => setRoleFilter('all')}
                  >
                    <Users className="h-4 w-4 text-gray-500" />
                    <span>All Roles</span>
                  </div>
                  
                  <div 
                    className={`flex items-center space-x-2 px-2 py-1.5 rounded cursor-pointer ${roleFilter === 'director' ? 'bg-primary/10' : 'hover:bg-gray-100'}`}
                    onClick={() => setRoleFilter('director')}
                  >
                    <User className="h-4 w-4 text-purple-500" />
                    <span>Directors</span>
                  </div>
                  
                  <div 
                    className={`flex items-center space-x-2 px-2 py-1.5 rounded cursor-pointer ${roleFilter === 'manager' ? 'bg-primary/10' : 'hover:bg-gray-100'}`}
                    onClick={() => setRoleFilter('manager')}
                  >
                    <User className="h-4 w-4 text-blue-500" />
                    <span>Managers</span>
                  </div>
                  
                  <div 
                    className={`flex items-center space-x-2 px-2 py-1.5 rounded cursor-pointer ${roleFilter === 'logistics' ? 'bg-primary/10' : 'hover:bg-gray-100'}`}
                    onClick={() => setRoleFilter('logistics')}
                  >
                    <User className="h-4 w-4 text-green-500" />
                    <span>Logistics</span>
                  </div>
                  
                  <div 
                    className={`flex items-center space-x-2 px-2 py-1.5 rounded cursor-pointer ${roleFilter === 'media' ? 'bg-primary/10' : 'hover:bg-gray-100'}`}
                    onClick={() => setRoleFilter('media')}
                  >
                    <User className="h-4 w-4 text-yellow-500" />
                    <span>Media Team</span>
                  </div>
                  
                  <div 
                    className={`flex items-center space-x-2 px-2 py-1.5 rounded cursor-pointer ${roleFilter === 'clinician' ? 'bg-primary/10' : 'hover:bg-gray-100'}`}
                    onClick={() => setRoleFilter('clinician')}
                  >
                    <User className="h-4 w-4 text-orange-500" />
                    <span>Clinicians</span>
                  </div>
                  
                  <div 
                    className={`flex items-center space-x-2 px-2 py-1.5 rounded cursor-pointer ${roleFilter === 'check-in' ? 'bg-primary/10' : 'hover:bg-gray-100'}`}
                    onClick={() => setRoleFilter('check-in')}
                  >
                    <User className="h-4 w-4 text-pink-500" />
                    <span>Check-in Staff</span>
                  </div>
                  
                  <div 
                    className={`flex items-center space-x-2 px-2 py-1.5 rounded cursor-pointer ${roleFilter === 'staff' ? 'bg-primary/10' : 'hover:bg-gray-100'}`}
                    onClick={() => setRoleFilter('staff')}
                  >
                    <User className="h-4 w-4 text-gray-500" />
                    <span>General Staff</span>
                  </div>
                </div>
              </div>
              
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm">Team Status</CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm">
                      <span>Total Members</span>
                      <span className="font-medium">{teamData.length}</span>
                    </div>
                    
                    <div className="flex justify-between items-center text-sm">
                      <span>Active</span>
                      <span className="font-medium">
                        {teamData.filter((m: StaffMember) => m.status === 'active').length}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center text-sm">
                      <span>Pending Invites</span>
                      <span className="font-medium">
                        {teamData.filter((m: StaffMember) => m.status === 'invited').length}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center text-sm">
                      <span>Tasks Assigned</span>
                      <span className="font-medium">{tasksData.length}</span>
                    </div>
                    
                    <div className="flex justify-between items-center text-sm">
                      <span>Tasks Completed</span>
                      <span className="font-medium">
                        {tasksData.filter((t: Task) => t.status === 'completed').length}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => setShowRoleTemplates(true)}
              >
                <ClipboardList className="mr-2 h-4 w-4" />
                Role Templates
              </Button>
            </div>
            
            <div className="flex-grow">
              {isLoadingTeam ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredTeamMembers.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Users className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Team Members Found</h3>
                    <p className="text-muted-foreground text-center max-w-md mb-6">
                      {searchTerm || roleFilter !== 'all' ? 
                        'No team members match your search criteria.' : 
                        'Add team members to collaborate on this camp.'}
                    </p>
                    <Button onClick={() => setShowAddMember(true)}>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Add Team Member
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Tasks</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTeamMembers.map((member: StaffMember) => (
                          <TableRow key={member.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar>
                                  {member.avatar ? (
                                    <AvatarImage src={member.avatar} alt={member.name} />
                                  ) : (
                                    <AvatarFallback>
                                      {member.name.split(' ').map(n => n[0]).join('')}
                                    </AvatarFallback>
                                  )}
                                </Avatar>
                                <div>
                                  <div className="font-medium">{member.name}</div>
                                  <div className="text-xs text-muted-foreground">{member.email}</div>
                                  {member.phone && (
                                    <div className="text-xs text-muted-foreground mt-1">
                                      {member.phone}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant="outline" 
                                className={getRoleBadgeClass(member.role)}
                              >
                                {getRoleDisplayName(member.role)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(member.status)}
                            </TableCell>
                            <TableCell>
                              {member.assignedTasks !== undefined && (
                                <div className="text-sm">
                                  <span>{member.completedTasks || 0} / {member.assignedTasks} completed</span>
                                </div>
                              )}
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
                                      setSelectedMemberId(member.id);
                                      setShowEditPermissions(true);
                                    }}
                                  >
                                    <Shield className="mr-2 h-4 w-4" />
                                    Manage Permissions
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setNewTask({...newTask, assignedTo: member.id});
                                      setShowAssignTask(true);
                                    }}
                                  >
                                    <ClipboardList className="mr-2 h-4 w-4" />
                                    Assign Task
                                  </DropdownMenuItem>
                                  {member.status === 'invited' && (
                                    <DropdownMenuItem onClick={() => handleSendReminder(member.id)}>
                                      <Send className="mr-2 h-4 w-4" />
                                      Send Reminder
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => handleRemoveTeamMember(member.id)}>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Remove from Team
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>
        
        {/* Task Management Tab */}
        <TabsContent value="tasks" className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold">Task Management</h2>
              <p className="text-muted-foreground">
                Assign and track tasks for your team members
              </p>
            </div>
            <Button onClick={() => setShowAssignTask(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Task
            </Button>
          </div>
          
          {isLoadingTasks ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : tasksData.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Tasks Created Yet</h3>
                <p className="text-muted-foreground text-center max-w-md mb-6">
                  Create and assign tasks to your team members to keep track of camp preparations.
                </p>
                <Button onClick={() => setShowAssignTask(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Task
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div>
              <Tabs defaultValue="all" className="mb-6">
                <TabsList>
                  <TabsTrigger value="all">All Tasks</TabsTrigger>
                  <TabsTrigger value="pending">Pending</TabsTrigger>
                  <TabsTrigger value="in_progress">In Progress</TabsTrigger>
                  <TabsTrigger value="completed">Completed</TabsTrigger>
                </TabsList>
              </Tabs>
              
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Task</TableHead>
                        <TableHead>Assigned To</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tasksData.map((task: Task) => {
                        const assignee = teamData.find((m: StaffMember) => m.id === task.assignedTo);
                        
                        return (
                          <TableRow key={task.id}>
                            <TableCell>
                              <div className="font-medium">{task.title}</div>
                              {task.description && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  {task.description.length > 60 
                                    ? task.description.substring(0, 60) + '...' 
                                    : task.description
                                  }
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              {assignee ? (
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-6 w-6">
                                    {assignee.avatar ? (
                                      <AvatarImage src={assignee.avatar} alt={assignee.name} />
                                    ) : (
                                      <AvatarFallback className="text-xs">
                                        {assignee.name.split(' ').map(n => n[0]).join('')}
                                      </AvatarFallback>
                                    )}
                                  </Avatar>
                                  <span>{assignee.name}</span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">Unassigned</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {getTaskStatusBadge(task.status)}
                            </TableCell>
                            <TableCell>
                              {task.dueDate ? formatDate(task.dueDate) : 'No deadline'}
                            </TableCell>
                            <TableCell>
                              {getTaskPriorityBadge(task.priority)}
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit Task
                                  </DropdownMenuItem>
                                  
                                  <DropdownMenuSeparator />
                                  
                                  <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                                  <DropdownMenuItem>
                                    <Clock className="mr-2 h-4 w-4" />
                                    Mark as Pending
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Clock className="mr-2 h-4 w-4" />
                                    Mark as In Progress
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    Mark as Completed
                                  </DropdownMenuItem>
                                  
                                  <DropdownMenuSeparator />
                                  
                                  <DropdownMenuItem>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Task
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Add Team Member Dialog */}
      <Dialog open={showAddMember} onOpenChange={setShowAddMember}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>
              Add a new team member to your camp staff
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={newMember.name}
                onChange={(e) => setNewMember({...newMember, name: e.target.value})}
                className="col-span-3"
                placeholder="John Doe"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={newMember.email}
                onChange={(e) => setNewMember({...newMember, email: e.target.value})}
                className="col-span-3"
                placeholder="john@example.com"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">
                Phone
              </Label>
              <Input
                id="phone"
                value={newMember.phone}
                onChange={(e) => setNewMember({...newMember, phone: e.target.value})}
                className="col-span-3"
                placeholder="(123) 456-7890 (optional)"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
                Role
              </Label>
              <Select
                value={newMember.role}
                onValueChange={(value: TeamRole) => setNewMember({...newMember, role: value})}
              >
                <SelectTrigger id="role" className="col-span-3">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="director">Event Director</SelectItem>
                  <SelectItem value="manager">Onsite Manager</SelectItem>
                  <SelectItem value="logistics">Logistics Coordinator</SelectItem>
                  <SelectItem value="media">Media Team</SelectItem>
                  <SelectItem value="clinician">Clinician</SelectItem>
                  <SelectItem value="check-in">Check-in Staff</SelectItem>
                  <SelectItem value="staff">General Staff</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <div className="text-right pt-2">
                <Label htmlFor="use-template">Role Template</Label>
              </div>
              <div className="col-span-3 space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="use-template" 
                    checked={newMember.useTemplate}
                    onCheckedChange={(checked) => setNewMember({...newMember, useTemplate: !!checked})}
                  />
                  <Label htmlFor="use-template">Use role template for permissions & tasks</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Automatically set up permissions and default tasks based on the selected role.
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddMember(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddTeamMember}>
              Add Team Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Permissions Dialog */}
      <Dialog open={showEditPermissions} onOpenChange={setShowEditPermissions}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Manage Permissions</DialogTitle>
            <DialogDescription>
              Configure what this team member can access and modify
            </DialogDescription>
          </DialogHeader>
          {selectedMemberId && (
            <div className="py-4">
              <div className="mb-6">
                {teamData
                  .filter((member: StaffMember) => member.id === selectedMemberId)
                  .map((member: StaffMember) => (
                    <div key={member.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <Avatar className="h-12 w-12">
                        {member.avatar ? (
                          <AvatarImage src={member.avatar} alt={member.name} />
                        ) : (
                          <AvatarFallback>
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div>
                        <h3 className="font-medium text-lg">{member.name}</h3>
                        <p className="text-muted-foreground">{member.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge 
                            variant="outline" 
                            className={getRoleBadgeClass(member.role)}
                          >
                            {getRoleDisplayName(member.role)}
                          </Badge>
                          {getStatusBadge(member.status)}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
              
              <Separator className="my-4" />
              
              <div className="space-y-4">
                <h3 className="font-medium">Permission Settings</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {teamData
                    .filter((member: StaffMember) => member.id === selectedMemberId)
                    .map((member: StaffMember) => (
                      <React.Fragment key={member.id}>
                        <div className="space-y-3">
                          <h4 className="text-sm font-medium">Registration</h4>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="view_registrations" className="text-sm font-normal flex items-center gap-2">
                                <Eye className="h-4 w-4 text-muted-foreground" />
                                View Registrations
                              </Label>
                              <Switch
                                id="view_registrations"
                                checked={member.permissions.includes('view_registrations')}
                                onCheckedChange={() => togglePermission(member, 'view_registrations')}
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <Label htmlFor="edit_registrations" className="text-sm font-normal flex items-center gap-2">
                                <Edit className="h-4 w-4 text-muted-foreground" />
                                Edit Registrations
                              </Label>
                              <Switch
                                id="edit_registrations"
                                checked={member.permissions.includes('edit_registrations')}
                                onCheckedChange={() => togglePermission(member, 'edit_registrations')}
                              />
                            </div>
                          </div>
                          
                          <h4 className="text-sm font-medium mt-4">Schedule</h4>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="view_schedule" className="text-sm font-normal flex items-center gap-2">
                                <Eye className="h-4 w-4 text-muted-foreground" />
                                View Schedule
                              </Label>
                              <Switch
                                id="view_schedule"
                                checked={member.permissions.includes('view_schedule')}
                                onCheckedChange={() => togglePermission(member, 'view_schedule')}
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <Label htmlFor="edit_schedule" className="text-sm font-normal flex items-center gap-2">
                                <Edit className="h-4 w-4 text-muted-foreground" />
                                Edit Schedule
                              </Label>
                              <Switch
                                id="edit_schedule"
                                checked={member.permissions.includes('edit_schedule')}
                                onCheckedChange={() => togglePermission(member, 'edit_schedule')}
                              />
                            </div>
                          </div>
                          
                          <h4 className="text-sm font-medium mt-4">Swag & Inventory</h4>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="view_swag" className="text-sm font-normal flex items-center gap-2">
                                <Eye className="h-4 w-4 text-muted-foreground" />
                                View Swag Items
                              </Label>
                              <Switch
                                id="view_swag"
                                checked={member.permissions.includes('view_swag')}
                                onCheckedChange={() => togglePermission(member, 'view_swag')}
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <Label htmlFor="edit_swag" className="text-sm font-normal flex items-center gap-2">
                                <Edit className="h-4 w-4 text-muted-foreground" />
                                Edit Swag Items
                              </Label>
                              <Switch
                                id="edit_swag"
                                checked={member.permissions.includes('edit_swag')}
                                onCheckedChange={() => togglePermission(member, 'edit_swag')}
                              />
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <h4 className="text-sm font-medium">Budget</h4>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="view_budget" className="text-sm font-normal flex items-center gap-2">
                                <Eye className="h-4 w-4 text-muted-foreground" />
                                View Budget
                              </Label>
                              <Switch
                                id="view_budget"
                                checked={member.permissions.includes('view_budget')}
                                onCheckedChange={() => togglePermission(member, 'view_budget')}
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <Label htmlFor="edit_budget" className="text-sm font-normal flex items-center gap-2">
                                <Edit className="h-4 w-4 text-muted-foreground" />
                                Edit Budget
                              </Label>
                              <Switch
                                id="edit_budget"
                                checked={member.permissions.includes('edit_budget')}
                                onCheckedChange={() => togglePermission(member, 'edit_budget')}
                              />
                            </div>
                          </div>
                          
                          <h4 className="text-sm font-medium mt-4">Venue</h4>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="view_venue" className="text-sm font-normal flex items-center gap-2">
                                <Eye className="h-4 w-4 text-muted-foreground" />
                                View Venue Details
                              </Label>
                              <Switch
                                id="view_venue"
                                checked={member.permissions.includes('view_venue')}
                                onCheckedChange={() => togglePermission(member, 'view_venue')}
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <Label htmlFor="edit_venue" className="text-sm font-normal flex items-center gap-2">
                                <Edit className="h-4 w-4 text-muted-foreground" />
                                Edit Venue Details
                              </Label>
                              <Switch
                                id="edit_venue"
                                checked={member.permissions.includes('edit_venue')}
                                onCheckedChange={() => togglePermission(member, 'edit_venue')}
                              />
                            </div>
                          </div>
                          
                          <h4 className="text-sm font-medium mt-4">Team Management</h4>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="edit_team" className="text-sm font-normal flex items-center gap-2">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                Manage Team
                              </Label>
                              <Switch
                                id="edit_team"
                                checked={member.permissions.includes('edit_team')}
                                onCheckedChange={() => togglePermission(member, 'edit_team')}
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <Label htmlFor="admin" className="text-sm font-normal flex items-center gap-2">
                                <Shield className="h-4 w-4 text-muted-foreground" />
                                Admin Access
                              </Label>
                              <Switch
                                id="admin"
                                checked={member.permissions.includes('admin')}
                                onCheckedChange={() => togglePermission(member, 'admin')}
                              />
                            </div>
                          </div>
                        </div>
                      </React.Fragment>
                    ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditPermissions(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdatePermissions}>
              Save Permissions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Assign Task Dialog */}
      <Dialog open={showAssignTask} onOpenChange={setShowAssignTask}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create Task</DialogTitle>
            <DialogDescription>
              Create a new task and assign it to a team member
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="task-title" className="text-right">
                Title
              </Label>
              <Input
                id="task-title"
                value={newTask.title}
                onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                className="col-span-3"
                placeholder="Task title"
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="task-description" className="text-right pt-2">
                Description
              </Label>
              <Textarea
                id="task-description"
                value={newTask.description}
                onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                className="col-span-3"
                placeholder="Task description (optional)"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="task-priority" className="text-right">
                Priority
              </Label>
              <Select
                value={newTask.priority}
                onValueChange={(value: 'low' | 'medium' | 'high') => setNewTask({...newTask, priority: value})}
              >
                <SelectTrigger id="task-priority" className="col-span-3">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="task-due-date" className="text-right">
                Due Date
              </Label>
              <Input
                id="task-due-date"
                type="date"
                value={newTask.dueDate}
                onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="task-assignee" className="text-right">
                Assign To
              </Label>
              <Select
                value={newTask.assignedTo?.toString() || ''}
                onValueChange={(value) => setNewTask({...newTask, assignedTo: parseInt(value) || null})}
              >
                <SelectTrigger id="task-assignee" className="col-span-3">
                  <SelectValue placeholder="Select team member" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Unassigned</SelectItem>
                  {teamData
                    .filter((member: StaffMember) => member.status === 'active')
                    .map((member: StaffMember) => (
                      <SelectItem key={member.id} value={member.id.toString()}>
                        {member.name} ({getRoleDisplayName(member.role)})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignTask(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssignTask}>
              Create Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Role Templates Dialog */}
      <Dialog open={showRoleTemplates} onOpenChange={setShowRoleTemplates}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Role Templates</DialogTitle>
            <DialogDescription>
              View and manage predefined role templates with permissions and tasks
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {isLoadingTemplates ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : roleTemplatesData.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No role templates have been created yet.</p>
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {roleTemplatesData.map((template: RoleTemplate) => (
                    <Card key={template.id}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-base">{template.name}</CardTitle>
                            <CardDescription>{template.description}</CardDescription>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => applyRoleTemplate(template.id)}
                          >
                            Apply Template
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <div className="space-y-3">
                          <div>
                            <h4 className="text-sm font-medium mb-1">Permissions</h4>
                            <div className="flex flex-wrap gap-1.5">
                              {template.permissions.map(permission => (
                                <Badge key={permission} variant="secondary" className="text-xs">
                                  {permission.replace(/_/g, ' ')}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium mb-1">Default Tasks</h4>
                            <div className="space-y-1.5">
                              {template.defaultTasks.map((task, index) => (
                                <div key={index} className="text-sm flex items-center gap-1.5">
                                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                  <span>{task.title}</span>
                                  {getTaskPriorityBadge(task.priority)}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowRoleTemplates(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default TeamPortal;