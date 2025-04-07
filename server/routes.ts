import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { db } from "./db";
import { sql, eq, or } from "drizzle-orm";
import { setupAuth, hashPassword } from "./auth";
import { 
  leads,
  orders,
  messages,
  users,
  products,
  fabricOptions,
  fabricCuts,
  customizationOptions,
  insertLeadSchema, 
  insertOrderSchema, 
  insertMessageSchema,
  insertActivitySchema,
  insertProductSchema,
  insertFabricOptionSchema,
  insertFabricCutSchema,
  insertCustomizationOptionSchema,
  insertSalesTeamMemberSchema,
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
      
      res.json(updatedUser);
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
  
  // Sales team management endpoints
  // Get all sales team members - Admin only
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

  return httpServer;
}
