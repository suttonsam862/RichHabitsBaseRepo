import fs from 'fs';

// Read the sidebar file
const sidebarPath = 'client/src/components/sidebar-with-feedback.tsx';
const content = fs.readFileSync(sidebarPath, 'utf8');

// Create a regex pattern that matches the Messages entries
const messagesEntryRegex = /\{\s*name:\s*"Messages",\s*href:\s*"\/messages",\s*icon:\s*<MessageSquare\s*className="mr-2"\s*size=\{16\}\s*\/>,\s*\},?/g;

// Remove the Messages entries
const updatedContent = content.replace(messagesEntryRegex, '');

// Write the updated content back to the file
fs.writeFileSync(sidebarPath, updatedContent);

console.log('Sidebar file updated successfully!');