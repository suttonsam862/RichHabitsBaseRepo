import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { storage } from "./storage";
import { User } from "@shared/schema";
import * as crypto from "crypto";
import bcrypt from "bcryptjs";

// For simplicity, just use a basic in-memory session store
const SECRET_KEY = crypto.randomBytes(32).toString("hex");

// Simplified bcrypt password functions
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  return bcrypt.compare(supplied, stored);
}

export function setupAuth(app: Express) {
  // Very simple in-memory session configuration
  const sessionSettings = {
    secret: SECRET_KEY,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      maxAge: 1000 * 60 * 60 * 24 // 1 day
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
      },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          if (!user) {
            return done(null, false, { message: "Invalid email or password" });
          }
          
          const isValid = await comparePasswords(password, user.password);
          if (!isValid) {
            return done(null, false, { message: "Invalid email or password" });
          }
          
          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user: Express.User, done) => {
    done(null, (user as any).id);
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
      const { email, password, fullName } = req.body;
      
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
      
      // Create new user
      const hashedPassword = await hashPassword(password);
      const newUser = await storage.createUser({
        email,
        username,
        password: hashedPassword,
        fullName,
        role: "admin", // Set as admin by default as requested
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
            username: user.username, // Include username in response
            fullName: user.fullName,
            role: user.role,
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
        username: user.username, // Include username in response
        fullName: user.fullName,
        role: user.role,
      } 
    });
  });
}