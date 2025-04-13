import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  ShoppingCart, Users, PenTool, BarChart3, ArrowUpRight, 
  Loader2, DollarSign, CheckCircle, Clock, FileText, MessageSquare
} from "lucide-react";

export default function HybridDashboard() {
  const { user } = useAuth();
  
  // Fetch sales data
  const { data: salesData, isLoading: isLoadingSales } = useQuery({
    queryKey: ['/api/hybrid/sales/stats'],
    queryFn: async ({ queryKey }) => {
      // This would fetch from API in production
      return {
        data: {
          totalLeads: 12,
          openLeads: 4,
          myLeads: 8,
          claimedLeadsPercent: 67,
          activeOrders: 5,
          completedOrders: 15,
          totalRevenue: "$24,500",
          monthlySales: "$8,200",
        },
      };
    },
  });
  
  // Fetch design data
  const { data: designData, isLoading: isLoadingDesign } = useQuery({
    queryKey: ['/api/hybrid/design/stats'],
    queryFn: async ({ queryKey }) => {
      // This would fetch from API in production
      return {
        data: {
          pendingDesigns: 3,
          activeDesigns: 7,
          completedDesigns: 22,
          revisionRequests: 2,
          designsCompletedOnTime: 20,
          onTimePercentage: 91,
          averageTurnaroundDays: 2.4,
          designEarnings: "$5,800",
        },
      };
    },
  });
  
  const salesStats = salesData?.data || {
    totalLeads: 0,
    openLeads: 0,
    myLeads: 0,
    claimedLeadsPercent: 0,
    activeOrders: 0,
    completedOrders: 0,
    totalRevenue: "$0",
    monthlySales: "$0",
  };
  
  const designStats = designData?.data || {
    pendingDesigns: 0,
    activeDesigns: 0,
    completedDesigns: 0,
    revisionRequests: 0,
    designsCompletedOnTime: 0,
    onTimePercentage: 0,
    averageTurnaroundDays: 0,
    designEarnings: "$0",
  };
  
  const isLoading = isLoadingSales || isLoadingDesign;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Welcome, {user?.fullName}</h2>
        <p className="text-sm text-muted-foreground">Today's Date: {new Date().toLocaleDateString()}</p>
      </div>
      
      <Tabs defaultValue="sales" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sales">Sales Activity</TabsTrigger>
          <TabsTrigger value="design">Design Work</TabsTrigger>
        </TabsList>
        
        <TabsContent value="sales" className="space-y-4">
          {isLoading ? (
            <div className="h-96 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Key Sales Metrics */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{salesStats.totalRevenue}</div>
                    <p className="text-xs text-muted-foreground">
                      +12% from last month
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
                    <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{salesStats.activeOrders}</div>
                    <p className="text-xs text-muted-foreground">
                      {salesStats.completedOrders} completed this month
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">My Leads</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{salesStats.myLeads}</div>
                    <div className="mt-2">
                      <Progress value={salesStats.claimedLeadsPercent} className="h-2" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {salesStats.claimedLeadsPercent}% of total leads claimed
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Monthly Sales</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{salesStats.monthlySales}</div>
                    <p className="text-xs text-muted-foreground">
                      +18% from previous month
                    </p>
                  </CardContent>
                </Card>
              </div>
              
              {/* Sales Action Buttons */}
              <div className="grid gap-4 md:grid-cols-3">
                <Button variant="outline" className="w-full" onClick={() => window.location.href = "/leads/unclaimed"}>
                  View Unclaimed Leads <ArrowUpRight className="ml-2 h-4 w-4" />
                </Button>
                <Button variant="outline" className="w-full" onClick={() => window.location.href = "/orders"}>
                  Manage Active Orders <ArrowUpRight className="ml-2 h-4 w-4" />
                </Button>
                <Button variant="outline" className="w-full" onClick={() => window.location.href = "/orders/create"}>
                  Create New Order <ArrowUpRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </TabsContent>
        
        <TabsContent value="design" className="space-y-4">
          {isLoading ? (
            <div className="h-96 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Key Design Metrics */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Designs</CardTitle>
                    <PenTool className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{designStats.activeDesigns}</div>
                    <p className="text-xs text-muted-foreground">
                      {designStats.pendingDesigns} pending assignments
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Completed Designs</CardTitle>
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{designStats.completedDesigns}</div>
                    <p className="text-xs text-muted-foreground">
                      This month
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">On-Time Completion</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{designStats.onTimePercentage}%</div>
                    <div className="mt-2">
                      <Progress value={designStats.onTimePercentage} className="h-2" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Avg. turnaround: {designStats.averageTurnaroundDays} days
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Design Earnings</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{designStats.designEarnings}</div>
                    <p className="text-xs text-muted-foreground">
                      +8% from previous month
                    </p>
                  </CardContent>
                </Card>
              </div>
              
              {/* Design Action Buttons */}
              <div className="grid gap-4 md:grid-cols-3">
                <Button variant="outline" className="w-full" onClick={() => window.location.href = "/unclaimed-designs"}>
                  View Unclaimed Designs <ArrowUpRight className="ml-2 h-4 w-4" />
                </Button>
                <Button variant="outline" className="w-full" onClick={() => window.location.href = "/design-jobs"}>
                  My Design Jobs <ArrowUpRight className="ml-2 h-4 w-4" />
                </Button>
                <Button variant="outline" className="w-full" onClick={() => window.location.href = "/revisions"}>
                  Revision Requests ({designStats.revisionRequests}) <ArrowUpRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Quick Access Section */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Access</CardTitle>
          <CardDescription>
            Resources and frequently used tools
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Button variant="outline" className="justify-start" onClick={() => window.location.href = "/sales-process-guide"}>
            <FileText className="mr-2 h-4 w-4" />
            Sales Process Guide
          </Button>
          <Button variant="outline" className="justify-start" onClick={() => window.location.href = "/design-process-guide"}>
            <FileText className="mr-2 h-4 w-4" />
            Design Process Guide
          </Button>
          <Button variant="outline" className="justify-start" onClick={() => window.location.href = "/design-communication"}>
            <MessageSquare className="mr-2 h-4 w-4" />
            Design Communication
          </Button>
          <Button variant="outline" className="justify-start" onClick={() => window.location.href = "/production-communication"}>
            <MessageSquare className="mr-2 h-4 w-4" />
            Production Communication
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}