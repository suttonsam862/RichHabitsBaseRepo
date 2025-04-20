import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import {
  Calendar,
  Clock,
  Edit,
  Loader2,
  MapPin,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Users
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";

// Function to format currency
const formatCurrency = (amount: string | number | null | undefined) => {
  if (amount === null || amount === undefined) return "$0";
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return num.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
};

export default function CampsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  // Fetch all camps
  const {
    data: camps,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ["/api/camps"],
    staleTime: 60000, // 1 minute
  });
  
  // Delete camp mutation
  const deleteCampMutation = useMutation({
    mutationFn: async (campId: number) => {
      const res = await fetch(`/api/camps/${campId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to delete camp");
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Camp deleted",
        description: "The camp has been successfully deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/camps"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Filter camps based on search term
  const filteredCamps = camps?.data ? camps.data.filter((camp: any) => {
    const searchString = searchTerm.toLowerCase();
    return (
      camp.name?.toLowerCase().includes(searchString) ||
      camp.location?.toLowerCase().includes(searchString) ||
      camp.status?.toLowerCase().includes(searchString) ||
      camp.sportType?.toLowerCase().includes(searchString)
    );
  }) : [];
  
  // Split camps by status for tabs
  const upcomingCamps = filteredCamps?.filter((camp: any) => 
    camp.status === 'upcoming' || camp.status === 'scheduled'
  ) || [];
  
  const activeCamps = filteredCamps?.filter((camp: any) => 
    camp.status === 'active' || camp.status === 'in-progress'
  ) || [];
  
  const completedCamps = filteredCamps?.filter((camp: any) => 
    camp.status === 'completed' || camp.status === 'past'
  ) || [];
  
  // Handle delete camp
  const handleDeleteCamp = (campId: number, campName: string) => {
    if (window.confirm(`Are you sure you want to delete "${campName}"?`)) {
      deleteCampMutation.mutate(campId);
    }
  };
  
  // Calculate financial stats
  const calculateFinancials = (campsList: any[]) => {
    let potentialRevenue = 0;
    let actualRevenue = 0;
    let estimatedRevenue = 0;
    
    campsList.forEach(camp => {
      // Potential revenue from sellout
      if (camp.selloutCost) {
        const selloutCost = typeof camp.selloutCost === 'string' 
          ? parseFloat(camp.selloutCost) 
          : camp.selloutCost;
        if (!isNaN(selloutCost)) {
          potentialRevenue += selloutCost;
        }
      }
      
      // Actual revenue from totalPaid
      if (camp.totalPaid) {
        const totalPaid = typeof camp.totalPaid === 'string' 
          ? parseFloat(camp.totalPaid) 
          : camp.totalPaid;
        if (!isNaN(totalPaid)) {
          actualRevenue += totalPaid;
        }
      }
      
      // Estimated revenue from registrations * avgCost
      if (camp.registrations && camp.avgCost) {
        const registrations = typeof camp.registrations === 'string'
          ? parseFloat(camp.registrations)
          : camp.registrations;
        
        const avgCost = typeof camp.avgCost === 'string'
          ? parseFloat(camp.avgCost)
          : camp.avgCost;
        
        if (!isNaN(registrations) && !isNaN(avgCost)) {
          estimatedRevenue += registrations * avgCost;
        }
      }
    });
    
    return {
      potentialRevenue: formatCurrency(potentialRevenue),
      actualRevenue: formatCurrency(actualRevenue),
      estimatedRevenue: formatCurrency(estimatedRevenue),
    };
  };
  
  // Render status badge with appropriate color
  const renderStatusBadge = (status: string) => {
    let variant: "default" | "secondary" | "destructive" | "outline" = "default";
    
    switch (status?.toLowerCase()) {
      case 'upcoming':
      case 'scheduled':
        variant = "secondary";
        break;
      case 'active':
      case 'in-progress':
        variant = "default";
        break;
      case 'completed':
      case 'past':
        variant = "outline";
        break;
      case 'cancelled':
        variant = "destructive";
        break;
      default:
        variant = "outline";
    }
    
    return <Badge variant={variant}>{status}</Badge>;
  };
  
  // Render camp card
  const renderCampCard = (camp: any) => {
    const startDate = camp.startDate ? new Date(camp.startDate) : null;
    const endDate = camp.endDate ? new Date(camp.endDate) : null;
    
    // Format date range
    const dateRange = startDate && endDate ? 
      `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}` : 
      'Dates not set';
    
    return (
      <Card key={camp.id} className="mb-4">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl font-bold">{camp.name}</CardTitle>
              <CardDescription className="flex items-center mt-1">
                <MapPin className="h-4 w-4 mr-1" />
                {camp.location || 'Location not set'}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {renderStatusBadge(camp.status || 'Draft')}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate(`/events/camp/${camp.id}`)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Camp
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate(`/events/camp/${camp.id}/schedule`)}>
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate(`/events/camp/${camp.id}/staff`)}>
                    <Users className="h-4 w-4 mr-2" />
                    Staff
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-red-600"
                    onClick={() => handleDeleteCamp(camp.id, camp.name)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pb-2">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Date</div>
              <div className="font-medium flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                {dateRange}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Sport</div>
              <div className="font-medium">{camp.sportType || 'Not specified'}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Participants</div>
              <div className="font-medium flex items-center">
                <Users className="h-4 w-4 mr-1" />
                {camp.registrations || 0}/{camp.participants || '-'}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Revenue</div>
              <div className="font-medium">
                {formatCurrency(camp.totalPaid)} / {formatCurrency(camp.selloutCost)}
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="pt-2">
          <Button
            variant="outline"
            size="sm"
            className="ml-auto"
            onClick={() => navigate(`/events/camp/${camp.id}`)}
          >
            View Details
          </Button>
        </CardFooter>
      </Card>
    );
  };
  
  // Calculate financials for display
  const upcomingFinancials = calculateFinancials(upcomingCamps);
  const activeFinancials = calculateFinancials(activeCamps);
  const completedFinancials = calculateFinancials(completedCamps);
  const allFinancials = calculateFinancials(filteredCamps || []);
  
  if (error) {
    return (
      <div className="container mx-auto py-10 text-center">
        <h1 className="text-2xl font-bold mb-4">Error loading camps</h1>
        <p className="text-red-500 mb-4">{error instanceof Error ? error.message : "Unknown error"}</p>
        <Button onClick={() => refetch()}>Try Again</Button>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Camps</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <RefreshCw className="h-5 w-5" />
            )}
          </Button>
          <Button onClick={() => navigate("/events/camp/new")}>
            <Plus className="h-4 w-4 mr-2" /> New Camp
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
          <Input
            placeholder="Search camps..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="pl-9 w-full"
          />
        </div>
      </div>

      {/* Financial Overview */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Financial Overview</CardTitle>
          <CardDescription>Revenue summary for all camps</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-muted/30 rounded-lg">
              <div className="text-muted-foreground mb-1">Potential Revenue</div>
              <div className="text-2xl font-bold">{allFinancials.potentialRevenue}</div>
              <div className="text-sm text-muted-foreground">Maximum possible revenue at full capacity</div>
            </div>
            <div className="p-4 bg-muted/30 rounded-lg">
              <div className="text-muted-foreground mb-1">Actual Revenue</div>
              <div className="text-2xl font-bold">{allFinancials.actualRevenue}</div>
              <div className="text-sm text-muted-foreground">Total confirmed payments received</div>
            </div>
            <div className="p-4 bg-muted/30 rounded-lg">
              <div className="text-muted-foreground mb-1">Estimated Revenue</div>
              <div className="text-2xl font-bold">{allFinancials.estimatedRevenue}</div>
              <div className="text-sm text-muted-foreground">Based on current registrations</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="all">
              All Camps ({filteredCamps?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="upcoming">
              Upcoming ({upcomingCamps.length})
            </TabsTrigger>
            <TabsTrigger value="active">
              Active ({activeCamps.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({completedCamps.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            {filteredCamps?.length === 0 ? (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium">No camps found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm ? "Try adjusting your search" : "Get started by creating your first camp"}
                </p>
                {!searchTerm && (
                  <Button onClick={() => navigate("/events/camp/new")}>
                    <Plus className="h-4 w-4 mr-2" /> Create Camp
                  </Button>
                )}
              </div>
            ) : (
              <div>
                {filteredCamps.map((camp: any) => renderCampCard(camp))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="upcoming">
            {upcomingCamps.length === 0 ? (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium">No upcoming camps</h3>
                <p className="text-muted-foreground">Create a new camp or update camp status</p>
              </div>
            ) : (
              <div>
                {upcomingCamps.map((camp: any) => renderCampCard(camp))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="active">
            {activeCamps.length === 0 ? (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium">No active camps</h3>
                <p className="text-muted-foreground">Update camp status when camps are in progress</p>
              </div>
            ) : (
              <div>
                {activeCamps.map((camp: any) => renderCampCard(camp))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed">
            {completedCamps.length === 0 ? (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium">No completed camps</h3>
                <p className="text-muted-foreground">Completed camps will appear here</p>
              </div>
            ) : (
              <div>
                {completedCamps.map((camp: any) => renderCampCard(camp))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}