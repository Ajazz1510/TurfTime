import { 
  users, User, InsertUser, 
  services, Service, InsertService,
  slots, Slot, InsertSlot,
  bookings, Booking, InsertBooking,
  waitlist, WaitlistEntry, InsertWaitlist
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
  
  // Service operations
  getService(id: number): Promise<Service | undefined>;
  getServicesByOwner(ownerId: number): Promise<Service[]>;
  createService(service: InsertService): Promise<Service>;
  updateService(id: number, serviceData: Partial<Service>): Promise<Service | undefined>;
  deleteService(id: number): Promise<boolean>;
  
  // Slot operations
  getSlot(id: number): Promise<Slot | undefined>;
  getSlotsByOwner(ownerId: number): Promise<Slot[]>;
  getAvailableSlots(ownerId?: number, serviceId?: number): Promise<Slot[]>;
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
  
  // Waitlist operations
  addToWaitlist(entry: InsertWaitlist): Promise<WaitlistEntry>;
  
  // Session store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private services: Map<number, Service>;
  private slots: Map<number, Slot>;
  private bookings: Map<number, Booking>;
  private waitlistEntries: Map<number, WaitlistEntry>;
  
  private userIdCounter: number;
  private serviceIdCounter: number;
  private slotIdCounter: number;
  private bookingIdCounter: number;
  private waitlistIdCounter: number;
  
  sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.services = new Map();
    this.slots = new Map();
    this.bookings = new Map();
    this.waitlistEntries = new Map();
    
    this.userIdCounter = 1;
    this.serviceIdCounter = 1;
    this.slotIdCounter = 1;
    this.bookingIdCounter = 1;
    this.waitlistIdCounter = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24 hours
    });
    
    // Add initial data for testing
    this.seedData();
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }
  
  async createUser(userData: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    const user: User = { ...userData, id, createdAt: now };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  // Service operations
  async getService(id: number): Promise<Service | undefined> {
    return this.services.get(id);
  }
  
  async getServicesByOwner(ownerId: number): Promise<Service[]> {
    return Array.from(this.services.values()).filter(service => service.ownerId === ownerId);
  }
  
  async createService(serviceData: InsertService): Promise<Service> {
    const id = this.serviceIdCounter++;
    const service: Service = { ...serviceData, id };
    this.services.set(id, service);
    return service;
  }
  
  async updateService(id: number, serviceData: Partial<Service>): Promise<Service | undefined> {
    const service = this.services.get(id);
    if (!service) return undefined;
    
    const updatedService = { ...service, ...serviceData };
    this.services.set(id, updatedService);
    return updatedService;
  }
  
  async deleteService(id: number): Promise<boolean> {
    return this.services.delete(id);
  }
  
  // Slot operations
  async getSlot(id: number): Promise<Slot | undefined> {
    return this.slots.get(id);
  }
  
  async getSlotsByOwner(ownerId: number): Promise<Slot[]> {
    return Array.from(this.slots.values()).filter(slot => slot.ownerId === ownerId);
  }
  
  async getAvailableSlots(ownerId?: number, serviceId?: number): Promise<Slot[]> {
    let filteredSlots = Array.from(this.slots.values()).filter(slot => !slot.isBooked);
    
    if (ownerId !== undefined) {
      filteredSlots = filteredSlots.filter(slot => slot.ownerId === ownerId);
    }
    
    if (serviceId !== undefined) {
      filteredSlots = filteredSlots.filter(slot => slot.serviceId === serviceId);
    }
    
    return filteredSlots;
  }
  
  async createSlot(slotData: InsertSlot): Promise<Slot> {
    const id = this.slotIdCounter++;
    const slot: Slot = { ...slotData, id };
    this.slots.set(id, slot);
    return slot;
  }
  
  async updateSlot(id: number, slotData: Partial<Slot>): Promise<Slot | undefined> {
    const slot = this.slots.get(id);
    if (!slot) return undefined;
    
    const updatedSlot = { ...slot, ...slotData };
    this.slots.set(id, updatedSlot);
    return updatedSlot;
  }
  
  async deleteSlot(id: number): Promise<boolean> {
    return this.slots.delete(id);
  }
  
  // Booking operations
  async getBooking(id: number): Promise<Booking | undefined> {
    return this.bookings.get(id);
  }
  
  async getBookingsByCustomer(customerId: number): Promise<Booking[]> {
    return Array.from(this.bookings.values()).filter(booking => booking.customerId === customerId);
  }
  
  async getBookingsByOwner(ownerId: number): Promise<Booking[]> {
    return Array.from(this.bookings.values()).filter(booking => booking.ownerId === ownerId);
  }
  
  async createBooking(bookingData: InsertBooking): Promise<Booking> {
    const id = this.bookingIdCounter++;
    const now = new Date();
    const booking: Booking = { ...bookingData, id, createdAt: now };
    this.bookings.set(id, booking);
    
    // Update slot to be booked
    const slot = await this.getSlot(bookingData.slotId);
    if (slot) {
      await this.updateSlot(slot.id, { isBooked: true });
    }
    
    return booking;
  }
  
  async updateBooking(id: number, bookingData: Partial<Booking>): Promise<Booking | undefined> {
    const booking = this.bookings.get(id);
    if (!booking) return undefined;
    
    const updatedBooking = { ...booking, ...bookingData };
    this.bookings.set(id, updatedBooking);
    return updatedBooking;
  }
  
  async deleteBooking(id: number): Promise<boolean> {
    const booking = this.bookings.get(id);
    if (!booking) return false;
    
    // Free up the slot
    const slot = await this.getSlot(booking.slotId);
    if (slot) {
      await this.updateSlot(slot.id, { isBooked: false });
    }
    
    return this.bookings.delete(id);
  }
  
  // Waitlist operations
  async addToWaitlist(entryData: InsertWaitlist): Promise<WaitlistEntry> {
    const id = this.waitlistIdCounter++;
    const now = new Date();
    const entry: WaitlistEntry = { ...entryData, id, createdAt: now };
    this.waitlistEntries.set(id, entry);
    return entry;
  }
  
  // Seed some initial data for testing
  private async seedData() {
    // Create owner user
    await this.createUser({
      username: "businessowner",
      password: "$2b$10$8dIwMhYzKW7ZVeKCQQeYnO5cLArzU/yrDYkCmAaVNGVBdL9QF1Gua", // password = "password"
      email: "owner@example.com",
      fullName: "Business Owner",
      role: "owner",
      businessName: "Acme Salon",
      businessType: "salon",
      phone: "555-123-4567"
    });
    
    // Create customer user
    await this.createUser({
      username: "customer",
      password: "$2b$10$8dIwMhYzKW7ZVeKCQQeYnO5cLArzU/yrDYkCmAaVNGVBdL9QF1Gua", // password = "password"
      email: "customer@example.com",
      fullName: "John Customer",
      role: "customer",
      phone: "555-987-6543"
    });
    
    // Create some services
    const haircut = await this.createService({
      ownerId: 1, // Owner user
      name: "Haircut",
      description: "Standard haircut service",
      duration: 30,
      price: 2500 // $25.00
    });
    
    const coloring = await this.createService({
      ownerId: 1,
      name: "Hair Coloring",
      description: "Full hair coloring service",
      duration: 90,
      price: 7500 // $75.00
    });
    
    // Create some slots
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    
    for (let i = 0; i < 8; i++) {
      const startTime = new Date(tomorrow);
      startTime.setHours(9 + Math.floor(i / 2), (i % 2) * 30, 0, 0);
      
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + 30);
      
      await this.createSlot({
        ownerId: 1,
        serviceId: haircut.id,
        startTime,
        endTime,
        isBooked: false
      });
    }
    
    // Create some coloring slots
    for (let i = 0; i < 4; i++) {
      const startTime = new Date(tomorrow);
      startTime.setHours(10 + i * 2, 0, 0, 0);
      
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + 90);
      
      await this.createSlot({
        ownerId: 1,
        serviceId: coloring.id,
        startTime,
        endTime,
        isBooked: false
      });
    }
    
    // Create a booking
    await this.createBooking({
      customerId: 2, // Customer user
      ownerId: 1,
      serviceId: haircut.id,
      slotId: 1,
      status: "confirmed",
      notes: "First time customer"
    });
  }
}

// Export a single instance of the storage
export const storage = new MemStorage();
