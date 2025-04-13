import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format, formatDistanceToNow, isToday, isYesterday, parseISO } from "date-fns";
import {
  Search,
  Filter,
  AlertCircle,
  Clock,
  Eye,
  Phone,
  Mail,
  FileText,
  Building,
  MoreHorizontal,
  CalendarIcon,
  DollarSign,
  Plus,
  Users,
  Briefcase,
  ArrowUpDown,
  Check,
  ChevronDown,
  MapPin,
  ExternalLink,
  Sparkle,
  UserPlus,
  BarChart4,
  Activity,
  Star,
  X,
  RefreshCw,
  ArrowRight,
  Loader2,
  Info,
  Calendar as CalendarIcon2,
  CheckCircle2,
  ShieldAlert,
} from "lucide-react";

// Define lead types
interface Lead {
  id: number;
  name: string;
  email: string;
  phone?: string;
  source: string;
  status: string;
  notes?: string;
  value?: number;
  createdAt: string;
  claimed: boolean;
  salesRepId?: number;
  companyName?: string;
  industry?: string;
  location?: string;
  contactTitle?: string;
  website?: string;
  socialMedia?: string[];
  priority?: 'low' | 'medium' | 'high';
  tags?: string[];
  lastContactDate?: string;
  nextFollowupDate?: string;
  leadScore?: number;
  potentialItems?: number;
  estimatedOrderValue?: number;
  referredBy?: string;
  attachments?: {id: string, name: string, url: string, type: string}[];
  interactions?: {date: string, type: string, notes: string, userId: number}[];
}

export default function UnclaimedLeads() {
  // States
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedSource, setSelectedSource] = useState<string>("all");
  const [selectedPriority, setSelectedPriority] = useState<string>("all");
  const [selectedSort, setSelectedSort] = useState<string>("newest");
  const [timeRange, setTimeRange] = useState<string>("all");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isLeadDetailOpen, setIsLeadDetailOpen] = useState(false);
  const [isClaimDialogOpen, setIsClaimDialogOpen] = useState(false);
  const [claimNotes, setClaimNotes] = useState("");
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'kanban'>('list');
  const [valueFilter, setValueFilter] = useState<[number, number]>([0, 1000000]);
  
  const { toast } = useToast();
  const { user } = useAuth();
  const [, navigate] = useLocation();
  
  // Fetch unclaimed leads
  const { data: leadsData, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/leads/unclaimed"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/leads/unclaimed");
      const data = await res.json();
      return data;
    },
  });
  
  // Claim lead mutation
  const claimLeadMutation = useMutation({
    mutationFn: async (leadId: number) => {
      const res = await apiRequest("POST", `/api/leads/${leadId}/claim`, {
        notes: claimNotes,
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Lead claimed successfully",
        description: "The lead has been assigned to you.",
      });
      setIsClaimDialogOpen(false);
      // After claim, refresh the leads list and redirect to lead creation
      queryClient.invalidateQueries({ queryKey: ["/api/leads/unclaimed"] });
      if (selectedLead) {
        // Navigate to order creation with the lead ID as a parameter
        navigate(`/orders/create?leadId=${selectedLead.id}`);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Failed to claim lead",
        description: error.message || "There was an error claiming this lead.",
        variant: "destructive",
      });
    },
  });
  
  // Manual refresh handler
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };
  
  // Function to view lead details
  const viewLeadDetails = (lead: Lead) => {
    setSelectedLead(lead);
    setIsLeadDetailOpen(true);
  };
  
  // Function to claim a lead
  const openClaimDialog = (lead: Lead) => {
    setSelectedLead(lead);
    setIsClaimDialogOpen(true);
  };
  
  // Function to handle claim submission
  const handleClaimSubmit = () => {
    if (selectedLead) {
      claimLeadMutation.mutate(selectedLead.id);
    }
  };
  
  // Filter and sort leads
  const filteredLeads = React.useMemo(() => {
    if (!leadsData || !Array.isArray(leadsData)) return [];
    
    let filteredData = [...leadsData];
    
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filteredData = filteredData.filter(
        (lead) =>
          lead.name?.toLowerCase().includes(searchLower) ||
          lead.email?.toLowerCase().includes(searchLower) ||
          lead.companyName?.toLowerCase().includes(searchLower) ||
          lead.phone?.includes(searchTerm) ||
          String(lead.id).includes(searchTerm)
      );
    }
    
    // Status filter
    if (selectedStatus !== "all") {
      filteredData = filteredData.filter((lead) => lead.status === selectedStatus);
    }
    
    // Source filter
    if (selectedSource !== "all") {
      filteredData = filteredData.filter((lead) => lead.source === selectedSource);
    }
    
    // Priority filter
    if (selectedPriority !== "all") {
      filteredData = filteredData.filter((lead) => lead.priority === selectedPriority);
    }
    
    // Time range filter
    if (timeRange !== "all") {
      const now = new Date();
      filteredData = filteredData.filter((lead) => {
        const createdDate = new Date(lead.createdAt);
        const daysDiff = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
        
        switch (timeRange) {
          case "today":
            return isToday(createdDate);
          case "yesterday":
            return isYesterday(createdDate);
          case "week":
            return daysDiff < 7;
          case "month":
            return daysDiff < 30;
          default:
            return true;
        }
      });
    }
    
    // Value filter
    filteredData = filteredData.filter((lead) => {
      const value = lead.value || lead.estimatedOrderValue || 0;
      return value >= valueFilter[0] && value <= valueFilter[1];
    });
    
    // Sort results
    switch (selectedSort) {
      case "newest":
        return filteredData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case "oldest":
        return filteredData.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      case "valueHigh":
        return filteredData.sort((a, b) => (b.value || 0) - (a.value || 0));
      case "valueLow":
        return filteredData.sort((a, b) => (a.value || 0) - (b.value || 0));
      case "alphabetical":
        return filteredData.sort((a, b) => a.name.localeCompare(b.name));
      case "priority":
        const priorityOrder = { high: 1, medium: 2, low: 3 };
        return filteredData.sort((a, b) => {
          const aPriority = a.priority as 'high' | 'medium' | 'low' || 'low';
          const bPriority = b.priority as 'high' | 'medium' | 'low' || 'low';
          return priorityOrder[aPriority] - priorityOrder[bPriority];
        });
      default:
        return filteredData;
    }
  }, [leadsData, searchTerm, selectedStatus, selectedSource, selectedPriority, selectedSort, timeRange, valueFilter]);
  
  // Get unique sources for filter
  const leadSources = React.useMemo(() => {
    if (!leadsData || !Array.isArray(leadsData)) return [];
    const sources = new Set(leadsData.map((lead) => lead.source).filter(Boolean));
    return Array.from(sources);
  }, [leadsData]);
  
  // Get unique statuses for filter
  const leadStatuses = React.useMemo(() => {
    if (!leadsData || !Array.isArray(leadsData)) return [];
    const statuses = new Set(leadsData.map((lead) => lead.status).filter(Boolean));
    return Array.from(statuses);
  }, [leadsData]);
  
  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      if (isToday(date)) {
        return `Today, ${format(date, 'h:mm a')}`;
      } else if (isYesterday(date)) {
        return `Yesterday, ${format(date, 'h:mm a')}`;
      } else {
        return format(date, 'MMM d, yyyy');
      }
    } catch (error) {
      return 'Invalid date';
    }
  };
  
  // Format time ago for display
  const formatTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(parseISO(dateString), { addSuffix: true });
    } catch (error) {
      return 'Invalid date';
    }
  };
  
  // Format currency for display
  const formatCurrency = (amount?: number) => {
    if (amount === undefined) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };
  
  // Get priority badge
  const getPriorityBadge = (priority?: string) => {
    switch (priority) {
      case 'high':
        return <Badge className="bg-red-100 text-red-800">High Priority</Badge>;
      case 'medium':
        return <Badge className="bg-amber-100 text-amber-800">Medium Priority</Badge>;
      case 'low':
        return <Badge className="bg-green-100 text-green-800">Low Priority</Badge>;
      default:
        return null;
    }
  };
  
  // Get source badge
  const getSourceBadge = (source: string) => {
    switch (source?.toLowerCase()) {
      case 'website':
        return <Badge className="bg-blue-100 text-blue-800">Website</Badge>;
      case 'referral':
        return <Badge className="bg-purple-100 text-purple-800">Referral</Badge>;
      case 'cold call':
        return <Badge className="bg-gray-100 text-gray-800">Cold Call</Badge>;
      case 'email':
        return <Badge className="bg-green-100 text-green-800">Email</Badge>;
      case 'social media':
        return <Badge className="bg-pink-100 text-pink-800">Social Media</Badge>;
      case 'event':
        return <Badge className="bg-amber-100 text-amber-800">Event</Badge>;
      default:
        return <Badge variant="outline">{source || 'Unknown'}</Badge>;
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">Unclaimed Leads</h1>
          <p className="text-muted-foreground">
            View and claim available leads that are waiting for follow-up.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button onClick={handleRefresh} size="sm" variant="outline" disabled={isRefreshing}>
            {isRefreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Refresh
          </Button>
          <Button asChild size="sm">
            <Link href="/leads/create">
              <Plus className="mr-2 h-4 w-4" />
              Add New Lead
            </Link>
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search leads by name, email, company..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <X
                    className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground"
                    onClick={() => setSearchTerm("")}
                  />
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Select value={selectedSort} onValueChange={setSelectedSort}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="valueHigh">Highest Value</SelectItem>
                  <SelectItem value="valueLow">Lowest Value</SelectItem>
                  <SelectItem value="alphabetical">Alphabetical</SelectItem>
                  <SelectItem value="priority">Priority</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" onClick={() => setIsFilterExpanded(!isFilterExpanded)}>
                <Filter className="mr-2 h-4 w-4" />
                Filters
                {isFilterExpanded ? <ChevronDown className="ml-2 h-4 w-4 rotate-180 transform" /> : <ChevronDown className="ml-2 h-4 w-4" />}
              </Button>
            </div>
          </div>
          
          {isFilterExpanded && (
            <div className="pt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <div>
                <Label className="text-xs">Lead Status</Label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {leadStatuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-xs">Lead Source</Label>
                <Select value={selectedSource} onValueChange={setSelectedSource}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Filter by source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    {leadSources.map((source) => (
                      <SelectItem key={source} value={source}>
                        {source.charAt(0).toUpperCase() + source.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-xs">Priority</Label>
                <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Filter by priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="high">High Priority</SelectItem>
                    <SelectItem value="medium">Medium Priority</SelectItem>
                    <SelectItem value="low">Low Priority</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-xs">Time Range</Label>
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Filter by time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="yesterday">Yesterday</SelectItem>
                    <SelectItem value="week">Last 7 Days</SelectItem>
                    <SelectItem value="month">Last 30 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardHeader>
        
        <CardContent>
          {/* View mode selector tabs */}
          <Tabs defaultValue="list" className="mb-6" onValueChange={(value) => setViewMode(value as any)}>
            <TabsList>
              <TabsTrigger value="list">
                <FileText className="h-4 w-4 mr-2" />
                List View
              </TabsTrigger>
              <TabsTrigger value="grid">
                <Users className="h-4 w-4 mr-2" />
                Grid View
              </TabsTrigger>
              <TabsTrigger value="kanban">
                <BarChart4 className="h-4 w-4 mr-2" />
                Kanban View
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-lg">Loading leads...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <AlertCircle className="mx-auto h-10 w-10 text-destructive mb-3" />
              <h3 className="text-lg font-medium">Error loading leads</h3>
              <p className="text-muted-foreground mt-1">
                There was a problem fetching the leads. Please try again.
              </p>
              <Button variant="outline" className="mt-4" onClick={handleRefresh}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="text-center py-12 border rounded-lg bg-muted/10">
              {searchTerm || selectedStatus !== "all" || selectedSource !== "all" || selectedPriority !== "all" || timeRange !== "all" ? (
                <>
                  <FileText className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                  <h3 className="text-lg font-medium">No matching leads found</h3>
                  <p className="text-muted-foreground mt-1 max-w-md mx-auto">
                    No leads match your current filters. Try adjusting your search criteria.
                  </p>
                  <Button variant="outline" className="mt-4" onClick={() => {
                    setSearchTerm("");
                    setSelectedStatus("all");
                    setSelectedSource("all");
                    setSelectedPriority("all");
                    setTimeRange("all");
                  }}>
                    Clear All Filters
                  </Button>
                </>
              ) : (
                <>
                  <FileText className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                  <h3 className="text-lg font-medium">No unclaimed leads available</h3>
                  <p className="text-muted-foreground mt-1 max-w-md mx-auto">
                    There are currently no unclaimed leads available for you to claim.
                  </p>
                  <Button variant="outline" className="mt-4" asChild>
                    <Link href="/leads/create">
                      <Plus className="mr-2 h-4 w-4" />
                      Create New Lead
                    </Link>
                  </Button>
                </>
              )}
            </div>
          ) : (
            <>
              {/* List View */}
              {viewMode === 'list' && (
                <div className="overflow-hidden rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">Lead ID</TableHead>
                        <TableHead>Name/Company</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLeads.map((lead) => (
                        <TableRow key={lead.id}>
                          <TableCell className="font-medium">{lead.id}</TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{lead.name}</span>
                              {lead.companyName && (
                                <span className="text-muted-foreground text-xs">{lead.companyName}</span>
                              )}
                              <div className="mt-1">
                                {getPriorityBadge(lead.priority)}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col space-y-1">
                              <span className="flex items-center text-xs">
                                <Mail className="h-3 w-3 mr-1" />
                                {lead.email}
                              </span>
                              {lead.phone && (
                                <span className="flex items-center text-xs">
                                  <Phone className="h-3 w-3 mr-1" />
                                  {lead.phone}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {getSourceBadge(lead.source)}
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">{formatCurrency(lead.value || lead.estimatedOrderValue)}</span>
                          </TableCell>
                          <TableCell>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger className="flex items-center">
                                  <Clock className="h-3 w-3 mr-1" />
                                  <span className="text-sm">{formatTimeAgo(lead.createdAt)}</span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Created on {formatDate(lead.createdAt)}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => viewLeadDetails(lead)}
                              >
                                <Eye className="h-3.5 w-3.5 mr-1" />
                                View
                              </Button>
                              <Button 
                                size="sm" 
                                onClick={() => openClaimDialog(lead)}
                              >
                                <UserPlus className="h-3.5 w-3.5 mr-1" />
                                Claim
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              
              {/* Grid View */}
              {viewMode === 'grid' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredLeads.map((lead) => (
                    <Card key={lead.id} className="overflow-hidden">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{lead.name}</CardTitle>
                            <CardDescription>
                              {lead.companyName && (
                                <span className="flex items-center">
                                  <Building className="h-3 w-3 mr-1" />
                                  {lead.companyName}
                                </span>
                              )}
                            </CardDescription>
                          </div>
                          <div className="flex flex-col items-end">
                            {getPriorityBadge(lead.priority)}
                            <span className="text-xs text-muted-foreground mt-1">
                              ID: {lead.id}
                            </span>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <div className="space-y-2">
                          <div className="flex items-center">
                            <Mail className="h-4 w-4 text-muted-foreground mr-2" />
                            <span className="text-sm">{lead.email}</span>
                          </div>
                          
                          {lead.phone && (
                            <div className="flex items-center">
                              <Phone className="h-4 w-4 text-muted-foreground mr-2" />
                              <span className="text-sm">{lead.phone}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center">
                            <DollarSign className="h-4 w-4 text-muted-foreground mr-2" />
                            <span className="text-sm font-medium">{formatCurrency(lead.value || lead.estimatedOrderValue)}</span>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 text-muted-foreground mr-2" />
                              <span className="text-sm">{formatTimeAgo(lead.createdAt)}</span>
                            </div>
                            <div>
                              {getSourceBadge(lead.source)}
                            </div>
                          </div>
                          
                          <div className="mt-3 pt-3 border-t">
                            {lead.notes && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {lead.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="pt-0">
                        <div className="flex space-x-2 w-full">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => viewLeadDetails(lead)}
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            View
                          </Button>
                          <Button 
                            size="sm" 
                            className="flex-1"
                            onClick={() => openClaimDialog(lead)}
                          >
                            <UserPlus className="h-3.5 w-3.5 mr-1" />
                            Claim
                          </Button>
                        </div>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
              
              {/* Kanban View */}
              {viewMode === 'kanban' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* New Leads Column */}
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-blue-50 p-3 border-b">
                      <h3 className="font-medium flex items-center">
                        <Sparkle className="h-4 w-4 text-blue-500 mr-2" />
                        New Leads
                        <Badge className="ml-2 bg-blue-100 text-blue-800">
                          {filteredLeads.filter(l => l.status === 'new').length}
                        </Badge>
                      </h3>
                    </div>
                    <ScrollArea className="h-[500px] p-2">
                      <div className="space-y-2 pr-2">
                        {filteredLeads
                          .filter(l => l.status === 'new')
                          .map(lead => (
                            <Card key={lead.id} className="p-3">
                              <div className="flex justify-between">
                                <h4 className="font-medium">{lead.name}</h4>
                                {getPriorityBadge(lead.priority)}
                              </div>
                              
                              {lead.companyName && (
                                <div className="text-xs text-muted-foreground mb-2 flex items-center">
                                  <Building className="h-3 w-3 mr-1" />
                                  {lead.companyName}
                                </div>
                              )}
                              
                              <div className="flex justify-between text-xs mb-2">
                                <span>{formatCurrency(lead.value || lead.estimatedOrderValue)}</span>
                                <span>{formatTimeAgo(lead.createdAt)}</span>
                              </div>
                              
                              <div className="flex space-x-1 mt-2">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="w-full text-xs py-0 h-7"
                                  onClick={() => viewLeadDetails(lead)}
                                >
                                  View
                                </Button>
                                <Button 
                                  size="sm" 
                                  className="w-full text-xs py-0 h-7"
                                  onClick={() => openClaimDialog(lead)}
                                >
                                  Claim
                                </Button>
                              </div>
                            </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                  
                  {/* Active Leads Column */}
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-amber-50 p-3 border-b">
                      <h3 className="font-medium flex items-center">
                        <Activity className="h-4 w-4 text-amber-500 mr-2" />
                        Active/Contacted
                        <Badge className="ml-2 bg-amber-100 text-amber-800">
                          {filteredLeads.filter(l => ['active', 'contacted', 'in_progress'].includes(l.status)).length}
                        </Badge>
                      </h3>
                    </div>
                    <ScrollArea className="h-[500px] p-2">
                      <div className="space-y-2 pr-2">
                        {filteredLeads
                          .filter(l => ['active', 'contacted', 'in_progress'].includes(l.status))
                          .map(lead => (
                            <Card key={lead.id} className="p-3">
                              <div className="flex justify-between">
                                <h4 className="font-medium">{lead.name}</h4>
                                {getPriorityBadge(lead.priority)}
                              </div>
                              
                              {lead.companyName && (
                                <div className="text-xs text-muted-foreground mb-2 flex items-center">
                                  <Building className="h-3 w-3 mr-1" />
                                  {lead.companyName}
                                </div>
                              )}
                              
                              <div className="flex justify-between text-xs mb-2">
                                <span>{formatCurrency(lead.value || lead.estimatedOrderValue)}</span>
                                <span>{formatTimeAgo(lead.createdAt)}</span>
                              </div>
                              
                              <div className="flex space-x-1 mt-2">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="w-full text-xs py-0 h-7"
                                  onClick={() => viewLeadDetails(lead)}
                                >
                                  View
                                </Button>
                                <Button 
                                  size="sm" 
                                  className="w-full text-xs py-0 h-7"
                                  onClick={() => openClaimDialog(lead)}
                                >
                                  Claim
                                </Button>
                              </div>
                            </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                  
                  {/* Hot Leads Column */}
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-green-50 p-3 border-b">
                      <h3 className="font-medium flex items-center">
                        <Star className="h-4 w-4 text-green-500 mr-2" />
                        Hot Leads
                        <Badge className="ml-2 bg-green-100 text-green-800">
                          {filteredLeads.filter(l => ['hot', 'qualified', 'ready'].includes(l.status) || l.priority === 'high').length}
                        </Badge>
                      </h3>
                    </div>
                    <ScrollArea className="h-[500px] p-2">
                      <div className="space-y-2 pr-2">
                        {filteredLeads
                          .filter(l => ['hot', 'qualified', 'ready'].includes(l.status) || l.priority === 'high')
                          .map(lead => (
                            <Card key={lead.id} className="p-3">
                              <div className="flex justify-between">
                                <h4 className="font-medium">{lead.name}</h4>
                                {getPriorityBadge(lead.priority)}
                              </div>
                              
                              {lead.companyName && (
                                <div className="text-xs text-muted-foreground mb-2 flex items-center">
                                  <Building className="h-3 w-3 mr-1" />
                                  {lead.companyName}
                                </div>
                              )}
                              
                              <div className="flex justify-between text-xs mb-2">
                                <span>{formatCurrency(lead.value || lead.estimatedOrderValue)}</span>
                                <span>{formatTimeAgo(lead.createdAt)}</span>
                              </div>
                              
                              <div className="flex space-x-1 mt-2">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="w-full text-xs py-0 h-7"
                                  onClick={() => viewLeadDetails(lead)}
                                >
                                  View
                                </Button>
                                <Button 
                                  size="sm" 
                                  className="w-full text-xs py-0 h-7"
                                  onClick={() => openClaimDialog(lead)}
                                >
                                  Claim
                                </Button>
                              </div>
                            </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
        
        <CardFooter className="border-t pt-6 flex justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {filteredLeads.length} {filteredLeads.length === 1 ? 'lead' : 'leads'}
            {(searchTerm || selectedStatus !== "all" || selectedSource !== "all" || selectedPriority !== "all" || timeRange !== "all") && ' with current filters'}
          </div>
          {(searchTerm || selectedStatus !== "all" || selectedSource !== "all" || selectedPriority !== "all" || timeRange !== "all") && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                setSearchTerm("");
                setSelectedStatus("all");
                setSelectedSource("all");
                setSelectedPriority("all");
                setTimeRange("all");
              }}
            >
              <X className="h-4 w-4 mr-1" />
              Clear filters
            </Button>
          )}
        </CardFooter>
      </Card>
      
      {/* Lead Details Sheet */}
      <Sheet open={isLeadDetailOpen} onOpenChange={setIsLeadDetailOpen}>
        <SheetContent className="sm:max-w-xl w-full overflow-y-auto">
          <SheetHeader className="pb-4">
            <SheetTitle>Lead Details</SheetTitle>
            <SheetDescription>
              View complete information about this lead
            </SheetDescription>
          </SheetHeader>
          
          {selectedLead && (
            <div className="space-y-6 mt-2">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-semibold">{selectedLead.name}</h2>
                  {selectedLead.companyName && (
                    <p className="text-muted-foreground flex items-center">
                      <Building className="h-4 w-4 mr-1" />
                      {selectedLead.companyName}
                      {selectedLead.industry && ` • ${selectedLead.industry}`}
                    </p>
                  )}
                </div>
                <div>
                  {getPriorityBadge(selectedLead.priority)}
                </div>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Contact Information</h3>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 text-muted-foreground mr-2" />
                      <span className="text-sm">{selectedLead.email}</span>
                    </div>
                    
                    {selectedLead.phone && (
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 text-muted-foreground mr-2" />
                        <span className="text-sm">{selectedLead.phone}</span>
                      </div>
                    )}
                    
                    {selectedLead.contactTitle && (
                      <div className="flex items-center">
                        <Briefcase className="h-4 w-4 text-muted-foreground mr-2" />
                        <span className="text-sm">{selectedLead.contactTitle}</span>
                      </div>
                    )}
                    
                    {selectedLead.location && (
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 text-muted-foreground mr-2" />
                        <span className="text-sm">{selectedLead.location}</span>
                      </div>
                    )}
                    
                    {selectedLead.website && (
                      <div className="flex items-center">
                        <ExternalLink className="h-4 w-4 text-muted-foreground mr-2" />
                        <a
                          href={selectedLead.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {selectedLead.website}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Lead Information</h3>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 text-muted-foreground mr-2" />
                      <span className="text-sm font-medium">
                        Estimated Value: {formatCurrency(selectedLead.value || selectedLead.estimatedOrderValue)}
                      </span>
                    </div>
                    
                    <div className="flex items-center">
                      <CalendarIcon2 className="h-4 w-4 text-muted-foreground mr-2" />
                      <span className="text-sm">
                        Created: {formatDate(selectedLead.createdAt)}
                      </span>
                    </div>
                    
                    <div className="flex items-center">
                      <Info className="h-4 w-4 text-muted-foreground mr-2" />
                      <span className="text-sm">
                        Source: {selectedLead.source}
                      </span>
                    </div>
                    
                    {selectedLead.referredBy && (
                      <div className="flex items-center">
                        <Users className="h-4 w-4 text-muted-foreground mr-2" />
                        <span className="text-sm">
                          Referred By: {selectedLead.referredBy}
                        </span>
                      </div>
                    )}
                    
                    {selectedLead.leadScore && (
                      <div className="flex items-center">
                        <CheckCircle2 className="h-4 w-4 text-muted-foreground mr-2" />
                        <span className="text-sm">
                          Lead Score: {selectedLead.leadScore}/100
                        </span>
                      </div>
                    )}
                    
                    {selectedLead.potentialItems && (
                      <div className="flex items-center">
                        <Package className="h-4 w-4 text-muted-foreground mr-2" />
                        <span className="text-sm">
                          Potential Items: {selectedLead.potentialItems}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {selectedLead.notes && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-medium mb-2">Notes</h3>
                    <div className="bg-muted/50 p-3 rounded-md text-sm">
                      {selectedLead.notes}
                    </div>
                  </div>
                </>
              )}
              
              {selectedLead.tags && selectedLead.tags.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-medium mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-1">
                      {selectedLead.tags.map((tag, index) => (
                        <Badge key={index} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}
              
              <div className="pt-4 space-y-2">
                <Button 
                  className="w-full"
                  onClick={() => {
                    setIsLeadDetailOpen(false);
                    openClaimDialog(selectedLead);
                  }}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Claim this Lead
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setIsLeadDetailOpen(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
      
      {/* Claim Lead Dialog */}
      <Dialog open={isClaimDialogOpen} onOpenChange={setIsClaimDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Claim Lead</DialogTitle>
            <DialogDescription>
              You are about to claim this lead. Once claimed, you will be responsible for following up and managing this lead.
            </DialogDescription>
          </DialogHeader>
          
          {selectedLead && (
            <div className="space-y-4 py-4">
              <div className="bg-muted/40 p-3 rounded-md">
                <div className="flex justify-between">
                  <h4 className="font-medium">{selectedLead.name}</h4>
                  {getPriorityBadge(selectedLead.priority)}
                </div>
                
                {selectedLead.companyName && (
                  <p className="text-sm text-muted-foreground flex items-center mt-1">
                    <Building className="h-3 w-3 mr-1" />
                    {selectedLead.companyName}
                  </p>
                )}
                
                <div className="flex justify-between text-sm mt-2">
                  <span className="font-medium">{formatCurrency(selectedLead.value || selectedLead.estimatedOrderValue)}</span>
                  <span className="text-muted-foreground">{formatTimeAgo(selectedLead.createdAt)}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="claimNotes">Notes</Label>
                <Textarea 
                  id="claimNotes" 
                  placeholder="Add any notes about your plan to follow up with this lead..."
                  value={claimNotes}
                  onChange={(e) => setClaimNotes(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  These notes will be attached to the lead claim history.
                </p>
              </div>
              
              <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-amber-800">Important Notice</h4>
                    <p className="text-sm text-amber-700 mt-1">
                      After claiming this lead, you will be redirected to the order creation page to begin processing this lead immediately.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter className="flex space-x-2 sm:space-x-0">
            <Button variant="outline" onClick={() => setIsClaimDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleClaimSubmit} disabled={claimLeadMutation.isPending}>
              {claimLeadMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Claiming...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Claim Lead & Proceed
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Guide Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100">
        <CardHeader>
          <CardTitle className="text-blue-800">Unclaimed Leads Guide</CardTitle>
          <CardDescription className="text-blue-700">
            Learn how to effectively manage and claim leads in our system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-blue-900">
          <div className="space-y-2">
            <h3 className="font-medium">What are Unclaimed Leads?</h3>
            <p className="text-sm">
              Unclaimed leads are potential customers who have expressed interest in our products or services but haven't yet been assigned to a specific sales representative for follow-up.
            </p>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-medium">How to Claim a Lead</h3>
            <ol className="text-sm space-y-1 list-decimal ml-4">
              <li>Browse the available leads and review their details</li>
              <li>Focus on leads that match your expertise and sales goals</li>
              <li>Click the "Claim" button for the lead you want to pursue</li>
              <li>Add any relevant notes about your follow-up plan</li>
              <li>Complete the order creation process immediately after claiming</li>
            </ol>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-medium">Best Practices</h3>
            <ul className="text-sm space-y-1 list-disc ml-4">
              <li>Respond to leads quickly – the first 24 hours are critical</li>
              <li>Prioritize high-value leads and those marked as high priority</li>
              <li>Be selective and focus on quality over quantity</li>
              <li>Document all interactions thoroughly</li>
              <li>Follow the complete sales process after claiming a lead</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="border-t border-blue-100 pt-4 flex justify-end">
          <Button asChild variant="outline" className="border-blue-200 bg-white/80">
            <Link href="/sales-process-guide">
              View Complete Sales Guide
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}