import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import { 
  insertServiceSchema, 
  insertSlotSchema, 
  insertBookingSchema, 
  insertWaitlistSchema 
} from "@shared/schema";

// Helper function to check if user is authenticated
function isAuthenticated(req: Express.Request, res: Express.Response, next: Express.NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Not authenticated" });
}

// Helper function to check if user is an owner
function isOwner(req: Express.Request, res: Express.Response, next: Express.NextFunction) {
  if (req.isAuthenticated() && req.user.role === "owner") {
    return next();
  }
  res.status(403).json({ message: "Unauthorized, owner role required" });
}

// Helper function to check if user is a customer
function isCustomer(req: Express.Request, res: Express.Response, next: Express.NextFunction) {
  if (req.isAuthenticated() && req.user.role === "customer") {
    return next();
  }
  res.status(403).json({ message: "Unauthorized, customer role required" });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication
  setupAuth(app);

  // Service routes
  app.get("/api/services", async (req, res) => {
    try {
      const ownerId = req.query.ownerId ? Number(req.query.ownerId) : undefined;
      if (ownerId) {
        const services = await storage.getServicesByOwner(ownerId);
        res.json(services);
      } else {
        // In a real app, we might want to limit this to only return services from verified owners
        const services = Array.from(
          new Set(
            (await Promise.all(
              Array.from({ length: 10 }, (_, i) => i + 1).map(async (id) => {
                return storage.getServicesByOwner(id);
              })
            )).flat()
          )
        );
        res.json(services);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to get services" });
    }
  });

  app.get("/api/services/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const service = await storage.getService(id);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      res.json(service);
    } catch (error) {
      res.status(500).json({ message: "Failed to get service" });
    }
  });

  app.post("/api/services", isOwner, async (req, res) => {
    try {
      const validation = insertServiceSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid service data", errors: validation.error.format() });
      }

      // Ensure ownerId matches the authenticated user
      if (req.body.ownerId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized, owner ID mismatch" });
      }

      const service = await storage.createService(req.body);
      res.status(201).json(service);
    } catch (error) {
      res.status(500).json({ message: "Failed to create service" });
    }
  });

  app.put("/api/services/:id", isOwner, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const service = await storage.getService(id);
      
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      
      // Check if the service belongs to the authenticated user
      if (service.ownerId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized to update this service" });
      }
      
      const updatedService = await storage.updateService(id, req.body);
      res.json(updatedService);
    } catch (error) {
      res.status(500).json({ message: "Failed to update service" });
    }
  });

  app.delete("/api/services/:id", isOwner, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const service = await storage.getService(id);
      
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      
      // Check if the service belongs to the authenticated user
      if (service.ownerId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized to delete this service" });
      }
      
      const success = await storage.deleteService(id);
      if (success) {
        res.sendStatus(204);
      } else {
        res.status(500).json({ message: "Failed to delete service" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete service" });
    }
  });

  // Slot routes
  app.get("/api/slots", async (req, res) => {
    try {
      const ownerId = req.query.ownerId ? Number(req.query.ownerId) : undefined;
      const serviceId = req.query.serviceId ? Number(req.query.serviceId) : undefined;
      const availableOnly = req.query.available === 'true';
      
      if (availableOnly) {
        const slots = await storage.getAvailableSlots(ownerId, serviceId);
        res.json(slots);
      } else if (ownerId) {
        const slots = await storage.getSlotsByOwner(ownerId);
        
        // Filter by serviceId if provided
        const filteredSlots = serviceId 
          ? slots.filter(slot => slot.serviceId === serviceId)
          : slots;
          
        res.json(filteredSlots);
      } else {
        res.status(400).json({ message: "Either ownerId or available=true must be provided" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to get slots" });
    }
  });

  app.get("/api/slots/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const slot = await storage.getSlot(id);
      if (!slot) {
        return res.status(404).json({ message: "Slot not found" });
      }
      res.json(slot);
    } catch (error) {
      res.status(500).json({ message: "Failed to get slot" });
    }
  });

  app.post("/api/slots", isOwner, async (req, res) => {
    try {
      const validation = insertSlotSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid slot data", errors: validation.error.format() });
      }

      // Ensure ownerId matches the authenticated user
      if (req.body.ownerId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized, owner ID mismatch" });
      }

      // Verify service exists and belongs to owner
      const service = await storage.getService(req.body.serviceId);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      if (service.ownerId !== req.user.id) {
        return res.status(403).json({ message: "Service does not belong to this owner" });
      }

      const slot = await storage.createSlot(req.body);
      res.status(201).json(slot);
    } catch (error) {
      res.status(500).json({ message: "Failed to create slot" });
    }
  });

  app.put("/api/slots/:id", isOwner, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const slot = await storage.getSlot(id);
      
      if (!slot) {
        return res.status(404).json({ message: "Slot not found" });
      }
      
      // Check if the slot belongs to the authenticated user
      if (slot.ownerId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized to update this slot" });
      }
      
      const updatedSlot = await storage.updateSlot(id, req.body);
      res.json(updatedSlot);
    } catch (error) {
      res.status(500).json({ message: "Failed to update slot" });
    }
  });

  app.delete("/api/slots/:id", isOwner, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const slot = await storage.getSlot(id);
      
      if (!slot) {
        return res.status(404).json({ message: "Slot not found" });
      }
      
      // Check if the slot belongs to the authenticated user
      if (slot.ownerId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized to delete this slot" });
      }
      
      // Don't allow deletion of booked slots
      if (slot.isBooked) {
        return res.status(400).json({ message: "Cannot delete a booked slot" });
      }
      
      const success = await storage.deleteSlot(id);
      if (success) {
        res.sendStatus(204);
      } else {
        res.status(500).json({ message: "Failed to delete slot" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete slot" });
    }
  });

  // Booking routes
  app.get("/api/bookings", isAuthenticated, async (req, res) => {
    try {
      if (req.user.role === "owner") {
        const bookings = await storage.getBookingsByOwner(req.user.id);
        res.json(bookings);
      } else if (req.user.role === "customer") {
        const bookings = await storage.getBookingsByCustomer(req.user.id);
        res.json(bookings);
      } else {
        res.status(403).json({ message: "Unauthorized" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to get bookings" });
    }
  });

  app.get("/api/bookings/:id", isAuthenticated, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const booking = await storage.getBooking(id);
      
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      // Ensure user has permission to view this booking
      if (
        (req.user.role === "owner" && booking.ownerId !== req.user.id) ||
        (req.user.role === "customer" && booking.customerId !== req.user.id)
      ) {
        return res.status(403).json({ message: "Unauthorized to view this booking" });
      }
      
      res.json(booking);
    } catch (error) {
      res.status(500).json({ message: "Failed to get booking" });
    }
  });

  app.post("/api/bookings", isCustomer, async (req, res) => {
    try {
      const validation = insertBookingSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid booking data", errors: validation.error.format() });
      }

      // Ensure customerId matches the authenticated user
      if (req.body.customerId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized, customer ID mismatch" });
      }

      // Verify slot exists and is available
      const slot = await storage.getSlot(req.body.slotId);
      if (!slot) {
        return res.status(404).json({ message: "Slot not found" });
      }
      if (slot.isBooked) {
        return res.status(400).json({ message: "Slot is already booked" });
      }

      // Verify service exists
      const service = await storage.getService(req.body.serviceId);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }

      // Ensure slot and service belong to the same owner
      if (slot.ownerId !== service.ownerId || slot.serviceId !== service.id) {
        return res.status(400).json({ message: "Slot and service mismatch" });
      }

      // Set owner ID from the slot
      const bookingData = {
        ...req.body,
        ownerId: slot.ownerId
      };

      const booking = await storage.createBooking(bookingData);
      res.status(201).json(booking);
    } catch (error) {
      res.status(500).json({ message: "Failed to create booking" });
    }
  });

  app.put("/api/bookings/:id", isAuthenticated, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const booking = await storage.getBooking(id);
      
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      // Ensure user has permission to update this booking
      if (
        (req.user.role === "owner" && booking.ownerId !== req.user.id) ||
        (req.user.role === "customer" && booking.customerId !== req.user.id)
      ) {
        return res.status(403).json({ message: "Unauthorized to update this booking" });
      }
      
      // Only allow updating status and notes
      const allowedUpdates: (keyof typeof req.body)[] = ["status", "notes"];
      const filteredUpdates = Object.entries(req.body)
        .filter(([key]) => allowedUpdates.includes(key as any))
        .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {});
      
      const updatedBooking = await storage.updateBooking(id, filteredUpdates);
      res.json(updatedBooking);
    } catch (error) {
      res.status(500).json({ message: "Failed to update booking" });
    }
  });

  app.delete("/api/bookings/:id", isAuthenticated, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const booking = await storage.getBooking(id);
      
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      // Ensure user has permission to delete this booking
      if (
        (req.user.role === "owner" && booking.ownerId !== req.user.id) ||
        (req.user.role === "customer" && booking.customerId !== req.user.id)
      ) {
        return res.status(403).json({ message: "Unauthorized to delete this booking" });
      }
      
      const success = await storage.deleteBooking(id);
      if (success) {
        res.sendStatus(204);
      } else {
        res.status(500).json({ message: "Failed to delete booking" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete booking" });
    }
  });

  // User profile routes
  app.get("/api/profile", isAuthenticated, (req, res) => {
    // Remove sensitive information
    const { password, ...userProfile } = req.user;
    res.json(userProfile);
  });

  app.put("/api/profile", isAuthenticated, async (req, res) => {
    try {
      // Don't allow changing role or username
      const { role, username, password, id, ...allowedUpdates } = req.body;
      
      const updatedUser = await storage.updateUser(req.user.id, allowedUpdates);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove sensitive information
      const { password: _, ...userProfile } = updatedUser;
      res.json(userProfile);
    } catch (error) {
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Waitlist route
  app.post("/api/waitlist", async (req, res) => {
    try {
      const validation = insertWaitlistSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid waitlist data", errors: validation.error.format() });
      }
      
      const entry = await storage.addToWaitlist(req.body);
      res.status(201).json({ message: "Successfully added to waitlist", id: entry.id });
    } catch (error) {
      res.status(500).json({ message: "Failed to add to waitlist" });
    }
  });

  // Statistics for owner dashboard
  app.get("/api/stats", isOwner, async (req, res) => {
    try {
      const bookings = await storage.getBookingsByOwner(req.user.id);
      const services = await storage.getServicesByOwner(req.user.id);
      const slots = await storage.getSlotsByOwner(req.user.id);
      
      // Total bookings
      const totalBookings = bookings.length;
      
      // Bookings by status
      const bookingsByStatus = bookings.reduce((acc, booking) => {
        acc[booking.status] = (acc[booking.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      // Bookings by service
      const bookingsByService = bookings.reduce((acc, booking) => {
        acc[booking.serviceId] = (acc[booking.serviceId] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);
      
      // Upcoming bookings (not completed/canceled)
      const upcomingBookings = bookings.filter(
        booking => booking.status !== "completed" && booking.status !== "canceled"
      ).length;
      
      // Available slots
      const availableSlots = slots.filter(slot => !slot.isBooked).length;
      
      res.json({
        totalBookings,
        bookingsByStatus,
        bookingsByService,
        upcomingBookings,
        totalServices: services.length,
        totalSlots: slots.length,
        availableSlots
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get statistics" });
    }
  });
  
  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
