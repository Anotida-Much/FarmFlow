import { pgTable, text, serial, integer, boolean, timestamp, date, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  farmName: text("farm_name").notNull(),
  role: text("role").notNull().default("farmer"),
  profileImage: text("profile_image"),
  language: text("language").default("en"),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

// Task model
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  dueDate: date("due_date").notNull(),
  priority: text("priority").notNull().default("medium"),
  status: text("status").notNull().default("upcoming"),
  completed: boolean("completed").notNull().default(false),
  assignedTo: text("assigned_to").notNull().default("Self"),
  userId: integer("user_id").notNull(),
  recurring: text("recurring"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
});

// Inventory model
export const inventory = pgTable("inventory", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  quantity: real("quantity").notNull(),
  unit: text("unit").notNull(),
  threshold: real("threshold").notNull(),
  status: text("status").notNull().default("good"),
  userId: integer("user_id").notNull(),
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
});

export const insertInventorySchema = createInsertSchema(inventory).omit({
  id: true,
  lastUpdated: true,
  status: true,
});

// Equipment model
export const equipment = pgTable("equipment", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  status: text("status").notNull().default("available"),
  lastUsed: date("last_used"),
  assignedTo: text("assigned_to"),
  nextService: date("next_service"),
  userId: integer("user_id").notNull(),
});

export const insertEquipmentSchema = createInsertSchema(equipment).omit({
  id: true,
});

// Contact model
export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  notes: text("notes"),
  userId: integer("user_id").notNull(),
});

export const insertContactSchema = createInsertSchema(contacts).omit({
  id: true,
});

// Weather preferences model
export const weatherPreferences = pgTable("weather_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  location: text("location").notNull().default("Harare"),
  units: text("units").notNull().default("metric"),
});

export const insertWeatherPreferenceSchema = createInsertSchema(weatherPreferences).omit({
  id: true,
});

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

export type Inventory = typeof inventory.$inferSelect;
export type InsertInventory = z.infer<typeof insertInventorySchema>;

export type Equipment = typeof equipment.$inferSelect;
export type InsertEquipment = z.infer<typeof insertEquipmentSchema>;

export type Contact = typeof contacts.$inferSelect;
export type InsertContact = z.infer<typeof insertContactSchema>;

export type WeatherPreference = typeof weatherPreferences.$inferSelect;
export type InsertWeatherPreference = z.infer<typeof insertWeatherPreferenceSchema>;
