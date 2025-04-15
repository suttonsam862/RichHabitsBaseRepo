import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

// Sample staff data - hardcoded to avoid any potential issues
const initialStaff = [
  { id: 1, name: "John Smith", role: "Coach" },
  { id: 2, name: "Jane Doe", role: "Trainer" },
  { id: 3, name: "Bob Johnson", role: "Manager" },
];

export default function SuperBasicStaff() {
  const { toast } = useToast();
  
  // State management
  const [staff, setStaff] = useState(initialStaff);
  
  // Handle direct delete - the simplest possible implementation
  const deleteStaff = (id: number) => {
    console.log(`Deleting staff with ID: ${id}`);
    
    // Create a new array without the deleted staff
    const newStaff = staff.filter(person => person.id !== id);
    console.log(`Staff before: ${staff.length}, Staff after: ${newStaff.length}`);
    
    // Update state
    setStaff(newStaff);
    
    // Show notification
    toast({
      title: "Staff deleted",
      description: `Staff member has been removed.`,
    });
  };
  
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Super Basic Staff List</h1>
      
      {/* Basic staff list */}
      <div className="space-y-4 mb-6">
        {staff.map(person => (
          <div key={person.id} className="flex items-center justify-between p-4 border rounded-md">
            <div>
              <p className="font-medium">{person.name}</p>
              <p className="text-sm text-gray-500">{person.role}</p>
            </div>
            <Button 
              variant="destructive"
              onClick={() => deleteStaff(person.id)}
            >
              Delete
            </Button>
          </div>
        ))}
      </div>
      
      {/* No staff message */}
      {staff.length === 0 && (
        <div className="p-6 text-center border rounded-md">
          <p className="mb-4">All staff members have been deleted.</p>
          <Button onClick={() => setStaff(initialStaff)}>
            Reset Staff List
          </Button>
        </div>
      )}
    </div>
  );
}