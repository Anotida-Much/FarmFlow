import { 
  users, type User, type InsertUser,
  tasks, type Task, type InsertTask,
  inventory, type Inventory, type InsertInventory,
  equipment, type Equipment, type InsertEquipment,
  contacts, type Contact, type InsertContact,
  weatherPreferences, type WeatherPreference, type InsertWeatherPreference
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User | undefined>;
  
  // Task methods
  getTasks(userId: number): Promise<Task[]>;
  getTask(id: number): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, data: Partial<Task>): Promise<Task | undefined>;
  deleteTask(id: number): Promise<boolean>;
  
  // Inventory methods
  getInventoryItems(userId: number): Promise<Inventory[]>;
  getInventoryItem(id: number): Promise<Inventory | undefined>;
  createInventoryItem(item: InsertInventory): Promise<Inventory>;
  updateInventoryItem(id: number, data: Partial<Inventory>): Promise<Inventory | undefined>;
  deleteInventoryItem(id: number): Promise<boolean>;
  
  // Equipment methods
  getEquipmentItems(userId: number): Promise<Equipment[]>;
  getEquipmentItem(id: number): Promise<Equipment | undefined>;
  createEquipmentItem(item: InsertEquipment): Promise<Equipment>;
  updateEquipmentItem(id: number, data: Partial<Equipment>): Promise<Equipment | undefined>;
  deleteEquipmentItem(id: number): Promise<boolean>;
  
  // Contact methods
  getContacts(userId: number): Promise<Contact[]>;
  getContact(id: number): Promise<Contact | undefined>;
  createContact(contact: InsertContact): Promise<Contact>;
  updateContact(id: number, data: Partial<Contact>): Promise<Contact | undefined>;
  deleteContact(id: number): Promise<boolean>;
  
  // Weather preferences methods
  getWeatherPreference(userId: number): Promise<WeatherPreference | undefined>;
  setWeatherPreference(pref: InsertWeatherPreference): Promise<WeatherPreference>;
  updateWeatherPreference(userId: number, data: Partial<WeatherPreference>): Promise<WeatherPreference | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private tasks: Map<number, Task>;
  private inventoryItems: Map<number, Inventory>;
  private equipmentItems: Map<number, Equipment>;
  private contactItems: Map<number, Contact>;
  private weatherPrefs: Map<number, WeatherPreference>;
  
  private userIdCounter: number;
  private taskIdCounter: number;
  private inventoryIdCounter: number;
  private equipmentIdCounter: number;
  private contactIdCounter: number;
  private weatherPrefIdCounter: number;

  constructor() {
    this.users = new Map();
    this.tasks = new Map();
    this.inventoryItems = new Map();
    this.equipmentItems = new Map();
    this.contactItems = new Map();
    this.weatherPrefs = new Map();
    
    this.userIdCounter = 1;
    this.taskIdCounter = 1;
    this.inventoryIdCounter = 1;
    this.equipmentIdCounter = 1;
    this.contactIdCounter = 1;
    this.weatherPrefIdCounter = 1;
    
    // Add demo user
    this.createUser({
      username: "demo",
      password: "password123",
      email: "demo@example.com",
      name: "Thomas Moyo",
      farmName: "Green Valley Farm",
      role: "farmer",
      profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&q=80",
      language: "en"
    });
    
    // Add demo data for the demo user
    const demoUserId = 1;
    
    // Add sample tasks
    this.createTask({
      title: "Harvest tomatoes",
      description: "Harvest ripe tomatoes from field 2",
      dueDate: new Date("2023-11-01"),
      priority: "high",
      status: "today",
      completed: false,
      assignedTo: "Self",
      userId: demoUserId,
      recurring: null
    });
    
    this.createTask({
      title: "Irrigate maize field",
      description: "Set up irrigation system for maize field",
      dueDate: new Date("2023-10-28"),
      priority: "critical",
      status: "overdue",
      completed: false,
      assignedTo: "John",
      userId: demoUserId,
      recurring: null
    });
    
    this.createTask({
      title: "Apply fertilizer",
      description: "Apply NPK fertilizer to vegetable beds",
      dueDate: new Date("2023-11-05"),
      priority: "medium",
      status: "upcoming",
      completed: false,
      assignedTo: "Maria",
      userId: demoUserId,
      recurring: null
    });
    
    this.createTask({
      title: "Repair fence",
      description: "Fix broken fence in north section",
      dueDate: new Date("2023-10-20"),
      priority: "medium",
      status: "completed",
      completed: true,
      assignedTo: "Self",
      userId: demoUserId,
      recurring: null
    });
    
    // Add sample inventory
    this.createInventoryItem({
      name: "Tomato Seeds",
      category: "Seeds",
      quantity: 5,
      unit: "kg",
      threshold: 10,
      userId: demoUserId
    });
    
    this.createInventoryItem({
      name: "NPK Fertilizer",
      category: "Fertilizer",
      quantity: 200,
      unit: "kg",
      threshold: 50,
      userId: demoUserId
    });
    
    this.createInventoryItem({
      name: "Pesticide",
      category: "Chemicals",
      quantity: 15,
      unit: "L",
      threshold: 5,
      userId: demoUserId
    });
    
    this.createInventoryItem({
      name: "Chicken Feed",
      category: "Feed",
      quantity: 25,
      unit: "bags",
      threshold: 10,
      userId: demoUserId
    });
    
    // Add sample equipment
    this.createEquipmentItem({
      name: "Tractor",
      status: "maintenance-due",
      lastUsed: new Date("2023-10-15"),
      assignedTo: "Thomas",
      nextService: new Date("2023-11-05"),
      userId: demoUserId
    });
    
    this.createEquipmentItem({
      name: "Irrigation Pump",
      status: "available",
      lastUsed: new Date("2023-10-25"),
      assignedTo: null,
      nextService: new Date("2023-12-15"),
      userId: demoUserId
    });
    
    this.createEquipmentItem({
      name: "Harvester",
      status: "in-use",
      lastUsed: new Date("2023-10-30"),
      assignedTo: "Maria",
      nextService: new Date("2023-11-30"),
      userId: demoUserId
    });
    
    // Add weather preference
    this.setWeatherPreference({
      userId: demoUserId,
      location: "Harare",
      units: "metric"
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...data };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  // Task methods
  async getTasks(userId: number): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(
      (task) => task.userId === userId
    );
  }
  
  async getTask(id: number): Promise<Task | undefined> {
    return this.tasks.get(id);
  }
  
  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = this.taskIdCounter++;
    const now = new Date();
    const task: Task = { 
      ...insertTask, 
      id, 
      createdAt: now,
      dueDate: new Date(insertTask.dueDate)
    };
    
    // Determine status based on due date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (task.completed) {
      task.status = "completed";
    } else if (task.dueDate < today) {
      task.status = "overdue";
    } else if (task.dueDate.getTime() === today.getTime()) {
      task.status = "today";
    } else {
      task.status = "upcoming";
    }
    
    this.tasks.set(id, task);
    return task;
  }
  
  async updateTask(id: number, data: Partial<Task>): Promise<Task | undefined> {
    const task = await this.getTask(id);
    if (!task) return undefined;
    
    const updatedTask = { ...task, ...data };
    
    // Update status if completion state changed
    if (data.completed !== undefined) {
      if (data.completed) {
        updatedTask.status = "completed";
      } else {
        // Recalculate status based on due date
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dueDate = updatedTask.dueDate;
        
        if (dueDate < today) {
          updatedTask.status = "overdue";
        } else if (dueDate.getTime() === today.getTime()) {
          updatedTask.status = "today";
        } else {
          updatedTask.status = "upcoming";
        }
      }
    }
    
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }
  
  async deleteTask(id: number): Promise<boolean> {
    return this.tasks.delete(id);
  }
  
  // Inventory methods
  async getInventoryItems(userId: number): Promise<Inventory[]> {
    return Array.from(this.inventoryItems.values()).filter(
      (item) => item.userId === userId
    );
  }
  
  async getInventoryItem(id: number): Promise<Inventory | undefined> {
    return this.inventoryItems.get(id);
  }
  
  async createInventoryItem(insertItem: InsertInventory): Promise<Inventory> {
    const id = this.inventoryIdCounter++;
    const now = new Date();
    
    // Determine status based on quantity vs threshold
    const status = insertItem.quantity < insertItem.threshold ? "low" : "good";
    
    const item: Inventory = { 
      ...insertItem, 
      id, 
      lastUpdated: now,
      status
    };
    
    this.inventoryItems.set(id, item);
    return item;
  }
  
  async updateInventoryItem(id: number, data: Partial<Inventory>): Promise<Inventory | undefined> {
    const item = await this.getInventoryItem(id);
    if (!item) return undefined;
    
    const updatedItem = { ...item, ...data, lastUpdated: new Date() };
    
    // Update status if quantity changed
    if (data.quantity !== undefined || data.threshold !== undefined) {
      const quantity = data.quantity ?? item.quantity;
      const threshold = data.threshold ?? item.threshold;
      updatedItem.status = quantity < threshold ? "low" : "good";
    }
    
    this.inventoryItems.set(id, updatedItem);
    return updatedItem;
  }
  
  async deleteInventoryItem(id: number): Promise<boolean> {
    return this.inventoryItems.delete(id);
  }
  
  // Equipment methods
  async getEquipmentItems(userId: number): Promise<Equipment[]> {
    return Array.from(this.equipmentItems.values()).filter(
      (item) => item.userId === userId
    );
  }
  
  async getEquipmentItem(id: number): Promise<Equipment | undefined> {
    return this.equipmentItems.get(id);
  }
  
  async createEquipmentItem(insertItem: InsertEquipment): Promise<Equipment> {
    const id = this.equipmentIdCounter++;
    
    // Convert date strings to Date objects
    const lastUsed = insertItem.lastUsed ? new Date(insertItem.lastUsed) : undefined;
    const nextService = insertItem.nextService ? new Date(insertItem.nextService) : undefined;
    
    const item: Equipment = { 
      ...insertItem, 
      id,
      lastUsed,
      nextService
    };
    
    this.equipmentItems.set(id, item);
    return item;
  }
  
  async updateEquipmentItem(id: number, data: Partial<Equipment>): Promise<Equipment | undefined> {
    const item = await this.getEquipmentItem(id);
    if (!item) return undefined;
    
    // Convert date strings to Date objects if they exist
    const lastUsed = data.lastUsed ? new Date(data.lastUsed) : item.lastUsed;
    const nextService = data.nextService ? new Date(data.nextService) : item.nextService;
    
    const updatedItem = { 
      ...item, 
      ...data,
      lastUsed,
      nextService
    };
    
    this.equipmentItems.set(id, updatedItem);
    return updatedItem;
  }
  
  async deleteEquipmentItem(id: number): Promise<boolean> {
    return this.equipmentItems.delete(id);
  }
  
  // Contact methods
  async getContacts(userId: number): Promise<Contact[]> {
    return Array.from(this.contactItems.values()).filter(
      (contact) => contact.userId === userId
    );
  }
  
  async getContact(id: number): Promise<Contact | undefined> {
    return this.contactItems.get(id);
  }
  
  async createContact(insertContact: InsertContact): Promise<Contact> {
    const id = this.contactIdCounter++;
    const contact: Contact = { ...insertContact, id };
    this.contactItems.set(id, contact);
    return contact;
  }
  
  async updateContact(id: number, data: Partial<Contact>): Promise<Contact | undefined> {
    const contact = await this.getContact(id);
    if (!contact) return undefined;
    
    const updatedContact = { ...contact, ...data };
    this.contactItems.set(id, updatedContact);
    return updatedContact;
  }
  
  async deleteContact(id: number): Promise<boolean> {
    return this.contactItems.delete(id);
  }
  
  // Weather preference methods
  async getWeatherPreference(userId: number): Promise<WeatherPreference | undefined> {
    return Array.from(this.weatherPrefs.values()).find(
      (pref) => pref.userId === userId
    );
  }
  
  async setWeatherPreference(insertPref: InsertWeatherPreference): Promise<WeatherPreference> {
    // Check if preference already exists for user
    const existingPref = await this.getWeatherPreference(insertPref.userId);
    
    if (existingPref) {
      // Update existing preference
      const updatedPref = { ...existingPref, ...insertPref };
      this.weatherPrefs.set(existingPref.id, updatedPref);
      return updatedPref;
    } else {
      // Create new preference
      const id = this.weatherPrefIdCounter++;
      const pref: WeatherPreference = { ...insertPref, id };
      this.weatherPrefs.set(id, pref);
      return pref;
    }
  }
  
  async updateWeatherPreference(userId: number, data: Partial<WeatherPreference>): Promise<WeatherPreference | undefined> {
    const pref = await this.getWeatherPreference(userId);
    if (!pref) return undefined;
    
    const updatedPref = { ...pref, ...data };
    this.weatherPrefs.set(pref.id, updatedPref);
    return updatedPref;
  }
}

export const storage = new MemStorage();
