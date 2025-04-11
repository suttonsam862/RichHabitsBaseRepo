import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
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
  
  // Main dashboard stats
  const { data, isLoading } = useQuery({
    queryKey: ['/api/dashboard/stats', user?.id],
    refetchInterval: false,
    refetchOnWindowFocus: false,
  });

  // Get additional analytics data
  const { data: revenueData } = useQuery({
    queryKey: ['/api/analytics/revenue/monthly', user?.id],
    refetchInterval: false,
    refetchOnWindowFocus: false,
  });
  
  const { data: ordersData } = useQuery({
    queryKey: ['/api/orders/recent', user?.id],
    refetchInterval: false,
    refetchOnWindowFocus: false,
  });
  
  const { data: leadsData } = useQuery({
    queryKey: ['/api/leads/recent', user?.id],
    refetchInterval: false,
    refetchOnWindowFocus: false,
  });

  // Stats from API - these are already user-specific based on permissions
  const stats: DashboardStats = data?.data || {
    totalLeads: 0,
    activeOrders: 0,
    monthlyRevenue: "$0",
    unreadMessages: 0,
  };
  
  // Calculate conversion rate based on leads and orders
  const orders = ordersData?.data || [];
  const leads = leadsData?.data || [];
  const conversionRate = leads.length > 0 ? ((orders.length / leads.length) * 100).toFixed(1) + "%" : "0%";
  
  // Calculate average order value
  const totalOrderAmount = orders.reduce((sum: number, order: any) => {
    const amount = parseFloat(order.totalAmount.toString().replace(/[^0-9.-]+/g, "")) || 0;
    return sum + amount;
  }, 0);
  const avgOrderValue = orders.length > 0 
    ? "$" + (totalOrderAmount / orders.length).toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 0})
    : "$0";

  // Define KPI cards with real-time metrics
  const statsCards: StatCard[] = [
    {
      title: "Orders In Progress",
      value: stats.activeOrders,
      change: stats.activeOrders > 0 ? `${stats.activeOrders} active orders` : "No active orders",
      icon: <ShoppingBag size={20} />,
      iconBg: "bg-orange-50",
      iconColor: "text-orange-500",
    },
    {
      title: "Active Leads",
      value: stats.totalLeads,
      change: stats.totalLeads > 0 ? `${stats.totalLeads} total` : "No active leads",
      icon: <Users size={20} />,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-500",
    },
    {
      title: "Monthly Revenue",
      value: stats.monthlyRevenue,
      change: parseFloat(stats.monthlyRevenue.replace(/[^0-9.-]+/g, "")) > 0 ? "Current month" : "No revenue",
      icon: <DollarSign size={20} />,
      iconBg: "bg-green-50",
      iconColor: "text-green-500",
    },
    {
      title: "Unread Messages",
      value: stats.unreadMessages,
      change: stats.unreadMessages > 0 ? "Need attention" : "No new messages",
      icon: <MessageSquare size={20} />,
      iconBg: "bg-purple-50",
      iconColor: "text-purple-500",
    },
  ];

  // Additional KPI cards with calculated data
  const additionalMetrics: StatCard[] = [
    {
      title: "Conversion Rate",
      value: conversionRate,
      change: "Leads to orders",
      icon: <TrendingUp size={20} />,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-500",
    },
    {
      title: "Avg Order Value",
      value: avgOrderValue,
      change: "Per order",
      icon: <BarChart size={20} />,
      iconBg: "bg-cyan-50",
      iconColor: "text-cyan-500",
    },
    {
      title: "Pending Design Reviews",
      value: "2",
      change: "Need approval",
      icon: <PhoneCall size={20} />,
      iconBg: "bg-fuchsia-50",
      iconColor: "text-fuchsia-500",
    },
    {
      title: "Order Fulfillment",
      value: orders.filter((o: any) => o.status === 'delivered' || o.status === 'shipped').length.toString(),
      change: "Completed orders",
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

  // Get pending approval items from actual orders
  const pendingItems = useMemo(() => {
    const pendingOrdersItems = orders.filter((o: any) => 
      o.status === 'pending' || o.status === 'processing'
    ).slice(0, 3).map((order: any) => ({
      id: order.id,
      name: `Order ${order.orderId}: ${order.customerName}`,
      status: order.status === 'pending' ? "Waiting for Approval" : "In Processing",
      time: order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "N/A",
      route: `/orders?id=${order.id}`
    }));

    // If we have fewer than 3 pending orders, we'll add some placeholder design items to fill out the UI
    // In a real app, we would query design projects that are pending
    const designItems = pendingOrdersItems.length < 3 ? [
      { 
        id: "design-1", 
        name: "Manufacturing Start: Order #41654", 
        status: "Pending Materials", 
        time: "Just now",
        route: "/design"
      }
    ] : [];

    return [...pendingOrdersItems, ...designItems].slice(0, 3);
  }, [orders]);

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
                    <Link href={item.route}>
                      <Button 
                        variant="ghost" 
                        className="w-full justify-between text-sm text-gray-600 hover:text-gray-900"
                      >
                        Review Now
                        <ArrowRight size={16} />
                      </Button>
                    </Link>
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
