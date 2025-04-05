// THIS FILE IS DEPRECATED - WE ARE NOW USING EXPRESS SESSION AUTH INSTEAD OF SUPABASE
import { SupabaseClient } from '@supabase/supabase-js';

// Provide a dummy client since we're not using Supabase anymore
console.log('Note: Supabase is disabled - using Express session auth instead');
const supabase = {} as SupabaseClient;

// Export the client instance
export { supabase };

export async function signUp(email: string, password: string, fullName: string) {
  try {
    console.log('Starting signup process for:', email, 'with name:', fullName);
    
    if (!supabase.auth) {
      console.error('Supabase auth is not initialized');
      return { data: null, error: new Error('Supabase client not initialized') };
    }
    
    // Create a user with Supabase Auth
    console.log('Calling Supabase Auth signUp...');
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: 'admin', // Setting admin role as requested
        },
      },
    });
    
    if (error) {
      console.error('Supabase Auth signUp error:', error.message);
      return { data: null, error };
    }
    
    console.log('Signup successful, user data:', data);
    
    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error during signup:', error);
    return { 
      data: null, 
      error: error instanceof Error 
        ? error 
        : new Error('Unknown error during signup')
    };
  }
}

export async function signIn(email: string, password: string) {
  try {
    console.log('Starting sign in process for:', email);
    
    if (!supabase.auth) {
      console.error('Supabase auth is not initialized');
      return { data: null, error: new Error('Supabase client not initialized') };
    }
    
    console.log('Calling Supabase Auth signInWithPassword...');
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error('Supabase Auth signIn error:', error.message);
      return { data: null, error };
    }
    
    console.log('Sign in successful, session data:', data.session ? 'Session exists' : 'No session');
    
    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error during sign in:', error);
    return { 
      data: null, 
      error: error instanceof Error 
        ? error 
        : new Error('Unknown error during sign in')
    };
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
