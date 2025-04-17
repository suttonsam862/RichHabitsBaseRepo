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
  designProjects,
  designVersions,
  designRevisions,
  designMessages,
  events,
  sidebarGroups,
  sidebarItems,
  userSettings,
  staffMembers,
  camps,
  campStaffAssignments,
  campScheduleItems,
  campTasks,
  travelArrangements,
  accommodations,
  fabricTypes,
  fabricCompatibilities,
  sewingPatterns,
  productSuggestions,
  financialTransactions,
  campFinancials,
  campVendorAssignments,
  aiTrainingData,
  ROLES,
  type User, 
  type InsertUser, 
  type Lead, 
  type StaffMember,
  type Camp,
  type CampStaffAssignment,
  type CampScheduleItem,
  type InsertCampScheduleItem,
  type CampTask,
  type InsertCampTask,
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
  type FabricType,
  type InsertFabricType,
  type FabricCompatibility,
  type InsertFabricCompatibility,
  type InsertCustomizationOption,
  type SalesTeamMember,
  type InsertSalesTeamMember,
  type Organization,
  type InsertOrganization,
  type DesignProject,
  type InsertDesignProject,
  type DesignVersion,
  type InsertDesignVersion,
  type DesignRevision,
  type InsertDesignRevision,
  type DesignMessage,
  type InsertDesignMessage,
  type Feedback,
  type FeedbackComment,
  type FeedbackVote,
  type InsertFeedback,
  type InsertFeedbackComment,
  type InsertFeedbackVote,
  type Permission,
  type Event,
  type InsertEvent,
  type StaffMember,
  type InsertStaffMember,
  type Camp,
  type InsertCamp,
  type CampStaffAssignment,
  type InsertCampStaffAssignment,
  type FabricType,
  type InsertFabricType,
  type FabricCompatibility,
  type InsertFabricCompatibility,
  type SewingPattern,
  type InsertSewingPattern,
  type ProductSuggestion,
  type InsertProductSuggestion,
  type AiTrainingData,
  type InsertAiTrainingData
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and, or, isNull, asc, inArray } from "drizzle-orm";
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
  getUserSettings(userId: number, settingType: string): Promise<any>;
  getAllUsers(): Promise<User[]>;
  getAdminUsers(): Promise<User[]>;
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
  getLeads(userId?: number, includeOpenLeads?: boolean): Promise<Lead[]>;
  getRecentLeads(limit?: number): Promise<Lead[]>;
  createLead(lead: InsertLead): Promise<Lead>;
  getLeadById(id: number): Promise<Lead | undefined>;
  updateLead(lead: Lead): Promise<Lead>;
  deleteLead(id: number): Promise<void>;
  getUnassignedLeads(): Promise<Lead[]>;
  getLeadAssignments(): Promise<any[]>;
  assignLeadToSalesRep(leadId: number, salesRepId: number): Promise<any>;
  
  // Order methods
  getOrders(): Promise<Order[]>;
  getRecentOrders(limit?: number): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: number, orderData: Partial<Order>): Promise<Order>;
  getOrderById(id: number): Promise<Order | undefined>;
  deleteOrder(id: number): Promise<void>;
  
  // Message methods
  getConversations(): Promise<any[]>;
  getMessagesByConversation(conversationId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  
  // Activity methods
  getRecentActivities(limit?: number): Promise<Activity[]>;
  getRecentActivitiesFiltered(
    limit: number, 
    userId: number, 
    includeTeam?: boolean, 
    includeRelated?: boolean,
    includeSystem?: boolean
  ): Promise<Activity[]>;
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
  
  // Fabric Research Center methods
  getFabricTypes(): Promise<FabricType[]>;
  getFabricTypeById(id: number): Promise<FabricType | undefined>;
  getFabricTypeByName(name: string): Promise<FabricType | undefined>;
  createFabricType(fabricType: InsertFabricType): Promise<FabricType>;
  updateFabricType(id: number, fabricType: Partial<InsertFabricType>): Promise<FabricType>;
  deleteFabricType(id: number): Promise<void>;
  
  getFabricCompatibilities(): Promise<FabricCompatibility[]>;
  getFabricCompatibilitiesByFabricType(fabricTypeId: number): Promise<FabricCompatibility[]>;
  getFabricCompatibility(id: number): Promise<FabricCompatibility | undefined>;
  createFabricCompatibility(compatibility: InsertFabricCompatibility): Promise<FabricCompatibility>;
  updateFabricCompatibility(id: number, compatibility: Partial<InsertFabricCompatibility>): Promise<FabricCompatibility>;
  deleteFabricCompatibility(id: number): Promise<void>;
  
  // Sewing pattern methods
  getAllSewingPatterns(): Promise<SewingPattern[]>;
  getSewingPatternById(id: number): Promise<SewingPattern | undefined>;
  createSewingPattern(pattern: InsertSewingPattern): Promise<SewingPattern>;
  updateSewingPattern(id: number, pattern: Partial<InsertSewingPattern>): Promise<SewingPattern>;
  deleteSewingPattern(id: number): Promise<void>;
  
  // Product suggestions methods
  getProductSuggestions(): Promise<ProductSuggestion[]>;
  getProductSuggestionById(id: number): Promise<ProductSuggestion | undefined>;
  createProductSuggestion(suggestion: InsertProductSuggestion): Promise<ProductSuggestion>;
  updateProductSuggestion(id: number, suggestion: Partial<InsertProductSuggestion>): Promise<ProductSuggestion>;
  deleteProductSuggestion(id: number): Promise<void>;
  
  // AI Training Data methods
  getAiTrainingData(): Promise<{ 
    fabrics: AiTrainingData[]; 
    patterns: AiTrainingData[]; 
    measurements: AiTrainingData[]; 
    products: AiTrainingData[];
  }>;
  addAiTrainingDataFile(data: InsertAiTrainingData): Promise<AiTrainingData>;
  addAiTrainingDataUrl(data: InsertAiTrainingData): Promise<AiTrainingData>;
  updateAiTrainingDataStatus(id: number, status: string, errorMessage?: string): Promise<AiTrainingData>;
  deleteAiTrainingData(id: number): Promise<void>;
  
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
  getOrganizationsBySalesRep(salesRepId: number): Promise<Organization[]>;
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
  clearAllProducts(): Promise<void>;
  
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
  
  // Design Projects methods
  getDesignProjects(): Promise<DesignProject[]>;
  getDesignProject(id: number): Promise<DesignProject | undefined>;
  getDesignProjectsByUserId(userId: number): Promise<DesignProject[]>;
  getDesignProjectsByDesignerId(designerId: number): Promise<DesignProject[]>;
  getUnassignedDesignProjects(): Promise<DesignProject[]>;
  createDesignProject(project: InsertDesignProject): Promise<DesignProject>;
  updateDesignProject(id: number, project: Partial<InsertDesignProject>): Promise<DesignProject>;
  deleteDesignProject(id: number): Promise<void>;
  assignDesignProject(id: number, designerId: number, designerName: string): Promise<DesignProject>;
  
  // Design Versions methods
  getDesignVersions(projectId: number): Promise<DesignVersion[]>;
  getDesignVersion(id: number): Promise<DesignVersion | undefined>;
  createDesignVersion(version: InsertDesignVersion): Promise<DesignVersion>;
  updateDesignVersion(id: number, version: Partial<InsertDesignVersion>): Promise<DesignVersion>;
  deleteDesignVersion(id: number): Promise<void>;
  
  // Design Revisions methods
  getDesignRevisions(designId: number): Promise<DesignRevision[]>;
  getDesignRevision(id: number): Promise<DesignRevision | undefined>;
  createDesignRevision(revision: InsertDesignRevision): Promise<DesignRevision>;
  updateDesignRevision(id: number, revision: Partial<InsertDesignRevision>): Promise<DesignRevision>;
  completeDesignRevision(id: number): Promise<DesignRevision>;
  deleteDesignRevision(id: number): Promise<void>;
  
  // Design Messages methods
  getDesignMessages(designId: number): Promise<DesignMessage[]>;
  createDesignMessage(message: InsertDesignMessage): Promise<DesignMessage>;
  deleteDesignMessage(id: number): Promise<void>;
  
  // Events methods
  getEvents(): Promise<Event[]>;
  getEventById(id: number): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: number, event: Partial<InsertEvent>): Promise<Event>;
  deleteEvent(id: number): Promise<void>;
  
  // Staff methods
  getStaffMembers(): Promise<StaffMember[]>;
  getStaffMemberById(id: number): Promise<StaffMember | undefined>;
  createStaffMember(staffMember: InsertStaffMember): Promise<StaffMember>;
  updateStaffMember(id: number, staffMember: Partial<InsertStaffMember>): Promise<StaffMember>;
  deleteStaffMember(id: number): Promise<void>;
  
  // Camp methods
  getCamps(): Promise<Camp[]>;
  getCampById(id: number): Promise<Camp | undefined>;
  createCamp(camp: InsertCamp): Promise<Camp>;
  updateCamp(id: number, camp: Partial<InsertCamp>): Promise<Camp>;
  deleteCamp(id: number): Promise<void>;
  
  // Camp-Staff methods
  getCampStaff(campId: number): Promise<StaffMember[]>;
  getStaffById(staffId: number): Promise<StaffMember | undefined>;
  addStaffToCamp(campId: number, staffId: number): Promise<CampStaffAssignment>;
  removeStaffFromCamp(campId: number, staffId: number): Promise<void>;
  updateCampSchedule(id: number, schedule: any): Promise<Camp>;
  updateCampTasks(id: number, tasks: any): Promise<Camp>;
  assignStaffToCamp(campId: number, staffAssignments: any): Promise<Camp>;
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
  
  async getAdminUsers(): Promise<User[]> {
    return db.select()
      .from(users)
      .where(eq(users.role, 'admin'))
      .orderBy(asc(users.fullName));
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
    try {
      // Make sure the visiblePages is an array and convert it correctly
      if (!Array.isArray(visiblePages)) {
        throw new Error("visiblePages must be an array");
      }
      
      console.log(`Updating visible pages for user ${userId}:`, visiblePages);
      
      // Ensure proper SQL JSON array formatting for PostgreSQL
      const [updatedUser] = await db
        .update(users)
        .set({ 
          visiblePages: visiblePages as any
          // Note: updatedAt is handled automatically by the schema
        })
        .where(eq(users.id, userId))
        .returning();
      
      console.log(`User ${userId} pages updated successfully:`, updatedUser.visiblePages);
      
      return updatedUser;
    } catch (error) {
      console.error(`Error updating visible pages for user ${userId}:`, error);
      throw error;
    }
  }
  
  async getUserSettings(userId: number, settingType: string): Promise<any> {
    try {
      if (settingType === 'navigation') {
        // First, get the user's visiblePages
        const user = await this.getUser(userId);
        
        // Next, try to get any saved custom menu groups from user_settings table
        let result;
        try {
          // Look for any saved navigation settings
          const [navSettings] = await db.select()
            .from(userSettings)
            .where(and(
              eq(userSettings.userId, userId),
              eq(userSettings.settingType, 'navigation')
            ));
            
          if (navSettings && navSettings.settings) {
            // We have custom navigation settings
            let settings = navSettings.settings;
            
            // Make sure the settings include visiblePages
            if (user && user.visiblePages) {
              settings.visiblePages = user.visiblePages;
            }
            
            console.log(`Returning saved navigation settings for user ${userId}:`, settings);
            return { settings };
          }
        } catch (dbError) {
          console.error('Error fetching navigation settings from database:', dbError);
        }
        
        // If we don't have saved settings, return just the visiblePages
        if (user && user.visiblePages && user.visiblePages.length > 0) {
          console.log(`Returning navigation settings for user ${userId} based on visiblePages:`, user.visiblePages);
          
          // Return the visible pages directly - the sidebar will handle filtering
          return { 
            settings: {
              visiblePages: user.visiblePages 
            }
          };
        }
      }
      
      // Default response if no settings found
      return { settings: {} };
    } catch (error) {
      console.error(`Error getting ${settingType} settings for user ${userId}:`, error);
      return { settings: {} };
    }
  }
  
  async updateUserSettings(userId: number, settingType: string, settings: any): Promise<void> {
    try {
      console.log(`Updating ${settingType} settings for user ${userId}:`, settings);
      
      // First check if there's an existing record
      const [existingSettings] = await db.select()
        .from(userSettings)
        .where(and(
          eq(userSettings.userId, userId),
          eq(userSettings.settingType, settingType)
        ));
      
      if (existingSettings) {
        // Update existing settings
        await db.update(userSettings)
          .set({
            settings: settings,
            updatedAt: new Date()
          })
          .where(and(
            eq(userSettings.userId, userId),
            eq(userSettings.settingType, settingType)
          ));
          
        console.log(`Updated existing ${settingType} settings for user ${userId}`);
      } else {
        // Insert new settings
        await db.insert(userSettings)
          .values({
            userId,
            settingType,
            settings
          });
          
        console.log(`Inserted new ${settingType} settings for user ${userId}`);
      }
      
      return Promise.resolve();
    } catch (error) {
      console.error(`Error updating ${settingType} settings for user ${userId}:`, error);
      throw error;
    }
  }
  
  // Lead methods
  async getLeads(userId?: number, includeOpenLeads?: boolean): Promise<Lead[]> {
    if (userId && includeOpenLeads) {
      // For salespeople: return both leads assigned to them and unassigned (open) leads
      return db.select()
        .from(leads)
        .where(
          or(
            eq(leads.salesRepId, userId),
            isNull(leads.salesRepId)
          )
        )
        .orderBy(desc(leads.createdAt));
    } else if (userId) {
      // Only return leads assigned to this user
      return db.select()
        .from(leads)
        .where(eq(leads.salesRepId, userId))
        .orderBy(desc(leads.createdAt));
    } else {
      // Return all leads (for admin)
      return db.select().from(leads).orderBy(desc(leads.createdAt));
    }
  }
  
  async getRecentLeads(limit: number = 5, userId?: number, includeOpenLeads?: boolean): Promise<Lead[]> {
    if (userId && includeOpenLeads) {
      // For salespeople: return both leads assigned to them and unassigned (open) leads
      return db.select()
        .from(leads)
        .where(
          or(
            eq(leads.salesRepId, userId),
            isNull(leads.salesRepId)
          )
        )
        .orderBy(desc(leads.createdAt))
        .limit(limit);
    } else if (userId) {
      // Only return leads assigned to this user
      return db.select()
        .from(leads)
        .where(eq(leads.salesRepId, userId))
        .orderBy(desc(leads.createdAt))
        .limit(limit);
    } else {
      // Return all leads (for admin)
      return db.select().from(leads).orderBy(desc(leads.createdAt)).limit(limit);
    }
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
  
  async updateLead(lead: Lead): Promise<Lead> {
    try {
      // Remove id from the lead data to avoid updating the primary key
      const { id, ...updateData } = lead;
      
      // Update the lead
      const [updatedLead] = await db
        .update(leads)
        .set(updateData)
        .where(eq(leads.id, id))
        .returning();
      
      return updatedLead;
    } catch (error) {
      console.error("Error updating lead:", error);
      throw error;
    }
  }
  
  async deleteLead(id: number): Promise<void> {
    await db.delete(leads).where(eq(leads.id, id));
  }
  
  // Order methods
  async getOrders(userId?: number): Promise<Order[]> {
    if (userId) {
      // If userId is provided, filter by assigned sales rep
      return db.select()
        .from(orders)
        .where(eq(orders.assignedSalesRepId, userId))
        .orderBy(desc(orders.createdAt));
    } else {
      // If no userId, return all orders
      return db.select().from(orders).orderBy(desc(orders.createdAt));
    }
  }
  
  async getOrdersByUserId(userId: number): Promise<Order[]> {
    // This is specifically for filtering by the assigned sales rep
    return db.select()
      .from(orders)
      .where(eq(orders.assignedSalesRepId, userId))
      .orderBy(desc(orders.createdAt));
  }
  
  async getRecentOrders(limit: number = 5, userId?: number): Promise<Order[]> {
    if (userId) {
      // If userId is provided, filter by assigned sales rep
      return db.select()
        .from(orders)
        .where(eq(orders.assignedSalesRepId, userId))
        .orderBy(desc(orders.createdAt))
        .limit(limit);
    } else {
      // If no userId, return all recent orders
      return db.select().from(orders).orderBy(desc(orders.createdAt)).limit(limit);
    }
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
  
  async updateOrder(id: number, orderData: Partial<Order>): Promise<Order> {
    try {
      // Make sure the order exists
      const order = await this.getOrderById(id);
      if (!order) {
        throw new Error("Order not found");
      }
      
      // Remove id from the update data if it exists
      const { id: _, ...updateData } = orderData;
      
      // Update the order
      const [updatedOrder] = await db
        .update(orders)
        .set(updateData)
        .where(eq(orders.id, id))
        .returning();
      
      return updatedOrder;
    } catch (error) {
      console.error("Error updating order:", error);
      throw error;
    }
  }
  
  async deleteOrder(id: number): Promise<void> {
    try {
      // First, get the order to find its orderId
      const order = await this.getOrderById(id);
      if (!order) {
        throw new Error("Order not found");
      }
      
      // First, try to delete any associated design projects
      // We need to do this in a specific order to respect foreign key constraints
      // 1. Get all design projects associated with this order
      // 2. For each design project, delete associated versions, revisions, and messages
      // 3. Delete the design project
      // 4. Then finally delete the order
      
      console.log(`Deleting order: ${order.orderId} (ID: ${id})`);
      
      // Step 1: Get all design projects for this order
      const designProjectsResult = await db.execute(sql`
        SELECT * FROM design_projects 
        WHERE order_id = ${order.orderId}
      `);
      
      const designProjects = designProjectsResult.rows;
      console.log(`Found ${designProjects.length} design projects to delete for order ${order.orderId}`);
      
      // Step 2: Delete related records for each design project
      for (const project of designProjects) {
        console.log(`Deleting design project ${project.id} and its related records`);
        
        // Delete design versions
        await db.execute(sql`
          DELETE FROM design_versions 
          WHERE project_id = ${project.id}
        `);
        
        // Delete design revisions
        await db.execute(sql`
          DELETE FROM design_revisions 
          WHERE design_id = ${project.id}
        `);
        
        // Delete design messages
        await db.execute(sql`
          DELETE FROM design_messages 
          WHERE design_id = ${project.id}
        `);
      }
      
      // Step 3: Delete all design projects for this order
      if (designProjects.length > 0) {
        await db.execute(sql`
          DELETE FROM design_projects 
          WHERE order_id = ${order.orderId}
        `);
        console.log(`Deleted ${designProjects.length} design projects for order ${order.orderId}`);
      }
      
      // Step 4: Finally delete the order
      await db.delete(orders).where(eq(orders.id, id));
      console.log(`Successfully deleted order ${order.orderId}`);
    } catch (error) {
      console.error("Error deleting order:", error);
      throw error;
    }
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
  
  async getRecentActivitiesFiltered(
    limit: number = 5, 
    userId: number, 
    includeTeam: boolean = false, 
    includeRelated: boolean = false,
    includeSystem: boolean = false
  ): Promise<Activity[]> {
    try {
      // Start building the query with basic filters
      let query = db.select().from(activities);
      
      // Filter conditions array
      const conditions = [];
      
      // Direct user activities (always included)
      conditions.push(eq(activities.userId, userId));
      
      // Activities related to the user (if requested)
      if (includeRelated) {
        conditions.push(
          and(
            eq(activities.relatedType, 'user'),
            eq(activities.relatedId, userId)
          )
        );
        
        // Include activities for leads assigned to this user
        conditions.push(
          and(
            eq(activities.relatedType, 'lead'),
            sql`EXISTS (SELECT 1 FROM leads WHERE leads.id = activities.related_id AND leads.user_id = ${userId})`
          )
        );
        
        // Include activities for orders assigned to this user
        conditions.push(
          and(
            eq(activities.relatedType, 'order'),
            sql`EXISTS (SELECT 1 FROM orders WHERE orders.id = activities.related_id AND orders.assigned_sales_rep_id = ${userId})`
          )
        );
      }
      
      // Team activities (only if requested)
      if (includeTeam) {
        conditions.push(
          and(
            eq(activities.type, 'team'),
            or(
              isNull(activities.relatedId),
              activities.relatedId > 0
            )
          )
        );
      }
      
      // System activities (only if requested)
      if (includeSystem) {
        conditions.push(
          and(
            eq(activities.type, 'system'),
            or(
              isNull(activities.relatedId),
              activities.relatedId > 0
            )
          )
        );
      }
      
      // Apply the conditions
      query = query.where(or(...conditions));
      
      // Order by created date and limit results
      query = query.orderBy(desc(activities.createdAt)).limit(limit);
      
      return await query;
    } catch (error) {
      console.error("Error in getRecentActivitiesFiltered:", error);
      return []; // Return empty array on error
    }
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
  
  async getOrganizationsBySalesRep(salesRepId: number): Promise<Organization[]> {
    return db.select()
      .from(organizations)
      .where(eq(organizations.assignedSalesRepId, salesRepId))
      .orderBy(asc(organizations.name));
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
      // Clear all tables in the correct order to handle foreign key constraints
      // Start with tables that reference other tables
      await db.delete(feedbackVotes);
      await db.delete(feedbackComments);
      await db.delete(feedback);
      await db.delete(designMessages);
      await db.delete(designRevisions);
      await db.delete(designVersions);
      await db.delete(designProjects);
      await db.delete(customizationOptions);
      await db.delete(activities);
      await db.delete(messages);
      await db.delete(orders);
      await db.delete(leads);
      await db.delete(fabricCuts);
      await db.delete(fabricOptions);
      await db.delete(products);
      await db.delete(organizations);
      
      // First delete sales_team_members where user_id is not 1 (not admin)
      await db.delete(salesTeamMembers).where(sql`user_id != 1 OR user_id IS NULL`);
      
      // Keep user 1 (admin) but delete all other users
      await db.delete(users).where(sql`id != 1`);
      
      console.log("Example data cleared successfully");
    } catch (error) {
      console.error("Error clearing example data:", error);
      throw error;
    }
  }
  
  async clearAllProducts(): Promise<void> {
    try {
      // Delete all products and related data
      await db.delete(customizationOptions);
      await db.delete(fabricCuts);
      await db.delete(fabricOptions);
      await db.delete(products);
      
      console.log("All products have been deleted successfully");
    } catch (error) {
      console.error("Error deleting products:", error);
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
  
  // Design Projects methods
  async getDesignProjects(): Promise<DesignProject[]> {
    return db.select().from(designProjects).orderBy(desc(designProjects.createdAt));
  }
  
  async getDesignProject(id: number): Promise<DesignProject | undefined> {
    const [project] = await db.select().from(designProjects).where(eq(designProjects.id, id));
    return project;
  }
  
  async getDesignProjectsByUserId(userId: number): Promise<DesignProject[]> {
    // Get orders created by this user, then find design projects related to those orders
    const userOrders = await db.select().from(orders).where(eq(orders.userId, userId));
    const orderIds = userOrders.map(order => order.orderId);
    
    if (orderIds.length === 0) return [];
    
    return db.select()
      .from(designProjects)
      .where(inArray(designProjects.orderId, orderIds))
      .orderBy(desc(designProjects.createdAt));
  }
  
  async getDesignProjectsByDesignerId(designerId: number): Promise<DesignProject[]> {
    return db.select()
      .from(designProjects)
      .where(eq(designProjects.designerId, designerId))
      .orderBy(desc(designProjects.createdAt));
  }
  
  async getUnassignedDesignProjects(): Promise<DesignProject[]> {
    return db.select()
      .from(designProjects)
      .where(sql`designer_id IS NULL`)
      .orderBy(desc(designProjects.createdAt));
  }
  
  async createDesignProject(project: InsertDesignProject): Promise<DesignProject> {
    const [newProject] = await db
      .insert(designProjects)
      .values(project)
      .returning();
    return newProject;
  }
  
  async updateDesignProject(id: number, project: Partial<InsertDesignProject>): Promise<DesignProject> {
    const [updatedProject] = await db
      .update(designProjects)
      .set({ ...project, updatedAt: new Date() })
      .where(eq(designProjects.id, id))
      .returning();
    return updatedProject;
  }
  
  async deleteDesignProject(id: number): Promise<void> {
    // First delete all related versions and revisions (cascading should handle this, but being explicit)
    await db.delete(designVersions).where(eq(designVersions.projectId, id));
    await db.delete(designRevisions).where(eq(designRevisions.designId, id));
    await db.delete(designMessages).where(eq(designMessages.designId, id));
    
    // Then delete the project itself
    await db.delete(designProjects).where(eq(designProjects.id, id));
  }
  
  async assignDesignProject(id: number, designerId: number, designerName: string): Promise<DesignProject> {
    const [updatedProject] = await db
      .update(designProjects)
      .set({ 
        designerId,
        designerName,
        status: 'in_progress',
        updatedAt: new Date()
      })
      .where(eq(designProjects.id, id))
      .returning();
    return updatedProject;
  }
  
  // Design Versions methods
  async getDesignVersions(projectId: number): Promise<DesignVersion[]> {
    return db.select()
      .from(designVersions)
      .where(eq(designVersions.projectId, projectId))
      .orderBy(asc(designVersions.versionNumber));
  }
  
  async getDesignVersion(id: number): Promise<DesignVersion | undefined> {
    const [version] = await db.select().from(designVersions).where(eq(designVersions.id, id));
    return version;
  }
  
  async createDesignVersion(version: InsertDesignVersion): Promise<DesignVersion> {
    // Get the current highest version number for this project
    const result = await db.execute(sql`
      SELECT MAX(version_number) as max_version
      FROM ${designVersions}
      WHERE project_id = ${version.projectId}
    `);
    
    const maxVersion = parseInt(result.rows[0]?.max_version as string) || 0;
    const versionNumber = maxVersion + 1;
    
    // Create the new version
    const [newVersion] = await db
      .insert(designVersions)
      .values({ ...version, versionNumber })
      .returning();
    
    // Update the project status to 'review' if it was 'in_progress'
    const [project] = await db.select().from(designProjects).where(eq(designProjects.id, version.projectId));
    if (project && project.status === 'in_progress') {
      await db.update(designProjects)
        .set({ 
          status: 'review',
          updatedAt: new Date()
        })
        .where(eq(designProjects.id, version.projectId));
    }
    
    return newVersion;
  }
  
  async updateDesignVersion(id: number, version: Partial<InsertDesignVersion>): Promise<DesignVersion> {
    const [updatedVersion] = await db
      .update(designVersions)
      .set(version)
      .where(eq(designVersions.id, id))
      .returning();
    return updatedVersion;
  }
  
  async deleteDesignVersion(id: number): Promise<void> {
    await db.delete(designVersions).where(eq(designVersions.id, id));
  }
  
  // Design Revisions methods
  async getDesignRevisions(designId: number): Promise<DesignRevision[]> {
    return db.select()
      .from(designRevisions)
      .where(eq(designRevisions.designId, designId))
      .orderBy(desc(designRevisions.requestedAt));
  }
  
  async getDesignRevision(id: number): Promise<DesignRevision | undefined> {
    const [revision] = await db.select().from(designRevisions).where(eq(designRevisions.id, id));
    return revision;
  }
  
  async createDesignRevision(revision: InsertDesignRevision): Promise<DesignRevision> {
    const [newRevision] = await db
      .insert(designRevisions)
      .values(revision)
      .returning();
    
    // Update the design project status to indicate revisions needed
    await db.update(designProjects)
      .set({ 
        status: 'in_progress',
        feedback: revision.description,
        updatedAt: new Date()
      })
      .where(eq(designProjects.id, revision.designId));
    
    return newRevision;
  }
  
  async updateDesignRevision(id: number, revision: Partial<InsertDesignRevision>): Promise<DesignRevision> {
    const [updatedRevision] = await db
      .update(designRevisions)
      .set(revision)
      .where(eq(designRevisions.id, id))
      .returning();
    return updatedRevision;
  }
  
  async completeDesignRevision(id: number): Promise<DesignRevision> {
    const [updatedRevision] = await db
      .update(designRevisions)
      .set({ 
        status: 'completed',
        completedAt: new Date()
      })
      .where(eq(designRevisions.id, id))
      .returning();
    return updatedRevision;
  }
  
  async deleteDesignRevision(id: number): Promise<void> {
    await db.delete(designRevisions).where(eq(designRevisions.id, id));
  }
  
  // Design Messages methods
  async getDesignMessages(designId: number): Promise<DesignMessage[]> {
    return db.select()
      .from(designMessages)
      .where(eq(designMessages.designId, designId))
      .orderBy(asc(designMessages.sentAt));
  }
  
  async createDesignMessage(message: InsertDesignMessage): Promise<DesignMessage> {
    const [newMessage] = await db
      .insert(designMessages)
      .values(message)
      .returning();
    return newMessage;
  }
  
  async deleteDesignMessage(id: number): Promise<void> {
    await db.delete(designMessages).where(eq(designMessages.id, id));
  }
  
  // Events methods
  async getEvents(): Promise<Event[]> {
    return db.select().from(events).orderBy(asc(events.startDate));
  }
  
  async getEventById(id: number): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event || undefined;
  }
  
  async createEvent(event: InsertEvent): Promise<Event> {
    const [newEvent] = await db
      .insert(events)
      .values(event)
      .returning();
    return newEvent;
  }
  
  async updateEvent(id: number, eventData: Partial<InsertEvent>): Promise<Event> {
    try {
      // Make sure the event exists
      const event = await this.getEventById(id);
      if (!event) {
        throw new Error("Event not found");
      }
      
      // Update the event
      const [updatedEvent] = await db
        .update(events)
        .set({
          ...eventData,
          updatedAt: new Date()
        })
        .where(eq(events.id, id))
        .returning();
      
      return updatedEvent;
    } catch (error) {
      console.error("Error updating event:", error);
      throw error;
    }
  }
  
  async deleteEvent(id: number): Promise<void> {
    try {
      // Make sure the event exists
      const event = await this.getEventById(id);
      if (!event) {
        throw new Error("Event not found");
      }
      
      // Delete the event
      await db.delete(events).where(eq(events.id, id));
    } catch (error) {
      console.error("Error deleting event:", error);
      throw error;
    }
  }
  
  // Staff Member methods
  async getStaffMembers(): Promise<StaffMember[]> {
    try {
      console.log('Fetching all staff members');
      const result = await db.select().from(staffMembers).orderBy(asc(staffMembers.name));
      console.log(`Retrieved ${result.length} staff members`);
      return result;
    } catch (error) {
      console.error('Error fetching staff members:', error);
      throw error;
    }
  }
  
  async getStaffMemberById(id: number): Promise<StaffMember | undefined> {
    try {
      console.log(`Fetching staff member with ID: ${id}`);
      const [staff] = await db.select().from(staffMembers).where(eq(staffMembers.id, id));
      if (staff) {
        console.log(`Retrieved staff member: ${staff.name}`);
      } else {
        console.log(`No staff member found with ID: ${id}`);
      }
      return staff || undefined;
    } catch (error) {
      console.error(`Error fetching staff member with ID ${id}:`, error);
      throw error;
    }
  }
  
  async createStaffMember(staffMember: InsertStaffMember): Promise<StaffMember> {
    console.log('Creating staff member:', staffMember);
    
    try {
      const [newStaff] = await db.insert(staffMembers)
        .values(staffMember as any)
        .returning();
        
      console.log('Created staff member successfully:', newStaff);
      return newStaff;
    } catch (error) {
      console.error('Error creating staff member:', error);
      throw error;
    }
  }
  
  async updateStaffMember(id: number, staffData: Partial<InsertStaffMember>): Promise<StaffMember> {
    console.log(`Updating staff member #${id} with data:`, staffData);
    
    try {
      const [updatedStaff] = await db.update(staffMembers)
        .set({
          ...staffData,
          updatedAt: new Date()
        })
        .where(eq(staffMembers.id, id))
        .returning();
        
      console.log('Updated staff member successfully:', updatedStaff);
      return updatedStaff;
    } catch (error) {
      console.error(`Error updating staff member #${id}:`, error);
      throw error;
    }
  }
  
  async deleteStaffMember(id: number): Promise<void> {
    console.log(`Deleting staff member #${id}`);
    
    try {
      await db.delete(staffMembers).where(eq(staffMembers.id, id));
      console.log(`Staff member #${id} deleted successfully`);
    } catch (error) {
      console.error(`Error deleting staff member #${id}:`, error);
      throw error;
    }
  }

  // Camp methods
  async getCamps(): Promise<Camp[]> {
    try {
      console.log('Fetching all camps');
      return db.select().from(camps).orderBy(desc(camps.startDate));
    } catch (error) {
      console.error('Error fetching camps:', error);
      return [];
    }
  }

  async getCampById(id: number): Promise<Camp | undefined> {
    try {
      const [camp] = await db.select().from(camps).where(eq(camps.id, id));
      return camp || undefined;
    } catch (error) {
      console.error(`Error fetching camp with ID ${id}:`, error);
      return undefined;
    }
  }

  async createCamp(camp: any): Promise<any> {
    try {
      // Ensure all required fields are present
      if (!camp.name) throw new Error("Camp name is required");
      if (!camp.type) throw new Error("Camp type is required");
      if (!camp.startDate) throw new Error("Start date is required");
      if (!camp.endDate) throw new Error("End date is required");
      if (!camp.venue) throw new Error("Venue is required");
      if (!camp.address) throw new Error("Address is required");
      
      // Set default values for optional fields if not provided
      const campData = {
        name: camp.name,
        type: camp.type,
        startDate: camp.startDate,
        endDate: camp.endDate,
        venue: camp.venue,
        address: camp.address,
        status: camp.status || 'upcoming',
        
        // Optional fields
        clinician: camp.clinician || null,
        participants: camp.participants || 0,
        campCost: camp.campCost || 0,
        createdBy: camp.createdBy || null,
        notes: camp.notes || null
      };
      
      // Calculate selloutCost based on participants and campCost
      if (campData.participants && campData.campCost) {
        const participantsNum = typeof campData.participants === 'string' 
          ? parseFloat(campData.participants as string) 
          : campData.participants;
        
        const campCostNum = typeof campData.campCost === 'string'
          ? parseFloat(campData.campCost as string)
          : campData.campCost;
          
        if (!isNaN(participantsNum) && !isNaN(campCostNum)) {
          campData.selloutCost = (participantsNum * campCostNum).toString();
        }
      } else {
        campData.selloutCost = '0';
      }
      
      // Calculate totalDays if not provided
      if (campData.startDate && campData.endDate) {
        const startDate = new Date(campData.startDate);
        const endDate = new Date(campData.endDate);
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end dates
        campData.totalDays = diffDays;
      }

      console.log('Attempting to create camp with data:', campData);
      
      const [newCamp] = await db
        .insert(camps)
        .values(campData)
        .returning();
      console.log('Created new camp:', newCamp);
      return newCamp;
    } catch (error) {
      console.error('Error creating camp:', error);
      throw error;
    }
  }

  async updateCamp(id: number, camp: Partial<InsertCamp>): Promise<Camp> {
    try {
      // Add updatedAt field
      const updateData = {
        ...camp,
        updatedAt: new Date()
      };
      
      // Update the camp
      const [updatedCamp] = await db
        .update(camps)
        .set(updateData as any)
        .where(eq(camps.id, id))
        .returning();
      
      console.log(`Updated camp ${id}:`, updatedCamp);
      return updatedCamp;
    } catch (error) {
      console.error(`Error updating camp ${id}:`, error);
      throw error;
    }
  }

  async deleteCamp(id: number): Promise<void> {
    try {
      // First, delete any staff assignments for this camp
      await db.delete(campStaffAssignments)
        .where(eq(campStaffAssignments.campId, id));
        
      // Then delete the camp itself
      await db.delete(camps).where(eq(camps.id, id));
      console.log(`Deleted camp ${id}`);
    } catch (error) {
      console.error(`Error deleting camp ${id}:`, error);
      throw error;
    }
  }
  
  // Camp-Staff methods
  async getCampStaff(campId: number): Promise<any[]> {
    try {
      console.log(`Getting staff for camp #${campId}`);
      
      // Get all staff assignments for this camp
      const staffAssignments = await db.select()
        .from(campStaffAssignments)
        .where(eq(campStaffAssignments.campId, campId));
      
      if (staffAssignments.length === 0) {
        return [];
      }
      
      // Get the staff IDs
      const staffIds = staffAssignments.map(assignment => assignment.staffId);
      
      // Get the staff members
      const staffList = await db.select()
        .from(staffMembers)
        .where(inArray(staffMembers.id, staffIds));
      
      // Combine staff info with their assignment details
      const staffWithAssignments = staffList.map(staff => {
        const assignment = staffAssignments.find(a => a.staffId === staff.id);
        return {
          ...staff,
          assignment: assignment ? {
            id: assignment.id,
            role: assignment.role,
            payAmount: assignment.payAmount,
            assignedAt: assignment.assignedAt
          } : null
        };
      });
      
      return staffWithAssignments;
    } catch (error) {
      console.error(`Error getting staff for camp #${campId}:`, error);
      return [];
    }
  }
  
  async getStaffById(staffId: number): Promise<StaffMember | undefined> {
    try {
      console.log(`Getting staff member #${staffId}`);
      
      const [staff] = await db.select()
        .from(staffMembers)
        .where(eq(staffMembers.id, staffId));
      
      return staff || undefined;
    } catch (error) {
      console.error(`Error getting staff member #${staffId}:`, error);
      return undefined;
    }
  }
  
  async addStaffToCamp(campId: number, staffId: number, role: string = 'clinician', payAmount: string = '0'): Promise<CampStaffAssignment> {
    try {
      console.log(`Adding staff #${staffId} to camp #${campId}`);
      
      // Check if the staff member is already assigned to this camp
      const existingAssignment = await db.select()
        .from(campStaffAssignments)
        .where(and(
          eq(campStaffAssignments.campId, campId),
          eq(campStaffAssignments.staffId, staffId)
        ));
      
      if (existingAssignment.length > 0) {
        throw new Error('Staff member is already assigned to this camp');
      }
      
      // Add the staff member to the camp
      const [assignment] = await db.insert(campStaffAssignments)
        .values({
          campId,
          staffId,
          role,
          payAmount
        })
        .returning();
      
      // Update the camp's staff count
      const camp = await this.getCampById(campId);
      if (camp) {
        await db.update(camps)
          .set({ 
            staffCount: (camp.staffCount || 0) + 1,
            updatedAt: new Date()
          })
          .where(eq(camps.id, campId));
      }
      
      // Also update the staff member's campAssignments array
      const staffMember = await this.getStaffMemberById(staffId);
      if (staffMember) {
        const campName = camp?.name || `Camp #${campId}`;
        const campAssignments = staffMember.campAssignments || [];
        
        await db.update(staffMembers)
          .set({
            campAssignments: [...campAssignments, { campId, campName }] as any
          })
          .where(eq(staffMembers.id, staffId));
      }
      
      return assignment;
    } catch (error) {
      console.error(`Error adding staff #${staffId} to camp #${campId}:`, error);
      throw error;
    }
  }
  
  async removeStaffFromCamp(campId: number, staffId: number): Promise<void> {
    try {
      console.log(`Removing staff #${staffId} from camp #${campId}`);
      
      // Remove the staff member from the camp
      await db.delete(campStaffAssignments)
        .where(and(
          eq(campStaffAssignments.campId, campId),
          eq(campStaffAssignments.staffId, staffId)
        ));
      
      // Update the camp's staff count
      const camp = await this.getCampById(campId);
      if (camp && camp.staffCount && camp.staffCount > 0) {
        await db.update(camps)
          .set({ 
            staffCount: camp.staffCount - 1,
            updatedAt: new Date()
          })
          .where(eq(camps.id, campId));
      }
      
      // Also update the staff member's campAssignments array
      const staffMember = await this.getStaffMemberById(staffId);
      if (staffMember && staffMember.campAssignments) {
        const updatedAssignments = staffMember.campAssignments.filter(
          assignment => assignment.campId !== campId
        );
        
        await db.update(staffMembers)
          .set({
            campAssignments: updatedAssignments as any
          })
          .where(eq(staffMembers.id, staffId));
      }
    } catch (error) {
      console.error(`Error removing staff #${staffId} from camp #${campId}:`, error);
      throw error;
    }
  }
  
  async updateCampSchedule(id: number, schedule: any): Promise<Camp> {
    try {
      // For backward compatibility, we'll keep the old schedule in the camp object
      const [updatedCamp] = await db
        .update(camps)
        .set({ 
          schedule,
          updatedAt: new Date() 
        })
        .where(eq(camps.id, id))
        .returning();
      
      console.log(`Updated camp ${id} schedule in legacy format`);
      return updatedCamp;
    } catch (error) {
      console.error(`Error updating camp ${id} schedule:`, error);
      throw error;
    }
  }
  
  async getCampScheduleItems(campId: number): Promise<any[]> {
    try {
      console.log(`Getting schedule items for camp #${campId}`);
      
      const scheduleItems = await db
        .select()
        .from(campScheduleItems)
        .where(eq(campScheduleItems.campId, campId))
        .orderBy(campScheduleItems.startTime);
      
      return scheduleItems;
    } catch (error) {
      console.error(`Error getting schedule items for camp #${campId}:`, error);
      return [];
    }
  }
  
  async addCampScheduleItem(item: any): Promise<any> {
    try {
      console.log(`Adding schedule item to camp #${item.campId}`);
      
      const [scheduleItem] = await db
        .insert(campScheduleItems)
        .values(item)
        .returning();
      
      // Update the camp
      await db
        .update(camps)
        .set({ 
          updatedAt: new Date(),
          // Add a hasScheduleItems field to track if the camp has schedule items
          // This is a custom field not in the schema, we'll handle it in the frontend
          schedule: { hasItems: true }
        })
        .where(eq(camps.id, item.campId));
      
      return scheduleItem;
    } catch (error) {
      console.error(`Error adding schedule item to camp:`, error);
      throw error;
    }
  }
  
  async updateCampScheduleItem(id: number, item: any): Promise<any> {
    try {
      console.log(`Updating schedule item #${id}`);
      
      const [updatedItem] = await db
        .update(campScheduleItems)
        .set({ 
          ...item,
          updatedAt: new Date() 
        })
        .where(eq(campScheduleItems.id, id))
        .returning();
      
      return updatedItem;
    } catch (error) {
      console.error(`Error updating schedule item #${id}:`, error);
      throw error;
    }
  }
  
  async deleteCampScheduleItem(id: number): Promise<void> {
    try {
      console.log(`Deleting schedule item #${id}`);
      
      // Get the schedule item first to know which camp it belongs to
      const [scheduleItem] = await db
        .select()
        .from(campScheduleItems)
        .where(eq(campScheduleItems.id, id));
      
      if (!scheduleItem) {
        throw new Error(`Schedule item #${id} not found`);
      }
      
      await db
        .delete(campScheduleItems)
        .where(eq(campScheduleItems.id, id));
      
      // Check if the camp has any remaining schedule items
      const remainingItems = await db
        .select({ count: sql`COUNT(*)` })
        .from(campScheduleItems)
        .where(eq(campScheduleItems.campId, scheduleItem.campId));
      
      // Update the camp's schedule field if needed 
      if (Number(remainingItems[0]?.count || 0) === 0) {
        await db
          .update(camps)
          .set({ 
            schedule: { hasItems: false },
            updatedAt: new Date() 
          })
          .where(eq(camps.id, scheduleItem.campId));
      }
    } catch (error) {
      console.error(`Error deleting schedule item #${id}:`, error);
      throw error;
    }
  }
  
  async updateCampTasks(id: number, tasks: any): Promise<Camp> {
    try {
      // For backward compatibility, we'll keep the old tasks in the camp object
      const [updatedCamp] = await db
        .update(camps)
        .set({ 
          tasks,
          updatedAt: new Date() 
        })
        .where(eq(camps.id, id))
        .returning();
      
      console.log(`Updated camp ${id} tasks in legacy format`);
      return updatedCamp;
    } catch (error) {
      console.error(`Error updating camp ${id} tasks:`, error);
      throw error;
    }
  }
  
  async getCampTasks(campId: number): Promise<any[]> {
    try {
      console.log(`Getting tasks for camp #${campId}`);
      
      const tasks = await db
        .select()
        .from(campTasks)
        .where(eq(campTasks.campId, campId))
        .orderBy(campTasks.priority, desc(campTasks.dueDate));
      
      return tasks;
    } catch (error) {
      console.error(`Error getting tasks for camp #${campId}:`, error);
      return [];
    }
  }
  
  async addCampTask(task: any): Promise<any> {
    try {
      console.log(`Adding task to camp #${task.campId}`);
      
      const [newTask] = await db
        .insert(campTasks)
        .values({
          ...task,
          createdAt: new Date()
        })
        .returning();
      
      return newTask;
    } catch (error) {
      console.error(`Error adding task to camp:`, error);
      throw error;
    }
  }
  
  async updateCampTask(id: number, task: any): Promise<any> {
    try {
      console.log(`Updating task #${id}`);
      
      const [updatedTask] = await db
        .update(campTasks)
        .set({ 
          ...task,
          updatedAt: new Date() 
        })
        .where(eq(campTasks.id, id))
        .returning();
      
      return updatedTask;
    } catch (error) {
      console.error(`Error updating task #${id}:`, error);
      throw error;
    }
  }
  
  async deleteCampTask(id: number): Promise<void> {
    try {
      console.log(`Deleting task #${id}`);
      
      await db
        .delete(campTasks)
        .where(eq(campTasks.id, id));
      
    } catch (error) {
      console.error(`Error deleting task #${id}:`, error);
      throw error;
    }
  }
  
  async markCampTaskComplete(id: number, completed: boolean = true): Promise<any> {
    try {
      console.log(`Marking task #${id} as ${completed ? 'complete' : 'incomplete'}`);
      
      // Get current task status
      const [task] = await db
        .select()
        .from(campTasks)
        .where(eq(campTasks.id, id));
        
      if (!task) {
        throw new Error(`Task #${id} not found`);
      }
        
      // Update with completed status
      const [updatedTask] = await db
        .update(campTasks)
        .set({ 
          status: completed ? 'completed' : 'pending',
          // Store the completion timestamp in a notes field or similar
          // since completedAt doesn't exist in the schema
          notes: completed ? `Completed at ${new Date().toISOString()}` : null,
          updatedAt: new Date() 
        })
        .where(eq(campTasks.id, id))
        .returning();
      
      return updatedTask;
    } catch (error) {
      console.error(`Error marking task #${id} as complete:`, error);
      throw error;
    }
  }
  
  async assignCampTask(id: number, assigneeId: number): Promise<any> {
    try {
      console.log(`Assigning task #${id} to staff #${assigneeId}`);
      
      // Check if the staff member exists
      const [staffMember] = await db
        .select()
        .from(staffMembers)
        .where(eq(staffMembers.id, assigneeId));
      
      if (!staffMember) {
        throw new Error(`Staff member #${assigneeId} not found`);
      }
      
      // Update the task with the assignee
      const [updatedTask] = await db
        .update(campTasks)
        .set({ 
          assignedTo: assigneeId, // using the schema's correct field name
          // Store the assignee name in the notes or description field
          description: `Assigned to ${staffMember.name}`,
          updatedAt: new Date() 
        })
        .where(eq(campTasks.id, id))
        .returning();
      
      return updatedTask;
    } catch (error) {
      console.error(`Error assigning task #${id} to staff #${assigneeId}:`, error);
      throw error;
    }
  }
  
  async assignStaffToCamp(campId: number, staffAssignments: any[]): Promise<Camp> {
    try {
      // 1. First, get the camp to make sure it exists
      const [camp] = await db
        .select()
        .from(camps)
        .where(eq(camps.id, campId));
      
      if (!camp) {
        throw new Error(`Camp with ID ${campId} not found`);
      }
      
      // 2. Clear all existing staff assignments for this camp
      await db
        .delete(campStaffAssignments)
        .where(eq(campStaffAssignments.campId, campId));
      
      // 3. Create new staff assignments
      for (const assignment of staffAssignments) {
        const { staffId, role = 'clinician', payAmount } = assignment;
        
        if (!staffId) continue; // Skip invalid assignments
        
        // Check if staff exists
        const [staffMember] = await db
          .select()
          .from(staffMembers)
          .where(eq(staffMembers.id, staffId));
        
        if (!staffMember) continue; // Skip if staff doesn't exist
        
        // Determine the pay amount - use the provided amount or fall back to staff's default rate
        const staffPayAmount = payAmount !== undefined ? 
          parseFloat(payAmount) : 
          (staffMember.rate ? parseFloat(staffMember.rate.toString()) : 0);
        
        // Create the staff assignment
        await db.insert(campStaffAssignments).values({
          campId,
          staffId,
          role,
          payAmount: staffPayAmount,
          assignedAt: new Date()
        });
      }
      
      // 4. Update the camp's staff count
      const staffCount = await db
        .select({ count: sql`COUNT(*)` })
        .from(campStaffAssignments)
        .where(eq(campStaffAssignments.campId, campId));
      
      // 5. Update the camp record with the new staff count
      const [updatedCamp] = await db
        .update(camps)
        .set({ 
          staffCount: Number(staffCount[0]?.count || 0),
          updatedAt: new Date() 
        })
        .where(eq(camps.id, campId))
        .returning();
      
      console.log(`Assigned ${staffAssignments.length} staff to camp ${campId}`);
      return updatedCamp;
    } catch (error) {
      console.error(`Error assigning staff to camp ${campId}:`, error);
      throw error;
    }
  }

  // Fabric Research Center methods
  async getFabricTypes(): Promise<FabricType[]> {
    return db.select().from(fabricTypes).orderBy(asc(fabricTypes.name));
  }
  
  async getFabricTypeById(id: number): Promise<FabricType | undefined> {
    const [fabricType] = await db.select().from(fabricTypes).where(eq(fabricTypes.id, id));
    return fabricType || undefined;
  }
  
  async getFabricTypeByName(name: string): Promise<FabricType | undefined> {
    const [fabricType] = await db.select().from(fabricTypes).where(eq(fabricTypes.name, name));
    return fabricType || undefined;
  }
  
  async createFabricType(fabricType: InsertFabricType): Promise<FabricType> {
    try {
      const [newFabricType] = await db
        .insert(fabricTypes)
        .values({
          ...fabricType,
          updatedAt: new Date()
        })
        .returning();
      return newFabricType;
    } catch (error) {
      console.error("Error creating fabric type:", error);
      throw error;
    }
  }
  
  async updateFabricType(id: number, updates: Partial<InsertFabricType>): Promise<FabricType> {
    try {
      const [updatedFabricType] = await db
        .update(fabricTypes)
        .set({
          ...updates,
          updatedAt: new Date()
        })
        .where(eq(fabricTypes.id, id))
        .returning();
      return updatedFabricType;
    } catch (error) {
      console.error(`Error updating fabric type ${id}:`, error);
      throw error;
    }
  }
  
  async deleteFabricType(id: number): Promise<void> {
    try {
      await db.delete(fabricTypes).where(eq(fabricTypes.id, id));
    } catch (error) {
      console.error(`Error deleting fabric type ${id}:`, error);
      throw error;
    }
  }
  
  async getFabricCompatibilities(): Promise<FabricCompatibility[]> {
    return db.select().from(fabricCompatibilities);
  }
  
  async getFabricCompatibilitiesByFabricType(fabricTypeId: number): Promise<FabricCompatibility[]> {
    return db
      .select()
      .from(fabricCompatibilities)
      .where(eq(fabricCompatibilities.fabricTypeId, fabricTypeId));
  }
  
  async getFabricCompatibility(id: number): Promise<FabricCompatibility | undefined> {
    const [compatibility] = await db
      .select()
      .from(fabricCompatibilities)
      .where(eq(fabricCompatibilities.id, id));
    return compatibility || undefined;
  }
  
  async createFabricCompatibility(compatibility: InsertFabricCompatibility): Promise<FabricCompatibility> {
    try {
      const [newCompatibility] = await db
        .insert(fabricCompatibilities)
        .values({
          ...compatibility,
          updatedAt: new Date()
        })
        .returning();
      return newCompatibility;
    } catch (error) {
      console.error("Error creating fabric compatibility:", error);
      throw error;
    }
  }
  
  async updateFabricCompatibility(id: number, updates: Partial<InsertFabricCompatibility>): Promise<FabricCompatibility> {
    try {
      const [updatedCompatibility] = await db
        .update(fabricCompatibilities)
        .set({
          ...updates,
          updatedAt: new Date()
        })
        .where(eq(fabricCompatibilities.id, id))
        .returning();
      return updatedCompatibility;
    } catch (error) {
      console.error(`Error updating fabric compatibility ${id}:`, error);
      throw error;
    }
  }
  
  async deleteFabricCompatibility(id: number): Promise<void> {
    try {
      await db.delete(fabricCompatibilities).where(eq(fabricCompatibilities.id, id));
    } catch (error) {
      console.error(`Error deleting fabric compatibility ${id}:`, error);
      throw error;
    }
  }
  
  // Sewing pattern methods
  async getAllSewingPatterns(): Promise<SewingPattern[]> {
    try {
      return db.select()
        .from(sewingPatterns)
        .orderBy(asc(sewingPatterns.name));
    } catch (error) {
      console.error('Error fetching sewing patterns:', error);
      throw error;
    }
  }
  
  async getSewingPatternById(id: number): Promise<SewingPattern | undefined> {
    try {
      const [pattern] = await db.select()
        .from(sewingPatterns)
        .where(eq(sewingPatterns.id, id));
      return pattern || undefined;
    } catch (error) {
      console.error(`Error fetching sewing pattern ${id}:`, error);
      throw error;
    }
  }
  
  async createSewingPattern(pattern: InsertSewingPattern): Promise<SewingPattern> {
    try {
      const [newPattern] = await db
        .insert(sewingPatterns)
        .values({
          ...pattern,
          createdAt: new Date()
        })
        .returning();
      return newPattern;
    } catch (error) {
      console.error('Error creating sewing pattern:', error);
      throw error;
    }
  }
  
  async updateSewingPattern(id: number, pattern: Partial<InsertSewingPattern>): Promise<SewingPattern> {
    try {
      const [updatedPattern] = await db
        .update(sewingPatterns)
        .set({
          ...pattern,
          updatedAt: new Date()
        })
        .where(eq(sewingPatterns.id, id))
        .returning();
      return updatedPattern;
    } catch (error) {
      console.error(`Error updating sewing pattern ${id}:`, error);
      throw error;
    }
  }
  
  async deleteSewingPattern(id: number): Promise<void> {
    try {
      await db.delete(sewingPatterns).where(eq(sewingPatterns.id, id));
    } catch (error) {
      console.error(`Error deleting sewing pattern ${id}:`, error);
      throw error;
    }
  }
  
  // Product suggestions methods
  async getProductSuggestions(): Promise<ProductSuggestion[]> {
    try {
      return db.select()
        .from(productSuggestions)
        .orderBy(asc(productSuggestions.name));
    } catch (error) {
      console.error('Error fetching product suggestions:', error);
      throw error;
    }
  }
  
  async getProductSuggestionById(id: number): Promise<ProductSuggestion | undefined> {
    try {
      const [suggestion] = await db.select()
        .from(productSuggestions)
        .where(eq(productSuggestions.id, id));
      return suggestion || undefined;
    } catch (error) {
      console.error(`Error fetching product suggestion ${id}:`, error);
      throw error;
    }
  }
  
  async createProductSuggestion(suggestion: InsertProductSuggestion): Promise<ProductSuggestion> {
    try {
      const [newSuggestion] = await db
        .insert(productSuggestions)
        .values({
          ...suggestion,
          createdAt: new Date()
        })
        .returning();
      return newSuggestion;
    } catch (error) {
      console.error('Error creating product suggestion:', error);
      throw error;
    }
  }
  
  async updateProductSuggestion(id: number, suggestion: Partial<InsertProductSuggestion>): Promise<ProductSuggestion> {
    try {
      const [updatedSuggestion] = await db
        .update(productSuggestions)
        .set({
          ...suggestion,
          updatedAt: new Date()
        })
        .where(eq(productSuggestions.id, id))
        .returning();
      return updatedSuggestion;
    } catch (error) {
      console.error(`Error updating product suggestion ${id}:`, error);
      throw error;
    }
  }
  
  async deleteProductSuggestion(id: number): Promise<void> {
    try {
      await db.delete(productSuggestions).where(eq(productSuggestions.id, id));
    } catch (error) {
      console.error(`Error deleting product suggestion ${id}:`, error);
      throw error;
    }
  }

  // AI Training Data methods
  async getAiTrainingData(): Promise<{ 
    fabrics: AiTrainingData[]; 
    patterns: AiTrainingData[]; 
    measurements: AiTrainingData[]; 
    products: AiTrainingData[];
  }> {
    try {
      const data = await db
        .select()
        .from(aiTrainingData)
        .orderBy(desc(aiTrainingData.createdAt));

      return {
        fabrics: data.filter(item => item.dataType === 'fabric'),
        patterns: data.filter(item => item.dataType === 'pattern'),
        measurements: data.filter(item => item.dataType === 'measurement'),
        products: data.filter(item => item.dataType === 'product'),
      };
    } catch (error) {
      console.error('Error getting AI training data:', error);
      throw error;
    }
  }

  async addAiTrainingDataFile(data: InsertAiTrainingData): Promise<AiTrainingData> {
    try {
      const [result] = await db
        .insert(aiTrainingData)
        .values({
          ...data,
          sourceType: 'file',
          status: 'processing',
        })
        .returning();
        
      return result;
    } catch (error) {
      console.error('Error adding AI training data file:', error);
      throw error;
    }
  }

  async addAiTrainingDataUrl(data: InsertAiTrainingData): Promise<AiTrainingData> {
    try {
      const [result] = await db
        .insert(aiTrainingData)
        .values({
          ...data,
          sourceType: 'url',
          status: 'processing',
        })
        .returning();
        
      return result;
    } catch (error) {
      console.error('Error adding AI training data URL:', error);
      throw error;
    }
  }

  async updateAiTrainingDataStatus(id: number, status: string, errorMessage?: string): Promise<AiTrainingData> {
    try {
      const [result] = await db
        .update(aiTrainingData)
        .set({ 
          status, 
          errorMessage: errorMessage || null,
          updatedAt: new Date(),
        })
        .where(eq(aiTrainingData.id, id))
        .returning();
        
      return result;
    } catch (error) {
      console.error(`Error updating AI training data status for ${id}:`, error);
      throw error;
    }
  }

  async deleteAiTrainingData(id: number): Promise<void> {
    try {
      await db.delete(aiTrainingData).where(eq(aiTrainingData.id, id));
    } catch (error) {
      console.error(`Error deleting AI training data ${id}:`, error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();
