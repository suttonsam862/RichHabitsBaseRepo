import React, { useState } from "react";
import { sampleStaffMembers, getDocumentStatusColor } from "@/lib/constants";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Users, 
  User,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Calendar,
  Clock,
  Mail,
  Phone,
  Medal,
  Briefcase,
  DollarSign,
  FileText,
  X,
  Trash2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

// Format date for display
const formatDate = (dateString: string) => {
  if (!dateString) return "";
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
};

// Get status badge color for staff status
const getStatusColor = (status: string) => {
  switch(status?.toLowerCase()) {
    case 'active':
      return 'bg-green-100 text-green-800 hover:bg-green-200';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
    case 'inactive':
      return 'bg-red-100 text-red-800 hover:bg-red-200';
    case 'completed':
      return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
    case 'not started':
      return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    case 'in progress':
      return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
    default:
      return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
  }
};

// Staff member interface
interface Clinician {
  id: number;
  name: string;
  role: string;
  email: string;
  phone: string;
  status: string;
  avatar?: string;
  experience: string;
  rate: number;
  rateType?: string;
  availability: string;
  skills: string[];
  certifications: string[];
  camps: { id: number; name: string }[];
  documents: { id: number; name: string; status: string; date: string }[];
  assignedShifts: { id: number; campId: number; date: string; startTime: string; endTime: string; campName?: string; role?: string; location?: string }[];
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
}

// StaffMemberDetails component
interface StaffMemberDetailsProps {
  staffMember: Clinician;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const StaffMemberDetails: React.FC<StaffMemberDetailsProps> = ({ staffMember, onClose, onEdit, onDelete }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="sticky top-0 z-10 bg-white pb-4">
          <div className="flex justify-between items-center">
            <DialogTitle className="text-2xl font-bold">{staffMember.name}</DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center mt-2">
            <Badge className={getStatusColor(staffMember.status)}>
              {staffMember.status.charAt(0).toUpperCase() + staffMember.status.slice(1)}
            </Badge>
            <span className="mx-2 text-gray-500">{staffMember.role}</span>
          </div>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-gray-500" />
                  <span>{staffMember.email}</span>
                </div>
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-2 text-gray-500" />
                  <span>{staffMember.phone}</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Skills & Qualifications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Experience</h4>
                    <div className="flex items-center mt-1">
                      <Medal className="h-4 w-4 mr-2 text-gray-500" />
                      <span>{staffMember.experience} years</span>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Skills</h4>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {staffMember.skills.map((skill, index) => (
                        <Badge key={index} variant="outline" className="bg-gray-100">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Certifications</h4>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {staffMember.certifications.map((cert, index) => (
                        <Badge key={index} variant="outline" className="bg-blue-50">
                          {cert}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Middle Column */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Work Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 mr-2 text-gray-500" />
                  <span>Daily Rate: ${staffMember.rate}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-gray-500" />
                  <span>Availability: {staffMember.availability}</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Camp Assignments</CardTitle>
              </CardHeader>
              <CardContent>
                {staffMember.camps.length > 0 ? (
                  <ul className="space-y-2">
                    {staffMember.camps.map((camp) => (
                      <li key={camp.id} className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                        <span>{camp.name}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 text-sm">No camps assigned yet</p>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Right Column */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Documents</CardTitle>
              </CardHeader>
              <CardContent>
                {staffMember.documents.length > 0 ? (
                  <ul className="space-y-3">
                    {staffMember.documents.map((doc) => (
                      <li key={doc.id} className="flex justify-between items-center">
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 mr-2 text-gray-500" />
                          <span>{doc.name}</span>
                        </div>
                        <Badge className={getStatusColor(doc.status)}>
                          {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 text-sm">No documents uploaded</p>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Upcoming Shifts</CardTitle>
              </CardHeader>
              <CardContent>
                {staffMember.assignedShifts.length > 0 ? (
                  <ul className="space-y-3">
                    {staffMember.assignedShifts.map((shift) => (
                      <li key={shift.id} className="space-y-1">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                          <span>{formatDate(shift.date)}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-500 ml-6">
                          <Clock className="h-3 w-3 mr-1" />
                          <span>{shift.startTime} - {shift.endTime}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 text-sm">No upcoming shifts</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
        
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onEdit}>
            Edit Staff Member
          </Button>
          <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)}>
            Delete Staff Member
          </Button>
        </div>
        
        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete {staffMember.name} from the system.
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
};

export default function StaffManagement() {
  const { toast } = useToast();
  
  // State for staff data - initialize with sample data immediately
  const [staffList, setStaffList] = useState<Clinician[]>(sampleStaffMembers as Clinician[]);
  
  // Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [campFilter, setCampFilter] = useState("all");
  
  // Dialog state
  const [selectedStaff, setSelectedStaff] = useState<Clinician | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<Clinician | null>(null);
  
  // Form state for adding/editing staff
  const [formData, setFormData] = useState<Partial<Clinician>>({
    name: "",
    role: "Clinician",
    email: "",
    phone: "",
    status: "active",
    experience: "",
    rate: 0,
    availability: "full-time",
    skills: [],
    certifications: [],
    camps: [],
    documents: [],
    assignedShifts: []
  });
  
  // Get filtered staff based on search term and filters
  const filteredStaff = staffList.filter(staff => {
    const matchesSearch = 
      staff.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      staff.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.role.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === "all" || staff.role.toLowerCase().includes(roleFilter.toLowerCase());
    const matchesStatus = statusFilter === "all" || staff.status.toLowerCase() === statusFilter.toLowerCase();
    
    const matchesCamp = campFilter === "all" || 
      staff.camps.some(camp => camp.id.toString() === campFilter);
    
    return matchesSearch && matchesRole && matchesStatus && matchesCamp;
  });
  
  // Extract unique roles for the filter dropdown
  const roles = Array.from(new Set(staffList.map(staff => staff.role)));
  
  // Get all camps from all staff for the filter dropdown
  const allCamps = staffList
    .flatMap(staff => staff.camps)
    .filter((camp, index, self) => 
      index === self.findIndex((c) => c.id === camp.id)
    );
  
  // Handle adding a new staff member
  const handleAddStaff = () => {
    if (!formData.name || !formData.email || !formData.phone) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    // Create a new unique ID
    const newId = Math.max(0, ...staffList.map(s => s.id)) + 1;
    
    // Create new staff member object with required fields
    const newStaff: Clinician = {
      id: newId,
      name: formData.name!,
      role: formData.role || "Clinician",
      email: formData.email!,
      phone: formData.phone!,
      status: formData.status || "active",
      experience: formData.experience || "0",
      rate: formData.rate || 0,
      rateType: "daily",
      availability: formData.availability || "full-time",
      skills: formData.skills || [],
      certifications: formData.certifications || [],
      camps: formData.camps || [],
      documents: formData.documents || [],
      assignedShifts: formData.assignedShifts || [],
      emergencyContact: {
        name: "",
        relationship: "",
        phone: ""
      }
    };
    
    // Update state with a completely new array
    const updatedStaffList = [...staffList, newStaff];
    setStaffList(updatedStaffList);
    
    // Reset form and close dialog
    setFormData({
      name: "",
      role: "Clinician",
      email: "",
      phone: "",
      status: "active",
      experience: "",
      rate: 0,
      availability: "full-time",
      skills: [],
      certifications: [],
      camps: [],
      documents: [],
      assignedShifts: []
    });
    
    setShowAddDialog(false);
    
    // Show success notification
    toast({
      title: "Staff member added",
      description: `${newStaff.name} has been added to the system.`,
      variant: "default",
    });
  };
  
  // Handle editing a staff member
  const handleEditStaff = () => {
    if (!selectedStaff) return;
    
    if (!formData.name || !formData.email || !formData.phone) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    // Create updated staff member
    const updatedStaff = {
      ...selectedStaff,
      ...formData
    };
    
    // Update state with a completely new array
    const updatedStaffList = staffList.map(staff => 
      staff.id === updatedStaff.id ? updatedStaff : staff
    );
    
    setStaffList(updatedStaffList);
    setShowEditDialog(false);
    
    // Show success notification
    toast({
      title: "Staff member updated",
      description: `${updatedStaff.name}'s information has been updated.`,
      variant: "default",
    });
  };
  
  // Handle deleting a staff member
  const handleDeleteStaff = (staff: Clinician) => {
    setStaffToDelete(staff);
    setShowDeleteDialog(true);
  };
  
  // Confirm staff deletion
  const confirmDeleteStaff = () => {
    if (!staffToDelete) return;
    
    // Update state with a completely new array
    const updatedStaffList = staffList.filter(staff => staff.id !== staffToDelete.id);
    setStaffList(updatedStaffList);
    
    // Show success notification
    toast({
      title: "Staff member deleted",
      description: `${staffToDelete.name} has been removed from the system.`,
      variant: "default",
    });
    
    setShowDeleteDialog(false);
    setStaffToDelete(null);
    setSelectedStaff(null);
  };
  
  // Handle editing a specific staff member
  const handleEditClick = (staff: Clinician) => {
    setSelectedStaff(staff);
    setFormData({
      name: staff.name,
      role: staff.role,
      email: staff.email,
      phone: staff.phone,
      status: staff.status,
      experience: staff.experience,
      rate: staff.rate,
      availability: staff.availability,
      skills: staff.skills,
      certifications: staff.certifications,
      camps: staff.camps,
      documents: staff.documents,
      assignedShifts: staff.assignedShifts
    });
    setShowEditDialog(true);
  };

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Staff Management</h1>
          <p className="text-gray-500 mt-1">Manage staff assignments, schedules, and documentation</p>
        </div>
        <div className="mt-4 md:mt-0 space-x-2">
          <Button variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Add Shift
          </Button>
          <Button 
            className="bg-brand-600 hover:bg-brand-700" 
            onClick={() => {
              setFormData({
                name: "",
                role: "Clinician",
                email: "",
                phone: "",
                status: "active",
                experience: "",
                rate: 0,
                availability: "full-time",
                skills: [],
                certifications: [],
                camps: [],
                documents: [],
                assignedShifts: []
              });
              setShowAddDialog(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Staff
          </Button>
        </div>
      </div>
      
      {/* Filters Row */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-grow md:max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search staff members..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {roles.map((role, index) => (
              <SelectItem key={index} value={role.toLowerCase()}>{role}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={campFilter} onValueChange={setCampFilter}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Filter by camp" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Camps</SelectItem>
            {allCamps.map((camp) => (
              <SelectItem key={camp.id} value={camp.id.toString()}>{camp.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Main Content with Tabs */}
      <Tabs defaultValue="staff" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="staff">Staff Directory</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>
        
        {/* Staff Directory Tab */}
        <TabsContent value="staff" className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Staff Members</CardTitle>
              <CardDescription>
                View and manage all camp staff
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-medium">Name</th>
                      <th className="text-left p-4 font-medium">Role</th>
                      <th className="text-left p-4 font-medium hidden md:table-cell">Contact</th>
                      <th className="text-left p-4 font-medium hidden md:table-cell">Camps</th>
                      <th className="text-left p-4 font-medium">Status</th>
                      <th className="text-right p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStaff.map((staff) => (
                      <tr key={staff.id} className="border-b hover:bg-gray-50">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={staff.avatar} />
                              <AvatarFallback>
                                {staff.name.split(' ').map((n) => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{staff.name}</div>
                              <div className="text-sm text-gray-500 md:hidden">{staff.role}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 hidden md:table-cell">{staff.role}</td>
                        <td className="p-4 hidden md:table-cell">
                          <div className="text-sm">{staff.email}</div>
                          <div className="text-sm">{staff.phone}</div>
                        </td>
                        <td className="p-4 hidden md:table-cell">
                          {staff.camps.map((camp, index) => (
                            <div key={camp.id} className="text-sm">
                              {index > 0 && ", "}
                              {camp.name}
                            </div>
                          ))}
                        </td>
                        <td className="p-4">
                          <Badge className={getStatusColor(staff.status)}>
                            {staff.status.charAt(0).toUpperCase() + staff.status.slice(1)}
                          </Badge>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => setSelectedStaff(staff)}
                            >
                              View
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditClick(staff)}>
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem>Send Message</DropdownMenuItem>
                                <DropdownMenuItem>Assign to Camp</DropdownMenuItem>
                                <DropdownMenuItem>Schedule Shift</DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-destructive flex items-center" 
                                  onClick={() => handleDeleteStaff(staff)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between bg-gray-50 p-3">
              <div className="text-sm text-gray-500">
                Showing {filteredStaff.length} of {staffList.length} staff members
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="hidden md:flex">
                  Export Staff List
                </Button>
                <Button 
                  size="sm" 
                  className="bg-brand-600 hover:bg-brand-700"
                  onClick={() => {
                    setFormData({
                      name: "",
                      role: "Clinician",
                      email: "",
                      phone: "",
                      status: "active",
                      experience: "",
                      rate: 0,
                      availability: "full-time",
                      skills: [],
                      certifications: [],
                      camps: [],
                      documents: [],
                      assignedShifts: []
                    });
                    setShowAddDialog(true);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Staff
                </Button>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Schedule Tab */}
        <TabsContent value="schedule" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Staff Schedule</CardTitle>
              <CardDescription>
                View and manage staff assignments and schedules
              </CardDescription>
            </CardHeader>
            <CardContent className="min-h-[300px] flex items-center justify-center">
              <div className="text-center">
                <p className="text-muted-foreground mb-4">The scheduling calendar will be available soon</p>
                <Button variant="outline">View Basic Schedule</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Document Management</CardTitle>
              <CardDescription>
                Track and manage staff documentation requirements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Documentation Status</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Contracts</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm">Sent</span>
                            <span className="text-sm font-medium">4/4</span>
                          </div>
                          <Progress value={100} className="h-2" />
                          <div className="flex justify-between">
                            <span className="text-sm">Signed</span>
                            <span className="text-sm font-medium">3/4</span>
                          </div>
                          <Progress value={75} className="h-2" />
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Background Checks</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm">Initiated</span>
                            <span className="text-sm font-medium">3/4</span>
                          </div>
                          <Progress value={75} className="h-2" />
                          <div className="flex justify-between">
                            <span className="text-sm">Completed</span>
                            <span className="text-sm font-medium">2/4</span>
                          </div>
                          <Progress value={50} className="h-2" />
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Tax Forms</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm">Requested</span>
                            <span className="text-sm font-medium">4/4</span>
                          </div>
                          <Progress value={100} className="h-2" />
                          <div className="flex justify-between">
                            <span className="text-sm">Received</span>
                            <span className="text-sm font-medium">3/4</span>
                          </div>
                          <Progress value={75} className="h-2" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* View Staff Dialog */}
      {selectedStaff && (
        <StaffMemberDetails 
          staffMember={selectedStaff}
          onClose={() => setSelectedStaff(null)}
          onEdit={() => {
            handleEditClick(selectedStaff);
            setSelectedStaff(null);
          }}
          onDelete={() => {
            handleDeleteStaff(selectedStaff);
            setSelectedStaff(null);
          }}
        />
      )}
      
      {/* Add Staff Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Staff Member</DialogTitle>
            <DialogDescription>
              Add a new staff member to the system
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div>
              <label className="text-sm font-medium">Full Name*</label>
              <Input 
                value={formData.name}
                className="mt-1"
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Role*</label>
                <Select 
                  value={formData.role}
                  onValueChange={(value) => setFormData({...formData, role: value})}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Clinician">Clinician</SelectItem>
                    <SelectItem value="Head Coach">Head Coach</SelectItem>
                    <SelectItem value="Assistant Coach">Assistant Coach</SelectItem>
                    <SelectItem value="Athletic Trainer">Athletic Trainer</SelectItem>
                    <SelectItem value="Strength & Conditioning">Strength & Conditioning</SelectItem>
                    <SelectItem value="Nutritionist">Nutritionist</SelectItem>
                    <SelectItem value="Team Manager">Team Manager</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium">Status*</label>
                <Select 
                  value={formData.status}
                  onValueChange={(value) => setFormData({...formData, status: value})}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Email*</label>
                <Input 
                  type="email"
                  value={formData.email}
                  className="mt-1"
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Phone*</label>
                <Input 
                  type="tel"
                  value={formData.phone}
                  className="mt-1"
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Experience (years)</label>
                <Input 
                  value={formData.experience}
                  className="mt-1"
                  onChange={(e) => setFormData({...formData, experience: e.target.value})}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Daily Rate ($)</label>
                <Input 
                  type="number"
                  value={formData.rate}
                  className="mt-1"
                  onChange={(e) => setFormData({...formData, rate: Number(e.target.value)})}
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium">Availability</label>
              <Select 
                value={formData.availability}
                onValueChange={(value) => setFormData({...formData, availability: value})}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select availability" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full-time">Full Time</SelectItem>
                  <SelectItem value="part-time">Part Time</SelectItem>
                  <SelectItem value="weekends">Weekends Only</SelectItem>
                  <SelectItem value="evenings">Evenings Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button
              className="bg-brand-600 hover:bg-brand-700"
              onClick={handleAddStaff}
              disabled={!formData.name || !formData.email || !formData.phone || !formData.role}
            >
              Add Staff Member
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Edit Staff Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Staff Member</DialogTitle>
            <DialogDescription>
              Update staff member information
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div>
              <label className="text-sm font-medium">Full Name*</label>
              <Input 
                value={formData.name}
                className="mt-1"
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Role*</label>
                <Select 
                  value={formData.role}
                  onValueChange={(value) => setFormData({...formData, role: value})}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Clinician">Clinician</SelectItem>
                    <SelectItem value="Head Coach">Head Coach</SelectItem>
                    <SelectItem value="Assistant Coach">Assistant Coach</SelectItem>
                    <SelectItem value="Athletic Trainer">Athletic Trainer</SelectItem>
                    <SelectItem value="Strength & Conditioning">Strength & Conditioning</SelectItem>
                    <SelectItem value="Nutritionist">Nutritionist</SelectItem>
                    <SelectItem value="Team Manager">Team Manager</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium">Status*</label>
                <Select 
                  value={formData.status}
                  onValueChange={(value) => setFormData({...formData, status: value})}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Email*</label>
                <Input 
                  type="email"
                  value={formData.email}
                  className="mt-1"
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Phone*</label>
                <Input 
                  type="tel"
                  value={formData.phone}
                  className="mt-1"
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Experience (years)</label>
                <Input 
                  value={formData.experience}
                  className="mt-1"
                  onChange={(e) => setFormData({...formData, experience: e.target.value})}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Daily Rate ($)</label>
                <Input 
                  type="number"
                  value={formData.rate}
                  className="mt-1"
                  onChange={(e) => setFormData({...formData, rate: Number(e.target.value)})}
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium">Availability</label>
              <Select 
                value={formData.availability}
                onValueChange={(value) => setFormData({...formData, availability: value})}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select availability" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full-time">Full Time</SelectItem>
                  <SelectItem value="part-time">Part Time</SelectItem>
                  <SelectItem value="weekends">Weekends Only</SelectItem>
                  <SelectItem value="evenings">Evenings Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button
              className="bg-brand-600 hover:bg-brand-700"
              onClick={handleEditStaff}
              disabled={!formData.name || !formData.email || !formData.phone || !formData.role}
            >
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {staffToDelete?.name} from the system.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowDeleteDialog(false);
              setStaffToDelete(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteStaff}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}