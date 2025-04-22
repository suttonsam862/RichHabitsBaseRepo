import { db } from './db';
import { users, ROLES } from '../shared/schema';
import { eq } from 'drizzle-orm';

/**
 * This utility script adds the 'leads-steps' page to the visiblePages
 * list for all administrators in the system.
 */
async function addLeadsStepsToAdmins() {
  try {
    // Get all admin users
    const adminUsers = await db.select().from(users).where(eq(users.role, ROLES.Admin));
    
    console.log(`Found ${adminUsers.length} admin users to update`);
    
    for (const user of adminUsers) {
      // Get current visiblePages
      let visiblePages = user.visiblePages || [];
      
      // Check if leads-steps is already in the list
      if (!visiblePages.includes('leads-steps')) {
        // Add leads-steps to the visiblePages array
        visiblePages.push('leads-steps');
        
        // Update the user
        await db.update(users)
          .set({ visiblePages })
          .where(eq(users.id, user.id));
        
        console.log(`Updated visiblePages for admin user: ${user.username || user.email}`);
      } else {
        console.log(`Admin user ${user.username || user.email} already has leads-steps page visible`);
      }
    }
    
    console.log('Successfully added leads-steps page to all admin users');
  } catch (error) {
    console.error('Error updating admin users:', error);
  }
}

// Execute the function
addLeadsStepsToAdmins().catch(console.error);