import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import {
  PlusIcon,
  PersonIcon,
  Pencil1Icon,
  TrashIcon,
  DotsVerticalIcon,
  InfoCircledIcon,
  CalendarIcon,
  HomeIcon,
  DotFilledIcon,
  MixerHorizontalIcon,
} from "@radix-ui/react-icons";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";

// Define the StaffMember interface
interface StaffMember {
  id: number;
  name: string;
  role: string;
  email?: string;
  phone?: string;
  specialization?: string;
  status: 'active' | 'inactive' | 'pending';
  // Extended staff info
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  certifications?: string[];
  notes?: string;
  // Financial tracking
  payRate?: number;
  payType?: 'hourly' | 'daily' | 'fixed';
  totalPaid?: number;
  invoices?: {id: number; date: string; amount: number; status: string}[];
  expenses?: {id: number; date: string; category: string; amount: number; status: string}[];
  // Calendar and scheduling
  availableDates?: string[];
  assignedDates?: string[];
  campAssignments?: {campId: number; campName: string}[];
  // Travel and accommodations
  travelPlans?: {
    id: number;
    type: 'flight' | 'train' | 'bus' | 'car';
    departureDate?: string;
    departureLocation?: string;
    arrivalDate?: string;
    arrivalLocation?: string;
    confirmationCode?: string;
  }[];
  accommodations?: {
    id: number;
    type: 'hotel' | 'cabin' | 'dorm' | 'other';
    location?: string;
    checkIn?: string;
    checkOut?: string;
    confirmationCode?: string;
    roomNumber?: string;
  }[];
}

// StaffMemberCard component - separated for better state handling
const StaffMemberCard = ({ 
  member, 
  onEdit, 
  onDelete,
  refreshKey // key for forcing re-render
}: { 
  member: StaffMember, 
  onEdit: (member: StaffMember) => void, 
  onDelete: (member: StaffMember) => void,
  refreshKey: number
}) => {
  // Helper function for placeholder images
  const getPlaceholderImage = (name: string) => {
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 
      'bg-pink-500', 'bg-yellow-500', 'bg-indigo-500'
    ];
    const colorIndex = name.length % colors.length;
    
    return (
      <div className={`flex items-center justify-center ${colors[colorIndex]} text-white font-bold rounded-full w-16 h-16 text-xl`}>
        {initials}
      </div>
    );
  };

  // Helper function for assignment summary
  const getAssignmentSummary = (member: StaffMember) => {
    const totalAssignments = member.campAssignments?.length || 0;
    const totalDays = member.assignedDates?.length || 0;
    
    if (totalAssignments === 0 && totalDays === 0) {
      return 'Not assigned to any camps';
    }
    
    return `${totalAssignments} camp${totalAssignments !== 1 ? 's' : ''}, ${totalDays} day${totalDays !== 1 ? 's' : ''}`;
  };

  // Helper function for financial summary
  const getFinancialSummary = (member: StaffMember) => {
    const totalPaid = member.totalPaid || 0;
    const payRate = member.payRate || 0;
    const payType = member.payType || 'N/A';
    
    return (
      <>
        <div>Rate: ${payRate} ({payType})</div>
        <div>Total paid: ${totalPaid.toFixed(2)}</div>
      </>
    );
  };

  return (
    <Card key={`staff-${member.id}-${refreshKey}`} className="overflow-hidden">
      <CardHeader className="p-4 pb-0">
        <div className="flex justify-between items-start">
          <div className="flex gap-4 items-center">
            {getPlaceholderImage(member.name)}
            <div>
              <CardTitle className="text-xl">{member.name}</CardTitle>
              <CardDescription className="text-sm font-medium">
                {member.role} | {member.specialization || 'No specialization'}
              </CardDescription>
              <div className="mt-1">
                <span className={`px-2 py-1 rounded-full text-xs ${
                  member.status === 'active' ? 'bg-green-100 text-green-800' :
                  member.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {member.status}
                </span>
              </div>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <DotsVerticalIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(member)}>
                <Pencil1Icon className="mr-2 h-4 w-4" />
                Edit Details
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => onDelete(member)}
              >
                <TrashIcon className="mr-2 h-4 w-4" />
                Delete Staff
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        <div className="grid grid-cols-1 gap-4">
          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold mb-2">Contact Information:</h4>
            <div className="text-sm">
              <div className="flex gap-2 items-center">
                <PersonIcon className="h-4 w-4 text-gray-400" />
                <span>{member.email || 'No email provided'}</span>
              </div>
              <div className="flex gap-2 items-center mt-1">
                <HomeIcon className="h-4 w-4 text-gray-400" />
                <span>{member.phone || 'No phone provided'}</span>
              </div>
            </div>
          </div>
          
          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold mb-2">Work Schedule:</h4>
            <div className="text-sm text-gray-700">
              {getAssignmentSummary(member)}
            </div>
          </div>
          
          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold mb-2">Financial:</h4>
            <div className="text-sm text-gray-700">
              {getFinancialSummary(member)}
            </div>
          </div>
        </div>
      </CardContent>
      
      <div className="bg-gray-50 px-4 py-3 border-t">
        <div className="flex justify-between">
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs"
            onClick={() => onEdit(member)}
          >
            <Pencil1Icon className="mr-1 h-3 w-3" />
            Edit
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs text-blue-600"
            onClick={() => onEdit(member)}
          >
            View Full Profile
          </Button>
        </div>
      </div>
    </Card>
  );
};

// Main StaffManagement Component
export default function StaffManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State for staff list using React Query
  const { 
    data: staffListData, 
    isLoading: isLoadingStaff, 
    isError: isErrorStaff,
    error: staffError
  } = useQuery({
    queryKey: ['/api/staff'],
    queryFn: async () => {
      console.log('Fetching staff members from API');
      const response = await apiRequest('GET', '/api/staff');
      const data = await response.json();
      console.log('Received staff data:', data);
      return data.data || [];
    }
  });
  
  // Derived staff list from React Query data
  const staffList = staffListData || [];
  
  // Add a refresh key to force re-renders
  const [refreshKey, setRefreshKey] = useState(0);
  const forceRefresh = () => setRefreshKey(prevKey => prevKey + 1);
  
  // State for add staff dialog
  const [isAddingStaff, setIsAddingStaff] = useState(false);
  
  // State for new staff member
  const [newStaff, setNewStaff] = useState<Omit<StaffMember, 'id'>>({
    name: '',
    role: '',
    email: '',
    phone: '',
    specialization: '',
    status: 'active'
  });
  
  // State for edit staff dialog and current editing staff
  const [isEditingStaff, setIsEditingStaff] = useState(false);
  const [currentEditingStaff, setCurrentEditingStaff] = useState<StaffMember | null>(null);
  
  // State for delete confirmation
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<StaffMember | null>(null);
  
  // Handler for new staff form input changes
  const handleNewStaffChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewStaff(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle role selection for new staff
  const handleRoleChange = (value: string) => {
    setNewStaff(prev => ({ ...prev, role: value }));
  };
  
  // Handle status selection for new staff
  const handleStatusChange = (value: string) => {
    setNewStaff(prev => ({ ...prev, status: value as 'active' | 'inactive' | 'pending' }));
  };
  
  // Mutation for adding staff
  const addStaffMutation = useMutation({
    mutationFn: async (staffData: Omit<StaffMember, 'id'>) => {
      console.log('Adding staff member with data:', staffData);
      const response = await apiRequest('POST', '/api/staff', staffData);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add staff member');
      }
      return await response.json();
    },
    onSuccess: () => {
      // Invalidate the staff list query to trigger a refetch
      queryClient.invalidateQueries({ queryKey: ['/api/staff'] });
      
      // Reset form and close dialog
      setNewStaff({
        name: '',
        role: '',
        email: '',
        phone: '',
        specialization: '',
        status: 'active'
      });
      setIsAddingStaff(false);
      
      // Show success toast
      toast({
        title: "Staff added",
        description: `${newStaff.name} has been added to the staff list.`
      });
    },
    onError: (error: Error) => {
      console.error('Error adding staff:', error);
      toast({
        title: "Error adding staff",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Function to add a new staff member
  const handleAddStaff = () => {
    // Validate required fields
    if (!newStaff.name || !newStaff.role) {
      toast({
        title: "Missing information",
        description: "Name and role are required.",
        variant: "destructive"
      });
      return;
    }
    
    // Execute the mutation
    addStaffMutation.mutate(newStaff);
  };
  
  // Function to start editing a staff member
  const startEditing = (staff: StaffMember) => {
    // Create a deep copy to avoid reference issues
    const staffCopy = JSON.parse(JSON.stringify(staff)) as StaffMember;
    setCurrentEditingStaff(staffCopy);
    setIsEditingStaff(true);
  };
  
  // Functions for editing staff member data
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentEditingStaff) return;
    
    const { name, value } = e.target;
    console.log(`Editing field ${name} with value: ${value}`);
    
    // Create a new object based on the current staff to force a re-render
    const updatedStaff = {
      ...currentEditingStaff,
      [name]: value
    };
    
    console.log("Updated staff object:", JSON.stringify(updatedStaff));
    setCurrentEditingStaff(updatedStaff);
  };
  
  const handleEditRoleChange = (value: string) => {
    if (!currentEditingStaff) return;
    console.log(`Changing role to: ${value}`);
    
    // Create a new object based on the current staff
    const updatedStaff = {
      ...currentEditingStaff,
      role: value
    };
    
    setCurrentEditingStaff(updatedStaff);
  };
  
  const handleEditStatusChange = (value: string) => {
    if (!currentEditingStaff) return;
    console.log(`Changing status to: ${value}`);
    
    // Create a new object based on the current staff
    const updatedStaff = {
      ...currentEditingStaff,
      status: value as 'active' | 'inactive' | 'pending'
    };
    
    setCurrentEditingStaff(updatedStaff);
  };
  
  // Mutation for updating staff
  const updateStaffMutation = useMutation({
    mutationFn: async (staffData: StaffMember) => {
      console.log('Updating staff member with data:', staffData);
      const response = await apiRequest('PUT', `/api/staff/${staffData.id}`, staffData);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update staff member');
      }
      return await response.json();
    },
    onSuccess: (data) => {
      // Invalidate the staff list query to trigger a refetch
      queryClient.invalidateQueries({ queryKey: ['/api/staff'] });
      
      // Close dialog and reset state
      setIsEditingStaff(false);
      setCurrentEditingStaff(null);
      
      // Force a re-render for any local state dependencies
      forceRefresh();
      
      // Show success toast
      toast({
        title: "Staff updated",
        description: `${data.data.name}'s information has been updated.`
      });
    },
    onError: (error: Error) => {
      console.error('Error updating staff:', error);
      toast({
        title: "Error updating staff",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Function to save staff edits
  const saveStaffEdit = () => {
    if (!currentEditingStaff) {
      console.error("Cannot save staff edit: currentEditingStaff is null");
      return;
    }
    
    console.log("Saving edits for staff member:", JSON.stringify(currentEditingStaff));
    
    // Create a deep copy of the editing staff
    const updatedStaff = JSON.parse(JSON.stringify(currentEditingStaff)) as StaffMember;
    
    // Execute the mutation
    updateStaffMutation.mutate(updatedStaff);
  };
  
  // Mutation for deleting staff
  const deleteStaffMutation = useMutation({
    mutationFn: async (staffId: number) => {
      console.log('Deleting staff member with ID:', staffId);
      const response = await apiRequest('DELETE', `/api/staff/${staffId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete staff member');
      }
      return await response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate the staff list query to trigger a refetch
      queryClient.invalidateQueries({ queryKey: ['/api/staff'] });
      
      // Reset state and close dialog
      setIsDeleteModalOpen(false);
      
      // Get the name from our saved reference for the toast
      const nameToDelete = staffToDelete?.name || 'Staff member';
      setStaffToDelete(null);
      
      // Force a re-render for any local state dependencies
      forceRefresh();
      
      // Show success toast
      toast({
        title: "Staff removed",
        description: `${nameToDelete} has been removed from the staff list.`
      });
    },
    onError: (error: Error) => {
      console.error('Error deleting staff:', error);
      toast({
        title: "Error deleting staff",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Functions for deleting staff
  const handleDeleteClick = (staff: StaffMember) => {
    // Create a deep copy
    const staffCopy = JSON.parse(JSON.stringify(staff)) as StaffMember;
    setStaffToDelete(staffCopy);
    setIsDeleteModalOpen(true);
  };
  
  const confirmDelete = () => {
    if (!staffToDelete) return;
    
    // Execute the mutation
    deleteStaffMutation.mutate(staffToDelete.id);
  };
  
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Staff Management</h1>
          <p className="text-gray-500 mt-1">Manage staff members for your camp events</p>
        </div>
        <Button onClick={() => setIsAddingStaff(true)} className="h-10">
          <PlusIcon className="mr-2 h-4 w-4" />
          Add Staff
        </Button>
      </div>
      
      {/* Loading and error states */}
      {isLoadingStaff && (
        <div className="flex justify-center items-center py-12">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            <p className="text-lg text-gray-600">Loading staff data...</p>
          </div>
        </div>
      )}
      
      {isErrorStaff && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading staff data</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{staffError?.message || 'An unknown error occurred. Please try again later.'}</p>
              </div>
              <div className="mt-4">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/staff'] })}
                >
                  Retry
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {!isLoadingStaff && !isErrorStaff && (
        <>
          {/* Staff Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-4">
                  <PersonIcon className="h-8 w-8 text-blue-500" />
                  <div>
                    <div className="text-sm text-gray-500">Total Staff</div>
                    <div className="text-2xl font-bold">{staffList.length}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-4">
                  <DotFilledIcon className="h-8 w-8 text-green-500" />
                  <div>
                    <div className="text-sm text-gray-500">Active Staff</div>
                    <div className="text-2xl font-bold">
                      {staffList.filter((m: StaffMember) => m.status === 'active').length}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-4">
                  <CalendarIcon className="h-8 w-8 text-purple-500" />
                  <div>
                    <div className="text-sm text-gray-500">Assigned Camps</div>
                    <div className="text-2xl font-bold">
                      {staffList.reduce((total: number, member: StaffMember) => total + (member.campAssignments?.length || 0), 0)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Staff List */}
          {staffList.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {staffList.map((member: StaffMember) => (
                <StaffMemberCard
                  key={`${member.id}-${refreshKey}`}
                  member={member}
                  onEdit={startEditing}
                  onDelete={handleDeleteClick}
                  refreshKey={refreshKey}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-10">
                <PersonIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-medium mb-2">No Staff Members Yet</h3>
                <p className="text-gray-500 mb-6">Add your first staff member to get started managing your camp personnel.</p>
                <Button onClick={() => setIsAddingStaff(true)}>
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Add First Staff Member
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}
      
      {/* Add Staff Dialog */}
      <Dialog open={isAddingStaff} onOpenChange={setIsAddingStaff}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Staff Member</DialogTitle>
            <DialogDescription>
              Add a new staff member to your camp event.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh]">
            <div className="space-y-4 py-2 px-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="John Smith"
                    value={newStaff.name}
                    onChange={handleNewStaffChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role *</Label>
                  <Select onValueChange={handleRoleChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Coach">Coach</SelectItem>
                      <SelectItem value="Trainer">Trainer</SelectItem>
                      <SelectItem value="Manager">Manager</SelectItem>
                      <SelectItem value="Supervisor">Supervisor</SelectItem>
                      <SelectItem value="Coordinator">Coordinator</SelectItem>
                      <SelectItem value="Medical Staff">Medical Staff</SelectItem>
                      <SelectItem value="Security">Security</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="john@example.com"
                    value={newStaff.email || ''}
                    onChange={handleNewStaffChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    placeholder="(555) 123-4567"
                    value={newStaff.phone || ''}
                    onChange={handleNewStaffChange}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="specialization">Specialization</Label>
                  <Input
                    id="specialization"
                    name="specialization"
                    placeholder="Basketball, Swimming, etc."
                    value={newStaff.specialization || ''}
                    onChange={handleNewStaffChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select defaultValue="active" onValueChange={handleStatusChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingStaff(false)}>Cancel</Button>
            <Button onClick={handleAddStaff}>Add Staff Member</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Staff Dialog */}
      {currentEditingStaff && (
        <Dialog open={isEditingStaff} onOpenChange={setIsEditingStaff}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle className="text-2xl">Edit Staff Member</DialogTitle>
              <DialogDescription>
                Update the details for this staff member. Use the tabs below to navigate through different sections.
              </DialogDescription>
            </DialogHeader>
            
            <Tabs defaultValue="basic" className="w-full flex-grow flex flex-col overflow-hidden">
              <TabsList className="grid grid-cols-5 w-full mb-4 sticky top-0 z-10 bg-white flex-shrink-0">
                <TabsTrigger value="basic"><PersonIcon className="mr-2 h-4 w-4" />Basic Info</TabsTrigger>
                <TabsTrigger value="financial"><DotFilledIcon className="mr-2 h-4 w-4" />Financial</TabsTrigger>
                <TabsTrigger value="schedule"><CalendarIcon className="mr-2 h-4 w-4" />Schedule</TabsTrigger>
                <TabsTrigger value="contact"><HomeIcon className="mr-2 h-4 w-4" />Contact</TabsTrigger>
                <TabsTrigger value="travel"><MixerHorizontalIcon className="mr-2 h-4 w-4" />Travel</TabsTrigger>
              </TabsList>
              
              {/* Basic Info Tab */}
              <TabsContent value="basic" className="flex-grow overflow-hidden">
                <ScrollArea className="h-[50vh]">
                  <div className="space-y-6 py-4 px-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-name">Name *</Label>
                        <Input
                          id="edit-name"
                          name="name"
                          value={currentEditingStaff.name}
                          onChange={handleEditChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-role">Role *</Label>
                        <Select defaultValue={currentEditingStaff.role} onValueChange={handleEditRoleChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Coach">Coach</SelectItem>
                            <SelectItem value="Trainer">Trainer</SelectItem>
                            <SelectItem value="Manager">Manager</SelectItem>
                            <SelectItem value="Supervisor">Supervisor</SelectItem>
                            <SelectItem value="Coordinator">Coordinator</SelectItem>
                            <SelectItem value="Medical Staff">Medical Staff</SelectItem>
                            <SelectItem value="Security">Security</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-email">Email</Label>
                        <Input
                          id="edit-email"
                          name="email"
                          type="email"
                          value={currentEditingStaff.email || ''}
                          onChange={handleEditChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-phone">Phone</Label>
                        <Input
                          id="edit-phone"
                          name="phone"
                          value={currentEditingStaff.phone || ''}
                          onChange={handleEditChange}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-specialization">Specialization</Label>
                        <Input
                          id="edit-specialization"
                          name="specialization"
                          value={currentEditingStaff.specialization || ''}
                          onChange={handleEditChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-status">Status</Label>
                        <Select defaultValue={currentEditingStaff.status} onValueChange={handleEditStatusChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-notes">Notes</Label>
                      <Textarea
                        id="edit-notes"
                        name="notes"
                        placeholder="Additional notes about this staff member"
                        value={currentEditingStaff.notes || ''}
                        onChange={(e) => {
                          console.log(`Editing notes field with value: ${e.target.value.substring(0, 20)}${e.target.value.length > 20 ? '...' : ''}`);
                          
                          // Create a new object based on the current staff
                          const updatedStaff = {
                            ...currentEditingStaff,
                            notes: e.target.value
                          };
                          
                          setCurrentEditingStaff(updatedStaff);
                        }}
                        className="min-h-[100px]"
                      />
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>
              
              {/* Financial Tab */}
              <TabsContent value="financial" className="flex-grow overflow-hidden">
                <ScrollArea className="h-[50vh]">
                  <div className="space-y-6 py-4 px-2">
                    <div className="space-y-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-lg font-medium mb-2">Payment Summary</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Total to be paid:</span>
                            <span className="font-medium">${currentEditingStaff.totalPaid?.toFixed(2) || '0.00'}</span>
                          </div>
                          <div className="text-sm text-gray-500 mt-2">
                            <p>Payment amounts are based on assigned camps and rates in the Camp Overview page.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-payRate">Pay Rate</Label>
                        <Input
                          id="edit-payRate"
                          name="payRate"
                          type="number"
                          step="0.01"
                          value={currentEditingStaff.payRate || ''}
                          onChange={(e) => {
                            console.log(`Editing pay rate field with value: ${e.target.value}`);
                            
                            // Create a new object based on the current staff
                            const updatedStaff = {
                              ...currentEditingStaff,
                              payRate: parseFloat(e.target.value) || 0
                            };
                            
                            setCurrentEditingStaff(updatedStaff);
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-payType">Pay Type</Label>
                        <Select 
                          defaultValue={currentEditingStaff.payType || 'hourly'} 
                          onValueChange={(value) => {
                            const updatedStaff = {
                              ...currentEditingStaff,
                              payType: value as 'hourly' | 'daily' | 'fixed'
                            };
                            setCurrentEditingStaff(updatedStaff);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select pay type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="hourly">Hourly</SelectItem>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="fixed">Fixed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>
              
              {/* Other tabs content would go here */}
              <TabsContent value="schedule" className="flex-grow overflow-hidden">
                <ScrollArea className="h-[50vh]">
                  <div className="py-4 px-2">
                    <p className="text-gray-500">Schedule information will be managed here.</p>
                  </div>
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="contact" className="flex-grow overflow-hidden">
                <ScrollArea className="h-[50vh]">
                  <div className="py-4 px-2">
                    <p className="text-gray-500">Contact information will be managed here.</p>
                  </div>
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="travel" className="flex-grow overflow-hidden">
                <ScrollArea className="h-[50vh]">
                  <div className="py-4 px-2">
                    <p className="text-gray-500">Travel information will be managed here.</p>
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
            
            <DialogFooter className="border-t pt-4 mt-4">
              <Button variant="outline" onClick={() => setIsEditingStaff(false)}>Cancel</Button>
              <Button onClick={saveStaffEdit}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Staff Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {staffToDelete?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 bg-red-50 p-4 rounded-md text-red-800 text-sm">
            <p>All data associated with this staff member will be permanently removed, including:</p>
            <ul className="list-disc ml-5 mt-2 space-y-1">
              <li>Personal information</li>
              <li>Financial records</li>
              <li>Camp assignments</li>
              <li>Travel arrangements</li>
            </ul>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete Staff Member</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}