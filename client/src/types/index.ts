import { User, Lead, Order, Message, Activity } from "@shared/schema";

export interface AuthUser {
  id: string;
  email: string;
  username?: string;
  fullName?: string;
  avatarUrl?: string;
  role?: string;
  visiblePages?: string[]; // Add the visible pages property
}

export interface StatCard {
  title: string;
  value: string | number;
  change: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
}

export interface ChartData {
  name: string;
  current: number;
  previous: number;
}

export interface DashboardStats {
  totalLeads: number;
  activeOrders: number;
  monthlyRevenue: string;
  unreadMessages: number;
}

export interface ActivityItem extends Activity {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
}

export type LeadStatus = "new" | "contacted" | "qualified" | "proposal" | "negotiation" | "closed" | "lost";
export type OrderStatus = "pending" | "processing" | "paid" | "shipped" | "delivered" | "cancelled" | "refunded";
export type MessageStatus = "read" | "unread";
