import React, { useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronLeft,
  Save,
  Trash2,
  Plus,
  Download,
  Search,
  Loader2,
  Filter,
  ArrowUpDown,
  Printer,
  FileCheck,
  ShoppingBag,
  Package,
  CheckCircle2,
  CircleDashed,
  ShirtIcon,
  FileText,
  Camera,
  Settings,
  MoreHorizontal,
  Import,
  ListFilter,
  DollarSign
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
  DialogClose,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDate, formatCurrency } from "@/lib/utils";

// Types
interface SwagItem {
  id: number;
  name: string;
  description?: string;
  type: 'shirt' | 'hoodie' | 'hat' | 'bag' | 'poster' | 'other';
  sizes?: string[];
  colors?: string[];
  isOptional: boolean;
  additionalCost?: number;
  imageUrl?: string;
  packingInstructions?: string;
  stock?: Record<string, number>; // size -> quantity
  distributionStatus?: {
    packed: number;
    distributed: number;
    total: number;
  };
}

interface PackingItem {
  id: number;
  registrationId: number;
  participantName: string;
  packageId: string;
  items: {
    itemId: number;
    name: string;
    type: string;
    size?: string;
    color?: string;
    notes?: string;
  }[];
  status: 'pending' | 'packed' | 'distributed' | 'cancelled';
  labelPrinted: boolean;
  packedBy?: string;
  packedAt?: string;
  distributedBy?: string;
  distributedAt?: string;
  specialInstructions?: string;
}

interface SizeDistribution {
  size: string;
  quantity: number;
  packed: number;
  available: number;
  required: number;
}

function SwagManager() {
  const [location, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const campId = searchParams.get('id');
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedSwagItem, setSelectedSwagItem] = useState<SwagItem | null>(null);
  const [showAddItem, setShowAddItem] = useState(false);
  const [showEditSizes, setShowEditSizes] = useState(false);
  const [showDistributionDetails, setShowDistributionDetails] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showPrintLabels, setShowPrintLabels] = useState(false);
  const [selectedPackages, setSelectedPackages] = useState<number[]>([]);
  const [newSwagItem, setNewSwagItem] = useState<Partial<SwagItem>>({
    name: '',
    type: 'shirt',
    isOptional: false,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: ['Black']
  });
  
  // Fetch camp details
  const { 
    data: camp, 
    isLoading: isLoadingCamp,
    isError: isCampError
  } = useQuery({
    queryKey: ['/api/camps', campId],
    enabled: !!campId,
  });
  
  // Fetch swag items
  const {
    data: swagItems,
    isLoading: isLoadingSwagItems
  } = useQuery({
    queryKey: ['/api/camps', campId, 'swag'],
    enabled: !!campId,
  });
  
  // Fetch packing and distribution data
  const {
    data: packingData,
    isLoading: isLoadingPackingData
  } = useQuery({
    queryKey: ['/api/camps', campId, 'swag/distribution'],
    enabled: !!campId,
  });
  
  // Fetch registration data for size analysis
  const {
    data: registrations,
    isLoading: isLoadingRegistrations
  } = useQuery({
    queryKey: ['/api/camps', campId, 'registrations'],
    enabled: !!campId,
  });
  
  // Create swag item mutation
  const createSwagItemMutation = useMutation({
    mutationFn: async (swagItemData: Partial<SwagItem>) => {
      const response = await apiRequest(
        "POST",
        `/api/camps/${campId}/swag`,
        swagItemData
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Swag item created",
        description: "New swag item has been added successfully."
      });
      queryClient.invalidateQueries({
        queryKey: ['/api/camps', campId, 'swag']
      });
      setShowAddItem(false);
      setNewSwagItem({
        name: '',
        type: 'shirt',
        isOptional: false,
        sizes: ['S', 'M', 'L', 'XL', 'XXL'],
        colors: ['Black']
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create swag item",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Update swag item mutation
  const updateSwagItemMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<SwagItem> }) => {
      const response = await apiRequest(
        "PUT",
        `/api/camps/${campId}/swag/${id}`,
        data
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Swag item updated",
        description: "Swag item has been updated successfully."
      });
      queryClient.invalidateQueries({
        queryKey: ['/api/camps', campId, 'swag']
      });
      setShowEditSizes(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update swag item",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Update distribution status mutation
  const updateDistributionMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: 'pending' | 'packed' | 'distributed' | 'cancelled' }) => {
      const response = await apiRequest(
        "PUT",
        `/api/camps/${campId}/swag/distribution/${id}`,
        { status }
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Status updated",
        description: "Distribution status has been updated successfully."
      });
      queryClient.invalidateQueries({
        queryKey: ['/api/camps', campId, 'swag/distribution']
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update status",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Print labels mutation
  const printLabelsMutation = useMutation({
    mutationFn: async (packageIds: number[]) => {
      const response = await apiRequest(
        "POST",
        `/api/camps/${campId}/swag/print-labels`,
        { packageIds }
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Labels printed",
        description: "Package labels have been sent to the printer."
      });
      queryClient.invalidateQueries({
        queryKey: ['/api/camps', campId, 'swag/distribution']
      });
      setShowPrintLabels(false);
      setSelectedPackages([]);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to print labels",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Create swag item
  const handleCreateSwagItem = () => {
    if (!newSwagItem.name) {
      toast({
        title: "Missing information",
        description: "Please provide a name for the swag item.",
        variant: "destructive"
      });
      return;
    }
    
    createSwagItemMutation.mutate(newSwagItem);
  };
  
  // Update swag item sizes
  const handleUpdateSizes = () => {
    if (!selectedSwagItem) return;
    
    updateSwagItemMutation.mutate({
      id: selectedSwagItem.id,
      data: {
        sizes: selectedSwagItem.sizes,
        stock: selectedSwagItem.stock
      }
    });
  };
  
  // Update distribution status
  const handleUpdateDistributionStatus = (id: number, status: 'pending' | 'packed' | 'distributed' | 'cancelled') => {
    updateDistributionMutation.mutate({ id, status });
  };
  
  // Print selected labels
  const handlePrintLabels = () => {
    if (selectedPackages.length === 0) {
      toast({
        title: "No packages selected",
        description: "Please select at least one package to print labels for.",
        variant: "destructive"
      });
      return;
    }
    
    printLabelsMutation.mutate(selectedPackages);
  };
  
  // Export swag data to CSV
  const handleExportSwagData = () => {
    if (!swagItems?.data) return;
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Swag Item,Type,Optional,Sizes,Colors,Additional Cost\n";
    
    swagItems.data.forEach((item: SwagItem) => {
      const row = [
        item.name,
        item.type,
        item.isOptional ? "Yes" : "No",
        item.sizes?.join(', ') || "N/A",
        item.colors?.join(', ') || "N/A",
        item.additionalCost ? formatCurrency(item.additionalCost) : "$0.00"
      ];
      csvContent += row.join(',') + "\n";
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `swag_items_camp${campId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Export packing slips
  const handleExportPackingSlips = () => {
    if (!packingData?.data) return;
    
    toast({
      title: "Exporting packing slips",
      description: "Your packing slips are being generated and will download shortly."
    });
    
    // In a real implementation, this would call the API to generate PDFs
    // For now, we'll just create a simple text representation
    let packingSlipText = "PACKING SLIPS\n\n";
    
    packingData.data.forEach((packingItem: PackingItem) => {
      packingSlipText += `PACKAGE ID: ${packingItem.packageId}\n`;
      packingSlipText += `PARTICIPANT: ${packingItem.participantName}\n`;
      packingSlipText += "ITEMS:\n";
      
      packingItem.items.forEach(item => {
        packingSlipText += `- ${item.name} (${item.size || 'N/A'}, ${item.color || 'N/A'})\n`;
      });
      
      packingSlipText += "\n-----------------------------------\n\n";
    });
    
    const blob = new Blob([packingSlipText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `packing_slips_camp${campId}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };
  
  // Toggle selection of a package
  const togglePackageSelection = (id: number) => {
    if (selectedPackages.includes(id)) {
      setSelectedPackages(selectedPackages.filter(packageId => packageId !== id));
    } else {
      setSelectedPackages([...selectedPackages, id]);
    }
  };
  
  // Select all packages
  const toggleSelectAll = () => {
    if (!packingData?.data) return;
    
    const filteredPackages = packingData.data
      .filter(pkg => statusFilter === 'all' || pkg.status === statusFilter)
      .filter(pkg => pkg.participantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                     pkg.packageId.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (selectedPackages.length === filteredPackages.length) {
      setSelectedPackages([]);
    } else {
      setSelectedPackages(filteredPackages.map(pkg => pkg.id));
    }
  };
  
  // Calculate size requirements
  const calculateSizeRequirements = (itemId: number): SizeDistribution[] => {
    if (!registrations?.data || !swagItems?.data) return [];
    
    const item = swagItems.data.find((item: SwagItem) => item.id === itemId);
    if (!item || !item.sizes) return [];
    
    const sizeDistribution: Record<string, SizeDistribution> = {};
    
    // Initialize size distribution
    item.sizes.forEach(size => {
      sizeDistribution[size] = {
        size,
        quantity: 0,
        packed: 0,
        available: item.stock?.[size] || 0,
        required: 0
      };
    });
    
    // Count sizes from registrations
    if (item.type === 'shirt') {
      registrations.data.forEach((registration: any) => {
        const size = registration.shirtSize;
        if (size && sizeDistribution[size]) {
          sizeDistribution[size].required += 1;
        }
      });
    }
    
    // Count packed items
    if (packingData?.data) {
      packingData.data.forEach((pkg: PackingItem) => {
        pkg.items.forEach(pkgItem => {
          if (pkgItem.itemId === itemId && pkgItem.size && sizeDistribution[pkgItem.size]) {
            sizeDistribution[pkgItem.size].packed += 1;
          }
        });
      });
    }
    
    // Calculate quantity (available - packed)
    Object.values(sizeDistribution).forEach(dist => {
      dist.quantity = dist.available - dist.packed;
    });
    
    return Object.values(sizeDistribution);
  };
  
  // Go back to camp project
  const handleBackToCamp = () => {
    window.location.href = `/events/camp-project?id=${campId}`;
  };
  
  // Generate packing status label
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'packed':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Packed</Badge>;
      case 'distributed':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Distributed</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-100 text-red-800">Cancelled</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };
  
  // Get item type icon
  const getItemTypeIcon = (type: string) => {
    switch (type) {
      case 'shirt':
        return <ShirtIcon className="h-4 w-4" />;
      case 'hoodie':
        return <ShirtIcon className="h-4 w-4" />;
      case 'hat':
        return <ShirtIcon className="h-4 w-4" />;
      case 'bag':
        return <ShoppingBag className="h-4 w-4" />;
      case 'poster':
        return <FileText className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };
  
  // Loading state
  if (isLoadingCamp) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // Error state
  if (isCampError || !camp?.data) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <Button variant="outline" onClick={handleBackToCamp}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Camp
          </Button>
        </div>
        
        <Card className="mx-auto max-w-md text-center p-6">
          <CardHeader>
            <CardTitle>Camp Not Found</CardTitle>
            <CardDescription>
              The camp you are looking for does not exist or you don't have permission to view it.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button onClick={() => window.location.href = '/events/overview'}>
              View All Camps
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  const campData = camp.data;
  const swagItemsData = swagItems?.data || [];
  const packingItems = packingData?.data || [];
  
  // Filter packing items based on search and status filter
  const filteredPackingItems = packingItems
    .filter(item => statusFilter === 'all' || item.status === statusFilter)
    .filter(item => 
      item.participantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.packageId.toLowerCase().includes(searchTerm.toLowerCase())
    );
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleBackToCamp} className="mr-2">
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:block ml-1">Back to Camp</span>
            </Button>
            <h1 className="text-2xl font-bold md:text-3xl">Swag Pack Manager</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            {campData.name} - {formatDate(campData.startDate)} to {formatDate(campData.endDate)}
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={handleExportSwagData}>
                Export Swag Items
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportPackingSlips}>
                Export Packing Slips
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button onClick={() => setShowAddItem(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Swag Item
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 md:w-[600px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {isLoadingSwagItems ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Swag Stats */}
              <div className="md:col-span-4 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Swag Pack Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Total Items</span>
                      </div>
                      <span className="font-medium">{swagItemsData.length}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <ShirtIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Shirts/Apparel</span>
                      </div>
                      <span className="font-medium">
                        {swagItemsData.filter(item => ['shirt', 'hoodie', 'hat'].includes(item.type)).length}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Accessories</span>
                      </div>
                      <span className="font-medium">
                        {swagItemsData.filter(item => !['shirt', 'hoodie', 'hat'].includes(item.type)).length}
                      </span>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Packs Distributed</span>
                      </div>
                      <span className="font-medium">
                        {packingItems.filter(item => item.status === 'distributed').length} of {packingItems.length}
                      </span>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Distribution Progress</span>
                        <span>
                          {packingItems.length ? 
                            Math.round((packingItems.filter(item => item.status === 'distributed').length / packingItems.length) * 100) : 0}%
                        </span>
                      </div>
                      <Progress 
                        value={packingItems.length ? 
                          (packingItems.filter(item => item.status === 'distributed').length / packingItems.length) * 100 : 0} 
                      />
                    </div>
                  </CardContent>
                </Card>
                
                {/* Size Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle>Size Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoadingRegistrations ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    ) : swagItemsData.filter(item => item.type === 'shirt').length === 0 ? (
                      <div className="text-center py-4 text-muted-foreground">
                        <p>No shirt items to show size distribution for.</p>
                      </div>
                    ) : (
                      <div>
                        {swagItemsData
                          .filter(item => item.type === 'shirt')
                          .slice(0, 1)
                          .map(item => {
                            const sizeData = calculateSizeRequirements(item.id);
                            return (
                              <div key={item.id} className="space-y-3">
                                <h3 className="text-sm font-medium">{item.name}</h3>
                                
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Size</TableHead>
                                      <TableHead className="text-right">Required</TableHead>
                                      <TableHead className="text-right">In Stock</TableHead>
                                      <TableHead className="text-right">Status</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {sizeData.map(size => (
                                      <TableRow key={size.size}>
                                        <TableCell className="font-medium">{size.size}</TableCell>
                                        <TableCell className="text-right">{size.required}</TableCell>
                                        <TableCell className="text-right">{size.available}</TableCell>
                                        <TableCell className="text-right">
                                          {size.available >= size.required ? (
                                            <Badge variant="outline" className="bg-green-100 text-green-800">Sufficient</Badge>
                                          ) : (
                                            <Badge variant="outline" className="bg-red-100 text-red-800">
                                              {size.required - size.available > 0 ? `Need ${size.required - size.available}` : 'Short'}
                                            </Badge>
                                          )}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                                
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="w-full"
                                  onClick={() => {
                                    setSelectedSwagItem(item);
                                    setShowEditSizes(true);
                                  }}
                                >
                                  Update Sizes & Stock
                                </Button>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              {/* Swag Items */}
              <div className="md:col-span-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Swag Items</CardTitle>
                    <CardDescription>
                      Items included in the camp swag packs
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {swagItemsData.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>No swag items have been added yet.</p>
                        <Button 
                          variant="outline" 
                          onClick={() => setShowAddItem(true)} 
                          className="mt-4"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add First Item
                        </Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {swagItemsData.map((item: SwagItem) => (
                          <Card key={item.id} className="overflow-hidden">
                            <div className="h-1 w-full bg-primary" />
                            <CardHeader className="p-4 pb-2">
                              <div className="flex justify-between">
                                <CardTitle className="text-base flex items-center">
                                  {getItemTypeIcon(item.type)}
                                  <span className="ml-2">{item.name}</span>
                                </CardTitle>
                                {item.isOptional && (
                                  <Badge variant="outline">Optional</Badge>
                                )}
                              </div>
                              {item.description && (
                                <CardDescription className="text-xs mt-1">
                                  {item.description}
                                </CardDescription>
                              )}
                            </CardHeader>
                            <CardContent className="p-4 pt-2 pb-3">
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                  <span className="text-muted-foreground">Type:</span>{' '}
                                  <span className="capitalize">{item.type}</span>
                                </div>
                                
                                {item.additionalCost && (
                                  <div>
                                    <span className="text-muted-foreground">Add-on Cost:</span>{' '}
                                    <span>{formatCurrency(item.additionalCost)}</span>
                                  </div>
                                )}
                                
                                {item.sizes && item.sizes.length > 0 && (
                                  <div className="col-span-2">
                                    <span className="text-muted-foreground">Sizes:</span>{' '}
                                    <span>{item.sizes.join(', ')}</span>
                                  </div>
                                )}
                                
                                {item.colors && item.colors.length > 0 && (
                                  <div className="col-span-2">
                                    <span className="text-muted-foreground">Colors:</span>{' '}
                                    <span>{item.colors.join(', ')}</span>
                                  </div>
                                )}
                                
                                {item.distributionStatus && (
                                  <div className="col-span-2 mt-1">
                                    <div className="space-y-1">
                                      <div className="flex justify-between text-xs">
                                        <span>Distribution</span>
                                        <span>
                                          {item.distributionStatus.distributed}/{item.distributionStatus.total}
                                        </span>
                                      </div>
                                      <Progress 
                                        value={
                                          item.distributionStatus.total > 0 ?
                                          (item.distributionStatus.distributed / item.distributionStatus.total) * 100 : 0
                                        } 
                                        className="h-1.5"
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                            <CardFooter className="p-2 border-t bg-gray-50 flex justify-end">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  <DropdownMenuItem 
                                    onClick={() => {
                                      setSelectedSwagItem(item);
                                      setShowEditSizes(true);
                                    }}
                                  >
                                    <Settings className="mr-2 h-4 w-4" />
                                    Edit Sizes & Stock
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedSwagItem(item);
                                      setShowDistributionDetails(true);
                                    }}
                                  >
                                    <ShoppingBag className="mr-2 h-4 w-4" />
                                    Distribution Details
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </CardFooter>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>
        
        {/* Inventory Tab */}
        <TabsContent value="inventory" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Management</CardTitle>
              <CardDescription>
                Track and manage inventory for all swag items
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingSwagItems ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : swagItemsData.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No swag items have been added yet.</p>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowAddItem(true)} 
                    className="mt-4"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add First Item
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Sizes</TableHead>
                      <TableHead className="text-center">Stock</TableHead>
                      <TableHead className="text-center">Required</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {swagItemsData.map((item: SwagItem) => {
                      const sizeData = item.sizes && item.sizes.length > 0 
                        ? calculateSizeRequirements(item.id) 
                        : [];
                      
                      const totalStock = sizeData.reduce((sum, size) => sum + size.available, 0);
                      const totalRequired = sizeData.reduce((sum, size) => sum + size.required, 0);
                      const hasSufficientStock = totalStock >= totalRequired;
                      
                      return (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="font-medium">{item.name}</div>
                            {item.description && (
                              <div className="text-xs text-muted-foreground">{item.description}</div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              {getItemTypeIcon(item.type)}
                              <span className="ml-2 capitalize">{item.type}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {item.sizes && item.sizes.length > 0 ? (
                              <span>{item.sizes.join(', ')}</span>
                            ) : (
                              <span className="text-muted-foreground">N/A</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="font-medium">{totalStock}</span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="font-medium">{totalRequired}</span>
                          </TableCell>
                          <TableCell className="text-center">
                            {hasSufficientStock ? (
                              <Badge variant="outline" className="bg-green-100 text-green-800">Sufficient</Badge>
                            ) : (
                              <Badge variant="outline" className="bg-red-100 text-red-800">
                                {totalRequired - totalStock > 0 ? `Need ${totalRequired - totalStock}` : 'Short'}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedSwagItem(item);
                                setShowEditSizes(true);
                              }}
                            >
                              <Settings className="h-4 w-4 mr-1" />
                              <span className="hidden sm:inline">Update Stock</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Distribution Tab */}
        <TabsContent value="distribution" className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
              <div className="relative flex-grow w-full md:w-auto">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search participants or packages..."
                  className="pl-8 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="packed">Packed</SelectItem>
                  <SelectItem value="distributed">Distributed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex gap-2 w-full md:w-auto">
              <Button
                variant="outline"
                onClick={() => setShowPrintLabels(true)}
                disabled={selectedPackages.length === 0}
                className="w-full md:w-auto"
              >
                <Printer className="mr-2 h-4 w-4" />
                Print Labels ({selectedPackages.length})
              </Button>
              
              <Button 
                onClick={handleExportPackingSlips}
                className="w-full md:w-auto"
              >
                <FileCheck className="mr-2 h-4 w-4" />
                Packing Slips
              </Button>
            </div>
          </div>
          
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Swag Pack Distribution</CardTitle>
                  <CardDescription>
                    Track and manage the distribution of swag packs
                  </CardDescription>
                </div>
                <div>
                  <Checkbox 
                    id="select-all" 
                    checked={
                      filteredPackingItems.length > 0 && 
                      selectedPackages.length === filteredPackingItems.length
                    }
                    onCheckedChange={toggleSelectAll}
                  />
                  <Label htmlFor="select-all" className="ml-2">Select All</Label>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingPackingData ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredPackingItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No swag packs {searchTerm ? 'match your search criteria' : 'have been created yet'}.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]"></TableHead>
                      <TableHead>Package ID</TableHead>
                      <TableHead>Participant</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPackingItems.map((item: PackingItem) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Checkbox 
                            checked={selectedPackages.includes(item.id)}
                            onCheckedChange={() => togglePackageSelection(item.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {item.packageId}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{item.participantName}</div>
                          <div className="text-xs text-muted-foreground">
                            Registration #{item.registrationId}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <span className="font-medium">{item.items.length}</span>
                            <span className="text-muted-foreground">items</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {item.items.map(i => i.name).join(', ')}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(item.status)}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => handleUpdateDistributionStatus(item.id, 'pending')}
                                disabled={item.status === 'pending'}
                              >
                                <CircleDashed className="mr-2 h-4 w-4" />
                                Mark as Pending
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleUpdateDistributionStatus(item.id, 'packed')}
                                disabled={item.status === 'packed'}
                              >
                                <ShoppingBag className="mr-2 h-4 w-4" />
                                Mark as Packed
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleUpdateDistributionStatus(item.id, 'distributed')}
                                disabled={item.status === 'distributed'}
                              >
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Mark as Distributed
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleUpdateDistributionStatus(item.id, 'cancelled')}
                                disabled={item.status === 'cancelled'}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Cancel Package
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Add Swag Item Dialog */}
      <Dialog open={showAddItem} onOpenChange={setShowAddItem}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add Swag Item</DialogTitle>
            <DialogDescription>
              Add a new item to include in the camp swag packs
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="swag-name" className="text-right">
                Name
              </Label>
              <Input
                id="swag-name"
                value={newSwagItem.name}
                onChange={(e) => setNewSwagItem({...newSwagItem, name: e.target.value})}
                className="col-span-3"
                placeholder="Event T-Shirt"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="swag-type" className="text-right">
                Type
              </Label>
              <Select 
                value={newSwagItem.type}
                onValueChange={(value: any) => setNewSwagItem({...newSwagItem, type: value})}
              >
                <SelectTrigger id="swag-type" className="col-span-3">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="shirt">T-Shirt</SelectItem>
                  <SelectItem value="hoodie">Hoodie</SelectItem>
                  <SelectItem value="hat">Hat</SelectItem>
                  <SelectItem value="bag">Bag</SelectItem>
                  <SelectItem value="poster">Poster</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="swag-description" className="text-right">
                Description
              </Label>
              <Input
                id="swag-description"
                value={newSwagItem.description || ''}
                onChange={(e) => setNewSwagItem({...newSwagItem, description: e.target.value})}
                className="col-span-3"
                placeholder="Optional description"
              />
            </div>
            
            {/* Only show sizes for apparel items */}
            {['shirt', 'hoodie'].includes(newSwagItem.type || '') && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">
                  Sizes
                </Label>
                <div className="col-span-3 space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'].map(size => (
                      <Badge 
                        key={size}
                        variant={newSwagItem.sizes?.includes(size) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => {
                          const sizes = newSwagItem.sizes || [];
                          if (sizes.includes(size)) {
                            setNewSwagItem({...newSwagItem, sizes: sizes.filter(s => s !== size)});
                          } else {
                            setNewSwagItem({...newSwagItem, sizes: [...sizes, size]});
                          }
                        }}
                      >
                        {size}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Click to toggle size selections
                  </p>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">
                Optional
              </Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="swag-optional"
                  checked={newSwagItem.isOptional}
                  onCheckedChange={(value) => setNewSwagItem({...newSwagItem, isOptional: value})}
                />
                <Label htmlFor="swag-optional">
                  Add-on item (not in standard pack)
                </Label>
              </div>
            </div>
            
            {newSwagItem.isOptional && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="swag-cost" className="text-right">
                  Additional Cost
                </Label>
                <div className="col-span-3 relative">
                  <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    id="swag-cost"
                    type="number"
                    min="0"
                    step="0.01"
                    value={newSwagItem.additionalCost || ''}
                    onChange={(e) => setNewSwagItem({...newSwagItem, additionalCost: parseFloat(e.target.value) || 0})}
                    className="pl-8"
                    placeholder="0.00"
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddItem(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateSwagItem}>
              Add Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Sizes & Stock Dialog */}
      <Dialog open={showEditSizes} onOpenChange={setShowEditSizes}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Sizes & Stock</DialogTitle>
            <DialogDescription>
              Update sizes and stock levels for {selectedSwagItem?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedSwagItem && (
            <div className="py-4">
              <div className="space-y-4">
                {/* For apparel items, show size editor */}
                {['shirt', 'hoodie'].includes(selectedSwagItem.type) && (
                  <div>
                    <Label className="mb-2 block">Available Sizes</Label>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'].map(size => (
                        <Badge 
                          key={size}
                          variant={selectedSwagItem.sizes?.includes(size) ? 'default' : 'outline'}
                          className="cursor-pointer"
                          onClick={() => {
                            const sizes = selectedSwagItem.sizes || [];
                            if (sizes.includes(size)) {
                              setSelectedSwagItem({
                                ...selectedSwagItem, 
                                sizes: sizes.filter(s => s !== size)
                              });
                            } else {
                              setSelectedSwagItem({
                                ...selectedSwagItem, 
                                sizes: [...sizes, size]
                              });
                            }
                          }}
                        >
                          {size}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Stock editor for each size */}
                {selectedSwagItem.sizes && selectedSwagItem.sizes.length > 0 && (
                  <div>
                    <Label className="mb-2 block">Stock Quantities</Label>
                    <div className="space-y-2">
                      {selectedSwagItem.sizes.map(size => (
                        <div key={size} className="grid grid-cols-4 gap-2 items-center">
                          <Label className="text-right">{size}</Label>
                          <Input
                            type="number"
                            min="0"
                            className="col-span-3"
                            value={selectedSwagItem.stock?.[size] || 0}
                            onChange={(e) => {
                              const stock = {...(selectedSwagItem.stock || {})};
                              stock[size] = parseInt(e.target.value) || 0;
                              setSelectedSwagItem({...selectedSwagItem, stock});
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Size & stock analysis */}
                <div className="mt-6 pt-4 border-t">
                  <h3 className="text-sm font-medium mb-2">Size Requirements</h3>
                  
                  {selectedSwagItem.type === 'shirt' && selectedSwagItem.sizes && selectedSwagItem.sizes.length > 0 ? (
                    <div>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Size</TableHead>
                            <TableHead className="text-right">Required</TableHead>
                            <TableHead className="text-right">In Stock</TableHead>
                            <TableHead className="text-right">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {calculateSizeRequirements(selectedSwagItem.id).map(size => (
                            <TableRow key={size.size}>
                              <TableCell className="font-medium">{size.size}</TableCell>
                              <TableCell className="text-right">{size.required}</TableCell>
                              <TableCell className="text-right">{selectedSwagItem.stock?.[size.size] || 0}</TableCell>
                              <TableCell className="text-right">
                                {(selectedSwagItem.stock?.[size.size] || 0) >= size.required ? (
                                  <Badge variant="outline" className="bg-green-100 text-green-800">Sufficient</Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-red-100 text-red-800">
                                    {size.required - (selectedSwagItem.stock?.[size.size] || 0) > 0 ? 
                                      `Need ${size.required - (selectedSwagItem.stock?.[size.size] || 0)}` : 
                                      'Short'
                                    }
                                  </Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      Size requirements are only calculated for shirt items.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditSizes(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateSizes}>
              Update Sizes & Stock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Distribution Details Dialog */}
      <Dialog open={showDistributionDetails} onOpenChange={setShowDistributionDetails}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Distribution Details</DialogTitle>
            <DialogDescription>
              Distribution status for {selectedSwagItem?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedSwagItem && (
            <div className="py-4">
              {isLoadingPackingData ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold">
                            {packingItems.reduce((count, item) => {
                              const hasThisItem = item.items.some(i => i.itemId === selectedSwagItem.id);
                              return hasThisItem ? count + 1 : count;
                            }, 0)}
                          </div>
                          <p className="text-sm text-muted-foreground">Total Packs</p>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold">
                            {packingItems.reduce((count, item) => {
                              const hasThisItem = item.items.some(i => i.itemId === selectedSwagItem.id);
                              return hasThisItem && item.status === 'packed' ? count + 1 : count;
                            }, 0)}
                          </div>
                          <p className="text-sm text-muted-foreground">Packed</p>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold">
                            {packingItems.reduce((count, item) => {
                              const hasThisItem = item.items.some(i => i.itemId === selectedSwagItem.id);
                              return hasThisItem && item.status === 'distributed' ? count + 1 : count;
                            }, 0)}
                          </div>
                          <p className="text-sm text-muted-foreground">Distributed</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium mb-2">Distribution by Size</h3>
                    
                    {selectedSwagItem.type === 'shirt' && selectedSwagItem.sizes && selectedSwagItem.sizes.length > 0 ? (
                      <div className="space-y-3">
                        {selectedSwagItem.sizes.map(size => {
                          const sizeTotal = packingItems.reduce((count, item) => {
                            const matchingSizeItems = item.items.filter(
                              i => i.itemId === selectedSwagItem.id && i.size === size
                            );
                            return count + matchingSizeItems.length;
                          }, 0);
                          
                          const sizePacked = packingItems.reduce((count, item) => {
                            if (item.status !== 'packed' && item.status !== 'distributed') return count;
                            const matchingSizeItems = item.items.filter(
                              i => i.itemId === selectedSwagItem.id && i.size === size
                            );
                            return count + matchingSizeItems.length;
                          }, 0);
                          
                          const sizeDistributed = packingItems.reduce((count, item) => {
                            if (item.status !== 'distributed') return count;
                            const matchingSizeItems = item.items.filter(
                              i => i.itemId === selectedSwagItem.id && i.size === size
                            );
                            return count + matchingSizeItems.length;
                          }, 0);
                          
                          const distributionPercentage = sizeTotal > 0 ? 
                            (sizeDistributed / sizeTotal) * 100 : 0;
                          
                          return (
                            <div key={size} className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span>{size}</span>
                                <span className="text-muted-foreground">
                                  {sizeDistributed} of {sizeTotal} distributed
                                </span>
                              </div>
                              <Progress value={distributionPercentage} className="h-2" />
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Size distribution is only available for apparel items.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowDistributionDetails(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Print Labels Dialog */}
      <Dialog open={showPrintLabels} onOpenChange={setShowPrintLabels}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Print Package Labels</DialogTitle>
            <DialogDescription>
              Print labels for {selectedPackages.length} selected packages
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Package ID</TableHead>
                      <TableHead>Participant</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {packingItems
                      .filter(item => selectedPackages.includes(item.id))
                      .slice(0, 5)
                      .map(item => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.packageId}</TableCell>
                          <TableCell>{item.participantName}</TableCell>
                          <TableCell>{getStatusBadge(item.status)}</TableCell>
                        </TableRow>
                      ))}
                    
                    {selectedPackages.length > 5 && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground">
                          And {selectedPackages.length - 5} more packages...
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              
              <div className="space-y-2">
                <Label>Label Options</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="print-package-id" defaultChecked />
                      <Label htmlFor="print-package-id">Package ID</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="print-items" defaultChecked />
                      <Label htmlFor="print-items">Item List</Label>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="print-barcode" defaultChecked />
                      <Label htmlFor="print-barcode">Include Barcode</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="print-camp-name" defaultChecked />
                      <Label htmlFor="print-camp-name">Camp Name</Label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPrintLabels(false)}>
              Cancel
            </Button>
            <Button onClick={handlePrintLabels}>
              Print Labels
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default SwagManager;