import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Users, ShoppingBag, DollarSign, MessageSquare, Bell } from "lucide-react";
import StatsCard from "@/components/stats-card";
import RevenueChart from "@/components/revenue-chart";
import RecentActivity from "@/components/recent-activity";
import RecentLeads from "@/components/recent-leads";
import RecentOrders from "@/components/recent-orders";
import ThemeToggle from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";
import { StatCard, DashboardStats } from "@/types";
import { formatCurrency } from "@/lib/utils";

export default function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['/api/dashboard/stats'],
    refetchInterval: false,
    refetchOnWindowFocus: false,
  });

  // Sample stats - would normally come from the API
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
      iconBg: "bg-brand-50 dark:bg-gray-700",
      iconColor: "text-brand-500 dark:text-brand-400",
    },
    {
      title: "Active Orders",
      value: stats.activeOrders,
      change: "8% increase",
      icon: <ShoppingBag size={20} />,
      iconBg: "bg-orange-50 dark:bg-gray-700",
      iconColor: "text-orange-500 dark:text-orange-400",
    },
    {
      title: "Monthly Revenue",
      value: stats.monthlyRevenue,
      change: "3% decrease",
      icon: <DollarSign size={20} />,
      iconBg: "bg-green-50 dark:bg-gray-700",
      iconColor: "text-green-500 dark:text-green-400",
    },
    {
      title: "Unread Messages",
      value: stats.unreadMessages,
      change: "5 new today",
      icon: <MessageSquare size={20} />,
      iconBg: "bg-purple-50 dark:bg-gray-700",
      iconColor: "text-purple-500 dark:text-purple-400",
    },
  ];

  return (
    <>
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-800 py-4 px-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">Dashboard</h1>
          
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Bell size={20} />
              </Button>
              <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Dashboard content */}
      <div className="p-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {statsCards.map((card, index) => (
            <StatsCard key={index} card={card} />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <RevenueChart />
          <RecentActivity />
        </div>

        {/* Recent Leads and Orders */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <RecentLeads />
          <RecentOrders />
        </div>
      </div>
    </>
  );
}
