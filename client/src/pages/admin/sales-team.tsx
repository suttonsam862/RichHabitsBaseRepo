import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { formatDate, formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ROLES, PERMISSIONS, Role, Permission } from "@shared/schema";
import { 
  getPermissionGroups, 
  getRoleDisplayName, 
  getPermissionDisplayName,
  DEFAULT_ROLE_PERMISSIONS 
} from "@shared/permissions";
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
  BriefcaseBusiness,
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
  BadgeDollarSign,
  User,
  Loader2,
} from "lucide-react";

// Type definitions
interface SalesTeamMember {
  id: number;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone: string;
  role: string;
  status: "active" | "inactive" | "onboarding" | "on_leave";
  avatarUrl?: string;
  hireDate: string;
  leadCount: number;
  orderCount: number;
  totalRevenue: string;
  commissionRate: string;
  earnedCommission: string;
  lastActiveAt: string;
  assignedRegions: string[];
  assignedIndustries: string[];
  specialization: string;
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
  totalRevenue: string;
  totalLeads: number;
  totalOrders: number;
  conversionRate: string;
  avgDealSize: string;
  topPerformer: {
    name: string;
    revenue: string;
    avatarUrl?: string;
  };
}

interface LeadAssignment {
  id: number;
  leadId: number;
  leadName: string;
  assignedToId: number;
  assignedToName: string;
  assignedAt: string;
  status: "new" | "contacted" | "qualified" | "proposal" | "closed_won" | "closed_lost";
  value: string;
  notes?: string;
}

export default function SalesTeamPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedMember, setSelectedMember] = useState<SalesTeamMember | null>(null);
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);
  const [isAssignLeadDialogOpen, setIsAssignLeadDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editedMember, setEditedMember] = useState<Partial<SalesTeamMember>>({});
  const [newMember, setNewMember] = useState<Partial<SalesTeamMember>>({
    name: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    status: "active",
    role: "Junior Sales Rep",
    commissionRate: "5.00",
    createUserAccount: false,
    systemRole: ROLES.AGENT,
  });
  
  // Permission management states
  const [selectedPermissionPreset, setSelectedPermissionPreset] = useState<string>("default");
  const [customPermissions, setCustomPermissions] = useState<Permission[]>([]);
  
  // Define permission presets
  const permissionPresets = {
    default: { name: "Default Role Permissions", permissions: [] },
    
    // Sales team presets
    salesBasic: { name: "Sales Basic", permissions: [
      PERMISSIONS.VIEW_LEADS, PERMISSIONS.VIEW_ORDERS, PERMISSIONS.VIEW_MESSAGES,
      PERMISSIONS.VIEW_CATALOG
    ]},
    salesStandard: { name: "Sales Standard", permissions: [
      PERMISSIONS.CREATE_LEADS, PERMISSIONS.EDIT_LEADS, PERMISSIONS.VIEW_LEADS, 
      PERMISSIONS.CREATE_ORDERS, PERMISSIONS.VIEW_ORDERS, 
      PERMISSIONS.SEND_MESSAGES, PERMISSIONS.VIEW_MESSAGES,
      PERMISSIONS.VIEW_CATALOG
    ]},
    salesAdvanced: { name: "Sales Advanced", permissions: [
      PERMISSIONS.CREATE_LEADS, PERMISSIONS.EDIT_LEADS, PERMISSIONS.VIEW_LEADS,
      PERMISSIONS.CREATE_ORDERS, PERMISSIONS.EDIT_ORDERS, PERMISSIONS.VIEW_ORDERS,
      PERMISSIONS.SEND_MESSAGES, PERMISSIONS.VIEW_MESSAGES,
      PERMISSIONS.VIEW_REPORTS, PERMISSIONS.VIEW_CATALOG
    ]},

    // Sales manager presets
    salesManager: { name: "Sales Manager", permissions: [
      PERMISSIONS.CREATE_LEADS, PERMISSIONS.EDIT_LEADS, PERMISSIONS.VIEW_LEADS, PERMISSIONS.DELETE_LEADS,
      PERMISSIONS.CREATE_ORDERS, PERMISSIONS.EDIT_ORDERS, PERMISSIONS.VIEW_ORDERS, PERMISSIONS.DELETE_ORDERS,
      PERMISSIONS.APPROVE_ORDERS, PERMISSIONS.SEND_MESSAGES, PERMISSIONS.VIEW_MESSAGES,
      PERMISSIONS.VIEW_REPORTS, PERMISSIONS.VIEW_CATALOG
    ]},
    
    // Design team presets
    designBasic: { name: "Design Basic", permissions: [
      PERMISSIONS.VIEW_DESIGNS, PERMISSIONS.VIEW_ORDERS, PERMISSIONS.VIEW_MESSAGES,
      PERMISSIONS.VIEW_CATALOG
    ]},
    designStandard: { name: "Design Standard", permissions: [
      PERMISSIONS.CREATE_DESIGNS, PERMISSIONS.EDIT_DESIGNS, PERMISSIONS.VIEW_DESIGNS,
      PERMISSIONS.VIEW_ORDERS, PERMISSIONS.SEND_MESSAGES, PERMISSIONS.VIEW_MESSAGES,
      PERMISSIONS.VIEW_CATALOG
    ]},
    designAdvanced: { name: "Design Advanced", permissions: [
      PERMISSIONS.CREATE_DESIGNS, PERMISSIONS.EDIT_DESIGNS, PERMISSIONS.VIEW_DESIGNS,
      PERMISSIONS.APPROVE_DESIGNS, PERMISSIONS.VIEW_ORDERS, 
      PERMISSIONS.SEND_MESSAGES, PERMISSIONS.VIEW_MESSAGES,
      PERMISSIONS.VIEW_REPORTS, PERMISSIONS.VIEW_CATALOG, PERMISSIONS.EDIT_CATALOG
    ]},

    // Design manager presets
    designManager: { name: "Design Manager", permissions: [
      PERMISSIONS.CREATE_DESIGNS, PERMISSIONS.EDIT_DESIGNS, PERMISSIONS.VIEW_DESIGNS,
      PERMISSIONS.APPROVE_DESIGNS, PERMISSIONS.DELETE_DESIGNS, PERMISSIONS.VIEW_ORDERS,
      PERMISSIONS.SEND_MESSAGES, PERMISSIONS.VIEW_MESSAGES, PERMISSIONS.VIEW_REPORTS,
      PERMISSIONS.VIEW_CATALOG, PERMISSIONS.EDIT_CATALOG, PERMISSIONS.MANAGE_CATALOG
    ]},
    
    // Manufacturing presets
    manufacturingBasic: { name: "Manufacturing Basic", permissions: [
      PERMISSIONS.VIEW_PRODUCTION, PERMISSIONS.VIEW_DESIGNS, PERMISSIONS.VIEW_MESSAGES,
      PERMISSIONS.VIEW_CATALOG
    ]},
    manufacturingStandard: { name: "Manufacturing Standard", permissions: [
      PERMISSIONS.EDIT_PRODUCTION, PERMISSIONS.VIEW_PRODUCTION, 
      PERMISSIONS.VIEW_DESIGNS, PERMISSIONS.VIEW_ORDERS,
      PERMISSIONS.SEND_MESSAGES, PERMISSIONS.VIEW_MESSAGES,
      PERMISSIONS.VIEW_CATALOG
    ]},
    manufacturingAdvanced: { name: "Manufacturing Advanced", permissions: [
      PERMISSIONS.CREATE_PRODUCTION, PERMISSIONS.EDIT_PRODUCTION, PERMISSIONS.VIEW_PRODUCTION,
      PERMISSIONS.COMPLETE_PRODUCTION, PERMISSIONS.VIEW_DESIGNS, PERMISSIONS.VIEW_ORDERS,
      PERMISSIONS.SEND_MESSAGES, PERMISSIONS.VIEW_MESSAGES, PERMISSIONS.VIEW_CATALOG
    ]},

    // Manufacturing manager presets
    manufacturingManager: { name: "Manufacturing Manager", permissions: [
      PERMISSIONS.CREATE_PRODUCTION, PERMISSIONS.EDIT_PRODUCTION, PERMISSIONS.VIEW_PRODUCTION,
      PERMISSIONS.COMPLETE_PRODUCTION, PERMISSIONS.DELETE_PRODUCTION, PERMISSIONS.VIEW_DESIGNS,
      PERMISSIONS.VIEW_ORDERS, PERMISSIONS.SEND_MESSAGES, PERMISSIONS.VIEW_MESSAGES,
      PERMISSIONS.VIEW_REPORTS, PERMISSIONS.VIEW_CATALOG, PERMISSIONS.EDIT_CATALOG
    ]},

    // Administrator presets
    adminFull: { name: "Admin (Full Access)", permissions: Object.values(PERMISSIONS) },
    adminBasic: { name: "Admin (Basic)", permissions: [
      PERMISSIONS.MANAGE_USERS, PERMISSIONS.VIEW_USERS,
      PERMISSIONS.VIEW_LEADS, PERMISSIONS.VIEW_ORDERS, PERMISSIONS.VIEW_DESIGNS, 
      PERMISSIONS.VIEW_PRODUCTION, PERMISSIONS.VIEW_MESSAGES, PERMISSIONS.VIEW_REPORTS,
      PERMISSIONS.VIEW_CATALOG, PERMISSIONS.MANAGE_CATALOG
    ]}
  };

  // Fetch team members
  const { data: teamMembers = [], isLoading: isLoadingTeamMembers } = useQuery({
    queryKey: ["/api/admin/sales-team"],
    select: (data: any) => data.data || [],
    refetchInterval: 5000, // Auto-refresh every 5 seconds
  });

  // Fetch team performance
  const { data: performance, isLoading: isLoadingPerformance } = useQuery({
    queryKey: ["/api/admin/sales-team/performance"],
    select: (data: any) => data.data || {
      totalMembers: 0,
      activeMembers: 0,
      totalRevenue: "$0",
      totalLeads: 0,
      totalOrders: 0,
      conversionRate: "0%",
      avgDealSize: "$0",
      topPerformer: {
        name: "N/A",
        revenue: "$0",
      },
    },
    refetchInterval: 5000, // Auto-refresh every 5 seconds
  });

  // Fetch unassigned leads
  const { data: unassignedLeads = [], isLoading: isLoadingUnassignedLeads } = useQuery({
    queryKey: ["/api/admin/leads/unassigned"],
    select: (data: any) => data.data || [],
    refetchInterval: 5000, // Auto-refresh every 5 seconds
  });

  // Fetch lead assignments
  const { data: leadAssignments = [], isLoading: isLoadingLeadAssignments } = useQuery({
    queryKey: ["/api/admin/leads/assignments"],
    select: (data: any) => data.data || [],
    refetchInterval: 5000, // Auto-refresh every 5 seconds
  });
  
  // Get all leads for Leads By Salesperson view
  const { data: allLeads = [], isLoading: isLoadingAllLeads } = useQuery({
    queryKey: ["/api/leads"],
    select: (data: any) => data.data || [],
  });

  // Add new team member mutation
  const addMemberMutation = useMutation({
    mutationFn: async (memberData: Partial<SalesTeamMember>) => {
      const res = await apiRequest("POST", "/api/admin/sales-team", memberData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sales-team"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sales-team/performance"] });
      setIsAddMemberDialogOpen(false);
      setNewMember({
        name: "",
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        status: "active",
        role: "Junior Sales Rep",
        commissionRate: "5.00",
        createUserAccount: false,
        systemRole: ROLES.AGENT
      });
      setSelectedPermissionPreset("default");
      setCustomPermissions([]);
      toast({
        title: "Team member added",
        description: "New sales team member has been added successfully",
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
    mutationFn: async (memberData: Partial<SalesTeamMember>) => {
      if (!selectedMember) return;
      const res = await apiRequest("PATCH", `/api/admin/sales-team/${selectedMember.id}`, memberData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sales-team"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sales-team/performance"] });
      setEditMode(false);
      toast({
        title: "Team member updated",
        description: "Sales team member has been updated successfully",
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
      const res = await apiRequest("DELETE", `/api/admin/sales-team/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sales-team"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sales-team/performance"] });
      setSelectedMember(null);
      toast({
        title: "Team member deleted",
        description: "Sales team member has been deleted successfully",
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

  // Assign lead mutation
  const assignLeadMutation = useMutation({
    mutationFn: async (assignment: { leadId: number; salesRepId: number }) => {
      const res = await apiRequest("POST", "/api/admin/leads/assign", assignment);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/leads/unassigned"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/leads/assignments"] });
      setIsAssignLeadDialogOpen(false);
      toast({
        title: "Lead assigned",
        description: "Lead has been successfully assigned to sales representative",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to assign lead",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Restore sample leads mutation
  const restoreSampleLeadsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/leads/restore-samples", {});
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/leads/unassigned"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      toast({
        title: "Sample leads restored",
        description: `${data.data.length} sample leads have been added to the whiteboard`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to restore sample leads",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Filter members by search term and status
  const filteredMembers = teamMembers.filter((member: SalesTeamMember) => {
    const matchesSearch = 
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.phone.includes(searchTerm);
    
    const matchesStatus = statusFilter === "all" || member.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Handle member selection
  const handleMemberSelect = (member: SalesTeamMember) => {
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
  
  // Get lead status color
  const getLeadStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100";
      case "contacted":
        return "bg-purple-100 text-purple-800 hover:bg-purple-100";
      case "qualified":
        return "bg-indigo-100 text-indigo-800 hover:bg-indigo-100";
      case "proposal":
        return "bg-amber-100 text-amber-800 hover:bg-amber-100";
      case "negotiation":
        return "bg-orange-100 text-orange-800 hover:bg-orange-100";
      case "closed":
        return "bg-green-100 text-green-800 hover:bg-green-100";
      case "lost":
        return "bg-red-100 text-red-800 hover:bg-red-100";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100";
    }
  };

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sales Team Management</h1>
          <p className="text-muted-foreground">Manage sales representatives, track performance, and assign leads</p>
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
          <TabsTrigger value="lead-assignments">Lead Assignments</TabsTrigger>
          <TabsTrigger value="leads-by-salesperson">Leads By Salesperson</TabsTrigger>
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
                      Total Revenue
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{performance?.totalRevenue}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Avg. Deal Size: {performance?.avgDealSize}
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
                      Active / Total team members
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Conversion Rate
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{performance?.conversionRate}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {performance?.totalOrders} orders from {performance?.totalLeads} leads
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Top Performer</CardTitle>
                    <CardDescription>
                      Highest revenue generating sales representative
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
                          Revenue: {performance?.topPerformer?.revenue}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Unassigned Leads</CardTitle>
                    <CardDescription>
                      Leads waiting to be assigned to a sales representative
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingUnassignedLeads ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    ) : unassignedLeads.length === 0 ? (
                      <p className="text-muted-foreground">No unassigned leads at the moment</p>
                    ) : (
                      <div className="space-y-2">
                        {unassignedLeads.slice(0, 3).map((lead: any) => (
                          <div key={lead.id} className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{lead.name}</p>
                              <p className="text-sm text-muted-foreground">{lead.email}</p>
                            </div>
                            <Button size="sm" onClick={() => setIsAssignLeadDialogOpen(true)}>
                              Assign
                            </Button>
                          </div>
                        ))}
                        {unassignedLeads.length > 3 && (
                          <div className="text-center pt-2">
                            <Button variant="link" onClick={() => setActiveTab("lead-assignments")}>
                              View all {unassignedLeads.length} unassigned leads
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
                    Latest activities from the sales team
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <div className="mr-4 mt-1">
                        <ShoppingBag className="h-5 w-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="font-medium">New order created</p>
                        <p className="text-sm text-muted-foreground">
                          Sarah Johnson converted lead with Total Value: $2,500
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Today at 9:42 AM
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="mr-4 mt-1">
                        <Users className="h-5 w-5 text-green-500" />
                      </div>
                      <div>
                        <p className="font-medium">Lead assigned</p>
                        <p className="text-sm text-muted-foreground">
                          Michael Brown was assigned to Acme Corporation lead
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
                          Emily Parker joined the sales team as Senior Sales Rep
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
          <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between mb-4">
            <div className="relative w-full md:w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search team members..."
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
                Add Team Member
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
                  <BriefcaseBusiness className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                  <h3 className="mt-4 text-lg font-semibold">No team members found</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {searchTerm || statusFilter !== "all" 
                      ? "Try adjusting your search or filters" 
                      : "Add your first sales team member to get started"}
                  </p>
                  <Button onClick={() => setIsAddMemberDialogOpen(true)} className="mt-4">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Team Member
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
                        <TableHead>Leads</TableHead>
                        <TableHead>Revenue</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMembers.map((member: SalesTeamMember) => (
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
                                <div className="text-sm text-muted-foreground">{member.email}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{member.role}</TableCell>
                          <TableCell>{getStatusBadge(member.status)}</TableCell>
                          <TableCell>{member.leadCount}</TableCell>
                          <TableCell>{formatCurrency(parseFloat(member.totalRevenue))}</TableCell>
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
                                  setIsAssignLeadDialogOpen(true);
                                }}>
                                  <Users className="mr-2 h-4 w-4" />
                                  Assign Lead
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
                      <CardTitle>Team Member Details</CardTitle>
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
                                <SelectItem value="Junior Sales Rep">Junior Sales Rep</SelectItem>
                                <SelectItem value="Sales Representative">Sales Representative</SelectItem>
                                <SelectItem value="Senior Sales Rep">Senior Sales Rep</SelectItem>
                                <SelectItem value="Sales Manager">Sales Manager</SelectItem>
                                <SelectItem value="Sales Director">Sales Director</SelectItem>
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
                        <CalendarRange className="h-4 w-4 text-muted-foreground" />
                        <span>Hired: {formatDate(selectedMember.hireDate)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <BadgeDollarSign className="h-4 w-4 text-muted-foreground" />
                        <span>
                          Commission Rate: 
                          {editMode ? (
                            <Input 
                              type="number"
                              value={editedMember.commissionRate ?? selectedMember.commissionRate}
                              onChange={(e) => setEditedMember({...editedMember, commissionRate: e.target.value})}
                              className="ml-2 inline-block w-24"
                              min="0"
                              step="0.5"
                            />
                          ) : (
                            ` ${selectedMember.commissionRate}%`
                          )}
                        </span>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <h4 className="font-medium">Performance</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Leads</p>
                          <p className="text-lg font-medium">{selectedMember.leadCount}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Orders</p>
                          <p className="text-lg font-medium">{selectedMember.orderCount}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Revenue</p>
                          <p className="text-lg font-medium">{formatCurrency(parseFloat(selectedMember.totalRevenue))}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Earned</p>
                          <p className="text-lg font-medium">{formatCurrency(parseFloat(selectedMember.earnedCommission))}</p>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <h4 className="font-medium">Specialization</h4>
                      {editMode ? (
                        <Input 
                          value={editedMember.specialization ?? selectedMember.specialization}
                          onChange={(e) => setEditedMember({...editedMember, specialization: e.target.value})}
                        />
                      ) : (
                        <p className="text-sm">{selectedMember.specialization}</p>
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
                    <CardTitle>No team member selected</CardTitle>
                    <CardDescription>
                      Select a team member to view their details
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center justify-center py-8">
                      <User className="h-16 w-16 text-muted-foreground opacity-50" />
                      <p className="mt-4 text-center text-muted-foreground">
                        Click on a team member from the list to view their details.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Lead Assignments Tab */}
        <TabsContent value="lead-assignments" className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Lead Assignments</h3>
            <Button onClick={() => setIsAssignLeadDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Assign Lead
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Unassigned Leads</CardTitle>
              <CardDescription>
                Leads waiting to be assigned to a sales representative
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingUnassignedLeads ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : unassignedLeads.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Users className="h-16 w-16 text-muted-foreground opacity-50" />
                  <p className="mt-4 text-center text-muted-foreground">
                    No unassigned leads at the moment.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Lead</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {unassignedLeads.map((lead: any) => (
                      <TableRow key={lead.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{lead.name}</div>
                            <div className="text-sm text-muted-foreground">{lead.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>{lead.source}</TableCell>
                        <TableCell>{formatCurrency(parseFloat(lead.value))}</TableCell>
                        <TableCell>{formatDate(lead.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <Button 
                            size="sm" 
                            onClick={() => setIsAssignLeadDialogOpen(true)}
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
              <CardTitle>Recent Assignments</CardTitle>
              <CardDescription>
                Recently assigned leads to sales representatives
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingLeadAssignments ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : leadAssignments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Users className="h-16 w-16 text-muted-foreground opacity-50" />
                  <p className="mt-4 text-center text-muted-foreground">
                    No lead assignments yet.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Lead</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Assigned Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leadAssignments.map((assignment: LeadAssignment) => (
                      <TableRow key={assignment.id}>
                        <TableCell>
                          <div className="font-medium">{assignment.leadName}</div>
                        </TableCell>
                        <TableCell>{assignment.assignedToName}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              assignment.status === "closed_won"
                                ? "bg-green-100 text-green-800 hover:bg-green-100"
                                : assignment.status === "closed_lost"
                                ? "bg-red-100 text-red-800 hover:bg-red-100"
                                : assignment.status === "proposal"
                                ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                                : assignment.status === "qualified"
                                ? "bg-purple-100 text-purple-800 hover:bg-purple-100"
                                : assignment.status === "contacted"
                                ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                                : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                            }
                          >
                            {assignment.status.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatCurrency(parseFloat(assignment.value))}</TableCell>
                        <TableCell>{formatDate(assignment.assignedAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Leads By Salesperson Tab */}
        <TabsContent value="leads-by-salesperson" className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-medium">Leads By Salesperson</h3>
              <p className="text-sm text-muted-foreground">
                Showing leads grouped by sales representative
              </p>
            </div>
            <Button 
              onClick={() => restoreSampleLeadsMutation.mutate()}
              disabled={restoreSampleLeadsMutation.isPending}
              variant="outline"
              size="sm"
            >
              {restoreSampleLeadsMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Restoring...
                </>
              ) : (
                <>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Restore Sample Leads
                </>
              )}
            </Button>
          </div>
          
          {isLoadingTeamMembers || isLoadingAllLeads ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-6">
              {teamMembers
                .filter((member: SalesTeamMember) => member.status === "active")
                .map((salesperson: SalesTeamMember) => {
                  // Filter leads assigned to this salesperson
                  const salesPersonLeads = allLeads.filter((lead: any) => 
                    lead.assignedToId === salesperson.id || lead.userId === salesperson.id
                  );
                  
                  return (
                    <Card key={salesperson.id} className="overflow-hidden">
                      <CardHeader className="pb-3">
                        <div className="flex items-center">
                          <Avatar className="h-10 w-10 mr-4">
                            <AvatarImage src={salesperson.avatarUrl || ""} />
                            <AvatarFallback className="bg-brand-100 text-brand-800">
                              {salesperson.name?.charAt(0) || salesperson.username?.charAt(0) || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-lg">{salesperson.name || salesperson.username}</CardTitle>
                            <CardDescription>{salesperson.email}</CardDescription>
                          </div>
                          <div className="ml-auto">
                            <Badge variant="outline" className="ml-2">
                              {salesPersonLeads.length || 0} Leads
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      
                      {salesPersonLeads && salesPersonLeads.length > 0 ? (
                        <CardContent className="p-0">
                          <div className="overflow-hidden border-t border-gray-100">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Lead</TableHead>
                                  <TableHead>Status</TableHead>
                                  <TableHead>Value</TableHead>
                                  <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {salesPersonLeads.map((lead: any) => (
                                  <TableRow key={lead.id} className="hover:bg-gray-50">
                                    <TableCell>
                                      <div className="font-medium">{lead.name}</div>
                                      <div className="text-sm text-muted-foreground">{lead.email}</div>
                                    </TableCell>
                                    <TableCell>
                                      <Badge className={getLeadStatusColor(lead.status)}>
                                        {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      {lead.value ? (
                                        <span className="text-sm font-medium text-green-600">
                                          ${parseFloat(lead.value).toLocaleString()}
                                        </span>
                                      ) : (
                                        <span className="text-sm text-muted-foreground">Unknown</span>
                                      )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="mr-2"
                                      >
                                        View
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </CardContent>
                      ) : (
                        <CardContent>
                          <div className="text-center py-6">
                            <UserCircle className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                            <h3 className="mt-2 text-sm font-medium">No leads assigned</h3>
                            <p className="mt-1 text-sm text-muted-foreground">This salesperson has no active leads.</p>
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  );
                })}
                
              {teamMembers.filter((member: SalesTeamMember) => member.status === "active").length === 0 && (
                <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
                  <Users className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                  <h3 className="mt-2 text-sm font-medium">No active sales representatives found</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Add members to your sales team to see them here.</p>
                </div>
              )}
            </div>
          )}
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
                <CardTitle>Revenue by Sales Rep</CardTitle>
                <CardDescription>
                  Total revenue generated by each sales representative
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Chart would go here */}
                <div className="h-80 flex items-center justify-center bg-muted/20 rounded-md">
                  <p className="text-muted-foreground">Revenue chart visualization</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Lead Conversion Rates</CardTitle>
                <CardDescription>
                  Percentage of leads converted to orders by each sales rep
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Chart would go here */}
                <div className="h-80 flex items-center justify-center bg-muted/20 rounded-md">
                  <p className="text-muted-foreground">Conversion chart visualization</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Team Performance Rankings</CardTitle>
              <CardDescription>
                Performance metrics for all sales representatives
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
                      <TableHead>Sales Rep</TableHead>
                      <TableHead>Leads</TableHead>
                      <TableHead>Conversion Rate</TableHead>
                      <TableHead>Avg. Deal Size</TableHead>
                      <TableHead>Revenue</TableHead>
                      <TableHead>Commission</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teamMembers
                      .filter((member: SalesTeamMember) => member.status === "active")
                      .sort((a: SalesTeamMember, b: SalesTeamMember) => 
                        parseFloat(b.totalRevenue) - parseFloat(a.totalRevenue)
                      )
                      .map((member: SalesTeamMember, index: number) => {
                        const conversionRate = member.leadCount > 0 
                          ? (member.orderCount / member.leadCount * 100).toFixed(1) 
                          : "0.0";
                        const avgDealSize = member.orderCount > 0 
                          ? (parseFloat(member.totalRevenue) / member.orderCount).toFixed(2) 
                          : "0.00";
                        
                        return (
                          <TableRow key={member.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium">
                                  {index + 1}
                                </div>
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={member.avatarUrl} />
                                  <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="font-medium">{member.name}</div>
                              </div>
                            </TableCell>
                            <TableCell>{member.leadCount}</TableCell>
                            <TableCell>{conversionRate}%</TableCell>
                            <TableCell>{formatCurrency(parseFloat(avgDealSize))}</TableCell>
                            <TableCell>{formatCurrency(parseFloat(member.totalRevenue))}</TableCell>
                            <TableCell>{formatCurrency(parseFloat(member.earnedCommission))}</TableCell>
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

      {/* Add Team Member Dialog */}
      <Dialog open={isAddMemberDialogOpen} onOpenChange={setIsAddMemberDialogOpen}>
        <DialogContent className="sm:max-w-[525px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Sales Team Member</DialogTitle>
            <DialogDescription>
              Add a new member to your sales team. They'll be able to manage leads and orders.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  placeholder="Enter first name"
                  value={newMember.firstName || ""}
                  onChange={(e) => {
                    const firstName = e.target.value;
                    const lastName = newMember.lastName || '';
                    setNewMember({ 
                      ...newMember, 
                      firstName,
                      name: `${firstName} ${lastName}`.trim() 
                    });
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  placeholder="Enter last name"
                  value={newMember.lastName || ""}
                  onChange={(e) => {
                    const lastName = e.target.value;
                    const firstName = newMember.firstName || '';
                    setNewMember({ 
                      ...newMember, 
                      lastName,
                      name: `${firstName} ${lastName}`.trim() 
                    });
                  }}
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
                    <SelectItem value="Junior Sales Rep">Junior Sales Rep</SelectItem>
                    <SelectItem value="Sales Representative">Sales Representative</SelectItem>
                    <SelectItem value="Senior Sales Rep">Senior Sales Rep</SelectItem>
                    <SelectItem value="Sales Manager">Sales Manager</SelectItem>
                    <SelectItem value="Sales Director">Sales Director</SelectItem>
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
              <Label htmlFor="specialization">Specialization</Label>
              <Input
                id="specialization"
                placeholder="E.g. Enterprise Sales, Retail, Healthcare"
                value={newMember.specialization || ''}
                onChange={(e) => setNewMember({ ...newMember, specialization: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Additional information about this team member"
                value={newMember.notes || ''}
                onChange={(e) => setNewMember({ ...newMember, notes: e.target.value })}
              />
            </div>
            
            <Separator className="my-4" />
            
            {/* User Account Creation Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h3 className="text-base font-medium">User Account</h3>
                  <p className="text-sm text-muted-foreground">Create a system account for this team member</p>
                </div>
                <Switch
                  checked={!!newMember.createUserAccount}
                  onCheckedChange={(checked) => setNewMember({ ...newMember, createUserAccount: checked })}
                />
              </div>
              
              {newMember.createUserAccount && (
                <div className="space-y-4 border rounded-md p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        placeholder="Username for login"
                        value={newMember.username || ''}
                        onChange={(e) => setNewMember({ ...newMember, username: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Temporary password"
                        value={newMember.password || ''}
                        onChange={(e) => setNewMember({ ...newMember, password: e.target.value })}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="systemRole">System Role</Label>
                    <Select
                      value={newMember.systemRole as string}
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
                          <SelectItem value="salesManager">Sales Manager</SelectItem>
                        </SelectGroup>
                        
                        <SelectGroup>
                          <SelectLabel>Design Team</SelectLabel>
                          <SelectItem value="designBasic">Design Basic</SelectItem>
                          <SelectItem value="designStandard">Design Standard</SelectItem>
                          <SelectItem value="designAdvanced">Design Advanced</SelectItem>
                          <SelectItem value="designManager">Design Manager</SelectItem>
                        </SelectGroup>
                        
                        <SelectGroup>
                          <SelectLabel>Manufacturing</SelectLabel>
                          <SelectItem value="manufacturingBasic">Manufacturing Basic</SelectItem>
                          <SelectItem value="manufacturingStandard">Manufacturing Standard</SelectItem>
                          <SelectItem value="manufacturingAdvanced">Manufacturing Advanced</SelectItem>
                          <SelectItem value="manufacturingManager">Manufacturing Manager</SelectItem>
                        </SelectGroup>
                        
                        <SelectGroup>
                          <SelectLabel>Administrator</SelectLabel>
                          <SelectItem value="adminBasic">Admin (Basic)</SelectItem>
                          <SelectItem value="adminFull">Admin (Full Access)</SelectItem>
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

      {/* Assign Lead Dialog */}
      <Dialog open={isAssignLeadDialogOpen} onOpenChange={setIsAssignLeadDialogOpen}>
        <DialogContent className="sm:max-w-[525px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Assign Lead</DialogTitle>
            <DialogDescription>
              Assign an unassigned lead to a sales representative.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="lead">Select Lead</Label>
              <Select>
                <SelectTrigger id="lead">
                  <SelectValue placeholder="Select a lead" />
                </SelectTrigger>
                <SelectContent>
                  {unassignedLeads.map((lead: any) => (
                    <SelectItem key={lead.id} value={lead.id.toString()}>
                      {lead.name} - {formatCurrency(parseFloat(lead.value))}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sales-rep">Assign To</Label>
              <Select>
                <SelectTrigger id="sales-rep">
                  <SelectValue placeholder="Select a sales representative" />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers
                    .filter((member: SalesTeamMember) => member.status === "active")
                    .map((member: SalesTeamMember) => (
                      <SelectItem key={member.id} value={member.id.toString()}>
                        {member.name} - {member.role}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any additional instructions for the sales rep"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAssignLeadDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={() => setIsAssignLeadDialogOpen(false)}>
              Assign Lead
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}