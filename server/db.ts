import { createClient } from '@supabase/supabase-js';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import dotenv from 'dotenv';
import path from 'path';
import * as schema from '@shared/schema';
import { fileURLToPath } from 'url';

// Load environment variables from config.env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../config.env') });

// Validate required environment variables
const requiredEnvVars = ['DATABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_URL'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

// Create a Supabase client with retries
const createSupabaseClient = (retries = 3, delay = 1000) => {
  let attempt = 0;
  
  const connect = async () => {
    try {
      const client = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_ANON_KEY!,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: true,
            detectSessionInUrl: false
          },
          db: {
            schema: 'public'
          },
          global: {
            headers: { 'x-application-name': 'rich-habits' }
          }
        }
      );
      
      // Test the connection
      await client.auth.getSession();
      console.log('Successfully connected to Supabase');
      return client;
    } catch (error) {
      attempt++;
      console.error(`Supabase connection attempt ${attempt} failed:`, error);
      
      if (attempt < retries) {
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return connect();
      }
      throw error;
    }
  };
  
  return connect();
};

// Create a Postgres client for Drizzle with connection pooling and retries
const createPostgresClient = (retries = 3, delay = 1000) => {
  let attempt = 0;
  
  const connect = async () => {
    try {
      const client = postgres(process.env.DATABASE_URL!, {
        max: 1, // For Supabase pooler, we should use a single connection
        idle_timeout: 20,
        connect_timeout: 10,
        ssl: {
          rejectUnauthorized: false
        },
        connection: {
          // Required settings for Supabase's pooler
          options: `--search_path=public`,
          application_name: 'rich-habits'
        },
        // Suppress notice and parameter messages
        onnotice: () => {},
        onparameter: () => {}
      });
      
      // Test the connection
      await client`SELECT 1`;
      console.log('Successfully connected to Postgres');
      return client;
    } catch (error) {
      attempt++;
      console.error(`Postgres connection attempt ${attempt} failed:`, error);
      
      if (attempt < retries) {
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return connect();
      }
      throw error;
    }
  };
  
  return connect();
};

// Initialize database clients with retries
let supabase: Awaited<ReturnType<typeof createSupabaseClient>>;
let client: Awaited<ReturnType<typeof createPostgresClient>>;
let db: ReturnType<typeof drizzle>;

const initializeDb = async () => {
  try {
    // Initialize Supabase client
    supabase = await createSupabaseClient();
    
    // Initialize Postgres client
    client = await createPostgresClient();
    
    // Initialize Drizzle ORM
    db = drizzle(client, { schema });
    
    console.log('Database initialization completed successfully');
  } catch (error) {
    console.error('Failed to initialize database connections:', error);
    process.exit(1); // Exit if we can't connect to the database
  }
};

// Initialize database connections
await initializeDb();

// Export initialized clients
export { supabase, db, client as pool };
