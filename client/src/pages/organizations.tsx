import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Loader2, Users, User, Building, Search, Phone, Mail, MapPin, PlusCircle, Edit, Trash, FileText, ShoppingBag, DollarSign, Save, Plus } from "lucide-react";

interface Organization {
  id: number;
  name: string;
  type: 'client' | 'vendor' | 'partner';
  industry: string;
  website: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  logoUrl: string | null;
  notes: string | null;
  status: 'active' | 'inactive';
  primaryContactId: number | null;
  assignedSalesRepId: number | null;
  totalRevenue: string;
  createdAt: string;
  updatedAt: string;
}

interface Contact {
  id: number;
  organizationId: number;
  firstName: string;
  lastName: string;
  title: string;
  email: string;
  phone: string;
  isPrimary: boolean;
  notes: string | null;
  avatarUrl: string | null;
}

interface Order {
  id: number;
  orderId: string;
  organizationId: number;
  totalAmount: string;
  status: string;
  createdAt: string;
}

export default function OrganizationsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [addOrgDialogOpen, setAddOrgDialogOpen] = useState(false);
  const [addContactDialogOpen, setAddContactDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [newContact, setNewContact] = useState({
    firstName: "",
    lastName: "",
    title: "",
    email: "",
    phone: "",
    isPrimary: false,
    notes: "",
  });
  const [editedOrg, setEditedOrg] = useState<Partial<Organization>>({});

  const { toast } = useToast();

  const { data: organizationsData, isLoading } = useQuery({
    queryKey: ['/api/organizations'],
  });

  const { data: contactsData, isLoading: contactsLoading } = useQuery({
    queryKey: ['/api/organizations', selectedOrg?.id, 'contacts'],
    enabled: !!selectedOrg,
  });

  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['/api/organizations', selectedOrg?.id, 'orders'],
    enabled: !!selectedOrg,
  });
  
  const { data: salesTeamData, isLoading: salesTeamLoading } = useQuery({
    queryKey: ['/api/admin/sales-team'],
  });

  const createOrganizationMutation = useMutation({
    mutationFn: async (data: Partial<Organization>) => {
      const res = await fetch('/api/organizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create organization');
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['/api/organizations']});
      setAddOrgDialogOpen(false);
      toast({
        title: "Organization created",
        description: "New organization has been added successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const updateOrganizationMutation = useMutation({
    mutationFn: async (data: { id: number, updates: Partial<Organization> }) => {
      const res = await fetch(`/api/organizations/${data.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data.updates),
      });
      if (!res.ok) throw new Error('Failed to update organization');
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['/api/organizations']});
      if (selectedOrg) {
        queryClient.invalidateQueries({queryKey: ['/api/organizations', selectedOrg.id, 'contacts']});
      }
      setEditMode(false);
      toast({
        title: "Organization updated",
        description: "Organization details have been updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const addContactMutation = useMutation({
    mutationFn: async (data: { organizationId: number, contact: typeof newContact }) => {
      const res = await fetch(`/api/organizations/${data.organizationId}/contacts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data.contact),
      });
      if (!res.ok) throw new Error('Failed to add contact');
      return await res.json();
    },
    onSuccess: () => {
      if (selectedOrg) {
        queryClient.invalidateQueries({queryKey: ['/api/organizations', selectedOrg.id, 'contacts']});
      }
      setAddContactDialogOpen(false);
      setNewContact({
        firstName: "",
        lastName: "",
        title: "",
        email: "",
        phone: "",
        isPrimary: false,
        notes: "",
      });
      toast({
        title: "Contact added",
        description: "New contact has been added successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Define query result interfaces
  interface OrganizationsQueryResult {
    data: Organization[];
  }
  
  interface ContactsQueryResult {
    data: Contact[];
  }
  
  interface OrdersQueryResult {
    data: Order[];
  }
  
  interface SalesTeamQueryResult {
    data: {
      id: number;
      firstName: string;
      lastName: string;
      role: string;
      email: string;
      phone: string;
      [key: string]: any;
    }[];
  }
  
  // Use the data from the API
  const organizations = (organizationsData as OrganizationsQueryResult)?.data || [];
  const contacts = (contactsData as ContactsQueryResult)?.data || [];
  const orders = (ordersData as OrdersQueryResult)?.data || [];
  const salesTeam = (salesTeamData as SalesTeamQueryResult)?.data || [];

  const filteredOrganizations = organizations.filter((org: Organization) => {
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        org.name.toLowerCase().includes(query) ||
        org.email.toLowerCase().includes(query) ||
        org.industry.toLowerCase().includes(query) ||
        org.city.toLowerCase().includes(query) ||
        org.state.toLowerCase().includes(query)
      );
    }
    
    // Filter by tab
    switch(activeTab) {
      case "clients": return org.type === "client";
      case "vendors": return org.type === "vendor";
      case "partners": return org.type === "partner";
      case "inactive": return org.status === "inactive";
      default: return true; // "all" tab
    }
  });

  const handleOrgClick = (org: Organization) => {
    setSelectedOrg(org);
    setDialogOpen(true);
    setEditedOrg({});
    setEditMode(false);
  };

  const handleAddContact = () => {
    if (selectedOrg) {
      addContactMutation.mutate({
        organizationId: selectedOrg.id,
        contact: newContact,
      });
    }
  };

  const handleEditSave = () => {
    if (selectedOrg && Object.keys(editedOrg).length > 0) {
      updateOrganizationMutation.mutate({
        id: selectedOrg.id,
        updates: editedOrg,
      });
    } else {
      setEditMode(false);
    }
  };

  const handleCreateOrganization = () => {
    createOrganizationMutation.mutate({
      ...editedOrg,
      status: 'active',
    });
  };

  const getOrgTypeBadge = (type: string) => {
    switch(type) {
      case 'client':
        return <Badge className="bg-blue-500">Client</Badge>;
      case 'vendor':
        return <Badge className="bg-amber-500">Vendor</Badge>;
      case 'partner':
        return <Badge className="bg-green-500">Partner</Badge>;
      default:
        return <Badge>{type}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'inactive':
        return <Badge variant="outline" className="text-gray-500">Inactive</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getOrderStatusBadge = (status: string) => {
    switch(status) {
      case 'completed':
        return <Badge className="bg-green-500">Completed</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-500">In Progress</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const primaryContact = contacts.find((c: Contact) => c.isPrimary);

  return (
    <>
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-800 py-4 px-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">Organizations</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Manage clients, vendors, and partners</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search organizations..."
                className="pl-8 w-full sm:w-[250px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Button onClick={() => setAddOrgDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Organization
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6">
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="clients">Clients</TabsTrigger>
            <TabsTrigger value="vendors">Vendors</TabsTrigger>
            <TabsTrigger value="partners">Partners</TabsTrigger>
            <TabsTrigger value="inactive">Inactive</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : filteredOrganizations.length === 0 ? (
              <div className="text-center p-8 border rounded-lg border-dashed">
                <Building className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                <h3 className="text-lg font-medium">No organizations found</h3>
                <p className="text-gray-500 mt-1">
                  {searchQuery
                    ? "Try adjusting your search query"
                    : "Organizations matching the selected filter will appear here"}
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Organization</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Industry</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Revenue</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrganizations.map((org: Organization) => {
                      // Find primary contact for this organization
                      const primaryContact = contacts.find(
                        (c: Contact) => c.organizationId === org.id && c.isPrimary
                      );
                      
                      return (
                        <TableRow 
                          key={org.id} 
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => handleOrgClick(org)}
                        >
                          <TableCell>
                            <div className="font-medium">{org.name}</div>
                            <div className="text-sm text-gray-500">{org.website}</div>
                          </TableCell>
                          <TableCell>{getOrgTypeBadge(org.type)}</TableCell>
                          <TableCell>{org.industry}</TableCell>
                          <TableCell>
                            {primaryContact ? (
                              <div>
                                <div className="font-medium">
                                  {primaryContact.firstName} {primaryContact.lastName}
                                </div>
                                <div className="text-sm text-gray-500">{primaryContact.email}</div>
                              </div>
                            ) : (
                              <span className="text-gray-500">No primary contact</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {org.city}, {org.state}
                          </TableCell>
                          <TableCell>{getStatusBadge(org.status)}</TableCell>
                          <TableCell>{formatCurrency(Number(org.totalRevenue))}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOrgClick(org);
                              }}
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Organization Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          {selectedOrg && (
            <>
              <DialogHeader className="space-y-1">
                <div className="flex justify-between items-start">
                  <DialogTitle className="text-2xl">{selectedOrg.name}</DialogTitle>
                  <div className="flex items-center gap-2">
                    {getOrgTypeBadge(selectedOrg.type)}
                    {getStatusBadge(selectedOrg.status)}
                  </div>
                </div>
                <DialogDescription>{selectedOrg.industry}</DialogDescription>
              </DialogHeader>

              <div className="flex justify-end mb-4">
                {editMode ? (
                  <Button onClick={handleEditSave} disabled={updateOrganizationMutation.isPending}>
                    {updateOrganizationMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </Button>
                ) : (
                  <Button variant="outline" onClick={() => setEditMode(true)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                )}
              </div>

              <Tabs defaultValue="details">
                <TabsList className="mb-4">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="contacts">Contacts</TabsTrigger>
                  <TabsTrigger value="orders">Orders</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-medium">Team Assignment</h3>
                        {editMode ? (
                          <div className="space-y-2 mt-3">
                            <Label htmlFor="editSalesRep">Assigned Sales Rep</Label>
                            <Select
                              value={editedOrg.assignedSalesRepId ?? selectedOrg.assignedSalesRepId ? String(editedOrg.assignedSalesRepId ?? selectedOrg.assignedSalesRepId) : "none"}
                              onValueChange={(value) => 
                                setEditedOrg({...editedOrg, assignedSalesRepId: value && value !== "none" ? parseInt(value) : null})
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select a sales rep" />
                              </SelectTrigger>
                              <SelectContent className="max-h-[200px] overflow-y-auto">
                                <SelectItem value="none">None</SelectItem>
                                {salesTeam.map((rep: {id: number; firstName: string; lastName: string; role: string}) => (
                                  <SelectItem key={rep.id} value={String(rep.id)}>
                                    {rep.firstName} {rep.lastName} - {rep.role}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        ) : (
                          <div className="mt-3">
                            {selectedOrg.assignedSalesRepId ? (
                              (() => {
                                const assignedRep = salesTeam.find((rep: {id: number; firstName: string; lastName: string; role: string}) => rep.id === selectedOrg.assignedSalesRepId);
                                return (
                                  <div className="flex items-center">
                                    <User className="h-4 w-4 mr-2 text-gray-500" />
                                    <span>
                                      {assignedRep ? `${assignedRep.firstName} ${assignedRep.lastName} - ${assignedRep.role}` : 'Sales Rep Not Found'}
                                    </span>
                                  </div>
                                );
                              })()
                            ) : (
                              <div className="text-gray-500 flex items-center">
                                <User className="h-4 w-4 mr-2" />
                                <span>No sales rep assigned</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-medium">Contact Information</h3>
                        
                        {editMode ? (
                          <>
                            <div className="grid grid-cols-1 gap-4 mt-3">
                              <div className="space-y-2">
                                <Label htmlFor="website">Website</Label>
                                <Input
                                  id="website"
                                  value={editedOrg.website ?? selectedOrg.website}
                                  onChange={(e) => setEditedOrg({...editedOrg, website: e.target.value})}
                                />
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                  id="email"
                                  value={editedOrg.email ?? selectedOrg.email}
                                  onChange={(e) => setEditedOrg({...editedOrg, email: e.target.value})}
                                />
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor="phone">Phone</Label>
                                <Input
                                  id="phone"
                                  value={editedOrg.phone ?? selectedOrg.phone}
                                  onChange={(e) => setEditedOrg({...editedOrg, phone: e.target.value})}
                                />
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="mt-3 space-y-2">
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                              <span>
                                {selectedOrg.address}, {selectedOrg.city}, {selectedOrg.state} {selectedOrg.zip}, {selectedOrg.country}
                              </span>
                            </div>
                            <div className="flex items-center">
                              <Mail className="h-4 w-4 mr-2 text-gray-500" />
                              <a href={`mailto:${selectedOrg.email}`} className="text-blue-600 hover:underline">
                                {selectedOrg.email}
                              </a>
                            </div>
                            <div className="flex items-center">
                              <Phone className="h-4 w-4 mr-2 text-gray-500" />
                              <a href={`tel:${selectedOrg.phone}`} className="text-blue-600 hover:underline">
                                {selectedOrg.phone}
                              </a>
                            </div>
                            <div className="flex items-center">
                              <Globe className="h-4 w-4 mr-2 text-gray-500" />
                              <a href={`https://${selectedOrg.website}`} target="_blank" className="text-blue-600 hover:underline">
                                {selectedOrg.website}
                              </a>
                            </div>
                          </div>
                        )}
                      </div>

                      {!editMode && primaryContact && (
                        <div>
                          <h3 className="text-lg font-medium">Primary Contact</h3>
                          <div className="mt-3 flex items-center space-x-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={primaryContact.avatarUrl || ""} />
                              <AvatarFallback>
                                {primaryContact.firstName.charAt(0)}{primaryContact.lastName.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">
                                {primaryContact.firstName} {primaryContact.lastName}
                              </div>
                              <div className="text-sm text-gray-500">{primaryContact.title}</div>
                              <div className="text-sm">
                                <a href={`mailto:${primaryContact.email}`} className="text-blue-600 hover:underline">
                                  {primaryContact.email}
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {editMode && (
                        <>
                          <div>
                            <h3 className="text-lg font-medium">Organization Type</h3>
                            <div className="mt-3">
                              <Select 
                                value={editedOrg.type ?? selectedOrg.type} 
                                onValueChange={(value) => setEditedOrg({...editedOrg, type: value as any})}
                              >
                                <SelectTrigger>
                                  <SelectValue/>
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="client">Client</SelectItem>
                                  <SelectItem value="vendor">Vendor</SelectItem>
                                  <SelectItem value="partner">Partner</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div>
                            <h3 className="text-lg font-medium">Status</h3>
                            <div className="mt-3 flex items-center space-x-2">
                              <Switch 
                                checked={editedOrg.status ? editedOrg.status === 'active' : selectedOrg.status === 'active'} 
                                onCheckedChange={(checked) => 
                                  setEditedOrg({...editedOrg, status: checked ? 'active' : 'inactive'})
                                }
                              />
                              <span>
                                {editedOrg.status ? 
                                  (editedOrg.status === 'active' ? 'Active' : 'Inactive') : 
                                  (selectedOrg.status === 'active' ? 'Active' : 'Inactive')}
                              </span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                    
                    <div className="space-y-4">
                      {editMode ? (
                        <>
                          <div>
                            <h3 className="text-lg font-medium">Address</h3>
                            <div className="grid grid-cols-1 gap-4 mt-3">
                              <div className="space-y-2">
                                <Label htmlFor="address">Street Address</Label>
                                <Input
                                  id="address"
                                  value={editedOrg.address ?? selectedOrg.address}
                                  onChange={(e) => setEditedOrg({...editedOrg, address: e.target.value})}
                                />
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor="city">City</Label>
                                  <Input
                                    id="city"
                                    value={editedOrg.city ?? selectedOrg.city}
                                    onChange={(e) => setEditedOrg({...editedOrg, city: e.target.value})}
                                  />
                                </div>
                                
                                <div className="space-y-2">
                                  <Label htmlFor="state">State</Label>
                                  <Input
                                    id="state"
                                    value={editedOrg.state ?? selectedOrg.state}
                                    onChange={(e) => setEditedOrg({...editedOrg, state: e.target.value})}
                                  />
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor="zip">ZIP Code</Label>
                                  <Input
                                    id="zip"
                                    value={editedOrg.zip ?? selectedOrg.zip}
                                    onChange={(e) => setEditedOrg({...editedOrg, zip: e.target.value})}
                                  />
                                </div>
                                
                                <div className="space-y-2">
                                  <Label htmlFor="country">Country</Label>
                                  <Input
                                    id="country"
                                    value={editedOrg.country ?? selectedOrg.country}
                                    onChange={(e) => setEditedOrg({...editedOrg, country: e.target.value})}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <h3 className="text-lg font-medium">Industry & Notes</h3>
                            <div className="space-y-4 mt-3">
                              <div className="space-y-2">
                                <Label htmlFor="industry">Industry</Label>
                                <Input
                                  id="industry"
                                  value={editedOrg.industry ?? selectedOrg.industry}
                                  onChange={(e) => setEditedOrg({...editedOrg, industry: e.target.value})}
                                />
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor="notes">Notes</Label>
                                <Textarea
                                  id="notes"
                                  value={editedOrg.notes ?? (selectedOrg.notes || '')}
                                  onChange={(e) => setEditedOrg({...editedOrg, notes: e.target.value})}
                                  rows={3}
                                />
                              </div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <h3 className="text-lg font-medium">Organization Details</h3>
                            <div className="mt-3 space-y-2">
                              <div>
                                <span className="text-gray-500">Customer Since:</span>{" "}
                                {formatDate(selectedOrg.createdAt)}
                              </div>
                              <div>
                                <span className="text-gray-500">Total Revenue:</span>{" "}
                                {formatCurrency(Number(selectedOrg.totalRevenue))}
                              </div>
                              <div>
                                <span className="text-gray-500">Last Updated:</span>{" "}
                                {formatDate(selectedOrg.updatedAt)}
                              </div>
                            </div>
                          </div>
                          
                          {selectedOrg.notes && (
                            <div>
                              <h3 className="text-lg font-medium">Notes</h3>
                              <p className="mt-2 text-gray-700">{selectedOrg.notes}</p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="contacts" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Contacts</h3>
                    <Button 
                      size="sm" 
                      onClick={() => setAddContactDialogOpen(true)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Contact
                    </Button>
                  </div>
                  
                  {contactsLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    </div>
                  ) : contacts.length === 0 ? (
                    <div className="text-center p-8 border rounded-lg border-dashed">
                      <Users className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                      <h3 className="text-medium">No contacts</h3>
                      <p className="text-gray-500 text-sm mt-1">
                        Add contacts to keep track of your relationships
                      </p>
                      <Button 
                        onClick={() => setAddContactDialogOpen(true)} 
                        variant="outline" 
                        className="mt-4"
                      >
                        <PlusCircle className="h-4 w-4 mr-1" />
                        Add First Contact
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {contacts.map(contact => (
                        <Card key={contact.id}>
                          <CardContent className="p-4">
                            <div className="flex items-start">
                              <Avatar className="h-10 w-10 mr-3">
                                <AvatarImage src={contact.avatarUrl || ""} />
                                <AvatarFallback>
                                  {contact.firstName.charAt(0)}{contact.lastName.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="font-medium">
                                      {contact.firstName} {contact.lastName}
                                      {contact.isPrimary && (
                                        <Badge className="ml-2 text-xs bg-blue-100 text-blue-800 border border-blue-300">Primary</Badge>
                                      )}
                                    </div>
                                    <div className="text-gray-500 text-sm">{contact.title}</div>
                                  </div>
                                  <div className="flex">
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500">
                                      <Trash className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                                <div className="mt-2 space-y-1 text-sm">
                                  <div className="flex items-center">
                                    <Mail className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                                    <a href={`mailto:${contact.email}`} className="text-blue-600 hover:underline">
                                      {contact.email}
                                    </a>
                                  </div>
                                  <div className="flex items-center">
                                    <Phone className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                                    <a href={`tel:${contact.phone}`} className="text-blue-600 hover:underline">
                                      {contact.phone}
                                    </a>
                                  </div>
                                </div>
                                {contact.notes && (
                                  <div className="mt-2 text-sm">
                                    <span className="text-gray-500">Notes:</span> {contact.notes}
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="orders" className="space-y-4">
                  <h3 className="text-lg font-medium">Order History</h3>
                  
                  {ordersLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="text-center p-8 border rounded-lg border-dashed">
                      <ShoppingBag className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                      <h3 className="text-medium">No orders yet</h3>
                      <p className="text-gray-500 text-sm mt-1">
                        This organization has not placed any orders yet
                      </p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order ID</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orders.map(order => (
                          <TableRow key={order.id}>
                            <TableCell className="font-medium">{order.orderId}</TableCell>
                            <TableCell>{formatDate(order.createdAt)}</TableCell>
                            <TableCell>{getOrderStatusBadge(order.status)}</TableCell>
                            <TableCell>{formatCurrency(Number(order.totalAmount))}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="icon">
                                <FileText className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                  
                  <div className="flex justify-between items-center pt-4">
                    <div>
                      <p className="text-sm font-medium">Total Lifetime Value</p>
                      <p className="text-2xl font-bold">{formatCurrency(Number(selectedOrg.totalRevenue))}</p>
                    </div>
                    <Button variant="outline">
                      <DollarSign className="mr-2 h-4 w-4" />
                      View Revenue Report
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Contact Dialog */}
      <Dialog open={addContactDialogOpen} onOpenChange={setAddContactDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Contact</DialogTitle>
            <DialogDescription>
              Add a new contact to {selectedOrg?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={newContact.firstName}
                  onChange={(e) => setNewContact({...newContact, firstName: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={newContact.lastName}
                  onChange={(e) => setNewContact({...newContact, lastName: e.target.value})}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="title">Job Title</Label>
              <Input
                id="title"
                value={newContact.title}
                onChange={(e) => setNewContact({...newContact, title: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newContact.email}
                onChange={(e) => setNewContact({...newContact, email: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={newContact.phone}
                onChange={(e) => setNewContact({...newContact, phone: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={newContact.notes}
                onChange={(e) => setNewContact({...newContact, notes: e.target.value})}
                rows={3}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="isPrimary"
                checked={newContact.isPrimary}
                onCheckedChange={(checked) => setNewContact({...newContact, isPrimary: checked})}
              />
              <Label htmlFor="isPrimary">Primary contact</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setAddContactDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={handleAddContact}
              disabled={!newContact.firstName || !newContact.lastName || !newContact.email || addContactMutation.isPending}
            >
              {addContactMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Contact
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Organization Dialog */}
      <Dialog open={addOrgDialogOpen} onOpenChange={setAddOrgDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Organization</DialogTitle>
            <DialogDescription>
              Create a new organization record
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="orgName">Organization Name</Label>
              <Input
                id="orgName"
                value={editedOrg.name || ''}
                onChange={(e) => setEditedOrg({...editedOrg, name: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="orgType">Type</Label>
              <Select
                value={editedOrg.type || 'client'}
                onValueChange={(value) => setEditedOrg({...editedOrg, type: value as any})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="vendor">Vendor</SelectItem>
                  <SelectItem value="partner">Partner</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Input
                id="industry"
                value={editedOrg.industry || ''}
                onChange={(e) => setEditedOrg({...editedOrg, industry: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={editedOrg.website || ''}
                onChange={(e) => setEditedOrg({...editedOrg, website: e.target.value})}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={editedOrg.phone || ''}
                  onChange={(e) => setEditedOrg({...editedOrg, phone: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={editedOrg.email || ''}
                  onChange={(e) => setEditedOrg({...editedOrg, email: e.target.value})}
                />
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <Label htmlFor="salesRep">Assigned Sales Rep</Label>
              <Select
                value={editedOrg.assignedSalesRepId ? String(editedOrg.assignedSalesRepId) : "none"}
                onValueChange={(value) => 
                  setEditedOrg({...editedOrg, assignedSalesRepId: value && value !== "none" ? parseInt(value) : null})
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a sales rep" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px] overflow-y-auto">
                  <SelectItem value="none">None</SelectItem>
                  {salesTeam.map((rep: {id: number; firstName: string; lastName: string; role: string}) => (
                    <SelectItem key={rep.id} value={String(rep.id)}>
                      {rep.firstName} {rep.lastName} - {rep.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={editedOrg.address || ''}
                onChange={(e) => setEditedOrg({...editedOrg, address: e.target.value})}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={editedOrg.city || ''}
                  onChange={(e) => setEditedOrg({...editedOrg, city: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={editedOrg.state || ''}
                  onChange={(e) => setEditedOrg({...editedOrg, state: e.target.value})}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="zip">ZIP Code</Label>
                <Input
                  id="zip"
                  value={editedOrg.zip || ''}
                  onChange={(e) => setEditedOrg({...editedOrg, zip: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={editedOrg.country || ''}
                  onChange={(e) => setEditedOrg({...editedOrg, country: e.target.value})}
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setAddOrgDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={handleCreateOrganization}
              disabled={!editedOrg.name || !editedOrg.type || createOrganizationMutation.isPending}
            >
              {createOrganizationMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Organization
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


    </>
  );
}

function Globe(props: React.ComponentProps<"svg">) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}