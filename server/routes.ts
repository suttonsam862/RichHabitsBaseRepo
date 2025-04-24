import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { sql, eq, or, and, isNull } from "drizzle-orm";
import { setupAuth, isAuthenticated } from "./auth";
import anthropicService from "./services/anthropic-service";
import shopifyService from "./services/shopify-service";
import aiParsingService from "./services/ai-parsing-service";
import { ROLES, products } from "../shared/schema";

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
  
  // Products routes
  app.get("/api/products", async (req, res) => {
    try {
      const productsList = await db.select().from(products);
      res.json({ products: productsList });
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });
  
  app.post("/api/products", isAuthenticated, async (req, res) => {
    try {
      const { name, description, category, sport, item, fabricOptions, cogs, wholesalePrice } = req.body;
      
      if (!name) {
        return res.status(400).json({ error: "Product name is required" });
      }
      
      // Generate a unique SKU
      const sku = `SKU-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      const [product] = await db
        .insert(products)
        .values({
          sku,
          name,
          description,
          category,
          sport: sport || "General",
          item: item || "Custom Item",
          fabricOptions: fabricOptions || "Various",
          cogs: cogs || "0",
          wholesalePrice: wholesalePrice || "0",
          createdById: req.user.id,
          aiGenerated: false,
        })
        .returning();
      
      res.status(201).json({ product });
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(500).json({ error: "Failed to create product" });
    }
  });
  
  // AI Product Generation
  app.post("/api/products/generate", isAuthenticated, async (req, res) => {
    try {
      const { prompt } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ error: "Product description prompt is required" });
      }
      
      // First use AI to parse the prompt into structured data
      const systemMessage = `You are an expert in athletic apparel and equipment. 
      Extract detailed product information from the user's prompt.
      You should return a JSON object with the following fields:
      - name (a concise product name)
      - description (a detailed paragraph about the product)
      - category (a product category like "singlet", "jacket", "shorts", etc.)
      - sport (what sport this is for, e.g., "wrestling", "basketball", etc.)
      - item (the specific item type)
      - fabricOptions (recommended fabric types)
      - cogs (estimated cost of goods)
      - wholesalePrice (recommended wholesale price)`;
      
      try {
        const response = await anthropicService.getCompletionWithJSON(
          systemMessage,
          prompt
        );
        
        // Generate a unique SKU
        const sku = `AI-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        
        // Create the product using the AI-generated data
        const [product] = await db
          .insert(products)
          .values({
            sku,
            name: response.name || "AI-Generated Product",
            description: response.description || prompt,
            category: response.category || "Custom",
            sport: response.sport || "General",
            item: response.item || "Custom Item",
            fabricOptions: response.fabricOptions || "Various",
            cogs: response.cogs || "0",
            wholesalePrice: response.wholesalePrice || "0",
            createdById: req.user.id,
            aiGenerated: true,
          })
          .returning();
        
        res.status(201).json({ product });
        
      } catch (aiError) {
        console.error("AI generation error:", aiError);
        // Fallback to a simpler product creation if AI fails
        const sku = `AI-FALLBACK-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        
        const [product] = await db
          .insert(products)
          .values({
            sku,
            name: "Custom Product",
            description: prompt,
            category: "Custom",
            sport: "General",
            item: "Custom Item",
            fabricOptions: "Various",
            cogs: "0",
            wholesalePrice: "0",
            createdById: req.user.id,
            aiGenerated: true,
          })
          .returning();
        
        res.status(201).json({ 
          product, 
          warning: "AI generation encountered an issue. Created a basic product instead."
        });
      }
    } catch (error) {
      console.error("Error in product generation:", error);
      res.status(500).json({ error: "Failed to generate product" });
    }
  });
  
  return httpServer;
}
