import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { db } from "./db";
import { sql, eq, or, and } from "drizzle-orm";
import { setupAuth, hashPassword, isAuthenticated } from "./auth";
import { hasPermission } from '../shared/permissions';
import { 
  leads,
  orders,
  messages,
  users,
  products,
  fabricOptions,
  fabricCuts,
  customizationOptions,
  organizations,
  feedback,
  feedbackComments,
  feedbackVotes,
  outlookIntegrations,
  events,
  insertLeadSchema, 
  insertOrderSchema, 
  insertMessageSchema,
  insertActivitySchema,
  insertProductSchema,
  insertFabricOptionSchema,
  insertFabricCutSchema,
  insertCustomizationOptionSchema,
  insertSalesTeamMemberSchema,
  insertOrganizationSchema,
  insertFeedbackSchema,
  insertFeedbackCommentSchema,
  insertFeedbackVoteSchema,
  insertEventSchema,
  ROLES,
  PERMISSIONS,
  type User,
  type Organization,
  type Permission,
  type Event,
  type InsertEvent
} from "@shared/schema";
import { isAdmin, hasRequiredPermission } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Set up authentication routes
  setupAuth(app);
  
  // Dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const user = req.user as User;
      
      // Check user permissions
      const canViewAllLeads = hasPermission(
        user.role,
        user.permissions,
        PERMISSIONS.VIEW_ALL_LEADS
      );
      
      const canViewAllOrders = hasPermission(
        user.role,
        user.permissions,
        PERMISSIONS.VIEW_ALL_ORDERS
      );

      let leadCountQuery;
      let activeOrderCountQuery;
      let monthlyRevenueQuery;
      
      // Filter leads based on user permissions
      if (canViewAllLeads) {
        // Admin or users with VIEW_ALL_LEADS permission see all leads
        leadCountQuery = db.select({ count: sql`COUNT(*)` }).from(leads);
      } else if (user.role === ROLES.AGENT) {
        // Sales agents see both their assigned leads and open (unassigned) leads
        leadCountQuery = db.select({ count: sql`COUNT(*)` }).from(leads).where(
          or(
            eq(leads.userId, user.id),
            eq(leads.userId, 0)
          )
        );
      } else {
        // Other users only see leads assigned to them
        leadCountQuery = db.select({ count: sql`COUNT(*)` }).from(leads).where(
          eq(leads.userId, user.id)
        );
      }
      
      // Filter orders based on user permissions
      if (canViewAllOrders) {
        // Admin or users with VIEW_ALL_ORDERS permission see all active orders
        activeOrderCountQuery = db.select({ count: sql`COUNT(*)` }).from(orders).where(
          or(
            eq(orders.status, 'pending'),
            eq(orders.status, 'processing'),
            eq(orders.status, 'paid')
          )
        );
        
        // Get overall monthly revenue for users with full permissions
        monthlyRevenueQuery = sql`
          SELECT SUM("total_amount") as revenue
          FROM ${orders}
          WHERE ("status" = 'paid' OR "status" = 'delivered')
          AND "created_at" >= date_trunc('month', current_date)
        `;
      } else {
        // Filter for orders assigned to the user
        activeOrderCountQuery = db.select({ count: sql`COUNT(*)` }).from(orders)
          .where(
            and(
              eq(orders.userId, user.id),
              or(
                eq(orders.status, 'pending'),
                eq(orders.status, 'processing'),
                eq(orders.status, 'paid')
              )
            )
          );
        
        // Get monthly revenue only for orders assigned to this user
        monthlyRevenueQuery = sql`
          SELECT SUM("total_amount") as revenue
          FROM ${orders}
          WHERE ("status" = 'paid' OR "status" = 'delivered')
          AND "created_at" >= date_trunc('month', current_date)
          AND "user_id" = ${user.id}
        `;
      }
      
      // Get unread message count - this could also be filtered by user if needed
      const unreadMessageCountQuery = db.select({ count: sql`COUNT(*)` }).from(messages)
        .where(eq(messages.status, 'unread'));

      // Execute all queries in parallel
      const [
        leadCount,
        activeOrderCount,
        revenueResult,
        unreadMessageCount
      ] = await Promise.all([
        leadCountQuery,
        activeOrderCountQuery,
        db.execute(monthlyRevenueQuery),
        unreadMessageCountQuery
      ]);
      
      const monthlyRevenue = revenueResult.rows[0]?.revenue || 0;
      
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
      // Check if the user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const user = req.user as any;
      
      // Check if user has permission to see all leads or just their assigned ones
      const canViewAllLeads = hasPermission(
        user.role,
        user.permissions,
        PERMISSIONS.VIEW_ALL_LEADS
      );
      
      let leads;
      if (canViewAllLeads) {
        // User has permission to view all leads
        leads = await storage.getLeads();
      } else if (user.role === ROLES.AGENT) {
        // Sales agents see both their assigned leads and open (unassigned) leads
        leads = await storage.getLeads(user.id, true);
      } else {
        // Other users only see leads assigned to them
        leads = await storage.getLeads(user.id);
      }
      
      res.json({ data: leads });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/leads/recent", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const user = req.user as User;
      
      // Check if user has permission to see all leads or just their assigned ones
      const canViewAllLeads = hasPermission(
        user.role,
        user.permissions,
        PERMISSIONS.VIEW_ALL_LEADS
      );
      
      let recentLeads;
      if (canViewAllLeads) {
        // User has permission to view all leads
        recentLeads = await storage.getRecentLeads(3);
      } else if (user.role === ROLES.AGENT) {
        // Sales agents see both their assigned leads and open (unassigned) leads
        recentLeads = await storage.getRecentLeads(3, user.id, true);
      } else {
        // Other users only see leads assigned to them
        recentLeads = await storage.getRecentLeads(3, user.id);
      }
      
      res.json({ data: recentLeads });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/leads", async (req, res) => {
    try {
      const validatedData = insertLeadSchema.parse(req.body);
      const newLead = await storage.createLead(validatedData);
      
      // Automatically create an organization from lead data
      try {
        // Create organization with data from the lead
        const newOrganization = await storage.createOrganization({
          name: newLead.name, // Use lead name as organization name
          type: validatedData.organizationType || 'client',
          industry: validatedData.industry || 'Unspecified',
          email: newLead.email,
          phone: newLead.phone || '',
          website: validatedData.website || '',
          address: validatedData.address || '',
          city: validatedData.city || '',
          state: validatedData.state || '',
          zip: validatedData.zip || '',
          country: validatedData.country || 'USA',
          status: 'active',
          assignedSalesRepId: newLead.salesRepId || null,
          notes: `Auto-created from lead. ${newLead.notes || ''}`,
        });
        
        console.log(`Auto-created organization ${newOrganization.name} from lead`);
        
        // Create activity for the new organization
        await storage.createActivity({
          userId: validatedData.userId,
          type: "organization",
          content: `New organization ${newOrganization.name} automatically created from lead`,
          relatedId: newOrganization.id,
          relatedType: "organization"
        });
      } catch (orgError: any) {
        console.error("Failed to auto-create organization from lead:", orgError.message);
        // We don't fail the whole request if organization creation fails
      }
      
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
  
  app.delete("/api/leads/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid lead ID" });
      }
      
      const lead = await storage.getLeadById(id);
      if (!lead) {
        return res.status(404).json({ error: "Lead not found" });
      }
      
      // Delete the lead
      await storage.deleteLead(id);
      
      // Fetch updated leads list to verify deletion
      const updatedLeads = await storage.getLeads();
      console.log(`Lead deleted. Current leads count: ${updatedLeads.length}`);
      
      // Create activity for the deleted lead
      await storage.createActivity({
        userId: req.user?.id || 1, // Use authenticated user or default to admin
        type: "lead",
        content: `Lead ${lead.name} was deleted`,
        relatedId: id,
        relatedType: "lead"
      });
      
      res.status(200).json({ 
        success: true,
        remainingCount: updatedLeads.length
      });
    } catch (error: any) {
      console.error("Error deleting lead:", error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // Claim a lead - marks the lead as claimed by the current user with a 3-day verification period
  app.post("/api/leads/:id/claim", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid lead ID" });
      }
      
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const user = req.user as User;
      
      const lead = await storage.getLeadById(id);
      if (!lead) {
        return res.status(404).json({ error: "Lead not found" });
      }
      
      // Check if lead is already claimed
      if (lead.claimed) {
        return res.status(400).json({ 
          error: "Lead already claimed", 
          claimedById: lead.claimedById 
        });
      }
      
      // Update lead with claim information
      const updatedLead = await storage.updateLead({
        ...lead,
        claimed: true,
        claimedById: user.id,
        claimedAt: new Date(),
        salesRepId: user.id,
        status: "claimed"
      });
      
      // Create activity for the lead claim
      await storage.createActivity({
        userId: user.id,
        type: "lead",
        content: `Lead ${lead.name} claimed by ${user.fullName || user.username}`,
        relatedId: lead.id,
        relatedType: "lead"
      });
      
      // Schedule verification after 3 days
      // This is where you would typically set up a cron job or scheduled task
      // For now, we'll just log that verification would be scheduled
      console.log(`Scheduled verification for lead ${lead.id} on ${new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)}`);
      
      return res.status(200).json({ 
        success: true,
        message: "Lead claimed successfully",
        leadId: updatedLead.id,
        verificationDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
      });
    } catch (error: any) {
      console.error("Error claiming lead:", error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // Convert a lead to an order - requires the lead to be claimed and verification period passed
  app.post("/api/leads/:id/convert-to-order", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid lead ID" });
      }
      
      const lead = await storage.getLeadById(id);
      if (!lead) {
        return res.status(404).json({ error: "Lead not found" });
      }
      
      // Check if the lead is claimed and verified (after 3-day period)
      const now = new Date();
      const claimedAt = lead.claimedAt ? new Date(lead.claimedAt) : null;
      const threesDaysMs = 3 * 24 * 60 * 60 * 1000; // 3 days in milliseconds
      const isVerificationPeriodOver = claimedAt && (now.getTime() - claimedAt.getTime() >= threesDaysMs);
      
      // Only admin can bypass verification period
      const isAdmin = (req.user as User)?.role === ROLES.ADMIN;
      
      if (lead.claimed && !isVerificationPeriodOver && !isAdmin) {
        return res.status(403).json({ 
          error: "Cannot convert lead to order yet. Verification period of 3 days has not passed.",
          claimedAt: lead.claimedAt,
          verificationDate: new Date(claimedAt!.getTime() + threesDaysMs)
        });
      }
      
      // Generate a unique order ID
      const orderPrefix = "RH";
      const randomNumbers = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
      const orderId = `${orderPrefix}-${randomNumbers}`;
      
      // Determine the sales rep to assign to this order
      let assignedSalesRepId = null;
      
      // First, use the sales rep who claimed the lead (highest priority)
      if (lead.claimedById) {
        assignedSalesRepId = lead.claimedById;
        console.log(`Assigning order to sales rep who claimed the lead: ${lead.claimedById}`);
      }
      // Otherwise, if there's a sales rep assigned to the lead, use that
      else if (lead.salesRepId) {
        assignedSalesRepId = lead.salesRepId;
        console.log(`Assigning order to sales rep assigned to the lead: ${lead.salesRepId}`);
      }
      // Default to the current user if they're a sales rep
      else if (req.user && (req.user as User).role === ROLES.AGENT) {
        assignedSalesRepId = (req.user as User).id;
        console.log(`Assigning order to current user (sales rep): ${(req.user as User).id}`);
      }
      
      console.log(`Lead conversion: salesRepId=${lead.salesRepId}, claimedById=${lead.claimedById}, assigned=${assignedSalesRepId}`);
      
      const orderData = {
        userId: req.user?.id || 1,
        orderId,
        customerName: lead.name,
        customerEmail: lead.email,
        totalAmount: lead.value || 0,
        status: "pending",
        assignedSalesRepId: assignedSalesRepId,
        notes: `Order created from lead: ${lead.notes || ""}`,
      };
      
      // Create new order
      const newOrder = await storage.createOrder(orderData);
      
      // Update lead status and verification status
      await storage.updateLead({
        ...lead,
        status: "converted",
        verifiedAt: now
      });
      
      // Create activity for order creation
      await storage.createActivity({
        userId: req.user?.id || 1,
        type: "lead",
        content: `Lead ${lead.name} converted to order ${orderId}`,
        relatedId: lead.id,
        relatedType: "lead"
      });
      
      await storage.createActivity({
        userId: req.user?.id || 1,
        type: "order",
        content: `New order ${orderId} created from lead ${lead.name}`,
        relatedId: newOrder.id,
        relatedType: "order"
      });
      
      return res.status(200).json({ 
        success: true,
        message: "Lead converted to order successfully",
        orderId: newOrder.orderId
      });
    } catch (error: any) {
      console.error("Error converting lead to order:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Orders endpoints
  app.get("/api/orders", async (req, res) => {
    try {
      // Check if the user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const user = req.user as any;
      
      // Admin users and those with the explicit permission can see all orders
      const canViewAllOrders = user.role === ROLES.ADMIN || hasPermission(
        user.role,
        user.permissions,
        PERMISSIONS.VIEW_ALL_ORDERS
      );
      
      // Always log user role and permissions for debugging
      console.log(`User ${user.username} requesting orders - Role: ${user.role}, Can view all: ${canViewAllOrders}`);
      
      if (canViewAllOrders) {
        // User has permission to view all orders
        const orders = await storage.getOrders();
        return res.json({ data: orders });
      } else {
        // User can only view orders assigned to them
        const orders = await storage.getOrdersByUserId(user.id);
        console.log(`Filtering orders for user ${user.username} (ID: ${user.id}) - Found ${orders.length} orders`);
        return res.json({ data: orders });
      }
    } catch (error: any) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/orders/recent", async (req, res) => {
    try {
      // Check if the user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const user = req.user as any;
      
      // Admin users and those with the explicit permission can see all orders
      const canViewAllOrders = user.role === ROLES.ADMIN || hasPermission(
        user.role,
        user.permissions,
        PERMISSIONS.VIEW_ALL_ORDERS
      );
      
      console.log(`User ${user.username} requesting recent orders - Role: ${user.role}, Can view all: ${canViewAllOrders}`);
      
      if (canViewAllOrders) {
        // User has permission to view all orders
        const recentOrders = await storage.getRecentOrders(3);
        return res.json({ data: recentOrders });
      } else {
        // User can only view orders assigned to them
        const recentOrders = await storage.getRecentOrders(3, user.id);
        console.log(`Filtering recent orders for user ${user.username} (ID: ${user.id}) - Found ${recentOrders.length} orders`);
        return res.json({ data: recentOrders });
      }
    } catch (error: any) {
      console.error("Error fetching recent orders:", error);
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
  
  app.patch("/api/orders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid order ID" });
      }
      
      const order = await storage.getOrderById(id);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const user = req.user as any;
      
      // Check if user has permission to modify this order
      // Either they need VIEW_ALL_ORDERS permission or they need to be assigned to this order
      const canModifyOrder = hasPermission(
        user.role,
        user.permissions,
        PERMISSIONS.VIEW_ALL_ORDERS
      ) || order.assignedSalesRepId === user.id;
      
      if (!canModifyOrder) {
        return res.status(403).json({ error: "Not authorized to modify this order" });
      }
      
      // Update order fields
      const updatedOrderData = {
        ...req.body,
      };
      
      // Convert string IDs to numbers where appropriate or set to null for empty/unassigned
      if (updatedOrderData.assignedSalesRepId) {
        if (updatedOrderData.assignedSalesRepId !== "unassigned" && updatedOrderData.assignedSalesRepId !== "") {
          updatedOrderData.assignedSalesRepId = parseInt(updatedOrderData.assignedSalesRepId);
          // If NaN after parsing, set to null
          if (isNaN(updatedOrderData.assignedSalesRepId)) {
            updatedOrderData.assignedSalesRepId = null;
          }
        } else {
          updatedOrderData.assignedSalesRepId = null;
        }
      }
      
      if (updatedOrderData.assignedDesignerId !== undefined) {
        if (updatedOrderData.assignedDesignerId !== "unassigned" && updatedOrderData.assignedDesignerId !== "") {
          updatedOrderData.assignedDesignerId = parseInt(updatedOrderData.assignedDesignerId);
          // If NaN after parsing, set to null
          if (isNaN(updatedOrderData.assignedDesignerId)) {
            updatedOrderData.assignedDesignerId = null;
          }
        } else {
          updatedOrderData.assignedDesignerId = null;
        }
      }
      
      if (updatedOrderData.assignedManufacturerId !== undefined) {
        if (updatedOrderData.assignedManufacturerId !== "unassigned" && updatedOrderData.assignedManufacturerId !== "") {
          updatedOrderData.assignedManufacturerId = parseInt(updatedOrderData.assignedManufacturerId);
          // If NaN after parsing, set to null
          if (isNaN(updatedOrderData.assignedManufacturerId)) {
            updatedOrderData.assignedManufacturerId = null;
          }
        } else {
          updatedOrderData.assignedManufacturerId = null;
        }
      }
      
      if (updatedOrderData.organizationId !== undefined) {
        if (updatedOrderData.organizationId !== "none" && updatedOrderData.organizationId !== "") {
          updatedOrderData.organizationId = parseInt(updatedOrderData.organizationId);
          // If NaN after parsing, set to null
          if (isNaN(updatedOrderData.organizationId)) {
            updatedOrderData.organizationId = null;
          }
        } else {
          updatedOrderData.organizationId = null;
        }
      }
      
      // Parse totalAmount if it's a string
      if (typeof updatedOrderData.totalAmount === 'string' && updatedOrderData.totalAmount !== "") {
        updatedOrderData.totalAmount = parseFloat(updatedOrderData.totalAmount);
        if (isNaN(updatedOrderData.totalAmount)) {
          updatedOrderData.totalAmount = null;
        }
      }
      
      // Set updatedAt timestamp
      updatedOrderData.updatedAt = new Date();
      
      // Perform the update
      const updatedOrder = await storage.updateOrder(id, updatedOrderData);
      
      // Create activity for the updated order
      await storage.createActivity({
        userId: user.id,
        type: "order",
        content: `Order ${order.orderId} was updated`,
        relatedId: id,
        relatedType: "order"
      });
      
      res.status(200).json({ 
        success: true,
        data: updatedOrder
      });
    } catch (error: any) {
      console.error("Error updating order:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/orders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid order ID" });
      }
      
      const order = await storage.getOrderById(id);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      // Delete the order
      await storage.deleteOrder(id);
      
      // Fetch updated orders list to verify deletion
      const updatedOrders = await storage.getOrders();
      console.log(`Order deleted. Current orders count: ${updatedOrders.length}`);
      
      // Create activity for the deleted order
      await storage.createActivity({
        userId: req.user?.id || 1, // Use authenticated user or default to admin
        type: "order",
        content: `Order ${order.orderId} was deleted`,
        relatedId: id,
        relatedType: "order"
      });
      
      res.status(200).json({ 
        success: true,
        remainingCount: updatedOrders.length
      });
    } catch (error: any) {
      console.error("Error deleting order:", error);
      res.status(500).json({ error: error.message });
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
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const user = req.user as User;
      
      // Check user permissions for different content types
      const canViewAllLeads = hasPermission(
        user.role,
        user.permissions,
        PERMISSIONS.VIEW_ALL_LEADS
      );
      
      const canViewAllOrders = hasPermission(
        user.role,
        user.permissions,
        PERMISSIONS.VIEW_ALL_ORDERS
      );
      
      // Filter activities based on user's role and permissions
      let activities;
      
      if (user.role === ROLES.ADMIN) {
        // Admin can see all activities
        activities = await storage.getRecentActivities(8);
      } else if (user.role === ROLES.MANAGER) {
        // Managers can see all activities except sensitive admin ones
        activities = await storage.getRecentActivitiesFiltered(
          8,
          user.id,
          true, // Include team activities
          true, // Include related items
          true  // Include system activities
        );
      } else if (user.role === ROLES.AGENT) {
        // Sales agents see their own activities, open leads, and their orders
        activities = await storage.getRecentActivitiesFiltered(
          8, 
          user.id, 
          false, // No team activities
          true,  // Include related items
          false  // No system activities
        );
      } else {
        // Other users only see activities directly related to them
        activities = await storage.getRecentActivitiesFiltered(
          8, 
          user.id, 
          false, // No team activities
          false, // No related items
          false  // No system activities
        );
      }
      
      res.json({ data: activities });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Filtered activities endpoint for client consumption
  app.get("/api/activities/recent/filtered", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      // Parse query parameters with defaults
      const userId = parseInt(req.query.userId as string) || (req.user as User).id;
      const limit = parseInt(req.query.limit as string) || 8;
      const includeTeam = req.query.includeTeam === 'true';
      const includeRelated = req.query.includeRelated === 'true';
      const includeSystem = req.query.includeSystem === 'true';
      
      console.log(`Getting filtered activities for user ${userId}, includeTeam: ${includeTeam}, includeRelated: ${includeRelated}, includeSystem: ${includeSystem}`);
      
      const activities = await storage.getRecentActivitiesFiltered(
        limit,
        userId,
        includeTeam,
        includeRelated,
        includeSystem
      );
      
      res.json({ data: activities });
    } catch (error: any) {
      console.error("Error fetching filtered activities:", error);
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
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const settingType = req.params.type;
      const userId = req.user.id;
      
      await storage.updateUserSettings(userId, settingType, req.body);
      res.json({ success: true, message: `${settingType} settings updated successfully` });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Outlook integration endpoints
  app.post("/api/outlook/connect", isAuthenticated, async (req, res) => {
    try {
      // This would redirect to Microsoft OAuth endpoint in a real implementation
      // For now, we're just showing how to save the tokens once received from OAuth flow
      
      const user = req.user as any;
      
      if (!user) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      
      // Simulating a successful authentication with Microsoft
      // This would normally happen via an OAuth redirect flow
      // We're just demonstrating the saving of tokens part
      res.json({
        success: true,
        message: "Please continue with Microsoft OAuth to connect your Outlook account",
        authUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=YOUR_CLIENT_ID&response_type=code&redirect_uri=YOUR_REDIRECT_URI&scope=openid profile email offline_access Mail.Read Mail.Send",
      });
    } catch (error: any) {
      console.error("Error starting Outlook connection:", error);
      res.status(500).json({ error: error.message });
    }
  });
  
  app.post("/api/outlook/save-connection", isAuthenticated, async (req, res) => {
    try {
      const { accessToken, refreshToken, email } = req.body;
      
      if (!accessToken || !refreshToken || !email) {
        return res.status(400).json({ error: "Missing required connection details" });
      }
      
      const user = req.user as any;
      
      if (!user) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      
      // Calculate token expiry (typically 1 hour for Microsoft Graph API tokens)
      const tokenExpiry = new Date();
      tokenExpiry.setHours(tokenExpiry.getHours() + 1);
      
      // Save the Outlook connection
      const outlookIntegration = await db.insert(outlookIntegrations).values({
        userId: user.id,
        accessToken,
        refreshToken,
        tokenExpiry,
        email,
      }).returning();
      
      // In a real implementation, we would also store the tokens securely
      // For production, encrypt sensitive data like tokens before storing them
      
      res.json({
        success: true,
        message: "Outlook account connected successfully",
        integration: {
          email,
          connected: true,
        },
      });
    } catch (error: any) {
      console.error("Error saving Outlook connection:", error);
      res.status(500).json({ error: error.message });
    }
  });
  
  app.get("/api/outlook/connection", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      
      if (!user) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      
      // Get the user's Outlook integration
      const [integration] = await db.select()
        .from(outlookIntegrations)
        .where(eq(outlookIntegrations.userId, user.id));
      
      if (!integration) {
        return res.json({
          connected: false,
        });
      }
      
      // Check if token needs refresh (would happen in a real implementation)
      // Here we would use the refresh token to get a new access token if needed
      
      res.json({
        connected: true,
        email: integration.email,
      });
    } catch (error: any) {
      console.error("Error checking Outlook connection:", error);
      res.status(500).json({ error: error.message });
    }
  });
  
  app.delete("/api/outlook/connection", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      
      if (!user) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      
      // Delete the Outlook integration
      await db.delete(outlookIntegrations)
        .where(eq(outlookIntegrations.userId, user.id));
      
      res.json({
        success: true,
        message: "Outlook account disconnected successfully",
      });
    } catch (error: any) {
      console.error("Error disconnecting Outlook account:", error);
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
  
  // Get sales representatives
  app.get("/api/users/sales-reps", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      
      // Users with sales role or lead management permission
      const salesReps = users.filter(user => 
        user.role === 'sales' || // Filter by sales role
        (user.permissions && Array.isArray(user.permissions) && 
         user.permissions.includes(PERMISSIONS.VIEW_LEADS)) // Or has lead management permission
      );
      
      // Map to ensure we only return safe fields
      const mappedSalesReps = salesReps.map(rep => ({
        id: rep.id,
        username: rep.username,
        fullName: rep.fullName,
        email: rep.email,
        role: rep.role
      }));
      
      res.json({ data: mappedSalesReps });
    } catch (error: any) {
      console.error("Error fetching sales representatives:", error);
      res.status(500).json({ error: "Failed to fetch sales representatives" });
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
      
      res.json({
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          username: updatedUser.username,
          fullName: updatedUser.fullName,
          role: updatedUser.role,
          permissions: updatedUser.permissions,
          visiblePages: updatedUser.visiblePages,
        }
      });
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
      
      res.json({
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          username: updatedUser.username,
          fullName: updatedUser.fullName,
          role: updatedUser.role,
          permissions: updatedUser.permissions,
          visiblePages: updatedUser.visiblePages,
        }
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Update user visible pages - Admin only
  app.patch("/api/users/:id/visible-pages", isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { visiblePages } = req.body;
      
      if (!Array.isArray(visiblePages)) {
        return res.status(400).json({ error: "visiblePages must be an array" });
      }
      
      const updatedUser = await storage.updateUserVisiblePages(userId, visiblePages);
      
      // Create activity for visible pages change
      if (req.user) {
        const currentUser = req.user as any;
        await storage.createActivity({
          userId: currentUser.id,
          type: "user",
          content: `Updated user ${updatedUser.username} visible pages`,
          relatedId: userId,
          relatedType: "user"
        });
      }
      
      res.json({
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          username: updatedUser.username,
          fullName: updatedUser.fullName,
          role: updatedUser.role,
          permissions: updatedUser.permissions,
          visiblePages: updatedUser.visiblePages,
        }
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Set a user's password (admin only)
  app.post("/api/users/set-password", isAdmin, async (req, res) => {
    try {
      const { userId, password } = req.body;
      
      if (!userId || !password) {
        return res.status(400).json({ error: "User ID and password are required" });
      }
      
      if (typeof userId !== 'number') {
        return res.status(400).json({ error: "User ID must be a number" });
      }
      
      if (typeof password !== 'string' || password.length < 8) {
        return res.status(400).json({ error: "Password must be at least 8 characters long" });
      }
      
      // Check if user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Hash the password and update in the database
      const hashedPassword = await hashPassword(password);
      
      // Update the user in the database
      await db.update(users)
        .set({ password: hashedPassword })
        .where(eq(users.id, userId));
      
      // Get the updated user
      const updatedUser = await storage.getUser(userId);
      
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found after update" });
      }
      
      // Create activity for password change
      if (req.user) {
        const currentUser = req.user as any;
        await storage.createActivity({
          userId: currentUser.id,
          type: "user",
          content: `Updated password for user ${user.username}`,
          relatedId: userId,
          relatedType: "user"
        });
      }
      
      res.json({
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          username: updatedUser.username,
          fullName: updatedUser.fullName,
          role: updatedUser.role,
          permissions: updatedUser.permissions,
          visiblePages: updatedUser.visiblePages,
        }
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Data management endpoints - Admin only
  app.post("/api/data/clear-example-data", isAdmin, async (req, res) => {
    try {
      await storage.clearExampleData();
      res.json({ success: true, message: "Example data cleared successfully" });
    } catch (error: any) {
      console.error("Error clearing example data:", error);
      res.status(500).json({ error: error.message });
    }
  });
  
  app.post("/api/data/clear-all-products", isAdmin, async (req, res) => {
    try {
      await storage.clearAllProducts();
      res.json({ success: true, message: "All products have been deleted successfully" });
    } catch (error: any) {
      console.error("Error clearing products:", error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // Sales team management endpoints
  // Get all sales team members - Admin only
  // Organizations endpoints
  app.get("/api/organizations", async (req, res) => {
    try {
      // Check if the user has permission to manage organizations
      const isAdmin = (req.user as any)?.role === ROLES.ADMIN;
      const canManageOrganizations = hasPermission(
        (req.user as any)?.role || ROLES.VIEWER,
        (req.user as any)?.permissions,
        PERMISSIONS.MANAGE_ORGANIZATIONS
      );
      
      let organizations: Organization[] = [];
      
      if (isAdmin || canManageOrganizations) {
        // Admin and managers see all organizations
        organizations = await storage.getOrganizations();
      } else {
        // Regular users only see organizations assigned to them
        const salesTeamMembers = await storage.getSalesTeamMembers();
        const userSalesTeamMember = salesTeamMembers.find(member => member.email === (req.user as any)?.email);
        
        if (userSalesTeamMember) {
          // Get organizations where this user is the assigned sales rep
          organizations = await storage.getOrganizationsBySalesRep(userSalesTeamMember.id);
        }
        // If user is not a sales team member, the organizations array remains empty
      }
      
      res.json({ data: organizations });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  app.get("/api/organizations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid organization ID" });
      }
      
      const organization = await storage.getOrganizationById(id);
      if (!organization) {
        return res.status(404).json({ error: "Organization not found" });
      }
      
      res.json({ data: organization });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  app.post("/api/organizations", hasRequiredPermission(PERMISSIONS.MANAGE_USERS), async (req, res) => {
    try {
      const validatedData = insertOrganizationSchema.parse(req.body);
      const newOrganization = await storage.createOrganization(validatedData);
      
      // Create activity for the new organization
      await storage.createActivity({
        userId: req.user?.id || 1,
        type: "organization",
        content: `New organization ${newOrganization.name} created`,
        relatedId: newOrganization.id,
        relatedType: "organization"
      });
      
      res.status(201).json({ data: newOrganization });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  });
  
  app.patch("/api/organizations/:id", hasRequiredPermission(PERMISSIONS.MANAGE_USERS), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid organization ID" });
      }
      
      const organization = await storage.getOrganizationById(id);
      if (!organization) {
        return res.status(404).json({ error: "Organization not found" });
      }
      
      const validatedData = insertOrganizationSchema.partial().parse(req.body);
      const updatedOrganization = await storage.updateOrganization(id, validatedData);
      
      // Create activity for the updated organization
      await storage.createActivity({
        userId: req.user?.id || 1,
        type: "organization",
        content: `Organization ${updatedOrganization.name} updated`,
        relatedId: id,
        relatedType: "organization"
      });
      
      res.json({ data: updatedOrganization });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  });
  
  app.delete("/api/organizations/:id", hasRequiredPermission(PERMISSIONS.MANAGE_USERS), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid organization ID" });
      }
      
      const organization = await storage.getOrganizationById(id);
      if (!organization) {
        return res.status(404).json({ error: "Organization not found" });
      }
      
      await storage.deleteOrganization(id);
      
      // Create activity for the deleted organization
      await storage.createActivity({
        userId: req.user?.id || 1,
        type: "organization",
        content: `Organization ${organization.name} deleted`,
        relatedId: id,
        relatedType: "organization"
      });
      
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  app.get("/api/admin/sales-team", hasRequiredPermission(PERMISSIONS.MANAGE_USERS), async (req, res) => {
    try {
      const members = await storage.getSalesTeamMembers();
      res.json({ data: members });
    } catch (error: any) {
      console.error("Error fetching sales team members:", error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // Get sales team performance metrics - Admin only
  app.get("/api/admin/sales-team/performance", hasRequiredPermission(PERMISSIONS.MANAGE_USERS), async (req, res) => {
    try {
      const performance = await storage.getSalesTeamPerformance();
      res.json({ data: performance });
    } catch (error: any) {
      console.error("Error fetching sales team performance:", error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // Create new sales team member - Admin only
  app.post("/api/admin/sales-team", hasRequiredPermission(PERMISSIONS.MANAGE_USERS), async (req, res) => {
    try {
      const validatedData = insertSalesTeamMemberSchema.parse(req.body);
      
      // Hash the password if creating a user account
      if (validatedData.createUserAccount && validatedData.password) {
        const hashedPassword = await hashPassword(validatedData.password);
        validatedData.password = hashedPassword;
      }
      
      const newMember = await storage.createSalesTeamMember(validatedData);
      
      // Create activity for the new team member
      await storage.createActivity({
        userId: req.user?.id || 1,
        type: "team",
        content: `New sales team member ${newMember.name} added`,
        relatedId: newMember.id,
        relatedType: "sales_team"
      });
      
      res.status(201).json({ data: newMember });
    } catch (error: any) {
      console.error("Error creating sales team member:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  });
  
  // Update sales team member - Admin only
  app.patch("/api/admin/sales-team/:id", hasRequiredPermission(PERMISSIONS.MANAGE_USERS), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid team member ID" });
      }
      
      const member = await storage.getSalesTeamMemberById(id);
      if (!member) {
        return res.status(404).json({ error: "Team member not found" });
      }
      
      // Make a copy of the request body so we can modify it
      const updateData = { ...req.body };
      
      // Hash the password if it's being updated
      if (updateData.password) {
        updateData.password = await hashPassword(updateData.password);
      }
      
      const updatedMember = await storage.updateSalesTeamMember(id, updateData);
      
      // Create activity for the updated team member
      await storage.createActivity({
        userId: req.user?.id || 1,
        type: "team",
        content: `Sales team member ${updatedMember.name} updated`,
        relatedId: updatedMember.id,
        relatedType: "sales_team"
      });
      
      res.json({ data: updatedMember });
    } catch (error: any) {
      console.error("Error updating sales team member:", error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // Delete sales team member - Admin only
  app.delete("/api/admin/sales-team/:id", hasRequiredPermission(PERMISSIONS.MANAGE_USERS), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid team member ID" });
      }
      
      const member = await storage.getSalesTeamMemberById(id);
      if (!member) {
        return res.status(404).json({ error: "Team member not found" });
      }
      
      await storage.deleteSalesTeamMember(id);
      
      // Create activity for deleted team member
      await storage.createActivity({
        userId: req.user?.id || 1,
        type: "team",
        content: `Sales team member ${member.name} deleted`,
        relatedId: id,
        relatedType: "sales_team"
      });
      
      res.status(200).json({ success: true });
    } catch (error: any) {
      console.error("Error deleting sales team member:", error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // Get unassigned leads - Admin only
  app.get("/api/admin/leads/unassigned", hasRequiredPermission(PERMISSIONS.MANAGE_USERS), async (req, res) => {
    try {
      const unassignedLeads = await storage.getUnassignedLeads();
      res.json({ data: unassignedLeads });
    } catch (error: any) {
      console.error("Error fetching unassigned leads:", error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // Get lead assignments - Admin only
  app.get("/api/admin/leads/assignments", hasRequiredPermission(PERMISSIONS.MANAGE_USERS), async (req, res) => {
    try {
      const assignments = await storage.getLeadAssignments();
      res.json({ data: assignments });
    } catch (error: any) {
      console.error("Error fetching lead assignments:", error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // Assign lead to sales rep - Admin only
  app.post("/api/admin/leads/assign", hasRequiredPermission(PERMISSIONS.MANAGE_USERS), async (req, res) => {
    try {
      const { leadId, salesRepId } = req.body;
      
      if (!leadId || !salesRepId) {
        return res.status(400).json({ error: "Lead ID and Sales Rep ID are required" });
      }
      
      const lead = await storage.getLeadById(leadId);
      if (!lead) {
        return res.status(404).json({ error: "Lead not found" });
      }
      
      const salesRep = await storage.getSalesTeamMemberById(salesRepId);
      if (!salesRep) {
        return res.status(404).json({ error: "Sales rep not found" });
      }
      
      const updatedLead = await storage.assignLeadToSalesRep(leadId, salesRepId);
      
      // Create activity for lead assignment
      await storage.createActivity({
        userId: req.user?.id || 1,
        type: "lead",
        content: `Lead ${lead.name} assigned to ${salesRep.name}`,
        relatedId: leadId,
        relatedType: "lead"
      });
      
      res.json({ data: updatedLead });
    } catch (error: any) {
      console.error("Error assigning lead:", error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // Products API endpoints
  app.get("/api/products", async (req, res) => {
    try {
      const productList = await storage.getProducts();
      res.json({ data: productList });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  app.get("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid product ID" });
      }
      
      const product = await storage.getProductById(id);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      res.json({ data: product });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  app.get("/api/products/sku/:sku", async (req, res) => {
    try {
      const sku = req.params.sku;
      const product = await storage.getProductBySku(sku);
      
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      res.json({ data: product });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  app.get("/api/products/sport/:sport", async (req, res) => {
    try {
      const sport = req.params.sport;
      const products = await storage.getProductsBySport(sport);
      res.json({ data: products });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  app.get("/api/products/category/:category", async (req, res) => {
    try {
      const category = req.params.category;
      const products = await storage.getProductsByCategory(category);
      res.json({ data: products });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  app.post("/api/products", hasRequiredPermission(PERMISSIONS.MANAGE_CATALOG), async (req, res) => {
    try {
      const validatedData = insertProductSchema.parse(req.body);
      const newProduct = await storage.createProduct(validatedData);
      
      // Create activity for the new product
      await storage.createActivity({
        userId: req.user?.id || 1,
        type: "product",
        content: `New product ${newProduct.name} added`,
        relatedId: newProduct.id,
        relatedType: "product"
      });
      
      res.status(201).json({ data: newProduct });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  });
  
  app.put("/api/products/:id", hasRequiredPermission(PERMISSIONS.MANAGE_CATALOG), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid product ID" });
      }
      
      const product = await storage.getProductById(id);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      const validatedData = insertProductSchema.partial().parse(req.body);
      const updatedProduct = await storage.updateProduct(id, validatedData);
      
      // Create activity for the updated product
      await storage.createActivity({
        userId: req.user?.id || 1,
        type: "product",
        content: `Product ${updatedProduct.name} was updated`,
        relatedId: id,
        relatedType: "product"
      });
      
      res.json({ data: updatedProduct });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  });
  
  app.delete("/api/products/:id", hasRequiredPermission(PERMISSIONS.MANAGE_CATALOG), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid product ID" });
      }
      
      const product = await storage.getProductById(id);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      // Delete the product
      await storage.deleteProduct(id);
      
      // Create activity for the deleted product
      await storage.createActivity({
        userId: req.user?.id || 1,
        type: "product",
        content: `Product ${product.name} was deleted`,
        relatedId: id,
        relatedType: "product"
      });
      
      res.status(200).json({ 
        success: true,
        message: "Product deleted successfully"
      });
    } catch (error: any) {
      console.error("Error deleting product:", error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // Import products from CSV
  app.post("/api/products/import-csv", hasRequiredPermission(PERMISSIONS.MANAGE_CATALOG), async (req, res) => {
    try {
      const { csvData } = req.body;
      
      if (!csvData) {
        return res.status(400).json({ error: "CSV data is required" });
      }

      // Parse CSV data
      const lines = csvData.trim().split('\n');
      const headers = lines[0].split(',').map((header: string) => header.trim());
      
      // Validate required headers
      const requiredFields = ['Item SKU', 'Item Name', 'Sport', 'Category', 'Item', 'Fabric Options', 'COGS', 'Wholesale Price'];
      const missingFields = requiredFields.filter(field => !headers.includes(field));
      
      if (missingFields.length > 0) {
        return res.status(400).json({ 
          error: `CSV missing required fields: ${missingFields.join(', ')}` 
        });
      }
      
      // Process each product line
      const products = [];
      const errors = [];
      
      for (let i = 1; i < lines.length; i++) {
        try {
          // Handle cases where a field might contain commas within quotes
          const regex = /(".*?"|[^",\s]+)(?=\s*,|\s*$)/g;
          const matches = lines[i].match(regex);
          
          if (!matches) continue;
          
          const values = matches.map((val: string) => {
            // Remove quotes if present
            return val.startsWith('"') && val.endsWith('"') 
              ? val.slice(1, -1) 
              : val;
          });
          
          // Create a product object from CSV line
          const productData = {
            sku: values[headers.indexOf('Item SKU')] || '',
            name: values[headers.indexOf('Item Name')] || '',
            sport: values[headers.indexOf('Sport')] || '',
            category: values[headers.indexOf('Category')] || '',
            item: values[headers.indexOf('Item')] || '',
            fabricOptions: values[headers.indexOf('Fabric Options')] || '',
            cogs: values[headers.indexOf('COGS')] || '$0.00',
            wholesalePrice: values[headers.indexOf('Wholesale Price')] || '$0.00',
            imageUrl: values[headers.indexOf('Image Attachments')] || null,
            lineItemManagement: values[headers.indexOf('Line Item Management')] || null
          };
          
          // Validate SKU and Name are present
          if (!productData.sku || !productData.name) {
            errors.push(`Line ${i + 1}: Missing SKU or Name`);
            continue;
          }
          
          // Check if product already exists by SKU
          const existingProduct = await storage.getProductBySku(productData.sku);
          
          if (existingProduct) {
            // Update existing product
            await storage.updateProduct(existingProduct.id, productData);
            products.push({ ...productData, id: existingProduct.id, updated: true });
          } else {
            // Create new product
            const parsedProduct = insertProductSchema.parse(productData);
            const newProduct = await storage.createProduct(parsedProduct);
            products.push({ ...newProduct, created: true });
          }
        } catch (error: any) {
          errors.push(`Line ${i + 1}: ${error.message}`);
        }
      }
      
      // Create activity for the import
      await storage.createActivity({
        userId: req.user?.id || 1,
        type: "product",
        content: `Imported ${products.length} products from CSV`,
        relatedType: "product"
      });
      
      res.status(200).json({
        success: true,
        message: `Processed ${lines.length - 1} products`,
        imported: products.length,
        products,
        errors: errors.length > 0 ? errors : null
      });
    } catch (error: any) {
      console.error("Error importing products from CSV:", error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // Fabric Options API endpoints
  app.get("/api/fabric-options", async (req, res) => {
    try {
      const options = await storage.getFabricOptions();
      res.json({ data: options });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  app.get("/api/fabric-options/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid fabric option ID" });
      }
      
      const option = await storage.getFabricOptionById(id);
      if (!option) {
        return res.status(404).json({ error: "Fabric option not found" });
      }
      
      res.json({ data: option });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  app.post("/api/fabric-options", hasRequiredPermission(PERMISSIONS.MANAGE_CATALOG), async (req, res) => {
    try {
      const validatedData = insertFabricOptionSchema.parse(req.body);
      const newOption = await storage.createFabricOption(validatedData);
      
      res.status(201).json({ data: newOption });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  });
  
  app.put("/api/fabric-options/:id", hasRequiredPermission(PERMISSIONS.MANAGE_CATALOG), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid fabric option ID" });
      }
      
      const option = await storage.getFabricOptionById(id);
      if (!option) {
        return res.status(404).json({ error: "Fabric option not found" });
      }
      
      const validatedData = insertFabricOptionSchema.partial().parse(req.body);
      const updatedOption = await storage.updateFabricOption(id, validatedData);
      
      res.json({ data: updatedOption });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  });
  
  app.delete("/api/fabric-options/:id", hasRequiredPermission(PERMISSIONS.MANAGE_CATALOG), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid fabric option ID" });
      }
      
      const option = await storage.getFabricOptionById(id);
      if (!option) {
        return res.status(404).json({ error: "Fabric option not found" });
      }
      
      await storage.deleteFabricOption(id);
      
      res.status(200).json({ 
        success: true,
        message: "Fabric option deleted successfully"
      });
    } catch (error: any) {
      console.error("Error deleting fabric option:", error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // Fabric Cuts API endpoints
  app.get("/api/fabric-cuts", async (req, res) => {
    try {
      const cuts = await storage.getFabricCuts();
      res.json({ data: cuts });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  app.get("/api/fabric-cuts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid fabric cut ID" });
      }
      
      const cut = await storage.getFabricCutById(id);
      if (!cut) {
        return res.status(404).json({ error: "Fabric cut not found" });
      }
      
      res.json({ data: cut });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  app.post("/api/fabric-cuts", hasRequiredPermission(PERMISSIONS.MANAGE_CATALOG), async (req, res) => {
    try {
      const validatedData = insertFabricCutSchema.parse(req.body);
      const newCut = await storage.createFabricCut(validatedData);
      
      res.status(201).json({ data: newCut });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  });
  
  app.put("/api/fabric-cuts/:id", hasRequiredPermission(PERMISSIONS.MANAGE_CATALOG), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid fabric cut ID" });
      }
      
      const cut = await storage.getFabricCutById(id);
      if (!cut) {
        return res.status(404).json({ error: "Fabric cut not found" });
      }
      
      const validatedData = insertFabricCutSchema.partial().parse(req.body);
      const updatedCut = await storage.updateFabricCut(id, validatedData);
      
      res.json({ data: updatedCut });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  });
  
  app.delete("/api/fabric-cuts/:id", hasRequiredPermission(PERMISSIONS.MANAGE_CATALOG), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid fabric cut ID" });
      }
      
      const cut = await storage.getFabricCutById(id);
      if (!cut) {
        return res.status(404).json({ error: "Fabric cut not found" });
      }
      
      await storage.deleteFabricCut(id);
      
      res.status(200).json({ 
        success: true,
        message: "Fabric cut deleted successfully"
      });
    } catch (error: any) {
      console.error("Error deleting fabric cut:", error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // Customization Options API endpoints
  app.get("/api/products/:productId/customization-options", async (req, res) => {
    try {
      const productId = parseInt(req.params.productId);
      if (isNaN(productId)) {
        return res.status(400).json({ error: "Invalid product ID" });
      }
      
      const options = await storage.getCustomizationOptions(productId);
      res.json({ data: options });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  app.get("/api/customization-options/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid customization option ID" });
      }
      
      const option = await storage.getCustomizationOptionById(id);
      if (!option) {
        return res.status(404).json({ error: "Customization option not found" });
      }
      
      res.json({ data: option });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  app.post("/api/customization-options", hasRequiredPermission(PERMISSIONS.MANAGE_CATALOG), async (req, res) => {
    try {
      const validatedData = insertCustomizationOptionSchema.parse(req.body);
      const newOption = await storage.createCustomizationOption(validatedData);
      
      res.status(201).json({ data: newOption });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  });
  
  app.put("/api/customization-options/:id", hasRequiredPermission(PERMISSIONS.MANAGE_CATALOG), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid customization option ID" });
      }
      
      const option = await storage.getCustomizationOptionById(id);
      if (!option) {
        return res.status(404).json({ error: "Customization option not found" });
      }
      
      const validatedData = insertCustomizationOptionSchema.partial().parse(req.body);
      const updatedOption = await storage.updateCustomizationOption(id, validatedData);
      
      res.json({ data: updatedOption });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  });
  
  app.delete("/api/customization-options/:id", hasRequiredPermission(PERMISSIONS.MANAGE_CATALOG), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid customization option ID" });
      }
      
      const option = await storage.getCustomizationOptionById(id);
      if (!option) {
        return res.status(404).json({ error: "Customization option not found" });
      }
      
      await storage.deleteCustomizationOption(id);
      
      res.status(200).json({ 
        success: true,
        message: "Customization option deleted successfully"
      });
    } catch (error: any) {
      console.error("Error deleting customization option:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Feedback system endpoints
  // Get all feedback with optional filters
  app.get("/api/feedback", async (req, res) => {
    try {
      const options: { status?: string; type?: string; limit?: number } = {};
      
      if (req.query.status) {
        options.status = req.query.status as string;
      }
      
      if (req.query.type) {
        options.type = req.query.type as string;
      }
      
      if (req.query.limit) {
        options.limit = parseInt(req.query.limit as string);
      }
      
      const feedbackItems = await storage.getFeedback(options);
      res.json({ data: feedbackItems });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Get feedback by ID
  app.get("/api/feedback/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid feedback ID" });
      }
      
      const feedbackItem = await storage.getFeedbackById(id);
      
      if (!feedbackItem) {
        return res.status(404).json({ error: "Feedback not found" });
      }
      
      res.json({ data: feedbackItem });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Create new feedback
  app.post("/api/feedback", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      // Set the user ID from the authenticated user
      req.body.userId = req.user.id;
      
      const validatedData = insertFeedbackSchema.parse(req.body);
      const newFeedback = await storage.createFeedback(validatedData);
      
      // Create activity for the new feedback
      await storage.createActivity({
        userId: req.user.id,
        type: "feedback",
        content: `New ${validatedData.type}: ${validatedData.title}`,
        relatedId: newFeedback.id,
        relatedType: "feedback"
      });
      
      res.status(201).json({ data: newFeedback });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  });
  
  // Update feedback
  app.patch("/api/feedback/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid feedback ID" });
      }
      
      const feedbackItem = await storage.getFeedbackById(id);
      
      if (!feedbackItem) {
        return res.status(404).json({ error: "Feedback not found" });
      }
      
      // Check if user is authorized (admin or the creator)
      if (req.user?.id !== feedbackItem.userId && req.user?.role !== ROLES.ADMIN) {
        return res.status(403).json({ error: "Not authorized to update this feedback" });
      }
      
      const updatedFeedback = await storage.updateFeedback(id, req.body);
      
      // Create activity for the updated feedback
      await storage.createActivity({
        userId: req.user?.id || 1,
        type: "feedback",
        content: `Updated feedback: ${updatedFeedback.title}`,
        relatedId: updatedFeedback.id,
        relatedType: "feedback"
      });
      
      res.json({ data: updatedFeedback });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Delete feedback
  app.delete("/api/feedback/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid feedback ID" });
      }
      
      const feedbackItem = await storage.getFeedbackById(id);
      
      if (!feedbackItem) {
        return res.status(404).json({ error: "Feedback not found" });
      }
      
      // Check if user is authorized (admin or the creator)
      if (req.user?.id !== feedbackItem.userId && req.user?.role !== ROLES.ADMIN) {
        return res.status(403).json({ error: "Not authorized to delete this feedback" });
      }
      
      await storage.deleteFeedback(id);
      
      // Create activity for the deleted feedback
      await storage.createActivity({
        userId: req.user?.id || 1,
        type: "feedback",
        content: `Deleted feedback: ${feedbackItem.title}`,
        relatedId: id,
        relatedType: "feedback"
      });
      
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Get feedback by user
  app.get("/api/users/:userId/feedback", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      
      // Check if user is authorized (admin or the user themselves)
      if (req.user?.id !== userId && req.user?.role !== ROLES.ADMIN) {
        return res.status(403).json({ error: "Not authorized to view this user's feedback" });
      }
      
      const feedbackItems = await storage.getFeedbackByUser(userId);
      res.json({ data: feedbackItems });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Get feedback comments
  app.get("/api/feedback/:id/comments", async (req, res) => {
    try {
      const feedbackId = parseInt(req.params.id);
      
      if (isNaN(feedbackId)) {
        return res.status(400).json({ error: "Invalid feedback ID" });
      }
      
      const comments = await storage.getFeedbackComments(feedbackId);
      res.json({ data: comments });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Add comment to feedback
  app.post("/api/feedback/:id/comments", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const feedbackId = parseInt(req.params.id);
      
      if (isNaN(feedbackId)) {
        return res.status(400).json({ error: "Invalid feedback ID" });
      }
      
      const feedbackItem = await storage.getFeedbackById(feedbackId);
      
      if (!feedbackItem) {
        return res.status(404).json({ error: "Feedback not found" });
      }
      
      // Set the user ID from the authenticated user
      req.body.userId = req.user.id;
      req.body.feedbackId = feedbackId;
      
      const validatedData = insertFeedbackCommentSchema.parse(req.body);
      const newComment = await storage.addFeedbackComment(validatedData);
      
      // Create activity for the new comment
      await storage.createActivity({
        userId: req.user.id,
        type: "feedback",
        content: `Commented on feedback: ${feedbackItem.title}`,
        relatedId: feedbackId,
        relatedType: "feedback"
      });
      
      res.status(201).json({ data: newComment });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  });
  
  // Delete comment
  app.delete("/api/feedback/comments/:id", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const commentId = parseInt(req.params.id);
      
      if (isNaN(commentId)) {
        return res.status(400).json({ error: "Invalid comment ID" });
      }
      
      await storage.deleteFeedbackComment(commentId);
      
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Vote on feedback
  app.post("/api/feedback/:id/vote", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const feedbackId = parseInt(req.params.id);
      
      if (isNaN(feedbackId)) {
        return res.status(400).json({ error: "Invalid feedback ID" });
      }
      
      const feedbackItem = await storage.getFeedbackById(feedbackId);
      
      if (!feedbackItem) {
        return res.status(404).json({ error: "Feedback not found" });
      }
      
      // Set the user ID from the authenticated user
      req.body.userId = req.user.id;
      req.body.feedbackId = feedbackId;
      
      const validatedData = insertFeedbackVoteSchema.parse(req.body);
      const vote = await storage.addFeedbackVote(validatedData);
      
      // Get updated feedback with new vote count
      const updatedFeedback = await storage.getFeedbackById(feedbackId);
      
      res.status(201).json({ 
        data: vote,
        feedback: updatedFeedback
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  });
  
  // Remove vote from feedback
  app.delete("/api/feedback/:id/vote", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const feedbackId = parseInt(req.params.id);
      
      if (isNaN(feedbackId)) {
        return res.status(400).json({ error: "Invalid feedback ID" });
      }
      
      await storage.removeFeedbackVote(req.user.id, feedbackId);
      
      // Get updated feedback with new vote count
      const updatedFeedback = await storage.getFeedbackById(feedbackId);
      
      res.json({ 
        success: true,
        feedback: updatedFeedback
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Design Projects API
  app.get("/api/designs", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Authentication required");
      }
      
      let projects;
      
      if (req.query.filter === 'assigned' && req.user.role === 'designer') {
        // Designers get their assigned projects
        projects = await storage.getDesignProjectsByDesignerId(req.user.id);
      } else if (req.query.filter === 'unassigned' && req.user.role === 'designer') {
        // Designers can also see unassigned projects they can claim
        projects = await storage.getUnassignedDesignProjects();
      } else if (req.user.role === 'admin') {
        // Admins get all projects
        projects = await storage.getDesignProjects();
      } else {
        // Regular users get projects for their orders
        projects = await storage.getDesignProjectsByUserId(req.user.id);
      }
      
      res.json(projects);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  app.get("/api/designs/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Authentication required");
      }
      
      const projectId = parseInt(req.params.id);
      const project = await storage.getDesignProject(projectId);
      
      if (!project) {
        return res.status(404).json({ error: "Design project not found" });
      }
      
      // Check authorization (only admin, assigned designer, or customer who owns the order)
      const isAdmin = req.user.role === 'admin';
      const isDesigner = req.user.role === 'designer' && project.designerId === req.user.id;
      const isCustomer = await storage.getOrderById(project.orderId).then(order => order?.userId === req.user.id);
      
      if (!isAdmin && !isDesigner && !isCustomer) {
        return res.status(403).json({ error: "You don't have permission to view this design" });
      }
      
      // Get the versions for this project
      const versions = await storage.getDesignVersions(projectId);
      
      res.json({
        project,
        versions
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  app.post("/api/designs", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Authentication required");
      }
      
      // Verify if user has permission to create a design project
      if (req.user.role !== 'admin' && req.user.role !== 'sales') {
        return res.status(403).json({ error: "You don't have permission to create design projects" });
      }
      
      const newProject = await storage.createDesignProject({
        ...req.body,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      res.status(201).json(newProject);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  app.put("/api/designs/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Authentication required");
      }
      
      const projectId = parseInt(req.params.id);
      const project = await storage.getDesignProject(projectId);
      
      if (!project) {
        return res.status(404).json({ error: "Design project not found" });
      }
      
      // Check authorization (only admin or assigned designer can update)
      const isAdmin = req.user.role === 'admin';
      const isDesigner = req.user.role === 'designer' && project.designerId === req.user.id;
      
      if (!isAdmin && !isDesigner) {
        return res.status(403).json({ error: "You don't have permission to update this design" });
      }
      
      const updatedProject = await storage.updateDesignProject(projectId, {
        ...req.body,
        updatedAt: new Date()
      });
      
      res.json(updatedProject);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  app.delete("/api/designs/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Authentication required");
      }
      
      // Only admin can delete design projects
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: "Only administrators can delete design projects" });
      }
      
      const projectId = parseInt(req.params.id);
      const project = await storage.getDesignProject(projectId);
      
      if (!project) {
        return res.status(404).json({ error: "Design project not found" });
      }
      
      await storage.deleteDesignProject(projectId);
      
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Design project assignment
  app.post("/api/designs/:id/assign", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Authentication required");
      }
      
      const projectId = parseInt(req.params.id);
      const project = await storage.getDesignProject(projectId);
      
      if (!project) {
        return res.status(404).json({ error: "Design project not found" });
      }
      
      // Check authorization (admin can assign to anyone, designers can self-assign)
      const isAdmin = req.user.role === 'admin';
      const isSelfAssigning = req.user.role === 'designer' && req.body.designerId === req.user.id;
      
      if (!isAdmin && !isSelfAssigning) {
        return res.status(403).json({ error: "You don't have permission to assign this design" });
      }
      
      // If designerId is not provided, use the current user's ID (for self-assignment)
      const designerId = req.body.designerId || req.user.id;
      const designerName = req.body.designerName || req.user.fullName;
      
      const updatedProject = await storage.assignDesignProject(projectId, designerId, designerName);
      
      res.json(updatedProject);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Design Versions API
  app.post("/api/designs/:id/versions", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Authentication required");
      }
      
      const projectId = parseInt(req.params.id);
      const project = await storage.getDesignProject(projectId);
      
      if (!project) {
        return res.status(404).json({ error: "Design project not found" });
      }
      
      // Only assigned designer can submit versions
      if (req.user.role !== 'designer' || project.designerId !== req.user.id) {
        return res.status(403).json({ error: "Only the assigned designer can submit versions" });
      }
      
      const newVersion = await storage.createDesignVersion({
        projectId,
        designUrl: req.body.designUrl,
        notes: req.body.notes,
        status: 'pending_review',
        createdAt: new Date()
      });
      
      res.status(201).json(newVersion);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Design Version Approval/Rejection
  app.put("/api/designs/:projectId/versions/:versionId", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Authentication required");
      }
      
      const projectId = parseInt(req.params.projectId);
      const versionId = parseInt(req.params.versionId);
      
      const project = await storage.getDesignProject(projectId);
      if (!project) {
        return res.status(404).json({ error: "Design project not found" });
      }
      
      const version = await storage.getDesignVersion(versionId);
      if (!version) {
        return res.status(404).json({ error: "Design version not found" });
      }
      
      // Check if user is authorized to approve/reject (admin or customer who owns the order)
      const isAdmin = req.user.role === 'admin';
      const isCustomer = await storage.getOrderById(project.orderId).then(order => order?.userId === req.user.id);
      
      if (!isAdmin && !isCustomer) {
        return res.status(403).json({ error: "You don't have permission to approve or reject versions" });
      }
      
      // Update the version status
      const updatedVersion = await storage.updateDesignVersion(versionId, {
        status: req.body.status // 'approved' or 'rejected'
      });
      
      // If approved, update the project to reflect the approved version
      if (req.body.status === 'approved') {
        await storage.updateDesignProject(projectId, {
          status: 'approved',
          approvedVersion: version.versionNumber
        });
      }
      
      // If rejected, create a revision request
      if (req.body.status === 'rejected' && req.body.feedback) {
        await storage.createDesignRevision({
          designId: projectId,
          description: req.body.feedback,
          requestedBy: req.user.id,
          requestedByName: req.user.fullName,
          requestedAt: new Date(),
          status: 'pending'
        });
      }
      
      res.json(updatedVersion);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Design Messages API
  app.get("/api/designs/:id/messages", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Authentication required");
      }
      
      const designId = parseInt(req.params.id);
      const project = await storage.getDesignProject(designId);
      
      if (!project) {
        return res.status(404).json({ error: "Design project not found" });
      }
      
      // Check authorization
      const isAdmin = req.user.role === 'admin';
      const isDesigner = req.user.role === 'designer' && project.designerId === req.user.id;
      const isCustomer = await storage.getOrderById(project.orderId).then(order => order?.userId === req.user.id);
      
      if (!isAdmin && !isDesigner && !isCustomer) {
        return res.status(403).json({ error: "You don't have permission to view messages for this design" });
      }
      
      const messages = await storage.getDesignMessages(designId);
      
      res.json(messages);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  app.post("/api/designs/:id/messages", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Authentication required");
      }
      
      const designId = parseInt(req.params.id);
      const project = await storage.getDesignProject(designId);
      
      if (!project) {
        return res.status(404).json({ error: "Design project not found" });
      }
      
      // Check authorization
      const isAdmin = req.user.role === 'admin';
      const isDesigner = req.user.role === 'designer' && project.designerId === req.user.id;
      const isCustomer = await storage.getOrderById(project.orderId).then(order => order?.userId === req.user.id);
      
      if (!isAdmin && !isDesigner && !isCustomer) {
        return res.status(403).json({ error: "You don't have permission to send messages for this design" });
      }
      
      const newMessage = await storage.createDesignMessage({
        designId,
        message: req.body.message,
        senderId: req.user.id,
        senderName: req.user.fullName,
        senderRole: req.user.role,
        attachments: req.body.attachments || [],
        sentAt: new Date()
      });
      
      res.status(201).json(newMessage);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Add feedback to a design version
  app.post("/api/designs/versions/:versionId/feedback", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Authentication required");
      }
      
      const versionId = parseInt(req.params.versionId);
      const { feedback, status } = req.body;
      
      if (!feedback || !status) {
        return res.status(400).json({ error: "Feedback and status are required" });
      }
      
      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: "Status must be 'approved' or 'rejected'" });
      }
      
      const version = await storage.getDesignVersion(versionId);
      if (!version) {
        return res.status(404).json({ error: "Design version not found" });
      }
      
      const project = await storage.getDesignProject(version.projectId);
      if (!project) {
        return res.status(404).json({ error: "Design project not found" });
      }
      
      // Check authorization
      const isAdmin = req.user.role === 'admin';
      const isCustomer = await storage.getOrderById(project.orderId).then(order => order?.userId === req.user.id);
      
      if (!isAdmin && !isCustomer) {
        return res.status(403).json({ error: "You don't have permission to provide feedback on this design" });
      }
      
      // Update the version with feedback
      const updatedVersion = await storage.updateDesignVersion(versionId, {
        feedback,
        status
      });
      
      // Update the project status based on the feedback
      if (status === 'approved') {
        await storage.updateDesignProject(version.projectId, {
          status: 'approved',
          approvedVersion: version.versionNumber,
          feedback
        });
      } else {
        await storage.updateDesignProject(version.projectId, {
          status: 'in_progress',
          feedback
        });
      }
      
      res.status(200).json(updatedVersion);
    } catch (error: any) {
      console.error("Error providing feedback:", error);
      res.status(500).json({ error: "Failed to provide feedback" });
    }
  });

  // Events API Endpoints
  app.get("/api/events", async (req, res) => {
    try {
      // Check if the user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const events = await storage.getEvents();
      res.json({ data: events });
    } catch (error: any) {
      console.error("Error fetching events:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/events/:id", async (req, res) => {
    try {
      // Check if the user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid event ID" });
      }
      
      const event = await storage.getEventById(id);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      
      res.json({ data: event });
    } catch (error: any) {
      console.error("Error fetching event:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/events", async (req, res) => {
    try {
      // Check if the user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const user = req.user as User;
      
      // Validate the event data
      const validatedData = insertEventSchema.parse({
        ...req.body,
        createdById: user.id  // Add the current user as the creator
      });
      
      // Create the event
      const newEvent = await storage.createEvent(validatedData);
      
      // Create an activity record for this event
      await storage.createActivity({
        userId: user.id,
        type: "event",
        content: `New event "${newEvent.title}" created`,
        relatedId: newEvent.id,
        relatedType: "event"
      });
      
      res.status(201).json({ data: newEvent });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        console.error("Error creating event:", error);
        res.status(500).json({ error: error.message });
      }
    }
  });

  app.put("/api/events/:id", async (req, res) => {
    try {
      // Check if the user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid event ID" });
      }
      
      // Check if the event exists
      const event = await storage.getEventById(id);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      
      const user = req.user as User;
      
      // Update the event
      const updatedEvent = await storage.updateEvent(id, req.body);
      
      // Create an activity record for this update
      await storage.createActivity({
        userId: user.id,
        type: "event",
        content: `Event "${updatedEvent.title}" updated`,
        relatedId: updatedEvent.id,
        relatedType: "event"
      });
      
      res.json({ data: updatedEvent });
    } catch (error: any) {
      console.error("Error updating event:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/events/:id", async (req, res) => {
    try {
      // Check if the user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid event ID" });
      }
      
      // Check if the event exists
      const event = await storage.getEventById(id);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      
      const user = req.user as User;
      
      // Delete the event
      await storage.deleteEvent(id);
      
      // Create an activity record for this deletion
      await storage.createActivity({
        userId: user.id,
        type: "event",
        content: `Event "${event.title}" deleted`,
        relatedId: id,
        relatedType: "event"
      });
      
      res.json({ success: true, message: "Event deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting event:", error);
      res.status(500).json({ error: error.message });
    }
  });

  return httpServer;
}
