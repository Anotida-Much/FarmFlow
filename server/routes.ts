import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { 
  insertUserSchema, 
  insertTaskSchema, 
  insertInventorySchema, 
  insertEquipmentSchema, 
  insertContactSchema, 
  insertWeatherPreferenceSchema 
} from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import session from "express-session";
import MemoryStore from "memorystore";
import fetch from "node-fetch";

const SessionStore = MemoryStore(session);

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up session middleware
  app.use(
    session({
      cookie: {
        maxAge: 86400000, // 1 day
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      },
      store: new SessionStore({
        checkPeriod: 86400000, // 1 day
      }),
      resave: false,
      saveUninitialized: false,
      secret: process.env.SESSION_SECRET || "farm-management-secret",
    })
  );

  // Authentication middleware
  const requireAuth = (req: Request, res: Response, next: Function) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already taken" });
      }
      
      // Check if email already exists
      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already in use" });
      }
      
      // Create user
      const user = await storage.createUser(userData);
      
      // Login the user
      req.session.userId = user.id;
      
      // Return user data (excluding password)
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: validationError.message });
      } else {
        res.status(500).json({ message: "Server error during registration" });
      }
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Set user ID in session
      req.session.userId = user.id;
      
      // Return user data (excluding password)
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Server error during login" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const user = await storage.getUser(req.session.userId);
      
      if (!user) {
        req.session.destroy(() => {});
        return res.status(401).json({ message: "User not found" });
      }
      
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Task routes
  app.get("/api/tasks", requireAuth, async (req, res) => {
    try {
      const tasks = await storage.getTasks(req.session.userId!);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.get("/api/tasks/:id", requireAuth, async (req, res) => {
    try {
      const task = await storage.getTask(parseInt(req.params.id));
      
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      if (task.userId !== req.session.userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      res.json(task);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch task" });
    }
  });

  app.post("/api/tasks", requireAuth, async (req, res) => {
    try {
      const taskData = insertTaskSchema.parse({
        ...req.body,
        userId: req.session.userId
      });
      
      const task = await storage.createTask(taskData);
      res.status(201).json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: validationError.message });
      } else {
        res.status(500).json({ message: "Failed to create task" });
      }
    }
  });

  app.patch("/api/tasks/:id", requireAuth, async (req, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const task = await storage.getTask(taskId);
      
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      if (task.userId !== req.session.userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const updatedTask = await storage.updateTask(taskId, req.body);
      res.json(updatedTask);
    } catch (error) {
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  app.delete("/api/tasks/:id", requireAuth, async (req, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const task = await storage.getTask(taskId);
      
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      if (task.userId !== req.session.userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      await storage.deleteTask(taskId);
      res.json({ message: "Task deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete task" });
    }
  });

  // Inventory routes
  app.get("/api/inventory", requireAuth, async (req, res) => {
    try {
      const items = await storage.getInventoryItems(req.session.userId!);
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch inventory" });
    }
  });

  app.post("/api/inventory", requireAuth, async (req, res) => {
    try {
      const itemData = insertInventorySchema.parse({
        ...req.body,
        userId: req.session.userId
      });
      
      const item = await storage.createInventoryItem(itemData);
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: validationError.message });
      } else {
        res.status(500).json({ message: "Failed to create inventory item" });
      }
    }
  });

  app.patch("/api/inventory/:id", requireAuth, async (req, res) => {
    try {
      const itemId = parseInt(req.params.id);
      const item = await storage.getInventoryItem(itemId);
      
      if (!item) {
        return res.status(404).json({ message: "Inventory item not found" });
      }
      
      if (item.userId !== req.session.userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const updatedItem = await storage.updateInventoryItem(itemId, req.body);
      res.json(updatedItem);
    } catch (error) {
      res.status(500).json({ message: "Failed to update inventory item" });
    }
  });

  app.delete("/api/inventory/:id", requireAuth, async (req, res) => {
    try {
      const itemId = parseInt(req.params.id);
      const item = await storage.getInventoryItem(itemId);
      
      if (!item) {
        return res.status(404).json({ message: "Inventory item not found" });
      }
      
      if (item.userId !== req.session.userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      await storage.deleteInventoryItem(itemId);
      res.json({ message: "Inventory item deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete inventory item" });
    }
  });

  // Equipment routes
  app.get("/api/equipment", requireAuth, async (req, res) => {
    try {
      const items = await storage.getEquipmentItems(req.session.userId!);
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch equipment" });
    }
  });

  app.post("/api/equipment", requireAuth, async (req, res) => {
    try {
      const itemData = insertEquipmentSchema.parse({
        ...req.body,
        userId: req.session.userId
      });
      
      const item = await storage.createEquipmentItem(itemData);
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: validationError.message });
      } else {
        res.status(500).json({ message: "Failed to create equipment item" });
      }
    }
  });

  app.patch("/api/equipment/:id", requireAuth, async (req, res) => {
    try {
      const itemId = parseInt(req.params.id);
      const item = await storage.getEquipmentItem(itemId);
      
      if (!item) {
        return res.status(404).json({ message: "Equipment item not found" });
      }
      
      if (item.userId !== req.session.userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const updatedItem = await storage.updateEquipmentItem(itemId, req.body);
      res.json(updatedItem);
    } catch (error) {
      res.status(500).json({ message: "Failed to update equipment item" });
    }
  });

  app.delete("/api/equipment/:id", requireAuth, async (req, res) => {
    try {
      const itemId = parseInt(req.params.id);
      const item = await storage.getEquipmentItem(itemId);
      
      if (!item) {
        return res.status(404).json({ message: "Equipment item not found" });
      }
      
      if (item.userId !== req.session.userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      await storage.deleteEquipmentItem(itemId);
      res.json({ message: "Equipment item deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete equipment item" });
    }
  });

  // Contact routes
  app.get("/api/contacts", requireAuth, async (req, res) => {
    try {
      const contacts = await storage.getContacts(req.session.userId!);
      res.json(contacts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch contacts" });
    }
  });

  app.post("/api/contacts", requireAuth, async (req, res) => {
    try {
      const contactData = insertContactSchema.parse({
        ...req.body,
        userId: req.session.userId
      });
      
      const contact = await storage.createContact(contactData);
      res.status(201).json(contact);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: validationError.message });
      } else {
        res.status(500).json({ message: "Failed to create contact" });
      }
    }
  });

  // Weather routes
  app.get("/api/weather/preferences", requireAuth, async (req, res) => {
    try {
      const preferences = await storage.getWeatherPreference(req.session.userId!);
      
      if (!preferences) {
        // Create default preferences if none exist
        const defaultPrefs = {
          userId: req.session.userId!,
          location: "Harare",
          units: "metric"
        };
        
        const newPrefs = await storage.setWeatherPreference(defaultPrefs);
        return res.json(newPrefs);
      }
      
      res.json(preferences);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch weather preferences" });
    }
  });

  app.patch("/api/weather/preferences", requireAuth, async (req, res) => {
    try {
      const updatedPrefs = await storage.updateWeatherPreference(
        req.session.userId!,
        req.body
      );
      
      if (!updatedPrefs) {
        // Create if not exists
        const newPrefs = await storage.setWeatherPreference({
          userId: req.session.userId!,
          ...req.body
        });
        return res.json(newPrefs);
      }
      
      res.json(updatedPrefs);
    } catch (error) {
      res.status(500).json({ message: "Failed to update weather preferences" });
    }
  });

  app.get("/api/weather/current", requireAuth, async (req, res) => {
    try {
      const prefs = await storage.getWeatherPreference(req.session.userId!);
      const location = prefs?.location || "Harare";
      const units = prefs?.units || "metric";
      
      const apiKey = process.env.OPENWEATHERMAP_API_KEY || "sample_key";
      
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${location}&units=${units}&appid=${apiKey}`
      );
      
      if (!response.ok) {
        return res.status(response.status).json({ 
          message: `Weather API error: ${response.statusText}` 
        });
      }
      
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch weather data" });
    }
  });

  app.get("/api/weather/forecast", requireAuth, async (req, res) => {
    try {
      const prefs = await storage.getWeatherPreference(req.session.userId!);
      const location = prefs?.location || "Harare";
      const units = prefs?.units || "metric";
      
      const apiKey = process.env.OPENWEATHERMAP_API_KEY || "sample_key";
      
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${location}&units=${units}&appid=${apiKey}`
      );
      
      if (!response.ok) {
        return res.status(response.status).json({ 
          message: `Weather API error: ${response.statusText}` 
        });
      }
      
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch weather forecast" });
    }
  });

  // Farm metrics
  app.get("/api/metrics", requireAuth, async (req, res) => {
    try {
      const tasks = await storage.getTasks(req.session.userId!);
      const inventory = await storage.getInventoryItems(req.session.userId!);
      const equipment = await storage.getEquipmentItems(req.session.userId!);
      
      // Calculate metrics
      const taskCompletion = tasks.length > 0 
        ? Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100) 
        : 100;
      
      const inventoryHealth = inventory.length > 0
        ? Math.round((inventory.filter(i => i.status === "good").length / inventory.length) * 100)
        : 100;
      
      const equipmentUtilization = equipment.length > 0
        ? Math.round((equipment.filter(e => e.status === "in-use").length / equipment.length) * 100)
        : 0;
      
      // Sample yield estimate (would be calculated based on real data in production)
      const yieldEstimate = 90;
      
      res.json({
        taskCompletion,
        inventoryHealth,
        equipmentUtilization,
        yieldEstimate
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to calculate metrics" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
