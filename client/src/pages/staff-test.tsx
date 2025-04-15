import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Absolutely minimal standalone page for testing staff deletion
export default function StaffTest() {
  const { toast } = useToast();
  
  // Direct array with no dependencies
  const [people, setPeople] = useState([
    { id: 1, name: "Person 1", role: "Role 1" },
    { id: 2, name: "Person 2", role: "Role 2" },
    { id: 3, name: "Person 3", role: "Role 3" },
  ]);
  
  // Handle delete directly
  const handleDelete = (id: number) => {
    console.log(`Attempting to delete person with ID: ${id}`);
    
    // Create new array without the deleted person
    const newPeople = people.filter(p => p.id !== id);
    console.log(`People before: ${people.length}, people after: ${newPeople.length}`);
    
    // Update state
    setPeople(newPeople);
    
    // Show toast
    toast({
      title: "Person deleted",
      description: `Person with ID ${id} has been removed.`
    });
  };
  
  return (
    <div className="p-6 bg-white rounded-md shadow-md mx-auto max-w-3xl mt-10">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Staff Test Page</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">This is a standalone test page for testing staff deletion functionality.</p>
          
          <div className="mb-2 bg-yellow-50 p-3 rounded-md text-yellow-800 border border-yellow-200 text-sm">
            <strong>Debug info:</strong> {people.length} people in the list
          </div>
        </CardContent>
      </Card>
      
      <div className="space-y-3 mb-6">
        {people.map(person => (
          <div 
            key={person.id}
            className="flex items-center justify-between p-4 border rounded-md bg-white"
          >
            <div>
              <p className="font-medium">{person.name}</p>
              <p className="text-sm text-gray-500">{person.role}</p>
            </div>
            <Button 
              variant="destructive" 
              onClick={() => handleDelete(person.id)}
            >
              Delete
            </Button>
          </div>
        ))}
      </div>
      
      {people.length === 0 && (
        <Card>
          <CardContent className="py-6 text-center">
            <p className="mb-4">All people have been deleted.</p>
            <Button 
              onClick={() => {
                setPeople([
                  { id: 1, name: "Person 1", role: "Role 1" },
                  { id: 2, name: "Person 2", role: "Role 2" },
                  { id: 3, name: "Person 3", role: "Role 3" },
                ]);
                
                toast({
                  title: "List reset",
                  description: "The people list has been restored."
                });
              }}
            >
              Reset List
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}