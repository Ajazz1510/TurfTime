import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import { 
  insertTurfSchema, 
  insertSlotSchema, 
  insertBookingSchema 
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

  // Service routes (alias for turfs to maintain compatibility with frontend)
  app.get("/api/services", async (req, res) => {
    try {
      const ownerId = req.query.ownerId ? Number(req.query.ownerId) : undefined;
      const sportType = req.query.sportType as string | undefined;
      
      if (ownerId) {
        const turfs = await storage.getTurfsByOwner(ownerId);
        res.json(turfs);
      } else if (sportType) {
        const turfs = await storage.getTurfsBySportType(sportType);
        res.json(turfs);
      } else {
        // In a real app, we might want to limit this
        const turfs = Array.from(
          new Set(
            (await Promise.all(
              Array.from({ length: 10 }, (_, i) => i + 1).map(async (id) => {
                return storage.getTurfsByOwner(id);
              })
            )).flat()
          )
        );
        res.json(turfs);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to get services" });
    }
  });

  // Turf routes
  app.get("/api/turfs", async (req, res) => {
    try {
      const ownerId = req.query.ownerId ? Number(req.query.ownerId) : undefined;
      const sportType = req.query.sportType as string | undefined;
      
      if (ownerId) {
        const turfs = await storage.getTurfsByOwner(ownerId);
        res.json(turfs);
      } else if (sportType) {
        const turfs = await storage.getTurfsBySportType(sportType);
        res.json(turfs);
      } else {
        // In a real app, we might want to limit this to only return turfs from verified owners
        const turfs = Array.from(
          new Set(
            (await Promise.all(
              Array.from({ length: 10 }, (_, i) => i + 1).map(async (id) => {
                return storage.getTurfsByOwner(id);
              })
            )).flat()
          )
        );
        res.json(turfs);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to get turfs" });
    }
  });

  app.get("/api/turfs/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const turf = await storage.getTurf(id);
      if (!turf) {
        return res.status(404).json({ message: "Turf not found" });
      }
      res.json(turf);
    } catch (error) {
      res.status(500).json({ message: "Failed to get turf" });
    }
  });
  
  // Service (turf) by ID endpoint for compatibility
  app.get("/api/services/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const turf = await storage.getTurf(id);
      if (!turf) {
        return res.status(404).json({ message: "Service not found" });
      }
      res.json(turf);
    } catch (error) {
      res.status(500).json({ message: "Failed to get service" });
    }
  });

  app.post("/api/turfs", isOwner, async (req, res) => {
    try {
      const validation = insertTurfSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid turf data", errors: validation.error.format() });
      }

      // Ensure ownerId matches the authenticated user
      if (req.body.ownerId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized, owner ID mismatch" });
      }

      const turf = await storage.createTurf(req.body);
      res.status(201).json(turf);
    } catch (error) {
      res.status(500).json({ message: "Failed to create turf" });
    }
  });

  app.put("/api/turfs/:id", isOwner, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const turf = await storage.getTurf(id);
      
      if (!turf) {
        return res.status(404).json({ message: "Turf not found" });
      }
      
      // Check if the turf belongs to the authenticated user
      if (turf.ownerId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized to update this turf" });
      }
      
      const updatedTurf = await storage.updateTurf(id, req.body);
      res.json(updatedTurf);
    } catch (error) {
      res.status(500).json({ message: "Failed to update turf" });
    }
  });

  app.delete("/api/turfs/:id", isOwner, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const turf = await storage.getTurf(id);
      
      if (!turf) {
        return res.status(404).json({ message: "Turf not found" });
      }
      
      // Check if the turf belongs to the authenticated user
      if (turf.ownerId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized to delete this turf" });
      }
      
      const success = await storage.deleteTurf(id);
      if (success) {
        res.sendStatus(204);
      } else {
        res.status(500).json({ message: "Failed to delete turf" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete turf" });
    }
  });

  // Slot routes
  app.get("/api/slots", async (req, res) => {
    try {
      console.log("Slots request with query:", req.query);
      const ownerId = req.query.ownerId ? Number(req.query.ownerId) : undefined;
      const turfId = req.query.turfId ? Number(req.query.turfId) : undefined;
      const availableOnly = req.query.available === 'true';
      const serviceId = req.query.serviceId ? Number(req.query.serviceId) : undefined;
      
      if (availableOnly) {
        console.log("Fetching available slots with ownerId:", ownerId, "turfId:", turfId);
        const slots = await storage.getAvailableSlots(ownerId, turfId);
        console.log(`Found ${slots.length} available slots`);
        res.json(slots);
      } else if (ownerId) {
        const slots = await storage.getSlotsByOwner(ownerId);
        
        // Filter by turfId if provided
        const filteredSlots = turfId 
          ? slots.filter(slot => slot.turfId === turfId)
          : slots;
          
        res.json(filteredSlots);
      } else {
        // For customers without filters, return all available slots across all owners and turfs
        console.log("Fetching all available slots (no owner/turf specified)");
        // Get all slots that are available (not booked)
        const allAvailableSlots = await storage.getAvailableSlots();
        console.log(`Found ${allAvailableSlots.length} total available slots`);
        
        // Enhance slots with turf information for better display
        const enhancedSlots = await Promise.all(allAvailableSlots.map(async (slot) => {
          const turf = await storage.getTurf(slot.turfId);
          const owner = await storage.getUser(slot.ownerId);
          return {
            ...slot,
            turfName: turf?.name || `Turf #${slot.turfId}`,
            sportType: turf?.sportType || "Unknown",
            ownerName: owner?.username || `Owner #${slot.ownerId}`
          };
        }));
        
        res.json(enhancedSlots);
      }
    } catch (error) {
      console.error("Error fetching slots:", error);
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
      console.log("Creating slot with data:", JSON.stringify(req.body));
      
      const validation = insertSlotSchema.safeParse(req.body);
      if (!validation.success) {
        const errors = validation.error.format();
        console.log("Validation errors:", JSON.stringify(errors));
        return res.status(400).json({ message: "Invalid slot data", errors });
      }

      // Ensure ownerId matches the authenticated user
      if (req.body.ownerId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized, owner ID mismatch" });
      }

      // Verify turf exists and belongs to owner
      const turf = await storage.getTurf(req.body.turfId);
      if (!turf) {
        return res.status(404).json({ message: "Turf not found" });
      }
      if (turf.ownerId !== req.user.id) {
        return res.status(403).json({ message: "Turf does not belong to this owner" });
      }

      try {
        const parsedData = {
          ...validation.data,
          startTime: new Date(validation.data.startTime),
          endTime: new Date(validation.data.endTime),
          ownerId: req.user.id,
          turfId: Number(req.body.turfId),
          isBooked: false
        };
        
        console.log("Attempting to create slot with:", JSON.stringify(parsedData));
        const slot = await storage.createSlot(parsedData);
        console.log("Slot created successfully:", JSON.stringify(slot));
        res.status(201).json(slot);
      } catch (dbError) {
        console.error("Database error creating slot:", dbError);
        res.status(500).json({ message: "Failed to create slot in database", error: dbError instanceof Error ? dbError.message : String(dbError) });
      }
    } catch (error) {
      console.error("Error creating slot:", error);
      res.status(500).json({ message: "Failed to create slot", error: error instanceof Error ? error.message : String(error) });
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
      let bookings;
      
      if (req.user.role === "owner") {
        bookings = await storage.getBookingsByOwner(req.user.id);
      } else if (req.user.role === "customer") {
        bookings = await storage.getBookingsByCustomer(req.user.id);
      } else {
        return res.status(403).json({ message: "Unauthorized" });
      }

      // Enhance bookings with user and turf information
      const enhancedBookings = await Promise.all(bookings.map(async (booking) => {
        // Get the turf details
        const turf = await storage.getTurf(booking.turfId);
        
        // Get customer or owner details depending on user role
        let userInfo;
        if (req.user.role === "owner") {
          userInfo = await storage.getUser(booking.customerId);
        } else {
          userInfo = await storage.getUser(booking.ownerId);
        }
        
        return {
          ...booking,
          turfName: turf?.name || `Turf #${booking.turfId}`,
          turfSportType: turf?.sportType || "Unknown",
          userName: userInfo?.username || (req.user.role === "owner" ? `Customer #${booking.customerId}` : `Owner #${booking.ownerId}`),
          userFullName: userInfo?.fullName || "Unknown"
        };
      }));
      
      res.json(enhancedBookings);
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
      
      // Get the turf details
      const turf = await storage.getTurf(booking.turfId);
      
      // Get customer or owner details depending on user role
      let userInfo;
      if (req.user.role === "owner") {
        userInfo = await storage.getUser(booking.customerId);
      } else {
        userInfo = await storage.getUser(booking.ownerId);
      }
      
      // Enhance booking with additional details
      const enhancedBooking = {
        ...booking,
        turfName: turf?.name || `Turf #${booking.turfId}`,
        turfSportType: turf?.sportType || "Unknown",
        userName: userInfo?.username || (req.user.role === "owner" ? `Customer #${booking.customerId}` : `Owner #${booking.ownerId}`),
        userFullName: userInfo?.fullName || "Unknown"
      };
      
      res.json(enhancedBooking);
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

      // Verify turf exists
      const turf = await storage.getTurf(req.body.turfId);
      if (!turf) {
        return res.status(404).json({ message: "Turf not found" });
      }

      // Ensure slot and turf belong to the same owner
      if (slot.ownerId !== turf.ownerId || slot.turfId !== turf.id) {
        return res.status(400).json({ message: "Slot and turf mismatch" });
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

  // Statistics for owner dashboard
  app.get("/api/stats", isOwner, async (req, res) => {
    try {
      const bookings = await storage.getBookingsByOwner(req.user.id);
      const turfs = await storage.getTurfsByOwner(req.user.id);
      const slots = await storage.getSlotsByOwner(req.user.id);
      
      // Total bookings
      const totalBookings = bookings.length;
      
      // Bookings by status
      const bookingsByStatus = bookings.reduce((acc, booking) => {
        acc[booking.status] = (acc[booking.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      // Bookings by turf
      const bookingsByTurf = bookings.reduce((acc, booking) => {
        acc[booking.turfId] = (acc[booking.turfId] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);
      
      // Upcoming bookings (not completed/cancelled)
      const upcomingBookings = bookings.filter(
        booking => booking.status !== "completed" && booking.status !== "cancelled"
      ).length;
      
      // Available slots
      const availableSlots = slots.filter(slot => !slot.isBooked).length;
      
      res.json({
        totalBookings,
        bookingsByStatus,
        bookingsByTurf,
        upcomingBookings,
        totalTurfs: turfs.length,
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
