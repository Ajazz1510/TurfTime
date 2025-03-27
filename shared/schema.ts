import { pgTable, text, serial, integer, boolean, timestamp, pgEnum, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define user roles
export const userRoleEnum = pgEnum("user_role", ["customer", "owner"]);

// Define sports types
export const sportTypeEnum = pgEnum("sport_type", ["cricket", "football", "badminton"]);

// Define booking status 
export const bookingStatusEnum = pgEnum("booking_status", ["pending", "confirmed", "cancelled", "completed"]);

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  role: userRoleEnum("role").notNull().default("customer"),
  // For turf owners
  businessName: text("business_name"),
  phone: text("phone"),
  address: text("address"),
  city: text("city"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Turfs table
export const turfs = pgTable("turfs", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  sportType: sportTypeEnum("sport_type").notNull(),
  maxPlayers: integer("max_players").notNull(), // Maximum number of players allowed
  duration: integer("duration").notNull(), // in minutes
  price: integer("price").notNull(), // in rupees (INR)
  amenities: jsonb("amenities").default({}).notNull(),
  location: text("location"),
  imageUrl: text("image_url"),
});

// Available slots table
export const slots = pgTable("slots", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id").notNull(),
  turfId: integer("turf_id").notNull(), // Renamed from serviceId
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  isBooked: boolean("is_booked").default(false),
});

// Bookings table
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull(),
  ownerId: integer("owner_id").notNull(),
  turfId: integer("turf_id").notNull(), // Renamed from serviceId
  slotId: integer("slot_id").notNull(),
  status: bookingStatusEnum("status").notNull().default("pending"), 
  teamName: text("team_name").notNull(), // Team name is required for turf bookings
  playerCount: integer("player_count").notNull(), // Number of players in booking
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertTurfSchema = createInsertSchema(turfs).omit({ id: true });
// Create the slot schema with proper date transformation
export const insertSlotSchema = createInsertSchema(slots, {
  startTime: z.string().or(z.date()).transform(val => 
    typeof val === 'string' ? new Date(val) : val
  ),
  endTime: z.string().or(z.date()).transform(val => 
    typeof val === 'string' ? new Date(val) : val
  ),
}).omit({ id: true });
// Enhanced booking schema with more detailed validation
export const insertBookingSchema = createInsertSchema(bookings, {
  teamName: z.string().min(2, "Team name must be at least 2 characters"),
  playerCount: z.number().int().positive("Player count must be a positive number"),
  status: z.enum(bookingStatusEnum.enumValues, {
    errorMap: () => ({ message: `Status must be one of: ${bookingStatusEnum.enumValues.join(', ')}` })
  }),
  notes: z.string().optional(),
}).omit({ id: true, createdAt: true });

// Insert types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertTurf = z.infer<typeof insertTurfSchema>;
export type InsertSlot = z.infer<typeof insertSlotSchema>;
export type InsertBooking = z.infer<typeof insertBookingSchema>;

// Select types
export type User = typeof users.$inferSelect;
export type Turf = typeof turfs.$inferSelect;
export type Slot = typeof slots.$inferSelect;
export type Booking = typeof bookings.$inferSelect;

// Login schema (for validation)
export const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = insertUserSchema.extend({
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

export const profileSchema = z.object({
  fullName: z.string().min(3, "Full name must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional().nullable(),
  businessName: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
});

export type LoginCredentials = z.infer<typeof loginSchema>;
