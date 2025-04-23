import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import AiGeneratedItems from "./ai-generated-items";
import { 
  CheckCircle2, 
  Circle, 
  Clock,
  CheckCheck,
  FileText,
  CalendarClock,
  MessagesSquare,
  FileQuestion,
  FileClock,
  FolderCheck,
  Phone,
  Mail,
  User,
  Building,
  DollarSign,
  Tag,
  CalendarRange
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

// Define steps that a lead goes through - consolidated to 3 detailed steps
const LEAD_STEPS = [
  {
    id: "initial_contact",
    name: "Initial Contact & Qualification",
    description: "Make first contact and qualify the lead's needs",
    icon: <Phone className="h-5 w-5" />,
    fields: [
      { name: "contactMethod", label: "Contact Method", type: "select", options: ["Phone", "Email", "In Person", "Social Media", "Video Call", "Text Message"] },
      { name: "contactDate", label: "Contact Date", type: "date" },
      { name: "contactNotes", label: "Contact Notes", type: "textarea" },
      { name: "budget", label: "Budget Range", type: "select", options: ["Under $1,000", "$1,000-$5,000", "$5,000-$10,000", "$10,000-$25,000", "$25,000-$50,000", "Over $50,000"] },
      { name: "timeframe", label: "Timeframe", type: "select", options: ["Immediate", "Within 30 days", "1-3 months", "3-6 months", "6-12 months", "Over 12 months"] },
      { name: "needsAssessment", label: "Detailed Needs Assessment", type: "textarea" },
      { name: "targetEventDate", label: "Target Event/Delivery Date", type: "date" },
      { name: "specialRequirements", label: "Special Requirements", type: "textarea" },
    ]
  },
  {
    id: "items_confirmation",
    name: "AI-Assisted Item Creation", 
    description: "Generate items, measurements and catalog reconciliation",
    icon: <FileText className="h-5 w-5" />,
    fields: [
      { name: "clientNotes", label: "Client Notes (for AI parsing)", type: "textarea", placeholder: "Describe the items needed, including details like garment types, quantities, fabric preferences, colors, and any special features. The AI will help convert this into structured items." },
      { name: "generatedItems", label: "Generated Items", type: "hidden" },
      { name: "fabricNotes", label: "Fabric Specifications", type: "textarea", placeholder: "Type, color, weight, special requirements" },
      { name: "designStyleNotes", label: "Design Style Notes", type: "textarea", placeholder: "Logos, artwork, style preferences" },
      { name: "measurementNotes", label: "Measurement Requirements", type: "textarea", placeholder: "Size ranges, special measurement needs" },
      { name: "additionalNotes", label: "Additional Notes", type: "textarea" },
    ],
    description2: `
This stage integrates AI to parse client requirements into structured items with:
• Automatic categorization and measurement schema matching
• Catalog search and reconciliation
• Fabric specification and color matching
• Manufacturing specs generation

The system will:
1. Parse your client notes to extract items and details
2. Match items to existing catalog entries when possible
3. Apply appropriate measurement templates based on item type
4. Track fabric requirements and manufacturing specifications
5. Generate a structured item list for design and production
    `,
  },
  {
    id: "design_handoff",
    name: "Final Approval & Design Handoff",
    description: "Confirm requirements and transfer to design team",
    icon: <FolderCheck className="h-5 w-5" />,
    fields: [
      { name: "finalReviewDate", label: "Final Review Date", type: "date" },
      { name: "clientApprovalDate", label: "Client Approval Date", type: "date" },
      { name: "paymentDetails", label: "Payment Details", type: "textarea", placeholder: "Deposit amount, payment method, etc." },
      { name: "designRequirements", label: "Special Design Requirements", type: "textarea" },
      { name: "deliveryInstructions", label: "Delivery Instructions", type: "textarea" },
      { name: "finalNotes", label: "Final Handoff Notes", type: "textarea" },
    ]
  }
];

export default function LeadStepProgress({ lead, isAdmin = false }) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [expandedStep, setExpandedStep] = useState(null);
  const [formValues, setFormValues] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Initialize lead progress data from the lead object
  const leadProgress = lead.progress || {};
  
  // Find the current active step (first incomplete step)
  const currentStepIndex = LEAD_STEPS.findIndex(
    step => !leadProgress[step.id] || !leadProgress[step.id].completed
  );
  
  // If all steps are complete, use the last step index
  const activeStepIndex = currentStepIndex === -1 ? LEAD_STEPS.length - 1 : currentStepIndex;
  
  // Function to check if a step is completed
  const isStepCompleted = (stepId) => {
    return leadProgress[stepId] && leadProgress[stepId].completed === true;
  };
  
  // Function to check if a step is the current active step
  const isActiveStep = (index) => {
    return index === activeStepIndex;
  };
  
  // Function to check if the current user has permission to update this lead
  const canUpdateLead = () => {
    return (
      isAdmin || 
      user?.role === 'admin' || 
      user?.role === 'executive' || 
      String(lead.salesRepId) === String(user?.id)
    );
  };
  
  // Mutation to update lead progress
  const updateLeadProgressMutation = useMutation({
    mutationFn: async ({ leadId, stepId, data }) => {
      console.log(`Updating lead progress for lead ${leadId}, step ${stepId}`);
      console.log('Data being sent:', JSON.stringify(data));
      
      try {
        const response = await apiRequest(
          "PATCH", 
          `/api/leads/${leadId}/progress/${stepId}`,
          data
        );
        
        // First check if the response is ok
        if (!response.ok) {
          // Try to get a structured error message if available
          try {
            const errorData = await response.json();
            throw new Error(errorData.error || `Server error: ${response.status}`);
          } catch (parseError) {
            // If we can't parse the JSON, just get the text
            const errorText = await response.text();
            throw new Error(`Failed to update lead progress: ${errorText || response.statusText}`);
          }
        }
        
        // Response is good, try to parse the JSON
        try {
          return await response.json();
        } catch (jsonError) {
          console.error('Error parsing JSON response:', jsonError);
          throw new Error('Invalid response format received from server');
        }
      } catch (networkError) {
        console.error('Network error in updateLeadProgressMutation:', networkError);
        throw new Error(`Network error: ${networkError.message}`);
      }
    },
    onSuccess: () => {
      // Invalidate the leads query to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
      setIsSubmitting(false);
      
      toast({
        title: "Progress Updated",
        description: "Lead progress has been successfully updated.",
      });
      
      // Reset form values
      setFormValues({});
      // Collapse the expanded step
      setExpandedStep(null);
    },
    onError: (error) => {
      console.error('Error in lead step progress update:', error);
      
      setIsSubmitting(false);
      
      // Keep formValues intact so user doesn't lose their input
      
      toast({
        title: "Error Updating Lead Progress",
        description: error.message || "Failed to update lead progress. Please try again.",
        variant: "destructive",
      });
      
      // Don't collapse the step so user can try again
      // setExpandedStep(null);
    }
  });
  
  // Handle step expansion/collapse
  const handleStepToggle = (stepId) => {
    if (expandedStep === stepId) {
      setExpandedStep(null);
    } else {
      setExpandedStep(stepId);
      // Pre-populate form values from existing data
      if (leadProgress[stepId]) {
        setFormValues(leadProgress[stepId].data || {});
      } else {
        setFormValues({});
      }
    }
  };
  
  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormValues(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle step completion
  const handleCompleteStep = (stepId) => {
    setIsSubmitting(true);
    
    // Prepare the data to submit
    const data = {
      completed: true,
      completedAt: new Date().toISOString(),
      completedBy: user?.id,
      data: formValues
    };
    
    // Call the mutation
    updateLeadProgressMutation.mutate({
      leadId: lead.id,
      stepId,
      data
    });
  };
  
  // Get the status badge color based on lead status
  const getStatusColor = (status) => {
    const statusColors = {
      new: "bg-blue-100 text-blue-800",
      claimed: "bg-purple-100 text-purple-800",
      contacted: "bg-yellow-100 text-yellow-800",
      qualified: "bg-green-100 text-green-800",
      proposal: "bg-indigo-100 text-indigo-800",
      negotiation: "bg-orange-100 text-orange-800",
      closed: "bg-green-500 text-white",
      lost: "bg-red-100 text-red-800"
    };
    
    return statusColors[status] || "bg-gray-100 text-gray-800";
  };
  
  return (
    <Card className="w-full bg-white shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <CardTitle className="text-xl font-semibold">{lead.name}</CardTitle>
            <CardDescription className="flex flex-wrap gap-2 mt-1">
              {lead.companyName && (
                <div className="flex items-center gap-1">
                  <Building className="h-3.5 w-3.5" />
                  <span>{lead.companyName}</span>
                </div>
              )}
              
              <div className="flex items-center gap-1">
                <User className="h-3.5 w-3.5" />
                <span>
                  {lead.assignedToName || "Unassigned"}
                </span>
              </div>
              
              {lead.value && (
                <div className="flex items-center gap-1">
                  <DollarSign className="h-3.5 w-3.5" />
                  <span>${lead.value}</span>
                </div>
              )}
              
              {lead.source && (
                <div className="flex items-center gap-1">
                  <Tag className="h-3.5 w-3.5" />
                  <span>{lead.source}</span>
                </div>
              )}
              
              <div className="flex items-center gap-1">
                <CalendarRange className="h-3.5 w-3.5" />
                <span>{formatDate(lead.createdAt)}</span>
              </div>
            </CardDescription>
          </div>
          
          <Badge className={`${getStatusColor(lead.status)} capitalize mt-2 md:mt-0`}>
            {lead.status}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Progress steps */}
        <div className="mt-2">
          <Accordion 
            type="single" 
            collapsible
            value={expandedStep}
            onValueChange={setExpandedStep}
          >
            {LEAD_STEPS.map((step, index) => {
              const isCompleted = isStepCompleted(step.id);
              const isActive = isActiveStep(index);
              const isDisabled = !isCompleted && !isActive && !isAdmin;
              
              return (
                <AccordionItem 
                  value={step.id} 
                  key={step.id}
                  disabled={isDisabled}
                  className={`border mb-2 rounded-md ${
                    isCompleted 
                      ? "bg-green-50 border-green-200" 
                      : isActive 
                        ? "bg-blue-50 border-blue-200" 
                        : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <AccordionTrigger className="px-4 py-3 hover:no-underline">
                    <div className="flex items-center space-x-3 w-full">
                      <div>
                        {isCompleted ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="rounded-full p-1 bg-green-100">
                                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Completed</p>
                                {leadProgress[step.id]?.completedAt && (
                                  <p className="text-xs">{formatDate(leadProgress[step.id].completedAt)}</p>
                                )}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : isActive ? (
                          <div className="rounded-full p-1 bg-blue-100">
                            <Clock className="h-5 w-5 text-blue-600" />
                          </div>
                        ) : (
                          <div className="rounded-full p-1 bg-gray-100">
                            <Circle className="h-5 w-5 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <h3 className={`text-sm font-medium ${
                          isCompleted 
                            ? "text-green-700" 
                            : isActive 
                              ? "text-blue-700" 
                              : "text-gray-700"
                        }`}>
                          {step.name}
                        </h3>
                        <p className="text-xs text-gray-500">{step.description}</p>
                      </div>
                      <div className="flex items-center">
                        {step.icon}
                      </div>
                    </div>
                  </AccordionTrigger>
                  
                  <AccordionContent className="px-4 py-3 border-t bg-white">
                    <div className="space-y-4 pt-2">
                      {/* Display form fields */}
                      {step.fields.map((field) => (
                        <div key={field.name} className="space-y-2">
                          <label className="text-sm font-medium">
                            {field.label}
                          </label>
                          
                          {field.type === "textarea" ? (
                            <Textarea
                              name={field.name}
                              value={formValues[field.name] || ""}
                              onChange={handleInputChange}
                              placeholder={`Enter ${field.label.toLowerCase()}`}
                              disabled={isCompleted || isSubmitting || !canUpdateLead()}
                              className="w-full"
                            />
                          ) : field.type === "select" ? (
                            <select
                              name={field.name}
                              value={formValues[field.name] || ""}
                              onChange={handleInputChange}
                              disabled={isCompleted || isSubmitting || !canUpdateLead()}
                              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                              <option value="">Select {field.label}</option>
                              {field.options.map((option) => (
                                <option key={option} value={option}>{option}</option>
                              ))}
                            </select>
                          ) : field.type === "date" ? (
                            <input
                              type="date"
                              name={field.name}
                              value={formValues[field.name] || ""}
                              onChange={handleInputChange}
                              disabled={isCompleted || isSubmitting || !canUpdateLead()}
                              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            />
                          ) : (
                            <input
                              type="text"
                              name={field.name}
                              value={formValues[field.name] || ""}
                              onChange={handleInputChange}
                              placeholder={`Enter ${field.label.toLowerCase()}`}
                              disabled={isCompleted || isSubmitting || !canUpdateLead()}
                              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            />
                          )}
                        </div>
                      ))}
                      
                      {/* Special handling for AI-assisted item creation */}
                      {step.id === "items_confirmation" && !isCompleted && (
                        <div className="mt-4 space-y-4">
                          <div className="flex justify-end">
                            <Button 
                              type="button"
                              onClick={async () => {
                                if (!formValues.clientNotes) return;
                                
                                toast({
                                  title: "AI Processing",
                                  description: "Processing client notes to generate structured items...",
                                });
                                
                                try {
                                  // Call the AI parsing endpoint
                                  const response = await apiRequest(
                                    "POST",
                                    "/api/ai/parseItems",
                                    { clientNotes: formValues.clientNotes }
                                  );
                                  
                                  if (!response.ok) {
                                    throw new Error("Failed to process client notes with AI");
                                  }
                                  
                                  const result = await response.json();
                                  
                                  if (result.success && result.data) {
                                    // Update form values with the generated items
                                    setFormValues(prev => ({
                                      ...prev,
                                      generatedItems: JSON.stringify(result.data)
                                    }));
                                    
                                    toast({
                                      title: "Items Generated",
                                      description: `AI has processed client notes and generated ${result.data.length} structured items.`,
                                    });
                                  } else {
                                    throw new Error(result.error || "Failed to parse items");
                                  }
                                } catch (error) {
                                  console.error("Error in AI parsing:", error);
                                  toast({
                                    title: "AI Processing Failed",
                                    description: error.message || "Failed to process client notes. Please try again.",
                                    variant: "destructive",
                                  });
                                }
                              }}
                              className="bg-blue-600 hover:bg-blue-700"
                              disabled={!formValues.clientNotes || isSubmitting}
                            >
                              Generate Items with AI
                            </Button>
                          </div>
                          
                          {/* Display AI-generated items if present */}
                          {formValues.generatedItems && (
                            <div className="mt-4">
                              <AiGeneratedItems
                                items={
                                  typeof formValues.generatedItems === 'string'
                                    ? (() => {
                                        try {
                                          return JSON.parse(formValues.generatedItems);
                                        } catch (e) {
                                          console.error('Error parsing generatedItems JSON:', e);
                                          return []; // Return empty array if parsing fails
                                        }
                                      })()
                                    : formValues.generatedItems
                                }
                                onChange={(updatedItems) => {
                                  setFormValues(prev => ({
                                    ...prev,
                                    generatedItems: JSON.stringify(updatedItems)
                                  }));
                                }}
                              />
                            </div>
                          )}
                          
                          {/* Display the additional description for the AI step */}
                          <div className="bg-blue-50 p-4 rounded-md mt-2 border border-blue-200 text-blue-800 text-sm">
                            <h4 className="font-medium mb-2">How AI-Assisted Item Creation Works</h4>
                            <div className="space-y-2 whitespace-pre-wrap">{step.description2}</div>
                          </div>
                        </div>
                      )}
                      
                      {/* Display existing data if step is completed */}
                      {isCompleted && leadProgress[step.id]?.data && (
                        <div className="bg-gray-50 p-3 rounded-md mt-2 border border-gray-200">
                          <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                            <CheckCheck className="h-4 w-4 mr-1" />
                            Completed Information
                          </h4>
                          <div className="space-y-2">
                            {Object.entries(leadProgress[step.id].data).map(([key, value]) => {
                              // Find the matching field label
                              const field = step.fields.find(f => f.name === key);
                              
                              // Special handling for generated items
                              if (key === "generatedItems" && value) {
                                try {
                                  let items;
                                  if (typeof value === 'string') {
                                    try {
                                      items = JSON.parse(value);
                                    } catch (e) {
                                      console.error('Error parsing completed generatedItems JSON:', e);
                                      throw e; // Re-throw to trigger the catch block below
                                    }
                                  } else {
                                    items = value;
                                  }
                                  return (
                                    <div key={key} className="mt-2">
                                      <AiGeneratedItems items={items} />
                                    </div>
                                  );
                                } catch {
                                  return (
                                    <div key={key} className="text-xs">
                                      <span className="font-medium">{field?.label || key}: </span>
                                      <span className="text-gray-600">[Complex data]</span>
                                    </div>
                                  );
                                }
                              }
                              
                              // Regular field display
                              return (
                                <div key={key} className="text-xs">
                                  <span className="font-medium">{field?.label || key}: </span>
                                  <span className="text-gray-600">{value}</span>
                                </div>
                              );
                            })}
                            {leadProgress[step.id].completedAt && (
                              <div className="text-xs">
                                <span className="font-medium">Completed: </span>
                                <span className="text-gray-600">{formatDate(leadProgress[step.id].completedAt)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Action buttons */}
                      {!isCompleted && canUpdateLead() && (
                        <div className="flex justify-end mt-4">
                          <Button
                            type="button"
                            onClick={() => handleCompleteStep(step.id)}
                            disabled={isSubmitting}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            {isSubmitting ? (
                              <>
                                <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                                Processing...
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Mark as Complete
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>
      </CardContent>
    </Card>
  );
}