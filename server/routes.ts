import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { db } from "./db";
import { sql, eq, or, and, asc, desc } from "drizzle-orm";
import { setupAuth, hashPassword, isAuthenticated } from "./auth";
import { hasPermission } from '../shared/permissions';
import anthropicService from "./services/anthropic-service";
import shopifyService from "./services/shopify-service";
import multer from "multer";
import path from "path";
import fs from "fs";
import { insertAiTrainingDataSchema, users, ROLES } from "../shared/schema";

// Helper function to calculate duration in days between two dates
function calculateDuration(startDate: string | null, endDate: string | null): number {
  if (!startDate || !endDate) return 1; // Default to 1 day if no dates provided
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays || 1; // Return at least 1 day
}
import { 
  leads,
  orders,
  messages,
  users,
  products,
  fabricOptions,
  camps,
  campScheduleItems,
  campStaffAssignments,
  staffMembers,
  fabricCuts,
  customizationOptions,
  organizations,
  feedback,
  feedbackComments,
  feedbackVotes,
  outlookIntegrations,
  events,
  campTasks,
  campFinancials,
  campRegistrationTiers,
  campRegistrations,
  registrationCommunications,
  contactLogs,
  travelArrangements,
  accommodations,
  fabricTypes,
  fabricCompatibilities,
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
  insertStaffMemberSchema,
  insertFabricTypeSchema,
  insertFabricCompatibilitySchema,
  insertSewingPatternSchema,
  insertProductSuggestionSchema,
  insertCampRegistrationTierSchema,
  insertCampRegistrationSchema,
  insertRegistrationCommunicationSchema,
  sewingPatterns,
  productSuggestions,
  ROLES,
  PERMISSIONS,
  type User,
  type Organization,
  type Permission,
  type Event,
  type InsertEvent,
  type StaffMember,
  type InsertStaffMember,
  type FabricType,
  type InsertFabricType,
  type FabricCompatibility,
  type InsertFabricCompatibility,
  type CampRegistrationTier,
  type InsertCampRegistrationTier,
  type CampRegistration,
  type InsertCampRegistration,
  type RegistrationCommunication,
  type InsertRegistrationCommunication,
  aiTrainingData,
  type AiTrainingData,
  type InsertAiTrainingData
} from "@shared/schema";
import { isAdmin, hasRequiredPermission } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Special endpoint to add leads-steps page to admin users
  try {
    // Get all admin users (using ROLES.ADMIN)
    const adminUsers = await db.select().from(users).where(eq(users.role, ROLES.ADMIN));
    
    console.log(`Found ${adminUsers.length} admin users to update with leads-steps page`);
    
    for (const user of adminUsers) {
      // Get current visiblePages
      let visiblePages = user.visiblePages || [];
      
      // Check if leads-steps is already in the list
      if (!visiblePages.includes('leads-steps')) {
        // Add leads-steps to the visiblePages array
        visiblePages.push('leads-steps');
        
        // Update the user
        await db.update(users)
          .set({ visiblePages })
          .where(eq(users.id, user.id));
        
        console.log(`Updated visiblePages for admin user: ${user.username || user.email}`);
      } else {
        console.log(`Admin user ${user.username || user.email} already has leads-steps page visible`);
      }
    }
  } catch (error) {
    console.error('Error updating admin users with leads-steps page:', error);
  }
  
  // Set up authentication routes
  setupAuth(app);
  
  // Manual endpoint to add leads-steps to visible pages for the current user
  app.get("/api/add-leads-steps-page", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as User;
      
      // Get current visiblePages
      let visiblePages = user.visiblePages || [];
      
      // Check if leads-steps is already in the list
      if (!visiblePages.includes('leads-steps')) {
        // Add leads-steps to the visiblePages array
        visiblePages.push('leads-steps');
        
        // Update the user
        await db.update(users)
          .set({ visiblePages })
          .where(eq(users.id, user.id));
        
        console.log(`Manually added leads-steps page to user ${user.username || user.email}`);
        res.json({ success: true, message: "Added leads-steps page to your visible pages" });
      } else {
        console.log(`User ${user.username || user.email} already has leads-steps page visible`);
        res.json({ success: true, message: "Leads-steps page already in your visible pages" });
      }
    } catch (error: any) {
      console.error('Error adding leads-steps page for user:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
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
      console.log("[DEBUG] POST /api/leads with body:", req.body);
      const validatedData = insertLeadSchema.parse(req.body);
      
      // Check if we should auto-claim the lead
      const autoClaimLead = validatedData.autoClaimLead === true;
      console.log(`[DEBUG] autoClaimLead=${autoClaimLead}, isAuthenticated=${req.isAuthenticated()}`);
      
      // If auto claiming, ensure the lead is marked as claimed on creation
      let leadData = { ...validatedData };
      if (autoClaimLead && req.isAuthenticated()) {
        const user = req.user as User;
        
        // Set the appropriate properties for a claimed lead
        leadData = {
          ...leadData,
          claimed: true,
          claimedById: user.id,
          claimedAt: new Date(),
          salesRepId: user.id,
          status: "claimed"
        };
        
        console.log(`[DEBUG] Auto-claiming lead for user ${user.id}, user details:`, JSON.stringify(user));
      }
      
      // Remove the autoClaimLead property as it's not part of the lead schema
      delete leadData.autoClaimLead;
      
      // Create the lead with potentially modified data
      const newLead = await storage.createLead(leadData);
      
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
        content: `New lead ${newLead.name} added${autoClaimLead ? " and auto-claimed" : ""}`,
        relatedId: newLead.id,
        relatedType: "lead"
      });
      
      // If the lead was auto-claimed, create another activity specifically for the claim
      if (autoClaimLead && req.isAuthenticated()) {
        const user = req.user as User;
        await storage.createActivity({
          userId: user.id,
          type: "lead",
          content: `Lead ${newLead.name} auto-claimed by ${user.fullName || user.username}`,
          relatedId: newLead.id,
          relatedType: "lead"
        });
      }
      
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
      
  // Lead progress checklist endpoints
  app.patch("/api/leads/:id/progress", async (req, res) => {
    try {
      console.log("PATCH /api/leads/:id/progress - Start processing request for lead ID:", req.params.id);
      console.log("Request body:", JSON.stringify(req.body));
  
  // Detailed lead step progress endpoint
  app.patch("/api/leads/:id/progress/:stepId", async (req, res) => {
    try {
      console.log(`PATCH /api/leads/${req.params.id}/progress/${req.params.stepId} - Processing request`);
      console.log("Request body:", JSON.stringify(req.body));
      
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const user = req.user as User;
      const leadId = parseInt(req.params.id);
      const stepId = req.params.stepId;
      
      // Validate step data
      if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({ error: "Invalid request body" });
      }
      
      // Get the lead
      const lead = await storage.getLeadById(leadId);
      if (!lead) {
        return res.status(404).json({ error: "Lead not found" });
      }
      
      // Check permissions (admin, lead owner, or sales executive)
      const canUpdateLead = user.role === ROLES.ADMIN || 
                           user.role === 'executive' || 
                           String(lead.salesRepId) === String(user.id);
      
      if (!canUpdateLead) {
        return res.status(403).json({ error: "You don't have permission to update this lead" });
      }
      
      try {
        // Ensure we're working with clean data
        const progress = lead.progress || {};
        
        // Safely parse and handle any nested JSON if needed
        let safeData = req.body;
        if (typeof req.body.data === 'string') {
          try {
            safeData.data = JSON.parse(req.body.data);
          } catch (parseError) {
            console.log("Could not parse data as JSON, using as is");
          }
        }
        
        // Update the progress for this step
        progress[stepId] = {
          ...progress[stepId],
          ...safeData,
          updatedAt: new Date().toISOString(),
          updatedBy: user.id
        };
        
        // Save the updated lead with proper error handling
        await storage.updateLead(leadId, { progress });
        
        // Send a successful JSON response
        return res.json({ 
          success: true, 
          message: "Lead progress updated successfully" 
        });
      } catch (dataError) {
        console.error("Error processing lead progress data:", dataError);
        return res.status(400).json({ 
          error: "Invalid data format", 
          details: dataError.message 
        });
      }
    } catch (error: any) {
      console.error(`Error updating lead step progress:`, error);
      // Ensure we always return valid JSON
      res.status(500).json({ 
        error: error.message || "An error occurred updating lead progress",
        success: false
      });
    }
  });
      
      if (!req.isAuthenticated()) {
        console.log("User not authenticated");
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const user = req.user as User;
      console.log("Authenticated user:", { id: user.id, role: user.role, name: user.name });
      
      const leadId = parseInt(req.params.id);
      
      if (isNaN(leadId)) {
        console.log("Invalid lead ID provided:", req.params.id);
        return res.status(400).json({ error: "Invalid lead ID" });
      }
      
      // Get the lead to check permissions
      const lead = await storage.getLeadById(leadId);
      if (!lead) {
        console.log("Lead not found:", leadId);
        return res.status(404).json({ error: "Lead not found" });
      }
      
      console.log("Found lead:", { 
        id: lead.id, 
        name: lead.name, 
        salesRepId: lead.salesRepId, 
        claimedById: lead.claimedById 
      });
      
      // Check if user has appropriate permissions to update this lead
      const isLeadOwner = lead.userId === user.id || lead.salesRepId === user.id || lead.claimedById === user.id;
      const isAdmin = user.role === 'admin' || user.role === 'executive';
      const canUpdateAllLeads = hasPermission(
        user.role,
        user.permissions,
        PERMISSIONS.EDIT_LEADS
      );
      
      console.log("Permission check:", { isLeadOwner, isAdmin, canUpdateAllLeads });
      
      if (!canUpdateAllLeads && !isLeadOwner && !isAdmin) {
        console.log("Permission denied for lead update");
        return res.status(403).json({ error: "You don't have permission to update this lead's progress" });
      }
      
      // Validate progress data
      let progressData;
      try {
        progressData = z.object({
          contactComplete: z.boolean().optional(),
          itemsConfirmed: z.boolean().optional(),
          submittedToDesign: z.boolean().optional()
        }).parse(req.body);
        console.log("Validated progress data:", progressData);
      } catch (validationError) {
        console.error("Validation error:", validationError);
        return res.status(400).json({ 
          error: "Invalid progress data provided", 
          details: validationError instanceof z.ZodError ? validationError.errors : String(validationError),
          success: false 
        });
      }
      
      try {
        // Update the lead progress
        console.log("Calling storage.updateLeadProgress with:", leadId, progressData);
        const updatedLead = await storage.updateLeadProgress(leadId, progressData);
        console.log("Lead progress updated successfully:", updatedLead);
        
        // Create activity logs in parallel for better performance
        const activityPromises = [];
        
        if (progressData.contactComplete !== undefined) {
          activityPromises.push(
            storage.createActivity({
              userId: user.id,
              type: "lead",
              content: progressData.contactComplete 
                ? `Initial contact with ${lead.name} marked as complete` 
                : `Initial contact with ${lead.name} marked as incomplete`,
              relatedId: leadId,
              relatedType: "lead"
            })
          );
        }
        
        if (progressData.itemsConfirmed !== undefined) {
          activityPromises.push(
            storage.createActivity({
              userId: user.id,
              type: "lead",
              content: progressData.itemsConfirmed 
                ? `Items for ${lead.name} confirmed` 
                : `Items for ${lead.name} marked as not confirmed`,
              relatedId: leadId,
              relatedType: "lead"
            })
          );
        }
        
        if (progressData.submittedToDesign !== undefined) {
          activityPromises.push(
            storage.createActivity({
              userId: user.id,
              type: "lead",
              content: progressData.submittedToDesign 
                ? `Lead ${lead.name} submitted to design team` 
                : `Lead ${lead.name} removed from design queue`,
              relatedId: leadId,
              relatedType: "lead"
            })
          );
        }
        
        if (activityPromises.length > 0) {
          await Promise.all(activityPromises);
          console.log("All activity logs created successfully");
        }
        
        // Always return a standard JSON format for consistency
        console.log("Sending success response with updated lead data");
        return res.json({ data: updatedLead, success: true });
      } catch (updateError: any) {
        console.error("Error in database operations:", updateError);
        return res.status(500).json({ 
          error: `Database error: ${updateError.message}`, 
          success: false 
        });
      }
    } catch (error: any) {
      console.error('Error in lead progress update route:', error);
      if (error instanceof z.ZodError) {
        console.error('Validation error:', error.errors);
        res.status(400).json({ error: error.errors, success: false });
      } else {
        console.error('Server error:', error.message);
        res.status(500).json({ 
          error: `An unexpected error occurred: ${error.message}`, 
          success: false 
        });
      }
    }
  });
  
  // Contact logs endpoints
  app.get("/api/leads/:id/contact-logs", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const user = req.user as User;
      const leadId = parseInt(req.params.id);
      
      if (isNaN(leadId)) {
        return res.status(400).json({ error: "Invalid lead ID" });
      }
      
      // Get the lead to check permissions
      const lead = await storage.getLeadById(leadId);
      if (!lead) {
        return res.status(404).json({ error: "Lead not found" });
      }
      
      // Check if user has permission to view this lead's logs
      const canViewAllLeads = hasPermission(
        user.role,
        user.permissions,
        PERMISSIONS.VIEW_ALL_LEADS
      );
      
      // Allow both the owner and those with admin permissions access to contact logs
      const isLeadOwner = lead.userId === user.id || lead.salesRepId === user.id || lead.claimedById === user.id;
      const isAdmin = user.role === 'admin' || user.role === 'executive';
      
      if (!canViewAllLeads && !isLeadOwner && !isAdmin) {
        return res.status(403).json({ error: "You don't have permission to view this lead's contact logs" });
      }
      
      // Get contact logs for this lead
      const contactLogs = await storage.getContactLogs(leadId);
      
      res.json({ data: contactLogs });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  app.post("/api/leads/:id/contact-logs", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const user = req.user as User;
      const leadId = parseInt(req.params.id);
      
      if (isNaN(leadId)) {
        return res.status(400).json({ error: "Invalid lead ID" });
      }
      
      // Get the lead to check permissions
      const lead = await storage.getLeadById(leadId);
      if (!lead) {
        return res.status(404).json({ error: "Lead not found" });
      }
      
      // Check if user has permission to add logs to this lead
      const canManageAllLeads = hasPermission(
        user.role,
        user.permissions,
        PERMISSIONS.MANAGE_LEADS
      );
      
      // Allow both the owner and those with admin permissions to add contact logs
      const isLeadOwner = lead.userId === user.id || lead.salesRepId === user.id || lead.claimedById === user.id;
      const isAdmin = user.role === 'admin' || user.role === 'executive';
      
      if (!canManageAllLeads && !isLeadOwner && !isAdmin) {
        return res.status(403).json({ error: "You don't have permission to add contact logs to this lead" });
      }
      
      // Validate contact log data
      const contactLogData = z.object({
        leadId: z.number(),
        contactMethod: z.string(),
        notes: z.string().nullable().optional()
      }).parse({
        ...req.body,
        leadId // Ensure leadId matches the URL parameter
      });
      
      // Create the contact log - avoid sending 'timestamp' property which will be handled by DB
      const newContactLog = await storage.createContactLog({
        leadId: contactLogData.leadId,
        contactMethod: contactLogData.contactMethod,
        notes: contactLogData.notes,
        userId: user.id
      });
      
      // Create an activity for the new contact log
      await storage.createActivity({
        userId: user.id,
        type: "lead",
        content: `Contact made with ${lead.name} via ${contactLogData.contactMethod}`,
        relatedId: leadId,
        relatedType: "lead"
      });
      
      res.status(201).json({ data: newContactLog });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  });
  
  app.delete("/api/leads/:leadId/contact-logs/:logId", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const user = req.user as User;
      const leadId = parseInt(req.params.leadId);
      const logId = parseInt(req.params.logId);
      
      if (isNaN(leadId) || isNaN(logId)) {
        return res.status(400).json({ error: "Invalid lead ID or log ID" });
      }
      
      // Verify user has admin permissions - only admins can delete logs
      const canManageLeads = hasPermission(
        user.role,
        user.permissions,
        PERMISSIONS.MANAGE_LEADS
      );
      
      if (!canManageLeads) {
        return res.status(403).json({ error: "You don't have permission to delete contact logs" });
      }
      
      // Delete the contact log
      await storage.deleteContactLog(logId);
      
      res.status(200).json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
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
      console.log(`[LEAD CLAIM ATTEMPT] Processing claim request for lead ID: ${req.params.id}`);
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        console.log(`[LEAD CLAIM ERROR] Invalid lead ID: ${req.params.id}`);
        return res.status(400).json({ error: "Invalid lead ID" });
      }
      
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        console.log(`[LEAD CLAIM ERROR] User not authenticated`);
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const user = req.user as User;
      console.log(`[LEAD CLAIM] User ${user.id} (${user.username}) attempting to claim lead ${id}`);
      
      const lead = await storage.getLeadById(id);
      if (!lead) {
        console.log(`[LEAD CLAIM ERROR] Lead ${id} not found`);
        return res.status(404).json({ error: "Lead not found" });
      }
      
      // Check if lead is already claimed
      if (lead.claimed) {
        console.log(`[LEAD CLAIM ERROR] Lead ${id} already claimed by user ${lead.claimedById}`);
        return res.status(400).json({ 
          error: "Lead already claimed", 
          claimedById: lead.claimedById 
        });
      }
      
      console.log(`[LEAD CLAIM] Lead ${id} is unclaimed, proceeding with claim by user ${user.id}`);
      
      // Update lead with claim information
      const updatedLead = await storage.updateLead({
        ...lead,
        claimed: true,
        claimedById: user.id,
        claimedAt: new Date(),
        salesRepId: user.id,
        status: "claimed"
      });
      
      console.log(`[LEAD CLAIM SUCCESS] Lead ${id} successfully claimed by user ${user.id}`, updatedLead);
      
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
      const verificationDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
      console.log(`[LEAD CLAIM] Scheduled verification for lead ${lead.id} on ${verificationDate}`);
      
      // Return comprehensive data about the updated lead to ensure client cache is properly updated
      return res.status(200).json({ 
        success: true,
        message: "Lead claimed successfully",
        leadId: updatedLead.id,
        lead: updatedLead, // Send the complete updated lead object
        claimedById: user.id,
        salesRepId: user.id,
        claimed: true,
        claimedAt: updatedLead.claimedAt,
        status: "claimed",
        verificationDate: verificationDate
      });
    } catch (error: any) {
      console.error("[LEAD CLAIM ERROR] Error claiming lead:", error);
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
  // Get user settings
  app.get("/api/settings/:type", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const settingType = req.params.type;
      const userId = req.user.id;
      
      const settings = await storage.getUserSettings(userId, settingType);
      res.json(settings || {});
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Update user settings
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
  
  // Restore sample leads to whiteboard - Admin only
  app.post("/api/admin/leads/restore-samples", hasRequiredPermission(PERMISSIONS.MANAGE_USERS), async (req, res) => {
    try {
      // Create sample leads for the whiteboard view
      const sampleLeads = await storage.createSampleLeads();
      
      // Create activity log for the action
      await storage.createActivity({
        userId: req.user?.id || 1,
        type: "system",
        content: `Sample leads restored to whiteboard (${sampleLeads.length} leads added)`,
        relatedType: "lead"
      });
      
      res.json({ 
        success: true, 
        message: `${sampleLeads.length} sample leads added to whiteboard`, 
        data: sampleLeads 
      });
    } catch (error: any) {
      console.error("Error restoring sample leads:", error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // Get unassigned leads - Admin only
  app.get("/api/admin/leads/unassigned", hasRequiredPermission(PERMISSIONS.MANAGE_USERS), async (req, res) => {
    try {
      // Get all leads that aren't assigned to a sales rep
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
  
  // Staff management endpoints
  app.get("/api/staff", async (req, res) => {
    try {
      // Check if the user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      // Get all staff members
      const staffMembers = await storage.getStaffMembers();
      res.json({ data: staffMembers });
    } catch (error: any) {
      console.error("Error fetching staff members:", error);
      res.status(500).json({ error: error.message });
    }
  });
  
  app.get("/api/staff/:id", async (req, res) => {
    try {
      // Check if the user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid staff ID" });
      }
      
      // Get the staff member by ID
      const staffMember = await storage.getStaffMemberById(id);
      if (!staffMember) {
        return res.status(404).json({ error: "Staff member not found" });
      }
      
      res.json({ data: staffMember });
    } catch (error: any) {
      console.error(`Error fetching staff member #${req.params.id}:`, error);
      res.status(500).json({ error: error.message });
    }
  });
  
  app.post("/api/staff", async (req, res) => {
    try {
      // Check if the user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      console.log('Creating staff member with data:', req.body);
      
      // Validate the request body
      const validatedData = insertStaffMemberSchema.parse(req.body);
      
      // Create the staff member
      const newStaffMember = await storage.createStaffMember(validatedData);
      
      // Log the created staff member
      console.log('Staff member created:', newStaffMember);
      
      // Create an activity record for this creation
      await storage.createActivity({
        userId: (req.user as User).id,
        type: "staff",
        content: `Staff member "${newStaffMember.name}" created`,
        relatedId: newStaffMember.id,
        relatedType: "staff"
      });
      
      res.status(201).json({ data: newStaffMember, success: true });
    } catch (error: any) {
      console.error("Error creating staff member:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  });
  
  app.put("/api/staff/:id", async (req, res) => {
    try {
      // Check if the user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid staff ID" });
      }
      
      // Log the update attempt with data
      console.log(`Updating staff member #${id} with data:`, req.body);
      
      // Check if the staff member exists
      const existingStaff = await storage.getStaffMemberById(id);
      if (!existingStaff) {
        return res.status(404).json({ error: "Staff member not found" });
      }
      
      // Update the staff member
      const updatedStaff = await storage.updateStaffMember(id, req.body);
      
      // Log the update result
      console.log('Staff member updated successfully:', updatedStaff);
      
      // Create an activity record for this update
      await storage.createActivity({
        userId: (req.user as User).id,
        type: "staff",
        content: `Staff member "${updatedStaff.name}" updated`,
        relatedId: id,
        relatedType: "staff"
      });
      
      res.json({ data: updatedStaff, success: true });
    } catch (error: any) {
      console.error(`Error updating staff member #${req.params.id}:`, error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  });
  
  app.delete("/api/staff/:id", async (req, res) => {
    try {
      // Check if the user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid staff ID" });
      }
      
      // Check if the staff member exists
      const staffMember = await storage.getStaffMemberById(id);
      if (!staffMember) {
        return res.status(404).json({ error: "Staff member not found" });
      }
      
      // Delete the staff member
      await storage.deleteStaffMember(id);
      
      // Create an activity record for this deletion
      await storage.createActivity({
        userId: (req.user as User).id,
        type: "staff",
        content: `Staff member "${staffMember.name}" deleted`,
        relatedId: id,
        relatedType: "staff"
      });
      
      res.json({ success: true, message: "Staff member deleted successfully" });
    } catch (error: any) {
      console.error(`Error deleting staff member #${req.params.id}:`, error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // User lookup by email - Admin only
  app.get("/api/users/email/:email", isAdmin, async (req, res) => {
    try {
      const email = req.params.email;
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      res.json({
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          permissions: user.permissions,
          visiblePages: user.visiblePages
        }
      });
    } catch (error: any) {
      console.error("User lookup error:", error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // Update user visible pages directly - Admin only
  app.put("/api/users/:id/visible-pages", isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      
      const { visiblePages } = req.body;
      if (!Array.isArray(visiblePages)) {
        return res.status(400).json({ error: "visiblePages must be an array" });
      }
      
      const updatedUser = await storage.updateUserVisiblePages(userId, visiblePages);
      
      res.json({
        success: true,
        user: {
          id: updatedUser.id,
          visiblePages: updatedUser.visiblePages
        }
      });
    } catch (error: any) {
      console.error("Update visible pages error:", error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // Force sync user settings with visiblePages - Admin only
  app.post("/api/users/:id/sync-settings", isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      
      // Get the user to get their visiblePages
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Get current navigation settings
      const navSettings = await storage.getUserSettings(userId, 'navigation');
      
      // Create settings object with user's visiblePages
      let settingsData = navSettings?.settings || {};
      
      // Generate a complete list of admin pages if not already present
      if (user.role === 'admin' || user.role === 'designer' || user.role === 'sales' || user.role === 'hybrid') {
        // Make sure we have a complete list of visible pages
        const defaultPages = [
          'dashboard', 'profile', 'settings',
          'orders', 'leads', 'organizations',
          'catalog', 'messages', 'design', 'manufacturing'
        ];
        
        // Add admin pages for admins and specific admin pages for other roles
        if (user.role === 'admin') {
          defaultPages.push(
            'admin/product-management', 'admin/sales-team', 
            'admin/design-team', 'admin/manufacturing-team',
            'corporate', 'admin/reports', 'user-management'
          );
        }
        
        if (user.role === 'designer' || user.role === 'hybrid') {
          defaultPages.push('admin/design-team');
        }
        
        if (user.role === 'sales' || user.role === 'hybrid') {
          defaultPages.push('admin/sales-team');
        }
        
        if (!user.visiblePages || user.visiblePages.length === 0) {
          // If user doesn't have visiblePages, set them
          await storage.updateUserVisiblePages(userId, defaultPages);
          user.visiblePages = defaultPages;
        }
      }
      
      // Ensure the user has visiblePages
      if (!user.visiblePages) {
        user.visiblePages = [];
      }
      
      // Always sync the visiblePages from the user record to the settings
      settingsData.visiblePages = user.visiblePages;
      
      // Update the settings
      await storage.updateUserSettings(userId, 'navigation', settingsData);
      
      res.json({ success: true, message: "User settings synchronized successfully" });
    } catch (error: any) {
      console.error("Sync settings error:", error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // Endpoint to update event page names in navigation
  app.get('/api/debug/update-event-pages', async (req, res) => {
    try {
      // Get all admin users to update their settings
      const adminUsers = await storage.getAdminUsers();
      
      if (!adminUsers || adminUsers.length === 0) {
        return res.status(404).json({ error: "No admin users found" });
      }
      
      const results = [];
      
      // Update each admin user's navigation settings
      for (const user of adminUsers) {
        // Get current navigation settings
        const navSettings = await storage.getUserSettings(user.id, 'navigation');
        let settingsData = navSettings?.settings || {};
        
        // Update the visible pages array with new event pages
        const updatedVisiblePages = new Set([
          ...(user.visiblePages || []),
          'events/overview',
          'events/travel',
          'events/financial', 
          'events/staff',
          'events/vendors',
          'events/calendar'
        ]);
        
        // Set updated visible pages
        user.visiblePages = Array.from(updatedVisiblePages);
        await storage.updateUserVisiblePages(user.id, user.visiblePages);
        
        // Ensure groups array exists
        if (!settingsData.groups || !Array.isArray(settingsData.groups)) {
          settingsData.groups = [];
        }
        
        // Find or create the events group
        let eventsGroup = settingsData.groups.find((g: any) => 
          g.id === 'events' || (g.title && g.title.toLowerCase().includes('event')));
        
        if (!eventsGroup) {
          // Create a new events group if one doesn't exist
          eventsGroup = {
            id: 'events',
            title: 'Events',
            collapsed: false,
            items: []
          };
          settingsData.groups.push(eventsGroup);
        }
        
        // Replace the existing items with new event pages
        eventsGroup.items = [
          { id: 'events/overview', name: 'Camp Overview', enabled: true },
          { id: 'events/travel', name: 'Travel and Accommodations', enabled: true },
          { id: 'events/financial', name: 'Financial Management', enabled: true },
          { id: 'events/staff', name: 'Staff Management', enabled: true },
          { id: 'events/vendors', name: 'Vendors and Services', enabled: true },
          { id: 'events/calendar', name: 'Calendar and Scheduling', enabled: true },
          { id: 'feedback', name: 'Feedback', enabled: true }
        ];
        
        // Update the navigation settings
        settingsData.visiblePages = user.visiblePages;
        await storage.updateUserSettings(user.id, 'navigation', settingsData);
        
        results.push({
          userId: user.id,
          username: user.username,
          status: 'updated'
        });
      }
      
      res.json({ 
        success: true, 
        message: `Updated navigation settings for ${results.length} admin users`,
        results
      });
    } catch (error: any) {
      console.error("Update event pages error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Debug endpoint to fix Charlie Reeves permissions
  app.get('/api/debug/fix-charlie-permissions', async (req, res) => {
    try {
      const email = "charliereeves@rich-habits.com";
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        return res.status(404).json({ error: "Charlie not found" });
      }
      
      // Update Charlie's role to manager if needed
      if (user.role !== 'manager') {
        await storage.updateUser(user.id, { role: 'manager' });
      }
      
      // Create a comprehensive list of pages Charlie should have access to
      // Include ALL the pages from the nav settings plus additional ones
      const charliePagesNeeded = [
        // Basic pages
        'dashboard', 'profile', 'settings',
        'orders', 'leads', 'organizations',
        'catalog', 'messages', 'outlook', 'feedback',
        // Special pages
        'design', 'manufacturing', 'sales-process',
        'design-communication', 'production-communication',
        // Admin pages
        'admin/design-team', 'admin/manufacturing-team', 
        'admin/sales-team', 'admin/product-creation', 
        'admin/product-management', 'corporate'
      ];
      
      // Update Charlie's visible pages
      await storage.updateUserVisiblePages(user.id, charliePagesNeeded);
      
      // Get navigation settings
      const navSettings = await storage.getUserSettings(user.id, 'navigation');
      
      // Create settings object with updated visible pages
      let settingsData = navSettings?.settings || {};
      settingsData.visiblePages = charliePagesNeeded;
      
      // Update the settings
      await storage.updateUserSettings(user.id, 'navigation', settingsData);
      
      res.json({ 
        success: true, 
        message: "Charlie's permissions have been fixed",
        pagesAdded: charliePagesNeeded
      });
    } catch (error: any) {
      console.error("Fix Charlie permissions error:", error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // Debug endpoint to show user permissions and settings
  app.get('/api/debug/user-permissions/:email', async (req, res) => {
    try {
      const { email } = req.params;
      
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }
      
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Get user's navigation settings
      const navSettings = await storage.getUserSettings(user.id, 'navigation');
      
      // Compare user.visiblePages with settings.visiblePages
      const userVisiblePages = user.visiblePages || [];
      const settingsVisiblePages = (navSettings?.settings?.visiblePages || []) as string[];
      
      // Check if they match
      const pagesMatch = JSON.stringify(userVisiblePages.sort()) === JSON.stringify(settingsVisiblePages.sort());
      
      // Collect results in a response object
      const result = {
        userId: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        userVisiblePages: userVisiblePages,
        settingsVisiblePages: settingsVisiblePages,
        pagesMatch: pagesMatch,
        missingInUserPages: settingsVisiblePages.filter((p: string) => !userVisiblePages.includes(p)),
        missingInSettingsPages: userVisiblePages.filter((p: string) => !settingsVisiblePages.includes(p)),
        userHasAdminPages: userVisiblePages.some((p: string) => p.startsWith('admin/')),
        settingsHasAdminPages: settingsVisiblePages.some((p: string) => p.startsWith('admin/')),
        navSettingsFound: !!navSettings
      };
      
      res.json(result);
    } catch (error: any) {
      console.error("User permissions debug error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // CAMP MANAGEMENT ENDPOINTS
  
  // Camp Staff Bulk Assignment Endpoint
  app.post("/api/camps/:id/staff-assignments", async (req, res) => {
    try {
      // Check if the user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      // Only admin can assign staff to camps
      const user = req.user as User;
      if (user.role !== 'admin') {
        return res.status(403).json({ error: "Unauthorized access" });
      }
      
      const campId = parseInt(req.params.id);
      if (isNaN(campId)) {
        return res.status(400).json({ error: "Invalid camp ID" });
      }
      
      // Check if camp exists
      const existingCamp = await storage.getCampById(campId);
      if (!existingCamp) {
        return res.status(404).json({ error: "Camp not found" });
      }
      
      const { staffAssignments } = req.body;
      
      if (!Array.isArray(staffAssignments) || staffAssignments.length === 0) {
        return res.status(400).json({ error: "Staff assignments must be a non-empty array" });
      }
      
      // Validate each assignment has the required fields
      for (const assignment of staffAssignments) {
        if (!assignment.staffId) {
          return res.status(400).json({ error: "Each staff assignment must have a staffId" });
        }
      }
      
      try {
        // Process the staff assignments
        const updatedCamp = await storage.assignStaffToCamp(campId, staffAssignments);
        
        // Log the activity
        await storage.createActivity({
          type: 'user',
          content: `Updated staff assignments for camp: ${existingCamp.name}`,
          userId: user.id,
          relatedId: campId,
          relatedType: 'camp'
        });
        
        // Get the updated staff list
        const campStaff = await storage.getCampStaff(campId);
        
        res.status(200).json({
          success: true,
          camp: updatedCamp,
          staff: campStaff
        });
      } catch (error) {
        console.error("Error assigning staff to camp:", error);
        res.status(500).json({ error: "Failed to assign staff to camp" });
      }
    } catch (error) {
      console.error("Error in staff assignments endpoint:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get all camps
  app.get("/api/camps", async (req, res) => {
    try {
      // Check if the user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      console.log("Fetching all camps");
      const camps = await storage.getCamps();
      
      // Ensure consistent data structure with { data: [...] } format
      res.status(200).json({ data: camps });
    } catch (error) {
      console.error(`Error fetching camps:`, error);
      res.status(500).json({ error: "Failed to fetch camps" });
    }
  });
  
  // Get global camp statistics
  app.get("/api/camps/stats", async (req, res) => {
    try {
      // Check if the user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      // Get all camps first
      const camps = await storage.getCamps();
      
      if (!camps || camps.length === 0) {
        return res.json({ 
          data: {
            totalCamps: 0,
            upcomingCamps: 0,
            totalRevenue: 0,
            totalProfit: 0,
            totalRegistrations: 0,
            totalCapacity: 0,
            occupancyRate: 0,
            avgCampSize: 0,
            avgTeamSize: 0,
            topLocation: '',
            inventoryStatus: {
              lowStock: 0,
              reorderNeeded: 0,
              totalItems: 0
            },
            staffMetrics: {
              totalActive: 0,
              assignmentsCompleted: 0,
              assignmentsPending: 0
            }
          }
        });
      }
      
      // Calculate metrics
      const currentDate = new Date();
      
      // Count upcoming camps
      const upcomingCamps = camps.filter(camp => {
        const startDate = new Date(camp.startDate);
        return startDate > currentDate;
      }).length;
      
      // Sum revenue, registrations, and capacity
      let totalRevenue = 0;
      let totalProfit = 0;
      let totalRegistrations = 0;
      let totalCapacity = 0;
      let totalTeamSize = 0;
      
      camps.forEach(camp => {
        // Convert string values to numbers with fallback to 0
        const campCost = camp.campCost ? parseFloat(camp.campCost) || 0 : 0;
        const participants = camp.participants || 0;
        const staffCount = camp.staffCount || 0;
        
        totalRevenue += campCost * participants;
        // Estimate profit as 30% of revenue for demo purposes
        totalProfit += (campCost * participants) * 0.3;
        totalRegistrations += participants;
        // Use a reasonable capacity estimate if not specified
        totalCapacity += participants > 0 ? Math.ceil(participants * 1.2) : 100;
        totalTeamSize += staffCount;
      });
      
      // Calculate occupancy rate
      const occupancyRate = totalCapacity > 0 
        ? Math.min(100, Math.round((totalRegistrations / totalCapacity) * 100)) 
        : 0;
      
      // Calculate average camp size
      const avgCampSize = camps.length > 0 
        ? Math.round(totalRegistrations / camps.length) 
        : 0;
      
      // Calculate average team size
      const avgTeamSize = camps.length > 0 
        ? Math.round(totalTeamSize / camps.length) 
        : 0;
      
      // Determine top location
      const locationCounts = camps.reduce((acc, camp) => {
        const location = camp.venue || 'Unknown';
        acc[location] = (acc[location] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      // Find location with highest count
      let topLocation = 'None';
      let maxCount = 0;
      
      Object.entries(locationCounts).forEach(([location, count]) => {
        if (count > maxCount) {
          maxCount = count;
          topLocation = location;
        }
      });
      
      // Get inventory status (for demo purposes)
      const inventoryItems = await storage.getInventoryItems();
      const lowStockItems = inventoryItems.filter(item => 
        item.quantity && item.reorderPoint && item.quantity < item.reorderPoint && item.quantity > 0
      ).length;
      
      const reorderNeededItems = inventoryItems.filter(item => 
        item.quantity === 0 || (item.quantity && item.reorderPoint && item.quantity <= item.reorderPoint * 0.5)
      ).length;
      
      // Get staff metrics
      const allStaff = await storage.getAllStaff();
      const activeStaff = allStaff.filter(staff => staff.status === 'active');
      const assignmentsCompleted = Math.floor(Math.random() * 50); // Demo data
      const assignmentsPending = Math.floor(Math.random() * 30); // Demo data
      
      res.json({
        data: {
          totalCamps: camps.length,
          upcomingCamps,
          totalRevenue,
          totalProfit,
          totalRegistrations,
          totalCapacity,
          occupancyRate,
          avgCampSize,
          avgTeamSize,
          topLocation,
          inventoryStatus: {
            lowStock: lowStockItems,
            reorderNeeded: reorderNeededItems,
            totalItems: inventoryItems.length
          },
          staffMetrics: {
            totalActive: activeStaff.length,
            assignmentsCompleted,
            assignmentsPending
          }
        }
      });
    } catch (error) {
      console.error(`Error fetching camp statistics:`, error);
      res.status(500).json({ error: "Failed to fetch camp statistics" });
    }
  });
  
  // Get a specific camp by ID
  app.get("/api/camps/:id", async (req, res) => {
    try {
      // Check if the user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const campId = parseInt(req.params.id);
      if (isNaN(campId)) {
        return res.status(400).json({ error: "Invalid camp ID" });
      }
      
      const camp = await storage.getCampById(campId);
      
      if (!camp) {
        return res.status(404).json({ error: "Camp not found" });
      }
      
      // Ensure consistent data structure with { data: {...} } format
      res.status(200).json({ data: camp });
    } catch (error) {
      console.error(`Error fetching camp:`, error);
      res.status(500).json({ error: "Failed to fetch camp" });
    }
  });
  
  // Create a new camp
  app.post("/api/camps", async (req, res) => {
    try {
      // Check if the user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      // Only admin or event manager can create camps
      const user = req.user as User;
      if (user.role !== 'admin') {
        return res.status(403).json({ error: "Unauthorized access" });
      }
      
      const campData = req.body;
      
      // Handle totalPaid field conversion
      if (campData.totalPaid && typeof campData.totalPaid === 'string') {
        // Convert to number or leave as is if it can't be converted
        const totalPaidNum = parseFloat(campData.totalPaid);
        if (!isNaN(totalPaidNum)) {
          campData.totalPaid = totalPaidNum;
        }
      }
      
      // Calculate selloutCost based on participants and campCost if not provided
      if (!campData.selloutCost && campData.participants && campData.campCost) {
        const participantsNum = typeof campData.participants === 'string' 
          ? parseFloat(campData.participants) 
          : campData.participants;
        
        const campCostNum = typeof campData.campCost === 'string'
          ? parseFloat(campData.campCost)
          : campData.campCost;
          
        if (!isNaN(participantsNum) && !isNaN(campCostNum)) {
          campData.selloutCost = (participantsNum * campCostNum).toString();
        }
      }
      
      // Add createdBy information
      campData.createdById = user.id;
      campData.createdByName = user.fullName || user.username;
      
      // Extract initialStaffIds from the request if present
      const { initialStaffIds, ...campDataWithoutStaff } = campData;
      
      // Create the camp without staff first
      const newCamp = await storage.createCamp(campDataWithoutStaff);
      
      // If there are initial staff IDs, assign them to the camp
      if (initialStaffIds && Array.isArray(initialStaffIds) && initialStaffIds.length > 0) {
        for (const staffId of initialStaffIds) {
          try {
            // Check if staff exists
            const staffMember = await storage.getStaffById(staffId);
            if (staffMember) {
              await storage.addStaffToCamp(newCamp.id, staffId);
              
              // Log each staff assignment
              await storage.createActivity({
                type: 'user',
                content: `Added ${staffMember.firstName} ${staffMember.lastName} to camp: ${newCamp.name}`,
                userId: user.id,
                relatedId: newCamp.id,
                relatedType: 'camp'
              });
            }
          } catch (staffError) {
            console.error(`Error assigning staff ${staffId} to camp:`, staffError);
            // Continue with other staff even if one fails
          }
        }
      }
      
      // Log the camp creation activity
      await storage.createActivity({
        userId: user.id,
        type: 'camp_management',
        content: `Created new camp: ${newCamp.name}`,
        relatedId: newCamp.id,
        relatedType: 'CAMP'
      });
      
      // Get the updated camp with its staff to return in the response
      const campWithStaff = await storage.getCampById(newCamp.id);
      
      // Ensure consistent data structure with { data: {...} } format
      res.status(201).json({ data: campWithStaff });
    } catch (error) {
      console.error(`Error creating camp:`, error);
      res.status(500).json({ error: "Failed to create camp" });
    }
  });
  
  // Update a camp
  app.put("/api/camps/:id", async (req, res) => {
    try {
      // Check if the user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      // Only admin can update camps
      const user = req.user as User;
      if (user.role !== 'admin') {
        return res.status(403).json({ error: "Unauthorized access" });
      }
      
      const campId = parseInt(req.params.id);
      if (isNaN(campId)) {
        return res.status(400).json({ error: "Invalid camp ID" });
      }
      
      // Check if camp exists
      const existingCamp = await storage.getCampById(campId);
      if (!existingCamp) {
        return res.status(404).json({ error: "Camp not found" });
      }
      
      const campData = req.body;
      
      // Handle totalPaid field conversion
      if (campData.totalPaid && typeof campData.totalPaid === 'string') {
        // Convert to number or leave as is if it can't be converted
        const totalPaidNum = parseFloat(campData.totalPaid);
        if (!isNaN(totalPaidNum)) {
          campData.totalPaid = totalPaidNum;
        }
      }
      
      // Auto-recalculate selloutCost if participants or campCost changed
      if ((campData.participants || campData.campCost) && 
          (campData.participants !== existingCamp.participants || 
           campData.campCost !== existingCamp.campCost)) {
        
        // Use new values or fallback to existing values
        const participants = campData.participants || existingCamp.participants;
        const campCost = campData.campCost || existingCamp.campCost;
        
        if (participants && campCost) {
          const participantsNum = typeof participants === 'string' 
            ? parseFloat(participants) 
            : participants;
          
          const campCostNum = typeof campCost === 'string'
            ? parseFloat(campCost)
            : campCost;
            
          if (!isNaN(participantsNum) && !isNaN(campCostNum)) {
            campData.selloutCost = (participantsNum * campCostNum).toString();
          }
        }
      }
      
      // Add lastUpdatedBy information
      campData.lastUpdatedById = user.id;
      campData.lastUpdatedByName = user.fullName || user.username;
      
      const updatedCamp = await storage.updateCamp(campId, campData);
      
      // Log the activity
      await storage.createActivity({
        userId: user.id,
        type: 'camp_management',
        content: `Updated camp: ${updatedCamp.name}`,
        relatedId: updatedCamp.id,
        relatedType: 'CAMP'
      });
      
      res.status(200).json(updatedCamp);
    } catch (error) {
      console.error(`Error updating camp:`, error);
      res.status(500).json({ error: "Failed to update camp" });
    }
  });
  
  // Delete a camp
  app.delete("/api/camps/:id", async (req, res) => {
    try {
      // Check if the user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      // Only admin can delete camps
      const user = req.user as User;
      if (user.role !== 'admin') {
        return res.status(403).json({ error: "Unauthorized access" });
      }
      
      const campId = parseInt(req.params.id);
      if (isNaN(campId)) {
        return res.status(400).json({ error: "Invalid camp ID" });
      }
      
      // Check if camp exists
      const existingCamp = await storage.getCampById(campId);
      if (!existingCamp) {
        return res.status(404).json({ error: "Camp not found" });
      }
      
      await storage.deleteCamp(campId);
      
      // Log the activity
      await storage.createActivity({
        userId: user.id,
        type: 'camp_management',
        content: `Deleted camp: ${existingCamp.name}`,
        relatedId: campId,
        relatedType: 'CAMP'
      });
      
      res.status(200).json({ message: "Camp deleted successfully" });
    } catch (error) {
      console.error(`Error deleting camp:`, error);
      res.status(500).json({ error: "Failed to delete camp" });
    }
  });
  
  // Update camp schedule
  // New endpoint to handle camp schedules with the new schema
  app.put("/api/camps/:id/schedule", async (req, res) => {
    try {
      // Check if the user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      // Only admin can update camp schedules
      const user = req.user as any;
      if (user.role !== 'admin') {
        return res.status(403).json({ error: "Unauthorized access" });
      }
      
      const campId = parseInt(req.params.id);
      if (isNaN(campId)) {
        return res.status(400).json({ error: "Invalid camp ID" });
      }
      
      // Check if camp exists
      const existingCamp = await storage.getCampById(campId);
      if (!existingCamp) {
        return res.status(404).json({ error: "Camp not found" });
      }
      
      const { scheduleItems } = req.body;
      
      if (!Array.isArray(scheduleItems)) {
        return res.status(400).json({ error: "Schedule items must be an array" });
      }
      
      // First, delete any existing schedule items for this camp
      // Use direct DB access for bulk deletion as we don't have a storage method for this yet
      await db.delete(campScheduleItems).where(eq(campScheduleItems.campId, campId));
      
      // Then add the new schedule items
      for (const item of scheduleItems) {
        // Basic validation
        if (!item.dayNumber || !item.activity || !item.startTime || !item.endTime) {
          continue; // Skip invalid items
        }
        
        // Create the schedule item using our storage method
        await storage.addCampScheduleItem({
          campId,
          dayNumber: item.dayNumber,
          startTime: item.startTime,
          endTime: item.endTime,
          activity: item.activity,
          location: item.location || '',
          staffId: item.staffId || null,
          notes: item.notes || ''
        });
      }
      
      // Get all schedule items for the camp using our storage method
      const schedule = await storage.getCampScheduleItems(campId);
      
      // Log the activity
      await storage.createActivity({
        type: 'UPDATE',
        content: `Updated schedule for camp: ${existingCamp.name}`,
        userId: user.id,
        relatedId: campId,
        relatedType: 'CAMP_SCHEDULE'
      });
      
      // Get the updated camp data
      const updatedCamp = await storage.getCampById(campId);
      
      res.status(200).json({
        camp: updatedCamp,
        schedule
      });
    } catch (error) {
      console.error(`Error updating camp schedule:`, error);
      res.status(500).json({ error: "Failed to update camp schedule" });
    }
  });
  
  // Update camp tasks - using the new camp_tasks table
  app.put("/api/camps/:id/tasks", async (req, res) => {
    try {
      // Check if the user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      // Only admin can update camp tasks
      const user = req.user as any;
      if (user.role !== 'admin') {
        return res.status(403).json({ error: "Unauthorized access" });
      }
      
      const campId = parseInt(req.params.id);
      if (isNaN(campId)) {
        return res.status(400).json({ error: "Invalid camp ID" });
      }
      
      // Check if camp exists
      const existingCamp = await storage.getCampById(campId);
      if (!existingCamp) {
        return res.status(404).json({ error: "Camp not found" });
      }
      
      const { tasks } = req.body;
      
      if (!Array.isArray(tasks)) {
        return res.status(400).json({ error: "Tasks must be an array" });
      }
      
      // First, delete any existing tasks for this camp
      // Using direct DB access for bulk deletion as we don't have a storage method for this
      await db.delete(campTasks).where(eq(campTasks.campId, campId));
      
      // Then add the new tasks using our storage methods
      for (const task of tasks) {
        // Basic validation
        if (!task.name) {
          continue; // Skip invalid tasks
        }
        
        // Create the task using our storage method
        await storage.addCampTask({
          campId,
          name: task.name,
          description: task.description || '',
          status: task.status || 'not-started',
          dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
          assignedTo: task.assignedTo || null,
          priority: task.priority || 'medium'
        });
      }
      
      // Get all tasks for the camp using our storage method
      const campTasksList = await storage.getCampTasks(campId);
      
      // Log the activity
      await storage.createActivity({
        type: 'UPDATE',
        content: `Updated tasks for camp: ${existingCamp.name}`,
        userId: user.id,
        relatedId: campId,
        relatedType: 'CAMP'
      });
      
      // Get the updated camp data
      const updatedCamp = await storage.getCampById(campId);
      
      res.status(200).json({
        camp: updatedCamp,
        tasks: campTasksList
      });
    } catch (error) {
      console.error(`Error updating camp tasks:`, error);
      res.status(500).json({ error: "Failed to update camp tasks" });
    }
  });
  
  // Assign staff to camp
  // Get all staff assigned to a camp
  app.get("/api/camps/:id/staff", async (req, res) => {
    try {
      // Check if the user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const campId = parseInt(req.params.id);
      if (isNaN(campId)) {
        return res.status(400).json({ error: "Invalid camp ID" });
      }
      
      // Check if camp exists
      const existingCamp = await storage.getCampById(campId);
      if (!existingCamp) {
        return res.status(404).json({ error: "Camp not found" });
      }
      
      const campStaff = await storage.getCampStaff(campId);
      res.status(200).json(campStaff);
    } catch (error) {
      console.error("Error fetching camp staff:", error);
      res.status(500).json({ error: "Failed to fetch camp staff" });
    }
  });

  // Bulk update of staff assigned to a camp
  app.put("/api/camps/:id/staff-bulk", async (req, res) => {
    try {
      // Check if the user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      // Only admin can assign staff to camps
      const user = req.user as any;
      if (user.role !== 'admin') {
        return res.status(403).json({ error: "Unauthorized access" });
      }
      
      const campId = parseInt(req.params.id);
      if (isNaN(campId)) {
        return res.status(400).json({ error: "Invalid camp ID" });
      }
      
      // Check if camp exists
      const existingCamp = await storage.getCampById(campId);
      if (!existingCamp) {
        return res.status(404).json({ error: "Camp not found" });
      }
      
      const { staffAssignments } = req.body;
      
      if (!Array.isArray(staffAssignments)) {
        return res.status(400).json({ error: "Staff assignments must be an array" });
      }
      
      // Use our bulk assignment method
      const updatedCamp = await storage.assignStaffToCamp(campId, staffAssignments);
      
      // Log the activity
      await storage.createActivity({
        type: 'UPDATE',
        content: `Updated staff assignments for camp: ${existingCamp.name}`,
        userId: user.id,
        relatedId: campId, 
        relatedType: 'CAMP'
      });
      
      // Get the updated staff list
      const updatedStaff = await storage.getCampStaff(campId);
      
      res.status(200).json({ 
        camp: updatedCamp,
        staff: updatedStaff
      });
    } catch (error) {
      console.error(`Error assigning staff to camp:`, error);
      res.status(500).json({ error: "Failed to assign staff to camp" });
    }
  });
  
  // Individual staff assignment (legacy endpoint)
  app.put("/api/camps/:id/staff", async (req, res) => {
    try {
      // Check if the user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      // Only admin can assign staff to camps
      const user = req.user as any;
      if (user.role !== 'admin') {
        return res.status(403).json({ error: "Unauthorized access" });
      }
      
      const campId = parseInt(req.params.id);
      if (isNaN(campId)) {
        return res.status(400).json({ error: "Invalid camp ID" });
      }
      
      // Check if camp exists
      const existingCamp = await storage.getCampById(campId);
      if (!existingCamp) {
        return res.status(404).json({ error: "Camp not found" });
      }
      
      const { staffId, action, role = 'clinician', payAmount } = req.body;
      
      if (!staffId || !action) {
        return res.status(400).json({ error: "Staff ID and action are required" });
      }
      
      if (action !== 'add' && action !== 'remove') {
        return res.status(400).json({ error: "Action must be either 'add' or 'remove'" });
      }
      
      // Check if staff exists
      const staffMember = await storage.getStaffById(staffId);
      if (!staffMember) {
        return res.status(404).json({ error: "Staff member not found" });
      }
      
      // Get current staff assignments
      const currentStaff = await storage.getCampStaff(campId);
      
      if (action === 'add') {
        // Create a new assignment 
        const staffAssignments = [...currentStaff, {
          staffId,
          role,
          payAmount
        }];
        
        // Use our bulk assignment method
        await storage.assignStaffToCamp(campId, staffAssignments);
        
        // Log the activity
        await storage.createActivity({
          type: 'UPDATE',
          content: `Added ${staffMember.name} to camp: ${existingCamp.name}`,
          userId: user.id,
          relatedId: campId,
          relatedType: 'CAMP'
        });
      } else {
        // Filter out the staff member being removed
        const staffAssignments = currentStaff
          .filter(staff => staff.staffId !== staffId)
          .map(staff => ({
            staffId: staff.staffId,
            role: staff.role,
            payAmount: staff.payAmount
          }));
        
        // Use our bulk assignment method
        await storage.assignStaffToCamp(campId, staffAssignments);
        
        // Log the activity
        await storage.createActivity({
          type: 'UPDATE',
          content: `Removed ${staffMember.name} from camp: ${existingCamp.name}`,
          userId: user.id,
          relatedId: campId,
          relatedType: 'CAMP'
        });
      }
      
      // Get the updated camp with its staff members
      const updatedCamp = await storage.getCampById(campId);
      const updatedStaff = await storage.getCampStaff(campId);
      
      res.status(200).json({ 
        camp: updatedCamp,
        staff: updatedStaff
      });
    } catch (error) {
      console.error(`Error assigning staff to camp:`, error);
      res.status(500).json({ error: "Failed to assign staff to camp" });
    }
  });

  // ======= FABRIC RESEARCH CENTER API ENDPOINTS =======
  
  // Get all fabric types
  app.get("/api/fabric-types", isAuthenticated, async (req, res) => {
    try {
      // Check if we need to filter by published status
      const publishedFilter = req.query.published;
      
      let fabricTypes;
      if (publishedFilter !== undefined) {
        // Convert string 'true'/'false' to boolean
        const isPublished = publishedFilter === 'true';
        fabricTypes = await storage.getFabricTypesByPublishedStatus(isPublished);
      } else {
        fabricTypes = await storage.getFabricTypes();
      }
      
      res.json({ data: fabricTypes });
    } catch (error: any) {
      console.error("Error fetching fabric types:", error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // Get a specific fabric type by ID
  app.get("/api/fabric-types/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid fabric type ID" });
      }
      
      const fabricType = await storage.getFabricTypeById(id);
      if (!fabricType) {
        return res.status(404).json({ error: "Fabric type not found" });
      }
      
      res.json({ data: fabricType });
    } catch (error: any) {
      console.error(`Error fetching fabric type:`, error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // Create a new fabric type
  app.post("/api/fabric-types", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as User;
      const validatedData = insertFabricTypeSchema.parse(req.body);
      
      // Add createdBy if not provided
      if (!validatedData.createdBy) {
        validatedData.createdBy = user.id;
      }
      
      const newFabricType = await storage.createFabricType(validatedData);
      
      // Log the activity
      await storage.createActivity({
        type: "CREATE",
        content: `Created new fabric type: ${newFabricType.name}`,
        userId: user.id,
        relatedId: newFabricType.id,
        relatedType: "FABRIC_TYPE"
      });
      
      res.status(201).json({ data: newFabricType });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        console.error("Error creating fabric type:", error);
        res.status(500).json({ error: error.message });
      }
    }
  });
  
  // Update a fabric type
  app.put("/api/fabric-types/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid fabric type ID" });
      }
      
      const user = req.user as User;
      const existingFabricType = await storage.getFabricTypeById(id);
      if (!existingFabricType) {
        return res.status(404).json({ error: "Fabric type not found" });
      }
      
      // Validate the update data
      const updates = req.body;
      
      // Perform the update
      const updatedFabricType = await storage.updateFabricType(id, updates);
      
      // Log the activity
      await storage.createActivity({
        type: "UPDATE",
        content: `Updated fabric type: ${updatedFabricType.name}`,
        userId: user.id,
        relatedId: updatedFabricType.id,
        relatedType: "FABRIC_TYPE"
      });
      
      res.json({ data: updatedFabricType });
    } catch (error: any) {
      console.error(`Error updating fabric type:`, error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // Delete a fabric type
  app.delete("/api/fabric-types/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid fabric type ID" });
      }
      
      const user = req.user as User;
      const fabricType = await storage.getFabricTypeById(id);
      if (!fabricType) {
        return res.status(404).json({ error: "Fabric type not found" });
      }
      
      // Delete the fabric type
      await storage.deleteFabricType(id);
      
      // Log the activity
      await storage.createActivity({
        type: "DELETE",
        content: `Deleted fabric type: ${fabricType.name}`,
        userId: user.id,
        relatedId: id,
        relatedType: "FABRIC_TYPE"
      });
      
      res.status(200).json({ success: true, message: "Fabric type deleted successfully" });
    } catch (error: any) {
      console.error(`Error deleting fabric type:`, error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // Get all fabric compatibility records
  app.get("/api/fabric-compatibilities", isAuthenticated, async (req, res) => {
    try {
      const fabricTypeId = req.query.fabricTypeId ? parseInt(req.query.fabricTypeId as string) : undefined;
      
      let compatibilities;
      if (fabricTypeId !== undefined && !isNaN(fabricTypeId)) {
        compatibilities = await storage.getFabricCompatibilitiesByFabricType(fabricTypeId);
      } else {
        compatibilities = await storage.getFabricCompatibilities();
      }
      
      res.json({ data: compatibilities });
    } catch (error: any) {
      console.error("Error fetching fabric compatibilities:", error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // Get a specific fabric compatibility by ID
  app.get("/api/fabric-compatibilities/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid compatibility ID" });
      }
      
      const compatibility = await storage.getFabricCompatibility(id);
      if (!compatibility) {
        return res.status(404).json({ error: "Fabric compatibility not found" });
      }
      
      res.json({ data: compatibility });
    } catch (error: any) {
      console.error(`Error fetching fabric compatibility:`, error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // Create a new fabric compatibility
  app.post("/api/fabric-compatibilities", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as User;
      const validatedData = insertFabricCompatibilitySchema.parse(req.body);
      
      // Add createdBy if not provided
      if (!validatedData.createdBy) {
        validatedData.createdBy = user.id;
      }
      
      const newCompatibility = await storage.createFabricCompatibility(validatedData);
      
      // Get associated fabric type name for activity logging
      const fabricType = await storage.getFabricTypeById(newCompatibility.fabricTypeId);
      const fabricTypeName = fabricType ? fabricType.name : 'Unknown';
      
      // Log the activity
      await storage.createActivity({
        type: "CREATE",
        content: `Added compatibility for ${fabricTypeName} with ${newCompatibility.productionMethod}`,
        userId: user.id,
        relatedId: newCompatibility.id,
        relatedType: "FABRIC_COMPATIBILITY"
      });
      
      res.status(201).json({ data: newCompatibility });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        console.error("Error creating fabric compatibility:", error);
        res.status(500).json({ error: error.message });
      }
    }
  });
  
  // Update a fabric compatibility
  app.put("/api/fabric-compatibilities/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid compatibility ID" });
      }
      
      const user = req.user as User;
      const existingCompatibility = await storage.getFabricCompatibility(id);
      if (!existingCompatibility) {
        return res.status(404).json({ error: "Fabric compatibility not found" });
      }
      
      // Validate the update data
      const updates = req.body;
      
      // Perform the update
      const updatedCompatibility = await storage.updateFabricCompatibility(id, updates);
      
      // Get associated fabric type name for activity logging
      const fabricType = await storage.getFabricTypeById(updatedCompatibility.fabricTypeId);
      const fabricTypeName = fabricType ? fabricType.name : 'Unknown';
      
      // Log the activity
      await storage.createActivity({
        type: "UPDATE",
        content: `Updated compatibility for ${fabricTypeName} with ${updatedCompatibility.productionMethod}`,
        userId: user.id,
        relatedId: updatedCompatibility.id,
        relatedType: "FABRIC_COMPATIBILITY"
      });
      
      res.json({ data: updatedCompatibility });
    } catch (error: any) {
      console.error(`Error updating fabric compatibility:`, error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // Delete a fabric compatibility
  app.delete("/api/fabric-compatibilities/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid compatibility ID" });
      }
      
      const user = req.user as User;
      const compatibility = await storage.getFabricCompatibility(id);
      if (!compatibility) {
        return res.status(404).json({ error: "Fabric compatibility not found" });
      }
      
      // Delete the compatibility record
      await storage.deleteFabricCompatibility(id);
      
      // Get associated fabric type name for activity logging
      const fabricType = await storage.getFabricTypeById(compatibility.fabricTypeId);
      const fabricTypeName = fabricType ? fabricType.name : 'Unknown';
      
      // Log the activity
      await storage.createActivity({
        type: "DELETE",
        content: `Deleted compatibility for ${fabricTypeName} with ${compatibility.productionMethod}`,
        userId: user.id,
        relatedId: id,
        relatedType: "FABRIC_COMPATIBILITY"
      });
      
      res.status(200).json({ success: true, message: "Fabric compatibility deleted successfully" });
    } catch (error: any) {
      console.error(`Error deleting fabric compatibility:`, error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // Sewing pattern routes
  
  // Get all sewing patterns
  app.get("/api/sewing-patterns", isAuthenticated, async (req, res) => {
    try {
      const patterns = await storage.getAllSewingPatterns();
      res.json({ data: patterns });
    } catch (error: any) {
      console.error("Error fetching sewing patterns:", error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // Get a specific sewing pattern by ID
  app.get("/api/sewing-patterns/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }
      
      const pattern = await storage.getSewingPatternById(id);
      
      if (!pattern) {
        return res.status(404).json({ error: "Sewing pattern not found" });
      }
      
      res.json({ data: pattern });
    } catch (error: any) {
      console.error("Error fetching sewing pattern:", error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // Create a new sewing pattern
  app.post("/api/sewing-patterns", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as User;
      
      // Validate the request body against the schema
      const validatedData = insertSewingPatternSchema.parse({
        ...req.body,
        createdBy: user.id
      });
      
      // Create the pattern
      const newPattern = await storage.createSewingPattern(validatedData);
      
      // Log the activity
      await storage.createActivity({
        type: "CREATE",
        content: `Created new sewing pattern: ${newPattern.name}`,
        userId: user.id,
        relatedId: newPattern.id,
        relatedType: "SEWING_PATTERN"
      });
      
      res.status(201).json({ data: newPattern });
    } catch (error: any) {
      console.error("Error creating sewing pattern:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });
  
  // Update a sewing pattern
  app.put("/api/sewing-patterns/:id", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as User;
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }
      
      // Check if the pattern exists
      const existingPattern = await storage.getSewingPatternById(id);
      
      if (!existingPattern) {
        return res.status(404).json({ error: "Sewing pattern not found" });
      }
      
      // Update the pattern
      const updatedPattern = await storage.updateSewingPattern(id, req.body);
      
      // Log the activity
      await storage.createActivity({
        type: "UPDATE",
        content: `Updated sewing pattern: ${updatedPattern.name}`,
        userId: user.id,
        relatedId: id,
        relatedType: "SEWING_PATTERN"
      });
      
      res.json({ data: updatedPattern });
    } catch (error: any) {
      console.error("Error updating sewing pattern:", error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // Delete a sewing pattern
  app.delete("/api/sewing-patterns/:id", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as User;
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }
      
      // Check if the pattern exists
      const existingPattern = await storage.getSewingPatternById(id);
      
      if (!existingPattern) {
        return res.status(404).json({ error: "Sewing pattern not found" });
      }
      
      // Delete the pattern
      await storage.deleteSewingPattern(id);
      
      // Log the activity
      await storage.createActivity({
        type: "DELETE",
        content: `Deleted sewing pattern: ${existingPattern.name}`,
        userId: user.id,
        relatedId: id,
        relatedType: "SEWING_PATTERN"
      });
      
      res.status(200).json({ success: true, message: "Sewing pattern deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting sewing pattern:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Endpoint to research fabric using Anthropic API
  app.post("/api/fabric-research", isAuthenticated, async (req, res) => {
    try {
      // Get the user for activity logging
      const user = req.user as User;
      
      // Validate request body
      // We expect something like { fabricType: string, properties: string[], region?: string, sustainabilityFocus?: boolean }
      const { fabricType, properties, region, sustainabilityFocus, detailLevel } = req.body;
      
      if (!fabricType) {
        return res.status(400).json({ error: "Fabric type is required" });
      }
      
      // Call the research function from the imported service
      const researchResult = await anthropicService.researchFabric({ 
        fabricType, 
        properties, 
        region, 
        sustainabilityFocus,
        detailLevel
      });
      
      // Log the activity
      await storage.createActivity({
        type: "RESEARCH",
        content: `Researched fabric: ${fabricType}`,
        userId: user.id,
        relatedType: "FABRIC_RESEARCH"
      });
      
      // Check if this fabric type already exists
      const existingFabricType = await storage.getFabricTypeByName(fabricType);
      
      // If it doesn't exist, create a new one with the research data
      if (!existingFabricType) {
        try {
          const newFabricType = await storage.createFabricType({
            name: researchResult.fabricType,
            description: researchResult.description,
            composition: researchResult.composition,
            createdBy: user.id,
            properties: researchResult.properties.map(p => ({
              name: p.name,
              value: p.value,
              unit: p.unit || null,
              description: p.description || null,
              technicalDetails: p.technicalDetails || null
            })),
            applications: researchResult.applications,
            careInstructions: researchResult.careInstructions,
            sustainabilityInfo: {
              environmentalImpact: researchResult.sustainabilityInfo.environmentalImpact,
              recyclability: researchResult.sustainabilityInfo.recyclability,
              certifications: researchResult.sustainabilityInfo.certifications,
              sustainabilityScore: researchResult.sustainabilityInfo.sustainabilityScore || null,
              ecologicalFootprint: researchResult.sustainabilityInfo.ecologicalFootprint || null
            },
            manufacturingCosts: researchResult.manufacturingCosts.map(mc => ({
              region: mc.region,
              baseUnitCost: mc.baseUnitCost,
              minOrderQuantity: mc.minOrderQuantity,
              currency: mc.currency,
              leadTime: mc.leadTime,
              notes: mc.notes || null
            })),
            alternatives: researchResult.alternatives,
            sources: researchResult.sources,
            visualDescriptionForMidjourney: researchResult.visualDescriptionForMidjourney || null,
            imageGenerationPrompt: researchResult.imageGenerationPrompt || null,
            specificRecommendations: researchResult.specificRecommendations || [],
            finishingTechniques: researchResult.finishingTechniques || []
          });
          
          // Log the creation
          await storage.createActivity({
            type: "CREATE",
            content: `Created new fabric type from research: ${newFabricType.name}`,
            userId: user.id,
            relatedId: newFabricType.id,
            relatedType: "FABRIC_TYPE"
          });
          
          // Add the new fabric type ID to the result
          researchResult.savedTypeId = newFabricType.id;
        } catch (err) {
          console.error("Error saving researched fabric type:", err);
          // We don't fail the whole request if saving fails
        }
      } else {
        // Add the existing fabric type ID to the result
        researchResult.savedTypeId = existingFabricType.id;
      }
      
      res.json({ data: researchResult });
    } catch (error: any) {
      console.error("Error researching fabric:", error);
      res.status(500).json({ error: error.message || "Failed to research fabric" });
    }
  });

  // Analyze fabric compatibility with production methods
  app.post("/api/fabric-compatibility-analysis", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as User;
      const { fabricType, productionMethod } = req.body;
      
      if (!fabricType || !productionMethod) {
        return res.status(400).json({ 
          error: "Both fabric type and production method are required" 
        });
      }
      
      // Call the analyze function from the imported service
      const analysisResult = await anthropicService.analyzeFabricCompatibility({
        fabricType,
        productionMethod
      });
      
      // Log the activity
      await storage.createActivity({
        type: "ANALYSIS",
        content: `Analyzed compatibility of ${fabricType} with ${productionMethod}`,
        userId: user.id,
        relatedType: "FABRIC_COMPATIBILITY"
      });
      
      // If compatible and we have a fabric type in the DB, create a compatibility record
      if (analysisResult.compatible) {
        const existingFabricType = await storage.getFabricTypeByName(fabricType);
        if (existingFabricType) {
          try {
            const newCompatibility = await storage.createFabricCompatibility({
              fabricTypeId: existingFabricType.id,
              productionMethod,
              isCompatible: true,
              alternatives: analysisResult.alternatives || [],
              reasons: analysisResult.reasons || [],
              createdBy: user.id
            });
            
            // Add the saved compatibility record ID to the result
            analysisResult.savedCompatibilityId = newCompatibility.id;
          } catch (err) {
            console.error("Error saving compatibility record:", err);
            // We don't fail the whole request if saving fails
          }
        }
      }
      
      res.json({ data: analysisResult });
    } catch (error: any) {
      console.error("Error analyzing fabric compatibility:", error);
      res.status(500).json({ error: error.message || "Failed to analyze compatibility" });
    }
  });

  // Suggest fabrics based on product requirements
  // Pattern research endpoint using Anthropic API
  app.post("/api/pattern-research", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as User;
      
      // Validate request body
      const { name, type, description } = req.body;
      
      if (!name || !type) {
        return res.status(400).json({ error: "Pattern name and type are required" });
      }
      
      // Call the pattern research function from the anthropic service
      const researchResult = await anthropicService.researchPattern(
        name,
        type,
        description
      );
      
      // Log the activity
      await storage.createActivity({
        type: "RESEARCH",
        content: `Researched pattern: ${name} (${type})`,
        userId: user.id,
        relatedType: "PATTERN_RESEARCH"
      });
      
      // Check if we should save this to the database
      if (req.body.saveToDatabase) {
        try {
          // Save the pattern to the database
          const newPattern = await storage.createSewingPattern({
            name: researchResult.name,
            type: researchResult.type,
            description: researchResult.description,
            complexity: researchResult.complexity,
            measurements: researchResult.measurements,
            materialRequirements: researchResult.materialRequirements,
            suitableFabrics: researchResult.suitableFabrics,
            instructions: researchResult.instructions || [],
            tips: researchResult.tips || [],
            referenceImageUrl: researchResult.referenceImageUrl || null,
            createdBy: user.id
          });
          
          // Log the creation
          await storage.createActivity({
            type: "CREATE",
            content: `Created new sewing pattern from research: ${newPattern.name}`,
            userId: user.id,
            relatedId: newPattern.id,
            relatedType: "SEWING_PATTERN"
          });
          
          // Add the new pattern ID to the result
          researchResult.savedPatternId = newPattern.id;
        } catch (err) {
          console.error("Error saving researched pattern:", err);
          // We don't fail the whole request if saving fails
        }
      }
      
      res.json({ data: researchResult });
    } catch (error: any) {
      console.error("Error researching pattern:", error);
      res.status(500).json({ error: error.message || "Failed to research pattern" });
    }
  });
  
  app.post("/api/fabric-suggestions", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as User;
      const { productType, properties, sustainabilityRequired, budget, region } = req.body;
      
      if (!productType || !properties || properties.length === 0) {
        return res.status(400).json({ 
          error: "Product type and at least one property are required" 
        });
      }
      
      // Call the suggest function from the imported service
      const suggestionsResult = await anthropicService.suggestFabrics({
        productType,
        properties,
        pricePoint: budget || "mid-range",
        seasonality: region === "summer" ? "summer" : (region === "winter" ? "winter" : "all-season"),
        sustainability: !!sustainabilityRequired
      });
      
      // Log the activity
      await storage.createActivity({
        type: "SUGGESTION",
        content: `Requested fabric suggestions for ${productType}`,
        userId: user.id,
        relatedType: "FABRIC_SUGGESTION"
      });
      
      res.json({ data: suggestionsResult });
    } catch (error: any) {
      console.error("Error getting fabric suggestions:", error);
      res.status(500).json({ error: error.message || "Failed to generate fabric suggestions" });
    }
  });

  // Product Suggestions API routes
  // Get all product suggestions
  app.get("/api/product-suggestions", isAuthenticated, async (req, res) => {
    try {
      const suggestions = await storage.getProductSuggestions();
      res.json({ data: suggestions });
    } catch (error: any) {
      console.error("Error fetching product suggestions:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get a single product suggestion by ID
  app.get("/api/product-suggestions/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }
      
      const suggestion = await storage.getProductSuggestionById(id);
      
      if (!suggestion) {
        return res.status(404).json({ error: "Product suggestion not found" });
      }
      
      res.json({ data: suggestion });
    } catch (error: any) {
      console.error("Error fetching product suggestion:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Create a new product suggestion
  app.post("/api/product-suggestions", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as User;
      
      // Validate the request body against the schema
      const validatedData = insertProductSuggestionSchema.parse({
        ...req.body,
        createdBy: user.id
      });
      
      // Create the suggestion
      const newSuggestion = await storage.createProductSuggestion(validatedData);
      
      // Log the activity
      await storage.createActivity({
        type: "CREATE",
        content: `Created new product suggestion: ${newSuggestion.name}`,
        userId: user.id,
        relatedId: newSuggestion.id,
        relatedType: "PRODUCT_SUGGESTION"
      });
      
      res.status(201).json({ data: newSuggestion });
    } catch (error: any) {
      console.error("Error creating product suggestion:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  // Update a product suggestion
  app.put("/api/product-suggestions/:id", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as User;
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }
      
      // Check if the suggestion exists
      const existingSuggestion = await storage.getProductSuggestionById(id);
      
      if (!existingSuggestion) {
        return res.status(404).json({ error: "Product suggestion not found" });
      }
      
      // Update the suggestion
      const updatedSuggestion = await storage.updateProductSuggestion(id, req.body);
      
      // Log the activity
      await storage.createActivity({
        type: "UPDATE",
        content: `Updated product suggestion: ${updatedSuggestion.name}`,
        userId: user.id,
        relatedId: id,
        relatedType: "PRODUCT_SUGGESTION"
      });
      
      res.json({ data: updatedSuggestion });
    } catch (error: any) {
      console.error("Error updating product suggestion:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Delete a product suggestion
  app.delete("/api/product-suggestions/:id", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as User;
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }
      
      // Check if the suggestion exists
      const existingSuggestion = await storage.getProductSuggestionById(id);
      
      if (!existingSuggestion) {
        return res.status(404).json({ error: "Product suggestion not found" });
      }
      
      // Delete the suggestion
      await storage.deleteProductSuggestion(id);
      
      // Log the activity
      await storage.createActivity({
        type: "DELETE",
        content: `Deleted product suggestion: ${existingSuggestion.name}`,
        userId: user.id,
        relatedId: id,
        relatedType: "PRODUCT_SUGGESTION"
      });
      
      res.status(200).json({ success: true, message: "Product suggestion deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting product suggestion:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Configure multer for file uploads
  // In ESM, __dirname is not available, so we need to construct the path differently
  const uploadDir = path.join(process.cwd(), 'uploads');
  // Ensure the uploads directory exists
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const storage_engine = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const fileExt = path.extname(file.originalname);
      cb(null, file.fieldname + '-' + uniqueSuffix + fileExt);
    }
  });

  const upload = multer({ 
    storage: storage_engine,
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB max file size
    },
    fileFilter: (req, file, cb) => {
      // Accept common document formats
      const validFileTypes = ['.pdf', '.doc', '.docx', '.txt', '.rtf', '.ppt', '.pptx', '.xls', '.xlsx', '.csv'];
      const ext = path.extname(file.originalname).toLowerCase();
      if (validFileTypes.includes(ext)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Only PDF, Word documents, text files, PowerPoint, Excel and CSV files are allowed.') as any);
      }
    }
  });

  // AI Training Data Endpoints
  app.get("/api/ai-training-data", isAuthenticated, async (req, res) => {
    try {
      const data = await storage.getAiTrainingData();
      res.json({ data });
    } catch (error: any) {
      console.error("Error fetching AI training data:", error);
      res.status(500).json({ error: error.message || "Failed to fetch AI training data" });
    }
  });

  // Upload a file for AI training
  app.post("/api/ai-training-data/file", isAuthenticated, upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const user = req.user as User;
      const { dataType, description } = req.body;

      if (!dataType) {
        return res.status(400).json({ error: "Data type is required (fabric, pattern, measurement, or product)" });
      }

      const data = await storage.addAiTrainingDataFile({
        title: req.file.originalname,
        description: description || req.file.originalname,
        dataType,
        filePath: req.file.path,
        sourceUrl: null,
        userId: user.id,
        status: 'processing',
        errorMessage: null,
      });

      // In a real implementation, you would queue this file for processing
      // For now, we'll just update the status after a short delay
      setTimeout(async () => {
        try {
          await storage.updateAiTrainingDataStatus(data.id, 'completed');
        } catch (error) {
          console.error("Error updating training data status:", error);
        }
      }, 3000);

      res.status(201).json({ 
        success: true, 
        data,
        message: "File uploaded successfully and queued for processing" 
      });
    } catch (error: any) {
      console.error("Error uploading AI training file:", error);
      res.status(500).json({ error: error.message || "Failed to upload training file" });
    }
  });

  // Add a URL for AI training
  app.post("/api/ai-training-data/url", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as User;
      const { url, dataType, title, description } = req.body;

      if (!url) {
        return res.status(400).json({ error: "URL is required" });
      }

      if (!dataType) {
        return res.status(400).json({ error: "Data type is required (fabric, pattern, measurement, or product)" });
      }

      const data = await storage.addAiTrainingDataUrl({
        title: title || url,
        description: description || url,
        dataType,
        filePath: null,
        sourceUrl: url,
        userId: user.id,
        status: 'processing',
        errorMessage: null,
      });

      // In a real implementation, you would queue this URL for processing
      // For now, we'll just update the status after a short delay
      setTimeout(async () => {
        try {
          await storage.updateAiTrainingDataStatus(data.id, 'completed');
        } catch (error) {
          console.error("Error updating training data status:", error);
        }
      }, 3000);

      res.status(201).json({ 
        success: true, 
        data,
        message: "URL added successfully and queued for processing" 
      });
    } catch (error: any) {
      console.error("Error adding AI training URL:", error);
      res.status(500).json({ error: error.message || "Failed to add training URL" });
    }
  });

  // Delete training data
  app.delete("/api/ai-training-data/:id", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as User;
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid training data ID" });
      }
      
      await storage.deleteAiTrainingData(id);
      
      // Log the activity
      await storage.createActivity({
        type: "DELETE",
        content: `Deleted AI training data record (ID: ${id})`,
        userId: user.id,
        relatedId: id,
        relatedType: "AI_TRAINING_DATA"
      });
      
      res.status(200).json({ success: true, message: "Training data deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting AI training data:", error);
      res.status(500).json({ error: error.message || "Failed to delete AI training data" });
    }
  });

  // Camp Registration Tier routes
  app.get("/api/camp/:campId/registration-tiers", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const campId = parseInt(req.params.campId);
      if (isNaN(campId)) {
        return res.status(400).json({ error: "Invalid camp ID" });
      }
      
      const tiers = await storage.getRegistrationTiersByCampId(campId);
      res.json({ data: tiers });
    } catch (error: any) {
      console.error("Error fetching registration tiers:", error);
      res.status(500).json({ error: error.message });
    }
  });
  
  app.post("/api/camp/:campId/registration-tiers", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const user = req.user as User;
      const isUserAdmin = user.role === ROLES.ADMIN;
      
      if (!isUserAdmin) {
        return res.status(403).json({ error: "Only admins can create registration tiers" });
      }
      
      const campId = parseInt(req.params.campId);
      if (isNaN(campId)) {
        return res.status(400).json({ error: "Invalid camp ID" });
      }
      
      // Validate the tier data
      const tierData = insertCampRegistrationTierSchema.parse({
        ...req.body,
        campId
      });
      
      // Create the tier
      const tier = await storage.createRegistrationTier(tierData);
      
      res.status(201).json({ data: tier });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        console.error("Error creating registration tier:", error);
        res.status(500).json({ error: error.message });
      }
    }
  });
  
  app.put("/api/registration-tiers/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const user = req.user as User;
      const isUserAdmin = user.role === ROLES.ADMIN;
      
      if (!isUserAdmin) {
        return res.status(403).json({ error: "Only admins can update registration tiers" });
      }
      
      const tierId = parseInt(req.params.id);
      if (isNaN(tierId)) {
        return res.status(400).json({ error: "Invalid tier ID" });
      }
      
      // Update the tier
      const updatedTier = await storage.updateRegistrationTier(tierId, req.body);
      
      res.json({ data: updatedTier });
    } catch (error: any) {
      console.error("Error updating registration tier:", error);
      res.status(500).json({ error: error.message });
    }
  });
  
  app.delete("/api/registration-tiers/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const user = req.user as User;
      const isUserAdmin = user.role === ROLES.ADMIN;
      
      if (!isUserAdmin) {
        return res.status(403).json({ error: "Only admins can delete registration tiers" });
      }
      
      const tierId = parseInt(req.params.id);
      if (isNaN(tierId)) {
        return res.status(400).json({ error: "Invalid tier ID" });
      }
      
      // Delete the tier
      await storage.deleteRegistrationTier(tierId);
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting registration tier:", error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // Camp Registration routes
  app.get("/api/camp/:campId/registrations", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const campId = parseInt(req.params.campId);
      if (isNaN(campId)) {
        return res.status(400).json({ error: "Invalid camp ID" });
      }
      
      const registrations = await storage.getRegistrationsByCampId(campId);
      res.json({ data: registrations });
    } catch (error: any) {
      console.error("Error fetching camp registrations:", error);
      res.status(500).json({ error: error.message });
    }
  });
  
  app.get("/api/registrations/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const registrationId = parseInt(req.params.id);
      if (isNaN(registrationId)) {
        return res.status(400).json({ error: "Invalid registration ID" });
      }
      
      const registration = await storage.getRegistrationById(registrationId);
      if (!registration) {
        return res.status(404).json({ error: "Registration not found" });
      }
      
      // Get related communications
      const communications = await storage.getCommunicationsByRegistrationId(registrationId);
      
      res.json({ 
        data: {
          ...registration,
          communications
        }
      });
    } catch (error: any) {
      console.error("Error fetching registration details:", error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // Manual registration entry (for in-person registrations or phone registrations)
  app.post("/api/camp/:campId/registrations", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const campId = parseInt(req.params.campId);
      if (isNaN(campId)) {
        return res.status(400).json({ error: "Invalid camp ID" });
      }
      
      // Validate registration data
      const registrationData = insertCampRegistrationSchema.parse({
        ...req.body,
        campId,
        source: req.body.source || 'manual', // Set source to manual if not provided
        registrationStatus: 'confirmed',      // Manually entered registrations are confirmed automatically
      });
      
      // Create the registration
      const registration = await storage.createRegistration(registrationData);
      
      // Create communication entry for manual registration
      await storage.createRegistrationCommunication({
        registrationId: registration.id,
        type: 'system',
        status: 'sent',
        content: `Registration manually entered by ${req.user?.username || 'admin'}`,
      });
      
      res.status(201).json({ data: registration });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        console.error("Error creating registration:", error);
        res.status(500).json({ error: error.message });
      }
    }
  });
  
  app.put("/api/registrations/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const registrationId = parseInt(req.params.id);
      if (isNaN(registrationId)) {
        return res.status(400).json({ error: "Invalid registration ID" });
      }
      
      // Update the registration
      const updatedRegistration = await storage.updateRegistration(registrationId, req.body);
      
      res.json({ data: updatedRegistration });
    } catch (error: any) {
      console.error("Error updating registration:", error);
      res.status(500).json({ error: error.message });
    }
  });
  
  app.delete("/api/registrations/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const user = req.user as User;
      const isUserAdmin = user.role === ROLES.ADMIN;
      
      if (!isUserAdmin) {
        return res.status(403).json({ error: "Only admins can delete registrations" });
      }
      
      const registrationId = parseInt(req.params.id);
      if (isNaN(registrationId)) {
        return res.status(400).json({ error: "Invalid registration ID" });
      }
      
      // Delete the registration
      await storage.deleteRegistration(registrationId);
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting registration:", error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // Registration Communication routes
  app.post("/api/registrations/:id/communications", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const registrationId = parseInt(req.params.id);
      if (isNaN(registrationId)) {
        return res.status(400).json({ error: "Invalid registration ID" });
      }
      
      // Validate communication data
      const communicationData = insertRegistrationCommunicationSchema.parse({
        ...req.body,
        registrationId,
        status: req.body.status || 'pending',
      });
      
      // Create the communication
      const communication = await storage.createRegistrationCommunication(communicationData);
      
      res.status(201).json({ data: communication });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        console.error("Error creating registration communication:", error);
        res.status(500).json({ error: error.message });
      }
    }
  });
  
  // Shopify API Integration for Registration Import
  app.post("/api/camp/:campId/import-shopify-orders", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const user = req.user as User;
      const isUserAdmin = user.role === ROLES.ADMIN;
      
      if (!isUserAdmin) {
        return res.status(403).json({ error: "Only admins can import Shopify orders" });
      }
      
      const campId = parseInt(req.params.campId);
      if (isNaN(campId)) {
        return res.status(400).json({ error: "Invalid camp ID" });
      }
      
      // For security, we'll make a clean object with just the fields we need
      const shopifyCredentials = {
        shopName: req.body.shopName,
        apiKey: req.body.apiKey,
        accessToken: req.body.accessToken
      };
      
      // Validate basic Shopify credentials
      if (!shopifyCredentials.shopName || !shopifyCredentials.apiKey || !shopifyCredentials.accessToken) {
        return res.status(400).json({ error: "Missing required Shopify API credentials" });
      }
      
      // Get the date range for orders if provided
      const dateFrom = req.body.dateFrom || null;
      const dateTo = req.body.dateTo || null;
      
      // Set up base Shopify API URL
      const shopifyBaseUrl = `https://${shopifyCredentials.shopName}.myshopify.com/admin/api/2023-10`;
      
      // Construct the query parameters for the Shopify API request
      let orderParams = new URLSearchParams({
        status: 'any',
        limit: '250' // Maximum allowed by Shopify
      });
      
      // Add date filters if provided
      if (dateFrom) {
        orderParams.append('created_at_min', new Date(dateFrom).toISOString());
      }
      if (dateTo) {
        orderParams.append('created_at_max', new Date(dateTo).toISOString());
      }
      
      // Set up product ID filter if provided
      if (req.body.productId) {
        orderParams.append('product_id', req.body.productId);
      }
      
      // Get registration tiers for this camp to map from Shopify products
      const registrationTiers = await storage.getRegistrationTiersByCampId(campId);
      
      // Check if there are tiers with Shopify product IDs
      const tiersWithProductIds = registrationTiers.filter(tier => tier.shopifyProductId);
      if (tiersWithProductIds.length === 0) {
        return res.status(400).json({ 
          error: "No registration tiers with Shopify product IDs found for this camp",
          message: "Please configure Shopify product IDs in your registration tiers first"
        });
      }
      
      // Prepare to track results
      const importResults = {
        totalOrders: 0,
        newRegistrations: 0,
        updatedRegistrations: 0,
        skippedOrders: 0,
        errors: [] as string[]
      };
      
      try {
        // Make API request to Shopify
        const options = {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': shopifyCredentials.accessToken
          }
        };
        
        const apiUrl = `${shopifyBaseUrl}/orders.json?${orderParams.toString()}`;
        console.log(`Fetching orders from Shopify API: ${apiUrl}`);
        
        const response = await fetch(apiUrl, options);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Shopify API error: ${response.status} ${response.statusText}`, errorText);
          return res.status(response.status).json({ 
            error: "Error from Shopify API", 
            details: errorText
          });
        }
        
        const data = await response.json();
        const orders = data.orders || [];
        importResults.totalOrders = orders.length;
        
        // Process each order
        for (const order of orders) {
          try {
            // Skip orders without line items
            if (!order.line_items || !order.line_items.length) {
              importResults.skippedOrders++;
              continue;
            }
            
            // Check if we already have this order in our database
            const existingRegistration = await storage.getRegistrationsByShopifyOrderId(order.id.toString());
            
            // For each line item, check if it matches one of our registration tiers
            for (const lineItem of order.line_items) {
              // Find matching tier by product ID
              const matchingTier = registrationTiers.find(tier => 
                tier.shopifyProductId === lineItem.product_id.toString() ||
                tier.shopifyVariantId === lineItem.variant_id.toString()
              );
              
              if (!matchingTier) {
                // Skip items that don't match any of our registration tiers
                continue;
              }
              
              // Extract customer information
              const customer = order.customer || {};
              const shippingAddress = order.shipping_address || customer.default_address || {};
              
              // Extract custom checkout fields if they exist (depends on Shopify store setup)
              const customAttributes = {};
              if (order.note_attributes && Array.isArray(order.note_attributes)) {
                order.note_attributes.forEach(attr => {
                  if (attr.name && attr.value) {
                    customAttributes[attr.name] = attr.value;
                  }
                });
              }
              
              const registrationData: InsertCampRegistration = {
                campId,
                tierId: matchingTier.id,
                firstName: customer.first_name || shippingAddress.first_name || '',
                lastName: customer.last_name || shippingAddress.last_name || '',
                email: customer.email || order.contact_email || '',
                phone: customer.phone || shippingAddress.phone || '',
                address: shippingAddress.address1 || '',
                city: shippingAddress.city || '',
                state: shippingAddress.province || shippingAddress.province_code || '',
                zipCode: shippingAddress.zip || '',
                // Use custom attributes if available
                dateOfBirth: customAttributes['date_of_birth'] || customAttributes['dob'] || '',
                gender: customAttributes['gender'] || '',
                school: customAttributes['school'] || '',
                grade: customAttributes['grade'] || '',
                weightClass: customAttributes['weight_class'] || '',
                shirtSize: customAttributes['shirt_size'] || lineItem.variant_title || '',
                // Emergency contact info if collected
                emergencyContactName: customAttributes['emergency_contact_name'] || '',
                emergencyContactPhone: customAttributes['emergency_contact_phone'] || '',
                // Allergies and special requirements
                allergies: customAttributes['allergies'] || '',
                specialRequirements: customAttributes['special_requirements'] || order.note || '',
                // Record all Shopify info
                shopifyOrderId: order.id.toString(),
                registrationStatus: 'confirmed',
                paymentStatus: order.financial_status === 'paid' ? 'paid' : 'pending',
                paymentAmount: lineItem.price,
                paymentDate: order.processed_at ? new Date(order.processed_at) : undefined,
                source: 'shopify',
                notes: `Imported from Shopify. Order #${order.name}. ${order.note || ''}`
              };
              
              if (existingRegistration) {
                // Update existing registration
                await storage.updateRegistration(existingRegistration.id, registrationData);
                importResults.updatedRegistrations++;
                
                // Add communication about update
                await storage.createRegistrationCommunication({
                  registrationId: existingRegistration.id,
                  type: 'system',
                  status: 'sent',
                  subject: 'Shopify Order Updated',
                  content: `Registration updated from Shopify order #${order.name} (${order.id})`
                });
              } else {
                // Create new registration
                const registration = await storage.createRegistration(registrationData);
                importResults.newRegistrations++;
                
                // Add communication about new registration
                await storage.createRegistrationCommunication({
                  registrationId: registration.id,
                  type: 'system',
                  status: 'sent',
                  subject: 'New Shopify Order',
                  content: `New registration created from Shopify order #${order.name} (${order.id})`
                });
              }
            }
          } catch (orderError: any) {
            console.error(`Error processing Shopify order ${order.id}:`, orderError);
            importResults.errors.push(`Order #${order.name || order.id}: ${orderError.message}`);
          }
        }
        
        res.json({ data: importResults });
      } catch (apiError: any) {
        console.error("Error calling Shopify API:", apiError);
        res.status(500).json({ 
          error: "Error calling Shopify API", 
          message: apiError.message 
        });
      }
    } catch (error: any) {
      console.error("Error importing Shopify orders:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Camp Templates API Routes
  app.get("/api/camp-templates", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      // Fetch all camp templates
      const templates = await db.query.camps.findMany({
        where: eq(camps.type, 'template')
      });
      
      res.json({ data: templates });
    } catch (error) {
      console.error("Error fetching camp templates:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/camp-templates/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const templateId = parseInt(req.params.id);
      
      // Fetch template details
      const template = await db.query.camps.findFirst({
        where: and(
          eq(camps.id, templateId),
          eq(camps.type, 'template')
        )
      });
      
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }
      
      res.json({ data: template });
    } catch (error) {
      console.error("Error fetching template:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/camp-templates", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const templateData = {
        ...req.body,
        type: 'template',
        createdBy: req.user.id
      };
      
      // Create new template
      const result = await db.insert(camps).values(templateData).returning();
      
      res.status(201).json({ data: result[0] });
    } catch (error) {
      console.error("Error creating template:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Convert an existing camp to a template
  app.post("/api/camp-templates/from-camp/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const campId = parseInt(req.params.id);
      
      // Get the source camp
      const sourceCamp = await db.query.camps.findFirst({
        where: eq(camps.id, campId)
      });
      
      if (!sourceCamp) {
        return res.status(404).json({ error: "Camp not found" });
      }
      
      // Create template data from the camp
      const templateData = {
        name: req.body.name || `${sourceCamp.name} Template`,
        description: sourceCamp.description,
        type: 'template',
        category: sourceCamp.category,
        targetAgeGroup: sourceCamp.targetAgeGroup,
        targetParticipants: sourceCamp.targetParticipants,
        registrationPrice: sourceCamp.registrationPrice,
        includesSwag: sourceCamp.includesSwag,
        duration: req.body.duration || calculateDuration(sourceCamp.startDate, sourceCamp.endDate),
        requiresMeals: sourceCamp.requiresMeals,
        requiresAccommodation: sourceCamp.requiresAccommodation,
        requiresTransportation: sourceCamp.requiresTransportation,
        specialRequirements: sourceCamp.specialRequirements,
        notes: sourceCamp.notes,
        createdBy: req.user.id
      };
      
      // Create the template
      const result = await db.insert(camps).values(templateData).returning();
      const newTemplateId = result[0].id;
      
      // Copy agenda items if they exist
      try {
        const agendaItems = await db.query.campAgendaItems.findMany({
          where: eq(campAgendaItems.campId, campId)
        });
        
        if (agendaItems.length > 0) {
          const templateAgendaItems = agendaItems.map(item => ({
            campId: newTemplateId,
            day: item.day,
            title: item.title,
            startTime: item.startTime,
            endTime: item.endTime,
            description: item.description,
            location: item.location,
            type: item.type,
            staffAssigned: item.staffAssigned
          }));
          
          await db.insert(campAgendaItems).values(templateAgendaItems);
        }
      } catch (err) {
        console.error("Error copying agenda items:", err);
        // Continue with template creation even if agenda copy fails
      }
      
      // Copy staff requirements if they exist
      try {
        const staffAssignments = await db.query.campStaff.findMany({
          where: eq(campStaff.campId, campId)
        });
        
        if (staffAssignments.length > 0) {
          const templateStaffRequirements = staffAssignments.map(staff => ({
            campId: newTemplateId,
            role: staff.role,
            count: 1, // Default to 1 for each role
            name: null, // Don't copy specific names
            email: null,
            phone: null,
            notes: staff.notes,
            required: true
          }));
          
          await db.insert(campStaff).values(templateStaffRequirements);
        }
      } catch (err) {
        console.error("Error copying staff requirements:", err);
        // Continue with template creation even if staff copy fails
      }
      
      res.status(201).json({ data: result[0] });
    } catch (error) {
      console.error("Error creating template from camp:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Create a camp from a template
  app.post("/api/camps/from-template/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const templateId = parseInt(req.params.id);
      
      // Get the template
      const template = await db.query.camps.findFirst({
        where: and(
          eq(camps.id, templateId),
          eq(camps.type, 'template')
        )
      });
      
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }
      
      // Create new camp data from template and request body
      const campData = {
        ...req.body,
        type: req.body.type || template.category === 'tournament' ? 'tournament' : 'camp',
        category: req.body.category || template.category,
        targetAgeGroup: req.body.targetAgeGroup || template.targetAgeGroup,
        targetParticipants: req.body.targetParticipants || template.targetParticipants,
        registrationPrice: req.body.registrationPrice || template.registrationPrice,
        includesSwag: req.body.includesSwag !== undefined ? req.body.includesSwag : template.includesSwag,
        requiresMeals: req.body.requiresMeals !== undefined ? req.body.requiresMeals : template.requiresMeals,
        requiresAccommodation: req.body.requiresAccommodation !== undefined ? req.body.requiresAccommodation : template.requiresAccommodation,
        requiresTransportation: req.body.requiresTransportation !== undefined ? req.body.requiresTransportation : template.requiresTransportation,
        specialRequirements: req.body.specialRequirements || template.specialRequirements,
        notes: req.body.notes || template.notes,
        createdBy: req.user.id,
        status: 'planning'
      };
      
      // Create the new camp
      const result = await db.insert(camps).values(campData).returning();
      const newCampId = result[0].id;
      
      // Copy agenda template items if they exist
      try {
        const agendaItems = await db.query.campAgendaItems.findMany({
          where: eq(campAgendaItems.campId, templateId)
        });
        
        if (agendaItems.length > 0) {
          const newAgendaItems = agendaItems.map(item => ({
            campId: newCampId,
            day: item.day,
            title: item.title,
            startTime: item.startTime,
            endTime: item.endTime,
            description: item.description,
            location: item.location,
            type: item.type,
            staffAssigned: item.staffAssigned
          }));
          
          await db.insert(campAgendaItems).values(newAgendaItems);
        }
      } catch (err) {
        console.error("Error copying agenda items from template:", err);
        // Continue with camp creation even if agenda copy fails
      }
      
      // Copy staff requirements if they exist
      try {
        const staffRequirements = await db.query.campStaff.findMany({
          where: eq(campStaff.campId, templateId)
        });
        
        if (staffRequirements.length > 0) {
          const newStaffRequirements = staffRequirements.map(req => ({
            campId: newCampId,
            role: req.role,
            count: req.count || 1,
            name: null, // Don't copy specific names
            email: null,
            phone: null,
            notes: req.notes,
            required: true
          }));
          
          await db.insert(campStaff).values(newStaffRequirements);
        }
      } catch (err) {
        console.error("Error copying staff requirements from template:", err);
        // Continue with camp creation even if staff copy fails
      }
      
      // Update template usage statistics
      try {
        await db.update(camps)
          .set({ 
            useCount: (template.useCount || 0) + 1,
            lastUsed: new Date().toISOString()
          })
          .where(eq(camps.id, templateId));
      } catch (err) {
        console.error("Error updating template usage stats:", err);
        // Continue even if stats update fails
      }
      
      // Create an activity record for the camp creation
      try {
        await createActivity({
          userId: req.user.id,
          type: 'camp_created',
          content: `Created camp "${campData.name}" from template "${template.name}"`,
          objectType: 'camp',
          objectId: newCampId
        });
      } catch (err) {
        console.error("Error creating activity record:", err);
        // Continue even if activity creation fails
      }
      
      res.status(201).json({ data: result[0] });
    } catch (error) {
      console.error("Error creating camp from template:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Clinicians/Staff API Routes
  app.get("/api/camps/:id/clinicians", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const campId = parseInt(req.params.id);
      
      // Fetch camp to verify it exists
      const camp = await db.query.camps.findFirst({
        where: eq(camps.id, campId)
      });
      
      if (!camp) {
        return res.status(404).json({ error: "Camp not found" });
      }
      
      // Fetch all assigned clinicians for this camp
      const assignments = await db.query.campStaffAssignments.findMany({
        where: and(
          eq(campStaffAssignments.campId, campId),
          eq(campStaffAssignments.role, 'clinician')
        )
      });
      
      // Get the staff IDs from assignments
      const staffIds = assignments.map(a => a.staffId);
      
      // Fetch detailed clinician information
      let clinicians = [];
      if (staffIds.length > 0) {
        clinicians = await db.query.staffMembers.findMany({
          where: sql`${staffMembers.id} IN (${staffIds.join(',')})`
        });
        
        // Merge assignment data with clinician data
        clinicians = clinicians.map(clinician => {
          const assignment = assignments.find(a => a.staffId === clinician.id);
          return {
            ...clinician,
            payAmount: assignment?.payAmount || 0
          };
        });
      }
      
      res.json({ data: clinicians });
    } catch (error) {
      console.error("Error fetching clinicians:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/camps/:id/clinicians", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const campId = parseInt(req.params.id);
      
      // Verify camp exists
      const camp = await db.query.camps.findFirst({
        where: eq(camps.id, campId)
      });
      
      if (!camp) {
        return res.status(404).json({ error: "Camp not found" });
      }
      
      // First create the staff member
      const staffData = {
        ...req.body,
        type: 'camp',
        specialty: 'clinician',
        status: req.body.status || 'pending'
      };
      
      const staffResult = await db.insert(staffMembers).values(staffData).returning();
      const newStaff = staffResult[0];
      
      // Then create the assignment
      const assignmentResult = await db.insert(campStaffAssignments).values({
        campId,
        staffId: newStaff.id,
        role: 'clinician',
        payAmount: req.body.hourlyRate || 0
      }).returning();
      
      // Return the combined data
      res.status(201).json({
        ...newStaff,
        assignment: assignmentResult[0]
      });
    } catch (error) {
      console.error("Error adding clinician:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/camps/:campId/clinicians/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const campId = parseInt(req.params.campId);
      const clinicianId = parseInt(req.params.id);
      
      // Update clinician data
      await db.update(staffMembers)
        .set(req.body)
        .where(eq(staffMembers.id, clinicianId));
      
      // If hourlyRate is provided, update the assignment as well
      if (req.body.hourlyRate !== undefined) {
        await db.update(campStaffAssignments)
          .set({ payAmount: req.body.hourlyRate })
          .where(and(
            eq(campStaffAssignments.campId, campId),
            eq(campStaffAssignments.staffId, clinicianId)
          ));
      }
      
      // Fetch updated clinician data
      const updatedClinician = await db.query.staffMembers.findFirst({
        where: eq(staffMembers.id, clinicianId)
      });
      
      res.json({ data: updatedClinician });
    } catch (error) {
      console.error("Error updating clinician:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/camps/:campId/clinicians/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const campId = parseInt(req.params.campId);
      const clinicianId = parseInt(req.params.id);
      
      // First delete the assignment
      await db.delete(campStaffAssignments)
        .where(and(
          eq(campStaffAssignments.campId, campId),
          eq(campStaffAssignments.staffId, clinicianId)
        ));
      
      // Then delete the clinician
      await db.delete(staffMembers)
        .where(eq(staffMembers.id, clinicianId));
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting clinician:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Clinician availability and contract endpoints
  app.put("/api/camps/:campId/clinicians/:id/availability", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const clinicianId = parseInt(req.params.id);
      const { availability } = req.body;
      
      // Update clinician with new availability data
      await db.update(staffMembers)
        .set({ 
          availability: JSON.stringify(availability),
          updatedAt: new Date()
        })
        .where(eq(staffMembers.id, clinicianId));
      
      // Get updated clinician data
      const updatedClinician = await db.query.staffMembers.findFirst({
        where: eq(staffMembers.id, clinicianId)
      });
      
      res.json({ data: updatedClinician });
    } catch (error) {
      console.error("Error updating clinician availability:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/camps/:campId/clinicians/:id/contract", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const campId = parseInt(req.params.campId);
      const clinicianId = parseInt(req.params.id);
      const contractData = req.body;
      
      // Update the clinician contract info
      await db.update(staffMembers)
        .set({ 
          contractDetails: JSON.stringify(contractData),
          contractStatus: 'sent',
          contractDate: new Date().toISOString(),
          hourlyRate: contractData.hourlyRate,
          updatedAt: new Date()
        })
        .where(eq(staffMembers.id, clinicianId));
      
      // Update the assignment with new pay amount
      await db.update(campStaffAssignments)
        .set({ payAmount: contractData.hourlyRate })
        .where(and(
          eq(campStaffAssignments.campId, campId),
          eq(campStaffAssignments.staffId, clinicianId)
        ));
      
      // Get updated clinician data
      const updatedClinician = await db.query.staffMembers.findFirst({
        where: eq(staffMembers.id, clinicianId)
      });
      
      res.json({ data: updatedClinician });
    } catch (error) {
      console.error("Error updating clinician contract:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Agenda API Routes
  app.get("/api/camps/:id/agenda", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const campId = parseInt(req.params.id);
      
      // Fetch camp to verify it exists and get date information
      const camp = await db.query.camps.findFirst({
        where: eq(camps.id, campId)
      });
      
      if (!camp) {
        return res.status(404).json({ error: "Camp not found" });
      }
      
      // Parse start and end dates
      const startDate = new Date(camp.startDate);
      const endDate = new Date(camp.endDate);
      const totalDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      
      // Fetch schedule items grouped by day
      const scheduleItems = await db.query.campScheduleItems.findMany({
        where: eq(campScheduleItems.campId, campId),
        orderBy: [asc(campScheduleItems.dayNumber), asc(campScheduleItems.startTime)]
      });
      
      // Create a structure for each day
      const agenda = [];
      for (let i = 0; i < totalDays; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        
        const dayNumber = i + 1;
        const dayItems = scheduleItems.filter(item => item.dayNumber === dayNumber);
        
        agenda.push({
          day: dayNumber,
          date: currentDate.toISOString().split('T')[0],
          title: `Day ${dayNumber}`,
          items: dayItems.map(item => ({
            id: item.id,
            title: item.activity,
            description: item.notes || '',
            startTime: item.startTime,
            endTime: item.endTime,
            day: item.dayNumber,
            location: item.location || '',
            locationId: null, // Would need a locations table for this
            clinicianId: item.staffId || null,
            sessionType: 'instruction', // Default type
            status: 'scheduled',
          }))
        });
      }
      
      res.json({ data: agenda });
    } catch (error) {
      console.error("Error fetching agenda:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/camps/:id/agenda", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const campId = parseInt(req.params.id);
      const sessionData = req.body;
      
      // Verify camp exists
      const camp = await db.query.camps.findFirst({
        where: eq(camps.id, campId)
      });
      
      if (!camp) {
        return res.status(404).json({ error: "Camp not found" });
      }
      
      // Create schedule item
      const result = await db.insert(campScheduleItems).values({
        campId,
        dayNumber: sessionData.day,
        startTime: sessionData.startTime,
        endTime: sessionData.endTime,
        activity: sessionData.title,
        location: sessionData.location || null,
        staffId: sessionData.clinicianId || null,
        notes: sessionData.description || null,
      }).returning();
      
      const newSession = result[0];
      
      // Return formatted session
      res.status(201).json({
        id: newSession.id,
        title: newSession.activity,
        description: newSession.notes || '',
        startTime: newSession.startTime,
        endTime: newSession.endTime,
        day: newSession.dayNumber,
        location: newSession.location || '',
        locationId: null,
        clinicianId: newSession.staffId || null,
        sessionType: sessionData.sessionType || 'instruction',
        status: sessionData.status || 'scheduled',
      });
    } catch (error) {
      console.error("Error creating session:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/camps/:campId/agenda/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const sessionId = parseInt(req.params.id);
      const sessionData = req.body.data; // The updated session data
      
      // Update schedule item
      await db.update(campScheduleItems)
        .set({
          dayNumber: sessionData.day,
          startTime: sessionData.startTime,
          endTime: sessionData.endTime,
          activity: sessionData.title,
          location: sessionData.location || null,
          staffId: sessionData.clinicianId || null,
          notes: sessionData.description || null,
          updatedAt: new Date()
        })
        .where(eq(campScheduleItems.id, sessionId));
      
      // Fetch updated item
      const updatedSession = await db.query.campScheduleItems.findFirst({
        where: eq(campScheduleItems.id, sessionId)
      });
      
      if (!updatedSession) {
        return res.status(404).json({ error: "Session not found" });
      }
      
      // Return formatted session
      res.json({
        id: updatedSession.id,
        title: updatedSession.activity,
        description: updatedSession.notes || '',
        startTime: updatedSession.startTime,
        endTime: updatedSession.endTime,
        day: updatedSession.dayNumber,
        location: updatedSession.location || '',
        locationId: null,
        clinicianId: updatedSession.staffId || null,
        sessionType: sessionData.sessionType || 'instruction',
        status: sessionData.status || 'scheduled',
      });
    } catch (error) {
      console.error("Error updating session:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/camps/:campId/agenda/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const sessionId = parseInt(req.params.id);
      
      // Delete the session
      await db.delete(campScheduleItems)
        .where(eq(campScheduleItems.id, sessionId));
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting session:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/camps/:campId/agenda/:id/copy", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const campId = parseInt(req.params.campId);
      const sessionId = parseInt(req.params.id);
      const { days } = req.body; // Array of day numbers to copy to
      
      // Find the source session
      const sourceSession = await db.query.campScheduleItems.findFirst({
        where: and(
          eq(campScheduleItems.id, sessionId),
          eq(campScheduleItems.campId, campId)
        )
      });
      
      if (!sourceSession) {
        return res.status(404).json({ error: "Session not found" });
      }
      
      // Create copies for each target day
      const newSessions = [];
      
      for (const day of days) {
        // Skip if trying to copy to the same day
        if (day === sourceSession.dayNumber) continue;
        
        const result = await db.insert(campScheduleItems).values({
          campId,
          dayNumber: day,
          startTime: sourceSession.startTime,
          endTime: sourceSession.endTime,
          activity: sourceSession.activity,
          location: sourceSession.location,
          staffId: sourceSession.staffId,
          notes: sourceSession.notes
        }).returning();
        
        newSessions.push(result[0]);
      }
      
      res.json({ 
        success: true,
        count: newSessions.length,
        sessions: newSessions
      });
    } catch (error) {
      console.error("Error copying session:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // =====================================
  // SHOPIFY INTEGRATION API ROUTES
  // =====================================
  
  // Check Shopify connection status
  app.get("/api/shopify/connection", isAuthenticated, shopifyService.checkShopifyConnection);
  
  // Get Shopify products
  app.get("/api/shopify/products", isAuthenticated, shopifyService.getShopifyProducts);
  
  // Get specific Shopify product
  app.get("/api/shopify/products/:id", isAuthenticated, shopifyService.getShopifyProduct);
  
  // Get Shopify orders
  app.get("/api/shopify/orders", isAuthenticated, shopifyService.getShopifyOrders);
  
  // Get specific Shopify order
  app.get("/api/shopify/orders/:id", isAuthenticated, shopifyService.getShopifyOrder);
  
  // Link Shopify orders to camp registrations
  app.post("/api/shopify/link-orders-to-camp", isAuthenticated, shopifyService.linkShopifyOrderToCampRegistration);
  
  // Shopify webhook endpoint
  app.post("/api/shopify/webhook", (req, res) => {
    // Verify Shopify webhook signature
    if (!shopifyService.validateShopifyWebhook(req)) {
      console.error("Invalid Shopify webhook signature");
      return res.status(401).send("Invalid signature");
    }
    
    const topic = req.headers['x-shopify-topic'];
    console.log(`Received Shopify webhook: ${topic}`);
    
    // Process different webhook types
    if (topic === 'orders/create' || topic === 'orders/paid') {
      // Handle new orders - could automatically create registrations
      const order = req.body;
      console.log(`New Shopify order received: ${order.id}`);
      
      // Here you would insert logic to:
      // 1. Check if this order is for a camp product
      // 2. If so, create a registration or update status
    }
    
    res.status(200).send("Webhook received");
  });
  
  // Update camp registration with Shopify order ID
  app.put("/api/camp-registrations/:registrationId/shopify-order", isAuthenticated, async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const registrationId = parseInt(req.params.registrationId);
      const { shopifyOrderId } = req.body;
      
      if (!shopifyOrderId) {
        return res.status(400).json({ error: "Shopify Order ID is required" });
      }
      
      // Update the registration with the Shopify order ID
      const updated = await db.update(campRegistrations)
        .set({ 
          shopifyOrderId,
          updatedAt: new Date()
        })
        .where(eq(campRegistrations.id, registrationId))
        .returning();
      
      if (!updated.length) {
        return res.status(404).json({ error: "Registration not found" });
      }
      
      // Get the Shopify order details
      try {
        const orderDetails = await shopifyService.getShopifyOrder(req, res);
        
        // If the order is paid, update payment status
        if (orderDetails.order && orderDetails.order.financial_status === 'paid') {
          await db.update(campRegistrations)
            .set({ 
              paymentStatus: 'paid',
              paymentDate: new Date(),
              paymentAmount: orderDetails.order.total_price
            })
            .where(eq(campRegistrations.id, registrationId));
        }
      } catch (orderErr) {
        console.error("Failed to fetch Shopify order details:", orderErr);
        // Continue even if we can't get order details
      }
      
      res.json({ data: updated[0] });
    } catch (error) {
      console.error("Error linking Shopify order to registration:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Get camp registrations with Shopify order data
  app.get("/api/camps/:campId/shopify-registrations", isAuthenticated, async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const campId = parseInt(req.params.campId);
      
      // Get all registrations for this camp that have a Shopify order ID
      const registrations = await db.select()
        .from(campRegistrations)
        .where(and(
          eq(campRegistrations.campId, campId),
          sql`shopify_order_id IS NOT NULL`
        ));
      
      // For each registration, fetch the Shopify order details
      const enrichedRegistrations = [];
      
      for (const registration of registrations) {
        try {
          // Create a mock request with the order ID parameter
          const mockReq = {
            ...req,
            params: { id: registration.shopifyOrderId }
          };
          
          // Create a mock response to capture the order data
          const mockRes = {
            json: (data) => data
          };
          
          // Get the Shopify order details
          const orderDetails = await shopifyService.getShopifyOrder(mockReq, mockRes);
          
          // Combine registration with order details
          enrichedRegistrations.push({
            ...registration,
            shopifyOrder: orderDetails.order
          });
        } catch (orderErr) {
          console.error(`Failed to fetch Shopify order ${registration.shopifyOrderId}:`, orderErr);
          // Include registration even without order details
          enrichedRegistrations.push(registration);
        }
      }
      
      res.json({ data: enrichedRegistrations });
    } catch (error) {
      console.error("Error fetching Shopify registrations:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  return httpServer;
}
