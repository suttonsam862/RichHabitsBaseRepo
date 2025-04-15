import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { PlusIcon, TrashIcon, Pencil1Icon, DotsVerticalIcon } from "@radix-ui/react-icons";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Staff member type definition
interface StaffMember {
  id: number;
  name: string;
  role: string;
  email?: string;
  phone?: string;
  specialization?: string;
  status: 'active' | 'inactive' | 'pending';
}

export default function StaffManagement() {
  const { toast } = useToast();
  
  // State for staff list
  const [staff, setStaff] = useState<StaffMember[]>([
    { id: 1, name: "John Smith", role: "Coach", email: "john@example.com", phone: "555-1234", specialization: "Basketball", status: 'active' },
    { id: 2, name: "Jane Doe", role: "Trainer", email: "jane@example.com", phone: "555-5678", specialization: "Swimming", status: 'active' },
    { id: 3, name: "Bob Johnson", role: "Manager", email: "bob@example.com", phone: "555-9012", specialization: "Administration", status: 'active' },
  ]);
  
  // State for new staff form
  const [isAddingStaff, setIsAddingStaff] = useState(false);
  const [newStaff, setNewStaff] = useState<Omit<StaffMember, 'id'>>({
    name: '',
    role: '',
    email: '',
    phone: '',
    specialization: '',
    status: 'active'
  });
  
  // State for edit staff
  const [isEditingStaff, setIsEditingStaff] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  
  // State for delete confirmation
  const [staffToDelete, setStaffToDelete] = useState<StaffMember | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  // Handle input change for new staff form
  const handleNewStaffChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewStaff(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle role change with select input
  const handleRoleChange = (value: string) => {
    setNewStaff(prev => ({ ...prev, role: value }));
  };
  
  // Handle status change with select input
  const handleStatusChange = (value: string) => {
    setNewStaff(prev => ({ ...prev, status: value as 'active' | 'inactive' | 'pending' }));
  };
  
  // Handle adding a new staff member
  const handleAddStaff = () => {
    if (!newStaff.name || !newStaff.role) {
      toast({
        title: "Missing information",
        description: "Name and role are required.",
        variant: "destructive"
      });
      return;
    }
    
    const newId = staff.length > 0 ? Math.max(...staff.map(s => s.id)) + 1 : 1;
    
    console.log("Adding new staff member", { id: newId, ...newStaff });
    
    setStaff(prevStaff => [
      ...prevStaff,
      { id: newId, ...newStaff }
    ]);
    
    // Reset form
    setNewStaff({
      name: '',
      role: '',
      email: '',
      phone: '',
      specialization: '',
      status: 'active'
    });
    
    setIsAddingStaff(false);
    
    toast({
      title: "Staff added",
      description: `${newStaff.name} has been added to the staff list.`
    });
  };
  
  // Handle editing a staff member
  const startEditing = (member: StaffMember) => {
    setEditingStaff(member);
    setIsEditingStaff(true);
  };
  
  // Handle edit input changes
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingStaff) return;
    
    const { name, value } = e.target;
    setEditingStaff(prev => prev ? { ...prev, [name]: value } : null);
  };
  
  // Handle edit role change
  const handleEditRoleChange = (value: string) => {
    setEditingStaff(prev => prev ? { ...prev, role: value } : null);
  };
  
  // Handle edit status change
  const handleEditStatusChange = (value: string) => {
    setEditingStaff(prev => prev ? { ...prev, status: value as 'active' | 'inactive' | 'pending' } : null);
  };
  
  // Save edited staff
  const saveStaffEdit = () => {
    if (!editingStaff) return;
    
    setStaff(prevStaff => 
      prevStaff.map(member => 
        member.id === editingStaff.id ? editingStaff : member
      )
    );
    
    setIsEditingStaff(false);
    setEditingStaff(null);
    
    toast({
      title: "Staff updated",
      description: `${editingStaff.name}'s information has been updated.`
    });
  };
  
  // Handle confirm delete
  const handleDeleteClick = (member: StaffMember) => {
    setStaffToDelete(member);
    setIsDeleteModalOpen(true);
  };
  
  // Delete staff member
  const confirmDelete = () => {
    if (!staffToDelete) return;
    
    const staffIdToDelete = staffToDelete.id;
    console.log(`Deleting staff with ID: ${staffIdToDelete}`);
    
    // Create a new array without the deleted staff
    const newStaffList = staff.filter(person => person.id !== staffIdToDelete);
    console.log(`Staff before deletion: ${staff.length}, Staff after deletion: ${newStaffList.length}`);
    
    // Update the state
    setStaff(newStaffList);
    
    // Close modal and reset
    setIsDeleteModalOpen(false);
    setStaffToDelete(null);
    
    toast({
      title: "Staff removed",
      description: `${staffToDelete.name} has been removed from the staff list.`
    });
  };
  
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Staff Management</h1>
        <Button onClick={() => setIsAddingStaff(true)}>
          <PlusIcon className="mr-2 h-4 w-4" />
          Add Staff
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Camp Staff</CardTitle>
          <CardDescription>Manage staff members for your camp event.</CardDescription>
        </CardHeader>
        <CardContent>
          {staff.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Specialization</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staff.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell>{member.role}</TableCell>
                    <TableCell>
                      {member.email && <div>{member.email}</div>}
                      {member.phone && <div className="text-gray-500 text-sm">{member.phone}</div>}
                    </TableCell>
                    <TableCell>{member.specialization || '-'}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        member.status === 'active' ? 'bg-green-100 text-green-800' :
                        member.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {member.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <DotsVerticalIcon className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => startEditing(member)}>
                            <Pencil1Icon className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => handleDeleteClick(member)}
                          >
                            <TrashIcon className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-10">
              <p className="text-gray-500 mb-4">No staff members added yet.</p>
              <Button onClick={() => setIsAddingStaff(true)}>Add Your First Staff Member</Button>
            </div>
          )}
        </CardContent>
      </Card>
      
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
                    value={newStaff.email}
                    onChange={handleNewStaffChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    placeholder="(555) 123-4567"
                    value={newStaff.phone}
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
                    value={newStaff.specialization}
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
      <Dialog open={isEditingStaff} onOpenChange={setIsEditingStaff}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Staff Member</DialogTitle>
            <DialogDescription>
              Update the details for this staff member.
            </DialogDescription>
          </DialogHeader>
          {editingStaff && (
            <ScrollArea className="max-h-[70vh]">
              <div className="space-y-4 py-2 px-1">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Name *</Label>
                    <Input
                      id="edit-name"
                      name="name"
                      value={editingStaff.name}
                      onChange={handleEditChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-role">Role *</Label>
                    <Select defaultValue={editingStaff.role} onValueChange={handleEditRoleChange}>
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
                      value={editingStaff.email || ''}
                      onChange={handleEditChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-phone">Phone</Label>
                    <Input
                      id="edit-phone"
                      name="phone"
                      value={editingStaff.phone || ''}
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
                      value={editingStaff.specialization || ''}
                      onChange={handleEditChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-status">Status</Label>
                    <Select defaultValue={editingStaff.status} onValueChange={handleEditStatusChange}>
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
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditingStaff(false)}>Cancel</Button>
            <Button onClick={saveStaffEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {staffToDelete?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete Staff Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}