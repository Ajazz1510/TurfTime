import { 
  users, User, InsertUser,
  turfs, Turf, InsertTurf,
  slots, Slot, InsertSlot,
  bookings, Booking, InsertBooking
} from "@shared/schema";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { eq, and, asc, desc, sql, count } from "drizzle-orm";
import { db } from "./db";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
  
  // Turf operations
  getTurf(id: number): Promise<Turf | undefined>;
  getTurfsByOwner(ownerId: number): Promise<Turf[]>;
  getTurfsBySportType(sportType: string): Promise<Turf[]>;
  createTurf(turf: InsertTurf): Promise<Turf>;
  updateTurf(id: number, turfData: Partial<Turf>): Promise<Turf | undefined>;
  deleteTurf(id: number): Promise<boolean>;
  
  // Slot operations
  getSlot(id: number): Promise<Slot | undefined>;
  getSlotsByOwner(ownerId: number): Promise<Slot[]>;
  getAvailableSlots(ownerId?: number, turfId?: number): Promise<Slot[]>;
  createSlot(slot: InsertSlot): Promise<Slot>;
  updateSlot(id: number, slotData: Partial<Slot>): Promise<Slot | undefined>;
  deleteSlot(id: number): Promise<boolean>;
  
  // Booking operations
  getBooking(id: number): Promise<Booking | undefined>;
  getBookingsByCustomer(customerId: number): Promise<Booking[]>;
  getBookingsByOwner(ownerId: number): Promise<Booking[]>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBooking(id: number, bookingData: Partial<Booking>): Promise<Booking | undefined>;
  deleteBooking(id: number): Promise<boolean>;
  
  // Session store
  sessionStore: session.Store;
}

export class PostgresStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
    
    // Initialize the database with seed data
    this.initializeDatabase();
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0];
  }
  
  async createUser(userData: InsertUser): Promise<User> {
    const result = await db.insert(users).values(userData).returning();
    return result[0];
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const result = await db.update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }
  
  // Turf operations
  async getTurf(id: number): Promise<Turf | undefined> {
    const result = await db.select().from(turfs).where(eq(turfs.id, id));
    return result[0];
  }
  
  async getTurfsByOwner(ownerId: number): Promise<Turf[]> {
    return await db.select().from(turfs).where(eq(turfs.ownerId, ownerId));
  }
  
  async getTurfsBySportType(sportType: string): Promise<Turf[]> {
    return await db.select().from(turfs).where(eq(turfs.sportType, sportType as any));
  }
  
  async createTurf(turfData: InsertTurf): Promise<Turf> {
    const result = await db.insert(turfs).values(turfData).returning();
    return result[0];
  }
  
  async updateTurf(id: number, turfData: Partial<Turf>): Promise<Turf | undefined> {
    const result = await db.update(turfs)
      .set(turfData)
      .where(eq(turfs.id, id))
      .returning();
    return result[0];
  }
  
  async deleteTurf(id: number): Promise<boolean> {
    const result = await db.delete(turfs).where(eq(turfs.id, id)).returning();
    return result.length > 0;
  }
  
  // Slot operations
  async getSlot(id: number): Promise<Slot | undefined> {
    const result = await db.select().from(slots).where(eq(slots.id, id));
    return result[0];
  }
  
  async getSlotsByOwner(ownerId: number): Promise<Slot[]> {
    return await db.select().from(slots).where(eq(slots.ownerId, ownerId));
  }
  
  async getAvailableSlots(ownerId?: number, turfId?: number): Promise<Slot[]> {
    let conditions = and(eq(slots.isBooked, false));
    
    if (ownerId !== undefined) {
      conditions = and(conditions, eq(slots.ownerId, ownerId));
    }
    
    if (turfId !== undefined) {
      conditions = and(conditions, eq(slots.turfId, turfId));
    }
    
    return await db.select()
      .from(slots)
      .where(conditions)
      .orderBy(asc(slots.startTime));
  }
  
  async createSlot(slotData: InsertSlot): Promise<Slot> {
    const result = await db.insert(slots).values(slotData).returning();
    return result[0];
  }
  
  async updateSlot(id: number, slotData: Partial<Slot>): Promise<Slot | undefined> {
    const result = await db.update(slots)
      .set(slotData)
      .where(eq(slots.id, id))
      .returning();
    return result[0];
  }
  
  async deleteSlot(id: number): Promise<boolean> {
    const result = await db.delete(slots).where(eq(slots.id, id)).returning();
    return result.length > 0;
  }
  
  // Booking operations
  async getBooking(id: number): Promise<Booking | undefined> {
    const result = await db.select().from(bookings).where(eq(bookings.id, id));
    return result[0];
  }
  
  async getBookingsByCustomer(customerId: number): Promise<Booking[]> {
    return await db.select()
      .from(bookings)
      .where(eq(bookings.customerId, customerId))
      .orderBy(desc(bookings.createdAt));
  }
  
  async getBookingsByOwner(ownerId: number): Promise<Booking[]> {
    return await db.select()
      .from(bookings)
      .where(eq(bookings.ownerId, ownerId))
      .orderBy(desc(bookings.createdAt));
  }
  
  async createBooking(bookingData: InsertBooking): Promise<Booking> {
    // Start a transaction to handle slot booking atomically
    const result = await db.transaction(async (tx) => {
      // Create the booking
      const booking = (await tx.insert(bookings).values(bookingData).returning())[0];
      
      // Update the slot to be booked
      await tx.update(slots)
        .set({ isBooked: true })
        .where(eq(slots.id, bookingData.slotId));
      
      return booking;
    });
    
    return result;
  }
  
  async updateBooking(id: number, bookingData: Partial<Booking>): Promise<Booking | undefined> {
    // If status is being updated to cancelled, free up the slot
    if (bookingData.status === "cancelled") {
      return await db.transaction(async (tx) => {
        // Get the booking to find the slot
        const bookingResult = await tx.select().from(bookings).where(eq(bookings.id, id));
        const booking = bookingResult[0];
        
        if (!booking) return undefined;
        
        // Update the booking
        const updatedBooking = (await tx.update(bookings)
          .set(bookingData)
          .where(eq(bookings.id, id))
          .returning())[0];
        
        // Free up the slot
        await tx.update(slots)
          .set({ isBooked: false })
          .where(eq(slots.id, booking.slotId));
        
        return updatedBooking;
      });
    } else {
      // Simple update without changing slot status
      const result = await db.update(bookings)
        .set(bookingData)
        .where(eq(bookings.id, id))
        .returning();
      return result[0];
    }
  }
  
  async deleteBooking(id: number): Promise<boolean> {
    return await db.transaction(async (tx) => {
      // Get the booking to find the slot
      const bookingResult = await tx.select().from(bookings).where(eq(bookings.id, id));
      const booking = bookingResult[0];
      
      if (!booking) return false;
      
      // Delete the booking
      const deleteResult = await tx.delete(bookings).where(eq(bookings.id, id)).returning();
      
      if (deleteResult.length === 0) return false;
      
      // Free up the slot
      await tx.update(slots)
        .set({ isBooked: false })
        .where(eq(slots.id, booking.slotId));
      
      return true;
    });
  }
  
  // Initialize database with seed data if needed
  private async initializeDatabase() {
    try {
      // Check if users table is empty
      const userCount = await db.select({ count: count() }).from(users);
      
      if (userCount.length === 0 || userCount[0].count === 0) {
        console.log("Initializing database with seed data...");
        
        // Create owner user with hashed password (this is "password")
        const owner = await this.createUser({
          username: "owner",
          password: "$2b$10$8dIwMhYzKW7ZVeKCQQeYnO5cLArzU/yrDYkCmAaVNGVBdL9QF1Gua", 
          email: "owner@turfbooking.com",
          fullName: "Turf Owner",
          role: "owner",
          businessName: "Premier Turf Club",
          phone: "555-123-4567",
          address: "123 Sports Lane",
          city: "Sportsville"
        });
        
        // Create customer user
        const customer = await this.createUser({
          username: "customer",
          password: "$2b$10$8dIwMhYzKW7ZVeKCQQeYnO5cLArzU/yrDYkCmAaVNGVBdL9QF1Gua", 
          email: "customer@example.com",
          fullName: "Sam Player",
          role: "customer",
          phone: "555-987-6543"
        });
        
        // Create turf for cricket
        const cricketTurf = await this.createTurf({
          ownerId: owner.id,
          name: "Premium Cricket Ground",
          description: "Professional cricket ground with well-maintained pitch and outfield",
          sportType: "cricket",
          maxPlayers: 22,
          duration: 120, // 2 hours
          price: 400, // ₹400
          amenities: { changeRooms: true, floodlights: true, parking: true, refreshments: true },
          location: "North Sports Complex"
        });
        
        // Create turf for football
        const footballTurf = await this.createTurf({
          ownerId: owner.id,
          name: "Elite Football Field",
          description: "FIFA-standard football field with artificial turf",
          sportType: "football",
          maxPlayers: 14,
          duration: 60, // 1 hour
          price: 500, // ₹500
          amenities: { changeRooms: true, floodlights: true, parking: true },
          location: "Central Stadium"
        });
        
        // Create turf for badminton
        const badmintonTurf = await this.createTurf({
          ownerId: owner.id,
          name: "Indoor Badminton Court",
          description: "Premium indoor badminton courts with wooden flooring",
          sportType: "badminton",
          maxPlayers: 4,
          duration: 60, // 1 hour
          price: 500, // ₹500
          amenities: { airConditioned: true, equipmentRental: true },
          location: "East Sports Hall"
        });
        
        // Create slots for the next 7 days
        const now = new Date();
        
        for (let dayOffset = 1; dayOffset <= 7; dayOffset++) {
          const date = new Date(now);
          date.setDate(date.getDate() + dayOffset);
          date.setHours(0, 0, 0, 0);
          
          // Cricket slots (2-hour slots from 6am to 6pm)
          for (let i = 0; i < 6; i++) {
            const startTime = new Date(date);
            startTime.setHours(6 + i * 2, 0, 0, 0);
            
            const endTime = new Date(startTime);
            endTime.setMinutes(endTime.getMinutes() + 120); // 2 hour slots
            
            await this.createSlot({
              ownerId: owner.id,
              turfId: cricketTurf.id,
              startTime,
              endTime,
              isBooked: false
            });
          }
          
          // Football slots (1-hour slots from 8am to 8pm)
          for (let i = 0; i < 12; i++) {
            const startTime = new Date(date);
            startTime.setHours(8 + i, 0, 0, 0);
            
            const endTime = new Date(startTime);
            endTime.setMinutes(endTime.getMinutes() + 60); // 1 hour slots
            
            await this.createSlot({
              ownerId: owner.id,
              turfId: footballTurf.id,
              startTime,
              endTime,
              isBooked: false
            });
          }
          
          // Badminton slots (1-hour slots from 9am to 9pm)
          for (let i = 0; i < 12; i++) {
            const startTime = new Date(date);
            startTime.setHours(9 + i, 0, 0, 0);
            
            const endTime = new Date(startTime);
            endTime.setMinutes(endTime.getMinutes() + 60); // 1 hour slots
            
            await this.createSlot({
              ownerId: owner.id,
              turfId: badmintonTurf.id,
              startTime,
              endTime,
              isBooked: false
            });
          }
        }
        
        // Create a sample booking for cricket
        const cricketSlots = await this.getAvailableSlots(owner.id, cricketTurf.id);
        if (cricketSlots.length > 0) {
          await this.createBooking({
            customerId: customer.id,
            ownerId: owner.id,
            turfId: cricketTurf.id,
            slotId: cricketSlots[0].id,
            status: "confirmed",
            teamName: "Chennai Stars",
            playerCount: 16,
            notes: "Weekend match practice"
          });
        }
        
        // Create a sample booking for football
        const footballSlots = await this.getAvailableSlots(owner.id, footballTurf.id);
        if (footballSlots.length > 0) {
          await this.createBooking({
            customerId: customer.id,
            ownerId: owner.id,
            turfId: footballTurf.id,
            slotId: footballSlots[0].id,
            status: "confirmed",
            teamName: "United FC",
            playerCount: 10,
            notes: "Regular practice session"
          });
        }
        
        console.log("Database initialized with seed data.");
      }
    } catch (error) {
      console.error("Error initializing database:", error);
    }
  }
}

// Export a single instance of the storage
export const storage = new PostgresStorage();
