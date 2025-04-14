import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertCampSchema, 
  insertParticipantSchema,
  insertStaffSchema,
  insertHousingSchema,
  insertHousingAssignmentSchema,
  insertTravelSchema,
  insertScheduleEventSchema,
  insertBudgetItemSchema,
  insertDocumentSchema,
  insertTaskSchema,
  insertActivitySchema
} from "@shared/schema";
import { ZodError } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Common middleware for validating camp existence
  const validateCampExists = async (req: Request, res: Response, next: Function) => {
    const campId = parseInt(req.params.campId);
    if (isNaN(campId)) {
      return res.status(400).json({ message: "Invalid camp ID" });
    }
    
    const camp = await storage.getCamp(campId);
    if (!camp) {
      return res.status(404).json({ message: "Camp not found" });
    }
    
    next();
  };

  // Error handler for Zod validation errors
  const handleZodError = (error: unknown, res: Response) => {
    if (error instanceof ZodError) {
      return res.status(400).json({ 
        message: "Validation error", 
        errors: error.errors 
      });
    }
    
    return res.status(500).json({ 
      message: "Internal server error", 
      error: (error as Error).message 
    });
  };

  // Camps API endpoints
  app.get("/api/camps", async (_req, res) => {
    try {
      const camps = await storage.getCamps();
      res.json(camps);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch camps", error });
    }
  });

  app.get("/api/camps/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid camp ID" });
      }
      
      const camp = await storage.getCamp(id);
      if (!camp) {
        return res.status(404).json({ message: "Camp not found" });
      }
      
      res.json(camp);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch camp", error });
    }
  });

  app.post("/api/camps", async (req, res) => {
    try {
      const campData = insertCampSchema.parse(req.body);
      const camp = await storage.createCamp(campData);
      
      // Log activity
      await storage.createActivity({
        campId: camp.id,
        userId: camp.createdBy || 1, // Default to user 1 if createdBy is not set
        action: "created",
        entity: "camp",
        entityId: camp.id,
        details: { campName: camp.name }
      });
      
      res.status(201).json(camp);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  app.put("/api/camps/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid camp ID" });
      }
      
      const campData = insertCampSchema.partial().parse(req.body);
      const updatedCamp = await storage.updateCamp(id, campData);
      
      if (!updatedCamp) {
        return res.status(404).json({ message: "Camp not found" });
      }
      
      // Log activity
      await storage.createActivity({
        campId: updatedCamp.id,
        userId: updatedCamp.createdBy || 1,
        action: "updated",
        entity: "camp",
        entityId: updatedCamp.id,
        details: { campName: updatedCamp.name }
      });
      
      res.json(updatedCamp);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  app.delete("/api/camps/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid camp ID" });
      }
      
      const camp = await storage.getCamp(id);
      if (!camp) {
        return res.status(404).json({ message: "Camp not found" });
      }
      
      const success = await storage.deleteCamp(id);
      
      if (success) {
        // Log activity
        await storage.createActivity({
          userId: camp.createdBy || 1,
          action: "deleted",
          entity: "camp",
          entityId: id,
          details: { campName: camp.name }
        });
        
        return res.status(204).send();
      }
      
      res.status(500).json({ message: "Failed to delete camp" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting camp", error });
    }
  });

  // Participants API endpoints
  app.get("/api/camps/:campId/participants", validateCampExists, async (req, res) => {
    try {
      const campId = parseInt(req.params.campId);
      const participants = await storage.getParticipants(campId);
      res.json(participants);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch participants", error });
    }
  });

  app.get("/api/participants/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid participant ID" });
      }
      
      const participant = await storage.getParticipant(id);
      if (!participant) {
        return res.status(404).json({ message: "Participant not found" });
      }
      
      res.json(participant);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch participant", error });
    }
  });

  app.post("/api/camps/:campId/participants", validateCampExists, async (req, res) => {
    try {
      const campId = parseInt(req.params.campId);
      const participantData = insertParticipantSchema.parse({
        ...req.body,
        campId
      });
      
      const participant = await storage.createParticipant(participantData);
      
      // Log activity
      await storage.createActivity({
        campId,
        userId: 1, // Assuming user 1 as default
        action: "created",
        entity: "participant",
        entityId: participant.id,
        details: { name: `${participant.firstName} ${participant.lastName}` }
      });
      
      res.status(201).json(participant);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  app.put("/api/participants/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid participant ID" });
      }
      
      const participant = await storage.getParticipant(id);
      if (!participant) {
        return res.status(404).json({ message: "Participant not found" });
      }
      
      const participantData = insertParticipantSchema.partial().parse(req.body);
      const updatedParticipant = await storage.updateParticipant(id, participantData);
      
      // Log activity
      await storage.createActivity({
        campId: participant.campId,
        userId: 1,
        action: "updated",
        entity: "participant",
        entityId: id,
        details: { name: `${participant.firstName} ${participant.lastName}` }
      });
      
      res.json(updatedParticipant);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  app.delete("/api/participants/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid participant ID" });
      }
      
      const participant = await storage.getParticipant(id);
      if (!participant) {
        return res.status(404).json({ message: "Participant not found" });
      }
      
      const success = await storage.deleteParticipant(id);
      
      if (success) {
        // Log activity
        await storage.createActivity({
          campId: participant.campId,
          userId: 1,
          action: "deleted",
          entity: "participant",
          entityId: id,
          details: { name: `${participant.firstName} ${participant.lastName}` }
        });
        
        return res.status(204).send();
      }
      
      res.status(500).json({ message: "Failed to delete participant" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting participant", error });
    }
  });

  // Staff API endpoints
  app.get("/api/camps/:campId/staff", validateCampExists, async (req, res) => {
    try {
      const campId = parseInt(req.params.campId);
      const staffMembers = await storage.getStaffMembers(campId);
      res.json(staffMembers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch staff members", error });
    }
  });

  app.get("/api/staff/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid staff ID" });
      }
      
      const staffMember = await storage.getStaffMember(id);
      if (!staffMember) {
        return res.status(404).json({ message: "Staff member not found" });
      }
      
      res.json(staffMember);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch staff member", error });
    }
  });

  app.post("/api/camps/:campId/staff", validateCampExists, async (req, res) => {
    try {
      const campId = parseInt(req.params.campId);
      const staffData = insertStaffSchema.parse({
        ...req.body,
        campId
      });
      
      const staffMember = await storage.createStaffMember(staffData);
      
      // Log activity
      await storage.createActivity({
        campId,
        userId: 1,
        action: "created",
        entity: "staff",
        entityId: staffMember.id,
        details: { 
          name: `${staffMember.firstName} ${staffMember.lastName}`,
          role: staffMember.role
        }
      });
      
      res.status(201).json(staffMember);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  app.put("/api/staff/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid staff ID" });
      }
      
      const staffMember = await storage.getStaffMember(id);
      if (!staffMember) {
        return res.status(404).json({ message: "Staff member not found" });
      }
      
      const staffData = insertStaffSchema.partial().parse(req.body);
      const updatedStaffMember = await storage.updateStaffMember(id, staffData);
      
      // Log activity
      await storage.createActivity({
        campId: staffMember.campId,
        userId: 1,
        action: "updated",
        entity: "staff",
        entityId: id,
        details: { 
          name: `${staffMember.firstName} ${staffMember.lastName}`,
          role: staffMember.role
        }
      });
      
      res.json(updatedStaffMember);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  app.delete("/api/staff/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid staff ID" });
      }
      
      const staffMember = await storage.getStaffMember(id);
      if (!staffMember) {
        return res.status(404).json({ message: "Staff member not found" });
      }
      
      const success = await storage.deleteStaffMember(id);
      
      if (success) {
        // Log activity
        await storage.createActivity({
          campId: staffMember.campId,
          userId: 1,
          action: "deleted",
          entity: "staff",
          entityId: id,
          details: { 
            name: `${staffMember.firstName} ${staffMember.lastName}`,
            role: staffMember.role
          }
        });
        
        return res.status(204).send();
      }
      
      res.status(500).json({ message: "Failed to delete staff member" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting staff member", error });
    }
  });

  // Housing API endpoints
  app.get("/api/camps/:campId/housing", validateCampExists, async (req, res) => {
    try {
      const campId = parseInt(req.params.campId);
      const housingUnits = await storage.getHousingUnits(campId);
      res.json(housingUnits);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch housing units", error });
    }
  });

  app.post("/api/camps/:campId/housing", validateCampExists, async (req, res) => {
    try {
      const campId = parseInt(req.params.campId);
      const housingData = insertHousingSchema.parse({
        ...req.body,
        campId
      });
      
      const housing = await storage.createHousingUnit(housingData);
      
      // Log activity
      await storage.createActivity({
        campId,
        userId: 1,
        action: "created",
        entity: "housing",
        entityId: housing.id,
        details: { 
          name: housing.name,
          type: housing.type,
          capacity: housing.capacity
        }
      });
      
      res.status(201).json(housing);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  app.put("/api/housing/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid housing ID" });
      }
      
      const housing = await storage.getHousingUnit(id);
      if (!housing) {
        return res.status(404).json({ message: "Housing unit not found" });
      }
      
      const housingData = insertHousingSchema.partial().parse(req.body);
      const updatedHousing = await storage.updateHousingUnit(id, housingData);
      
      // Log activity
      await storage.createActivity({
        campId: housing.campId,
        userId: 1,
        action: "updated",
        entity: "housing",
        entityId: id,
        details: { name: housing.name }
      });
      
      res.json(updatedHousing);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  app.delete("/api/housing/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid housing ID" });
      }
      
      const housing = await storage.getHousingUnit(id);
      if (!housing) {
        return res.status(404).json({ message: "Housing unit not found" });
      }
      
      const success = await storage.deleteHousingUnit(id);
      
      if (success) {
        // Log activity
        await storage.createActivity({
          campId: housing.campId,
          userId: 1,
          action: "deleted",
          entity: "housing",
          entityId: id,
          details: { name: housing.name }
        });
        
        return res.status(204).send();
      }
      
      res.status(500).json({ message: "Failed to delete housing unit" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting housing unit", error });
    }
  });

  // Housing Assignments API endpoints
  app.get("/api/housing/:housingId/assignments", async (req, res) => {
    try {
      const housingId = parseInt(req.params.housingId);
      if (isNaN(housingId)) {
        return res.status(400).json({ message: "Invalid housing ID" });
      }
      
      const housing = await storage.getHousingUnit(housingId);
      if (!housing) {
        return res.status(404).json({ message: "Housing unit not found" });
      }
      
      const assignments = await storage.getHousingAssignments(housingId);
      res.json(assignments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch housing assignments", error });
    }
  });

  app.post("/api/housing/:housingId/assignments", async (req, res) => {
    try {
      const housingId = parseInt(req.params.housingId);
      if (isNaN(housingId)) {
        return res.status(400).json({ message: "Invalid housing ID" });
      }
      
      const housing = await storage.getHousingUnit(housingId);
      if (!housing) {
        return res.status(404).json({ message: "Housing unit not found" });
      }
      
      const assignmentData = insertHousingAssignmentSchema.parse({
        ...req.body,
        housingId
      });
      
      const assignment = await storage.createHousingAssignment(assignmentData);
      
      // Log activity
      await storage.createActivity({
        campId: housing.campId,
        userId: 1,
        action: "created",
        entity: "housing_assignment",
        entityId: assignment.id,
        details: { 
          housing: housing.name,
          participantId: assignment.participantId,
          staffId: assignment.staffId
        }
      });
      
      res.status(201).json(assignment);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  app.delete("/api/housing/assignments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid assignment ID" });
      }
      
      const success = await storage.deleteHousingAssignment(id);
      
      if (success) {
        // Log activity - this is simplified as we don't have housing assignment details
        await storage.createActivity({
          userId: 1,
          action: "deleted",
          entity: "housing_assignment",
          entityId: id,
          details: { assignmentId: id }
        });
        
        return res.status(204).send();
      }
      
      res.status(500).json({ message: "Failed to delete housing assignment" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting housing assignment", error });
    }
  });

  // Travel API endpoints
  app.get("/api/camps/:campId/travel", validateCampExists, async (req, res) => {
    try {
      const campId = parseInt(req.params.campId);
      const travel = await storage.getTravelArrangements(campId);
      res.json(travel);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch travel arrangements", error });
    }
  });

  app.post("/api/camps/:campId/travel", validateCampExists, async (req, res) => {
    try {
      const campId = parseInt(req.params.campId);
      const travelData = insertTravelSchema.parse({
        ...req.body,
        campId
      });
      
      const travel = await storage.createTravelArrangement(travelData);
      
      // Log activity
      await storage.createActivity({
        campId,
        userId: 1,
        action: "created",
        entity: "travel",
        entityId: travel.id,
        details: { 
          travelType: travel.travelType,
          participantId: travel.participantId,
          staffId: travel.staffId
        }
      });
      
      res.status(201).json(travel);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  app.put("/api/travel/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid travel ID" });
      }
      
      const travel = await storage.getTravelArrangement(id);
      if (!travel) {
        return res.status(404).json({ message: "Travel arrangement not found" });
      }
      
      const travelData = insertTravelSchema.partial().parse(req.body);
      const updatedTravel = await storage.updateTravelArrangement(id, travelData);
      
      // Log activity
      await storage.createActivity({
        campId: travel.campId,
        userId: 1,
        action: "updated",
        entity: "travel",
        entityId: id,
        details: { 
          travelType: travel.travelType,
          status: travelData.status || travel.status
        }
      });
      
      res.json(updatedTravel);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  app.delete("/api/travel/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid travel ID" });
      }
      
      const travel = await storage.getTravelArrangement(id);
      if (!travel) {
        return res.status(404).json({ message: "Travel arrangement not found" });
      }
      
      const success = await storage.deleteTravelArrangement(id);
      
      if (success) {
        // Log activity
        await storage.createActivity({
          campId: travel.campId,
          userId: 1,
          action: "deleted",
          entity: "travel",
          entityId: id,
          details: { travelType: travel.travelType }
        });
        
        return res.status(204).send();
      }
      
      res.status(500).json({ message: "Failed to delete travel arrangement" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting travel arrangement", error });
    }
  });

  // Schedule API endpoints
  app.get("/api/camps/:campId/schedule", validateCampExists, async (req, res) => {
    try {
      const campId = parseInt(req.params.campId);
      const events = await storage.getScheduleEvents(campId);
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch schedule events", error });
    }
  });

  app.post("/api/camps/:campId/schedule", validateCampExists, async (req, res) => {
    try {
      const campId = parseInt(req.params.campId);
      const eventData = insertScheduleEventSchema.parse({
        ...req.body,
        campId
      });
      
      const event = await storage.createScheduleEvent(eventData);
      
      // Log activity
      await storage.createActivity({
        campId,
        userId: 1,
        action: "created",
        entity: "schedule_event",
        entityId: event.id,
        details: { 
          title: event.title,
          startDateTime: event.startDateTime,
          endDateTime: event.endDateTime
        }
      });
      
      res.status(201).json(event);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  app.put("/api/schedule/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid event ID" });
      }
      
      const event = await storage.getScheduleEvent(id);
      if (!event) {
        return res.status(404).json({ message: "Schedule event not found" });
      }
      
      const eventData = insertScheduleEventSchema.partial().parse(req.body);
      const updatedEvent = await storage.updateScheduleEvent(id, eventData);
      
      // Log activity
      await storage.createActivity({
        campId: event.campId,
        userId: 1,
        action: "updated",
        entity: "schedule_event",
        entityId: id,
        details: { title: event.title }
      });
      
      res.json(updatedEvent);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  app.delete("/api/schedule/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid event ID" });
      }
      
      const event = await storage.getScheduleEvent(id);
      if (!event) {
        return res.status(404).json({ message: "Schedule event not found" });
      }
      
      const success = await storage.deleteScheduleEvent(id);
      
      if (success) {
        // Log activity
        await storage.createActivity({
          campId: event.campId,
          userId: 1,
          action: "deleted",
          entity: "schedule_event",
          entityId: id,
          details: { title: event.title }
        });
        
        return res.status(204).send();
      }
      
      res.status(500).json({ message: "Failed to delete schedule event" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting schedule event", error });
    }
  });

  // Budget API endpoints
  app.get("/api/camps/:campId/budget", validateCampExists, async (req, res) => {
    try {
      const campId = parseInt(req.params.campId);
      const budget = await storage.getBudgetItems(campId);
      res.json(budget);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch budget items", error });
    }
  });

  app.post("/api/camps/:campId/budget", validateCampExists, async (req, res) => {
    try {
      const campId = parseInt(req.params.campId);
      const budgetData = insertBudgetItemSchema.parse({
        ...req.body,
        campId
      });
      
      const budgetItem = await storage.createBudgetItem(budgetData);
      
      // Log activity
      await storage.createActivity({
        campId,
        userId: 1,
        action: "created",
        entity: "budget_item",
        entityId: budgetItem.id,
        details: { 
          description: budgetItem.description,
          amount: budgetItem.amount,
          type: budgetItem.type
        }
      });
      
      res.status(201).json(budgetItem);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  app.put("/api/budget/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid budget item ID" });
      }
      
      const budgetItem = await storage.getBudgetItem(id);
      if (!budgetItem) {
        return res.status(404).json({ message: "Budget item not found" });
      }
      
      const budgetData = insertBudgetItemSchema.partial().parse(req.body);
      const updatedBudgetItem = await storage.updateBudgetItem(id, budgetData);
      
      // Log activity
      await storage.createActivity({
        campId: budgetItem.campId,
        userId: 1,
        action: "updated",
        entity: "budget_item",
        entityId: id,
        details: { 
          description: budgetItem.description,
          paid: budgetData.paid !== undefined ? budgetData.paid : budgetItem.paid
        }
      });
      
      res.json(updatedBudgetItem);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  app.delete("/api/budget/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid budget item ID" });
      }
      
      const budgetItem = await storage.getBudgetItem(id);
      if (!budgetItem) {
        return res.status(404).json({ message: "Budget item not found" });
      }
      
      const success = await storage.deleteBudgetItem(id);
      
      if (success) {
        // Log activity
        await storage.createActivity({
          campId: budgetItem.campId,
          userId: 1,
          action: "deleted",
          entity: "budget_item",
          entityId: id,
          details: { description: budgetItem.description }
        });
        
        return res.status(204).send();
      }
      
      res.status(500).json({ message: "Failed to delete budget item" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting budget item", error });
    }
  });

  // Document API endpoints
  app.get("/api/camps/:campId/documents", validateCampExists, async (req, res) => {
    try {
      const campId = parseInt(req.params.campId);
      const documents = await storage.getDocuments(campId);
      res.json(documents);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch documents", error });
    }
  });

  app.post("/api/camps/:campId/documents", validateCampExists, async (req, res) => {
    try {
      const campId = parseInt(req.params.campId);
      const documentData = insertDocumentSchema.parse({
        ...req.body,
        campId
      });
      
      const document = await storage.createDocument(documentData);
      
      // Log activity
      await storage.createActivity({
        campId,
        userId: document.uploadedBy || 1,
        action: "created",
        entity: "document",
        entityId: document.id,
        details: { 
          title: document.title,
          fileType: document.fileType
        }
      });
      
      res.status(201).json(document);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  app.put("/api/documents/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid document ID" });
      }
      
      const document = await storage.getDocument(id);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      const documentData = insertDocumentSchema.partial().parse(req.body);
      const updatedDocument = await storage.updateDocument(id, documentData);
      
      // Log activity
      await storage.createActivity({
        campId: document.campId,
        userId: document.uploadedBy || 1,
        action: "updated",
        entity: "document",
        entityId: id,
        details: { title: document.title }
      });
      
      res.json(updatedDocument);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  app.delete("/api/documents/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid document ID" });
      }
      
      const document = await storage.getDocument(id);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      const success = await storage.deleteDocument(id);
      
      if (success) {
        // Log activity
        await storage.createActivity({
          campId: document.campId,
          userId: document.uploadedBy || 1,
          action: "deleted",
          entity: "document",
          entityId: id,
          details: { title: document.title }
        });
        
        return res.status(204).send();
      }
      
      res.status(500).json({ message: "Failed to delete document" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting document", error });
    }
  });

  // Task API endpoints
  app.get("/api/camps/:campId/tasks", validateCampExists, async (req, res) => {
    try {
      const campId = parseInt(req.params.campId);
      const tasks = await storage.getTasks(campId);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tasks", error });
    }
  });

  app.post("/api/camps/:campId/tasks", validateCampExists, async (req, res) => {
    try {
      const campId = parseInt(req.params.campId);
      const taskData = insertTaskSchema.parse({
        ...req.body,
        campId
      });
      
      const task = await storage.createTask(taskData);
      
      // Log activity
      await storage.createActivity({
        campId,
        userId: 1,
        action: "created",
        entity: "task",
        entityId: task.id,
        details: { 
          title: task.title,
          priority: task.priority
        }
      });
      
      res.status(201).json(task);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  app.put("/api/tasks/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid task ID" });
      }
      
      const task = await storage.getTask(id);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      const taskData = insertTaskSchema.partial().parse(req.body);
      const updatedTask = await storage.updateTask(id, taskData);
      
      // Log activity
      await storage.createActivity({
        campId: task.campId,
        userId: 1,
        action: "updated",
        entity: "task",
        entityId: id,
        details: { 
          title: task.title,
          status: taskData.status || task.status
        }
      });
      
      res.json(updatedTask);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  app.delete("/api/tasks/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid task ID" });
      }
      
      const task = await storage.getTask(id);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      const success = await storage.deleteTask(id);
      
      if (success) {
        // Log activity
        await storage.createActivity({
          campId: task.campId,
          userId: 1,
          action: "deleted",
          entity: "task",
          entityId: id,
          details: { title: task.title }
        });
        
        return res.status(204).send();
      }
      
      res.status(500).json({ message: "Failed to delete task" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting task", error });
    }
  });

  // Activity API endpoints
  app.get("/api/camps/:campId/activities", validateCampExists, async (req, res) => {
    try {
      const campId = parseInt(req.params.campId);
      const activities = await storage.getActivities(campId);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activities", error });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
