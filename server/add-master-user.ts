// This script will add the master user to your database if it doesn't already exist.
// To run: npx ts-node server/add-master-user.ts

import { storage } from "./storage";
import { hashPassword } from "./auth";
import { ROLES, PERMISSIONS } from "@shared/schema";

async function main() {
  const email = "samsutton@rich-habits.com";
  const password = "Arlodog2013!";
  const username = "samsutton";
  const fullName = "Sam Sutton";

  // Check if user already exists
  const existing = await storage.getUserByEmail(email);
  if (existing) {
    console.log(`Master user already exists with email: ${email}`);
    process.exit(0);
  }

  // Hash the password
  const hashedPassword = await hashPassword(password);

  // Create the user object
  const newUser = {
    email,
    username,
    fullName,
    password: hashedPassword,
    role: ROLES.ADMIN,
    permissions: Object.values(PERMISSIONS), // all permissions
    visiblePages: [
      "dashboard",
      "leads",
      "orders",
      "users",
      "products",
      "settings",
      "reports",
      "messages",
      "feedback",
      "designs",
      "camps",
      "sales-team",
      "organizations"
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  };

  // Insert the user
  const user = await storage.createUser(newUser);
  console.log(`Master user created with ID: ${user.id}`);
}

main().catch(e => {
  console.error("Failed to add master user:", e);
  process.exit(1);
});
