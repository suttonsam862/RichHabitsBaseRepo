import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
  ShoppingBag,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Building,
  Mail,
  Phone,
  FileText,
  Link as LinkIcon,
  Star,
  DollarSign,
  Calendar,
  CheckCircle,
  Tag,
  Package,
  Utensils,
  Truck,
  Home,
  Camera,
  Award,
  User
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
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

// Sample data for vendors
const sampleVendors = [
  {
    id: 1,
    name: "Mountain View Catering",
    category: "Food",
    contactName: "Michael Stevens",
    email: "info@mountainviewcatering.com",
    phone: "(303) 555-9876",
    website: "www.mountainviewcatering.com",
    address: "234 Pine Road, Boulder, CO 80302",
    status: "active",
    rating: 4.8,
    logo: "",
    description: "Specializing in nutritious meals for athletes and sports events, offering customized meal plans with attention to dietary needs.",
    services: [
      { name: "Meal Service", description: "Full-service catering with setup and cleanup", price: "$25 per person per day" },
      { name: "Snack Service", description: "Healthy snacks and hydration throughout the day", price: "$10 per person per day" },
      { name: "Dietary Accommodations", description: "Specialized meals for dietary restrictions", price: "Included" }
    ],
    contracts: [
      { 
        id: 1, 
        campId: 1,
        campName: "Summer Wrestling Camp 2025",
        startDate: "2025-06-15", 
        endDate: "2025-06-22",
        services: ["Meal Service", "Snack Service"],
        totalValue: 4500,
        status: "confirmed"
      }
    ],
    documents: [
      { id: 1, name: "Service Contract", status: "signed", date: "2025-03-15" },
      { id: 2, name: "Insurance Certificate", status: "verified", date: "2025-03-10" },
      { id: 3, name: "Health Department Cert", status: "verified", date: "2025-02-20" }
    ],
    notes: "Excellent service, very reliable. They have worked with us for previous camps and consistently delivered quality food."
  },
  {
    id: 2,
    name: "Alpine Shuttle Service",
    category: "Transportation",
    contactName: "Robert Johnson",
    email: "bookings@alpineshuttle.com",
    phone: "(303) 555-7654",
    website: "www.alpineshuttle.com",
    address: "567 Valley Blvd, Boulder, CO 80303",
    status: "active",
    rating: 4.5,
    logo: "",
    description: "Professional transportation service specializing in group transportation for camps and events, with a fleet of modern vehicles.",
    services: [
      { name: "Airport Transfers", description: "Pickup and drop-off at Denver International Airport", price: "$450 per trip (up to 15 passengers)" },
      { name: "Daily Transportation", description: "Transportation between venues as needed", price: "$350 per day" },
      { name: "Equipment Transport", description: "Specialized equipment transport", price: "$200 per trip" }
    ],
    contracts: [
      { 
        id: 2, 
        campId: 1,
        campName: "Summer Wrestling Camp 2025",
        startDate: "2025-06-14", 
        endDate: "2025-06-22",
        services: ["Airport Transfers", "Daily Transportation"],
        totalValue: 2650,
        status: "confirmed"
      }
    ],
    documents: [
      { id: 4, name: "Service Contract", status: "signed", date: "2025-03-12" },
      { id: 5, name: "Insurance Certificate", status: "verified", date: "2025-03-05" },
      { id: 6, name: "Vehicle Inspection Docs", status: "verified", date: "2025-02-28" }
    ],
    notes: "Very punctual and professional. Drivers are experienced and know the area well."
  },
  {
    id: 3,
    name: "Summit Photography",
    category: "Media",
    contactName: "Jennifer Lee",
    email: "jennifer@summitphoto.com",
    phone: "(303) 555-2345",
    website: "www.summitphoto.com",
    address: "123 Main Street, Denver, CO 80205",
    status: "pending",
    rating: 4.9,
    logo: "",
    description: "Professional sports photography service specializing in action shots, team photos, and event coverage with quick turnaround.",
    services: [
      { name: "Full Camp Coverage", description: "Daily photography coverage with online gallery", price: "$1,800 for full camp" },
      { name: "Team Photos", description: "Professional team and individual photos", price: "$500" },
      { name: "Highlight Video", description: "Professional edited video of camp highlights", price: "$1,200" }
    ],
    contracts: [
      { 
        id: 3, 
        campId: 2,
        campName: "Spring Training Clinic",
        startDate: "2025-04-10", 
        endDate: "2025-04-12",
        services: ["Team Photos", "Highlight Video"],
        totalValue: 1700,
        status: "pending"
      }
    ],
    documents: [
      { id: 7, name: "Service Contract", status: "draft", date: "2025-03-25" },
      { id: 8, name: "Insurance Certificate", status: "pending", date: "" },
      { id: 9, name: "Portfolio", status: "received", date: "2025-03-20" }
    ],
    notes: "New vendor, highly recommended by other camp organizers. Portfolio shows excellent work with sports events."
  }
];

// Format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
};

// Format date for display
const formatDate = (dateString: string) => {
  if (!dateString) return "";
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
};

// Get status badge color
const getStatusColor = (status: string) => {
  switch(status.toLowerCase()) {
    case 'active':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    case 'inactive':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    case 'confirmed':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'signed':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'verified':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'received':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    case 'draft':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  }
};

// Get category icon
const getCategoryIcon = (category: string) => {
  switch(category.toLowerCase()) {
    case 'food':
      return <Utensils className="h-5 w-5" />;
    case 'transportation':
      return <Truck className="h-5 w-5" />;
    case 'accommodation':
      return <Home className="h-5 w-5" />;
    case 'equipment':
      return <Package className="h-5 w-5" />;
    case 'media':
      return <Camera className="h-5 w-5" />;
    case 'awards':
      return <Award className="h-5 w-5" />;
    default:
      return <ShoppingBag className="h-5 w-5" />;
  }
};

// Star rating component
const StarRating = ({ rating }: { rating: number }) => {
  return (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= Math.round(rating)
              ? 'text-yellow-400 fill-yellow-400'
              : 'text-gray-300'
          }`}
        />
      ))}
      <span className="ml-1 text-sm text-gray-600">{rating.toFixed(1)}</span>
    </div>
  );
};

// Vendor Details Component
const VendorDetails = ({ vendor, onClose }: { vendor: any, onClose: () => void }) => {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Vendor Details</DialogTitle>
          <DialogDescription>
            Complete information about the vendor and services
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Information Column */}
          <div className="md:col-span-1">
            <div className="flex flex-col items-center mb-6">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarImage src={vendor.logo} />
                <AvatarFallback className="text-lg bg-brand-100 text-brand-800">
                  {getCategoryIcon(vendor.category)}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-bold text-center">{vendor.name}</h2>
              <p className="text-sm text-gray-500 mb-2">{vendor.category}</p>
              <Badge className={getStatusColor(vendor.status)}>
                {vendor.status.charAt(0).toUpperCase() + vendor.status.slice(1)}
              </Badge>
              <div className="mt-2">
                <StarRating rating={vendor.rating} />
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start gap-2">
                <Building className="h-4 w-4 text-gray-400 mt-1" />
                <div>
                  <p className="font-medium text-sm">Address</p>
                  <p className="text-sm">{vendor.address}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <Mail className="h-4 w-4 text-gray-400 mt-1" />
                <div>
                  <p className="font-medium text-sm">Email</p>
                  <p className="text-sm">{vendor.email}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <Phone className="h-4 w-4 text-gray-400 mt-1" />
                <div>
                  <p className="font-medium text-sm">Phone</p>
                  <p className="text-sm">{vendor.phone}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <User className="h-4 w-4 text-gray-400 mt-1" />
                <div>
                  <p className="font-medium text-sm">Contact Person</p>
                  <p className="text-sm">{vendor.contactName}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <LinkIcon className="h-4 w-4 text-gray-400 mt-1" />
                <div>
                  <p className="font-medium text-sm">Website</p>
                  <p className="text-sm">{vendor.website}</p>
                </div>
              </div>
            </div>
            
            <Separator className="my-4" />
            
            <div>
              <h3 className="font-medium text-sm mb-2">Notes</h3>
              <p className="text-sm">{vendor.notes}</p>
            </div>
          </div>
          
          {/* Details Column */}
          <div className="md:col-span-2 space-y-6">
            <div>
              <h3 className="font-medium mb-3">About</h3>
              <p className="text-sm">{vendor.description}</p>
            </div>
            
            <div>
              <h3 className="font-medium mb-3">Services Offered</h3>
              <div className="space-y-3">
                {vendor.services.map((service: any, index: number) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{service.name}</h4>
                          <p className="text-sm text-gray-500">{service.description}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline">{service.price}</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="font-medium mb-3">Current Contracts</h3>
              {vendor.contracts.length > 0 ? (
                <div className="space-y-3">
                  {vendor.contracts.map((contract: any) => (
                    <Card key={contract.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-medium">{contract.campName}</h4>
                            <p className="text-sm text-gray-500">
                              {formatDate(contract.startDate)} - {formatDate(contract.endDate)}
                            </p>
                          </div>
                          <Badge className={getStatusColor(contract.status)}>
                            {contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                          <div>
                            <p className="text-sm font-medium">Services:</p>
                            <ul className="list-disc list-inside text-sm">
                              {contract.services.map((service: string, i: number) => (
                                <li key={i}>{service}</li>
                              ))}
                            </ul>
                          </div>
                          <div className="flex flex-col md:items-end">
                            <p className="text-sm font-medium">Contract Value:</p>
                            <p className="text-xl font-bold">{formatCurrency(contract.totalValue)}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No active contracts</p>
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
                    {vendor.documents.map((doc: any) => (
                      <tr key={doc.id} className="border-b hover:bg-gray-50">
                        <td className="p-2 text-sm">
                          <div className="flex items-center">
                            <FileText className="h-4 w-4 text-gray-400 mr-2" />
                            {doc.name}
                          </div>
                        </td>
                        <td className="p-2 text-sm">
                          <Badge className={getStatusColor(doc.status)}>
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
        
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button variant="outline">Download Info</Button>
          <Button className="bg-brand-600 hover:bg-brand-700">Edit Vendor</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default function VendorsServices() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [campFilter, setCampFilter] = useState("all");
  const [selectedVendor, setSelectedVendor] = useState<any | null>(null);
  
  // In a real app, you would fetch vendors from the server
  const { data: vendors = sampleVendors, isLoading } = useQuery({
    queryKey: ['/api/vendors'],
    enabled: false, // Disabled for now as we're using sample data
  });
  
  // Filter vendors based on search and filters
  const filteredVendors = vendors.filter((vendor: any) => {
    // Apply search term
    const matchesSearch = 
      vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      vendor.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Apply category filter
    const matchesCategory = categoryFilter === "all" || vendor.category.toLowerCase() === categoryFilter.toLowerCase();
    
    // Apply status filter
    const matchesStatus = statusFilter === "all" || vendor.status.toLowerCase() === statusFilter.toLowerCase();
    
    // Apply camp filter
    const matchesCamp = campFilter === "all" || 
      vendor.contracts.some((contract: any) => contract.campId.toString() === campFilter);
    
    return matchesSearch && matchesCategory && matchesStatus && matchesCamp;
  });
  
  // Get unique categories for filter
  const categories = Array.from(new Set(vendors.map((vendor: any) => vendor.category)));
  
  // Get unique camps for filter
  const camps = Array.from(
    new Set(
      vendors.flatMap((vendor: any) => vendor.contracts.map((contract: any) => ({
        id: contract.campId,
        name: contract.campName
      }))).map(JSON.stringify)
    )
  ).map(JSON.parse);
  
  // Remove duplicates by id
  const uniqueCamps = Array.from(new Map(camps.map((camp: any) => [camp.id, camp])).values());

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Vendors & Services</h1>
          <p className="text-gray-500 mt-1">Manage vendors, services, and contracts for your camps</p>
        </div>
        <div className="mt-4 md:mt-0 space-x-2">
          <Button variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Add Contract
          </Button>
          <Button className="bg-brand-600 hover:bg-brand-700">
            <Plus className="mr-2 h-4 w-4" />
            Add Vendor
          </Button>
        </div>
      </div>
      
      {/* Filters Row */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-grow md:max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search vendors..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category, index) => (
              <SelectItem key={index} value={category.toLowerCase()}>{category}</SelectItem>
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
      <Tabs defaultValue="vendors" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="vendors">Vendors</TabsTrigger>
          <TabsTrigger value="contracts">Contracts</TabsTrigger>
          <TabsTrigger value="services">Service Catalog</TabsTrigger>
        </TabsList>
        
        {/* Vendors Tab */}
        <TabsContent value="vendors" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVendors.map((vendor: any) => (
              <Card key={vendor.id} className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedVendor(vendor)}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={vendor.logo} />
                        <AvatarFallback className="bg-brand-100 text-brand-800">
                          {getCategoryIcon(vendor.category)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle>{vendor.name}</CardTitle>
                        <CardDescription>{vendor.category}</CardDescription>
                      </div>
                    </div>
                    <Badge className={getStatusColor(vendor.status)}>
                      {vendor.status.charAt(0).toUpperCase() + vendor.status.slice(1)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{vendor.contactName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{vendor.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{vendor.phone}</span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <StarRating rating={vendor.rating} />
                      <span className="text-sm text-gray-500">
                        {vendor.contracts.length} contract{vendor.contracts.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-gray-50 pt-2 pb-2 flex justify-between">
                  <Button variant="ghost" size="sm">View Services</Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Edit Vendor</DropdownMenuItem>
                      <DropdownMenuItem>Create Contract</DropdownMenuItem>
                      <DropdownMenuItem>View Documents</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardFooter>
              </Card>
            ))}
          </div>
          
          {filteredVendors.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <p className="text-muted-foreground mb-4">No vendors found with the current filters</p>
                <Button onClick={() => {
                  setSearchTerm("");
                  setCategoryFilter("all");
                  setStatusFilter("all");
                  setCampFilter("all");
                }}>Clear Filters</Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* Contracts Tab */}
        <TabsContent value="contracts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Active Contracts</CardTitle>
              <CardDescription>
                View and manage all service contracts for your camps
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-medium">Vendor</th>
                      <th className="text-left p-4 font-medium">Camp</th>
                      <th className="text-left p-4 font-medium">Dates</th>
                      <th className="text-left p-4 font-medium">Services</th>
                      <th className="text-left p-4 font-medium">Value</th>
                      <th className="text-left p-4 font-medium">Status</th>
                      <th className="text-right p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vendors.flatMap(vendor => 
                      vendor.contracts.map(contract => ({...contract, vendor}))
                    ).filter(contract => 
                      (campFilter === "all" || contract.campId.toString() === campFilter) &&
                      (categoryFilter === "all" || contract.vendor.category.toLowerCase() === categoryFilter.toLowerCase()) &&
                      (statusFilter === "all" || contract.status.toLowerCase() === statusFilter.toLowerCase())
                    ).map((contract: any) => (
                      <tr key={`${contract.vendor.id}-${contract.id}`} className="border-b hover:bg-gray-50">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={contract.vendor.logo} />
                              <AvatarFallback className="bg-brand-100 text-brand-800">
                                {getCategoryIcon(contract.vendor.category)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{contract.vendor.name}</div>
                              <div className="text-sm text-gray-500">{contract.vendor.category}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">{contract.campName}</td>
                        <td className="p-4">
                          <div className="text-sm">{formatDate(contract.startDate)}</div>
                          <div className="text-sm text-gray-500">to {formatDate(contract.endDate)}</div>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-wrap gap-1">
                            {contract.services.map((service: string, index: number) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {service}
                              </Badge>
                            ))}
                          </div>
                        </td>
                        <td className="p-4 font-medium">{formatCurrency(contract.totalValue)}</td>
                        <td className="p-4">
                          <Badge className={getStatusColor(contract.status)}>
                            {contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}
                          </Badge>
                        </td>
                        <td className="p-4 text-right">
                          <Button variant="ghost" size="sm" onClick={() => setSelectedVendor(contract.vendor)}>
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2 bg-gray-50 p-3">
              <Button variant="outline" size="sm">
                <FileText className="mr-2 h-4 w-4" />
                Export Contracts
              </Button>
              <Button size="sm" className="bg-brand-600 hover:bg-brand-700">
                <Plus className="mr-2 h-4 w-4" />
                New Contract
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Services Catalog Tab */}
        <TabsContent value="services" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Service Catalog</CardTitle>
              <CardDescription>
                Browse all available services from our vendors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {vendors
                  .filter(vendor => 
                    (categoryFilter === "all" || vendor.category.toLowerCase() === categoryFilter.toLowerCase()) &&
                    (statusFilter === "all" || vendor.status.toLowerCase() === statusFilter.toLowerCase())
                  )
                  .flatMap(vendor => 
                    vendor.services.map(service => ({...service, vendor}))
                  )
                  .filter(service => 
                    service.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                    service.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    service.vendor.name.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((service: any, index: number) => (
                    <Card key={index} className="overflow-hidden hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{service.name}</CardTitle>
                            <CardDescription>
                              Provided by {service.vendor.name}
                            </CardDescription>
                          </div>
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={service.vendor.logo} />
                            <AvatarFallback className="bg-brand-100 text-brand-800">
                              {getCategoryIcon(service.vendor.category)}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm mb-3">{service.description}</p>
                        <div className="flex justify-between items-center">
                          <Badge className={getStatusColor(service.vendor.status)}>
                            {service.vendor.status.charAt(0).toUpperCase() + service.vendor.status.slice(1)}
                          </Badge>
                          <p className="font-medium">{service.price}</p>
                        </div>
                      </CardContent>
                      <CardFooter className="bg-gray-50 pt-2 pb-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="ml-auto"
                          onClick={() => setSelectedVendor(service.vendor)}
                        >
                          View Vendor
                        </Button>
                      </CardFooter>
                    </Card>
                  ))
                }
              </div>
              
              {vendors
                .filter(vendor => 
                  (categoryFilter === "all" || vendor.category.toLowerCase() === categoryFilter.toLowerCase()) &&
                  (statusFilter === "all" || vendor.status.toLowerCase() === statusFilter.toLowerCase())
                )
                .flatMap(vendor => 
                  vendor.services.map(service => ({...service, vendor}))
                )
                .filter(service => 
                  service.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                  service.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  service.vendor.name.toLowerCase().includes(searchTerm.toLowerCase())
                ).length === 0 && (
                <div className="flex flex-col items-center justify-center py-8">
                  <p className="text-muted-foreground mb-4">No services found with the current filters</p>
                  <Button onClick={() => {
                    setSearchTerm("");
                    setCategoryFilter("all");
                    setStatusFilter("all");
                  }}>Clear Filters</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Vendor Details Dialog */}
      {selectedVendor && (
        <VendorDetails 
          vendor={selectedVendor} 
          onClose={() => setSelectedVendor(null)} 
        />
      )}
    </div>
  );
}