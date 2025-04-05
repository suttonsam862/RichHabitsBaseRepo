import { createClient, SupabaseClient } from '@supabase/supabase-js';

const createSupabaseClient = () => {
  try {
    // Get environment variables or use fallbacks for development
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    // Simple validation
    if (!supabaseUrl || !supabaseKey) {
      console.warn('Missing Supabase environment variables');
      throw new Error('Supabase configuration incomplete');
    }
    
    // Create client with basic configuration
    return createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    });
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
    throw error;
  }
};

let supabase: SupabaseClient;

try {
  supabase = createSupabaseClient();
  console.log('Supabase client initialized successfully');
} catch (error) {
  console.error('Using fallback mechanism due to Supabase initialization failure');
  // Provide a dummy client - our app will detect this and use mock data
  supabase = {} as SupabaseClient;
}

// Export the client instance
export { supabase };

export async function signUp(email: string, password: string, fullName: string) {
  try {
    if (!supabase.auth) {
      return { data: null, error: new Error('Supabase client not initialized') };
    }
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    
    return { data, error };
  } catch (error) {
    console.error('Error during signup:', error);
    return { data: null, error: error instanceof Error ? error : new Error('Unknown error during signup') };
  }
}

export async function signIn(email: string, password: string) {
  try {
    if (!supabase.auth) {
      return { data: null, error: new Error('Supabase client not initialized') };
    }
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    return { data, error };
  } catch (error) {
    console.error('Error during sign in:', error);
    return { data: null, error: error instanceof Error ? error : new Error('Unknown error during sign in') };
  }
}

export async function signOut() {
  try {
    if (!supabase.auth) {
      return { error: new Error('Supabase client not initialized') };
    }
    
    const { error } = await supabase.auth.signOut();
    return { error };
  } catch (error) {
    console.error('Error during sign out:', error);
    return { error: error instanceof Error ? error : new Error('Unknown error during sign out') };
  }
}

export async function getCurrentUser() {
  try {
    if (!supabase.auth) {
      return { user: null, error: new Error('Supabase client not initialized') };
    }
    
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return { user: null };
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    return { user };
  } catch (error) {
    console.error('Error getting current user:', error);
    return { user: null, error: error instanceof Error ? error : new Error('Unknown error getting user') };
  }
}
