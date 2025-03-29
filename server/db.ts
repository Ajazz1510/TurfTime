import "dotenv/config"; // Load environment variables
import pg from "pg"; // Import entire module for ESM
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";

// Ensure DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

// Extract Pool from pg
const { Pool } = pg;

// Create a connection pool
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });

console.log("✅ Database connected successfully!");