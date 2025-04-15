import { pgTable, text, serial, integer, boolean, timestamp, numeric, json } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define available roles and their permissions
export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  AGENT: 'agent',
  DESIGNER: 'designer',
  MANUFACTURER: 'manufacturer',
  VIEWER: 'viewer',
  HYBRID: 'hybrid',  // Combined sales and design role
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

// Define permissions
export const PERMISSIONS = {
  // User management
  MANAGE_USERS: 'manage_users',
  VIEW_USERS: 'view_users',
  
  // Organization management
  VIEW_ORGANIZATIONS: 'view_organizations',
  REQUEST_ORGANIZATION: 'request_organization',
  MANAGE_ORGANIZATIONS: 'manage_organizations',
  
  // Lead management
  CREATE_LEADS: 'create_leads',
  EDIT_LEADS: 'edit_leads',
  DELETE_LEADS: 'delete_leads',
  VIEW_LEADS: 'view_leads',
  VIEW_ALL_LEADS: 'view_all_leads',
  
  // Order management
  CREATE_ORDERS: 'create_orders',
  EDIT_ORDERS: 'edit_orders',
  DELETE_ORDERS: 'delete_orders',
  VIEW_ORDERS: 'view_orders',
  APPROVE_ORDERS: 'approve_orders',
  VIEW_ALL_ORDERS: 'view_all_orders',
  
  // Design management
  CREATE_DESIGNS: 'create_designs',
  EDIT_DESIGNS: 'edit_designs',
  DELETE_DESIGNS: 'delete_designs',
  VIEW_DESIGNS: 'view_designs',
  APPROVE_DESIGNS: 'approve_designs',
  
  // Manufacturing management
  CREATE_PRODUCTION: 'create_production',
  EDIT_PRODUCTION: 'edit_production',
  VIEW_PRODUCTION: 'view_production',
  COMPLETE_PRODUCTION: 'complete_production',
  DELETE_PRODUCTION: 'delete_production',
  
  // Message management
  SEND_MESSAGES: 'send_messages',
  VIEW_MESSAGES: 'view_messages',
  
  // Catalog management
  VIEW_CATALOG: 'view_catalog',
  EDIT_CATALOG: 'edit_catalog',
  MANAGE_CATALOG: 'manage_catalog',
  
  // Reports & Analytics
  VIEW_REPORTS: 'view_reports',
  VIEW_ANALYTICS: 'view_analytics',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name"),
  avatarUrl: text("avatar_url"),
  role: text("role").default(ROLES.VIEWER).notNull(),
  permissions: json("permissions").$type<Permission[]>(),
  visiblePages: json("visible_pages").$type<string[]>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Lead model
export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  name: text("name").notNull(),
  companyName: text("company_name"),
  email: text("email").notNull(),
  phone: text("phone"),
  source: text("source"),
  status: text("status").default("new").notNull(),
  notes: text("notes"),
  value: numeric("value"),
  salesRepId: integer("sales_rep_id"),
  claimed: boolean("claimed").default(false),
  claimedById: integer("claimed_by_id").references(() => users.id),
  claimedAt: timestamp("claimed_at"),
  verifiedAt: timestamp("verified_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Order model
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  orderId: text("order_id").notNull().unique(),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email"),
  totalAmount: numeric("total_amount").notNull(),
  status: text("status").default("pending").notNull(),
  items: text("items"),
  shippingAddress: text("shipping_address"),
  notes: text("notes"),
  assignedSalesRepId: integer("assigned_sales_rep_id"),
  assignedDesignerId: integer("assigned_designer_id"),
  assignedManufacturerId: integer("assigned_manufacturer_id"),
  organizationId: integer("organization_id"),
  priorityLevel: text("priority_level").default("medium"),
  dueDate: text("due_date"),
  updatedAt: timestamp("updated_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Message model
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  conversationId: integer("conversation_id"),
  sender: text("sender").notNull(),
  senderEmail: text("sender_email"),
  content: text("content").notNull(),
  status: text("status").default("unread").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Activity model
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  type: text("type").notNull(),
  content: text("content").notNull(),
  relatedId: integer("related_id"),
  relatedType: text("related_type"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertLeadSchema = createInsertSchema(leads).omit({ id: true, createdAt: true });
export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, createdAt: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true });
export const insertActivitySchema = createInsertSchema(activities).omit({ id: true, createdAt: true });

// Insert types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type InsertActivity = z.infer<typeof insertActivitySchema>;

// Types
// Products schema
export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  sku: text('sku').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  sport: text('sport').notNull(),
  category: text('category').notNull(),
  gender: text('gender'),
  item: text('item').notNull(),
  fabricOptions: text('fabric_options').notNull(),
  cogs: text('cogs').notNull(),
  wholesalePrice: text('wholesale_price').notNull(),
  price: numeric('price'),
  minOrder: integer('min_order').default(1),
  leadTime: integer('lead_time').default(14),
  imageUrl: text('image_url'),
  fabricDetails: json('fabric_details'),
  measurementGrid: json('measurement_grid'),
  productImages: json('product_images').$type<string[]>(),
  isActive: boolean('is_active').default(true),
  lineItemManagement: text('line_item_management'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Fabric Options schema
export const fabricOptions = pgTable('fabric_options', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  materialType: text('material_type'),
  weight: text('weight'),
  colors: json('colors').$type<string[]>(),
  priceModifier: numeric('price_modifier').default('0'),
  imageUrl: text('image_url'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Fabric Cuts schema 
export const fabricCuts = pgTable('fabric_cuts', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  applicationMethod: text('application_method'),
  priceModifier: numeric('price_modifier').default('0'),
  imageUrl: text('image_url'),
  pdfUrl: text('pdf_url'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Product Customization Options schema
export const customizationOptions = pgTable('customization_options', {
  id: serial('id').primaryKey(),
  productId: integer('product_id').references(() => products.id, { onDelete: 'cascade' }),
  optionName: text('option_name').notNull(),
  optionType: text('option_type').notNull(), // 'fabric', 'cut', 'size', 'color', etc.
  optionValues: text('option_values').notNull(), // JSON array of possible values
  isRequired: boolean('is_required').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const insertProductSchema = createInsertSchema(products).omit({ id: true, createdAt: true, updatedAt: true });
export const insertFabricOptionSchema = createInsertSchema(fabricOptions).omit({ id: true, createdAt: true, updatedAt: true });
export const insertFabricCutSchema = createInsertSchema(fabricCuts).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCustomizationOptionSchema = createInsertSchema(customizationOptions).omit({ id: true, createdAt: true, updatedAt: true });

// Insert types for catalogs
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type InsertFabricOption = z.infer<typeof insertFabricOptionSchema>;
export type InsertFabricCut = z.infer<typeof insertFabricCutSchema>;
export type InsertCustomizationOption = z.infer<typeof insertCustomizationOptionSchema>;
// Organizations table
export const organizations = pgTable('organizations', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull().default('client'), // 'client', 'vendor', 'partner', 'school', 'sports_team', 'club', 'gym'
  industry: text('industry').notNull(),
  website: text('website'),
  phone: text('phone'),
  email: text('email'),
  address: text('address'),
  city: text('city'),
  state: text('state'),
  zip: text('zip'),
  country: text('country').default('USA'),
  logoUrl: text('logo_url'),
  notes: text('notes'),
  status: text('status').notNull().default('active'), // 'active', 'inactive'
  primaryContactId: integer('primary_contact_id'),
  assignedSalesRepId: integer('assigned_sales_rep_id'),  // Will be linked later
  totalRevenue: numeric('total_revenue').default('0.00'),
  icon: text('icon'), // Icon identifier for UI: 'building', 'school', 'gym', 'team', 'club'
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Sales team table
export const salesTeamMembers = pgTable('sales_team_members', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  role: text('role').notNull().default('Junior Sales Rep'),
  status: text('status').notNull().default('active'),
  avatarUrl: text('avatar_url'),
  hireDate: text('hire_date').default(sql`CURRENT_DATE`),
  leadCount: integer('lead_count').default(0),
  orderCount: integer('order_count').default(0),
  totalRevenue: text('total_revenue').default('$0'),
  commissionRate: text('commission_rate').notNull().default('5.00'),
  earnedCommission: text('earned_commission').default('$0'),
  lastActiveAt: timestamp('last_active_at').defaultNow(),
  assignedRegions: text('assigned_regions').array(),
  assignedIndustries: text('assigned_industries').array(),
  specialization: text('specialization').default('General'),
  notes: text('notes'),
  // User account fields
  username: text('username'),
  password: text('password'),
  systemRole: text('system_role'),
  systemPermissions: text('system_permissions').array(),
  userId: integer('user_id').references(() => users.id),
  createUserAccount: boolean('create_user_account').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Create insert schemas
export const insertSalesTeamMemberSchema = createInsertSchema(salesTeamMembers).omit({ id: true, createdAt: true, updatedAt: true });
export const insertOrganizationSchema = createInsertSchema(organizations).omit({ id: true, createdAt: true, updatedAt: true });

// Create types from insert schemas
export type InsertSalesTeamMember = z.infer<typeof insertSalesTeamMemberSchema>;
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;

export type User = typeof users.$inferSelect;
export type Lead = typeof leads.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Activity = typeof activities.$inferSelect;
export type Product = typeof products.$inferSelect;
export type FabricOption = typeof fabricOptions.$inferSelect;
export type FabricCut = typeof fabricCuts.$inferSelect;
export type CustomizationOption = typeof customizationOptions.$inferSelect;
export type SalesTeamMember = typeof salesTeamMembers.$inferSelect;
export type Organization = typeof organizations.$inferSelect;

// Define camps table
export const camps = pgTable('camps', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(),
  clinician: text('clinician').notNull(),
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  totalDays: integer('total_days').notNull(),
  venue: text('venue').notNull(),
  address: text('address').notNull(),
  participants: integer('participants').notNull(),
  campCost: numeric('camp_cost').notNull(),
  selloutCost: numeric('sellout_cost'),
  staffCount: integer('staff_count').default(0),
  vendorCount: integer('vendor_count').default(0),
  status: text('status').notNull().default('upcoming'), // 'upcoming', 'current', 'completed', 'cancelled'
  completionPercentage: integer('completion_percentage').default(0),
  schedule: json('schedule').$type<{day: number, activities: {id: number, startTime: string, endTime: string, activity: string, location: string, notes: string}[]}[]>(),
  tasks: json('tasks').$type<{name: string, status: string}[]>(),
  notes: text('notes'),
  staffAssignments: json('staff_assignments').$type<{staffId: number, role: string, payAmount: number}[]>(),
  vendorAssignments: json('vendor_assignments').$type<{vendorId: number, service: string, cost: number}[]>(),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at'),
});

// Define feedback table
export const feedback = pgTable('feedback', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  type: text('type').notNull().default('feedback'), // 'feedback', 'bug', 'feature'
  title: text('title').notNull(),
  description: text('description').notNull(),
  status: text('status').notNull().default('new'), // 'new', 'in_review', 'in_progress', 'completed', 'rejected'
  priority: text('priority').notNull().default('medium'), // 'low', 'medium', 'high', 'critical'
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at'),
  assignedTo: integer('assigned_to').references(() => users.id),
  category: text('category'),
  screenshotUrl: text('screenshot_url'),
  voteCount: integer('vote_count').default(0),
});

// Define feedback comments table
export const feedbackComments = pgTable('feedback_comments', {
  id: serial('id').primaryKey(),
  feedbackId: integer('feedback_id').notNull().references(() => feedback.id),
  userId: integer('user_id').notNull().references(() => users.id),
  comment: text('comment').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Define feedback votes table
export const feedbackVotes = pgTable('feedback_votes', {
  id: serial('id').primaryKey(),
  feedbackId: integer('feedback_id').notNull().references(() => feedback.id),
  userId: integer('user_id').notNull().references(() => users.id),
  voteType: text('vote_type').notNull().default('upvote'), // 'upvote' or 'downvote'
  createdAt: timestamp('created_at').defaultNow(),
});

// Create insert schemas
export const insertFeedbackSchema = createInsertSchema(feedback).omit({ id: true, createdAt: true, updatedAt: true, voteCount: true });
export const insertFeedbackCommentSchema = createInsertSchema(feedbackComments).omit({ id: true, createdAt: true });
export const insertFeedbackVoteSchema = createInsertSchema(feedbackVotes).omit({ id: true, createdAt: true });

// Design Projects table
export const designProjects = pgTable('design_projects', {
  id: serial('id').primaryKey(),
  orderId: text('order_id').notNull().references(() => orders.orderId),
  customerName: text('customer_name').notNull(),
  customerEmail: text('customer_email'),
  status: text('status').default('new').notNull(), // 'new', 'in_progress', 'review', 'approved', 'rejected', 'completed'
  designerId: integer('designer_id').references(() => users.id),
  designerName: text('designer_name'),
  description: text('description').notNull(),
  requirements: text('requirements'),
  attachments: json('attachments').$type<string[]>(),
  thumbnailUrl: text('thumbnail_url'),
  feedback: text('feedback'),
  approvedVersion: integer('approved_version'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Staff Members table
export const staffMembers = pgTable('staff_members', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  role: text('role').notNull(),
  email: text('email'),
  phone: text('phone'),
  specialization: text('specialization'),
  status: text('status').notNull().default('active'), // 'active', 'inactive', 'pending'
  address: text('address'),
  city: text('city'),
  state: text('state'),
  zipCode: text('zip_code'),
  emergencyContact: text('emergency_contact'),
  emergencyPhone: text('emergency_phone'),
  certifications: json('certifications').$type<string[]>(),
  notes: text('notes'),
  payRate: numeric('pay_rate'),
  payType: text('pay_type').default('hourly'), // 'hourly', 'daily', 'fixed'
  totalPaid: numeric('total_paid').default('0'),
  availableDates: json('available_dates').$type<string[]>(),
  assignedDates: json('assigned_dates').$type<string[]>(),
  campAssignments: json('camp_assignments').$type<{campId: number; campName: string}[]>(),
  travelPlans: json('travel_plans').$type<{
    id: number;
    type: string;
    departureDate?: string;
    departureLocation?: string;
    arrivalDate?: string;
    arrivalLocation?: string;
    confirmationCode?: string;
  }[]>(),
  accommodations: json('accommodations').$type<{
    id: number;
    type: string;
    location?: string;
    checkIn?: string;
    checkOut?: string;
    confirmationCode?: string;
    roomNumber?: string;
  }[]>(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Create insert schema for staff
export const insertStaffMemberSchema = createInsertSchema(staffMembers).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertStaffMember = z.infer<typeof insertStaffMemberSchema>;
export type StaffMember = typeof staffMembers.$inferSelect;

// Design Versions table
export const designVersions = pgTable('design_versions', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull().references(() => designProjects.id, { onDelete: 'cascade' }),
  versionNumber: integer('version_number').notNull(),
  designUrl: text('design_url').notNull(),
  thumbnailUrl: text('thumbnail_url'),
  description: text('description'),
  status: text('status').default('draft').notNull(), // 'draft', 'submitted', 'approved', 'rejected'
  feedback: text('feedback'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Design Revision Requests
export const designRevisions = pgTable('design_revisions', {
  id: serial('id').primaryKey(),
  designId: integer('design_id').notNull().references(() => designProjects.id, { onDelete: 'cascade' }),
  requestedById: integer('requested_by_id').notNull().references(() => users.id),
  requestedByName: text('requested_by_name').notNull(),
  description: text('description').notNull(),
  status: text('status').default('pending').notNull(), // 'pending', 'completed'
  requestedAt: timestamp('requested_at').defaultNow(),
  completedAt: timestamp('completed_at'),
});

// Design Messages
export const designMessages = pgTable('design_messages', {
  id: serial('id').primaryKey(),
  designId: integer('design_id').notNull().references(() => designProjects.id, { onDelete: 'cascade' }),
  senderId: integer('sender_id').notNull().references(() => users.id),
  senderName: text('sender_name').notNull(),
  senderRole: text('sender_role').notNull(),
  message: text('message').notNull(),
  attachments: json('attachments').$type<string[]>(),
  sentAt: timestamp('sent_at').defaultNow(),
});

// Create insert schemas for design tables
export const insertDesignProjectSchema = createInsertSchema(designProjects).omit({ id: true, createdAt: true, updatedAt: true });
export const insertDesignVersionSchema = createInsertSchema(designVersions).omit({ id: true, createdAt: true });
export const insertDesignRevisionSchema = createInsertSchema(designRevisions).omit({ id: true, requestedAt: true, completedAt: true });
export const insertDesignMessageSchema = createInsertSchema(designMessages).omit({ id: true, sentAt: true });

// Define types
export type InsertDesignProject = z.infer<typeof insertDesignProjectSchema>;
export type InsertDesignVersion = z.infer<typeof insertDesignVersionSchema>;
export type InsertDesignRevision = z.infer<typeof insertDesignRevisionSchema>;
export type InsertDesignMessage = z.infer<typeof insertDesignMessageSchema>;
export type DesignProject = typeof designProjects.$inferSelect;
export type DesignVersion = typeof designVersions.$inferSelect;
export type DesignRevision = typeof designRevisions.$inferSelect;
export type DesignMessage = typeof designMessages.$inferSelect;

// Outlook integrations for users
export const outlookIntegrations = pgTable('outlook_integrations', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  accessToken: text('access_token').notNull(),
  refreshToken: text('refresh_token').notNull(),
  tokenExpiry: timestamp('token_expiry').notNull(),
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const insertOutlookIntegrationSchema = createInsertSchema(outlookIntegrations).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export type InsertOutlookIntegration = z.infer<typeof insertOutlookIntegrationSchema>;
export type OutlookIntegration = typeof outlookIntegrations.$inferSelect;

// Define types for feedback
export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;
export type InsertFeedbackComment = z.infer<typeof insertFeedbackCommentSchema>;
export type InsertFeedbackVote = z.infer<typeof insertFeedbackVoteSchema>;
export type Feedback = typeof feedback.$inferSelect;
export type FeedbackComment = typeof feedbackComments.$inferSelect;
export type FeedbackVote = typeof feedbackVotes.$inferSelect;

// Sidebar Configuration
export const sidebarGroups = pgTable('sidebar_groups', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  displayOrder: integer('display_order').notNull(),
  isCollapsible: boolean('is_collapsible').default(true),
  isCollapsed: boolean('is_collapsed').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const sidebarItems = pgTable('sidebar_items', {
  id: serial('id').primaryKey(),
  groupId: integer('group_id').notNull().references(() => sidebarGroups.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  href: text('href').notNull(),
  icon: text('icon').notNull(),
  displayOrder: integer('display_order').notNull(),
  isVisible: boolean('is_visible').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// User Settings configuration
export const userSettings = pgTable('user_settings', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  settingType: text('setting_type').notNull(),
  settings: json('settings').notNull().$type<any>(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const insertSidebarGroupSchema = createInsertSchema(sidebarGroups).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSidebarItemSchema = createInsertSchema(sidebarItems).omit({ id: true, createdAt: true, updatedAt: true });
export const insertUserSettingsSchema = createInsertSchema(userSettings).omit({ id: true, createdAt: true, updatedAt: true });

export type InsertSidebarGroup = z.infer<typeof insertSidebarGroupSchema>;
export type InsertSidebarItem = z.infer<typeof insertSidebarItemSchema>;
export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;
export type SidebarGroup = typeof sidebarGroups.$inferSelect;
export type SidebarItem = typeof sidebarItems.$inferSelect;
export type UserSettings = typeof userSettings.$inferSelect;

// Events table
export const events = pgTable('events', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  location: text('location'),
  type: text('type').notNull(),
  capacity: integer('capacity').default(0),
  registered: integer('registered').default(0),
  status: text('status').default('upcoming'),
  createdById: integer('created_by_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const insertEventSchema = createInsertSchema(events).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;

// Create insert schema for camps table
export const insertCampSchema = createInsertSchema(camps).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCamp = z.infer<typeof insertCampSchema>;
export type Camp = typeof camps.$inferSelect;
