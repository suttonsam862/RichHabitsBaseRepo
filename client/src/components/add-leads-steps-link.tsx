import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { AlertCircle, PlusSquare } from "lucide-react";
import { useLocation } from "wouter";

export default function AddLeadsStepsLink() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isAdding, setIsAdding] = useState(false);

  // Mutation to add leads-steps page to user navigation
  const addLeadsStepsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("GET", "/api/add-leads-steps-page");
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to add leads-steps page: ${errorText}`);
      }
      return response.json();
    },
    onSuccess: () => {
      // On success, invalidate user query to refresh navigation
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      toast({
        title: "Success",
        description: "Leads Steps page has been added to your navigation.",
      });
      
      // Navigate to the leads-steps page
      setTimeout(() => {
        navigate("/leads-steps");
      }, 500);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add Leads Steps page to navigation.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsAdding(false);
    },
  });

  const handleAddLeadsSteps = () => {
    setIsAdding(true);
    addLeadsStepsMutation.mutate();
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleAddLeadsSteps}
      disabled={isAdding}
      className="flex items-center space-x-1"
    >
      {isAdding ? (
        <AlertCircle className="h-4 w-4 mr-1 animate-pulse" />
      ) : (
        <PlusSquare className="h-4 w-4 mr-1" />
      )}
      <span>{isAdding ? "Adding..." : "Add Leads Steps to Navigation"}</span>
    </Button>
  );
}