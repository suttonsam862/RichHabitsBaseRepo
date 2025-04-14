import { pgTable, text, serial, integer, boolean, date, timestamp, jsonb, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name"),
  email: text("email"),
  role: text("role").default("user"),
  avatarUrl: text("avatar_url"),
});

export const camps = pgTable("camps", {
  id: serial("id").primaryKey(),
  campCode: text("camp_code").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  location: text("location"),
  city: text("city"),
  state: text("state"),
  country: text("country"),
  maxParticipants: integer("max_participants"),
  status: text("status").notNull().default("planning"), // planning, registration_open, active, completed, cancelled
  totalBudget: doublePrecision("total_budget"),
  createdBy: integer("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const participants = pgTable("participants", {
  id: serial("id").primaryKey(),
  campId: integer("camp_id").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  age: integer("age"),
  emergencyContactName: text("emergency_contact_name"),
  emergencyContactPhone: text("emergency_contact_phone"),
  specialNeeds: text("special_needs"),
  registrationDate: timestamp("registration_date").defaultNow(),
  status: text("status").default("registered"), // registered, confirmed, cancelled, attended
  paymentStatus: text("payment_status").default("pending"), // pending, partial, paid
  paymentAmount: doublePrecision("payment_amount").default(0),
  formCompleted: boolean("form_completed").default(false),
  notes: text("notes"),
});

export const staff = pgTable("staff", {
  id: serial("id").primaryKey(),
  campId: integer("camp_id").notNull(),
  userId: integer("user_id"),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  role: text("role").notNull(), // counselor, instructor, medical, admin, etc.
  bio: text("bio"),
  startDate: date("start_date"),
  endDate: date("end_date"),
  paymentStatus: text("payment_status").default("pending"), // pending, paid
  paymentAmount: doublePrecision("payment_amount").default(0),
  notes: text("notes"),
});

export const housing = pgTable("housing", {
  id: serial("id").primaryKey(),
  campId: integer("camp_id").notNull(),
  name: text("name").notNull(), // building/cabin name
  type: text("type").notNull(), // cabin, dorm, hotel, etc.
  capacity: integer("capacity").notNull(),
  gender: text("gender"), // male, female, mixed
  ageGroup: text("age_group"), // 8-10, 11-13, 14-16, staff, etc.
  notes: text("notes"),
});

export const housingAssignments = pgTable("housing_assignments", {
  id: serial("id").primaryKey(),
  housingId: integer("housing_id").notNull(),
  participantId: integer("participant_id"),
  staffId: integer("staff_id"),
  assignedAt: timestamp("assigned_at").defaultNow(),
  notes: text("notes"),
});

export const travel = pgTable("travel", {
  id: serial("id").primaryKey(),
  campId: integer("camp_id").notNull(),
  participantId: integer("participant_id"),
  staffId: integer("staff_id"),
  travelType: text("travel_type").notNull(), // flight, bus, train, car, etc.
  departureLocation: text("departure_location"),
  departureDateTime: timestamp("departure_date_time"),
  arrivalLocation: text("arrival_location"),
  arrivalDateTime: timestamp("arrival_date_time"),
  carrierName: text("carrier_name"), // airline, bus company, etc.
  carrierNumber: text("carrier_number"), // flight number, etc.
  status: text("status").default("scheduled"), // scheduled, confirmed, completed, cancelled
  needsPickup: boolean("needs_pickup").default(false),
  pickupAssigned: boolean("pickup_assigned").default(false),
  notes: text("notes"),
});

export const scheduleEvents = pgTable("schedule_events", {
  id: serial("id").primaryKey(),
  campId: integer("camp_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  location: text("location"),
  startDateTime: timestamp("start_date_time").notNull(),
  endDateTime: timestamp("end_date_time").notNull(),
  type: text("type").default("activity"), // activity, meal, free time, etc.
  staffAssigned: jsonb("staff_assigned"), // array of staff IDs
  notes: text("notes"),
});

export const budgetItems = pgTable("budget_items", {
  id: serial("id").primaryKey(),
  campId: integer("camp_id").notNull(),
  category: text("category").notNull(), // lodging, food, transportation, staffing, etc.
  description: text("description").notNull(),
  amount: doublePrecision("amount").notNull(),
  type: text("type").notNull(), // income, expense
  dueDate: date("due_date"),
  paid: boolean("paid").default(false),
  paidDate: date("paid_date"),
  receiptUrl: text("receipt_url"),
  notes: text("notes"),
});

export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  campId: integer("camp_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  fileUrl: text("file_url").notNull(),
  fileType: text("file_type"), // pdf, doc, xls, etc.
  category: text("category"), // waiver, schedule, map, etc.
  uploadedBy: integer("uploaded_by"),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  isPublic: boolean("is_public").default(false),
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  campId: integer("camp_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  assignedTo: integer("assigned_to"),
  dueDate: date("due_date"),
  priority: text("priority").default("medium"), // low, medium, high
  status: text("status").default("pending"), // pending, in_progress, completed
  completedAt: timestamp("completed_at"),
  notes: text("notes"),
});

export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  campId: integer("camp_id"),
  userId: integer("user_id").notNull(),
  action: text("action").notNull(),
  entity: text("entity").notNull(), // camp, participant, staff, housing, etc.
  entityId: integer("entity_id"),
  details: jsonb("details"),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullName: true,
  email: true,
  role: true,
  avatarUrl: true,
});

export const insertCampSchema = createInsertSchema(camps).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertParticipantSchema = createInsertSchema(participants).omit({
  id: true,
  registrationDate: true,
});

export const insertStaffSchema = createInsertSchema(staff).omit({
  id: true,
});

export const insertHousingSchema = createInsertSchema(housing).omit({
  id: true,
});

export const insertHousingAssignmentSchema = createInsertSchema(housingAssignments).omit({
  id: true,
  assignedAt: true,
});

export const insertTravelSchema = createInsertSchema(travel).omit({
  id: true,
});

export const insertScheduleEventSchema = createInsertSchema(scheduleEvents).omit({
  id: true,
});

export const insertBudgetItemSchema = createInsertSchema(budgetItems).omit({
  id: true,
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  uploadedAt: true,
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  completedAt: true,
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  timestamp: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertCamp = z.infer<typeof insertCampSchema>;
export type Camp = typeof camps.$inferSelect;

export type InsertParticipant = z.infer<typeof insertParticipantSchema>;
export type Participant = typeof participants.$inferSelect;

export type InsertStaff = z.infer<typeof insertStaffSchema>;
export type Staff = typeof staff.$inferSelect;

export type InsertHousing = z.infer<typeof insertHousingSchema>;
export type Housing = typeof housing.$inferSelect;

export type InsertHousingAssignment = z.infer<typeof insertHousingAssignmentSchema>;
export type HousingAssignment = typeof housingAssignments.$inferSelect;

export type InsertTravel = z.infer<typeof insertTravelSchema>;
export type Travel = typeof travel.$inferSelect;

export type InsertScheduleEvent = z.infer<typeof insertScheduleEventSchema>;
export type ScheduleEvent = typeof scheduleEvents.$inferSelect;

export type InsertBudgetItem = z.infer<typeof insertBudgetItemSchema>;
export type BudgetItem = typeof budgetItems.$inferSelect;

export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;

export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activities.$inferSelect;
