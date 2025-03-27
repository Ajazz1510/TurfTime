import { pgTable, text, serial, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define user roles
export const userRoleEnum = pgEnum("user_role", ["customer", "owner"]);

// Define sports types
export const sportTypeEnum = pgEnum("sport_type", ["cricket", "football", "badminton"]);

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  role: userRoleEnum("role").notNull().default("customer"),
  businessName: text("business_name"),
  businessType: text("business_type"),
  phone: text("phone"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Turfs table (formerly services)
export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  sportType: sportTypeEnum("sport_type").notNull(),
  maxPlayers: integer("max_players").notNull(), // Maximum number of players allowed
  duration: integer("duration").notNull(), // in minutes
  price: integer("price").notNull(), // in cents
});

// Available slots table
export const slots = pgTable("slots", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id").notNull(),
  serviceId: integer("service_id").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  isBooked: boolean("is_booked").default(false),
});

// Bookings table
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull(),
  ownerId: integer("owner_id").notNull(),
  serviceId: integer("service_id").notNull(),
  slotId: integer("slot_id").notNull(),
  status: text("status").notNull().default("confirmed"), // confirmed, canceled, completed
  teamName: text("team_name"), // Optional team name
  playerCount: integer("player_count").notNull().default(1), // Number of players in booking
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Waitlist entries
export const waitlist = pgTable("waitlist", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  businessType: text("business_type"),
  userType: text("user_type").notNull(), // business-owner or customer
  newsletter: boolean("newsletter").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertServiceSchema = createInsertSchema(services).omit({ id: true });
export const insertSlotSchema = createInsertSchema(slots).omit({ id: true });
export const insertBookingSchema = createInsertSchema(bookings).omit({ id: true, createdAt: true });
export const insertWaitlistSchema = createInsertSchema(waitlist).omit({ id: true, createdAt: true });

// Insert types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertService = z.infer<typeof insertServiceSchema>;
export type InsertSlot = z.infer<typeof insertSlotSchema>;
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type InsertWaitlist = z.infer<typeof insertWaitlistSchema>;

// Select types
export type User = typeof users.$inferSelect;
export type Service = typeof services.$inferSelect;
export type Slot = typeof slots.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
export type WaitlistEntry = typeof waitlist.$inferSelect;

// Login schema (for validation)
export const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type LoginCredentials = z.infer<typeof loginSchema>;
