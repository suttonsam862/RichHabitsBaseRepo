import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { sql, eq, or, and } from "drizzle-orm";
import { setupAuth, isAuthenticated } from "./auth";
import anthropicService from "./services/anthropic-service";
import shopifyService from "./services/shopify-service";
import aiParsingService from "./services/ai-parsing-service";

/**
 * Register API routes for the application
 */
export async function registerRoutes(app: Express): Promise<Server> {
  // Create HTTP server
  const httpServer = createServer(app);
  
  // Set up authentication routes
  setupAuth(app);
  
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
      
      res.json({ data: parsedItems });
    } catch (error: any) {
      console.error("Error parsing items from notes:", error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // Add more routes here...
  
  return httpServer;
}
