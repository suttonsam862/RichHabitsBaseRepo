import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
// No tabs needed
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import LeadStepProgress from "@/components/leads/lead-step-progress";

export default function LeadsSteps() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  const { user } = useAuth();
  
  // Get user permissions and role info
  const isAdmin = user?.role === 'admin' || user?.role === 'executive';
  const isAgent = user?.role === 'agent' || user?.role === 'sales';
  const canViewAllLeads = user?.permissions?.includes('view_all_leads') || isAdmin;
  const currentUserId = user?.id?.toString();
  
  // Fetch leads data
  const { data, isLoading } = useQuery({
    queryKey: ['/api/leads'],
    refetchInterval: false,
    refetchOnWindowFocus: true,
  });
  
  // Use data from the API - use empty array as fallback
  const allLeads = data?.data || [];
  
  // Remove archived leads from the data set
  const leads = allLeads.filter((lead: any) => lead.status !== 'archived');
  
  // Filter the leads based on search term, status, and only show leads assigned to current user
  const filteredLeads = leads.filter((lead: any) => {
    // Filter by search term
    const matchesSearch = 
      searchTerm === "" || 
      lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filter by status
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    
    // Filter by assigned to current user
    const isAssignedToCurrentUser = lead.salesRepId === currentUserId;
    
    // Admin users can see all leads, others only see their assigned leads
    if (isAdmin) {
      return matchesSearch && matchesStatus;
    } else {
      return matchesSearch && matchesStatus && isAssignedToCurrentUser;
    }
  });
  
  // Get unique statuses for filter dropdown
  const statuses = ["all", ...new Set(leads.map((lead: any) => lead.status))];
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Leads Steps</h1>
          <p className="text-muted-foreground">
            Use this page to track and update the progress of your leads through the sales process.
          </p>
        </div>
        
        {/* Card content */}
        <Card>
          <CardHeader>
            <CardTitle>Lead Progress Tracking</CardTitle>
            <CardDescription>
              Follow leads through each step of the sales process. Update progress to keep track of where each lead stands.
            </CardDescription>
            
            {/* Search and filter controls */}
            <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2 mt-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground/70" />
                <Input
                  type="search"
                  placeholder="Search leads..."
                  className="w-full pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-muted-foreground/70" />
                <Select
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status === "all" ? "All Statuses" : 
                          status.charAt(0).toUpperCase() + status.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
              </div>
            ) : filteredLeads.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No leads found matching your criteria.</p>
                {searchTerm && (
                  <Button 
                    variant="link" 
                    onClick={() => setSearchTerm("")}
                    className="mt-2"
                  >
                    Clear search
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {filteredLeads.map((lead: any) => (
                  <LeadStepProgress 
                    key={lead.id} 
                    lead={lead} 
                    isAdmin={isAdmin}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}