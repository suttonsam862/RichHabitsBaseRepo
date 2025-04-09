import { 
  users, 
  leads, 
  orders, 
  messages, 
  activities,
  products,
  fabricOptions,
  fabricCuts,
  customizationOptions,
  salesTeamMembers,
  organizations,
  feedback,
  feedbackComments,
  feedbackVotes,
  ROLES,
  type User, 
  type InsertUser, 
  type Lead, 
  type InsertLead, 
  type Order, 
  type InsertOrder, 
  type Message, 
  type InsertMessage, 
  type Activity, 
  type InsertActivity,
  type Product,
  type InsertProduct,
  type FabricOption,
  type InsertFabricOption,
  type FabricCut,
  type InsertFabricCut,
  type CustomizationOption,
  type InsertCustomizationOption,
  type SalesTeamMember,
  type InsertSalesTeamMember,
  type Organization,
  type InsertOrganization,
  type Feedback,
  type FeedbackComment,
  type FeedbackVote,
  type InsertFeedback,
  type InsertFeedbackComment,
  type InsertFeedbackVote,
  type Permission
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and, or, isNull, asc } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

// Expanded interface with additional CRUD methods
export interface IStorage {
  // Session store for authentication
  sessionStore: session.Store;
  
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserCount(): Promise<number>;
  createUser(user: InsertUser): Promise<User>;
  updateUserSettings(userId: number, settingType: string, settings: any): Promise<void>;
  getAllUsers(): Promise<User[]>;
  updateUserRole(userId: number, role: string): Promise<User>;
  updateUserPermissions(userId: number, permissions: Permission[]): Promise<User>;
  updateUserVisiblePages(userId: number, visiblePages: string[]): Promise<User>;
  
  // Sales Team methods
  getSalesTeamMembers(): Promise<SalesTeamMember[]>;
  getSalesTeamMemberById(id: number): Promise<SalesTeamMember | undefined>;
  createSalesTeamMember(member: InsertSalesTeamMember): Promise<SalesTeamMember>;
  updateSalesTeamMember(id: number, member: Partial<InsertSalesTeamMember>): Promise<SalesTeamMember>;
  deleteSalesTeamMember(id: number): Promise<void>;
  getSalesTeamPerformance(): Promise<any>;
  
  // Lead methods
  getLeads(): Promise<Lead[]>;
  getRecentLeads(limit?: number): Promise<Lead[]>;
  createLead(lead: InsertLead): Promise<Lead>;
  getLeadById(id: number): Promise<Lead | undefined>;
  deleteLead(id: number): Promise<void>;
  getUnassignedLeads(): Promise<Lead[]>;
  getLeadAssignments(): Promise<any[]>;
  assignLeadToSalesRep(leadId: number, salesRepId: number): Promise<any>;
  
  // Order methods
  getOrders(): Promise<Order[]>;
  getRecentOrders(limit?: number): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  getOrderById(id: number): Promise<Order | undefined>;
  deleteOrder(id: number): Promise<void>;
  
  // Message methods
  getConversations(): Promise<any[]>;
  getMessagesByConversation(conversationId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  
  // Activity methods
  getRecentActivities(limit?: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  
  // Product methods
  getProducts(): Promise<Product[]>;
  getProductsBySport(sport: string): Promise<Product[]>;
  getProductsByCategory(category: string): Promise<Product[]>;
  getProductById(id: number): Promise<Product | undefined>;
  getProductBySku(sku: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product>;
  deleteProduct(id: number): Promise<void>;
  
  // Fabric Options methods
  getFabricOptions(): Promise<FabricOption[]>;
  getFabricOptionById(id: number): Promise<FabricOption | undefined>;
  createFabricOption(option: InsertFabricOption): Promise<FabricOption>;
  updateFabricOption(id: number, option: Partial<InsertFabricOption>): Promise<FabricOption>;
  deleteFabricOption(id: number): Promise<void>;
  
  // Fabric Cuts methods
  getFabricCuts(): Promise<FabricCut[]>;
  getFabricCutById(id: number): Promise<FabricCut | undefined>;
  createFabricCut(cut: InsertFabricCut): Promise<FabricCut>;
  updateFabricCut(id: number, cut: Partial<InsertFabricCut>): Promise<FabricCut>;
  deleteFabricCut(id: number): Promise<void>;
  
  // Customization Options methods
  getCustomizationOptions(productId: number): Promise<CustomizationOption[]>;
  getCustomizationOptionById(id: number): Promise<CustomizationOption | undefined>;
  createCustomizationOption(option: InsertCustomizationOption): Promise<CustomizationOption>;
  updateCustomizationOption(id: number, option: Partial<InsertCustomizationOption>): Promise<CustomizationOption>;
  deleteCustomizationOption(id: number): Promise<void>;
  
  // Organization methods
  getOrganizations(): Promise<Organization[]>;
  getOrganizationById(id: number): Promise<Organization | undefined>;
  createOrganization(organization: InsertOrganization): Promise<Organization>;
  updateOrganization(id: number, organization: Partial<InsertOrganization>): Promise<Organization>;
  deleteOrganization(id: number): Promise<void>;
  
  // Analytics methods
  getRevenueData(period: string): Promise<any[]>;
  getCustomerAcquisitionData(period: string): Promise<any[]>;
  getConversionFunnelData(): Promise<any[]>;
  getSalesByProductData(period: string): Promise<any[]>;
  getSalesByChannelData(period: string): Promise<any[]>;
  getLeadConversionData(period: string): Promise<any[]>;
  
  // Data management
  clearExampleData(): Promise<void>;
  
  // Feedback system
  getFeedback(options?: { status?: string; type?: string; limit?: number }): Promise<Feedback[]>;
  getFeedbackById(id: number): Promise<Feedback | undefined>;
  createFeedback(feedback: InsertFeedback): Promise<Feedback>;
  updateFeedback(id: number, feedback: Partial<InsertFeedback>): Promise<Feedback>;
  deleteFeedback(id: number): Promise<void>;
  getFeedbackByUser(userId: number): Promise<Feedback[]>;
  
  // Feedback comments
  getFeedbackComments(feedbackId: number): Promise<FeedbackComment[]>;
  addFeedbackComment(comment: InsertFeedbackComment): Promise<FeedbackComment>;
  deleteFeedbackComment(id: number): Promise<void>;
  
  // Feedback votes
  getFeedbackVotes(feedbackId: number): Promise<FeedbackVote[]>;
  addFeedbackVote(vote: InsertFeedbackVote): Promise<FeedbackVote>;
  removeFeedbackVote(userId: number, feedbackId: number): Promise<void>;
  updateFeedbackVoteCount(feedbackId: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;
  
  constructor() {
    const PostgresStore = connectPg(session);
    this.sessionStore = new PostgresStore({
      pool,
      createTableIfMissing: true
    });
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }
  
  async getUserCount(): Promise<number> {
    const result = await db.select({ count: sql`count(*)` }).from(users);
    return Number(result[0].count);
  }
  
  async getAllUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(asc(users.fullName));
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser as any)
      .returning();
    return user;
  }
  
  async updateUserRole(userId: number, role: string): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ role })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }
  
  async updateUserPermissions(userId: number, permissions: Permission[]): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ permissions: permissions as any })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }
  
  async updateUserVisiblePages(userId: number, visiblePages: string[]): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ visiblePages: visiblePages as any })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }
  
  async updateUserSettings(userId: number, settingType: string, settings: any): Promise<void> {
    // In a real application, we would store settings in a separate table
    // For now, we'll just return as if the operation succeeded
    return Promise.resolve();
  }
  
  // Lead methods
  async getLeads(): Promise<Lead[]> {
    return db.select().from(leads).orderBy(desc(leads.createdAt));
  }
  
  async getRecentLeads(limit: number = 5): Promise<Lead[]> {
    return db.select().from(leads).orderBy(desc(leads.createdAt)).limit(limit);
  }
  
  async createLead(lead: InsertLead): Promise<Lead> {
    const [newLead] = await db
      .insert(leads)
      .values(lead)
      .returning();
    return newLead;
  }
  
  async getLeadById(id: number): Promise<Lead | undefined> {
    const [lead] = await db.select().from(leads).where(eq(leads.id, id));
    return lead || undefined;
  }
  
  async deleteLead(id: number): Promise<void> {
    await db.delete(leads).where(eq(leads.id, id));
  }
  
  // Order methods
  async getOrders(): Promise<Order[]> {
    return db.select().from(orders).orderBy(desc(orders.createdAt));
  }
  
  async getRecentOrders(limit: number = 5): Promise<Order[]> {
    return db.select().from(orders).orderBy(desc(orders.createdAt)).limit(limit);
  }
  
  async createOrder(order: InsertOrder): Promise<Order> {
    const [newOrder] = await db
      .insert(orders)
      .values(order)
      .returning();
    return newOrder;
  }
  
  async getOrderById(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order || undefined;
  }
  
  async deleteOrder(id: number): Promise<void> {
    await db.delete(orders).where(eq(orders.id, id));
  }
  
  // Message methods
  async getConversations(): Promise<any[]> {
    // Group messages by conversationId and get latest message
    const result = await db.execute(sql`
      SELECT DISTINCT ON (conversation_id)
        m.conversation_id,
        m.sender,
        m.sender_email,
        m.content,
        m.status,
        m.created_at,
        (
          SELECT COUNT(*)
          FROM messages
          WHERE conversation_id = m.conversation_id
          AND status = 'unread'
        ) as unread_count
      FROM messages m
      ORDER BY m.conversation_id, m.created_at DESC
    `);
    
    return result.rows;
  }
  
  async getMessagesByConversation(conversationId: number): Promise<Message[]> {
    return db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(asc(messages.createdAt));
  }
  
  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db
      .insert(messages)
      .values(message)
      .returning();
    return newMessage;
  }
  
  // Activity methods
  async getRecentActivities(limit: number = 5): Promise<Activity[]> {
    return db.select().from(activities).orderBy(desc(activities.createdAt)).limit(limit);
  }
  
  async createActivity(activity: InsertActivity): Promise<Activity> {
    const [newActivity] = await db
      .insert(activities)
      .values(activity)
      .returning();
    return newActivity;
  }
  
  // Analytics methods
  async getRevenueData(period: string): Promise<any[]> {
    // Sample implementation for monthly revenue data
    if (period === 'monthly') {
      const result = await db.execute(sql`
        SELECT 
          DATE_TRUNC('month', "created_at") as month,
          SUM("total_amount") as revenue
        FROM 
          ${orders}
        WHERE 
          "status" = 'paid' OR "status" = 'delivered'
        GROUP BY 
          month
        ORDER BY 
          month DESC
        LIMIT 12
      `);
      
      return result.rows;
    }
    
    // Return empty array for other periods for now
    return [];
  }
  
  async getCustomerAcquisitionData(period: string): Promise<any[]> {
    // For demo purposes - in a real app we would query the database
    return [];
  }
  
  async getConversionFunnelData(): Promise<any[]> {
    // For demo purposes - in a real app we would query the database
    return [];
  }
  
  async getSalesByProductData(period: string): Promise<any[]> {
    // For demo purposes - in a real app we would query the database
    return [];
  }
  
  async getSalesByChannelData(period: string): Promise<any[]> {
    // For demo purposes - in a real app we would query the database
    return [];
  }
  
  async getLeadConversionData(period: string): Promise<any[]> {
    // For demo purposes - in a real app we would query the database
    return [];
  }
  
  // Sales Team methods
  async getSalesTeamMembers(): Promise<SalesTeamMember[]> {
    return db.select().from(salesTeamMembers).orderBy(asc(salesTeamMembers.name));
  }
  
  async getSalesTeamMemberById(id: number): Promise<SalesTeamMember | undefined> {
    const [member] = await db.select().from(salesTeamMembers).where(eq(salesTeamMembers.id, id));
    return member || undefined;
  }
  
  async createSalesTeamMember(member: InsertSalesTeamMember): Promise<SalesTeamMember> {
    // If createUserAccount is true, we'll create a user account too
    if (member.createUserAccount) {
      if (!member.username || !member.password) {
        throw new Error("Username and password are required when creating a user account");
      }
      
      // Check if username already exists
      const existingUser = await this.getUserByUsername(member.username);
      if (existingUser) {
        throw new Error("Username already exists");
      }
      
      // Create user account
      const newUser = await this.createUser({
        username: member.username,
        password: member.password,
        email: member.email,
        fullName: member.name,
        role: member.systemRole || ROLES.AGENT,
        permissions: member.systemPermissions,
      });
      
      // Add user ID to sales team member
      member.userId = newUser.id;
    }
    
    const [newMember] = await db
      .insert(salesTeamMembers)
      .values(member)
      .returning();
    return newMember;
  }
  
  async updateSalesTeamMember(id: number, member: Partial<InsertSalesTeamMember>): Promise<SalesTeamMember> {
    const [updatedMember] = await db
      .update(salesTeamMembers)
      .set({ ...member, updatedAt: new Date() })
      .where(eq(salesTeamMembers.id, id))
      .returning();
    return updatedMember;
  }
  
  async deleteSalesTeamMember(id: number): Promise<void> {
    const member = await this.getSalesTeamMemberById(id);
    if (member && member.userId) {
      // Delete associated user account if it exists
      await db.delete(users).where(eq(users.id, member.userId));
    }
    await db.delete(salesTeamMembers).where(eq(salesTeamMembers.id, id));
  }
  
  async getSalesTeamPerformance(): Promise<any> {
    // Get some basic stats
    const allMembers = await this.getSalesTeamMembers();
    const activeMembers = allMembers.filter(m => m.status === 'active');
    
    // Calculate total revenue
    let totalRevenue = 0;
    let totalLeads = 0;
    let totalOrders = 0;
    
    // In real implementation, this would be calculated from actual orders data
    // For now, we'll just return some mock data for demonstration purposes
    
    return {
      totalMembers: allMembers.length,
      activeMembers: activeMembers.length,
      totalRevenue: "$0",
      totalLeads: 0,
      totalOrders: 0,
      conversionRate: "0%",
      avgDealSize: "$0",
      topPerformer: {
        name: allMembers.length > 0 ? allMembers[0].name : "N/A",
        revenue: "$0"
      }
    };
  }
  
  // Lead assignment methods
  async getUnassignedLeads(): Promise<Lead[]> {
    return db.select()
      .from(leads)
      .where(eq(leads.status, 'new'))
      .orderBy(desc(leads.createdAt));
  }
  
  async getLeadAssignments(): Promise<any[]> {
    // In a real implementation, we would have a lead_assignments table
    // For now, we'll just return leads with salesRepId populated
    const assignedLeads = await db.select()
      .from(leads)
      .where(sql`sales_rep_id IS NOT NULL`)
      .orderBy(desc(leads.createdAt));
    
    return assignedLeads;
  }
  
  async assignLeadToSalesRep(leadId: number, salesRepId: number): Promise<any> {
    // Update the lead with the sales rep id
    const [updatedLead] = await db.update(leads)
      .set({ 
        salesRepId: salesRepId,
        status: 'assigned'
      })
      .where(eq(leads.id, leadId))
      .returning();
    
    // Update the sales rep's lead count
    // In a real application, we would use a transaction here
    const [salesRep] = await db.select().from(salesTeamMembers).where(eq(salesTeamMembers.id, salesRepId));
    if (salesRep) {
      await db.update(salesTeamMembers)
        .set({ 
          leadCount: Number(salesRep.leadCount) + 1,
          lastActiveAt: new Date()
        })
        .where(eq(salesTeamMembers.id, salesRepId));
    }
    
    return updatedLead;
  }
  
  // Product methods
  async getProducts(): Promise<Product[]> {
    return db.select().from(products).orderBy(asc(products.name));
  }
  
  async getProductsBySport(sport: string): Promise<Product[]> {
    return db.select().from(products).where(eq(products.sport, sport)).orderBy(asc(products.name));
  }
  
  async getProductsByCategory(category: string): Promise<Product[]> {
    return db.select().from(products).where(eq(products.category, category)).orderBy(asc(products.name));
  }
  
  async getProductById(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || undefined;
  }
  
  async getProductBySku(sku: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.sku, sku));
    return product || undefined;
  }
  
  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db
      .insert(products)
      .values(product)
      .returning();
    return newProduct;
  }
  
  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product> {
    const [updatedProduct] = await db
      .update(products)
      .set({ ...product, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return updatedProduct;
  }
  
  async deleteProduct(id: number): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }
  
  // Fabric Options methods
  async getFabricOptions(): Promise<FabricOption[]> {
    return db.select().from(fabricOptions).orderBy(asc(fabricOptions.name));
  }
  
  async getFabricOptionById(id: number): Promise<FabricOption | undefined> {
    const [option] = await db.select().from(fabricOptions).where(eq(fabricOptions.id, id));
    return option || undefined;
  }
  
  async createFabricOption(option: InsertFabricOption): Promise<FabricOption> {
    const [newOption] = await db
      .insert(fabricOptions)
      .values(option)
      .returning();
    return newOption;
  }
  
  async updateFabricOption(id: number, option: Partial<InsertFabricOption>): Promise<FabricOption> {
    const [updatedOption] = await db
      .update(fabricOptions)
      .set({ ...option, updatedAt: new Date() })
      .where(eq(fabricOptions.id, id))
      .returning();
    return updatedOption;
  }
  
  async deleteFabricOption(id: number): Promise<void> {
    await db.delete(fabricOptions).where(eq(fabricOptions.id, id));
  }
  
  // Fabric Cuts methods
  async getFabricCuts(): Promise<FabricCut[]> {
    return db.select().from(fabricCuts).orderBy(asc(fabricCuts.name));
  }
  
  async getFabricCutById(id: number): Promise<FabricCut | undefined> {
    const [cut] = await db.select().from(fabricCuts).where(eq(fabricCuts.id, id));
    return cut || undefined;
  }
  
  async createFabricCut(cut: InsertFabricCut): Promise<FabricCut> {
    const [newCut] = await db
      .insert(fabricCuts)
      .values(cut)
      .returning();
    return newCut;
  }
  
  async updateFabricCut(id: number, cut: Partial<InsertFabricCut>): Promise<FabricCut> {
    const [updatedCut] = await db
      .update(fabricCuts)
      .set({ ...cut, updatedAt: new Date() })
      .where(eq(fabricCuts.id, id))
      .returning();
    return updatedCut;
  }
  
  async deleteFabricCut(id: number): Promise<void> {
    await db.delete(fabricCuts).where(eq(fabricCuts.id, id));
  }
  
  // Customization Options methods
  async getCustomizationOptions(productId: number): Promise<CustomizationOption[]> {
    return db.select()
      .from(customizationOptions)
      .where(eq(customizationOptions.productId, productId))
      .orderBy(asc(customizationOptions.optionName));
  }
  
  async getCustomizationOptionById(id: number): Promise<CustomizationOption | undefined> {
    const [option] = await db.select().from(customizationOptions).where(eq(customizationOptions.id, id));
    return option || undefined;
  }
  
  async createCustomizationOption(option: InsertCustomizationOption): Promise<CustomizationOption> {
    const [newOption] = await db
      .insert(customizationOptions)
      .values(option)
      .returning();
    return newOption;
  }
  
  async updateCustomizationOption(id: number, option: Partial<InsertCustomizationOption>): Promise<CustomizationOption> {
    const [updatedOption] = await db
      .update(customizationOptions)
      .set({ ...option, updatedAt: new Date() })
      .where(eq(customizationOptions.id, id))
      .returning();
    return updatedOption;
  }
  
  async deleteCustomizationOption(id: number): Promise<void> {
    await db.delete(customizationOptions).where(eq(customizationOptions.id, id));
  }
  
  // Organization methods
  async getOrganizations(): Promise<Organization[]> {
    return db.select().from(organizations).orderBy(asc(organizations.name));
  }

  async getOrganizationById(id: number): Promise<Organization | undefined> {
    const [organization] = await db.select().from(organizations).where(eq(organizations.id, id));
    return organization || undefined;
  }

  async createOrganization(organization: InsertOrganization): Promise<Organization> {
    const [newOrganization] = await db
      .insert(organizations)
      .values(organization)
      .returning();
    return newOrganization;
  }

  async updateOrganization(id: number, organization: Partial<InsertOrganization>): Promise<Organization> {
    const [updatedOrganization] = await db
      .update(organizations)
      .set({ ...organization, updatedAt: new Date() })
      .where(eq(organizations.id, id))
      .returning();
    return updatedOrganization;
  }

  async deleteOrganization(id: number): Promise<void> {
    await db.delete(organizations).where(eq(organizations.id, id));
  }
  
  async clearExampleData(): Promise<void> {
    // We'll preserve the admin user only (id=1), but clear all other data
    try {
      // Keep user 1 (admin) but delete all other users
      await db.delete(users).where(sql`id != 1`);
      
      // Clear all other tables completely
      await db.delete(leads);
      await db.delete(orders);
      await db.delete(messages);
      await db.delete(activities);
      await db.delete(products);
      await db.delete(fabricOptions);
      await db.delete(fabricCuts);
      await db.delete(customizationOptions);
      await db.delete(organizations);
      
      console.log("Example data cleared successfully");
    } catch (error) {
      console.error("Error clearing example data:", error);
      throw error;
    }
  }
  
  // Feedback system methods
  async getFeedback(options?: { status?: string; type?: string; limit?: number }): Promise<Feedback[]> {
    let query = db.select().from(feedback);
    
    if (options?.status) {
      query = query.where(eq(feedback.status, options.status));
    }
    
    if (options?.type) {
      query = query.where(eq(feedback.type, options.type));
    }
    
    const results = await query.orderBy(desc(feedback.createdAt));
    
    if (options?.limit) {
      return results.slice(0, options.limit);
    }
    
    return results;
  }
  
  async getFeedbackById(id: number): Promise<Feedback | undefined> {
    const [result] = await db.select().from(feedback).where(eq(feedback.id, id));
    return result || undefined;
  }
  
  async createFeedback(feedbackItem: InsertFeedback): Promise<Feedback> {
    const [result] = await db
      .insert(feedback)
      .values(feedbackItem)
      .returning();
    return result;
  }
  
  async updateFeedback(id: number, feedbackUpdate: Partial<InsertFeedback>): Promise<Feedback> {
    const [result] = await db
      .update(feedback)
      .set({ ...feedbackUpdate, updatedAt: new Date() })
      .where(eq(feedback.id, id))
      .returning();
    return result;
  }
  
  async deleteFeedback(id: number): Promise<void> {
    // First delete all comments and votes for this feedback
    await db.delete(feedbackComments).where(eq(feedbackComments.feedbackId, id));
    await db.delete(feedbackVotes).where(eq(feedbackVotes.feedbackId, id));
    
    // Then delete the feedback itself
    await db.delete(feedback).where(eq(feedback.id, id));
  }
  
  async getFeedbackByUser(userId: number): Promise<Feedback[]> {
    return db.select().from(feedback).where(eq(feedback.userId, userId)).orderBy(desc(feedback.createdAt));
  }
  
  // Feedback comments methods
  async getFeedbackComments(feedbackId: number): Promise<FeedbackComment[]> {
    return db.select()
      .from(feedbackComments)
      .where(eq(feedbackComments.feedbackId, feedbackId))
      .orderBy(asc(feedbackComments.createdAt));
  }
  
  async addFeedbackComment(comment: InsertFeedbackComment): Promise<FeedbackComment> {
    const [result] = await db
      .insert(feedbackComments)
      .values(comment)
      .returning();
    return result;
  }
  
  async deleteFeedbackComment(id: number): Promise<void> {
    await db.delete(feedbackComments).where(eq(feedbackComments.id, id));
  }
  
  // Feedback votes methods
  async getFeedbackVotes(feedbackId: number): Promise<FeedbackVote[]> {
    return db.select()
      .from(feedbackVotes)
      .where(eq(feedbackVotes.feedbackId, feedbackId));
  }
  
  async addFeedbackVote(vote: InsertFeedbackVote): Promise<FeedbackVote> {
    // Check if the user already voted on this feedback
    const existingVote = await db.select()
      .from(feedbackVotes)
      .where(and(
        eq(feedbackVotes.feedbackId, vote.feedbackId),
        eq(feedbackVotes.userId, vote.userId)
      ));
    
    if (existingVote.length > 0) {
      // If the vote type is the same, do nothing
      if (existingVote[0].voteType === vote.voteType) {
        return existingVote[0];
      }
      
      // If the vote type is different, update it
      const [result] = await db
        .update(feedbackVotes)
        .set({ voteType: vote.voteType })
        .where(eq(feedbackVotes.id, existingVote[0].id))
        .returning();
      
      await this.updateFeedbackVoteCount(vote.feedbackId);
      return result;
    }
    
    // Otherwise, add the new vote
    const [result] = await db
      .insert(feedbackVotes)
      .values(vote)
      .returning();
    
    await this.updateFeedbackVoteCount(vote.feedbackId);
    return result;
  }
  
  async removeFeedbackVote(userId: number, feedbackId: number): Promise<void> {
    await db.delete(feedbackVotes)
      .where(and(
        eq(feedbackVotes.userId, userId),
        eq(feedbackVotes.feedbackId, feedbackId)
      ));
    
    await this.updateFeedbackVoteCount(feedbackId);
  }
  
  async updateFeedbackVoteCount(feedbackId: number): Promise<void> {
    // Count upvotes and downvotes
    const upvotesResult = await db.select({ count: sql`count(*)` })
      .from(feedbackVotes)
      .where(and(
        eq(feedbackVotes.feedbackId, feedbackId),
        eq(feedbackVotes.voteType, 'upvote')
      ));
    
    const downvotesResult = await db.select({ count: sql`count(*)` })
      .from(feedbackVotes)
      .where(and(
        eq(feedbackVotes.feedbackId, feedbackId),
        eq(feedbackVotes.voteType, 'downvote')
      ));
    
    const upvotes = Number(upvotesResult[0].count);
    const downvotes = Number(downvotesResult[0].count);
    
    // Update the feedback vote count (upvotes - downvotes)
    await db.update(feedback)
      .set({ voteCount: upvotes - downvotes })
      .where(eq(feedback.id, feedbackId));
  }
}

export const storage = new DatabaseStorage();
