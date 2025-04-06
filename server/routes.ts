import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { db } from "./db";
import { sql, eq, or } from "drizzle-orm";
import { setupAuth } from "./auth";
import { 
  leads,
  orders,
  messages,
  users,
  insertLeadSchema, 
  insertOrderSchema, 
  insertMessageSchema,
  insertActivitySchema,
  ROLES,
  PERMISSIONS,
  type Permission
} from "@shared/schema";
import { isAdmin, hasRequiredPermission } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Set up authentication routes
  setupAuth(app);
  
  // Dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      // Get lead count
      const leadCount = await db.select({ count: sql`COUNT(*)` }).from(leads);
      
      // Get active order count
      const activeOrderCount = await db.select({ count: sql`COUNT(*)` }).from(orders).where(
        or(
          eq(orders.status, 'pending'),
          eq(orders.status, 'processing'),
          eq(orders.status, 'paid')
        )
      );
      
      // Get monthly revenue
      const revenueResult = await db.execute(sql`
        SELECT SUM("total_amount") as revenue
        FROM ${orders}
        WHERE "status" = 'paid' OR "status" = 'delivered'
        AND "created_at" >= date_trunc('month', current_date)
      `);
      
      const monthlyRevenue = revenueResult.rows[0]?.revenue || 0;
      
      // Get unread message count
      const unreadMessageCount = await db.select({ count: sql`COUNT(*)` }).from(messages).where(
        eq(messages.status, 'unread')
      );
      
      const stats = {
        totalLeads: Number(leadCount[0]?.count || 0),
        activeOrders: Number(activeOrderCount[0]?.count || 0),
        monthlyRevenue: `$${Number(monthlyRevenue).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
        unreadMessages: Number(unreadMessageCount[0]?.count || 0)
      };
      
      res.json({ data: stats });
    } catch (error: any) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Leads endpoints
  app.get("/api/leads", async (req, res) => {
    try {
      const leads = await storage.getLeads();
      res.json({ data: leads });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/leads/recent", async (req, res) => {
    try {
      const recentLeads = await storage.getRecentLeads(3);
      res.json({ data: recentLeads });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/leads", async (req, res) => {
    try {
      const validatedData = insertLeadSchema.parse(req.body);
      const newLead = await storage.createLead(validatedData);
      
      // Create activity for the new lead
      await storage.createActivity({
        userId: validatedData.userId,
        type: "lead",
        content: `New lead ${newLead.name} added`,
        relatedId: newLead.id,
        relatedType: "lead"
      });
      
      res.status(201).json({ data: newLead });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  });

  // Orders endpoints
  app.get("/api/orders", async (req, res) => {
    try {
      const orders = await storage.getOrders();
      res.json({ data: orders });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/orders/recent", async (req, res) => {
    try {
      const recentOrders = await storage.getRecentOrders(3);
      res.json({ data: recentOrders });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/orders", async (req, res) => {
    try {
      const validatedData = insertOrderSchema.parse(req.body);
      const newOrder = await storage.createOrder(validatedData);
      
      // Create activity for the new order
      await storage.createActivity({
        userId: validatedData.userId,
        type: "order",
        content: `New order ${newOrder.orderId} received`,
        relatedId: newOrder.id,
        relatedType: "order"
      });
      
      res.status(201).json({ data: newOrder });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  });

  // Messages endpoints
  app.get("/api/messages/conversations", async (req, res) => {
    try {
      const conversations = await storage.getConversations();
      res.json({ data: conversations });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/messages/conversation/:id", async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const messages = await storage.getMessagesByConversation(conversationId);
      res.json({ data: messages });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/messages", async (req, res) => {
    try {
      const validatedData = insertMessageSchema.parse(req.body);
      const newMessage = await storage.createMessage(validatedData);
      
      // Create activity for the new message
      await storage.createActivity({
        userId: validatedData.userId,
        type: "message",
        content: "New message sent",
        relatedId: newMessage.id,
        relatedType: "message"
      });
      
      res.status(201).json({ data: newMessage });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  });

  // Activities endpoints
  app.get("/api/activities/recent", async (req, res) => {
    try {
      const activities = await storage.getRecentActivities(4);
      res.json({ data: activities });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Analytics endpoints
  app.get("/api/analytics/revenue/:timeRange", async (req, res) => {
    try {
      const timeRange = req.params.timeRange;
      const revenueData = await storage.getRevenueData(timeRange);
      res.json({ data: revenueData });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/analytics/customer-acquisition/:timeRange", async (req, res) => {
    try {
      const timeRange = req.params.timeRange;
      const acquisitionData = await storage.getCustomerAcquisitionData(timeRange);
      res.json({ data: acquisitionData });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/analytics/conversion-funnel", async (req, res) => {
    try {
      const funnelData = await storage.getConversionFunnelData();
      res.json({ data: funnelData });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Reports endpoints
  app.get("/api/reports/sales-by-product/:timeRange", async (req, res) => {
    try {
      const timeRange = req.params.timeRange;
      const salesData = await storage.getSalesByProductData(timeRange);
      res.json({ data: salesData });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/reports/sales-by-channel/:timeRange", async (req, res) => {
    try {
      const timeRange = req.params.timeRange;
      const channelData = await storage.getSalesByChannelData(timeRange);
      res.json({ data: channelData });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/reports/lead-conversion/:timeRange", async (req, res) => {
    try {
      const timeRange = req.params.timeRange;
      const leadConversionData = await storage.getLeadConversionData(timeRange);
      res.json({ data: leadConversionData });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Settings endpoints
  app.post("/api/settings/:type", async (req, res) => {
    try {
      const settingType = req.params.type;
      const userId = req.body.userId;
      
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }
      
      await storage.updateUserSettings(userId, settingType, req.body);
      res.json({ success: true, message: `${settingType} settings updated successfully` });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // User Management endpoints
  // Get all users - Admin only
  app.get("/api/users", isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json({ users });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update user role - Admin only
  app.patch("/api/users/:id/role", isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { role } = req.body;
      
      if (!Object.values(ROLES).includes(role)) {
        return res.status(400).json({ error: "Invalid role" });
      }
      
      const updatedUser = await storage.updateUserRole(userId, role);
      
      // Create activity for role change
      if (req.user) {
        const currentUser = req.user as any;
        await storage.createActivity({
          userId: currentUser.id,
          type: "user",
          content: `Updated user ${updatedUser.username} role to ${role}`,
          relatedId: userId,
          relatedType: "user"
        });
      }
      
      res.json(updatedUser);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update user permissions - Admin only
  app.patch("/api/users/:id/permissions", isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { permissions } = req.body;
      
      if (!Array.isArray(permissions)) {
        return res.status(400).json({ error: "Permissions must be an array" });
      }
      
      // Validate that all permissions are valid
      for (const permission of permissions) {
        if (!Object.values(PERMISSIONS).includes(permission as any)) {
          return res.status(400).json({ error: `Invalid permission: ${permission}` });
        }
      }
      
      const updatedUser = await storage.updateUserPermissions(userId, permissions as Permission[]);
      
      // Create activity for permissions change
      if (req.user) {
        const currentUser = req.user as any;
        await storage.createActivity({
          userId: currentUser.id,
          type: "user",
          content: `Updated user ${updatedUser.username} permissions`,
          relatedId: userId,
          relatedType: "user"
        });
      }
      
      res.json(updatedUser);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return httpServer;
}
