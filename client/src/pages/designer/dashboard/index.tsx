import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "wouter";
import {
  Clock,
  DollarSign,
  CheckCircle,
  AlertTriangle,
  Calendar,
  PenTool,
  AlarmClock,
  Award,
  ChevronRight,
  ThumbsUp,
  FileText,
  TrendingUp,
} from "lucide-react";
import { differenceInHours, format, formatDistance, formatDistanceToNow } from "date-fns";
import { useAuth } from "@/hooks/use-auth";

export default function DesignerDashboard() {
  const { user } = useAuth();
  
  // Fetch designer's pending design jobs
  const { data: pendingDesigns, isLoading: isLoadingPending } = useQuery({
    queryKey: ['/api/designer/jobs/pending'],
    queryFn: async ({ queryKey }) => {
      // This would fetch from API in production
      // Placeholder data for UI development
      return {
        data: [],
      };
    },
  });
  
  // Fetch designer's completed designs this month
  const { data: completedDesigns, isLoading: isLoadingCompleted } = useQuery({
    queryKey: ['/api/designer/jobs/completed'],
    queryFn: async ({ queryKey }) => {
      // This would fetch from API in production
      // Placeholder data for UI development
      return {
        data: [],
      };
    },
  });
  
  // Fetch designer's stats and earnings
  const { data: designerStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['/api/designer/stats'],
    queryFn: async ({ queryKey }) => {
      // This would fetch from API in production
      // Placeholder data for UI development
      return {
        data: {
          totalEarningsThisMonth: 0,
          designsCompleted: 0,
          averageTurnaroundTime: 0,
          pendingJobsCount: 0,
          revisionsRequestedCount: 0,
          payoutPending: 0,
          completionRate: 0,
          currentWorkload: 0,
          maxWorkload: 10,
        },
      };
    },
  });
  
  const stats = designerStats?.data || {
    totalEarningsThisMonth: 0,
    designsCompleted: 0,
    averageTurnaroundTime: 0,
    pendingJobsCount: 0,
    revisionsRequestedCount: 0,
    payoutPending: 0,
    completionRate: 0,
    currentWorkload: 0,
    maxWorkload: 10,
  };
  
  // Function to calculate hours remaining and urgency
  const getTimeRemaining = (deadline: string) => {
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const hoursRemaining = differenceInHours(deadlineDate, now);
    
    let urgency = "normal";
    if (hoursRemaining < 12) {
      urgency = "high";
    } else if (hoursRemaining < 24) {
      urgency = "medium";
    }
    
    return { hoursRemaining, urgency };
  };
  
  // Function to render the deadline badge
  const DeadlineBadge = ({ deadline }: { deadline: string }) => {
    const { hoursRemaining, urgency } = getTimeRemaining(deadline);
    
    if (urgency === "high") {
      return (
        <Badge className="bg-red-100 text-red-800 ml-2">
          <AlarmClock className="w-3 h-3 mr-1" /> {hoursRemaining}h left
        </Badge>
      );
    } else if (urgency === "medium") {
      return (
        <Badge className="bg-yellow-100 text-yellow-800 ml-2">
          <Clock className="w-3 h-3 mr-1" /> {hoursRemaining}h left
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-green-100 text-green-800 ml-2">
          <Clock className="w-3 h-3 mr-1" /> {hoursRemaining}h left
        </Badge>
      );
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Welcome message and stats summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">Welcome, {user?.fullName || "Designer"}</CardTitle>
          <CardDescription>
            Here's an overview of your design work and earnings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
            {/* Current earnings */}
            <Card>
              <CardContent className="p-4 flex items-center space-x-4">
                <div className="p-2 bg-green-50 rounded-full">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Month Earnings</p>
                  <h4 className="text-2xl font-bold">${stats.totalEarningsThisMonth.toFixed(2)}</h4>
                </div>
              </CardContent>
            </Card>
            
            {/* Designs completed */}
            <Card>
              <CardContent className="p-4 flex items-center space-x-4">
                <div className="p-2 bg-blue-50 rounded-full">
                  <CheckCircle className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Designs Completed</p>
                  <h4 className="text-2xl font-bold">{stats.designsCompleted}</h4>
                </div>
              </CardContent>
            </Card>
            
            {/* Pending designs */}
            <Card>
              <CardContent className="p-4 flex items-center space-x-4">
                <div className="p-2 bg-yellow-50 rounded-full">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending Jobs</p>
                  <h4 className="text-2xl font-bold">{stats.pendingJobsCount}</h4>
                </div>
              </CardContent>
            </Card>
            
            {/* Revision requests */}
            <Card>
              <CardContent className="p-4 flex items-center space-x-4">
                <div className="p-2 bg-purple-50 rounded-full">
                  <AlertTriangle className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Revision Requests</p>
                  <h4 className="text-2xl font-bold">{stats.revisionsRequestedCount}</h4>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
      
      {/* Workload and stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Current workload card */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Current Workload</CardTitle>
            <CardDescription>
              Your active design queue capacity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span>{stats.currentWorkload} designs in progress</span>
                <span className="text-muted-foreground">Capacity: {stats.maxWorkload}</span>
              </div>
              <Progress value={(stats.currentWorkload / stats.maxWorkload) * 100} />
              
              <div className="pt-4 space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Award className="h-4 w-4 text-amber-500 mr-2" />
                    <span className="text-sm">Completion Rate</span>
                  </div>
                  <span className="text-sm font-medium">{stats.completionRate}%</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <AlarmClock className="h-4 w-4 text-green-500 mr-2" />
                    <span className="text-sm">Avg. Turnaround</span>
                  </div>
                  <span className="text-sm font-medium">{stats.averageTurnaroundTime} hours</span>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">
              <Link href="/unclaimed-designs">
                <span className="flex items-center">
                  <PenTool className="h-4 w-4 mr-2" />
                  Claim New Design Jobs
                </span>
              </Link>
            </Button>
          </CardFooter>
        </Card>
        
        {/* Pending designs list */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Your Active Design Jobs</CardTitle>
            <CardDescription>
              Designs you're currently working on with deadlines
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingPending ? (
              <div className="text-center py-6">Loading your active designs...</div>
            ) : pendingDesigns?.data?.length > 0 ? (
              <div className="space-y-4">
                {pendingDesigns.data.map((design: any) => (
                  <div 
                    key={design.id} 
                    className="border rounded-lg p-4 hover:border-primary/50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center mb-1">
                          <h3 className="font-medium">{design.orderName}</h3>
                          {design.deadline && <DeadlineBadge deadline={design.deadline} />}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Order #{design.orderId} • {design.itemCount} items
                        </p>
                      </div>
                      <Badge 
                        className={
                          design.priority === "high" 
                            ? "bg-red-100 text-red-800" 
                            : design.priority === "medium"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-blue-100 text-blue-800"
                        }
                      >
                        {design.priority === "high" ? "Urgent" : design.priority === "medium" ? "Priority" : "Standard"}
                      </Badge>
                    </div>
                    
                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1 text-muted-foreground" />
                        <span>
                          Claimed: {formatDistanceToNow(new Date(design.claimedAt), { addSuffix: true })}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <DollarSign className="h-3 w-3 mr-1 text-muted-foreground" />
                        <span>Payout: ${design.payout.toFixed(2)}</span>
                      </div>
                    </div>
                    
                    <div className="mt-3 flex justify-end">
                      <Button asChild variant="outline" className="text-xs h-8">
                        <Link href={`/design-job/${design.id}`}>
                          <span className="flex items-center">
                            View Job <ChevronRight className="h-3 w-3 ml-1" />
                          </span>
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <PenTool className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <h3 className="font-medium">No active design jobs</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  You currently don't have any active design jobs.
                </p>
                <Button asChild>
                  <Link href="/unclaimed-designs">Claim New Design Jobs</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Earnings and completed designs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="completed">
            <TabsList className="mb-4">
              <TabsTrigger value="completed">Completed Designs</TabsTrigger>
              <TabsTrigger value="earnings">Earnings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="completed">
              {isLoadingCompleted ? (
                <div className="text-center py-6">Loading your completed designs...</div>
              ) : completedDesigns?.data?.length > 0 ? (
                <div className="space-y-4">
                  {completedDesigns.data.map((design: any) => (
                    <div 
                      key={design.id} 
                      className="border rounded-lg p-4 hover:border-primary/50 transition-colors"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{design.orderName}</h3>
                            <Badge className="bg-green-100 text-green-800">Completed</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Order #{design.orderId} • Completed on {format(new Date(design.completedAt), 'MMM d, yyyy')}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">${design.payout.toFixed(2)}</div>
                          <div className="text-xs text-muted-foreground">
                            Turnaround: {design.turnaroundHours}h
                          </div>
                        </div>
                      </div>
                      
                      {design.feedback && (
                        <div className="mt-3 bg-slate-50 p-3 rounded-md">
                          <div className="flex items-start gap-2">
                            <ThumbsUp className="h-4 w-4 text-green-500 mt-0.5" />
                            <div>
                              <div className="text-sm font-medium">Client Feedback</div>
                              <p className="text-sm text-muted-foreground">{design.feedback}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <h3 className="font-medium">No completed designs yet</h3>
                  <p className="text-sm text-muted-foreground">
                    Your completed design jobs will appear here.
                  </p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="earnings">
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medium">Current Month Earnings</h3>
                    <div className="text-2xl font-bold">${stats.totalEarningsThisMonth.toFixed(2)}</div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center">
                        <TrendingUp className="h-4 w-4 mr-2 text-green-500" />
                        <span>Designs Completed</span>
                      </div>
                      <span>{stats.designsCompleted}</span>
                    </div>
                    
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-2 text-green-500" />
                        <span>Pending Payout</span>
                      </div>
                      <span>${stats.payoutPending.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Payment Schedule</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Payouts are processed on the 1st and 15th of each month for all completed and approved designs.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}