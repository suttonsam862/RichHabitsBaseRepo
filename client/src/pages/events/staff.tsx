import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { PlusIcon, TrashIcon, Pencil1Icon, DotsVerticalIcon, PlusCircledIcon, Cross2Icon, CalendarIcon, PersonIcon, DotFilledIcon, HomeIcon, MixerHorizontalIcon } from "@radix-ui/react-icons";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

// Staff member type definition
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
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Edit Staff Member</DialogTitle>
            <DialogDescription>
              Update the details for this staff member.
            </DialogDescription>
          </DialogHeader>
          {editingStaff && (
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid grid-cols-5 w-full mb-4">
                <TabsTrigger value="basic"><PersonIcon className="mr-2 h-4 w-4" />Basic Info</TabsTrigger>
                <TabsTrigger value="financial"><DotFilledIcon className="mr-2 h-4 w-4" />Financial</TabsTrigger>
                <TabsTrigger value="schedule"><CalendarIcon className="mr-2 h-4 w-4" />Schedule</TabsTrigger>
                <TabsTrigger value="contact"><HomeIcon className="mr-2 h-4 w-4" />Contact</TabsTrigger>
                <TabsTrigger value="travel"><MixerHorizontalIcon className="mr-2 h-4 w-4" />Travel</TabsTrigger>
              </TabsList>
              
              {/* Basic Info Tab */}
              <TabsContent value="basic">
                <ScrollArea className="max-h-[60vh]">
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
                    <div className="space-y-2">
                      <Label htmlFor="edit-notes">Notes</Label>
                      <Textarea
                        id="edit-notes"
                        name="notes"
                        placeholder="Additional notes about this staff member"
                        value={editingStaff.notes || ''}
                        onChange={(e) => setEditingStaff({...editingStaff, notes: e.target.value})}
                        className="min-h-[100px]"
                      />
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>
              
              {/* Financial Tab */}
              <TabsContent value="financial">
                <ScrollArea className="max-h-[60vh]">
                  <div className="space-y-4 py-2 px-1">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-payRate">Pay Rate</Label>
                        <Input
                          id="edit-payRate"
                          name="payRate"
                          type="number"
                          step="0.01"
                          value={editingStaff.payRate || ''}
                          onChange={(e) => setEditingStaff({...editingStaff, payRate: parseFloat(e.target.value) || undefined})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-payType">Pay Type</Label>
                        <Select value={editingStaff.payType || ''} onValueChange={(value) => setEditingStaff({...editingStaff, payType: value as any})}>
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
                    
                    <div className="space-y-2">
                      <Label>Total Paid</Label>
                      <div className="text-2xl font-bold">${editingStaff.totalPaid?.toFixed(2) || '0.00'}</div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center mb-2">
                        <Label>Invoices</Label>
                        <Button variant="outline" size="sm" onClick={() => {
                          const newInvoice = {
                            id: Date.now(),
                            date: new Date().toISOString().split('T')[0],
                            amount: 0,
                            status: 'pending'
                          };
                          setEditingStaff({
                            ...editingStaff, 
                            invoices: [...(editingStaff.invoices || []), newInvoice]
                          });
                        }}>
                          <PlusCircledIcon className="h-4 w-4 mr-1" /> Add Invoice
                        </Button>
                      </div>
                      {editingStaff.invoices && editingStaff.invoices.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Amount</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {editingStaff.invoices.map((invoice, index) => (
                              <TableRow key={invoice.id}>
                                <TableCell>
                                  <Input 
                                    type="date" 
                                    value={invoice.date} 
                                    onChange={(e) => {
                                      const updated = [...(editingStaff.invoices || [])];
                                      updated[index] = {...invoice, date: e.target.value};
                                      setEditingStaff({...editingStaff, invoices: updated});
                                    }}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input 
                                    type="number" 
                                    step="0.01"
                                    value={invoice.amount} 
                                    onChange={(e) => {
                                      const updated = [...(editingStaff.invoices || [])];
                                      updated[index] = {...invoice, amount: parseFloat(e.target.value) || 0};
                                      setEditingStaff({...editingStaff, invoices: updated});
                                    }}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Select value={invoice.status} onValueChange={(value) => {
                                    const updated = [...(editingStaff.invoices || [])];
                                    updated[index] = {...invoice, status: value};
                                    setEditingStaff({...editingStaff, invoices: updated});
                                  }}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="pending">Pending</SelectItem>
                                      <SelectItem value="paid">Paid</SelectItem>
                                      <SelectItem value="voided">Voided</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                                <TableCell>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => {
                                      const updated = (editingStaff.invoices || []).filter(i => i.id !== invoice.id);
                                      setEditingStaff({...editingStaff, invoices: updated});
                                    }}
                                  >
                                    <Cross2Icon className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <div className="text-center py-4 text-gray-500">No invoices added yet</div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center mb-2">
                        <Label>Expenses</Label>
                        <Button variant="outline" size="sm" onClick={() => {
                          const newExpense = {
                            id: Date.now(),
                            date: new Date().toISOString().split('T')[0],
                            category: 'travel',
                            amount: 0,
                            status: 'pending'
                          };
                          setEditingStaff({
                            ...editingStaff, 
                            expenses: [...(editingStaff.expenses || []), newExpense]
                          });
                        }}>
                          <PlusCircledIcon className="h-4 w-4 mr-1" /> Add Expense
                        </Button>
                      </div>
                      {editingStaff.expenses && editingStaff.expenses.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Category</TableHead>
                              <TableHead>Amount</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {editingStaff.expenses.map((expense, index) => (
                              <TableRow key={expense.id}>
                                <TableCell>
                                  <Input 
                                    type="date" 
                                    value={expense.date} 
                                    onChange={(e) => {
                                      const updated = [...(editingStaff.expenses || [])];
                                      updated[index] = {...expense, date: e.target.value};
                                      setEditingStaff({...editingStaff, expenses: updated});
                                    }}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Select value={expense.category} onValueChange={(value) => {
                                    const updated = [...(editingStaff.expenses || [])];
                                    updated[index] = {...expense, category: value};
                                    setEditingStaff({...editingStaff, expenses: updated});
                                  }}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="travel">Travel</SelectItem>
                                      <SelectItem value="meals">Meals</SelectItem>
                                      <SelectItem value="supplies">Supplies</SelectItem>
                                      <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                                <TableCell>
                                  <Input 
                                    type="number" 
                                    step="0.01"
                                    value={expense.amount} 
                                    onChange={(e) => {
                                      const updated = [...(editingStaff.expenses || [])];
                                      updated[index] = {...expense, amount: parseFloat(e.target.value) || 0};
                                      setEditingStaff({...editingStaff, expenses: updated});
                                    }}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Select value={expense.status} onValueChange={(value) => {
                                    const updated = [...(editingStaff.expenses || [])];
                                    updated[index] = {...expense, status: value};
                                    setEditingStaff({...editingStaff, expenses: updated});
                                  }}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="pending">Pending</SelectItem>
                                      <SelectItem value="approved">Approved</SelectItem>
                                      <SelectItem value="reimbursed">Reimbursed</SelectItem>
                                      <SelectItem value="denied">Denied</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                                <TableCell>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => {
                                      const updated = (editingStaff.expenses || []).filter(e => e.id !== expense.id);
                                      setEditingStaff({...editingStaff, expenses: updated});
                                    }}
                                  >
                                    <Cross2Icon className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <div className="text-center py-4 text-gray-500">No expenses added yet</div>
                      )}
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>
              
              {/* Schedule Tab */}
              <TabsContent value="schedule">
                <ScrollArea className="max-h-[60vh]">
                  <div className="space-y-4 py-2 px-1">
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center mb-2">
                          <Label>Camp Assignments</Label>
                          <Button variant="outline" size="sm" onClick={() => {
                            const newAssignment = {
                              campId: Date.now(),
                              campName: ''
                            };
                            setEditingStaff({
                              ...editingStaff, 
                              campAssignments: [...(editingStaff.campAssignments || []), newAssignment]
                            });
                          }}>
                            <PlusCircledIcon className="h-4 w-4 mr-1" /> Add Assignment
                          </Button>
                        </div>
                        {editingStaff.campAssignments && editingStaff.campAssignments.length > 0 ? (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Camp ID</TableHead>
                                <TableHead>Camp Name</TableHead>
                                <TableHead></TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {editingStaff.campAssignments.map((assignment, index) => (
                                <TableRow key={assignment.campId}>
                                  <TableCell>
                                    <Input 
                                      value={assignment.campId} 
                                      onChange={(e) => {
                                        const updated = [...(editingStaff.campAssignments || [])];
                                        updated[index] = {...assignment, campId: parseInt(e.target.value) || 0};
                                        setEditingStaff({...editingStaff, campAssignments: updated});
                                      }}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Input 
                                      value={assignment.campName} 
                                      onChange={(e) => {
                                        const updated = [...(editingStaff.campAssignments || [])];
                                        updated[index] = {...assignment, campName: e.target.value};
                                        setEditingStaff({...editingStaff, campAssignments: updated});
                                      }}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => {
                                        const updated = (editingStaff.campAssignments || []).filter(c => c.campId !== assignment.campId);
                                        setEditingStaff({...editingStaff, campAssignments: updated});
                                      }}
                                    >
                                      <Cross2Icon className="h-4 w-4" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        ) : (
                          <div className="text-center py-4 text-gray-500">No camp assignments added yet</div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Available Dates</Label>
                      <div className="flex flex-wrap gap-2">
                        {editingStaff.availableDates?.map((date, index) => (
                          <Badge key={index} variant="outline" className="py-2 flex items-center gap-1">
                            {date}
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-4 w-4 p-0 ml-1" 
                              onClick={() => {
                                const updated = (editingStaff.availableDates || []).filter((_, i) => i !== index);
                                setEditingStaff({...editingStaff, availableDates: updated});
                              }}
                            >
                              <Cross2Icon className="h-3 w-3" />
                            </Button>
                          </Badge>
                        ))}
                        <div className="flex gap-2">
                          <Input 
                            type="date"
                            id="newAvailableDate"
                            className="max-w-[200px]"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const input = document.getElementById('newAvailableDate') as HTMLInputElement;
                              if (input.value) {
                                setEditingStaff({
                                  ...editingStaff,
                                  availableDates: [...(editingStaff.availableDates || []), input.value]
                                });
                                input.value = '';
                              }
                            }}
                          >
                            Add Date
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Assigned Work Dates</Label>
                      <div className="flex flex-wrap gap-2">
                        {editingStaff.assignedDates?.map((date, index) => (
                          <Badge key={index} className="py-2 flex items-center gap-1">
                            {date}
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-4 w-4 p-0 ml-1" 
                              onClick={() => {
                                const updated = (editingStaff.assignedDates || []).filter((_, i) => i !== index);
                                setEditingStaff({...editingStaff, assignedDates: updated});
                              }}
                            >
                              <Cross2Icon className="h-3 w-3" />
                            </Button>
                          </Badge>
                        ))}
                        <div className="flex gap-2">
                          <Input 
                            type="date"
                            id="newAssignedDate"
                            className="max-w-[200px]"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const input = document.getElementById('newAssignedDate') as HTMLInputElement;
                              if (input.value) {
                                setEditingStaff({
                                  ...editingStaff,
                                  assignedDates: [...(editingStaff.assignedDates || []), input.value]
                                });
                                input.value = '';
                              }
                            }}
                          >
                            Add Date
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>
              
              {/* Contact Tab */}
              <TabsContent value="contact">
                <ScrollArea className="max-h-[60vh]">
                  <div className="space-y-4 py-2 px-1">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-address">Address</Label>
                        <Input
                          id="edit-address"
                          name="address"
                          value={editingStaff.address || ''}
                          onChange={(e) => setEditingStaff({...editingStaff, address: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-city">City</Label>
                        <Input
                          id="edit-city"
                          name="city"
                          value={editingStaff.city || ''}
                          onChange={(e) => setEditingStaff({...editingStaff, city: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-state">State</Label>
                        <Input
                          id="edit-state"
                          name="state"
                          value={editingStaff.state || ''}
                          onChange={(e) => setEditingStaff({...editingStaff, state: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-zipCode">Zip Code</Label>
                        <Input
                          id="edit-zipCode"
                          name="zipCode"
                          value={editingStaff.zipCode || ''}
                          onChange={(e) => setEditingStaff({...editingStaff, zipCode: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-emergencyContact">Emergency Contact</Label>
                        <Input
                          id="edit-emergencyContact"
                          name="emergencyContact"
                          value={editingStaff.emergencyContact || ''}
                          onChange={(e) => setEditingStaff({...editingStaff, emergencyContact: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-emergencyPhone">Emergency Phone</Label>
                        <Input
                          id="edit-emergencyPhone"
                          name="emergencyPhone"
                          value={editingStaff.emergencyPhone || ''}
                          onChange={(e) => setEditingStaff({...editingStaff, emergencyPhone: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Certifications</Label>
                      <div className="flex flex-wrap gap-2">
                        {editingStaff.certifications?.map((cert, index) => (
                          <Badge key={index} variant="secondary" className="py-2 flex items-center gap-1">
                            {cert}
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-4 w-4 p-0 ml-1" 
                              onClick={() => {
                                const updated = (editingStaff.certifications || []).filter((_, i) => i !== index);
                                setEditingStaff({...editingStaff, certifications: updated});
                              }}
                            >
                              <Cross2Icon className="h-3 w-3" />
                            </Button>
                          </Badge>
                        ))}
                        <div className="flex gap-2">
                          <Input 
                            id="newCertification"
                            placeholder="Add certification"
                            className="max-w-[200px]"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const input = document.getElementById('newCertification') as HTMLInputElement;
                              if (input.value) {
                                setEditingStaff({
                                  ...editingStaff,
                                  certifications: [...(editingStaff.certifications || []), input.value]
                                });
                                input.value = '';
                              }
                            }}
                          >
                            Add
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>
              
              {/* Travel Tab */}
              <TabsContent value="travel">
                <ScrollArea className="max-h-[60vh]">
                  <div className="space-y-4 py-2 px-1">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center mb-2">
                        <Label>Travel Plans</Label>
                        <Button variant="outline" size="sm" onClick={() => {
                          const newTravelPlan = {
                            id: Date.now(),
                            type: 'flight' as const,
                            departureDate: '',
                            departureLocation: '',
                            arrivalDate: '',
                            arrivalLocation: '',
                            confirmationCode: ''
                          };
                          setEditingStaff({
                            ...editingStaff, 
                            travelPlans: [...(editingStaff.travelPlans || []), newTravelPlan]
                          });
                        }}>
                          <PlusCircledIcon className="h-4 w-4 mr-1" /> Add Travel Plan
                        </Button>
                      </div>
                      {editingStaff.travelPlans && editingStaff.travelPlans.length > 0 ? (
                        <div className="space-y-4">
                          {editingStaff.travelPlans.map((plan, index) => (
                            <Card key={plan.id}>
                              <CardHeader className="py-2 px-4">
                                <div className="flex justify-between items-center">
                                  <Badge variant="outline">{plan.type.toUpperCase()}</Badge>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => {
                                      const updated = (editingStaff.travelPlans || []).filter(p => p.id !== plan.id);
                                      setEditingStaff({...editingStaff, travelPlans: updated});
                                    }}
                                  >
                                    <Cross2Icon className="h-4 w-4" />
                                  </Button>
                                </div>
                              </CardHeader>
                              <CardContent className="py-2">
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label>Travel Type</Label>
                                    <Select 
                                      value={plan.type} 
                                      onValueChange={(value) => {
                                        const updated = [...(editingStaff.travelPlans || [])];
                                        updated[index] = {...plan, type: value as any};
                                        setEditingStaff({...editingStaff, travelPlans: updated});
                                      }}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="flight">Flight</SelectItem>
                                        <SelectItem value="train">Train</SelectItem>
                                        <SelectItem value="bus">Bus</SelectItem>
                                        <SelectItem value="car">Car</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Confirmation Code</Label>
                                    <Input
                                      value={plan.confirmationCode || ''}
                                      onChange={(e) => {
                                        const updated = [...(editingStaff.travelPlans || [])];
                                        updated[index] = {...plan, confirmationCode: e.target.value};
                                        setEditingStaff({...editingStaff, travelPlans: updated});
                                      }}
                                    />
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 mt-4">
                                  <div className="space-y-2">
                                    <Label>Departure Date</Label>
                                    <Input
                                      type="date"
                                      value={plan.departureDate || ''}
                                      onChange={(e) => {
                                        const updated = [...(editingStaff.travelPlans || [])];
                                        updated[index] = {...plan, departureDate: e.target.value};
                                        setEditingStaff({...editingStaff, travelPlans: updated});
                                      }}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Arrival Date</Label>
                                    <Input
                                      type="date"
                                      value={plan.arrivalDate || ''}
                                      onChange={(e) => {
                                        const updated = [...(editingStaff.travelPlans || [])];
                                        updated[index] = {...plan, arrivalDate: e.target.value};
                                        setEditingStaff({...editingStaff, travelPlans: updated});
                                      }}
                                    />
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 mt-4">
                                  <div className="space-y-2">
                                    <Label>Departure Location</Label>
                                    <Input
                                      value={plan.departureLocation || ''}
                                      onChange={(e) => {
                                        const updated = [...(editingStaff.travelPlans || [])];
                                        updated[index] = {...plan, departureLocation: e.target.value};
                                        setEditingStaff({...editingStaff, travelPlans: updated});
                                      }}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Arrival Location</Label>
                                    <Input
                                      value={plan.arrivalLocation || ''}
                                      onChange={(e) => {
                                        const updated = [...(editingStaff.travelPlans || [])];
                                        updated[index] = {...plan, arrivalLocation: e.target.value};
                                        setEditingStaff({...editingStaff, travelPlans: updated});
                                      }}
                                    />
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-gray-500">No travel plans added yet</div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center mb-2">
                        <Label>Accommodations</Label>
                        <Button variant="outline" size="sm" onClick={() => {
                          const newAccommodation = {
                            id: Date.now(),
                            type: 'hotel' as const,
                            location: '',
                            checkIn: '',
                            checkOut: '',
                            confirmationCode: '',
                            roomNumber: ''
                          };
                          setEditingStaff({
                            ...editingStaff, 
                            accommodations: [...(editingStaff.accommodations || []), newAccommodation]
                          });
                        }}>
                          <PlusCircledIcon className="h-4 w-4 mr-1" /> Add Accommodation
                        </Button>
                      </div>
                      {editingStaff.accommodations && editingStaff.accommodations.length > 0 ? (
                        <div className="space-y-4">
                          {editingStaff.accommodations.map((accommodation, index) => (
                            <Card key={accommodation.id}>
                              <CardHeader className="py-2 px-4">
                                <div className="flex justify-between items-center">
                                  <Badge variant="outline">{accommodation.type.toUpperCase()}</Badge>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => {
                                      const updated = (editingStaff.accommodations || []).filter(a => a.id !== accommodation.id);
                                      setEditingStaff({...editingStaff, accommodations: updated});
                                    }}
                                  >
                                    <Cross2Icon className="h-4 w-4" />
                                  </Button>
                                </div>
                              </CardHeader>
                              <CardContent className="py-2">
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label>Accommodation Type</Label>
                                    <Select 
                                      value={accommodation.type} 
                                      onValueChange={(value) => {
                                        const updated = [...(editingStaff.accommodations || [])];
                                        updated[index] = {...accommodation, type: value as any};
                                        setEditingStaff({...editingStaff, accommodations: updated});
                                      }}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="hotel">Hotel</SelectItem>
                                        <SelectItem value="cabin">Cabin</SelectItem>
                                        <SelectItem value="dorm">Dorm</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Location</Label>
                                    <Input
                                      value={accommodation.location || ''}
                                      onChange={(e) => {
                                        const updated = [...(editingStaff.accommodations || [])];
                                        updated[index] = {...accommodation, location: e.target.value};
                                        setEditingStaff({...editingStaff, accommodations: updated});
                                      }}
                                    />
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 mt-4">
                                  <div className="space-y-2">
                                    <Label>Check-in Date</Label>
                                    <Input
                                      type="date"
                                      value={accommodation.checkIn || ''}
                                      onChange={(e) => {
                                        const updated = [...(editingStaff.accommodations || [])];
                                        updated[index] = {...accommodation, checkIn: e.target.value};
                                        setEditingStaff({...editingStaff, accommodations: updated});
                                      }}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Check-out Date</Label>
                                    <Input
                                      type="date"
                                      value={accommodation.checkOut || ''}
                                      onChange={(e) => {
                                        const updated = [...(editingStaff.accommodations || [])];
                                        updated[index] = {...accommodation, checkOut: e.target.value};
                                        setEditingStaff({...editingStaff, accommodations: updated});
                                      }}
                                    />
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 mt-4">
                                  <div className="space-y-2">
                                    <Label>Confirmation Code</Label>
                                    <Input
                                      value={accommodation.confirmationCode || ''}
                                      onChange={(e) => {
                                        const updated = [...(editingStaff.accommodations || [])];
                                        updated[index] = {...accommodation, confirmationCode: e.target.value};
                                        setEditingStaff({...editingStaff, accommodations: updated});
                                      }}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Room Number</Label>
                                    <Input
                                      value={accommodation.roomNumber || ''}
                                      onChange={(e) => {
                                        const updated = [...(editingStaff.accommodations || [])];
                                        updated[index] = {...accommodation, roomNumber: e.target.value};
                                        setEditingStaff({...editingStaff, accommodations: updated});
                                      }}
                                    />
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-gray-500">No accommodations added yet</div>
                      )}
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
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