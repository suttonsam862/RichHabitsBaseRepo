import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { 
  insertLeadSchema, 
  insertOrderSchema, 
  insertMessageSchema,
  insertActivitySchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = {
        totalLeads: 248,
        activeOrders: 36,
        monthlyRevenue: "$42,586",
        unreadMessages: 12
      };
      res.json({ data: stats });
    } catch (error: any) {
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

  return httpServer;
}
