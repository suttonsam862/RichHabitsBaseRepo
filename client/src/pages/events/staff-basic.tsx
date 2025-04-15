import React, { useState } from "react";
import { sampleStaffMembers } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";

// Most basic staff management implementation
export default function BasicStaffManagement() {
  const { toast } = useToast();
  
  // Initialize with sample data
  const [staffList, setStaffList] = useState(sampleStaffMembers);
  
  // Handle deleting a staff member - simple and direct
  const handleDelete = (id: number, name: string) => {
    console.log("Deleting staff with ID:", id, "Name:", name);
    
    // Create a new array excluding the staff with matching ID
    const newList = staffList.filter((staff) => staff.id !== id);
    console.log("Original list length:", staffList.length, "New list length:", newList.length);
    
    // Update state
    setStaffList(newList);
    
    // Show notification
    toast({
      title: "Staff Deleted",
      description: `${name} has been removed from the system.`,
    });
  };
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Staff Management (Basic Version)</h1>
      
      <div className="grid grid-cols-1 gap-4">
        {staffList.map((staff) => (
          <Card key={staff.id} className="p-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Avatar>
                <AvatarFallback>
                  {staff.name.split(" ").map((n) => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-medium">{staff.name}</h3>
                <p className="text-sm text-gray-500">{staff.role}</p>
              </div>
            </div>
            
            <Button 
              variant="destructive"
              onClick={() => handleDelete(staff.id, staff.name)}
            >
              Delete
            </Button>
          </Card>
        ))}
      </div>
      
      {staffList.length === 0 && (
        <div className="text-center p-6 border rounded-md mt-4">
          <p>All staff members have been deleted.</p>
          <Button 
            className="mt-4"
            onClick={() => {
              setStaffList(sampleStaffMembers);
              toast({
                title: "Staff Reset",
                description: "Staff list has been restored to default.",
              });
            }}
          >
            Reset Staff List
          </Button>
        </div>
      )}
    </div>
  );
}