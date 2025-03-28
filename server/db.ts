import * as schema from "@shared/schema";

// Using in-memory storage for development
const inMemoryDB = {
  users: [],
  turfs: [],
  slots: [],
  bookings: []
};

export const db = inMemoryDB;
