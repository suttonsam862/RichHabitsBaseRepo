import { User, Lead, Order as SchemaOrder, Message, Activity, Product as SchemaProduct, ContactLog as SchemaContactLog } from "@shared/schema";

export type { Order } from "@shared/schema";
export type { Product } from "@shared/schema";
export type { ContactLog } from "@shared/schema";

export type UserRole = 'admin' | 'sales' | 'designer' | 'manufacturing' | 'manufacturer' | 'customer' | 'user' | 'agent' | 'hybrid';

export interface AuthUser {
  id: string;
  email: string;
  username?: string;
  fullName?: string;
  avatarUrl?: string;
  role: UserRole; // Make role required and properly typed
  permissions?: string[];
  visiblePages?: string[] | null; // Allow null to distinguish between "not set" and "empty array"
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

export type LeadStatus = "new" | "claimed" | "contacted" | "qualified" | "proposal" | "negotiation" | "closed" | "lost";
export type OrderStatus = "pending" | "processing" | "paid" | "shipped" | "delivered" | "cancelled" | "refunded";
export type MessageStatus = "read" | "unread";
