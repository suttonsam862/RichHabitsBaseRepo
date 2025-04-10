import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { 
  Users, ShoppingBag, DollarSign, MessageSquare, Bell, 
  TrendingUp, BarChart, PhoneCall, Calendar, ArrowUpRight,
  UserCheck, ArrowRight, Zap, TrendingDown, Clock
} from "lucide-react";
import StatsCard from "@/components/stats-card";
import RevenueChart from "@/components/revenue-chart";
import RecentActivity from "@/components/recent-activity";
import RecentLeads from "@/components/recent-leads";
import RecentOrders from "@/components/recent-orders";
import ThemeToggle from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";
import { StatCard, DashboardStats } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";

export default function Dashboard() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  
  const { data, isLoading } = useQuery({
    queryKey: ['/api/dashboard/stats'],
    refetchInterval: false,
    refetchOnWindowFocus: false,
  });

  // Stats from API
  const stats: DashboardStats = data?.data || {
    totalLeads: 0,
    activeOrders: 0,
    monthlyRevenue: "$0",
    unreadMessages: 0,
  };

  // Define KPI cards with more modern metrics
  const statsCards: StatCard[] = [
    {
      title: "Active Leads",
      value: stats.totalLeads,
      change: stats.totalLeads > 0 ? "+3 this week" : "No change",
      icon: <Users size={20} />,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-500",
    },
    {
      title: "In Progress",
      value: stats.activeOrders,
      change: stats.activeOrders > 0 ? "8% increase" : "No change",
      icon: <ShoppingBag size={20} />,
      iconBg: "bg-orange-50",
      iconColor: "text-orange-500",
    },
    {
      title: "Revenue",
      value: stats.monthlyRevenue,
      change: parseFloat(stats.monthlyRevenue.replace(/[^0-9.-]+/g, "")) > 0 ? "3% growth" : "No change",
      icon: <DollarSign size={20} />,
      iconBg: "bg-green-50",
      iconColor: "text-green-500",
    },
    {
      title: "Notifications",
      value: stats.unreadMessages,
      change: stats.unreadMessages > 0 ? "New messages" : "No new messages",
      icon: <MessageSquare size={20} />,
      iconBg: "bg-purple-50",
      iconColor: "text-purple-500",
    },
  ];

  // Additional KPI cards (for second row)
  const additionalMetrics: StatCard[] = [
    {
      title: "Conversion Rate",
      value: "18.6%",
      change: "+2.4% from last month",
      icon: <TrendingUp size={20} />,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-500",
    },
    {
      title: "Avg Order Value",
      value: "$1,842",
      change: "+$120 from last month",
      icon: <BarChart size={20} />,
      iconBg: "bg-cyan-50",
      iconColor: "text-cyan-500",
    },
    {
      title: "Client Calls",
      value: "24",
      change: "6 scheduled today",
      icon: <PhoneCall size={20} />,
      iconBg: "bg-fuchsia-50",
      iconColor: "text-fuchsia-500",
    },
    {
      title: "Upcoming Tasks",
      value: "12",
      change: "3 due today",
      icon: <Calendar size={20} />,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-500",
    },
  ];

  // Quick access links for dashboard
  const quickLinks = [
    { name: "Add New Lead", href: "/leads", icon: <UserCheck size={18} />, color: "bg-blue-500", enabled: true },
    { name: "Create Order", href: "/orders", icon: <ShoppingBag size={18} />, color: "bg-green-500", enabled: true },
    { name: "Client Messages", href: "/messages", icon: <MessageSquare size={18} />, color: "bg-purple-500", enabled: true },
    { name: "Schedule Call", href: "/calendar", icon: <PhoneCall size={18} />, color: "bg-orange-500", enabled: false },
  ];

  // Pending approval items
  const pendingItems = [
    { name: "Design Approval: #RH-2205", status: "Waiting for Client", time: "2 days ago" },
    { name: "Quote Review: Premium Custom Jersey", status: "Ready for Review", time: "5 hours ago" },
    { name: "Manufacturing Start: Order #41654", status: "Pending Materials", time: "Just now" },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 py-4 px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
            <span className="ml-3 text-sm text-gray-500">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </span>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="p-2 rounded-md text-gray-500 hover:bg-gray-100 focus:ring-2 focus:ring-gray-200"
              >
                <Bell size={20} />
              </Button>
              {stats.unreadMessages > 0 && (
                <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
              )}
            </div>
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Dashboard content */}
      <div className="p-6 flex-1 overflow-auto">
        {/* Dashboard welcome */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {user?.fullName || 'User'}</h2>
          <p className="text-gray-600">Here's what's happening with your business today.</p>
        </div>

        {/* Main metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {statsCards.map((card, index) => (
            <StatsCard key={index} card={card} />
          ))}
        </div>

        {/* Additional performance metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {additionalMetrics.map((card, index) => (
            <StatsCard key={`additional-${index}`} card={card} />
          ))}
        </div>

        {/* Quick actions row */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickLinks.map((link, index) => (
              <Link key={index} href={link.href}>
                <Button 
                  variant="outline"
                  disabled={!link.enabled}
                  className={`w-full h-24 flex flex-col items-center justify-center space-y-2 border-2 ${
                    link.enabled ? 'hover:border-gray-300 hover:bg-gray-50' : 'opacity-60'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full ${link.color} flex items-center justify-center text-white`}>
                    {link.icon}
                  </div>
                  <span className="text-sm font-medium">{link.name}</span>
                </Button>
              </Link>
            ))}
          </div>
        </div>

        {/* Main chart and activity feed */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <RevenueChart />
          <RecentActivity />
        </div>

        {/* Pending approval items */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Needs Your Attention</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {pendingItems.map((item, index) => (
              <Card key={index} className="overflow-hidden border border-gray-200 hover:border-gray-300 transition-all">
                <CardContent className="p-0">
                  <div className="p-4">
                    <h4 className="font-medium text-gray-900 mb-1">{item.name}</h4>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500 flex items-center">
                        <Clock size={14} className="mr-1 text-gray-400" />
                        {item.time}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        item.status.includes("Waiting") 
                          ? "bg-yellow-100 text-yellow-800" 
                          : item.status.includes("Ready") 
                            ? "bg-green-100 text-green-800"
                            : "bg-blue-100 text-blue-800"
                      }`}>
                        {item.status}
                      </span>
                    </div>
                  </div>
                  <div className="border-t border-gray-100 bg-gray-50 p-3">
                    <Button 
                      variant="ghost" 
                      className="w-full justify-between text-sm text-gray-600 hover:text-gray-900"
                    >
                      Review Now
                      <ArrowRight size={16} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Leads and Orders */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentLeads />
          <RecentOrders />
        </div>
      </div>
    </div>
  );
}
