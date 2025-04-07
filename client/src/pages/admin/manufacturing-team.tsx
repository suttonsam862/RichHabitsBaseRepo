import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PERMISSIONS, ROLES, Role, Permission } from "@shared/schema";
import { DEFAULT_ROLE_PERMISSIONS, getPermissionDisplayName, getPermissionGroups, getRoleDisplayName } from "@shared/permissions";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { 
  Select, 
  SelectContent, 
  SelectGroup,
  SelectItem, 
  SelectLabel,
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
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
  Factory,
  Search,
  Plus,
  Filter,
  MoreHorizontal,
  Edit,
  Trash,
  Mail,
  Phone,
  ShoppingBag,
  Users,
  ChevronDown,
  CalendarRange,
  User,
  Loader2,
  Palette,
  ClipboardList,
  Package,
  Truck
} from "lucide-react";

// Type definitions
interface ManufacturingTeamMember {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: "active" | "inactive" | "onboarding" | "on_leave";
  avatarUrl?: string;
  hireDate: string;
  productionCount: number;
  completedProductionCount: number;
  delayedProductionCount: number;
  specialization: string[];
  lastActiveAt: string;
  notes?: string;
  // User account fields
  username?: string;
  password?: string;
  systemRole?: Role;
  systemPermissions?: Permission[];
  createUserAccount?: boolean;
}

interface TeamPerformance {
  totalMembers: number;
  activeMembers: number;
  totalProductions: number;
  completedProductions: number;
  delayedProductions: number;
  pendingProductions: number;
  averageCompletionTime: number; // in days
  topPerformer: {
    name: string;
    completionRate: string;
    avatarUrl?: string;
  };
}

interface ProductionAssignment {
  id: number;
  productionId: number;
  productionName: string;
  orderId: number;
  orderName: string;
  assignedToId: number;
  assignedToName: string;
  assignedAt: string;
  status: "pending" | "in_progress" | "quality_check" | "completed" | "delayed" | "cancelled";
  dueDate: string;
  notes?: string;
}

export default function ManufacturingTeamPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedMember, setSelectedMember] = useState<ManufacturingTeamMember | null>(null);
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);
  const [isAssignProductionDialogOpen, setIsAssignProductionDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editedMember, setEditedMember] = useState<Partial<ManufacturingTeamMember>>({});
  const [newMember, setNewMember] = useState<Partial<ManufacturingTeamMember>>({
    name: "",
    email: "",
    phone: "",
    status: "active",
    role: "Production Specialist",
    createUserAccount: false,
    systemRole: ROLES.MANUFACTURER,
  });
  
  // Permission management states
  const [selectedPermissionPreset, setSelectedPermissionPreset] = useState<string>("default");
  const [customPermissions, setCustomPermissions] = useState<Permission[]>([]);
  
  // Define permission presets
  const permissionPresets = {
    default: { name: "Default Role Permissions", permissions: [] },
    
    // Sales team presets
    salesBasic: { name: "Sales Basic", permissions: [
      PERMISSIONS.VIEW_LEADS, PERMISSIONS.VIEW_ORDERS, PERMISSIONS.VIEW_MESSAGES
    ]},
    salesStandard: { name: "Sales Standard", permissions: [
      PERMISSIONS.CREATE_LEADS, PERMISSIONS.EDIT_LEADS, PERMISSIONS.VIEW_LEADS, 
      PERMISSIONS.CREATE_ORDERS, PERMISSIONS.VIEW_ORDERS, 
      PERMISSIONS.SEND_MESSAGES, PERMISSIONS.VIEW_MESSAGES
    ]},
    salesAdvanced: { name: "Sales Advanced", permissions: [
      PERMISSIONS.CREATE_LEADS, PERMISSIONS.EDIT_LEADS, PERMISSIONS.VIEW_LEADS,
      PERMISSIONS.CREATE_ORDERS, PERMISSIONS.EDIT_ORDERS, PERMISSIONS.VIEW_ORDERS,
      PERMISSIONS.SEND_MESSAGES, PERMISSIONS.VIEW_MESSAGES,
      PERMISSIONS.VIEW_REPORTS
    ]},
    
    // Design team presets
    designBasic: { name: "Design Basic", permissions: [
      PERMISSIONS.VIEW_DESIGNS, PERMISSIONS.VIEW_ORDERS, PERMISSIONS.VIEW_MESSAGES
    ]},
    designStandard: { name: "Design Standard", permissions: [
      PERMISSIONS.CREATE_DESIGNS, PERMISSIONS.EDIT_DESIGNS, PERMISSIONS.VIEW_DESIGNS,
      PERMISSIONS.VIEW_ORDERS, PERMISSIONS.SEND_MESSAGES, PERMISSIONS.VIEW_MESSAGES
    ]},
    designAdvanced: { name: "Design Advanced", permissions: [
      PERMISSIONS.CREATE_DESIGNS, PERMISSIONS.EDIT_DESIGNS, PERMISSIONS.VIEW_DESIGNS,
      PERMISSIONS.APPROVE_DESIGNS, PERMISSIONS.VIEW_ORDERS, 
      PERMISSIONS.SEND_MESSAGES, PERMISSIONS.VIEW_MESSAGES,
      PERMISSIONS.VIEW_REPORTS
    ]},
    
    // Manufacturing presets
    manufacturingBasic: { name: "Manufacturing Basic", permissions: [
      PERMISSIONS.VIEW_PRODUCTION, PERMISSIONS.VIEW_DESIGNS, PERMISSIONS.VIEW_MESSAGES
    ]},
    manufacturingStandard: { name: "Manufacturing Standard", permissions: [
      PERMISSIONS.EDIT_PRODUCTION, PERMISSIONS.VIEW_PRODUCTION, 
      PERMISSIONS.VIEW_DESIGNS, PERMISSIONS.VIEW_ORDERS,
      PERMISSIONS.SEND_MESSAGES, PERMISSIONS.VIEW_MESSAGES
    ]},
    manufacturingAdvanced: { name: "Manufacturing Advanced", permissions: [
      PERMISSIONS.CREATE_PRODUCTION, PERMISSIONS.EDIT_PRODUCTION, PERMISSIONS.VIEW_PRODUCTION,
      PERMISSIONS.COMPLETE_PRODUCTION, PERMISSIONS.VIEW_DESIGNS, PERMISSIONS.VIEW_ORDERS,
      PERMISSIONS.SEND_MESSAGES, PERMISSIONS.VIEW_MESSAGES
    ]}
  };

  // Fetch team members
  const { data: teamMembers = [], isLoading: isLoadingTeamMembers } = useQuery({
    queryKey: ["/api/admin/manufacturing-team"],
    select: (data: any) => data.data || [],
  });

  // Fetch team performance
  const { data: performance, isLoading: isLoadingPerformance } = useQuery({
    queryKey: ["/api/admin/manufacturing-team/performance"],
    select: (data: any) => data.data || {
      totalMembers: 0,
      activeMembers: 0,
      totalProductions: 0,
      completedProductions: 0,
      delayedProductions: 0,
      pendingProductions: 0,
      averageCompletionTime: 0,
      topPerformer: {
        name: "N/A",
        completionRate: "0%",
      },
    },
  });

  // Fetch unassigned productions
  const { data: unassignedProductions = [], isLoading: isLoadingUnassignedProductions } = useQuery({
    queryKey: ["/api/admin/productions/unassigned"],
    select: (data: any) => data.data || [],
  });

  // Fetch production assignments
  const { data: productionAssignments = [], isLoading: isLoadingProductionAssignments } = useQuery({
    queryKey: ["/api/admin/productions/assignments"],
    select: (data: any) => data.data || [],
  });

  // Add new team member mutation
  const addMemberMutation = useMutation({
    mutationFn: async (memberData: Partial<ManufacturingTeamMember>) => {
      const res = await apiRequest("POST", "/api/admin/manufacturing-team", memberData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/manufacturing-team"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/manufacturing-team/performance"] });
      setIsAddMemberDialogOpen(false);
      setNewMember({
        name: "",
        email: "",
        phone: "",
        status: "active",
        role: "Production Specialist",
        createUserAccount: false,
        systemRole: ROLES.MANUFACTURER
      });
      setSelectedPermissionPreset("default");
      setCustomPermissions([]);
      toast({
        title: "Team member added",
        description: "New manufacturing team member has been added successfully",
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
    mutationFn: async (memberData: Partial<ManufacturingTeamMember>) => {
      if (!selectedMember) return;
      const res = await apiRequest("PATCH", `/api/admin/manufacturing-team/${selectedMember.id}`, memberData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/manufacturing-team"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/manufacturing-team/performance"] });
      setEditMode(false);
      toast({
        title: "Team member updated",
        description: "Manufacturing team member has been updated successfully",
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
      const res = await apiRequest("DELETE", `/api/admin/manufacturing-team/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/manufacturing-team"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/manufacturing-team/performance"] });
      setSelectedMember(null);
      toast({
        title: "Team member deleted",
        description: "Manufacturing team member has been deleted successfully",
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

  // Assign production mutation
  const assignProductionMutation = useMutation({
    mutationFn: async (assignment: { productionId: number; manufacturerId: number }) => {
      const res = await apiRequest("POST", "/api/admin/productions/assign", assignment);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/productions/unassigned"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/productions/assignments"] });
      setIsAssignProductionDialogOpen(false);
      toast({
        title: "Production assigned",
        description: "Production has been successfully assigned to manufacturing specialist",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to assign production",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Filter members by search term and status
  const filteredMembers = teamMembers.filter((member: ManufacturingTeamMember) => {
    const matchesSearch = 
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.phone.includes(searchTerm);
    
    const matchesStatus = statusFilter === "all" || member.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Handle member selection
  const handleMemberSelect = (member: ManufacturingTeamMember) => {
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

  // Handle permission preset change
  const handlePermissionPresetChange = (presetKey: string) => {
    setSelectedPermissionPreset(presetKey);
    
    if (presetKey === "default") {
      // Use default permissions for the selected role
      const defaultPermissions = DEFAULT_ROLE_PERMISSIONS[newMember.systemRole as Role] || [];
      setCustomPermissions(defaultPermissions);
      setNewMember({
        ...newMember,
        systemPermissions: defaultPermissions
      });
    } else if (presetKey in permissionPresets) {
      // Use the preset permissions
      const presetPermissions = permissionPresets[presetKey as keyof typeof permissionPresets].permissions;
      setCustomPermissions(presetPermissions);
      setNewMember({
        ...newMember,
        systemPermissions: presetPermissions
      });
    }
  };
  
  // Handle permission toggle
  const handlePermissionToggle = (permission: Permission) => {
    const updatedPermissions = customPermissions.includes(permission)
      ? customPermissions.filter(p => p !== permission)
      : [...customPermissions, permission];
    
    setCustomPermissions(updatedPermissions);
    setNewMember({
      ...newMember,
      systemPermissions: updatedPermissions
    });
  };
  
  // Handle system role change
  const handleSystemRoleChange = (role: Role) => {
    setNewMember({
      ...newMember,
      systemRole: role
    });
    
    // If using default permissions, update them based on the new role
    if (selectedPermissionPreset === "default") {
      const defaultPermissions = DEFAULT_ROLE_PERMISSIONS[role] || [];
      setCustomPermissions(defaultPermissions);
      setNewMember({
        ...newMember,
        systemRole: role,
        systemPermissions: defaultPermissions
      });
    }
  };

  // Handle add new member
  const handleAddMember = () => {
    // If creating a user account, ensure we have username and password
    if (newMember.createUserAccount && (!newMember.username || !newMember.password)) {
      toast({
        title: "Missing credentials",
        description: "Username and password are required to create a user account",
        variant: "destructive"
      });
      return;
    }
    
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

  // Render production status badge with appropriate color
  const getProductionStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Pending</Badge>;
      case "in_progress":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">In Progress</Badge>;
      case "quality_check":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Quality Check</Badge>;
      case "completed":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completed</Badge>;
      case "delayed":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Delayed</Badge>;
      case "cancelled":
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manufacturing Team Management</h1>
          <p className="text-muted-foreground">Manage manufacturing specialists, track performance, and assign production tasks</p>
        </div>
        <Button onClick={() => setIsAddMemberDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Team Member
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="team-members">Team Members</TabsTrigger>
          <TabsTrigger value="production-assignments">Production Assignments</TabsTrigger>
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
                      Manufacturing Team
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{performance?.activeMembers} / {performance?.totalMembers}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Active / Total team members
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Production Orders
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{performance?.totalProductions}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {performance?.completedProductions} completed / {performance?.pendingProductions} pending
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Average Completion Time
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{performance?.averageCompletionTime} days</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      From assignment to fulfillment
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Top Performer</CardTitle>
                    <CardDescription>
                      Manufacturing specialist with highest completion rate
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
                        <p className="text-sm text-muted-foreground">
                          Completion Rate: {performance?.topPerformer?.completionRate}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Unassigned Productions</CardTitle>
                    <CardDescription>
                      Production orders waiting to be assigned
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingUnassignedProductions ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    ) : unassignedProductions.length === 0 ? (
                      <p className="text-muted-foreground">No unassigned productions at the moment</p>
                    ) : (
                      <div className="space-y-2">
                        {unassignedProductions.slice(0, 3).map((production: any) => (
                          <div key={production.id} className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{production.name}</p>
                              <p className="text-sm text-muted-foreground">Order #{production.orderId}</p>
                            </div>
                            <Button size="sm" onClick={() => setIsAssignProductionDialogOpen(true)}>
                              Assign
                            </Button>
                          </div>
                        ))}
                        {unassignedProductions.length > 3 && (
                          <div className="text-center pt-2">
                            <Button variant="link" onClick={() => setActiveTab("production-assignments")}>
                              View all {unassignedProductions.length} unassigned productions
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
                  <CardTitle>Recent Manufacturing Activities</CardTitle>
                  <CardDescription>
                    Latest manufacturing-related activities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <div className="mr-4 mt-1">
                        <Package className="h-5 w-5 text-green-500" />
                      </div>
                      <div>
                        <p className="font-medium">Production completed</p>
                        <p className="text-sm text-muted-foreground">
                          John Smith completed production for Order #1234 - Acme Corporation
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Today at 9:42 AM
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="mr-4 mt-1">
                        <ClipboardList className="h-5 w-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="font-medium">Production assigned</p>
                        <p className="text-sm text-muted-foreground">
                          Michael Brown was assigned to XYZ Company custom merchandise production
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Yesterday at 3:15 PM
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
                          Emily Parker joined the manufacturing team as Production Manager
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          2 days ago
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
          <div className="flex items-center justify-between">
            <div className="flex w-full max-w-sm items-center space-x-2">
              <Input
                placeholder="Search team members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setStatusFilter("all")}>
                    All Statuses
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("active")}>
                    Active
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("inactive")}>
                    Inactive
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("onboarding")}>
                    Onboarding
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("on_leave")}>
                    On Leave
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {isLoadingTeamMembers ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1 space-y-4">
                <Card>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {filteredMembers.map((member: ManufacturingTeamMember) => (
                        <div
                          key={member.id}
                          className={`p-4 cursor-pointer hover:bg-muted transition-colors ${
                            selectedMember?.id === member.id ? "bg-muted" : ""
                          }`}
                          onClick={() => handleMemberSelect(member)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <Avatar>
                                <AvatarImage src={member.avatarUrl} />
                                <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{member.name}</p>
                                <p className="text-sm text-muted-foreground">{member.role}</p>
                              </div>
                            </div>
                            {getStatusBadge(member.status)}
                          </div>
                        </div>
                      ))}
                      {filteredMembers.length === 0 && (
                        <div className="p-6 text-center">
                          <p className="text-muted-foreground">No team members found</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="md:col-span-2">
                {selectedMember ? (
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={selectedMember.avatarUrl} />
                            <AvatarFallback>{selectedMember.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="text-xl font-semibold">{selectedMember.name}</h3>
                            <p className="text-sm text-muted-foreground">{selectedMember.role}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm" onClick={handleEditToggle}>
                            {editMode ? (
                              updateMemberMutation.isPending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                "Save"
                              )
                            ) : (
                              <>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleDeleteMember}
                            disabled={deleteMemberMutation.isPending}
                          >
                            {deleteMemberMutation.isPending ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Trash className="mr-2 h-4 w-4" />
                                Delete
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-sm font-semibold mb-2">Contact Information</h4>
                            <div className="space-y-2">
                              <div className="flex items-center text-sm">
                                <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                                <span>{selectedMember.email}</span>
                              </div>
                              <div className="flex items-center text-sm">
                                <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                                <span>{selectedMember.phone}</span>
                              </div>
                            </div>
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold mb-2">Team Information</h4>
                            <div className="space-y-2">
                              <div className="flex items-center text-sm">
                                <CalendarRange className="mr-2 h-4 w-4 text-muted-foreground" />
                                <span>Joined: {formatDate(selectedMember.hireDate)}</span>
                              </div>
                              <div className="flex items-center text-sm">
                                <Factory className="mr-2 h-4 w-4 text-muted-foreground" />
                                <span>Specializations: {selectedMember.specialization?.join(", ") || "None specified"}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-semibold mb-2">Production Statistics</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="bg-muted rounded-lg p-3">
                              <p className="text-sm text-muted-foreground">Total Productions</p>
                              <p className="text-2xl font-bold">{selectedMember.productionCount}</p>
                            </div>
                            <div className="bg-muted rounded-lg p-3">
                              <p className="text-sm text-muted-foreground">Completed</p>
                              <p className="text-2xl font-bold">{selectedMember.completedProductionCount}</p>
                            </div>
                            <div className="bg-muted rounded-lg p-3">
                              <p className="text-sm text-muted-foreground">Delayed</p>
                              <p className="text-2xl font-bold">{selectedMember.delayedProductionCount}</p>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-semibold mb-2">Notes</h4>
                          <p className="text-sm text-muted-foreground">
                            {selectedMember.notes || "No notes available for this team member."}
                          </p>
                        </div>

                        {selectedMember.username && (
                          <div>
                            <h4 className="text-sm font-semibold mb-2">System Account</h4>
                            <div className="flex items-center space-x-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{selectedMember.username}</span>
                              <Badge>{getRoleDisplayName(selectedMember.systemRole as Role)}</Badge>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Factory className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground text-center">
                        Select a manufacturing specialist from the list to view their details
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Production Assignments Tab */}
        <TabsContent value="production-assignments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Production Assignments</CardTitle>
              <CardDescription>Manage production orders and assignments to manufacturing specialists</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">
                  Showing {productionAssignments.length} active production assignments
                </p>
                <Button onClick={() => setIsAssignProductionDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Assign Production
                </Button>
              </div>

              {isLoadingProductionAssignments ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : productionAssignments.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No production assignments found</p>
                </div>
              ) : (
                <div className="overflow-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-sm text-muted-foreground border-b">
                        <th className="text-left font-medium py-3 px-2">Production Order</th>
                        <th className="text-left font-medium py-3 px-2">Order</th>
                        <th className="text-left font-medium py-3 px-2">Assigned To</th>
                        <th className="text-left font-medium py-3 px-2">Status</th>
                        <th className="text-left font-medium py-3 px-2">Due Date</th>
                        <th className="text-left font-medium py-3 px-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {productionAssignments.map((assignment: ProductionAssignment) => (
                        <tr key={assignment.id} className="text-sm">
                          <td className="py-3 px-2">{assignment.productionName}</td>
                          <td className="py-3 px-2">#{assignment.orderId}</td>
                          <td className="py-3 px-2">{assignment.assignedToName}</td>
                          <td className="py-3 px-2">{getProductionStatusBadge(assignment.status)}</td>
                          <td className="py-3 px-2">{formatDate(assignment.dueDate)}</td>
                          <td className="py-3 px-2">
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Manufacturing Team Performance</CardTitle>
              <CardDescription>Analyze manufacturing team productivity and efficiency metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Completion Rate by Specialist</h3>
                  {isLoadingTeamMembers ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {teamMembers
                        .filter((member: ManufacturingTeamMember) => member.status === "active")
                        .sort((a: ManufacturingTeamMember, b: ManufacturingTeamMember) => 
                          (b.completedProductionCount / Math.max(b.productionCount, 1)) - 
                          (a.completedProductionCount / Math.max(a.productionCount, 1))
                        )
                        .map((member: ManufacturingTeamMember, index: number) => {
                          const completionRate = member.productionCount 
                            ? ((member.completedProductionCount / member.productionCount) * 100).toFixed(1) 
                            : "0.0";
                          
                          return (
                            <div key={member.id} className="flex items-center space-x-3">
                              <div className="w-6 text-muted-foreground">{index + 1}.</div>
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={member.avatarUrl} />
                                <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <p className="font-medium">{member.name}</p>
                                <div className="w-full bg-muted h-2 rounded-full mt-1">
                                  <div 
                                    className="bg-primary h-2 rounded-full" 
                                    style={{ width: `${completionRate}%` }}
                                  />
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-medium">{completionRate}%</p>
                                <p className="text-xs text-muted-foreground">
                                  {member.completedProductionCount} / {member.productionCount}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-4">Production Status Distribution</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-muted rounded-lg p-4">
                      <p className="text-sm font-medium">Completed Productions</p>
                      <div className="flex items-end justify-between mt-2">
                        <p className="text-3xl font-bold">{performance?.completedProductions}</p>
                        <p className="text-sm text-muted-foreground">
                          {performance?.totalProductions 
                            ? ((performance.completedProductions / performance.totalProductions) * 100).toFixed(1) 
                            : "0.0"}%
                        </p>
                      </div>
                    </div>
                    <div className="bg-muted rounded-lg p-4">
                      <p className="text-sm font-medium">Delayed Productions</p>
                      <div className="flex items-end justify-between mt-2">
                        <p className="text-3xl font-bold">{performance?.delayedProductions}</p>
                        <p className="text-sm text-muted-foreground">
                          {performance?.totalProductions 
                            ? ((performance.delayedProductions / performance.totalProductions) * 100).toFixed(1) 
                            : "0.0"}%
                        </p>
                      </div>
                    </div>
                    <div className="bg-muted rounded-lg p-4">
                      <p className="text-sm font-medium">Pending Productions</p>
                      <div className="flex items-end justify-between mt-2">
                        <p className="text-3xl font-bold">{performance?.pendingProductions}</p>
                        <p className="text-sm text-muted-foreground">
                          {performance?.totalProductions 
                            ? ((performance.pendingProductions / performance.totalProductions) * 100).toFixed(1) 
                            : "0.0"}%
                        </p>
                      </div>
                    </div>
                    <div className="bg-muted rounded-lg p-4">
                      <p className="text-sm font-medium">Average Completion Time</p>
                      <div className="flex items-end justify-between mt-2">
                        <p className="text-3xl font-bold">{performance?.averageCompletionTime}</p>
                        <p className="text-sm text-muted-foreground">days</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Team Member Dialog */}
      <Dialog open={isAddMemberDialogOpen} onOpenChange={setIsAddMemberDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>
              Add a new manufacturing specialist to the team. Fill in all required information.
            </DialogDescription>
          </DialogHeader>
          <div>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter full name"
                    value={newMember.name}
                    onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Job Title</Label>
                  <Input
                    id="role"
                    placeholder="e.g. Production Specialist"
                    value={newMember.role}
                    onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@example.com"
                    value={newMember.email}
                    onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    placeholder="Enter phone number"
                    value={newMember.phone}
                    onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={newMember.status}
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
                  <Label htmlFor="specialization">Specialization</Label>
                  <Input
                    id="specialization"
                    placeholder="e.g. Printing, Embroidery"
                    value={newMember.specialization}
                    onChange={(e) => setNewMember({ 
                      ...newMember, 
                      specialization: e.target.value.split(',').map(item => item.trim()) 
                    })}
                  />
                  <p className="text-xs text-muted-foreground">Separate with commas</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any relevant information about this team member"
                  value={newMember.notes}
                  onChange={(e) => setNewMember({ ...newMember, notes: e.target.value })}
                />
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="createUserAccount" className="cursor-pointer">Create User Account</Label>
                  <Switch
                    id="createUserAccount"
                    checked={newMember.createUserAccount}
                    onCheckedChange={(checked) => 
                      setNewMember({ ...newMember, createUserAccount: checked })
                    }
                  />
                </div>
                <p className="text-xs text-muted-foreground">Enable to create a system account for this team member</p>
              </div>
              
              {newMember.createUserAccount && (
                <div className="space-y-4 border rounded-md p-4 bg-muted/50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        placeholder="Enter username"
                        value={newMember.username}
                        onChange={(e) => setNewMember({ ...newMember, username: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter password"
                        value={newMember.password}
                        onChange={(e) => setNewMember({ ...newMember, password: e.target.value })}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="systemRole">System Role</Label>
                    <Select
                      value={newMember.systemRole}
                      onValueChange={(value: Role) => handleSystemRoleChange(value)}
                    >
                      <SelectTrigger id="systemRole">
                        <SelectValue placeholder="Select system role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ROLES.AGENT}>{getRoleDisplayName(ROLES.AGENT)}</SelectItem>
                        <SelectItem value={ROLES.DESIGNER}>{getRoleDisplayName(ROLES.DESIGNER)}</SelectItem>
                        <SelectItem value={ROLES.MANUFACTURER}>{getRoleDisplayName(ROLES.MANUFACTURER)}</SelectItem>
                        <SelectItem value={ROLES.MANAGER}>{getRoleDisplayName(ROLES.MANAGER)}</SelectItem>
                        <SelectItem value={ROLES.ADMIN}>{getRoleDisplayName(ROLES.ADMIN)}</SelectItem>
                        <SelectItem value={ROLES.VIEWER}>{getRoleDisplayName(ROLES.VIEWER)}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="mb-1">Permission Presets</Label>
                    <Select
                      value={selectedPermissionPreset}
                      onValueChange={handlePermissionPresetChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select permission preset" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Default Role Permissions</SelectItem>
                        <SelectGroup>
                          <SelectLabel>Sales Team</SelectLabel>
                          <SelectItem value="salesBasic">Sales Basic</SelectItem>
                          <SelectItem value="salesStandard">Sales Standard</SelectItem>
                          <SelectItem value="salesAdvanced">Sales Advanced</SelectItem>
                        </SelectGroup>
                        <SelectGroup>
                          <SelectLabel>Design Team</SelectLabel>
                          <SelectItem value="designBasic">Design Basic</SelectItem>
                          <SelectItem value="designStandard">Design Standard</SelectItem>
                          <SelectItem value="designAdvanced">Design Advanced</SelectItem>
                        </SelectGroup>
                        <SelectGroup>
                          <SelectLabel>Manufacturing</SelectLabel>
                          <SelectItem value="manufacturingBasic">Manufacturing Basic</SelectItem>
                          <SelectItem value="manufacturingStandard">Manufacturing Standard</SelectItem>
                          <SelectItem value="manufacturingAdvanced">Manufacturing Advanced</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Choose a preset or customize permissions below</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="mb-1">Custom Permissions</Label>
                    <div className="border rounded-md p-3 max-h-[200px] overflow-auto">
                      {getPermissionGroups().map((group) => (
                        <div key={group.category} className="mb-3 last:mb-0">
                          <h4 className="text-sm font-semibold mb-1">{group.category}</h4>
                          <div className="grid grid-cols-1 gap-2">
                            {group.permissions.map((permission) => (
                              <div key={permission} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`perm-${permission}`}
                                  checked={customPermissions.includes(permission)}
                                  onCheckedChange={() => handlePermissionToggle(permission)}
                                />
                                <label
                                  htmlFor={`perm-${permission}`}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  {getPermissionDisplayName(permission)}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
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
              Add Team Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Production Dialog */}
      <Dialog open={isAssignProductionDialogOpen} onOpenChange={setIsAssignProductionDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Assign Production</DialogTitle>
            <DialogDescription>
              Assign a production order to a manufacturing specialist.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="production">Select Production Order</Label>
              <Select>
                <SelectTrigger id="production">
                  <SelectValue placeholder="Select a production order" />
                </SelectTrigger>
                <SelectContent>
                  {unassignedProductions.map((production: any) => (
                    <SelectItem key={production.id} value={production.id.toString()}>
                      {production.name} - Order #{production.orderId}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="manufacturer">Assign To</Label>
              <Select>
                <SelectTrigger id="manufacturer">
                  <SelectValue placeholder="Select a manufacturing specialist" />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers
                    .filter((member: ManufacturingTeamMember) => member.status === "active")
                    .map((member: ManufacturingTeamMember) => (
                      <SelectItem key={member.id} value={member.id.toString()}>
                        {member.name} - {member.specialization?.join(", ")}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="due-date">Due Date</Label>
              <Input
                id="due-date"
                type="date"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any additional instructions for the manufacturing specialist"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAssignProductionDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={() => setIsAssignProductionDialogOpen(false)}>
              Assign Production
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}