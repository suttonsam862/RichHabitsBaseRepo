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
import { useAuth } from "@/hooks/use-auth";
import { Loader2, Users, User, Building, Search, Phone, Mail, MapPin, PlusCircle, Edit, Trash, FileText, ShoppingBag, DollarSign, Save, Plus, Dumbbell, GraduationCap, Trophy, UsersRound, Globe, CalendarIcon, CreditCard, FileBarChart, Lock, Network, Share2, Hash, BarChart4, LinkIcon, Briefcase, AtSign, Award, Map, Calendar } from "lucide-react";

interface Organization {
  id: number;
  name: string;
  type: 'client' | 'vendor' | 'partner' | 'school' | 'sports_team' | 'club' | 'gym';
  industry: string;
  website: string;
  phone: string;
  email: string;
  // Enhanced address fields
  address: string;
  address2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  // Enhanced organization details
  foundedYear?: number;
  employeeCount?: number;
  annualRevenue?: string;
  taxId?: string;
  businessHours?: string;
  socialMedia?: {
    facebook?: string;
    linkedin?: string;
    twitter?: string;
    instagram?: string;
  };
  paymentTerms?: string;
  creditLimit?: string;
  paymentMethods?: string[];
  logoUrl: string | null;
  notes: string | null;
  status: 'active' | 'inactive';
  primaryContactId: number | null;
  assignedSalesRepId: number | null;
  totalRevenue: string;
  icon?: string;
  preferredContactMethod?: 'email' | 'phone' | 'mail';
  shippingAddress?: {
    sameAsBilling: boolean;
    address: string;
    address2?: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  tags?: string[];
  accountManager?: number;
  accountType?: 'regular' | 'vip' | 'key' | 'strategic';
  discountTier?: 'none' | 'tier1' | 'tier2' | 'tier3';
  createdAt: string;
  updatedAt: string;
  lastInteractionDate?: string;
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
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

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
            
            {isAdmin && (
              <Button onClick={() => setAddOrgDialogOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Organization
              </Button>
            )}
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
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-auto">
          {selectedOrg && (
            <>
              <DialogHeader className="space-y-1">
                <div className="flex justify-between items-start">
                  {editMode ? (
                    <Input
                      className="text-2xl font-bold w-full md:w-2/3"
                      value={editedOrg.name ?? selectedOrg.name}
                      onChange={(e) => setEditedOrg({...editedOrg, name: e.target.value})}
                    />
                  ) : (
                    <DialogTitle className="text-2xl">{selectedOrg.name}</DialogTitle>
                  )}
                  <div className="flex items-center gap-2">
                    {getOrgTypeBadge(selectedOrg.type)}
                    {getStatusBadge(selectedOrg.status)}
                  </div>
                </div>
                {editMode ? (
                  <Input
                    placeholder="Industry"
                    value={editedOrg.industry ?? selectedOrg.industry}
                    onChange={(e) => setEditedOrg({...editedOrg, industry: e.target.value})}
                  />
                ) : (
                  <DialogDescription>{selectedOrg.industry}</DialogDescription>
                )}
              </DialogHeader>

              <div className="flex justify-end mb-4">
                {editMode ? (
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => {
                      setEditMode(false);
                      setEditedOrg({});
                    }}>
                      Cancel
                    </Button>
                    <Button onClick={handleEditSave} disabled={updateOrganizationMutation.isPending} className="bg-brand-600 hover:bg-brand-700">
                      {updateOrganizationMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </Button>
                  </div>
                ) : (
                  /* Only show Edit button to admin users */
                  isAdmin && (
                    <Button variant="outline" onClick={() => setEditMode(true)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                  )
                )}
              </div>

              <Tabs defaultValue="details">
                <TabsList className="mb-4">
                  <TabsTrigger value="details">Overview</TabsTrigger>
                  <TabsTrigger value="contact">Contact Info</TabsTrigger>
                  <TabsTrigger value="financial">Financial</TabsTrigger>
                  <TabsTrigger value="contacts">Contacts</TabsTrigger>
                  <TabsTrigger value="orders">Orders</TabsTrigger>
                  <TabsTrigger value="advanced">Advanced</TabsTrigger>
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

                <TabsContent value="contact" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-medium">Contact Details</h3>
                        {editMode ? (
                          <div className="grid grid-cols-1 gap-4 mt-3">
                            <div className="space-y-2">
                              <Label htmlFor="preferredContactMethod">Preferred Contact Method</Label>
                              <Select 
                                value={editedOrg.preferredContactMethod ?? selectedOrg.preferredContactMethod ?? 'email'} 
                                onValueChange={(value) => setEditedOrg({...editedOrg, preferredContactMethod: value as any})}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select contact method"/>
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="email">Email</SelectItem>
                                  <SelectItem value="phone">Phone</SelectItem>
                                  <SelectItem value="mail">Mail</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="email">Email Address</Label>
                              <Input
                                id="email"
                                value={editedOrg.email ?? selectedOrg.email}
                                onChange={(e) => setEditedOrg({...editedOrg, email: e.target.value})}
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="phone">Phone Number</Label>
                              <Input
                                id="phone"
                                value={editedOrg.phone ?? selectedOrg.phone}
                                onChange={(e) => setEditedOrg({...editedOrg, phone: e.target.value})}
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="website">Website</Label>
                              <Input
                                id="website"
                                value={editedOrg.website ?? selectedOrg.website}
                                onChange={(e) => setEditedOrg({...editedOrg, website: e.target.value})}
                              />
                            </div>
                            
                            <div>
                              <h4 className="font-medium mb-2">Social Media</h4>
                              <div className="space-y-3">
                                <div className="space-y-2">
                                  <Label htmlFor="linkedIn">LinkedIn</Label>
                                  <Input
                                    id="linkedIn"
                                    value={editedOrg.socialMedia?.linkedin ?? selectedOrg.socialMedia?.linkedin ?? ''}
                                    onChange={(e) => setEditedOrg({
                                      ...editedOrg, 
                                      socialMedia: {
                                        ...(editedOrg.socialMedia || selectedOrg.socialMedia || {}),
                                        linkedin: e.target.value
                                      }
                                    })}
                                  />
                                </div>
                                
                                <div className="space-y-2">
                                  <Label htmlFor="facebook">Facebook</Label>
                                  <Input
                                    id="facebook"
                                    value={editedOrg.socialMedia?.facebook ?? selectedOrg.socialMedia?.facebook ?? ''}
                                    onChange={(e) => setEditedOrg({
                                      ...editedOrg, 
                                      socialMedia: {
                                        ...(editedOrg.socialMedia || selectedOrg.socialMedia || {}),
                                        facebook: e.target.value
                                      }
                                    })}
                                  />
                                </div>
                                
                                <div className="space-y-2">
                                  <Label htmlFor="twitter">Twitter</Label>
                                  <Input
                                    id="twitter"
                                    value={editedOrg.socialMedia?.twitter ?? selectedOrg.socialMedia?.twitter ?? ''}
                                    onChange={(e) => setEditedOrg({
                                      ...editedOrg, 
                                      socialMedia: {
                                        ...(editedOrg.socialMedia || selectedOrg.socialMedia || {}),
                                        twitter: e.target.value
                                      }
                                    })}
                                  />
                                </div>
                                
                                <div className="space-y-2">
                                  <Label htmlFor="instagram">Instagram</Label>
                                  <Input
                                    id="instagram"
                                    value={editedOrg.socialMedia?.instagram ?? selectedOrg.socialMedia?.instagram ?? ''}
                                    onChange={(e) => setEditedOrg({
                                      ...editedOrg, 
                                      socialMedia: {
                                        ...(editedOrg.socialMedia || selectedOrg.socialMedia || {}),
                                        instagram: e.target.value
                                      }
                                    })}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-3 space-y-6">
                            <div className="space-y-2">
                              <div className="flex items-center">
                                <Mail className="h-4 w-4 mr-2 text-gray-500" />
                                <span className="text-gray-500 mr-2">Email:</span>
                                <a href={`mailto:${selectedOrg.email}`} className="text-blue-600 hover:underline">
                                  {selectedOrg.email}
                                </a>
                              </div>
                              
                              <div className="flex items-center">
                                <Phone className="h-4 w-4 mr-2 text-gray-500" />
                                <span className="text-gray-500 mr-2">Phone:</span>
                                <a href={`tel:${selectedOrg.phone}`} className="text-blue-600 hover:underline">
                                  {selectedOrg.phone}
                                </a>
                              </div>
                              
                              <div className="flex items-center">
                                <Globe className="h-4 w-4 mr-2 text-gray-500" />
                                <span className="text-gray-500 mr-2">Website:</span>
                                <a href={`https://${selectedOrg.website}`} target="_blank" className="text-blue-600 hover:underline">
                                  {selectedOrg.website}
                                </a>
                              </div>
                              
                              <div className="flex items-center">
                                <Map className="h-4 w-4 mr-2 text-gray-500" />
                                <span className="text-gray-500 mr-2">Preferred Contact:</span>
                                <span>
                                  {selectedOrg.preferredContactMethod ? 
                                    selectedOrg.preferredContactMethod.charAt(0).toUpperCase() + selectedOrg.preferredContactMethod.slice(1) : 
                                    'Email'}
                                </span>
                              </div>
                            </div>
                            
                            {selectedOrg.socialMedia && Object.values(selectedOrg.socialMedia).some(val => val) && (
                              <div>
                                <h4 className="font-medium mb-2">Social Media</h4>
                                <div className="grid grid-cols-1 gap-2">
                                  {selectedOrg.socialMedia.linkedin && (
                                    <div className="flex items-center">
                                      <LinkIcon className="h-4 w-4 mr-2 text-gray-500" />
                                      <span className="text-gray-500 mr-2">LinkedIn:</span>
                                      <a href={selectedOrg.socialMedia.linkedin} target="_blank" className="text-blue-600 hover:underline truncate">
                                        {selectedOrg.socialMedia.linkedin}
                                      </a>
                                    </div>
                                  )}
                                  
                                  {selectedOrg.socialMedia.facebook && (
                                    <div className="flex items-center">
                                      <Share2 className="h-4 w-4 mr-2 text-gray-500" />
                                      <span className="text-gray-500 mr-2">Facebook:</span>
                                      <a href={selectedOrg.socialMedia.facebook} target="_blank" className="text-blue-600 hover:underline truncate">
                                        {selectedOrg.socialMedia.facebook}
                                      </a>
                                    </div>
                                  )}
                                  
                                  {selectedOrg.socialMedia.twitter && (
                                    <div className="flex items-center">
                                      <Hash className="h-4 w-4 mr-2 text-gray-500" />
                                      <span className="text-gray-500 mr-2">Twitter:</span>
                                      <a href={selectedOrg.socialMedia.twitter} target="_blank" className="text-blue-600 hover:underline truncate">
                                        {selectedOrg.socialMedia.twitter}
                                      </a>
                                    </div>
                                  )}
                                  
                                  {selectedOrg.socialMedia.instagram && (
                                    <div className="flex items-center">
                                      <Network className="h-4 w-4 mr-2 text-gray-500" />
                                      <span className="text-gray-500 mr-2">Instagram:</span>
                                      <a href={selectedOrg.socialMedia.instagram} target="_blank" className="text-blue-600 hover:underline truncate">
                                        {selectedOrg.socialMedia.instagram}
                                      </a>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-medium">Address Information</h3>
                        {editMode ? (
                          <div className="grid grid-cols-1 gap-4 mt-3">
                            <div className="space-y-2">
                              <Label htmlFor="billingAddress">Billing Address</Label>
                              <Input
                                id="billingAddress"
                                value={editedOrg.address ?? selectedOrg.address}
                                onChange={(e) => setEditedOrg({...editedOrg, address: e.target.value})}
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="billingAddress2">Address Line 2</Label>
                              <Input
                                id="billingAddress2"
                                value={editedOrg.address2 ?? selectedOrg.address2 ?? ''}
                                onChange={(e) => setEditedOrg({...editedOrg, address2: e.target.value})}
                              />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="billingCity">City</Label>
                                <Input
                                  id="billingCity"
                                  value={editedOrg.city ?? selectedOrg.city}
                                  onChange={(e) => setEditedOrg({...editedOrg, city: e.target.value})}
                                />
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor="billingState">State/Province</Label>
                                <Input
                                  id="billingState"
                                  value={editedOrg.state ?? selectedOrg.state}
                                  onChange={(e) => setEditedOrg({...editedOrg, state: e.target.value})}
                                />
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="billingZip">ZIP/Postal Code</Label>
                                <Input
                                  id="billingZip"
                                  value={editedOrg.zip ?? selectedOrg.zip}
                                  onChange={(e) => setEditedOrg({...editedOrg, zip: e.target.value})}
                                />
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor="billingCountry">Country</Label>
                                <Input
                                  id="billingCountry"
                                  value={editedOrg.country ?? selectedOrg.country}
                                  onChange={(e) => setEditedOrg({...editedOrg, country: e.target.value})}
                                />
                              </div>
                            </div>
                            
                            <div className="pt-4 border-t">
                              <div className="flex items-center space-x-2 mb-4">
                                <Switch 
                                  checked={!(editedOrg.shippingAddress?.sameAsBilling ?? selectedOrg.shippingAddress?.sameAsBilling ?? true)} 
                                  onCheckedChange={(checked) => {
                                    const currentShipping = editedOrg.shippingAddress || selectedOrg.shippingAddress || { 
                                      sameAsBilling: true,
                                      address: selectedOrg.address,
                                      city: selectedOrg.city,
                                      state: selectedOrg.state,
                                      zip: selectedOrg.zip,
                                      country: selectedOrg.country
                                    };
                                    
                                    setEditedOrg({
                                      ...editedOrg, 
                                      shippingAddress: { 
                                        ...currentShipping,
                                        sameAsBilling: !checked
                                      }
                                    });
                                  }}
                                />
                                <Label htmlFor="differentShipping">Use different shipping address</Label>
                              </div>
                              
                              {(!(editedOrg.shippingAddress?.sameAsBilling ?? selectedOrg.shippingAddress?.sameAsBilling ?? true)) && (
                                <div className="space-y-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="shippingAddress">Shipping Address</Label>
                                    <Input
                                      id="shippingAddress"
                                      value={editedOrg.shippingAddress?.address ?? selectedOrg.shippingAddress?.address ?? ''}
                                      onChange={(e) => {
                                        const currentShipping = editedOrg.shippingAddress || selectedOrg.shippingAddress || { sameAsBilling: false };
                                        setEditedOrg({
                                          ...editedOrg, 
                                          shippingAddress: { 
                                            ...currentShipping,
                                            address: e.target.value
                                          }
                                        });
                                      }}
                                    />
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <Label htmlFor="shippingAddress2">Address Line 2</Label>
                                    <Input
                                      id="shippingAddress2"
                                      value={editedOrg.shippingAddress?.address2 ?? selectedOrg.shippingAddress?.address2 ?? ''}
                                      onChange={(e) => {
                                        const currentShipping = editedOrg.shippingAddress || selectedOrg.shippingAddress || { sameAsBilling: false };
                                        setEditedOrg({
                                          ...editedOrg, 
                                          shippingAddress: { 
                                            ...currentShipping,
                                            address2: e.target.value
                                          }
                                        });
                                      }}
                                    />
                                  </div>
                                  
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <Label htmlFor="shippingCity">City</Label>
                                      <Input
                                        id="shippingCity"
                                        value={editedOrg.shippingAddress?.city ?? selectedOrg.shippingAddress?.city ?? ''}
                                        onChange={(e) => {
                                          const currentShipping = editedOrg.shippingAddress || selectedOrg.shippingAddress || { sameAsBilling: false };
                                          setEditedOrg({
                                            ...editedOrg, 
                                            shippingAddress: { 
                                              ...currentShipping,
                                              city: e.target.value
                                            }
                                          });
                                        }}
                                      />
                                    </div>
                                    
                                    <div className="space-y-2">
                                      <Label htmlFor="shippingState">State/Province</Label>
                                      <Input
                                        id="shippingState"
                                        value={editedOrg.shippingAddress?.state ?? selectedOrg.shippingAddress?.state ?? ''}
                                        onChange={(e) => {
                                          const currentShipping = editedOrg.shippingAddress || selectedOrg.shippingAddress || { sameAsBilling: false };
                                          setEditedOrg({
                                            ...editedOrg, 
                                            shippingAddress: { 
                                              ...currentShipping,
                                              state: e.target.value
                                            }
                                          });
                                        }}
                                      />
                                    </div>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <Label htmlFor="shippingZip">ZIP/Postal Code</Label>
                                      <Input
                                        id="shippingZip"
                                        value={editedOrg.shippingAddress?.zip ?? selectedOrg.shippingAddress?.zip ?? ''}
                                        onChange={(e) => {
                                          const currentShipping = editedOrg.shippingAddress || selectedOrg.shippingAddress || { sameAsBilling: false };
                                          setEditedOrg({
                                            ...editedOrg, 
                                            shippingAddress: { 
                                              ...currentShipping,
                                              zip: e.target.value
                                            }
                                          });
                                        }}
                                      />
                                    </div>
                                    
                                    <div className="space-y-2">
                                      <Label htmlFor="shippingCountry">Country</Label>
                                      <Input
                                        id="shippingCountry"
                                        value={editedOrg.shippingAddress?.country ?? selectedOrg.shippingAddress?.country ?? ''}
                                        onChange={(e) => {
                                          const currentShipping = editedOrg.shippingAddress || selectedOrg.shippingAddress || { sameAsBilling: false };
                                          setEditedOrg({
                                            ...editedOrg, 
                                            shippingAddress: { 
                                              ...currentShipping,
                                              country: e.target.value
                                            }
                                          });
                                        }}
                                      />
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="mt-3 space-y-4">
                            <div>
                              <h4 className="font-medium mb-2">Billing Address</h4>
                              <div className="grid grid-cols-1 gap-1">
                                <div>{selectedOrg.address}</div>
                                {selectedOrg.address2 && <div>{selectedOrg.address2}</div>}
                                <div>{selectedOrg.city}, {selectedOrg.state} {selectedOrg.zip}</div>
                                <div>{selectedOrg.country}</div>
                              </div>
                            </div>
                            
                            {selectedOrg.shippingAddress && !selectedOrg.shippingAddress.sameAsBilling && (
                              <div>
                                <h4 className="font-medium mb-2">Shipping Address</h4>
                                <div className="grid grid-cols-1 gap-1">
                                  <div>{selectedOrg.shippingAddress.address}</div>
                                  {selectedOrg.shippingAddress.address2 && <div>{selectedOrg.shippingAddress.address2}</div>}
                                  <div>{selectedOrg.shippingAddress.city}, {selectedOrg.shippingAddress.state} {selectedOrg.shippingAddress.zip}</div>
                                  <div>{selectedOrg.shippingAddress.country}</div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="financial" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-medium">Financial Information</h3>
                        {editMode ? (
                          <div className="grid grid-cols-1 gap-4 mt-3">
                            <div className="space-y-2">
                              <Label htmlFor="annualRevenue">Annual Revenue</Label>
                              <Input
                                id="annualRevenue"
                                value={editedOrg.annualRevenue ?? selectedOrg.annualRevenue ?? ''}
                                onChange={(e) => setEditedOrg({...editedOrg, annualRevenue: e.target.value})}
                                placeholder="e.g. $5,000,000"
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="employeeCount">Employee Count</Label>
                              <Input
                                id="employeeCount"
                                type="number"
                                value={editedOrg.employeeCount ?? selectedOrg.employeeCount ?? ''}
                                onChange={(e) => setEditedOrg({...editedOrg, employeeCount: parseInt(e.target.value) || undefined})}
                                placeholder="e.g. 250"
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="foundedYear">Founded Year</Label>
                              <Input
                                id="foundedYear"
                                type="number"
                                value={editedOrg.foundedYear ?? selectedOrg.foundedYear ?? ''}
                                onChange={(e) => setEditedOrg({...editedOrg, foundedYear: parseInt(e.target.value) || undefined})}
                                placeholder="e.g. 2010"
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="taxId">Tax ID</Label>
                              <Input
                                id="taxId"
                                value={editedOrg.taxId ?? selectedOrg.taxId ?? ''}
                                onChange={(e) => setEditedOrg({...editedOrg, taxId: e.target.value})}
                                placeholder="e.g. 12-3456789"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="mt-3 grid grid-cols-1 gap-2">
                            <div className="grid grid-cols-2">
                              <div className="text-gray-500">Annual Revenue:</div>
                              <div>{selectedOrg.annualRevenue || 'Not specified'}</div>
                            </div>
                            
                            <div className="grid grid-cols-2">
                              <div className="text-gray-500">Employee Count:</div>
                              <div>{selectedOrg.employeeCount ? selectedOrg.employeeCount.toLocaleString() : 'Not specified'}</div>
                            </div>
                            
                            <div className="grid grid-cols-2">
                              <div className="text-gray-500">Year Founded:</div>
                              <div>{selectedOrg.foundedYear || 'Not specified'}</div>
                            </div>
                            
                            <div className="grid grid-cols-2">
                              <div className="text-gray-500">Tax ID:</div>
                              <div>{selectedOrg.taxId || 'Not specified'}</div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-medium">Revenue Summary</h3>
                        <div className="mt-3 border rounded-md p-4">
                          <div className="text-3xl font-bold mb-2">
                            {formatCurrency(Number(selectedOrg.totalRevenue))}
                          </div>
                          <p className="text-gray-500">
                            Total revenue from all orders
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-medium">Billing Information</h3>
                        {editMode ? (
                          <div className="grid grid-cols-1 gap-4 mt-3">
                            <div className="space-y-2">
                              <Label htmlFor="accountType">Account Type</Label>
                              <Select 
                                value={editedOrg.accountType ?? selectedOrg.accountType ?? 'regular'} 
                                onValueChange={(value) => setEditedOrg({...editedOrg, accountType: value as any})}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select account type"/>
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="regular">Regular</SelectItem>
                                  <SelectItem value="vip">VIP</SelectItem>
                                  <SelectItem value="key">Key Account</SelectItem>
                                  <SelectItem value="strategic">Strategic</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="discountTier">Discount Tier</Label>
                              <Select 
                                value={editedOrg.discountTier ?? selectedOrg.discountTier ?? 'none'} 
                                onValueChange={(value) => setEditedOrg({...editedOrg, discountTier: value as any})}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select discount tier"/>
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">None</SelectItem>
                                  <SelectItem value="tier1">Tier 1 (5%)</SelectItem>
                                  <SelectItem value="tier2">Tier 2 (10%)</SelectItem>
                                  <SelectItem value="tier3">Tier 3 (15%)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="paymentTerms">Payment Terms</Label>
                              <Input
                                id="paymentTerms"
                                value={editedOrg.paymentTerms ?? selectedOrg.paymentTerms ?? ''}
                                onChange={(e) => setEditedOrg({...editedOrg, paymentTerms: e.target.value})}
                                placeholder="e.g. Net 30"
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="creditLimit">Credit Limit</Label>
                              <Input
                                id="creditLimit"
                                value={editedOrg.creditLimit ?? selectedOrg.creditLimit ?? ''}
                                onChange={(e) => setEditedOrg({...editedOrg, creditLimit: e.target.value})}
                                placeholder="e.g. $10,000"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="mt-3 grid grid-cols-1 gap-2">
                            <div className="grid grid-cols-2">
                              <div className="text-gray-500">Account Type:</div>
                              <div>
                                {selectedOrg.accountType ? 
                                  selectedOrg.accountType.charAt(0).toUpperCase() + selectedOrg.accountType.slice(1) : 
                                  'Regular'}
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2">
                              <div className="text-gray-500">Discount Tier:</div>
                              <div>
                                {selectedOrg.discountTier === 'tier1' ? 'Tier 1 (5%)' : 
                                 selectedOrg.discountTier === 'tier2' ? 'Tier 2 (10%)' : 
                                 selectedOrg.discountTier === 'tier3' ? 'Tier 3 (15%)' : 
                                 'None'}
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2">
                              <div className="text-gray-500">Payment Terms:</div>
                              <div>{selectedOrg.paymentTerms || 'Not specified'}</div>
                            </div>
                            
                            <div className="grid grid-cols-2">
                              <div className="text-gray-500">Credit Limit:</div>
                              <div>{selectedOrg.creditLimit || 'Not specified'}</div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-medium">Recent Orders</h3>
                        <div className="mt-3">
                          {ordersLoading ? (
                            <div className="flex justify-center p-4">
                              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                            </div>
                          ) : orders.length === 0 ? (
                            <div className="text-gray-500 p-4 text-center border rounded-md">
                              No orders found for this organization
                            </div>
                          ) : (
                            <div className="border rounded-md overflow-hidden">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Order ID</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Status</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {orders.slice(0, 5).map((order) => (
                                    <TableRow key={order.id}>
                                      <TableCell className="font-medium">{order.orderId}</TableCell>
                                      <TableCell>{formatDate(new Date(order.createdAt))}</TableCell>
                                      <TableCell>{formatCurrency(Number(order.totalAmount))}</TableCell>
                                      <TableCell>{getOrderStatusBadge(order.status)}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="advanced" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-medium">Business Details</h3>
                        {editMode ? (
                          <div className="grid grid-cols-1 gap-4 mt-3">
                            <div className="space-y-2">
                              <Label htmlFor="businessHours">Business Hours</Label>
                              <Textarea
                                id="businessHours"
                                value={editedOrg.businessHours ?? selectedOrg.businessHours ?? ''}
                                onChange={(e) => setEditedOrg({...editedOrg, businessHours: e.target.value})}
                                placeholder="e.g. Mon-Fri: 9am-5pm, Sat: 10am-2pm, Sun: Closed"
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="tags">Tags</Label>
                              <Input
                                id="tags"
                                value={(editedOrg.tags ?? selectedOrg.tags ?? []).join(', ')}
                                onChange={(e) => {
                                  const tagsArray = e.target.value.split(',').map(tag => tag.trim()).filter(Boolean);
                                  setEditedOrg({...editedOrg, tags: tagsArray});
                                }}
                                placeholder="e.g. VIP, Referral, Enterprise"
                              />
                              <p className="text-xs text-gray-500">Separate tags with commas</p>
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="lastInteractionDate">Last Interaction Date</Label>
                              <Input
                                id="lastInteractionDate"
                                type="date"
                                value={editedOrg.lastInteractionDate?.split('T')[0] ?? selectedOrg.lastInteractionDate?.split('T')[0] ?? ''}
                                onChange={(e) => setEditedOrg({...editedOrg, lastInteractionDate: e.target.value ? `${e.target.value}T00:00:00` : undefined})}
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="mt-3 grid grid-cols-1 gap-2">
                            <div className="grid grid-cols-2">
                              <div className="text-gray-500">Business Hours:</div>
                              <div className="whitespace-pre-line">{selectedOrg.businessHours || 'Not specified'}</div>
                            </div>
                            
                            <div className="grid grid-cols-2">
                              <div className="text-gray-500">Tags:</div>
                              <div>
                                {selectedOrg.tags && selectedOrg.tags.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {selectedOrg.tags.map((tag, index) => (
                                      <Badge key={index} variant="outline" className="rounded-md">{tag}</Badge>
                                    ))}
                                  </div>
                                ) : (
                                  'No tags'
                                )}
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2">
                              <div className="text-gray-500">Last Interaction:</div>
                              <div>{selectedOrg.lastInteractionDate ? formatDate(new Date(selectedOrg.lastInteractionDate)) : 'Not recorded'}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-medium">System Information</h3>
                        <div className="mt-3 grid grid-cols-1 gap-2">
                          <div className="grid grid-cols-2">
                            <div className="text-gray-500">Created:</div>
                            <div>{formatDate(new Date(selectedOrg.createdAt))}</div>
                          </div>
                          
                          <div className="grid grid-cols-2">
                            <div className="text-gray-500">Last Updated:</div>
                            <div>{formatDate(new Date(selectedOrg.updatedAt))}</div>
                          </div>
                          
                          <div className="grid grid-cols-2">
                            <div className="text-gray-500">Organization ID:</div>
                            <div>{selectedOrg.id}</div>
                          </div>
                        </div>
                      </div>
                      
                      {isAdmin && (
                        <div>
                          <h3 className="text-lg font-medium">Admin Actions</h3>
                          <div className="mt-3 space-y-2">
                            <Button 
                              variant="outline" 
                              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                              // onClick={handleDeleteOrganization}
                            >
                              <Trash className="h-4 w-4 mr-2" />
                              Delete Organization
                            </Button>
                            
                            <Button 
                              variant="outline" 
                              className="w-full justify-start" 
                              // onClick={handleExportData}
                            >
                              <FileBarChart className="h-4 w-4 mr-2" />
                              Export Organization Data
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="contacts" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Contacts</h3>
                    {isAdmin && (
                      <Button 
                        size="sm" 
                        onClick={() => setAddContactDialogOpen(true)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Contact
                      </Button>
                    )}
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
                      {isAdmin && (
                        <Button 
                          onClick={() => setAddContactDialogOpen(true)} 
                          variant="outline" 
                          className="mt-4"
                        >
                          <PlusCircle className="h-4 w-4 mr-1" />
                          Add First Contact
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {contacts.map(contact => (
                        <Card key={contact.id}>
                          <CardContent className="p-4">
                            <div className="flex items-start">
                              <Avatar className="h-10 w-10 mr-3">
                                <AvatarImage src={contact?.avatarUrl || ""} />
                                <AvatarFallback>
                                  {contact?.firstName ? contact.firstName.charAt(0) : ''}
                                  {contact?.lastName ? contact.lastName.charAt(0) : ''}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="font-medium">
                                      {contact?.firstName || 'No'} {contact?.lastName || 'Contact'}
                                      {contact?.isPrimary && (
                                        <Badge className="ml-2 text-xs bg-blue-100 text-blue-800 border border-blue-300">Primary</Badge>
                                      )}
                                    </div>
                                    <div className="text-gray-500 text-sm">{contact?.title || 'No Title'}</div>
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
                                    <a href={`mailto:${contact?.email || ''}`} className="text-blue-600 hover:underline">
                                      {contact?.email || 'No Email'}
                                    </a>
                                  </div>
                                  <div className="flex items-center">
                                    <Phone className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                                    <a href={`tel:${contact?.phone || ''}`} className="text-blue-600 hover:underline">
                                      {contact?.phone || 'No Phone'}
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
            <DialogTitle>Add New Customer Organization</DialogTitle>
            <DialogDescription>
              Create a new customer organization record
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="icon">Organization Icon</Label>
              <Select
                value={editedOrg.icon || 'building'}
                onValueChange={(value) => setEditedOrg({...editedOrg, icon: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an icon" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="building">
                    <div className="flex items-center">
                      <Building className="mr-2 h-4 w-4" />
                      <span>Building</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="school">
                    <div className="flex items-center">
                      <GraduationCap className="mr-2 h-4 w-4" />
                      <span>School</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="gym">
                    <div className="flex items-center">
                      <Dumbbell className="mr-2 h-4 w-4" />
                      <span>Gym</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="team">
                    <div className="flex items-center">
                      <UsersRound className="mr-2 h-4 w-4" />
                      <span>Team</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="club">
                    <div className="flex items-center">
                      <Trophy className="mr-2 h-4 w-4" />
                      <span>Club</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="orgName">Organization Name</Label>
              <Input
                id="orgName"
                value={editedOrg.name || ''}
                onChange={(e) => setEditedOrg({...editedOrg, name: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="orgType">Organization Type</Label>
              <Select
                value={editedOrg.type || 'client'}
                onValueChange={(value) => setEditedOrg({...editedOrg, type: value as any})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="school">School</SelectItem>
                  <SelectItem value="sports_team">Sports Team</SelectItem>
                  <SelectItem value="club">Club</SelectItem>
                  <SelectItem value="gym">Gym/Fitness Center</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Select
                value={editedOrg.industry || ''}
                onValueChange={(value) => setEditedOrg({...editedOrg, industry: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="sports">Sports</SelectItem>
                  <SelectItem value="fitness">Fitness</SelectItem>
                  <SelectItem value="recreation">Recreation</SelectItem>
                  <SelectItem value="health">Health & Wellness</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
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

