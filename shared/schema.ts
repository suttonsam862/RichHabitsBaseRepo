import { pgTable, text, serial, integer, boolean, timestamp, numeric, json } from "drizzle-orm/pg-core";
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
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

// Define permissions
export const PERMISSIONS = {
  // User management
  MANAGE_USERS: 'manage_users',
  VIEW_USERS: 'view_users',
  
  // Lead management
  CREATE_LEADS: 'create_leads',
  EDIT_LEADS: 'edit_leads',
  DELETE_LEADS: 'delete_leads',
  VIEW_LEADS: 'view_leads',
  
  // Order management
  CREATE_ORDERS: 'create_orders',
  EDIT_ORDERS: 'edit_orders',
  DELETE_ORDERS: 'delete_orders',
  VIEW_ORDERS: 'view_orders',
  
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
  
  // Message management
  SEND_MESSAGES: 'send_messages',
  VIEW_MESSAGES: 'view_messages',
  
  // Catalog management
  VIEW_CATALOG: 'view_catalog',
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
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Lead model
export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  source: text("source"),
  status: text("status").default("new").notNull(),
  notes: text("notes"),
  value: numeric("value"),
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

// Types
// Products schema
export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  sku: text('sku').notNull().unique(),
  name: text('name').notNull(),
  sport: text('sport').notNull(),
  category: text('category').notNull(),
  item: text('item').notNull(),
  fabricOptions: text('fabric_options').notNull(),
  cogs: text('cogs').notNull(),
  wholesalePrice: text('wholesale_price').notNull(),
  imageUrl: text('image_url'),
  lineItemManagement: text('line_item_management'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Fabric Options schema
export const fabricOptions = pgTable('fabric_options', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Fabric Cuts schema 
export const fabricCuts = pgTable('fabric_cuts', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
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

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type InsertFabricOption = z.infer<typeof insertFabricOptionSchema>;
export type InsertFabricCut = z.infer<typeof insertFabricCutSchema>;
export type InsertCustomizationOption = z.infer<typeof insertCustomizationOptionSchema>;

export type User = typeof users.$inferSelect;
export type Lead = typeof leads.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Activity = typeof activities.$inferSelect;
export type Product = typeof products.$inferSelect;
export type FabricOption = typeof fabricOptions.$inferSelect;
export type FabricCut = typeof fabricCuts.$inferSelect;
export type CustomizationOption = typeof customizationOptions.$inferSelect;
