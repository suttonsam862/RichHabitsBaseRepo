import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
  X
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

// Using sampleStaffMembers imported from constants

// Format date for display
const formatDate = (dateString: string) => {
  if (!dateString) return "";
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
};

// Get status badge color for staff status
const getStatusColor = (status: string) => {
  switch(status.toLowerCase()) {
    case 'active':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    case 'inactive':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  }
};

// Staff Member Details Component
const StaffMemberDetails = ({ staffMember, onClose, onEdit, onDelete }: { staffMember: any, onClose: () => void, onEdit: () => void, onDelete: () => void }) => {
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="sticky top-0 bg-white z-10 pb-3 pt-0">
          <DialogTitle>Staff Member Details</DialogTitle>
          <DialogDescription>
            Comprehensive profile information
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Information Column */}
          <div className="md:col-span-1">
            <div className="flex flex-col items-center mb-6">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarImage src={staffMember.avatar} />
                <AvatarFallback className="text-lg">
                  {staffMember.name.split(' ').map((n: string) => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-bold text-center">{staffMember.name}</h2>
              <p className="text-sm text-gray-500 mb-2">{staffMember.role}</p>
              <Badge className={getStatusColor(staffMember.status)}>
                {staffMember.status.charAt(0).toUpperCase() + staffMember.status.slice(1)}
              </Badge>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start gap-2">
                <Mail className="h-4 w-4 text-gray-400 mt-1" />
                <div>
                  <p className="font-medium text-sm">Email</p>
                  <p className="text-sm">{staffMember.email}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <Phone className="h-4 w-4 text-gray-400 mt-1" />
                <div>
                  <p className="font-medium text-sm">Phone</p>
                  <p className="text-sm">{staffMember.phone}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <Medal className="h-4 w-4 text-gray-400 mt-1" />
                <div>
                  <p className="font-medium text-sm">Experience</p>
                  <p className="text-sm">{staffMember.experience}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <Briefcase className="h-4 w-4 text-gray-400 mt-1" />
                <div>
                  <p className="font-medium text-sm">Availability</p>
                  <p className="text-sm capitalize">{staffMember.availability}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <DollarSign className="h-4 w-4 text-gray-400 mt-1" />
                <div>
                  <p className="font-medium text-sm">Compensation</p>
                  <p className="text-sm">${staffMember.rate} {staffMember.rateType}</p>
                </div>
              </div>
            </div>
            
            <Separator className="my-4" />
            
            <div>
              <h3 className="font-medium text-sm mb-2">Emergency Contact</h3>
              <div className="space-y-2">
                <p className="text-sm">{staffMember.emergencyContact.name}</p>
                <p className="text-sm text-gray-500">{staffMember.emergencyContact.relationship}</p>
                <p className="text-sm">{staffMember.emergencyContact.phone}</p>
              </div>
            </div>
          </div>
          
          {/* Details Column */}
          <div className="md:col-span-2 space-y-6">
            <div>
              <h3 className="font-medium mb-3">Skills & Certifications</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {staffMember.skills.map((skill: string, index: number) => (
                      <Badge key={index} variant="outline" className="bg-gray-50">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Certifications</h4>
                  <div className="flex flex-wrap gap-2">
                    {staffMember.certifications.map((cert: string, index: number) => (
                      <Badge key={index} variant="outline" className="bg-gray-50">
                        {cert}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium mb-3">Assigned Camps</h3>
              <div className="space-y-2">
                {staffMember.camps.length > 0 ? (
                  staffMember.camps.map((camp: any) => (
                    <div key={camp.id} className="flex items-center p-2 border rounded-md">
                      <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                      <span>{camp.name}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No camps assigned yet</p>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="font-medium mb-3">Scheduled Shifts</h3>
              {staffMember.assignedShifts.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2 text-sm font-medium">Date</th>
                        <th className="text-left p-2 text-sm font-medium">Time</th>
                        <th className="text-left p-2 text-sm font-medium">Camp</th>
                        <th className="text-left p-2 text-sm font-medium">Role</th>
                        <th className="text-left p-2 text-sm font-medium">Location</th>
                      </tr>
                    </thead>
                    <tbody>
                      {staffMember.assignedShifts.map((shift: any) => (
                        <tr key={shift.id} className="border-b hover:bg-gray-50">
                          <td className="p-2 text-sm">{formatDate(shift.date)}</td>
                          <td className="p-2 text-sm">{shift.startTime} - {shift.endTime}</td>
                          <td className="p-2 text-sm">{shift.campName}</td>
                          <td className="p-2 text-sm">{shift.role}</td>
                          <td className="p-2 text-sm">{shift.location}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No shifts scheduled yet</p>
              )}
            </div>
            
            <div>
              <h3 className="font-medium mb-3">Documents</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 text-sm font-medium">Document</th>
                      <th className="text-left p-2 text-sm font-medium">Status</th>
                      <th className="text-left p-2 text-sm font-medium">Date</th>
                      <th className="text-right p-2 text-sm font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffMember.documents.map((doc: any) => (
                      <tr key={doc.id} className="border-b hover:bg-gray-50">
                        <td className="p-2 text-sm">
                          <div className="flex items-center">
                            <FileText className="h-4 w-4 text-gray-400 mr-2" />
                            {doc.name}
                          </div>
                        </td>
                        <td className="p-2 text-sm">
                          <Badge className={getDocumentStatusColor(doc.status)}>
                            {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                          </Badge>
                        </td>
                        <td className="p-2 text-sm">{doc.date ? formatDate(doc.date) : "N/A"}</td>
                        <td className="p-2 text-sm text-right">
                          <Button variant="ghost" size="sm">View</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex justify-between gap-2">
          <Button 
            variant="outline" 
            className="text-destructive border-destructive/20 hover:bg-destructive/10"
            onClick={() => setIsDeleteConfirmOpen(true)}
          >
            Delete Staff
          </Button>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Close</Button>
            <Button variant="outline">Send Message</Button>
            <Button 
              className="bg-brand-600 hover:bg-brand-700"
              onClick={onEdit}
            >
              Edit Profile
            </Button>
          </div>
        </div>
      </DialogContent>
      
      {/* Delete Confirmation Dialog */}
      {isDeleteConfirmOpen && (
        <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete {staffMember.name}'s 
                record and remove all associated data from the system.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => {
                  setIsDeleteConfirmOpen(false);
                  onDelete();
                }}
              >
                Delete Staff
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </Dialog>
  );
};

// Define the Clinician interface
interface Clinician {
  id: number;
  name: string;
  role: string;
  email: string;
  phone: string;
  avatar: string;
  status: string;
  experience: string;
  skills: string[];
  certifications: string[];
  rate: number;
  rateType: string;
  availability: string;
  camps: Array<{id: number, name: string}>;
  assignedShifts: any[];
  documents: any[];
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
}

export default function StaffManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [campFilter, setCampFilter] = useState("all");
  const [selectedStaffMember, setSelectedStaffMember] = useState<any | null>(null);
  const [isAddClinicianOpen, setIsAddClinicianOpen] = useState(false);
  const [newClinician, setNewClinician] = useState<Partial<Clinician>>({
    name: "",
    role: "Clinician",
    email: "",
    phone: "",
    avatar: "",
    status: "pending",
    experience: "",
    skills: [],
    certifications: [],
    rate: 0,
    rateType: "daily",
    availability: "part-time",
    camps: [],
    assignedShifts: [],
    documents: [],
    emergencyContact: {
      name: "",
      relationship: "",
      phone: ""
    }
  });
  
  // In a real app, you would fetch staff from the server
  const { data: staffMembers = sampleStaffMembers as Clinician[], isLoading } = useQuery<Clinician[]>({
    queryKey: ['/api/camp-staff'],
    enabled: false, // Disabled for now as we're using sample data
  });
  
  // Filter staff based on search and filters
  const filteredStaff = staffMembers.filter((staff: Clinician) => {
    // Apply search term
    const matchesSearch = 
      staff.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      staff.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.role.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Apply role filter
    const matchesRole = roleFilter === "all" || staff.role.toLowerCase().includes(roleFilter.toLowerCase());
    
    // Apply status filter
    const matchesStatus = statusFilter === "all" || staff.status.toLowerCase() === statusFilter.toLowerCase();
    
    // Apply camp filter
    const matchesCamp = campFilter === "all" || staff.camps.some((camp) => camp.id.toString() === campFilter);
    
    return matchesSearch && matchesRole && matchesStatus && matchesCamp;
  });
  
  // Get unique roles for filter
  const roles = Array.from(new Set(staffMembers.map((staff: Clinician) => staff.role)));
  
  // Get unique camps for filter
  const camps = Array.from(
    new Set(
      staffMembers.flatMap((staff: Clinician) => staff.camps)
        .map((camp) => JSON.stringify(camp))
    )
  ).map((campString: string) => JSON.parse(campString));
  
  // Remove duplicates by id
  const uniqueCamps = Array.from(new Map(camps.map((camp: any) => [camp.id, camp])).values());

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
          <Button className="bg-brand-600 hover:bg-brand-700" onClick={() => setIsAddClinicianOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Clinician
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
            {uniqueCamps.map((camp: any) => (
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
                    {filteredStaff.map((staff: Clinician) => (
                      <tr key={staff.id} className="border-b hover:bg-gray-50">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={staff.avatar} />
                              <AvatarFallback>
                                {staff.name.split(' ').map((n: string) => n[0]).join('')}
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
                          {staff.camps.map((camp: any, index: number) => (
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
                            <Button variant="ghost" size="sm" onClick={() => setSelectedStaffMember(staff)}>
                              View
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>Edit</DropdownMenuItem>
                                <DropdownMenuItem>Send Message</DropdownMenuItem>
                                <DropdownMenuItem>Assign to Camp</DropdownMenuItem>
                                <DropdownMenuItem>Schedule Shift</DropdownMenuItem>
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
                Showing {filteredStaff.length} of {staffMembers.length} staff members
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="hidden md:flex">
                  Export Staff List
                </Button>
                <Button 
                  size="sm" 
                  className="bg-brand-600 hover:bg-brand-700"
                  onClick={() => setIsAddClinicianOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Clinician
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
                
                <div>
                  <h3 className="text-lg font-medium mb-4">Document Checklist</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3 font-medium">Staff Member</th>
                          <th className="text-left p-3 font-medium">Contract</th>
                          <th className="text-left p-3 font-medium">Background Check</th>
                          <th className="text-left p-3 font-medium">W-9 Form</th>
                          <th className="text-right p-3 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {staffMembers.map((staff: Clinician) => {
                          // Find document statuses
                          const contract = staff.documents.find((d: any) => d.name === "Contract");
                          const bgCheck = staff.documents.find((d: any) => d.name === "Background Check");
                          const taxForm = staff.documents.find((d: any) => d.name === "W-9 Form");
                          
                          return (
                            <tr key={staff.id} className="border-b hover:bg-gray-50">
                              <td className="p-3">
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={staff.avatar} />
                                    <AvatarFallback>
                                      {staff.name.split(' ').map((n: string) => n[0]).join('')}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="font-medium">{staff.name}</div>
                                </div>
                              </td>
                              <td className="p-3">
                                <Badge className={getStatusColor(contract?.status || 'not started')}>
                                  {contract?.status.charAt(0).toUpperCase() + contract?.status.slice(1) || "Not Started"}
                                </Badge>
                              </td>
                              <td className="p-3">
                                <Badge className={getStatusColor(bgCheck?.status || 'not started')}>
                                  {bgCheck?.status.charAt(0).toUpperCase() + bgCheck?.status.slice(1) || "Not Started"}
                                </Badge>
                              </td>
                              <td className="p-3">
                                <Badge className={getStatusColor(taxForm?.status || 'not started')}>
                                  {taxForm?.status.charAt(0).toUpperCase() + taxForm?.status.slice(1) || "Not Started"}
                                </Badge>
                              </td>
                              <td className="p-3 text-right">
                                <Button variant="ghost" size="sm">Manage</Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Staff Member Details Dialog */}
      {selectedStaffMember && (
        <StaffMemberDetails 
          staffMember={selectedStaffMember} 
          onClose={() => setSelectedStaffMember(null)} 
        />
      )}
      
      {/* Add Clinician Dialog */}
      <Dialog open={isAddClinicianOpen} onOpenChange={(open) => {
        if (!open) setIsAddClinicianOpen(false);
      }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Add New Clinician</DialogTitle>
            <DialogDescription>
              Add a new clinician to the system for camp assignments
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Full Name</label>
                <Input 
                  value={newClinician.name}
                  className="mt-1"
                  onChange={(e) => {
                    setNewClinician({
                      ...newClinician,
                      name: e.target.value
                    });
                  }}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Role</label>
                <Select 
                  defaultValue={newClinician.role} 
                  onValueChange={(value) => {
                    setNewClinician({
                      ...newClinician,
                      role: value
                    });
                  }}
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
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input 
                  type="email"
                  value={newClinician.email}
                  className="mt-1"
                  onChange={(e) => {
                    setNewClinician({
                      ...newClinician,
                      email: e.target.value
                    });
                  }}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Phone</label>
                <Input 
                  type="tel"
                  value={newClinician.phone}
                  className="mt-1"
                  onChange={(e) => {
                    setNewClinician({
                      ...newClinician,
                      phone: e.target.value
                    });
                  }}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Daily Rate ($)</label>
                <Input 
                  type="number"
                  value={newClinician.rate}
                  className="mt-1"
                  onChange={(e) => {
                    setNewClinician({
                      ...newClinician,
                      rate: Number(e.target.value)
                    });
                  }}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Availability</label>
                <Select 
                  defaultValue={newClinician.availability} 
                  onValueChange={(value) => {
                    setNewClinician({
                      ...newClinician,
                      availability: value
                    });
                  }}
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
            
            <div>
              <label className="text-sm font-medium">Experience (years)</label>
              <Input 
                value={newClinician.experience}
                className="mt-1"
                onChange={(e) => {
                  setNewClinician({
                    ...newClinician,
                    experience: e.target.value
                  });
                }}
              />
            </div>
            
            <div className="mt-4 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsAddClinicianOpen(false)}>
                Cancel
              </Button>
              <Button 
                className="bg-brand-600 hover:bg-brand-700"
                onClick={() => {
                  // In a real app, you would submit to the server
                  // For now, we'll just close the dialog
                  setIsAddClinicianOpen(false);
                  // Toast notification
                  alert("Clinician added successfully!");
                }}
              >
                Add Clinician
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}