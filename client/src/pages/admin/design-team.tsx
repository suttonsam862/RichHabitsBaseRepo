import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { formatDate, formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  PenTool,
  Search,
  Plus,
  MoreHorizontal,
  Edit,
  Trash,
  Mail,
  Phone,
  CheckCircle,
  XCircle,
  User,
  Loader2,
  Calendar,
  CalendarRange,
  Palette,
  Star,
  Award,
  FileImage,
  BarChart2,
  Clock,
  Filter,
} from "lucide-react";

// Type definitions
interface DesignTeamMember {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: "active" | "inactive" | "onboarding" | "on_leave";
  avatarUrl?: string;
  hireDate: string;
  skills: string[];
  activeProjects: number;
  completedProjects: number;
  rating: number;
  totalRevenue: string;
  commissionRate: string;
  earnedCommission: string;
  lastActiveAt: string;
  specialty: string;
  portfolio?: string[];
  notes?: string;
}

interface DesignProject {
  id: number;
  orderId: string;
  customerName: string;
  projectName: string;
  designerId: number | null;
  designerName: string | null;
  status: 'new' | 'assigned' | 'in_progress' | 'review' | 'revision' | 'approved' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  description: string;
  requirements: string;
  deadlineDate: string;
  createdAt: string;
  updatedAt: string;
  thumbnailUrl?: string;
  budget: string;
  category: string;
}

interface TeamPerformance {
  totalMembers: number;
  activeMembers: number;
  totalRevenue: string;
  activeProjects: number;
  completedProjects: number;
  avgCompletionTime: string;
  clientSatisfaction: string;
  topPerformer: {
    name: string;
    rating: number;
    avatarUrl?: string;
  };
}

export default function DesignTeamPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedMember, setSelectedMember] = useState<DesignTeamMember | null>(null);
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);
  const [isAssignProjectDialogOpen, setIsAssignProjectDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editedMember, setEditedMember] = useState<Partial<DesignTeamMember>>({});
  const [newMember, setNewMember] = useState<Partial<DesignTeamMember>>({
    name: "",
    email: "",
    phone: "",
    status: "active",
    role: "Junior Designer",
    commissionRate: "5.00",
    skills: [],
  });

  // Fetch team members
  const { data: teamMembers = [], isLoading: isLoadingTeamMembers } = useQuery({
    queryKey: ["/api/admin/design-team"],
    select: (data: any) => data.data || [],
  });

  // Fetch team performance
  const { data: performance, isLoading: isLoadingPerformance } = useQuery({
    queryKey: ["/api/admin/design-team/performance"],
    select: (data: any) => data.data || {
      totalMembers: 0,
      activeMembers: 0,
      totalRevenue: "$0",
      activeProjects: 0,
      completedProjects: 0,
      avgCompletionTime: "0 days",
      clientSatisfaction: "0%",
      topPerformer: {
        name: "N/A",
        rating: 0,
      },
    },
  });

  // Fetch unassigned projects
  const { data: unassignedProjects = [], isLoading: isLoadingUnassignedProjects } = useQuery({
    queryKey: ["/api/admin/design/unassigned"],
    select: (data: any) => data.data || [],
  });

  // Fetch all design projects
  const { data: projects = [], isLoading: isLoadingProjects } = useQuery({
    queryKey: ["/api/admin/design/projects"],
    select: (data: any) => data.data || [],
  });

  // Add new team member mutation
  const addMemberMutation = useMutation({
    mutationFn: async (memberData: Partial<DesignTeamMember>) => {
      const res = await apiRequest("POST", "/api/admin/design-team", memberData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/design-team"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/design-team/performance"] });
      setIsAddMemberDialogOpen(false);
      setNewMember({
        name: "",
        email: "",
        phone: "",
        status: "active",
        role: "Junior Designer",
        commissionRate: "5.00",
        skills: [],
      });
      toast({
        title: "Team member added",
        description: "New design team member has been added successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add team member",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update team member mutation
  const updateMemberMutation = useMutation({
    mutationFn: async (memberData: Partial<DesignTeamMember>) => {
      if (!selectedMember) return;
      const res = await apiRequest("PATCH", `/api/admin/design-team/${selectedMember.id}`, memberData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/design-team"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/design-team/performance"] });
      setEditMode(false);
      toast({
        title: "Team member updated",
        description: "Design team member has been updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update team member",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete team member mutation
  const deleteMemberMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/admin/design-team/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/design-team"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/design-team/performance"] });
      setSelectedMember(null);
      toast({
        title: "Team member deleted",
        description: "Design team member has been deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete team member",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Assign project mutation
  const assignProjectMutation = useMutation({
    mutationFn: async (assignment: { projectId: number; designerId: number }) => {
      const res = await apiRequest("POST", "/api/admin/design/assign", assignment);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/design/unassigned"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/design/projects"] });
      setIsAssignProjectDialogOpen(false);
      toast({
        title: "Project assigned",
        description: "Design project has been successfully assigned to designer",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to assign project",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Filter members by search term and status
  const filteredMembers = teamMembers.filter((member: DesignTeamMember) => {
    const matchesSearch = 
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.specialty?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.skills?.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || member.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Handle member selection
  const handleMemberSelect = (member: DesignTeamMember) => {
    setSelectedMember(member);
    setEditedMember({});
    setEditMode(false);
  };

  // Handle edit mode toggle
  const handleEditToggle = () => {
    if (editMode) {
      // Submit changes
      updateMemberMutation.mutate(editedMember);
    } else {
      // Enter edit mode
      setEditMode(true);
    }
  };

  // Handle member deletion
  const handleDeleteMember = () => {
    if (!selectedMember) return;
    
    if (confirm(`Are you sure you want to delete ${selectedMember.name}? This action cannot be undone.`)) {
      deleteMemberMutation.mutate(selectedMember.id);
    }
  };

  // Handle add new member
  const handleAddMember = () => {
    addMemberMutation.mutate(newMember);
  };

  // Render status badge with appropriate color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>;
      case "inactive":
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Inactive</Badge>;
      case "onboarding":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Onboarding</Badge>;
      case "on_leave":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">On Leave</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Render project status badge with appropriate color
  const getProjectStatusBadge = (status: string) => {
    switch (status) {
      case "new":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">New</Badge>;
      case "assigned":
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Assigned</Badge>;
      case "in_progress":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">In Progress</Badge>;
      case "review":
        return <Badge className="bg-indigo-100 text-indigo-800 hover:bg-indigo-100">Review</Badge>;
      case "revision":
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Revision</Badge>;
      case "approved":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Approved</Badge>;
      case "completed":
        return <Badge className="bg-teal-100 text-teal-800 hover:bg-teal-100">Completed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Render priority badge with appropriate color
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "low":
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Low</Badge>;
      case "medium":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Medium</Badge>;
      case "high":
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">High</Badge>;
      case "urgent":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Urgent</Badge>;
      default:
        return <Badge>{priority}</Badge>;
    }
  };

  // Render star rating
  const renderRating = (rating: number) => {
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star 
            key={i} 
            size={16}
            className={i < rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}
          />
        ))}
        <span className="ml-1 text-sm font-medium">{rating.toFixed(1)}</span>
      </div>
    );
  };

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Design Team Management</h1>
          <p className="text-muted-foreground">Manage designers, track projects, and analyze performance</p>
        </div>
        <Button onClick={() => setIsAddMemberDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Designer
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="team-members">Design Team</TabsTrigger>
          <TabsTrigger value="projects">Design Projects</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {isLoadingPerformance ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Design Projects
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{performance?.activeProjects} / {performance?.completedProjects + performance?.activeProjects}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Active / Total design projects
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Team Members
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{performance?.activeMembers} / {performance?.totalMembers}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Active / Total design team members
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Client Satisfaction
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{performance?.clientSatisfaction}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Avg. Completion Time: {performance?.avgCompletionTime}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Top Designer</CardTitle>
                    <CardDescription>
                      Highest rated designer on the team
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={performance?.topPerformer?.avatarUrl} />
                        <AvatarFallback>{performance?.topPerformer?.name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{performance?.topPerformer?.name}</p>
                        <div className="flex items-center mt-1">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              size={14}
                              className={i < performance?.topPerformer?.rating 
                                ? "text-yellow-500 fill-yellow-500" 
                                : "text-gray-300"}
                            />
                          ))}
                          <span className="ml-1 text-xs text-muted-foreground">
                            ({performance?.topPerformer?.rating.toFixed(1)})
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Unassigned Projects</CardTitle>
                    <CardDescription>
                      Projects waiting to be assigned to a designer
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingUnassignedProjects ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    ) : unassignedProjects.length === 0 ? (
                      <p className="text-muted-foreground">No unassigned projects at the moment</p>
                    ) : (
                      <div className="space-y-2">
                        {unassignedProjects.slice(0, 3).map((project: DesignProject) => (
                          <div key={project.id} className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{project.projectName}</p>
                              <div className="flex items-center gap-2 mt-1">
                                {getPriorityBadge(project.priority)}
                                <span className="text-xs text-muted-foreground">
                                  Due: {formatDate(project.deadlineDate)}
                                </span>
                              </div>
                            </div>
                            <Button size="sm" onClick={() => setIsAssignProjectDialogOpen(true)}>
                              Assign
                            </Button>
                          </div>
                        ))}
                        {unassignedProjects.length > 3 && (
                          <div className="text-center pt-2">
                            <Button variant="link" onClick={() => setActiveTab("projects")}>
                              View all {unassignedProjects.length} unassigned projects
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Activities</CardTitle>
                  <CardDescription>
                    Latest activities from the design team
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <div className="mr-4 mt-1">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      </div>
                      <div>
                        <p className="font-medium">Project completed</p>
                        <p className="text-sm text-muted-foreground">
                          Emily Davis completed logo design for XYZ Corp with 5-star rating
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Today at 10:25 AM
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="mr-4 mt-1">
                        <FileImage className="h-5 w-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="font-medium">New design version uploaded</p>
                        <p className="text-sm text-muted-foreground">
                          Michael Smith uploaded v2 of brochure design for ABC Company
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Yesterday at 4:30 PM
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="mr-4 mt-1">
                        <User className="h-5 w-5 text-purple-500" />
                      </div>
                      <div>
                        <p className="font-medium">New team member added</p>
                        <p className="text-sm text-muted-foreground">
                          Sarah Johnson joined the design team as Senior UI Designer
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          3 days ago
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Team Members Tab */}
        <TabsContent value="team-members" className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between mb-4">
            <div className="relative w-full md:w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search designers..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex flex-col md:flex-row gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="onboarding">Onboarding</SelectItem>
                  <SelectItem value="on_leave">On Leave</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" className="md:ml-auto" onClick={() => setIsAddMemberDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Designer
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              {isLoadingTeamMembers ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredMembers.length === 0 ? (
                <div className="border rounded-lg p-8 text-center">
                  <PenTool className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                  <h3 className="mt-4 text-lg font-semibold">No designers found</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {searchTerm || statusFilter !== "all" 
                      ? "Try adjusting your search or filters" 
                      : "Add your first designer to get started"}
                  </p>
                  <Button onClick={() => setIsAddMemberDialogOpen(true)} className="mt-4">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Designer
                  </Button>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Projects</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMembers.map((member: DesignTeamMember) => (
                        <TableRow 
                          key={member.id}
                          className={selectedMember?.id === member.id ? "bg-muted/50" : ""}
                          onClick={() => handleMemberSelect(member)}
                          style={{ cursor: "pointer" }}
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9">
                                <AvatarImage src={member.avatarUrl} />
                                <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{member.name}</div>
                                <div className="text-sm text-muted-foreground">{member.specialty}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{member.role}</TableCell>
                          <TableCell>{getStatusBadge(member.status)}</TableCell>
                          <TableCell>{member.activeProjects} active</TableCell>
                          <TableCell>{renderRating(member.rating)}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  handleMemberSelect(member);
                                  setEditMode(true);
                                }}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedMember(member);
                                  setIsAssignProjectDialogOpen(true);
                                }}>
                                  <PenTool className="mr-2 h-4 w-4" />
                                  Assign Project
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedMember(member);
                                    handleDeleteMember();
                                  }}
                                >
                                  <Trash className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            <div>
              {selectedMember ? (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle>Designer Details</CardTitle>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleEditToggle}
                          disabled={updateMemberMutation.isPending}
                        >
                          {updateMemberMutation.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          {editMode ? "Save" : "Edit"}
                        </Button>
                        {editMode && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditMode(false);
                              setEditedMember({});
                            }}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={selectedMember.avatarUrl} />
                        <AvatarFallback>{selectedMember.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-lg font-medium">
                          {editMode ? (
                            <Input 
                              value={editedMember.name ?? selectedMember.name}
                              onChange={(e) => setEditedMember({...editedMember, name: e.target.value})}
                              className="mt-1"
                            />
                          ) : (
                            selectedMember.name
                          )}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {editMode ? (
                            <Select 
                              value={editedMember.role ?? selectedMember.role}
                              onValueChange={(value) => setEditedMember({...editedMember, role: value})}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Junior Designer">Junior Designer</SelectItem>
                                <SelectItem value="Designer">Designer</SelectItem>
                                <SelectItem value="Senior Designer">Senior Designer</SelectItem>
                                <SelectItem value="Lead Designer">Lead Designer</SelectItem>
                                <SelectItem value="Design Director">Design Director</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            selectedMember.role
                          )}
                        </p>
                        {!editMode && (
                          <div className="mt-1">{getStatusBadge(selectedMember.status)}</div>
                        )}
                        {editMode && (
                          <Select 
                            value={editedMember.status ?? selectedMember.status}
                            onValueChange={(value: any) => setEditedMember({...editedMember, status: value})}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="inactive">Inactive</SelectItem>
                              <SelectItem value="onboarding">Onboarding</SelectItem>
                              <SelectItem value="on_leave">On Leave</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        {editMode ? (
                          <Input 
                            value={editedMember.email ?? selectedMember.email}
                            onChange={(e) => setEditedMember({...editedMember, email: e.target.value})}
                          />
                        ) : (
                          <span>{selectedMember.email}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        {editMode ? (
                          <Input 
                            value={editedMember.phone ?? selectedMember.phone}
                            onChange={(e) => setEditedMember({...editedMember, phone: e.target.value})}
                          />
                        ) : (
                          <span>{selectedMember.phone}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>Hired: {formatDate(selectedMember.hireDate)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Palette className="h-4 w-4 text-muted-foreground" />
                        <span>
                          Specialty: 
                          {editMode ? (
                            <Input 
                              value={editedMember.specialty ?? selectedMember.specialty}
                              onChange={(e) => setEditedMember({...editedMember, specialty: e.target.value})}
                              className="ml-2 mt-1"
                            />
                          ) : (
                            ` ${selectedMember.specialty}`
                          )}
                        </span>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <h4 className="font-medium">Performance</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Active Projects</p>
                          <p className="text-lg font-medium">{selectedMember.activeProjects}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Completed</p>
                          <p className="text-lg font-medium">{selectedMember.completedProjects}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Rating</p>
                          <div>{renderRating(selectedMember.rating)}</div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Revenue</p>
                          <p className="text-lg font-medium">{formatCurrency(parseFloat(selectedMember.totalRevenue))}</p>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <h4 className="font-medium">Skills</h4>
                      {editMode ? (
                        <Textarea 
                          value={editedMember.skills ? editedMember.skills.join(', ') : selectedMember.skills.join(', ')}
                          onChange={(e) => setEditedMember({
                            ...editedMember, 
                            skills: e.target.value.split(',').map(s => s.trim())
                          })}
                          placeholder="Add skills separated by commas"
                          rows={2}
                        />
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {selectedMember.skills.map((skill, index) => (
                            <Badge key={index} variant="outline" className="bg-muted/50">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    {editMode ? (
                      <div className="space-y-2">
                        <h4 className="font-medium">Notes</h4>
                        <Textarea 
                          value={editedMember.notes ?? (selectedMember.notes || '')}
                          onChange={(e) => setEditedMember({...editedMember, notes: e.target.value})}
                          rows={3}
                        />
                      </div>
                    ) : selectedMember.notes ? (
                      <div className="space-y-2">
                        <h4 className="font-medium">Notes</h4>
                        <p className="text-sm">{selectedMember.notes}</p>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>No designer selected</CardTitle>
                    <CardDescription>
                      Select a designer to view their details
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center justify-center py-8">
                      <PenTool className="h-16 w-16 text-muted-foreground opacity-50" />
                      <p className="mt-4 text-center text-muted-foreground">
                        Click on a designer from the list to view their details.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects" className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Design Projects</h3>
            <div className="flex flex-col md:flex-row gap-2">
              <Select defaultValue="all">
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="revision">Revision</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="all">
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Filter by priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Unassigned Projects</CardTitle>
              <CardDescription>
                Projects waiting to be assigned to a designer
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingUnassignedProjects ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : unassignedProjects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <PenTool className="h-16 w-16 text-muted-foreground opacity-50" />
                  <p className="mt-4 text-center text-muted-foreground">
                    No unassigned projects at the moment.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Deadline</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {unassignedProjects.map((project: DesignProject) => (
                      <TableRow key={project.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{project.projectName}</div>
                            <div className="text-xs text-muted-foreground">{project.orderId}</div>
                          </div>
                        </TableCell>
                        <TableCell>{project.customerName}</TableCell>
                        <TableCell>{project.category}</TableCell>
                        <TableCell>{getPriorityBadge(project.priority)}</TableCell>
                        <TableCell>{formatDate(project.deadlineDate)}</TableCell>
                        <TableCell className="text-right">
                          <Button 
                            size="sm" 
                            onClick={() => setIsAssignProjectDialogOpen(true)}
                          >
                            Assign
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>All Design Projects</CardTitle>
              <CardDescription>
                Current and completed design projects
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingProjects ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : projects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <PenTool className="h-16 w-16 text-muted-foreground opacity-50" />
                  <p className="mt-4 text-center text-muted-foreground">
                    No design projects found.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project</TableHead>
                      <TableHead>Designer</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Deadline</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projects.map((project: DesignProject) => (
                      <TableRow key={project.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{project.projectName}</div>
                            <div className="text-xs text-muted-foreground">{project.orderId}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {project.designerName ? (
                            project.designerName
                          ) : (
                            <span className="text-muted-foreground">Unassigned</span>
                          )}
                        </TableCell>
                        <TableCell>{getProjectStatusBadge(project.status)}</TableCell>
                        <TableCell>{getPriorityBadge(project.priority)}</TableCell>
                        <TableCell>{formatDate(project.deadlineDate)}</TableCell>
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
                                View Details
                              </DropdownMenuItem>
                              {!project.designerId && (
                                <DropdownMenuItem onClick={() => setIsAssignProjectDialogOpen(true)}>
                                  <PenTool className="mr-2 h-4 w-4" />
                                  Assign Designer
                                </DropdownMenuItem>
                              )}
                              {project.designerId && (
                                <DropdownMenuItem>
                                  <User className="mr-2 h-4 w-4" />
                                  Change Designer
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

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Team Performance</h3>
            <div className="flex gap-2">
              <Select defaultValue="month">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Last Week</SelectItem>
                  <SelectItem value="month">Last Month</SelectItem>
                  <SelectItem value="quarter">Last Quarter</SelectItem>
                  <SelectItem value="year">Last Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Projects by Status</CardTitle>
                <CardDescription>
                  Distribution of design projects by current status
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Chart would go here */}
                <div className="h-80 flex items-center justify-center bg-muted/20 rounded-md">
                  <p className="text-muted-foreground">Project status chart visualization</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Designer Ratings</CardTitle>
                <CardDescription>
                  Average client ratings for each designer
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Chart would go here */}
                <div className="h-80 flex items-center justify-center bg-muted/20 rounded-md">
                  <p className="text-muted-foreground">Designer ratings visualization</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Design Team Productivity</CardTitle>
              <CardDescription>
                Metrics for all designers on the team
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingTeamMembers ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Designer</TableHead>
                      <TableHead>Active Projects</TableHead>
                      <TableHead>Completed Projects</TableHead>
                      <TableHead>Avg. Completion Time</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teamMembers
                      .filter((member: DesignTeamMember) => member.status === "active")
                      .sort((a: DesignTeamMember, b: DesignTeamMember) => 
                        b.rating - a.rating
                      )
                      .map((member: DesignTeamMember, index: number) => {
                        // Calculate avg completion time (placeholder)
                        const avgDays = Math.floor(Math.random() * 14) + 1;
                        
                        return (
                          <TableRow key={member.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={member.avatarUrl} />
                                  <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="font-medium">{member.name}</div>
                              </div>
                            </TableCell>
                            <TableCell>{member.activeProjects}</TableCell>
                            <TableCell>{member.completedProjects}</TableCell>
                            <TableCell>{avgDays} days</TableCell>
                            <TableCell>{renderRating(member.rating)}</TableCell>
                            <TableCell>{formatCurrency(parseFloat(member.totalRevenue))}</TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Designer Dialog */}
      <Dialog open={isAddMemberDialogOpen} onOpenChange={setIsAddMemberDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Add New Designer</DialogTitle>
            <DialogDescription>
              Add a new designer to your team. They'll be able to work on assigned design projects.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={newMember.name}
                  onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={newMember.role}
                  onValueChange={(value) => setNewMember({ ...newMember, role: value })}
                >
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Junior Designer">Junior Designer</SelectItem>
                    <SelectItem value="Designer">Designer</SelectItem>
                    <SelectItem value="Senior Designer">Senior Designer</SelectItem>
                    <SelectItem value="Lead Designer">Lead Designer</SelectItem>
                    <SelectItem value="Design Director">Design Director</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newMember.email}
                  onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={newMember.phone}
                  onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={newMember.status as string}
                  onValueChange={(value: any) => setNewMember({ ...newMember, status: value })}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="onboarding">Onboarding</SelectItem>
                    <SelectItem value="on_leave">On Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="commission">Commission Rate (%)</Label>
                <Input
                  id="commission"
                  type="number"
                  min="0"
                  step="0.5"
                  value={newMember.commissionRate}
                  onChange={(e) => setNewMember({ ...newMember, commissionRate: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="specialty">Specialty</Label>
              <Input
                id="specialty"
                placeholder="E.g. Logo Design, UI/UX, Print Media"
                value={newMember.specialty || ''}
                onChange={(e) => setNewMember({ ...newMember, specialty: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="skills">Skills (comma separated)</Label>
              <Textarea
                id="skills"
                placeholder="E.g. Adobe Photoshop, Figma, Typography, Illustration"
                value={newMember.skills?.join(', ') || ''}
                onChange={(e) => setNewMember({ 
                  ...newMember, 
                  skills: e.target.value.split(',').map(s => s.trim()).filter(Boolean) 
                })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Additional information about this designer"
                value={newMember.notes || ''}
                onChange={(e) => setNewMember({ ...newMember, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddMemberDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddMember}
              disabled={
                !newMember.name ||
                !newMember.email ||
                !newMember.phone ||
                addMemberMutation.isPending
              }
            >
              {addMemberMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Add Designer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Project Dialog */}
      <Dialog open={isAssignProjectDialogOpen} onOpenChange={setIsAssignProjectDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Assign Design Project</DialogTitle>
            <DialogDescription>
              Assign a project to a designer on the team.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="project">Select Project</Label>
              <Select>
                <SelectTrigger id="project">
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {unassignedProjects.map((project: DesignProject) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.projectName} - {project.customerName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="designer">Assign To</Label>
              <Select>
                <SelectTrigger id="designer">
                  <SelectValue placeholder="Select a designer" />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers
                    .filter((member: DesignTeamMember) => member.status === "active")
                    .map((member: DesignTeamMember) => (
                      <SelectItem key={member.id} value={member.id.toString()}>
                        {member.name} - {member.specialty}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Instructions</Label>
              <Textarea
                id="notes"
                placeholder="Any special instructions for the designer"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deadline">Deadline</Label>
              <Input
                id="deadline"
                type="date"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAssignProjectDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={() => setIsAssignProjectDialogOpen(false)}>
              Assign Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}