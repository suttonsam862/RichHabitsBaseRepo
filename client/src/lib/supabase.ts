// THIS FILE IS DEPRECATED - WE ARE NOW USING EXPRESS SESSION AUTH INSTEAD OF SUPABASE
// This file is only kept for compatibility and all functions are stubbed out

// Provide a warning that this file is deprecated
console.warn('Supabase is disabled - using Express session auth instead');

// Stub Supabase client with minimal implementation
export const supabase = {
  auth: {
    getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    signOut: () => Promise.resolve({ error: null }),
    signUp: () => Promise.resolve({ data: null, error: null }),
    signInWithPassword: () => Promise.resolve({ data: null, error: null })
  }
};

// Stub functions that throw errors when called to prevent accidental usage
export async function signUp(email: string, password: string, fullName: string) {
  console.error('Supabase signUp is deprecated - using Express session auth instead');
  throw new Error('Supabase auth is disabled - using Express session auth instead');
}

export async function signIn(email: string, password: string) {
  console.error('Supabase signIn is deprecated - using Express session auth instead');
  throw new Error('Supabase auth is disabled - using Express session auth instead');
}

export async function signOut() {
  console.error('Supabase signOut is deprecated - using Express session auth instead');
  throw new Error('Supabase auth is disabled - using Express session auth instead');
}

export async function getCurrentUser() {
  console.error('Supabase getCurrentUser is deprecated - using Express session auth instead');
  return { user: null };
}
