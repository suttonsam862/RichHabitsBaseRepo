import { 
  users, type User, type InsertUser,
  camps, type Camp, type InsertCamp,
  participants, type Participant, type InsertParticipant,
  staff, type Staff, type InsertStaff,
  housing, type Housing, type InsertHousing,
  housingAssignments, type HousingAssignment, type InsertHousingAssignment,
  travel, type Travel, type InsertTravel,
  scheduleEvents, type ScheduleEvent, type InsertScheduleEvent,
  budgetItems, type BudgetItem, type InsertBudgetItem,
  documents, type Document, type InsertDocument,
  tasks, type Task, type InsertTask,
  activities, type Activity, type InsertActivity
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Camp operations
  getCamps(): Promise<Camp[]>;
  getCamp(id: number): Promise<Camp | undefined>;
  getCampByCode(code: string): Promise<Camp | undefined>;
  createCamp(camp: InsertCamp): Promise<Camp>;
  updateCamp(id: number, camp: Partial<InsertCamp>): Promise<Camp | undefined>;
  deleteCamp(id: number): Promise<boolean>;
  
  // Participant operations
  getParticipants(campId: number): Promise<Participant[]>;
  getParticipant(id: number): Promise<Participant | undefined>;
  createParticipant(participant: InsertParticipant): Promise<Participant>;
  updateParticipant(id: number, participant: Partial<InsertParticipant>): Promise<Participant | undefined>;
  deleteParticipant(id: number): Promise<boolean>;
  
  // Staff operations
  getStaffMembers(campId: number): Promise<Staff[]>;
  getStaffMember(id: number): Promise<Staff | undefined>;
  createStaffMember(staff: InsertStaff): Promise<Staff>;
  updateStaffMember(id: number, staff: Partial<InsertStaff>): Promise<Staff | undefined>;
  deleteStaffMember(id: number): Promise<boolean>;
  
  // Housing operations
  getHousingUnits(campId: number): Promise<Housing[]>;
  getHousingUnit(id: number): Promise<Housing | undefined>;
  createHousingUnit(housing: InsertHousing): Promise<Housing>;
  updateHousingUnit(id: number, housing: Partial<InsertHousing>): Promise<Housing | undefined>;
  deleteHousingUnit(id: number): Promise<boolean>;
  
  // Housing Assignment operations
  getHousingAssignments(housingId: number): Promise<HousingAssignment[]>;
  createHousingAssignment(assignment: InsertHousingAssignment): Promise<HousingAssignment>;
  deleteHousingAssignment(id: number): Promise<boolean>;
  
  // Travel operations
  getTravelArrangements(campId: number): Promise<Travel[]>;
  getTravelArrangement(id: number): Promise<Travel | undefined>;
  createTravelArrangement(travel: InsertTravel): Promise<Travel>;
  updateTravelArrangement(id: number, travel: Partial<InsertTravel>): Promise<Travel | undefined>;
  deleteTravelArrangement(id: number): Promise<boolean>;
  
  // Schedule operations
  getScheduleEvents(campId: number): Promise<ScheduleEvent[]>;
  getScheduleEvent(id: number): Promise<ScheduleEvent | undefined>;
  createScheduleEvent(event: InsertScheduleEvent): Promise<ScheduleEvent>;
  updateScheduleEvent(id: number, event: Partial<InsertScheduleEvent>): Promise<ScheduleEvent | undefined>;
  deleteScheduleEvent(id: number): Promise<boolean>;
  
  // Budget operations
  getBudgetItems(campId: number): Promise<BudgetItem[]>;
  getBudgetItem(id: number): Promise<BudgetItem | undefined>;
  createBudgetItem(item: InsertBudgetItem): Promise<BudgetItem>;
  updateBudgetItem(id: number, item: Partial<InsertBudgetItem>): Promise<BudgetItem | undefined>;
  deleteBudgetItem(id: number): Promise<boolean>;
  
  // Document operations
  getDocuments(campId: number): Promise<Document[]>;
  getDocument(id: number): Promise<Document | undefined>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(id: number, document: Partial<InsertDocument>): Promise<Document | undefined>;
  deleteDocument(id: number): Promise<boolean>;
  
  // Task operations
  getTasks(campId: number): Promise<Task[]>;
  getTask(id: number): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, task: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: number): Promise<boolean>;
  
  // Activity operations
  getActivities(campId: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private camps: Map<number, Camp>;
  private participants: Map<number, Participant>;
  private staffMembers: Map<number, Staff>;
  private housingUnits: Map<number, Housing>;
  private housingAssignments: Map<number, HousingAssignment>;
  private travelArrangements: Map<number, Travel>;
  private scheduleEvents: Map<number, ScheduleEvent>;
  private budgetItems: Map<number, BudgetItem>;
  private documents: Map<number, Document>;
  private tasks: Map<number, Task>;
  private activities: Map<number, Activity>;
  
  private userId: number;
  private campId: number;
  private participantId: number;
  private staffId: number;
  private housingId: number;
  private housingAssignmentId: number;
  private travelId: number;
  private scheduleEventId: number;
  private budgetItemId: number;
  private documentId: number;
  private taskId: number;
  private activityId: number;

  constructor() {
    this.users = new Map();
    this.camps = new Map();
    this.participants = new Map();
    this.staffMembers = new Map();
    this.housingUnits = new Map();
    this.housingAssignments = new Map();
    this.travelArrangements = new Map();
    this.scheduleEvents = new Map();
    this.budgetItems = new Map();
    this.documents = new Map();
    this.tasks = new Map();
    this.activities = new Map();
    
    this.userId = 1;
    this.campId = 1;
    this.participantId = 1;
    this.staffId = 1;
    this.housingId = 1;
    this.housingAssignmentId = 1;
    this.travelId = 1;
    this.scheduleEventId = 1;
    this.budgetItemId = 1;
    this.documentId = 1;
    this.taskId = 1;
    this.activityId = 1;
    
    // Create initial admin user
    this.createUser({
      username: "admin",
      password: "password", // In a real app, this would be hashed
      fullName: "Admin User",
      email: "admin@example.com",
      role: "admin"
    });
    
    // Add some demo camps
    this.createCamp({
      campCode: "CAMP-2023-001",
      name: "Summer Music Academy",
      description: "Two-week intensive music program for youth",
      startDate: new Date("2023-07-15"),
      endDate: new Date("2023-07-28"),
      location: "Alpine Retreat Center",
      city: "Boulder",
      state: "CO",
      country: "USA",
      maxParticipants: 150,
      status: "registration_open",
      totalBudget: 62000,
      createdBy: 1
    });
    
    this.createCamp({
      campCode: "CAMP-2023-002",
      name: "Youth Leadership Retreat",
      description: "One-week leadership development for teens",
      startDate: new Date("2023-08-05"),
      endDate: new Date("2023-08-12"),
      location: "Lakeview Conference Center",
      city: "Chicago",
      state: "IL",
      country: "USA",
      maxParticipants: 100,
      status: "planning",
      totalBudget: 35000,
      createdBy: 1
    });
    
    this.createCamp({
      campCode: "CAMP-2023-003",
      name: "STEM Explorer Camp",
      description: "Science and technology exploration for middle schoolers",
      startDate: new Date("2023-09-02"),
      endDate: new Date("2023-09-09"),
      location: "Tech Innovation Campus",
      city: "San Jose",
      state: "CA",
      country: "USA",
      maxParticipants: 80,
      status: "registration_open",
      totalBudget: 45000,
      createdBy: 1
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Camp operations
  async getCamps(): Promise<Camp[]> {
    return Array.from(this.camps.values());
  }
  
  async getCamp(id: number): Promise<Camp | undefined> {
    return this.camps.get(id);
  }
  
  async getCampByCode(code: string): Promise<Camp | undefined> {
    return Array.from(this.camps.values()).find(
      (camp) => camp.campCode === code,
    );
  }
  
  async createCamp(insertCamp: InsertCamp): Promise<Camp> {
    const id = this.campId++;
    const now = new Date();
    const camp: Camp = { 
      ...insertCamp, 
      id, 
      createdAt: now, 
      updatedAt: now 
    };
    this.camps.set(id, camp);
    return camp;
  }
  
  async updateCamp(id: number, campData: Partial<InsertCamp>): Promise<Camp | undefined> {
    const camp = this.camps.get(id);
    if (!camp) return undefined;
    
    const updatedCamp: Camp = { 
      ...camp, 
      ...campData, 
      updatedAt: new Date() 
    };
    this.camps.set(id, updatedCamp);
    return updatedCamp;
  }
  
  async deleteCamp(id: number): Promise<boolean> {
    return this.camps.delete(id);
  }
  
  // Participant operations
  async getParticipants(campId: number): Promise<Participant[]> {
    return Array.from(this.participants.values()).filter(
      (participant) => participant.campId === campId,
    );
  }
  
  async getParticipant(id: number): Promise<Participant | undefined> {
    return this.participants.get(id);
  }
  
  async createParticipant(insertParticipant: InsertParticipant): Promise<Participant> {
    const id = this.participantId++;
    const registrationDate = new Date();
    const participant: Participant = { ...insertParticipant, id, registrationDate };
    this.participants.set(id, participant);
    return participant;
  }
  
  async updateParticipant(id: number, participantData: Partial<InsertParticipant>): Promise<Participant | undefined> {
    const participant = this.participants.get(id);
    if (!participant) return undefined;
    
    const updatedParticipant: Participant = { 
      ...participant, 
      ...participantData 
    };
    this.participants.set(id, updatedParticipant);
    return updatedParticipant;
  }
  
  async deleteParticipant(id: number): Promise<boolean> {
    return this.participants.delete(id);
  }
  
  // Staff operations
  async getStaffMembers(campId: number): Promise<Staff[]> {
    return Array.from(this.staffMembers.values()).filter(
      (staff) => staff.campId === campId,
    );
  }
  
  async getStaffMember(id: number): Promise<Staff | undefined> {
    return this.staffMembers.get(id);
  }
  
  async createStaffMember(insertStaff: InsertStaff): Promise<Staff> {
    const id = this.staffId++;
    const staff: Staff = { ...insertStaff, id };
    this.staffMembers.set(id, staff);
    return staff;
  }
  
  async updateStaffMember(id: number, staffData: Partial<InsertStaff>): Promise<Staff | undefined> {
    const staff = this.staffMembers.get(id);
    if (!staff) return undefined;
    
    const updatedStaff: Staff = { 
      ...staff, 
      ...staffData 
    };
    this.staffMembers.set(id, updatedStaff);
    return updatedStaff;
  }
  
  async deleteStaffMember(id: number): Promise<boolean> {
    return this.staffMembers.delete(id);
  }
  
  // Housing operations
  async getHousingUnits(campId: number): Promise<Housing[]> {
    return Array.from(this.housingUnits.values()).filter(
      (housing) => housing.campId === campId,
    );
  }
  
  async getHousingUnit(id: number): Promise<Housing | undefined> {
    return this.housingUnits.get(id);
  }
  
  async createHousingUnit(insertHousing: InsertHousing): Promise<Housing> {
    const id = this.housingId++;
    const housing: Housing = { ...insertHousing, id };
    this.housingUnits.set(id, housing);
    return housing;
  }
  
  async updateHousingUnit(id: number, housingData: Partial<InsertHousing>): Promise<Housing | undefined> {
    const housing = this.housingUnits.get(id);
    if (!housing) return undefined;
    
    const updatedHousing: Housing = { 
      ...housing, 
      ...housingData 
    };
    this.housingUnits.set(id, updatedHousing);
    return updatedHousing;
  }
  
  async deleteHousingUnit(id: number): Promise<boolean> {
    return this.housingUnits.delete(id);
  }
  
  // Housing Assignment operations
  async getHousingAssignments(housingId: number): Promise<HousingAssignment[]> {
    return Array.from(this.housingAssignments.values()).filter(
      (assignment) => assignment.housingId === housingId,
    );
  }
  
  async createHousingAssignment(insertAssignment: InsertHousingAssignment): Promise<HousingAssignment> {
    const id = this.housingAssignmentId++;
    const assignedAt = new Date();
    const assignment: HousingAssignment = { ...insertAssignment, id, assignedAt };
    this.housingAssignments.set(id, assignment);
    return assignment;
  }
  
  async deleteHousingAssignment(id: number): Promise<boolean> {
    return this.housingAssignments.delete(id);
  }
  
  // Travel operations
  async getTravelArrangements(campId: number): Promise<Travel[]> {
    return Array.from(this.travelArrangements.values()).filter(
      (travel) => travel.campId === campId,
    );
  }
  
  async getTravelArrangement(id: number): Promise<Travel | undefined> {
    return this.travelArrangements.get(id);
  }
  
  async createTravelArrangement(insertTravel: InsertTravel): Promise<Travel> {
    const id = this.travelId++;
    const travel: Travel = { ...insertTravel, id };
    this.travelArrangements.set(id, travel);
    return travel;
  }
  
  async updateTravelArrangement(id: number, travelData: Partial<InsertTravel>): Promise<Travel | undefined> {
    const travel = this.travelArrangements.get(id);
    if (!travel) return undefined;
    
    const updatedTravel: Travel = { 
      ...travel, 
      ...travelData 
    };
    this.travelArrangements.set(id, updatedTravel);
    return updatedTravel;
  }
  
  async deleteTravelArrangement(id: number): Promise<boolean> {
    return this.travelArrangements.delete(id);
  }
  
  // Schedule operations
  async getScheduleEvents(campId: number): Promise<ScheduleEvent[]> {
    return Array.from(this.scheduleEvents.values()).filter(
      (event) => event.campId === campId,
    );
  }
  
  async getScheduleEvent(id: number): Promise<ScheduleEvent | undefined> {
    return this.scheduleEvents.get(id);
  }
  
  async createScheduleEvent(insertEvent: InsertScheduleEvent): Promise<ScheduleEvent> {
    const id = this.scheduleEventId++;
    const event: ScheduleEvent = { ...insertEvent, id };
    this.scheduleEvents.set(id, event);
    return event;
  }
  
  async updateScheduleEvent(id: number, eventData: Partial<InsertScheduleEvent>): Promise<ScheduleEvent | undefined> {
    const event = this.scheduleEvents.get(id);
    if (!event) return undefined;
    
    const updatedEvent: ScheduleEvent = { 
      ...event, 
      ...eventData 
    };
    this.scheduleEvents.set(id, updatedEvent);
    return updatedEvent;
  }
  
  async deleteScheduleEvent(id: number): Promise<boolean> {
    return this.scheduleEvents.delete(id);
  }
  
  // Budget operations
  async getBudgetItems(campId: number): Promise<BudgetItem[]> {
    return Array.from(this.budgetItems.values()).filter(
      (item) => item.campId === campId,
    );
  }
  
  async getBudgetItem(id: number): Promise<BudgetItem | undefined> {
    return this.budgetItems.get(id);
  }
  
  async createBudgetItem(insertItem: InsertBudgetItem): Promise<BudgetItem> {
    const id = this.budgetItemId++;
    const item: BudgetItem = { ...insertItem, id };
    this.budgetItems.set(id, item);
    return item;
  }
  
  async updateBudgetItem(id: number, itemData: Partial<InsertBudgetItem>): Promise<BudgetItem | undefined> {
    const item = this.budgetItems.get(id);
    if (!item) return undefined;
    
    const updatedItem: BudgetItem = { 
      ...item, 
      ...itemData 
    };
    this.budgetItems.set(id, updatedItem);
    return updatedItem;
  }
  
  async deleteBudgetItem(id: number): Promise<boolean> {
    return this.budgetItems.delete(id);
  }
  
  // Document operations
  async getDocuments(campId: number): Promise<Document[]> {
    return Array.from(this.documents.values()).filter(
      (document) => document.campId === campId,
    );
  }
  
  async getDocument(id: number): Promise<Document | undefined> {
    return this.documents.get(id);
  }
  
  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const id = this.documentId++;
    const uploadedAt = new Date();
    const document: Document = { ...insertDocument, id, uploadedAt };
    this.documents.set(id, document);
    return document;
  }
  
  async updateDocument(id: number, documentData: Partial<InsertDocument>): Promise<Document | undefined> {
    const document = this.documents.get(id);
    if (!document) return undefined;
    
    const updatedDocument: Document = { 
      ...document, 
      ...documentData 
    };
    this.documents.set(id, updatedDocument);
    return updatedDocument;
  }
  
  async deleteDocument(id: number): Promise<boolean> {
    return this.documents.delete(id);
  }
  
  // Task operations
  async getTasks(campId: number): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(
      (task) => task.campId === campId,
    );
  }
  
  async getTask(id: number): Promise<Task | undefined> {
    return this.tasks.get(id);
  }
  
  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = this.taskId++;
    const task: Task = { ...insertTask, id, completedAt: null };
    this.tasks.set(id, task);
    return task;
  }
  
  async updateTask(id: number, taskData: Partial<InsertTask>): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;
    
    const updatedTask: Task = { 
      ...task, 
      ...taskData,
      completedAt: taskData.status === 'completed' && !task.completedAt ? new Date() : task.completedAt
    };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }
  
  async deleteTask(id: number): Promise<boolean> {
    return this.tasks.delete(id);
  }
  
  // Activity operations
  async getActivities(campId: number): Promise<Activity[]> {
    return Array.from(this.activities.values())
      .filter(activity => !campId || activity.campId === campId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
  
  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const id = this.activityId++;
    const timestamp = new Date();
    const activity: Activity = { ...insertActivity, id, timestamp };
    this.activities.set(id, activity);
    return activity;
  }
}

export const storage = new MemStorage();
