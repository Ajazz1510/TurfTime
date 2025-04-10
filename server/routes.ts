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

// Chat support response generator
async function generateChatResponse(message: string): Promise<string> {
  // In a real implementation, this would be a call to an AI service
  // Here we're implementing basic keyword matching
  const lowerMessage = message.toLowerCase();
  
  // Simulate a slight network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Booking-related questions
  if (lowerMessage.includes('book') || lowerMessage.includes('reserve')) {
    return "To book a turf, browse available slots on the 'Book Turfs' page, select your preferred time slot, and complete the payment process. Your booking will be confirmed immediately after successful payment.";
  }
  
  // Payment-related questions
  if (lowerMessage.includes('payment') || lowerMessage.includes('pay') || lowerMessage.includes('cost') || lowerMessage.includes('price')) {
    return "We support multiple payment methods including UPI, netbanking, credit/debit cards, and digital wallets like Paytm, PhonePe, and Google Pay. Pricing varies by sport: ₹400/hr for cricket, ₹500/hr for football and badminton.";
  }
  
  // Cancellation questions
  if (lowerMessage.includes('cancel')) {
    return "You can cancel your booking from your dashboard under 'My Bookings'. Cancellations made at least 24 hours before the scheduled time are eligible for a full refund. Later cancellations may be subject to cancellation fees.";
  }
  
  // Refund questions
  if (lowerMessage.includes('refund')) {
    return "Our refund policy offers full refunds for cancellations made at least 24 hours before your booking time. Cancellations within 24 hours receive a 50% refund. No refunds are issued for no-shows or cancellations after the booking time.";
  }
  
  // Booking help
  if (lowerMessage.includes('help') && lowerMessage.includes('booking')) {
    return "If you need help with your booking, please provide your booking ID or the specific issue you're facing, and I'll assist you further. You can also view all your bookings in the 'My Bookings' section of your dashboard.";
  }
  
  // Sport-specific questions
  if (lowerMessage.includes('cricket')) {
    return "Our cricket turfs feature high-quality pitches with proper markings and professional equipment. Cricket turf bookings are priced at ₹400 per hour.";
  }
  
  if (lowerMessage.includes('football')) {
    return "Our football turfs are maintained to professional standards with proper markings and goals. Football turf bookings are priced at ₹500 per hour.";
  }
  
  if (lowerMessage.includes('badminton')) {
    return "Our badminton courts feature professional-grade flooring and nets. Badminton court bookings are priced at ₹500 per hour.";
  }
  
  // Team size questions
  if (lowerMessage.includes('team') || lowerMessage.includes('players') || lowerMessage.includes('size')) {
    return "Recommended team sizes: Cricket: 11 players per side (minimum 6), Football: 7-11 players per side (depending on turf size), Badminton: Singles (2 players) or Doubles (4 players).";
  }
  
  // Timing questions
  if (lowerMessage.includes('time') || lowerMessage.includes('hour') || lowerMessage.includes('duration')) {
    return "Most of our turfs are available from 6:00 AM to 10:00 PM. You can book a turf for a minimum of 1 hour, and booking duration is flexible based on availability.";
  }
  
  // Equipment questions
  if (lowerMessage.includes('equipment') || lowerMessage.includes('provide')) {
    return "Basic equipment is provided for all sports (balls, bats, rackets, etc.), but you're welcome to bring your own. Premium equipment can be rented at an additional cost at select locations.";
  }
  
  // Fallback for unrecognized queries
  return "Thank you for your message. I'll do my best to help you. Could you please provide more details about your question so I can assist you better?";
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication
  setupAuth(app);
  
  // Chat support API endpoint
  app.post("/api/chat/support", async (req, res) => {
    try {
      const { message } = req.body;
      
      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }
      
      // In a real implementation, this would call an AI service or chatbot API
      // For now, we'll respond with predefined answers based on keywords
      const response = await generateChatResponse(message);
      
      res.json({ response });
    } catch (error: any) {
      console.error("Error in chat support:", error);
      res.status(500).json({ error: "Failed to process chat message" });
    }
  });

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
      console.error("Error getting bookings:", error);
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
      console.log("Received booking request:", JSON.stringify(req.body));
      
      // Validate the booking data
      const validation = insertBookingSchema.safeParse(req.body);
      if (!validation.success) {
        console.error("Booking validation failed:", validation.error.format());
        return res.status(400).json({ 
          message: "Invalid booking data", 
          errors: validation.error.format() 
        });
      }
      console.log("Booking validation successful");

      // Ensure customerId matches the authenticated user
      if (req.body.customerId !== req.user.id) {
        console.error(`Customer ID mismatch: ${req.body.customerId} vs ${req.user.id}`);
        return res.status(403).json({ message: "Unauthorized, customer ID mismatch" });
      }

      // Verify slot exists and is available
      const slot = await storage.getSlot(req.body.slotId);
      if (!slot) {
        console.error(`Slot not found: ${req.body.slotId}`);
        return res.status(404).json({ message: "Slot not found" });
      }
      
      console.log(`Slot found: ${slot.id}, isBooked: ${slot.isBooked}`);
      if (slot.isBooked) {
        return res.status(400).json({ message: "Slot is already booked" });
      }

      // Verify turf exists
      const turf = await storage.getTurf(req.body.turfId);
      if (!turf) {
        console.error(`Turf not found: ${req.body.turfId}`);
        return res.status(404).json({ message: "Turf not found" });
      }
      console.log(`Turf found: ${turf.id}, name: ${turf.name}`);

      // Ensure slot and turf belong to the same owner
      if (slot.ownerId !== turf.ownerId || slot.turfId !== turf.id) {
        console.error(`Slot and turf mismatch: slot.ownerId=${slot.ownerId}, turf.ownerId=${turf.ownerId}, slot.turfId=${slot.turfId}, turf.id=${turf.id}`);
        return res.status(400).json({ message: "Slot and turf mismatch" });
      }

      // Generate a unique service ID (format: TT-[current year]-[5 digit random number])
      const currentYear = new Date().getFullYear();
      const randomDigits = Math.floor(10000 + Math.random() * 90000); // 5 digit random number
      const serviceId = `TT-${currentYear}-${randomDigits}`;
      
      // Calculate total amount for the booking based on turf price and duration
      const bookingStartTime = new Date(req.body.bookingStartTime);
      const bookingEndTime = new Date(req.body.bookingEndTime);
      const durationHours = Math.ceil((bookingEndTime.getTime() - bookingStartTime.getTime()) / (1000 * 60 * 60));
      const totalAmount = turf.price * durationHours;
      
      // Set owner ID from the slot and add the service ID and payment information
      const bookingData = {
        ...req.body,
        ownerId: slot.ownerId,
        serviceId: serviceId,
        status: "payment_pending", // Initial status is payment_pending
        totalAmount: totalAmount,
        paymentStatus: "pending"
      };
      console.log("Final booking data:", JSON.stringify(bookingData));

      // Create the booking
      const booking = await storage.createBooking(bookingData);
      console.log(`Booking created successfully: ID ${booking.id}`);
      
      // Mark the slot as booked
      await storage.updateSlot(slot.id, { isBooked: true });
      console.log(`Slot ${slot.id} marked as booked`);
      
      res.status(201).json({
        ...booking,
        totalAmount: totalAmount
      });
    } catch (error) {
      console.error("Error creating booking:", error);
      res.status(500).json({ message: "Failed to create booking", error: String(error) });
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
      
      // If booking is cancelled, mark the slot as available again
      if (filteredUpdates.status === "cancelled") {
        const slot = await storage.getSlot(booking.slotId);
        if (slot) {
          await storage.updateSlot(slot.id, { isBooked: false });
          console.log(`Booking ${id} cancelled, slot ${slot.id} marked as available`);
        }
      }
      
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
      
      // Free up the slot when booking is deleted
      const slot = await storage.getSlot(booking.slotId);
      
      const success = await storage.deleteBooking(id);
      if (success) {
        // Mark the slot as available again
        if (slot) {
          await storage.updateSlot(slot.id, { isBooked: false });
          console.log(`Booking ${id} deleted, slot ${slot.id} marked as available`);
        }
        
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
  
  // Get user by ID route (for fetching customer details)
  app.get("/api/users/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const user = await storage.getUser(id);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove sensitive information
      const { password, ...userProfile } = user;
      res.json(userProfile);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to get user" });
    }
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
      
      // Calculate transaction stats
      const successfulBookings = bookings.filter(b => b.paymentStatus === "success");
      const totalTransactions = successfulBookings.length;
      const totalAmount = successfulBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
      
      // Calculate monthly stats
      const now = new Date();
      const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const monthlyTransactions = successfulBookings.filter(b => 
        b.paidAt?.toString().startsWith(thisMonth)
      ).length;
      const monthlyAmount = successfulBookings
        .filter(b => b.paidAt?.toString().startsWith(thisMonth))
        .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

      // Calculate last 12 months stats
      const last12Months = Array.from({length: 12}, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      }).reverse();

      const monthlyStats = last12Months.map(month => ({
        month,
        transactions: successfulBookings.filter(b => 
          b.paidAt?.toString().startsWith(month)
        ).length,
        amount: successfulBookings
          .filter(b => b.paidAt?.toString().startsWith(month))
          .reduce((sum, b) => sum + (b.totalAmount || 0), 0)
      }));

      res.json({
        totalBookings,
        bookingsByStatus,
        bookingsByTurf,
        upcomingBookings,
        totalTurfs: turfs.length,
        totalSlots: slots.length,
        availableSlots,
        totalTransactions,
        totalAmount,
        monthlyTransactions,
        monthlyAmount,
        monthlyStats
      });
    } catch (error) {
      console.error("Error getting statistics:", error);
      res.status(500).json({ message: "Failed to get statistics" });
    }
  });
  
  // Payment processing endpoints
  app.post("/api/payments/process", isCustomer, async (req, res) => {
    try {
      const { bookingId, paymentMethod, paymentDetails } = req.body;
      
      if (!bookingId || !paymentMethod) {
        return res.status(400).json({ message: "Missing required payment information" });
      }
      
      // Get the booking
      const booking = await storage.getBooking(Number(bookingId));
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      // Verify that the booking belongs to the current user
      if (booking.customerId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized to process payment for this booking" });
      }
      
      // Verify that the booking is in payment_pending status
      if (booking.status !== "payment_pending") {
        return res.status(400).json({ message: "Booking is not in payment_pending status" });
      }
      
      // PAYMENT GATEWAY INTEGRATION SECTION
      // When a real payment gateway is available, replace the code below with actual integration
      
      // Example integration points for payment gateway:
      // 1. Initialize payment with gateway (create order/transaction)
      // if (process.env.PAYMENT_GATEWAY_KEY) {
      //   const paymentGateway = new PaymentGatewayClient(process.env.PAYMENT_GATEWAY_KEY);
      //   const gatewayResponse = await paymentGateway.createTransaction({
      //     amount: booking.totalAmount,
      //     currency: "INR",
      //     orderId: booking.serviceId,
      //     customerId: booking.customerId,
      //     paymentMethod: paymentMethod,
      //     ...paymentDetails
      //   });
      //   
      //   // Process gateway response
      //   if (gatewayResponse.status === "success") {
      //     // Update payment status based on gateway response
      //   } else {
      //     return res.status(400).json({ 
      //       message: "Payment failed",
      //       gatewayError: gatewayResponse.error
      //     });
      //   }
      // }
      
      // For now, we'll simulate a successful payment

      // Generate a payment ID
      const paymentId = `PAY-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
      
      // Update booking with payment information
      const updatedBooking = await storage.updateBooking(booking.id, {
        paymentId,
        paymentMethod,
        paymentStatus: "success",
        paymentDetails: paymentDetails || {},
        status: "confirmed", // Change booking status to confirmed
        paidAt: new Date()
      });
      
      res.status(200).json({
        success: true,
        message: "Payment processed successfully",
        booking: updatedBooking
      });
    } catch (error) {
      console.error("Error processing payment:", error);
      res.status(500).json({ message: "Failed to process payment", error: String(error) });
    }
  });
  
  // Endpoint to get payment information for a booking
  app.get("/api/payments/:bookingId", isAuthenticated, async (req, res) => {
    try {
      const bookingId = Number(req.params.bookingId);
      const booking = await storage.getBooking(bookingId);
      
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      // Ensure user has permission to view this booking's payment
      if (
        (req.user.role === "owner" && booking.ownerId !== req.user.id) ||
        (req.user.role === "customer" && booking.customerId !== req.user.id)
      ) {
        return res.status(403).json({ message: "Unauthorized to view this booking's payment" });
      }
      
      // Get turf information for price calculation
      const turf = await storage.getTurf(booking.turfId);
      if (!turf) {
        return res.status(404).json({ message: "Turf information not found" });
      }
      
      // Calculate the booking duration in hours
      const bookingStartTime = new Date(booking.bookingStartTime);
      const bookingEndTime = new Date(booking.bookingEndTime);
      const durationHours = Math.ceil((bookingEndTime.getTime() - bookingStartTime.getTime()) / (1000 * 60 * 60));
      
      // Calculate total amount if not already set
      const totalAmount = booking.totalAmount || (turf.price * durationHours);
      
      // Return payment information
      res.json({
        bookingId: booking.id,
        serviceId: booking.serviceId,
        turfName: turf.name,
        sportType: turf.sportType,
        bookingStartTime: booking.bookingStartTime,
        bookingEndTime: booking.bookingEndTime,
        durationHours,
        pricePerHour: turf.price,
        totalAmount,
        paymentStatus: booking.paymentStatus || "pending",
        paymentId: booking.paymentId,
        paymentMethod: booking.paymentMethod,
        paidAt: booking.paidAt
      });
    } catch (error) {
      console.error("Error getting payment information:", error);
      res.status(500).json({ message: "Failed to get payment information", error: String(error) });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
