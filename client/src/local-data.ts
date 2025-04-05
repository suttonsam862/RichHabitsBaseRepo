/**
 * Local temporary data for testing
 * This file provides data for demonstration purposes when Supabase connection is unavailable
 */

import { User, Lead, Order, Message, Activity } from '@shared/schema';

export const mockUsers: User[] = [
  {
    id: 1,
    email: 'admin@richhabits.com',
    username: 'admin',
    password: 'password',
    fullName: 'Admin User',
    role: 'admin',
    avatarUrl: 'https://ui-avatars.com/api/?name=Admin+User',
    createdAt: new Date(),
  },
];

export const mockLeads: Lead[] = [
  {
    id: 1,
    userId: 1,
    name: 'John Smith',
    email: 'john.smith@example.com',
    phone: '(555) 123-4567',
    status: 'new',
    source: 'website',
    notes: 'Interested in premium package',
    value: '2500',
    createdAt: new Date(),
  },
  {
    id: 2,
    userId: 1,
    name: 'Sarah Johnson',
    email: 'sarah@example.com',
    phone: '(555) 987-6543',
    status: 'contacted',
    source: 'referral',
    notes: 'Follow up next week',
    value: '3800',
    createdAt: new Date(Date.now() - 86400000),
  },
  {
    id: 3,
    userId: 1,
    name: 'Michael Wong',
    email: 'michael@example.com',
    phone: '(555) 456-7890',
    status: 'qualified',
    source: 'social',
    notes: 'Scheduled demo',
    value: '5200',
    createdAt: new Date(Date.now() - 172800000),
  },
];

export const mockOrders: Order[] = [
  {
    id: 1,
    userId: 1,
    orderId: 'ORD-2023-001',
    customerName: 'James Wilson',
    customerEmail: 'james@example.com',
    amount: '1250.99',
    status: 'paid',
    items: JSON.stringify([
      { name: 'Premium Package', price: 1250.99, quantity: 1 }
    ]),
    shippingAddress: '123 Main St, New York, NY',
    notes: 'Priority shipping',
    createdAt: new Date(),
  },
  {
    id: 2,
    userId: 1,
    orderId: 'ORD-2023-002',
    customerName: 'Lisa Brown',
    customerEmail: 'lisa@example.com',
    amount: '850.50',
    status: 'processing',
    items: JSON.stringify([
      { name: 'Standard Package', price: 850.50, quantity: 1 }
    ]),
    shippingAddress: '456 Oak Dr, San Francisco, CA',
    notes: '',
    createdAt: new Date(Date.now() - 86400000),
  },
  {
    id: 3,
    userId: 1,
    orderId: 'ORD-2023-003',
    customerName: 'David Lee',
    customerEmail: 'david@example.com',
    amount: '2300.00',
    status: 'delivered',
    items: JSON.stringify([
      { name: 'Enterprise Package', price: 2300.00, quantity: 1 }
    ]),
    shippingAddress: '789 Pine Ave, Chicago, IL',
    notes: 'Customer very satisfied',
    createdAt: new Date(Date.now() - 172800000),
  },
];

export const mockMessages: Message[] = [
  {
    id: 1,
    userId: 1,
    conversationId: 1,
    sender: 'John Smith',
    senderEmail: 'john.smith@example.com',
    content: 'Hi, I\'m interested in your premium package. Can you provide more details?',
    status: 'unread',
    createdAt: new Date(),
  },
  {
    id: 2,
    userId: 1,
    conversationId: 1,
    sender: 'Admin User',
    senderEmail: 'admin@richhabits.com',
    content: 'Hello John, I\'d be happy to provide more information about our premium package. It includes...',
    status: 'read',
    createdAt: new Date(Date.now() - 3600000),
  },
  {
    id: 3,
    userId: 1,
    conversationId: 2,
    sender: 'Sarah Johnson',
    senderEmail: 'sarah@example.com',
    content: 'When can we schedule a demo of your platform?',
    status: 'unread',
    createdAt: new Date(Date.now() - 86400000),
  },
];

export const mockActivities: Activity[] = [
  {
    id: 1,
    userId: 1,
    type: 'lead',
    content: 'New lead John Smith added',
    relatedId: 1,
    relatedType: 'lead',
    createdAt: new Date(),
  },
  {
    id: 2,
    userId: 1,
    type: 'order',
    content: 'New order ORD-2023-001 received',
    relatedId: 1,
    relatedType: 'order',
    createdAt: new Date(Date.now() - 3600000),
  },
  {
    id: 3,
    userId: 1,
    type: 'message',
    content: 'New message from Sarah Johnson',
    relatedId: 3,
    relatedType: 'message',
    createdAt: new Date(Date.now() - 86400000),
  },
  {
    id: 4,
    userId: 1,
    type: 'lead',
    content: 'Lead Michael Wong status changed to qualified',
    relatedId: 3,
    relatedType: 'lead',
    createdAt: new Date(Date.now() - 172800000),
  },
];

export const mockRevenueData = [
  { name: 'Jan', current: 4000, previous: 3000 },
  { name: 'Feb', current: 5000, previous: 4500 },
  { name: 'Mar', current: 6000, previous: 5500 },
  { name: 'Apr', current: 8000, previous: 6500 },
  { name: 'May', current: 7500, previous: 7000 },
  { name: 'Jun', current: 9000, previous: 8000 },
  { name: 'Jul', current: 10000, previous: 9000 },
  { name: 'Aug', current: 11000, previous: 9500 },
  { name: 'Sep', current: 9500, previous: 8500 },
  { name: 'Oct', current: 12000, previous: 10000 },
  { name: 'Nov', current: 13000, previous: 11000 },
  { name: 'Dec', current: 15000, previous: 12500 },
];

export const mockAcquisitionData = [
  { name: 'Jan', current: 15, previous: 10 },
  { name: 'Feb', current: 20, previous: 15 },
  { name: 'Mar', current: 25, previous: 20 },
  { name: 'Apr', current: 30, previous: 25 },
  { name: 'May', current: 28, previous: 24 },
  { name: 'Jun', current: 35, previous: 30 },
  { name: 'Jul', current: 40, previous: 35 },
  { name: 'Aug', current: 45, previous: 38 },
  { name: 'Sep', current: 38, previous: 32 },
  { name: 'Oct', current: 48, previous: 40 },
  { name: 'Nov', current: 52, previous: 45 },
  { name: 'Dec', current: 60, previous: 50 },
];

export const mockFunnelData = [
  { name: 'Leads', value: 120 },
  { name: 'Qualified', value: 85 },
  { name: 'Proposals', value: 60 },
  { name: 'Negotiations', value: 40 },
  { name: 'Closed', value: 25 },
];

export const mockSalesByProductData = [
  { name: 'Basic Package', value: 30 },
  { name: 'Standard Package', value: 45 },
  { name: 'Premium Package', value: 25 },
  { name: 'Enterprise Package', value: 15 },
];

export const mockSalesByChannelData = [
  { name: 'Website', value: 40 },
  { name: 'Referral', value: 30 },
  { name: 'Social Media', value: 20 },
  { name: 'Direct', value: 10 },
];

export const mockLeadConversionData = [
  { name: 'Website', conversion: 28 },
  { name: 'Referral', conversion: 42 },
  { name: 'Social Media', conversion: 18 },
  { name: 'Direct', conversion: 35 },
];

export const mockDashboardStats = {
  totalLeads: 248,
  activeOrders: 36,
  monthlyRevenue: "$42,586",
  unreadMessages: 12
};