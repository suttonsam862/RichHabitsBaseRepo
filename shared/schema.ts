import { pgTable, text, serial, integer, boolean, timestamp, numeric, json, uniqueIndex, decimal, varchar } from "drizzle-orm/pg-core";
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
  EXECUTIVE: 'executive', // Executive role with admin, sales, and design capabilities
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
  // Lead processing progress steps
  contactComplete: boolean("contact_complete").default(false),
  itemsConfirmed: boolean("items_confirmed").default(false),
  submittedToDesign: boolean("submitted_to_design").default(false),
});

// Contact Log model for tracking lead communications
export const contactLogs = pgTable("contact_logs", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").references(() => leads.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  contactMethod: text("contact_method").notNull(), // "email", "phone", "in-person", etc.
  notes: text("notes"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
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

// Extend the lead schema to include autoClaimLead which is used by client but not stored in DB
export const insertLeadSchema = createInsertSchema(leads)
  .omit({ id: true, createdAt: true })
  .extend({
    autoClaimLead: z.boolean().optional()
  });

export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, createdAt: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true });
export const insertActivitySchema = createInsertSchema(activities).omit({ id: true, createdAt: true });
export const insertContactLogSchema = createInsertSchema(contactLogs).omit({ id: true, timestamp: true });

// Insert types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type InsertContactLog = z.infer<typeof insertContactLogSchema>;

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
  // Lead metrics
  leadCount: integer('lead_count').default(0),
  leadsQualifiedCount: integer('leads_qualified_count').default(0),
  leadsDisqualifiedCount: integer('leads_disqualified_count').default(0),
  leadConversionRate: text('lead_conversion_rate').default('0.00%'),
  avgLeadQualificationTime: integer('avg_lead_qualification_time').default(0), // hours
  // Order metrics
  orderCount: integer('order_count').default(0),
  avgOrderValue: text('avg_order_value').default('$0'),
  highestOrderValue: text('highest_order_value').default('$0'),
  // Contact metrics
  callsMade: integer('calls_made').default(0),
  callsPerLead: decimal('calls_per_lead', { precision: 5, scale: 2 }).default('0.00'),
  emailsSent: integer('emails_sent').default(0),
  emailsPerLead: decimal('emails_per_lead', { precision: 5, scale: 2 }).default('0.00'),
  meetingsScheduled: integer('meetings_scheduled').default(0),
  meetingsAttended: integer('meetings_attended').default(0),
  // Financial metrics
  targetRevenue: text('target_revenue').default('$0'),
  targetAttainment: text('target_attainment').default('0.00%'),
  totalRevenue: text('total_revenue').default('$0'),
  quarterlyRevenue: text('quarterly_revenue').default('$0'),
  monthlyRevenue: text('monthly_revenue').default('$0'),
  commissionRate: text('commission_rate').notNull().default('5.00'),
  earnedCommission: text('earned_commission').default('$0'),
  // Activity metrics
  lastActiveAt: timestamp('last_active_at').defaultNow(),
  daysActive: integer('days_active').default(0),
  activitiesPerDay: decimal('activities_per_day', { precision: 5, scale: 2 }).default('0.00'),
  responseTimeAvg: integer('response_time_avg').default(0), // minutes
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
export type ContactLog = typeof contactLogs.$inferSelect;
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
  clinician: text('clinician'),  // Changed to not required since we use line items now
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  totalDays: integer('total_days'),  // Made optional since we can calculate it
  venue: text('venue').notNull(),
  address: text('address').notNull(),
  participants: integer('participants'),  // Made optional since it may be filled later
  campCost: numeric('camp_cost'),        // Made optional since it may be filled later
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
  // Removed firstName and lastName as they don't exist in the actual database
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

// Junction table for camps and staff members
export const campStaffAssignments = pgTable('camp_staff_assignments', {
  id: serial('id').primaryKey(),
  campId: integer('camp_id').notNull().references(() => camps.id, { onDelete: 'cascade' }),
  staffId: integer('staff_id').notNull().references(() => staffMembers.id, { onDelete: 'cascade' }),
  role: text('role').default('clinician'),
  payAmount: numeric('pay_amount').default('0'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => {
  return {
    campStaffUnique: uniqueIndex('camp_staff_unique_idx').on(table.campId, table.staffId),
  };
});

// Travel arrangements for staff members
export const travelArrangements = pgTable('travel_arrangements', {
  id: serial('id').primaryKey(),
  staffId: integer('staff_id').references(() => staffMembers.id, { onDelete: 'cascade' }),
  campId: integer('camp_id').references(() => camps.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // flight, car, bus, etc.
  departureDate: timestamp('departure_date'),
  departureLocation: text('departure_location'),
  arrivalDate: timestamp('arrival_date'),
  arrivalLocation: text('arrival_location'),
  confirmationCode: text('confirmation_code'),
  provider: text('provider'), // airline, rental car company, etc.
  notes: text('notes'),
  cost: numeric('cost'),
  status: text('status').default('pending'), // pending, confirmed, cancelled
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Accommodations for staff during camps
export const accommodations = pgTable('accommodations', {
  id: serial('id').primaryKey(),
  staffId: integer('staff_id').references(() => staffMembers.id, { onDelete: 'cascade' }),
  campId: integer('camp_id').references(() => camps.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // hotel, airbnb, dorm, etc.
  location: text('location'),
  checkIn: timestamp('check_in'),
  checkOut: timestamp('check_out'),
  confirmationCode: text('confirmation_code'),
  provider: text('provider'), // hotel name, property manager, etc.
  roomType: text('room_type'),
  roomNumber: text('room_number'),
  cost: numeric('cost'),
  status: text('status').default('pending'), // pending, confirmed, cancelled
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Financial transactions related to camps
export const financialTransactions = pgTable('financial_transactions', {
  id: serial('id').primaryKey(),
  campId: integer('camp_id').references(() => camps.id, { onDelete: 'cascade' }),
  transactionType: text('transaction_type').notNull(), // revenue, expense, refund, payment
  category: text('category').notNull(), // registration, staff, accommodation, travel, equipment, food, etc.
  amount: numeric('amount').notNull(),
  date: timestamp('date').defaultNow(),
  description: text('description'),
  paymentMethod: text('payment_method'),
  status: text('status').default('pending'), // pending, completed, cancelled
  referenceId: text('reference_id'), // external reference like invoice number
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Camp financial summary
export const campFinancials = pgTable('camp_financials', {
  id: serial('id').primaryKey(),
  campId: integer('camp_id').references(() => camps.id, { onDelete: 'cascade' }),
  totalRevenue: numeric('total_revenue').default('0'),
  totalExpenses: numeric('total_expenses').default('0'),
  netProfit: numeric('net_profit').default('0'),
  staffCosts: numeric('staff_costs').default('0'),
  travelCosts: numeric('travel_costs').default('0'),
  accommodationCosts: numeric('accommodation_costs').default('0'),
  equipmentCosts: numeric('equipment_costs').default('0'),
  foodCosts: numeric('food_costs').default('0'),
  otherCosts: numeric('other_costs').default('0'),
  registrationRevenue: numeric('registration_revenue').default('0'),
  sponsorshipRevenue: numeric('sponsorship_revenue').default('0'),
  otherRevenue: numeric('other_revenue').default('0'),
  lastUpdated: timestamp('last_updated').defaultNow(),
});

// Camp schedule items
export const campScheduleItems = pgTable('camp_schedule_items', {
  id: serial('id').primaryKey(),
  campId: integer('camp_id').references(() => camps.id, { onDelete: 'cascade' }),
  dayNumber: integer('day_number').notNull(),
  startTime: text('start_time').notNull(), // Store time as text in format "HH:MM"
  endTime: text('end_time').notNull(), // Store time as text in format "HH:MM"
  activity: text('activity').notNull(),
  location: text('location'),
  staffId: integer('staff_id').references(() => staffMembers.id),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Vendor assignments for camps
export const campVendorAssignments = pgTable('camp_vendor_assignments', {
  id: serial('id').primaryKey(),
  campId: integer('camp_id').references(() => camps.id, { onDelete: 'cascade' }),
  vendorName: text('vendor_name').notNull(),
  serviceType: text('service_type').notNull(), // equipment, food, transportation, etc.
  contactName: text('contact_name'),
  contactEmail: text('contact_email'),
  contactPhone: text('contact_phone'),
  cost: numeric('cost'),
  status: text('status').default('pending'), // pending, confirmed, completed, cancelled
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Camp tasks
export const campTasks = pgTable('camp_tasks', {
  id: serial('id').primaryKey(),
  campId: integer('camp_id').references(() => camps.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  status: text('status').default('not-started'), // not-started, in-progress, completed
  dueDate: timestamp('due_date'),
  assignedTo: integer('assigned_to').references(() => users.id),
  priority: text('priority').default('medium'), // low, medium, high
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Create insert schemas for all tables
export const insertCampStaffAssignmentSchema = createInsertSchema(campStaffAssignments).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTravelArrangementSchema = createInsertSchema(travelArrangements).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAccommodationSchema = createInsertSchema(accommodations).omit({ id: true, createdAt: true, updatedAt: true });
export const insertFinancialTransactionSchema = createInsertSchema(financialTransactions).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCampFinancialsSchema = createInsertSchema(campFinancials).omit({ id: true });
export const insertCampScheduleItemSchema = createInsertSchema(campScheduleItems).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCampVendorAssignmentSchema = createInsertSchema(campVendorAssignments).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCampTaskSchema = createInsertSchema(campTasks).omit({ id: true, createdAt: true, updatedAt: true });

// Define types for our new schemas
export type InsertCampStaffAssignment = z.infer<typeof insertCampStaffAssignmentSchema>;
export type InsertTravelArrangement = z.infer<typeof insertTravelArrangementSchema>;
export type InsertAccommodation = z.infer<typeof insertAccommodationSchema>;
export type InsertFinancialTransaction = z.infer<typeof insertFinancialTransactionSchema>;
export type InsertCampFinancials = z.infer<typeof insertCampFinancialsSchema>;
export type InsertCampScheduleItem = z.infer<typeof insertCampScheduleItemSchema>;
export type InsertCampVendorAssignment = z.infer<typeof insertCampVendorAssignmentSchema>;
export type InsertCampTask = z.infer<typeof insertCampTaskSchema>;

export type CampStaffAssignment = typeof campStaffAssignments.$inferSelect;
export type TravelArrangement = typeof travelArrangements.$inferSelect;
export type Accommodation = typeof accommodations.$inferSelect;
export type FinancialTransaction = typeof financialTransactions.$inferSelect;
export type CampFinancials = typeof campFinancials.$inferSelect;
export type CampScheduleItem = typeof campScheduleItems.$inferSelect;
export type CampVendorAssignment = typeof campVendorAssignments.$inferSelect;
export type CampTask = typeof campTasks.$inferSelect;

// Camp Registration Schema
export const campRegistrationTiers = pgTable('camp_registration_tiers', {
  id: serial('id').primaryKey(),
  campId: integer('camp_id').notNull().references(() => camps.id, { onDelete: 'cascade' }),
  name: text('name').notNull(), // 'Early Bird', 'Standard', 'VIP', 'Team', etc.
  description: text('description'),
  price: numeric('price').notNull(),
  maxParticipants: integer('max_participants'),
  startDate: timestamp('start_date'), // When registration opens
  endDate: timestamp('end_date'),   // When registration closes
  isActive: boolean('is_active').default(true),
  shopifyProductId: text('shopify_product_id'), // Link to Shopify product for orders
  shopifyVariantId: text('shopify_variant_id'), // Link to Shopify variant
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const campRegistrations = pgTable('camp_registrations', {
  id: serial('id').primaryKey(),
  campId: integer('camp_id').notNull().references(() => camps.id, { onDelete: 'cascade' }),
  tierId: integer('tier_id').references(() => campRegistrationTiers.id),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  address: text('address'),
  city: text('city'),
  state: text('state'),
  zipCode: text('zip_code'),
  dateOfBirth: text('date_of_birth'),
  age: integer('age'),
  gender: text('gender'),
  emergencyContactName: text('emergency_contact_name'),
  emergencyContactPhone: text('emergency_contact_phone'),
  school: text('school'),
  grade: text('grade'),
  weightClass: text('weight_class'),
  shirtSize: text('shirt_size'),
  allergies: text('allergies'),
  specialRequirements: text('special_requirements'),
  waiverSigned: boolean('waiver_signed').default(false),
  waiverUrl: text('waiver_url'),
  registrationStatus: text('registration_status').default('pending').notNull(), // 'pending', 'confirmed', 'cancelled'
  paymentStatus: text('payment_status').default('pending').notNull(), // 'pending', 'paid', 'refunded'
  shopifyOrderId: text('shopify_order_id'),
  paymentAmount: numeric('payment_amount'),
  paymentDate: timestamp('payment_date'),
  notes: text('notes'),
  source: text('source'), // how the participant heard about the camp
  checkInDate: timestamp('check_in_date'),
  checkOutDate: timestamp('check_out_date'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Communication logs for event registration follow-ups
export const registrationCommunications = pgTable('registration_communications', {
  id: serial('id').primaryKey(),
  registrationId: integer('registration_id').notNull().references(() => campRegistrations.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // 'email', 'sms', 'phone'
  communicationDate: timestamp('communication_date').defaultNow(),
  subject: text('subject'),
  content: text('content'),
  status: text('status').notNull(), // 'sent', 'failed', 'pending'
  messageId: text('message_id'), // External ID from email/SMS provider
  createdAt: timestamp('created_at').defaultNow(),
});

// Create insert schemas
export const insertCampRegistrationTierSchema = createInsertSchema(campRegistrationTiers).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCampRegistrationSchema = createInsertSchema(campRegistrations).omit({ id: true, createdAt: true, updatedAt: true });
export const insertRegistrationCommunicationSchema = createInsertSchema(registrationCommunications).omit({ id: true, createdAt: true });

// Create types from insert schemas
export type InsertCampRegistrationTier = z.infer<typeof insertCampRegistrationTierSchema>;
export type InsertCampRegistration = z.infer<typeof insertCampRegistrationSchema>;
export type InsertRegistrationCommunication = z.infer<typeof insertRegistrationCommunicationSchema>;

// Add types for select schemas
export type CampRegistrationTier = typeof campRegistrationTiers.$inferSelect;
export type CampRegistration = typeof campRegistrations.$inferSelect;
export type RegistrationCommunication = typeof registrationCommunications.$inferSelect;

// Fabric Research Schema
export const fabricTypes = pgTable('fabric_types', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  composition: json('composition').$type<string[]>(),
  properties: json('properties').$type<{
    name: string;
    value: string;
    description?: string;
    unit?: string;
    technicalDetails?: string;
  }[]>(),
  applications: json('applications').$type<string[]>(),
  manufacturingCosts: json('manufacturing_costs').$type<{
    region: string;
    baseUnitCost: number;
    minOrderQuantity: number;
    currency: string;
    leadTime: string;
    notes?: string;
  }[]>(),
  sustainabilityInfo: json('sustainability_info').$type<{
    environmentalImpact: string;
    recyclability: string;
    certifications: string[];
    sustainabilityScore?: number;
    ecologicalFootprint?: string;
  }>(),
  careInstructions: json('care_instructions').$type<string[]>(),
  alternatives: json('alternatives').$type<string[]>(),
  sources: json('sources').$type<string[]>(),
  visualDescriptionForMidjourney: text('visual_description_for_midjourney'),
  imageGenerationPrompt: text('image_generation_prompt'),
  specificRecommendations: json('specific_recommendations').$type<string[]>(),
  finishingTechniques: json('finishing_techniques').$type<string[]>(),
  imageUrl: text('image_url'),
  isPublished: boolean('is_published').default(true),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at'),
});

export const fabricCompatibilities = pgTable('fabric_compatibilities', {
  id: serial('id').primaryKey(),
  fabricTypeId: integer('fabric_type_id').references(() => fabricTypes.id),
  productionMethod: text('production_method').notNull(),
  isCompatible: boolean('is_compatible').notNull(),
  reasons: json('reasons').$type<string[]>(),
  alternatives: json('alternatives').$type<string[]>(),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at'),
});

// Sewing Patterns
export const sewingPatterns = pgTable('sewing_patterns', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(), // shirt, pants, jersey, etc.
  description: text('description').notNull(),
  referenceImageUrl: text('reference_image_url'),
  measurements: json('measurements').$type<{
    name: string;
    value: string;
    unit: string;
    isRequired: boolean;
    description?: string;
  }[]>(),
  complexity: text('complexity').default('medium'), // easy, medium, complex
  estimatedTime: text('estimated_time'),
  materialRequirements: json('material_requirements').$type<{
    fabricType: string;
    amount: string;
    unit: string;
  }[]>(),
  compatibleFabrics: json('compatible_fabrics').$type<string[]>(),
  source: text('source'),
  isPublished: boolean('is_published').default(true),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at'),
});

// Product Suggestions
export const productSuggestions = pgTable('product_suggestions', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  patternId: integer('pattern_id').references(() => sewingPatterns.id),
  fabricTypeId: integer('fabric_type_id').references(() => fabricTypes.id),
  imageUrl: text('image_url'),
  estimatedCost: numeric('estimated_cost'),
  popularity: text('popularity').default('medium'), // low, medium, high
  difficulty: text('difficulty').default('medium'), // easy, medium, complex
  tags: json('tags').$type<string[]>(),
  isAdded: boolean('is_added').default(false),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at'),
});

export const insertFabricTypeSchema = createInsertSchema(fabricTypes).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const insertFabricCompatibilitySchema = createInsertSchema(fabricCompatibilities).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const insertSewingPatternSchema = createInsertSchema(sewingPatterns).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertProductSuggestionSchema = createInsertSchema(productSuggestions).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export type InsertFabricType = z.infer<typeof insertFabricTypeSchema>;
export type InsertFabricCompatibility = z.infer<typeof insertFabricCompatibilitySchema>;
export type InsertSewingPattern = z.infer<typeof insertSewingPatternSchema>;
export type InsertProductSuggestion = z.infer<typeof insertProductSuggestionSchema>;
// AI Training Data schema
export const aiTrainingData = pgTable('ai_training_data', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  dataType: text('data_type').notNull(), // fabric, pattern, measurement, product
  sourceType: text('source_type').notNull(), // file, url
  sourceUrl: text('source_url'),
  filePath: text('file_path'),
  fileName: text('file_name'),
  fileSize: integer('file_size'),
  mimeType: text('mime_type'),
  status: text('status').default('processing'), // processing, processed, error
  errorMessage: text('error_message'),
  processingStats: json('processing_stats'), // word count, entities extracted, etc.
  lastTrainedAt: timestamp('last_trained_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at'),
  createdBy: integer('created_by').references(() => users.id),
});

export const insertAiTrainingDataSchema = createInsertSchema(aiTrainingData).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export type InsertAiTrainingData = z.infer<typeof insertAiTrainingDataSchema>;

export type FabricType = typeof fabricTypes.$inferSelect;
export type FabricCompatibility = typeof fabricCompatibilities.$inferSelect;
export type SewingPattern = typeof sewingPatterns.$inferSelect;
export type ProductSuggestion = typeof productSuggestions.$inferSelect;
export type AiTrainingData = typeof aiTrainingData.$inferSelect;
