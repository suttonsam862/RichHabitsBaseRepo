import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { storage } from "./storage";
import { User, Permission, ROLES, PERMISSIONS } from "@shared/schema";
import * as crypto from "crypto";
import bcrypt from "bcryptjs";
import { hasPermission, getPermissionsForRole } from "@shared/permissions";

// We don't need a custom declaration here, as we're using
// the User type directly via casting in our code when needed.
// The original declaration in auth.ts is causing problems.

// For simplicity, just use a basic in-memory session store
const SECRET_KEY = crypto.randomBytes(32).toString("hex");

// Simplified bcrypt password functions
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  return bcrypt.compare(supplied, stored);
}

// Middleware to check if user is authenticated
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: "Not authenticated" });
}

// Middleware to check if user has required permission
export function hasRequiredPermission(requiredPermission: Permission) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    const user = req.user as User;
    if (
      hasPermission(
        user.role as any, 
        user.permissions as Permission[] | undefined, 
        requiredPermission
      )
    ) {
      return next();
    }
    
    res.status(403).json({ error: "Forbidden: Insufficient permissions" });
  };
}

// Middleware to check if user is admin
export function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  
  const user = req.user as User;
  if (user.role === ROLES.ADMIN) {
    return next();
  }
  
  res.status(403).json({ error: "Forbidden: Admin access required" });
}

export function setupAuth(app: Express) {
  // Very simple in-memory session configuration
  // Very simple session configuration
  const sessionSettings = {
    secret: SECRET_KEY,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      maxAge: 1000 * 60 * 60 * 24, // 1 day
      httpOnly: true,
      sameSite: 'lax' as const
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      {
        usernameField: "username", // Changed from "email" to "username"
        passwordField: "password",
      },
      async (username, password, done) => {
        try {
          console.log("Auth attempt with username:", username);
          
          // First try to find the user by username
          let user = await storage.getUserByUsername(username);
          
          // If not found by username, try by email
          if (!user) {
            user = await storage.getUserByEmail(username);
          }
          
          if (!user) {
            console.log("User not found for login attempt");
            return done(null, false, { message: "Invalid username/email or password" });
          }
          
          console.log("User found, validating password...");
          const isValid = await comparePasswords(password, user.password);
          if (!isValid) {
            console.log("Invalid password");
            return done(null, false, { message: "Invalid username/email or password" });
          }
          
          console.log("Authentication successful for user:", user.id);
          return done(null, user);
        } catch (error) {
          console.error("Authentication error:", error);
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user || undefined);
    } catch (error) {
      done(error);
    }
  });

  // Authentication routes
  app.post("/api/register", async (req, res) => {
    try {
      const { email, password, fullName, role = ROLES.VIEWER } = req.body;
      
      // Basic validation
      if (!email || !password || !fullName) {
        return res.status(400).json({ error: "Email, password, and full name are required" });
      }
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "User with this email already exists" });
      }
      
      // Create username from email (required field)
      const username = email.split('@')[0];
      
      // If there is an authenticated user, check if they have permission to create users
      // Only admins can create admin users
      if (req.isAuthenticated()) {
        const currentUser = req.user as User;
        
        // Non-admins cannot create users
        if (currentUser.role !== ROLES.ADMIN) {
          return res.status(403).json({ error: "Only administrators can create new users" });
        }
        
        // Even admins cannot set role higher than their own
        if (role === ROLES.ADMIN && currentUser.role !== ROLES.ADMIN) {
          return res.status(403).json({ error: "Cannot assign admin role" });
        }
      } else {
        // If no users exist yet, make the first user an admin
        const count = await storage.getUserCount();
        if (count === 0) {
          // First user is always admin
          console.log("Creating first user as admin");
          
          // Create new user as admin
          const hashedPassword = await hashPassword(password);
          const permissions = getPermissionsForRole(ROLES.ADMIN);
          
          const newUser = await storage.createUser({
            email,
            username,
            password: hashedPassword,
            fullName,
            role: ROLES.ADMIN,
            permissions,
            createdAt: new Date()
          });
          
          // Log the user in
          req.login(newUser, (err) => {
            if (err) {
              return res.status(500).json({ error: "Authentication error" });
            }
            return res.status(201).json({ 
              user: {
                id: newUser.id,
                email: newUser.email,
                username: newUser.username,
                fullName: newUser.fullName,
                role: newUser.role,
              }
            });
          });
          
          return; // Early return to avoid the code below
        } else {
          // If we're not logged in and users exist, we can't register
          return res.status(401).json({ error: "New user registration requires admin privileges" });
        }
      }
      
      // Get default permissions for role
      const permissions = getPermissionsForRole(role as any);
      
      // Create new user
      const hashedPassword = await hashPassword(password);
      const newUser = await storage.createUser({
        email,
        username,
        password: hashedPassword,
        fullName,
        role,
        permissions,
        createdAt: new Date()
      });
      
      // Log the user in
      req.login(newUser, (err) => {
        if (err) {
          return res.status(500).json({ error: "Authentication error" });
        }
        return res.status(201).json({ 
          user: {
            id: newUser.id,
            email: newUser.email,
            username: newUser.username,
            fullName: newUser.fullName,
            role: newUser.role,
          }
        });
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      res.status(500).json({ error: error.message || "Registration failed" });
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ error: "Authentication error" });
      }
      if (!user) {
        return res.status(401).json({ error: info?.message || "Invalid credentials" });
      }
      req.login(user, (err: any) => {
        if (err) {
          return res.status(500).json({ error: "Login error" });
        }
        return res.json({ 
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            fullName: user.fullName,
            role: user.role,
            permissions: user.permissions,
          } 
        });
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res) => {
    req.logout((err: any) => {
      if (err) {
        return res.status(500).json({ error: "Logout error" });
      }
      res.json({ success: true });
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    const user = req.user as User;
    res.json({ 
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        permissions: user.permissions,
      } 
    });
  });
  
  // User Management APIs (accessible only by admins)
  app.get("/api/users", isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      // Don't return passwords in the API response
      const safeUsers = users.map(user => ({
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        permissions: user.permissions,
        createdAt: user.createdAt,
      }));
      
      res.json({ users: safeUsers });
    } catch (error: any) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: error.message || "Failed to fetch users" });
    }
  });
  
  app.patch("/api/users/:id/role", isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { role } = req.body;
      
      if (!Object.values(ROLES).includes(role as any)) {
        return res.status(400).json({ error: "Invalid role" });
      }
      
      // An admin cannot demote themselves
      const currentUser = req.user as User;
      if (currentUser.id === userId && currentUser.role === ROLES.ADMIN && role !== ROLES.ADMIN) {
        return res.status(403).json({ error: "Cannot demote yourself from admin" });
      }
      
      const user = await storage.updateUserRole(userId, role);
      
      // Also update permissions based on the new role
      const defaultPermissions = getPermissionsForRole(role as any);
      await storage.updateUserPermissions(userId, defaultPermissions);
      
      res.json({
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          fullName: user.fullName,
          role: user.role,
          permissions: defaultPermissions,
        }
      });
    } catch (error: any) {
      console.error("Error updating user role:", error);
      res.status(500).json({ error: error.message || "Failed to update user role" });
    }
  });
  
  app.patch("/api/users/:id/permissions", isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { permissions } = req.body;
      
      if (!Array.isArray(permissions)) {
        return res.status(400).json({ error: "Permissions must be an array" });
      }
      
      // Validate that all permissions are valid
      const allPermissions = Object.values(PERMISSIONS);
      const invalidPermissions = permissions.filter(p => !allPermissions.includes(p as any));
      
      if (invalidPermissions.length > 0) {
        return res.status(400).json({ 
          error: `Invalid permissions: ${invalidPermissions.join(', ')}` 
        });
      }
      
      const user = await storage.updateUserPermissions(userId, permissions);
      
      res.json({
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          fullName: user.fullName,
          role: user.role,
          permissions: user.permissions,
        }
      });
    } catch (error: any) {
      console.error("Error updating user permissions:", error);
      res.status(500).json({ error: error.message || "Failed to update user permissions" });
    }
  });
}