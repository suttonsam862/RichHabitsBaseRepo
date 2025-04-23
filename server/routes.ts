import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { sql, eq, or, and, isNull } from "drizzle-orm";
import { setupAuth, isAuthenticated } from "./auth";
import anthropicService from "./services/anthropic-service";
import shopifyService from "./services/shopify-service";
import aiParsingService from "./services/ai-parsing-service";
import { ROLES } from "../shared/schema";

// Simple permission check helper
function hasPermission(role: string, userPermissions: string[] = [], requiredPermission: string): boolean {
  // Admin role has all permissions
  if (role === 'admin' || role === 'executive') return true;
  
  // Check if the user has the specific permission
  return userPermissions.includes(requiredPermission);
}

// Define permissions constants
const PERMISSIONS = {
  VIEW_ALL_LEADS: 'view_all_leads',
  EDIT_ALL_LEADS: 'edit_all_leads',
  ASSIGN_LEADS: 'assign_leads',
};

/**
 * Register API routes for the application
 */
export async function registerRoutes(app: Express): Promise<Server> {
  // Create HTTP server
  const httpServer = createServer(app);
  
  // Set up authentication routes
  setupAuth(app);
  
  // Leads routes
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
      } else if (user.role === 'agent') {
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
  
  // Recent leads API for dashboard
  app.get("/api/leads/recent", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const limit = parseInt(req.query.limit as string) || 5;
      const leads = await storage.getRecentLeads(limit);
      
      res.json({ data: leads });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Lead contact logs
  app.get("/api/leads/:id/contact-logs", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const leadId = parseInt(req.params.id);
      const logs = await storage.getContactLogs(leadId);
      
      res.json({ data: logs });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // AI routes
  app.post("/api/ai/parseItems", async (req, res) => {
    try {
      console.log('[DEBUG] POST /api/ai/parseItems with body:', req.body);
      const { clientNotes } = req.body;
      
      if (!clientNotes) {
        return res.status(400).json({ error: "Client notes are required" });
      }
      
      // Use AI parsing service to extract structured data from client notes
      console.log('[DEBUG] Calling AI parsing service with notes:', clientNotes);
      const parsedItems = await aiParsingService.parseItemsFromNotes(clientNotes);
      console.log('[DEBUG] Received parsed items:', parsedItems);
      
      res.json({ success: true, data: parsedItems });
    } catch (error: any) {
      console.error("Error parsing items from notes:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  return httpServer;
}
