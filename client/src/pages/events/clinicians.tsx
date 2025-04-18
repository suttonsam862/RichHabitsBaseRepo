import React, { useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronLeft,
  Plus,
  Search,
  Loader2,
  UserCog,
  Mail,
  Phone,
  Edit,
  Trash2,
  CheckCircle2,
  Calendar,
  Clipboard,
  Download,
  Upload,
  ArrowUpDown,
  Filter,
  MoreHorizontal,
  FileText,
  Star,
  ClipboardPaste,
  User2,
  Clock
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDate } from "@/lib/utils";

// Types
interface Clinician {
  id: number;
  name: string;
  email: string;
  phone?: string;
  specialties: string[];
  bio?: string;
  experience?: string;
  rating?: number;
  hourlyRate?: number;
  status: ClinicianStatus;
  availability?: AvailabilitySlot[];
  assignedSessions?: number;
  travelRequirements?: string;
  accommodationNeeds?: string;
  contractStatus?: ContractStatus;
  contractDate?: string;
  notes?: string;
  attachments?: Attachment[];
}

interface AvailabilitySlot {
  day: number;
  startTime: string;
  endTime: string;
}

interface Attachment {
  id: number;
  fileName: string;
  fileType: string;
  uploadDate: string;
  fileSize: number;
  url: string;
}

type ClinicianStatus = 
  | 'confirmed'
  | 'invited'
  | 'pending'
  | 'standby'
  | 'unavailable'
  | 'cancelled';

type ContractStatus = 
  | 'sent'
  | 'signed'
  | 'pending'
  | 'expired'
  | 'cancelled'
  | 'completed';

type ClinicianSpecialty =
  | 'wrestling'
  | 'mma'
  | 'boxing'
  | 'jiu-jitsu'
  | 'strength'
  | 'conditioning'
  | 'nutrition'
  | 'psychology'
  | 'recovery'
  | 'other';

function ClinicianModule() {
  const [location, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const campId = searchParams.get('campId');
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("roster");
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [specialtyFilter, setSpecialtyFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showAddClinician, setShowAddClinician] = useState(false);
  const [showEditClinician, setShowEditClinician] = useState(false);
  const [showContractDialog, setShowContractDialog] = useState(false);
  const [showAvailabilityDialog, setShowAvailabilityDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedClinicianId, setSelectedClinicianId] = useState<number | null>(null);
  
  const [newClinician, setNewClinician] = useState<Partial<Clinician>>({
    name: '',
    email: '',
    phone: '',
    specialties: [],
    status: 'pending'
  });
  
  const [newAvailability, setNewAvailability] = useState<AvailabilitySlot[]>([
    { day: 1, startTime: '08:00', endTime: '17:00' }
  ]);
  
  const [contractDetails, setContractDetails] = useState({
    hourlyRate: 0,
    totalHours: 0,
    startDate: '',
    endDate: '',
    accommodationProvided: true,
    travelProvided: true,
    notes: ''
  });
  
  const [fileUpload, setFileUpload] = useState<File | null>(null);
  const [uploadType, setUploadType] = useState<string>('contract');
  
  // Fetch camp details
  const { 
    data: camp, 
    isLoading: isLoadingCamp,
    isError: isCampError
  } = useQuery({
    queryKey: ['/api/camps', campId],
    enabled: !!campId,
  });
  
  // Fetch clinicians
  const {
    data: clinicians,
    isLoading: isLoadingClinicians
  } = useQuery({
    queryKey: ['/api/camps', campId, 'clinicians'],
    enabled: !!campId,
  });
  
  // Fetch clinician sessions
  const {
    data: clinicianSessions,
    isLoading: isLoadingSessions
  } = useQuery({
    queryKey: ['/api/camps', campId, 'clinician-sessions'],
    enabled: !!campId,
  });
  
  // Add clinician mutation
  const addClinicianMutation = useMutation({
    mutationFn: async (clinicianData: Partial<Clinician>) => {
      const response = await apiRequest(
        "POST",
        `/api/camps/${campId}/clinicians`,
        clinicianData
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Clinician added",
        description: "The clinician has been added to this camp."
      });
      queryClient.invalidateQueries({
        queryKey: ['/api/camps', campId, 'clinicians']
      });
      setShowAddClinician(false);
      setNewClinician({
        name: '',
        email: '',
        phone: '',
        specialties: [],
        status: 'pending'
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add clinician",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Update clinician mutation
  const updateClinicianMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<Clinician> }) => {
      const response = await apiRequest(
        "PUT",
        `/api/camps/${campId}/clinicians/${id}`,
        data
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Clinician updated",
        description: "The clinician information has been updated successfully."
      });
      queryClient.invalidateQueries({
        queryKey: ['/api/camps', campId, 'clinicians']
      });
      setShowEditClinician(false);
      setSelectedClinicianId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update clinician",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Delete clinician mutation
  const deleteClinicianMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest(
        "DELETE",
        `/api/camps/${campId}/clinicians/${id}`,
        {}
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Clinician removed",
        description: "The clinician has been removed from this camp."
      });
      queryClient.invalidateQueries({
        queryKey: ['/api/camps', campId, 'clinicians']
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to remove clinician",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Update availability mutation
  const updateAvailabilityMutation = useMutation({
    mutationFn: async ({ id, availability }: { id: number, availability: AvailabilitySlot[] }) => {
      const response = await apiRequest(
        "PUT",
        `/api/camps/${campId}/clinicians/${id}/availability`,
        { availability }
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Availability updated",
        description: "The clinician's availability has been updated successfully."
      });
      queryClient.invalidateQueries({
        queryKey: ['/api/camps', campId, 'clinicians']
      });
      setShowAvailabilityDialog(false);
      setSelectedClinicianId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update availability",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Update contract mutation
  const updateContractMutation = useMutation({
    mutationFn: async ({ id, contract }: { id: number, contract: any }) => {
      const response = await apiRequest(
        "PUT",
        `/api/camps/${campId}/clinicians/${id}/contract`,
        contract
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Contract updated",
        description: "The clinician's contract has been updated successfully."
      });
      queryClient.invalidateQueries({
        queryKey: ['/api/camps', campId, 'clinicians']
      });
      setShowContractDialog(false);
      setSelectedClinicianId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update contract",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Upload file mutation
  const uploadFileMutation = useMutation({
    mutationFn: async ({ id, file, type }: { id: number, file: File, type: string }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      
      const response = await fetch(`/api/camps/${campId}/clinicians/${id}/upload`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload file');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "File uploaded",
        description: "The file has been uploaded successfully."
      });
      queryClient.invalidateQueries({
        queryKey: ['/api/camps', campId, 'clinicians']
      });
      setShowUploadDialog(false);
      setSelectedClinicianId(null);
      setFileUpload(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to upload file",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Export clinicians mutation
  const exportCliniciansMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(
        "GET",
        `/api/camps/${campId}/clinicians/export`,
        {}
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Clinicians exported",
        description: "The clinicians list has been exported successfully."
      });
      
      // Create a simple CSV export
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += "Name,Email,Phone,Specialties,Status,Rate,Contract Status\n";
      
      clinicians?.data?.forEach((clinician: Clinician) => {
        csvContent += `${clinician.name},${clinician.email},${clinician.phone || 'N/A'},${clinician.specialties.join('; ')},${clinician.status},${clinician.hourlyRate || 'N/A'},${clinician.contractStatus || 'N/A'}\n`;
      });
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `clinicians_camp_${campId}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to export clinicians",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Handle adding clinician
  const handleAddClinician = () => {
    if (!newClinician.name || !newClinician.email) {
      toast({
        title: "Missing information",
        description: "Please provide at least a name and email for the clinician.",
        variant: "destructive"
      });
      return;
    }
    
    addClinicianMutation.mutate(newClinician);
  };
  
  // Handle updating clinician
  const handleUpdateClinician = () => {
    if (!selectedClinicianId) return;
    
    const clinician = clinicians?.data?.find((c: Clinician) => c.id === selectedClinicianId);
    if (!clinician) return;
    
    updateClinicianMutation.mutate({
      id: selectedClinicianId,
      data: clinician
    });
  };
  
  // Handle removing clinician
  const handleRemoveClinician = (id: number) => {
    if (window.confirm("Are you sure you want to remove this clinician?")) {
      deleteClinicianMutation.mutate(id);
    }
  };
  
  // Handle editing clinician
  const handleEditClinician = (id: number) => {
    setSelectedClinicianId(id);
    setShowEditClinician(true);
  };
  
  // Handle updating availability
  const handleUpdateAvailability = () => {
    if (!selectedClinicianId) return;
    
    updateAvailabilityMutation.mutate({
      id: selectedClinicianId,
      availability: newAvailability
    });
  };
  
  // Handle updating contract
  const handleUpdateContract = () => {
    if (!selectedClinicianId) return;
    
    updateContractMutation.mutate({
      id: selectedClinicianId,
      contract: contractDetails
    });
  };
  
  // Handle uploading file
  const handleUploadFile = () => {
    if (!selectedClinicianId || !fileUpload) return;
    
    uploadFileMutation.mutate({
      id: selectedClinicianId,
      file: fileUpload,
      type: uploadType
    });
  };
  
  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFileUpload(e.target.files[0]);
    }
  };
  
  // Handle exporting clinicians
  const handleExportClinicians = () => {
    exportCliniciansMutation.mutate();
  };
  
  // Add new availability slot
  const addAvailabilitySlot = () => {
    setNewAvailability([
      ...newAvailability,
      { day: 1, startTime: '08:00', endTime: '17:00' }
    ]);
  };
  
  // Remove availability slot
  const removeAvailabilitySlot = (index: number) => {
    setNewAvailability(newAvailability.filter((_, i) => i !== index));
  };
  
  // Update availability slot
  const updateAvailabilitySlot = (index: number, field: keyof AvailabilitySlot, value: any) => {
    const updatedAvailability = [...newAvailability];
    updatedAvailability[index] = {
      ...updatedAvailability[index],
      [field]: value
    };
    setNewAvailability(updatedAvailability);
  };
  
  // Toggle specialty selection
  const toggleSpecialty = (specialty: ClinicianSpecialty) => {
    if (newClinician.specialties?.includes(specialty)) {
      setNewClinician({
        ...newClinician,
        specialties: newClinician.specialties.filter(s => s !== specialty)
      });
    } else {
      setNewClinician({
        ...newClinician,
        specialties: [...(newClinician.specialties || []), specialty]
      });
    }
  };
  
  // Get status badge
  const getStatusBadge = (status: ClinicianStatus) => {
    switch (status) {
      case 'confirmed':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Confirmed</Badge>;
      case 'invited':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Invited</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'standby':
        return <Badge variant="outline" className="bg-purple-100 text-purple-800">Standby</Badge>;
      case 'unavailable':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800">Unavailable</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-100 text-red-800">Cancelled</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };
  
  // Get contract status badge
  const getContractStatusBadge = (status?: ContractStatus) => {
    if (!status) return <Badge variant="outline" className="bg-gray-100 text-gray-800">No Contract</Badge>;
    
    switch (status) {
      case 'sent':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Sent</Badge>;
      case 'signed':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Signed</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'expired':
        return <Badge variant="outline" className="bg-red-100 text-red-800">Expired</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-100 text-red-800">Cancelled</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-purple-100 text-purple-800">Completed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };
  
  // Get specialty badge class
  const getSpecialtyBadgeClass = (specialty: string): string => {
    switch (specialty) {
      case 'wrestling': return 'bg-blue-100 text-blue-800';
      case 'mma': return 'bg-red-100 text-red-800';
      case 'boxing': return 'bg-yellow-100 text-yellow-800';
      case 'jiu-jitsu': return 'bg-purple-100 text-purple-800';
      case 'strength': return 'bg-green-100 text-green-800';
      case 'conditioning': return 'bg-orange-100 text-orange-800';
      case 'nutrition': return 'bg-teal-100 text-teal-800';
      case 'psychology': return 'bg-indigo-100 text-indigo-800';
      case 'recovery': return 'bg-pink-100 text-pink-800';
      case 'other': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Filter clinicians based on search, status, and specialty
  const getFilteredClinicians = () => {
    if (!clinicians?.data) return [];
    
    return clinicians.data
      .filter((clinician: Clinician) => {
        const matchesSearch = 
          clinician.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          clinician.email.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = statusFilter === 'all' || clinician.status === statusFilter;
        
        const matchesSpecialty = specialtyFilter === 'all' || 
          clinician.specialties.includes(specialtyFilter as ClinicianSpecialty);
        
        return matchesSearch && matchesStatus && matchesSpecialty;
      })
      .sort((a: Clinician, b: Clinician) => {
        if (sortBy === 'name') {
          return sortDirection === 'asc' 
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name);
        } else if (sortBy === 'status') {
          return sortDirection === 'asc'
            ? a.status.localeCompare(b.status)
            : b.status.localeCompare(a.status);
        } else if (sortBy === 'rate' && a.hourlyRate && b.hourlyRate) {
          return sortDirection === 'asc'
            ? a.hourlyRate - b.hourlyRate
            : b.hourlyRate - a.hourlyRate;
        }
        return 0;
      });
  };
  
  // Get file size display
  const getFileSizeDisplay = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };
  
  // Open availability dialog
  const openAvailabilityDialog = (id: number) => {
    const clinician = clinicians?.data?.find((c: Clinician) => c.id === id);
    if (!clinician) return;
    
    setSelectedClinicianId(id);
    setNewAvailability(clinician.availability || [{ day: 1, startTime: '08:00', endTime: '17:00' }]);
    setShowAvailabilityDialog(true);
  };
  
  // Open contract dialog
  const openContractDialog = (id: number) => {
    const clinician = clinicians?.data?.find((c: Clinician) => c.id === id);
    if (!clinician) return;
    
    setSelectedClinicianId(id);
    setContractDetails({
      hourlyRate: clinician.hourlyRate || 0,
      totalHours: 0,
      startDate: camp?.data?.startDate || '',
      endDate: camp?.data?.endDate || '',
      accommodationProvided: true,
      travelProvided: true,
      notes: clinician.notes || ''
    });
    setShowContractDialog(true);
  };
  
  // Open upload dialog
  const openUploadDialog = (id: number) => {
    setSelectedClinicianId(id);
    setFileUpload(null);
    setUploadType('contract');
    setShowUploadDialog(true);
  };
  
  // If loading or error
  if (isLoadingCamp || isLoadingClinicians) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  if (isCampError || !camp) {
    return (
      <div className="p-4">
        <Button variant="outline" onClick={() => setLocation('/events/overview')}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Camps
        </Button>
        <div className="mt-4 p-4 border rounded-md bg-red-50">
          <h2 className="text-lg font-semibold text-red-800">Error Loading Camp</h2>
          <p className="text-red-600">Unable to load camp details. Please try again later.</p>
        </div>
      </div>
    );
  }
  
  const campData = camp.data;
  
  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="flex items-center mb-4">
        <Button variant="outline" onClick={() => setLocation(`/events/overview`)}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Camps
        </Button>
        <h1 className="text-2xl font-bold ml-4">Clinician Module</h1>
        <div className="ml-auto flex items-center space-x-2">
          <Button 
            variant="secondary"
            onClick={handleExportClinicians}
          >
            <Download className="h-4 w-4 mr-2" />
            Export Clinicians
          </Button>
          
          <Button onClick={() => setShowAddClinician(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Clinician
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{campData.name} - Clinicians</CardTitle>
              <CardDescription>
                {campData.startDate && campData.endDate 
                  ? `${formatDate(campData.startDate)} to ${formatDate(campData.endDate)}`
                  : 'Dates not set'
                }
                {campData.location && ` • ${campData.location}`}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="roster">Clinician Roster</TabsTrigger>
              <TabsTrigger value="schedule">Schedule</TabsTrigger>
              <TabsTrigger value="contracts">Contracts & Documents</TabsTrigger>
            </TabsList>
            
            <div className="flex items-center mt-4 mb-6 gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search clinicians..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="invited">Invited</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="standby">Standby</SelectItem>
                  <SelectItem value="unavailable">Unavailable</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by specialty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Specialties</SelectItem>
                  <SelectItem value="wrestling">Wrestling</SelectItem>
                  <SelectItem value="mma">MMA</SelectItem>
                  <SelectItem value="boxing">Boxing</SelectItem>
                  <SelectItem value="jiu-jitsu">Jiu-Jitsu</SelectItem>
                  <SelectItem value="strength">Strength</SelectItem>
                  <SelectItem value="conditioning">Conditioning</SelectItem>
                  <SelectItem value="nutrition">Nutrition</SelectItem>
                  <SelectItem value="psychology">Psychology</SelectItem>
                  <SelectItem value="recovery">Recovery</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              
              <Button 
                variant="outline" 
                onClick={() => {
                  setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                }}
              >
                <ArrowUpDown className="h-4 w-4 mr-2" /> 
                {sortDirection === 'asc' ? 'A to Z' : 'Z to A'}
              </Button>
            </div>
            
            <TabsContent value="roster">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead onClick={() => setSortBy('name')} className="cursor-pointer">
                        Name {sortBy === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Specialties</TableHead>
                      <TableHead onClick={() => setSortBy('status')} className="cursor-pointer">
                        Status {sortBy === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </TableHead>
                      <TableHead>Sessions</TableHead>
                      <TableHead onClick={() => setSortBy('rate')} className="cursor-pointer">
                        Rate {sortBy === 'rate' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getFilteredClinicians().length > 0 ? (
                      getFilteredClinicians().map((clinician: Clinician) => (
                        <TableRow key={clinician.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar>
                                <AvatarFallback>{clinician.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{clinician.name}</p>
                                <p className="text-sm text-gray-500">{clinician.experience}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center">
                                <Mail className="h-4 w-4 mr-1 text-gray-400" />
                                <span className="text-sm">{clinician.email}</span>
                              </div>
                              {clinician.phone && (
                                <div className="flex items-center">
                                  <Phone className="h-4 w-4 mr-1 text-gray-400" />
                                  <span className="text-sm">{clinician.phone}</span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {clinician.specialties.map((specialty, index) => (
                                <Badge key={index} variant="outline" className={getSpecialtyBadgeClass(specialty)}>
                                  {specialty}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(clinician.status)}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {clinician.assignedSessions || 0} sessions
                            </div>
                          </TableCell>
                          <TableCell>
                            {clinician.hourlyRate ? `$${clinician.hourlyRate}/hr` : 'Not set'}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditClinician(clinician.id)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openAvailabilityDialog(clinician.id)}>
                                  <Calendar className="h-4 w-4 mr-2" />
                                  Update Availability
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openContractDialog(clinician.id)}>
                                  <FileText className="h-4 w-4 mr-2" />
                                  Manage Contract
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openUploadDialog(clinician.id)}>
                                  <Upload className="h-4 w-4 mr-2" />
                                  Upload Document
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleRemoveClinician(clinician.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Remove
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
                          <UserCog className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                          <p className="text-gray-500">No clinicians found</p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mt-2"
                            onClick={() => setShowAddClinician(true)}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Clinician
                          </Button>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            
            <TabsContent value="schedule">
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  {clinicians?.data?.map((clinician: Clinician) => {
                    const sessions = clinicianSessions?.data?.filter(
                      (s: any) => s.clinicianId === clinician.id
                    ) || [];
                    
                    if (sessions.length === 0 && 
                        (searchTerm || statusFilter !== 'all' || specialtyFilter !== 'all')) {
                      return null;
                    }
                    
                    return (
                      <Card key={clinician.id}>
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Avatar>
                                <AvatarFallback>{clinician.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <CardTitle className="text-lg">{clinician.name}</CardTitle>
                                <div className="flex items-center gap-2 mt-1">
                                  {getStatusBadge(clinician.status)}
                                  <span className="text-sm text-gray-500">
                                    {clinician.specialties.join(', ')}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setLocation(`/events/agenda?clinicianId=${clinician.id}`)}
                              >
                                <Calendar className="h-4 w-4 mr-1" />
                                Assign Sessions
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          {sessions.length > 0 ? (
                            <div className="space-y-2">
                              <h4 className="text-sm font-medium text-gray-500 mb-2">
                                Assigned Sessions ({sessions.length})
                              </h4>
                              <div className="overflow-x-auto border rounded-md">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Day & Time</TableHead>
                                      <TableHead>Session</TableHead>
                                      <TableHead>Location</TableHead>
                                      <TableHead>Type</TableHead>
                                      <TableHead>Status</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {sessions.map((session: any) => (
                                      <TableRow key={session.id}>
                                        <TableCell>
                                          <div className="font-medium">Day {session.day}</div>
                                          <div className="text-sm text-gray-500">
                                            {session.startTime} - {session.endTime}
                                          </div>
                                        </TableCell>
                                        <TableCell>{session.title}</TableCell>
                                        <TableCell>{session.location || 'Not set'}</TableCell>
                                        <TableCell>{session.sessionType}</TableCell>
                                        <TableCell>{session.status}</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-6 text-gray-500">
                              <Calendar className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                              <p>No sessions assigned yet</p>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="mt-2"
                                onClick={() => setLocation(`/events/agenda`)}
                              >
                                Assign Sessions
                              </Button>
                            </div>
                          )}
                          
                          {clinician.availability && clinician.availability.length > 0 && (
                            <div className="mt-4">
                              <h4 className="text-sm font-medium text-gray-500 mb-2">
                                Availability
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {clinician.availability.map((slot, index) => (
                                  <Badge key={index} variant="outline" className="bg-blue-50 text-blue-700">
                                    <Clock className="h-3 w-3 mr-1" />
                                    Day {slot.day}: {slot.startTime} - {slot.endTime}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="contracts">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Clinician</TableHead>
                      <TableHead>Contract Status</TableHead>
                      <TableHead>Rate</TableHead>
                      <TableHead>Contract Date</TableHead>
                      <TableHead>Travel & Accommodation</TableHead>
                      <TableHead>Documents</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getFilteredClinicians().length > 0 ? (
                      getFilteredClinicians().map((clinician: Clinician) => (
                        <TableRow key={clinician.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar>
                                <AvatarFallback>{clinician.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{clinician.name}</p>
                                <p className="text-sm text-gray-500">{clinician.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {getContractStatusBadge(clinician.contractStatus)}
                          </TableCell>
                          <TableCell>
                            {clinician.hourlyRate ? `$${clinician.hourlyRate}/hr` : 'Not set'}
                          </TableCell>
                          <TableCell>
                            {clinician.contractDate ? formatDate(clinician.contractDate) : 'Not set'}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>Travel: {clinician.travelRequirements || 'Not specified'}</div>
                              <div>Accommodation: {clinician.accommodationNeeds || 'Not specified'}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {clinician.attachments && clinician.attachments.length > 0 ? (
                              <div className="flex flex-col gap-1">
                                {clinician.attachments.map((attachment) => (
                                  <div key={attachment.id} className="flex items-center gap-1">
                                    <FileText className="h-3 w-3" />
                                    <a 
                                      href={attachment.url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-sm text-blue-600 hover:underline"
                                    >
                                      {attachment.fileName}
                                    </a>
                                    <span className="text-xs text-gray-500">
                                      ({getFileSizeDisplay(attachment.fileSize)})
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-sm text-gray-500">No documents</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => openContractDialog(clinician.id)}
                              >
                                <FileText className="h-4 w-4 mr-1" />
                                Manage
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => openUploadDialog(clinician.id)}
                              >
                                <Upload className="h-4 w-4 mr-1" />
                                Upload
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
                          <FileText className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                          <p className="text-gray-500">No contracts found</p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Add Clinician Dialog */}
      <Dialog open={showAddClinician} onOpenChange={setShowAddClinician}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Add New Clinician</DialogTitle>
            <DialogDescription>
              Add a new clinician to this camp.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="name">Name*</Label>
              <Input
                id="name"
                value={newClinician.name}
                onChange={(e) => setNewClinician({...newClinician, name: e.target.value})}
                placeholder="Enter clinician name"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email*</Label>
                <Input
                  id="email"
                  type="email"
                  value={newClinician.email}
                  onChange={(e) => setNewClinician({...newClinician, email: e.target.value})}
                  placeholder="Enter email address"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={newClinician.phone || ''}
                  onChange={(e) => setNewClinician({...newClinician, phone: e.target.value})}
                  placeholder="Enter phone number"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              <Label>Specialties</Label>
              <div className="grid grid-cols-2 gap-2">
                {['wrestling', 'mma', 'boxing', 'jiu-jitsu', 'strength', 'conditioning', 'nutrition', 'psychology', 'recovery', 'other'].map((specialty) => (
                  <div key={specialty} className="flex items-center space-x-2">
                    <Switch
                      id={`specialty-${specialty}`}
                      checked={newClinician.specialties?.includes(specialty)}
                      onCheckedChange={() => toggleSpecialty(specialty as ClinicianSpecialty)}
                    />
                    <Label htmlFor={`specialty-${specialty}`}>{specialty}</Label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={newClinician.bio || ''}
                onChange={(e) => setNewClinician({...newClinician, bio: e.target.value})}
                placeholder="Enter clinician bio"
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={newClinician.status}
                  onValueChange={(value) => setNewClinician({...newClinician, status: value as ClinicianStatus})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="invited">Invited</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="standby">Standby</SelectItem>
                    <SelectItem value="unavailable">Unavailable</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="hourlyRate">Hourly Rate</Label>
                <Input
                  id="hourlyRate"
                  type="number"
                  value={newClinician.hourlyRate || ''}
                  onChange={(e) => setNewClinician({
                    ...newClinician, 
                    hourlyRate: e.target.value ? parseInt(e.target.value) : undefined
                  })}
                  placeholder="Enter hourly rate"
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddClinician(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddClinician} disabled={addClinicianMutation.isPending}>
              {addClinicianMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Clinician
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Availability Dialog */}
      <Dialog open={showAvailabilityDialog} onOpenChange={setShowAvailabilityDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Update Availability</DialogTitle>
            <DialogDescription>
              Set the availability for this clinician throughout the camp.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="space-y-4">
              {newAvailability.map((slot, index) => (
                <div key={index} className="flex items-center gap-2 p-2 border rounded-md">
                  <div>
                    <Label htmlFor={`day-${index}`}>Day</Label>
                    <Select
                      value={slot.day.toString()}
                      onValueChange={(value) => updateAvailabilitySlot(index, 'day', parseInt(value))}
                    >
                      <SelectTrigger id={`day-${index}`} className="w-[100px]">
                        <SelectValue placeholder="Day" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: campData.days || 5 }, (_, i) => (
                          <SelectItem key={i} value={(i + 1).toString()}>
                            Day {i + 1}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor={`start-${index}`}>Start</Label>
                    <Input
                      id={`start-${index}`}
                      type="time"
                      value={slot.startTime}
                      onChange={(e) => updateAvailabilitySlot(index, 'startTime', e.target.value)}
                      className="w-[110px]"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor={`end-${index}`}>End</Label>
                    <Input
                      id={`end-${index}`}
                      type="time"
                      value={slot.endTime}
                      onChange={(e) => updateAvailabilitySlot(index, 'endTime', e.target.value)}
                      className="w-[110px]"
                    />
                  </div>
                  
                  <div className="mt-auto">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => removeAvailabilitySlot(index)}
                      disabled={newAvailability.length <= 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              
              <Button variant="outline" onClick={addAvailabilitySlot}>
                <Plus className="h-4 w-4 mr-2" />
                Add Time Slot
              </Button>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAvailabilityDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateAvailability}
              disabled={updateAvailabilityMutation.isPending}
            >
              {updateAvailabilityMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Save Availability
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Contract Dialog */}
      <Dialog open={showContractDialog} onOpenChange={setShowContractDialog}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Manage Contract</DialogTitle>
            <DialogDescription>
              Update contract details for this clinician.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
                <Input
                  id="hourlyRate"
                  type="number"
                  value={contractDetails.hourlyRate}
                  onChange={(e) => setContractDetails({
                    ...contractDetails,
                    hourlyRate: parseInt(e.target.value) || 0
                  })}
                />
              </div>
              <div>
                <Label htmlFor="totalHours">Total Hours</Label>
                <Input
                  id="totalHours"
                  type="number"
                  value={contractDetails.totalHours}
                  onChange={(e) => setContractDetails({
                    ...contractDetails,
                    totalHours: parseInt(e.target.value) || 0
                  })}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={contractDetails.startDate}
                  onChange={(e) => setContractDetails({
                    ...contractDetails,
                    startDate: e.target.value
                  })}
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={contractDetails.endDate}
                  onChange={(e) => setContractDetails({
                    ...contractDetails,
                    endDate: e.target.value
                  })}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="accommodationProvided"
                  checked={contractDetails.accommodationProvided}
                  onCheckedChange={(checked) => setContractDetails({
                    ...contractDetails,
                    accommodationProvided: checked
                  })}
                />
                <Label htmlFor="accommodationProvided">Accommodation Provided</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="travelProvided"
                  checked={contractDetails.travelProvided}
                  onCheckedChange={(checked) => setContractDetails({
                    ...contractDetails,
                    travelProvided: checked
                  })}
                />
                <Label htmlFor="travelProvided">Travel Provided</Label>
              </div>
            </div>
            
            <div>
              <Label htmlFor="contractNotes">Notes</Label>
              <Textarea
                id="contractNotes"
                value={contractDetails.notes}
                onChange={(e) => setContractDetails({
                  ...contractDetails,
                  notes: e.target.value
                })}
                rows={3}
              />
            </div>
            
            <div className="mt-2">
              <Button variant="outline" onClick={() => openUploadDialog(selectedClinicianId!)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Contract Document
              </Button>
            </div>
          </div>
          
          <DialogFooter>
            <div className="flex justify-between w-full">
              <div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline">
                        <ClipboardPaste className="h-4 w-4 mr-2" />
                        Generate Contract
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Generate a contract based on the details above</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="space-x-2">
                <Button variant="outline" onClick={() => setShowContractDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleUpdateContract}
                  disabled={updateContractMutation.isPending}
                >
                  {updateContractMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Save Contract
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Upload a document for this clinician.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="documentType">Document Type</Label>
              <Select
                value={uploadType}
                onValueChange={setUploadType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="waiver">Waiver</SelectItem>
                  <SelectItem value="bio">Bio</SelectItem>
                  <SelectItem value="credential">Credential</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="fileUpload">File</Label>
              <Input
                id="fileUpload"
                type="file"
                onChange={handleFileChange}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Accepted file types: PDF, DOC, DOCX, JPG, PNG (max 10MB)
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleUploadFile}
              disabled={uploadFileMutation.isPending || !fileUpload}
            >
              {uploadFileMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload File
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ClinicianModule;