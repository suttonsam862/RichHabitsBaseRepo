import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { 
  Users, 
  ShoppingBag, 
  DollarSign, 
  MessageSquare, 
  Bell
} from "lucide-react";
import StatsCard from "@/components/stats-card";
import RevenueChart from "@/components/revenue-chart";
import RecentActivity from "@/components/recent-activity";
import RecentLeads from "@/components/recent-leads";
import RecentOrders from "@/components/recent-orders";
import { StatCard, DashboardStats } from "@/types";
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Welcome back, {user?.username}. Today is {currentDate}.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((card, index) => (
          <StatsCard key={index} card={card} />
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <h2 className="text-lg font-medium mb-4">Revenue Overview</h2>
        <RevenueChart />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h2 className="text-lg font-medium mb-4">Recent Activity</h2>
          <RecentActivity />
        </div>
      </div>

      {/* Recent Leads and Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h2 className="text-lg font-medium mb-4">Recent Leads</h2>
          <RecentLeads />
        </div>
        
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h2 className="text-lg font-medium mb-4">Recent Orders</h2>
          <RecentOrders />
        </div>
      </div>
    </div>
  );
}
