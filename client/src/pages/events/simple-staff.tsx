import React, { useState } from "react";
import { sampleStaffMembers } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MoreHorizontal, Plus, Search, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

// Helper function for status colors
const getStatusColor = (status: string) => {
  switch(status?.toLowerCase()) {
    case 'active': return 'bg-green-100 text-green-800';
    case 'pending': return 'bg-yellow-100 text-yellow-800';
    case 'inactive': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export default function StaffManagement() {
  const { toast } = useToast();
  
  // Basic state management
  const [staff, setStaff] = useState([...sampleStaffMembers]);
  const [staffToDelete, setStaffToDelete] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Filter staff based on search
  const filteredStaff = staff.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.role.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Simple delete function
  const handleDelete = (id: number, name: string) => {
    const newStaff = staff.filter(s => s.id !== id);
    setStaff(newStaff);
    toast({
      title: "Staff member deleted",
      description: `${name} has been removed from the system.`,
    });
    setShowDeleteConfirm(false);
    setStaffToDelete(null);
  };

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Staff Management</h1>
          <p className="text-gray-500 mt-1">Manage staff assignments and documentation</p>
        </div>
        <Button className="mt-4 md:mt-0 bg-brand-600 hover:bg-brand-700">
          <Plus className="mr-2 h-4 w-4" />
          Add Staff
        </Button>
      </div>
      
      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
        <Input
          placeholder="Search staff members..."
          className="pl-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Main Content */}
      <Tabs defaultValue="staff" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="staff">Staff Directory</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>
        
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
                      <th className="text-left p-4 font-medium">Status</th>
                      <th className="text-right p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStaff.map((s) => (
                      <tr key={s.id} className="border-b hover:bg-gray-50">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={s.avatar} />
                              <AvatarFallback>
                                {s.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{s.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">{s.role}</td>
                        <td className="p-4 hidden md:table-cell">
                          {s.email}
                        </td>
                        <td className="p-4">
                          <Badge className={getStatusColor(s.status)}>
                            {s.status.charAt(0).toUpperCase() + s.status.slice(1)}
                          </Badge>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm">
                              View
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive flex items-center"
                                  onClick={() => {
                                    setStaffToDelete(s);
                                    setShowDeleteConfirm(true);
                                  }}
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
                    
                    {filteredStaff.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center py-4">
                          No staff members found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between bg-gray-50 p-3">
              <div className="text-sm text-gray-500">
                Showing {filteredStaff.length} of {staff.length} staff members
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="destructive" onClick={() => {
                  setStaff([...sampleStaffMembers]);
                  toast({
                    title: "Staff list reset",
                    description: "The staff list has been restored to its original state.",
                  });
                }}>
                  Reset List
                </Button>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
        
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
        
        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Document Management</CardTitle>
              <CardDescription>
                Track and manage staff documentation requirements
              </CardDescription>
            </CardHeader>
            <CardContent className="min-h-[300px] flex items-center justify-center">
              <div className="text-center">
                <p className="text-muted-foreground mb-4">Document management features will be available soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
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
              setShowDeleteConfirm(false);
              setStaffToDelete(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => staffToDelete && handleDelete(staffToDelete.id, staffToDelete.name)}
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