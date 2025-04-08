import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { 
  Users, 
  ShoppingBag, 
  DollarSign, 
  MessageSquare, 
  Bell, 
  Calendar, 
  LayoutDashboard 
} from "lucide-react";
import StatsCard from "@/components/stats-card";
import RevenueChart from "@/components/revenue-chart";
import RecentActivity from "@/components/recent-activity";
import RecentLeads from "@/components/recent-leads";
import RecentOrders from "@/components/recent-orders";
import ThemeToggle from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard, DashboardStats } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

export default function Dashboard() {
  const { data, isLoading } = useQuery<{data: DashboardStats}>({
    queryKey: ['/api/dashboard/stats'],
    refetchInterval: false,
    refetchOnWindowFocus: false,
  });

  const { user } = useAuth();
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Stats data
  const stats: DashboardStats = data?.data || {
    totalLeads: 248,
    activeOrders: 36,
    monthlyRevenue: "$42,586",
    unreadMessages: 12,
  };

  const statsCards: StatCard[] = [
    {
      title: "Total Leads",
      value: stats.totalLeads,
      change: "12% increase",
      icon: <Users size={20} />,
      iconBg: "bg-blue-50 dark:bg-blue-900/20",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    {
      title: "Active Orders",
      value: stats.activeOrders,
      change: "8% increase",
      icon: <ShoppingBag size={20} />,
      iconBg: "bg-orange-50 dark:bg-orange-900/20",
      iconColor: "text-orange-600 dark:text-orange-400",
    },
    {
      title: "Monthly Revenue",
      value: stats.monthlyRevenue,
      change: "3% decrease",
      icon: <DollarSign size={20} />,
      iconBg: "bg-green-50 dark:bg-green-900/20",
      iconColor: "text-green-600 dark:text-green-400",
    },
    {
      title: "Unread Messages",
      value: stats.unreadMessages,
      change: "5 new today",
      icon: <MessageSquare size={20} />,
      iconBg: "bg-purple-50 dark:bg-purple-900/20",
      iconColor: "text-purple-600 dark:text-purple-400",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header with welcome message */}
      <div className="bg-white dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800">
        <div className="container py-4 md:py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
              <p className="text-muted-foreground mt-1">
                Welcome back, {user?.firstName || user?.username}. Today is {currentDate}.
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" className="hidden md:flex">
                <Calendar className="mr-2 h-4 w-4" />
                View Calendar
              </Button>
              
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <Bell size={18} />
                  <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
                </Button>
              </div>
              
              <Avatar className="h-9 w-9 hidden md:flex">
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0) || ''}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard content */}
      <div className="container space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {statsCards.map((card, index) => (
            <StatsCard key={index} card={card} />
          ))}
        </div>

        {/* Charts and Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          <Card className="col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">Revenue Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <RevenueChart />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <RecentActivity />
            </CardContent>
          </Card>
        </div>

        {/* Recent Leads and Orders */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">Recent Leads</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <RecentLeads />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">Recent Orders</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <RecentOrders />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
