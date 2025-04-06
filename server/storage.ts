import { 
  users, 
  leads, 
  orders, 
  messages, 
  activities, 
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
  
  // Lead methods
  getLeads(): Promise<Lead[]>;
  getRecentLeads(limit?: number): Promise<Lead[]>;
  createLead(lead: InsertLead): Promise<Lead>;
  
  // Order methods
  getOrders(): Promise<Order[]>;
  getRecentOrders(limit?: number): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  
  // Message methods
  getConversations(): Promise<any[]>;
  getMessagesByConversation(conversationId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  
  // Activity methods
  getRecentActivities(limit?: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  
  // Analytics methods
  getRevenueData(period: string): Promise<any[]>;
  getCustomerAcquisitionData(period: string): Promise<any[]>;
  getConversionFunnelData(): Promise<any[]>;
  getSalesByProductData(period: string): Promise<any[]>;
  getSalesByChannelData(period: string): Promise<any[]>;
  getLeadConversionData(period: string): Promise<any[]>;
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
}

export const storage = new DatabaseStorage();
