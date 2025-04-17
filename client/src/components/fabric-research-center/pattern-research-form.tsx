import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Loader2, FileText, Search, TrendingUp, Lightbulb, CheckCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { PatternDetailDialog } from "./pattern-detail-dialog";

// Define pattern types
const PATTERN_TYPES = [
  { value: "shirt", label: "Shirt" },
  { value: "t-shirt", label: "T-Shirt" },
  { value: "polo", label: "Polo Shirt" },
  { value: "hoodie", label: "Hoodie" },
  { value: "sweatshirt", label: "Sweatshirt" },
  { value: "jersey", label: "Jersey" },
  { value: "pants", label: "Pants" },
  { value: "leggings", label: "Leggings" },
  { value: "shorts", label: "Shorts" },
  { value: "skirt", label: "Skirt" },
  { value: "dress", label: "Dress" },
  { value: "jacket", label: "Jacket" },
  { value: "coat", label: "Coat" },
  { value: "hat", label: "Hat" },
  { value: "sock", label: "Socks" },
  { value: "bag", label: "Bag" },
  { value: "other", label: "Other" },
];

// Form schema
const patternResearchSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  type: z.string().min(1, "Please select a pattern type"),
  description: z.string().optional(),
  specificBrand: z.string().optional(),
  saveToDatabase: z.boolean().default(true),
});

type PatternResearchValues = z.infer<typeof patternResearchSchema>;

interface PatternResearchResult {
  name: string;
  type: string;
  description: string;
  complexity: string;
  measurements: Array<{
    name: string;
    value: string;
    unit: string;
    isRequired: boolean;
    description?: string;
  }>;
  materialRequirements: {
    primaryFabric: {
      type: string;
      amount: string;
      unit: string;
    };
    secondaryFabrics?: Array<{
      type: string;
      amount: string;
      unit: string;
    }>;
    notions: Array<{
      name: string;
      quantity: string;
      description?: string;
    }>;
  };
  suitableFabrics: string[];
  instructions?: string[];
  tips?: string[];
  referenceImageUrl?: string;
  savedPatternId?: number;
}

export function PatternResearchForm() {
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(false);
  const [researchResult, setResearchResult] = useState<PatternResearchResult | null>(null);
  const [patternDetailOpen, setPatternDetailOpen] = useState(false);
  const [selectedPatternId, setSelectedPatternId] = useState<number | null>(null);
  
  const form = useForm<PatternResearchValues>({
    resolver: zodResolver(patternResearchSchema),
    defaultValues: {
      name: "",
      type: "",
      description: "",
      specificBrand: "",
      saveToDatabase: true,
    },
  });
  
  const researchPatternMutation = useMutation({
    mutationFn: async (data: PatternResearchValues) => {
      const response = await apiRequest("POST", "/api/pattern-research", data);
      return response.json();
    },
    onSuccess: (data) => {
      setResearchResult(data.data);
      toast({
        title: "Pattern research complete",
        description: "The pattern details have been successfully researched.",
      });
      
      if (data.data.savedPatternId) {
        // Invalidate the sewing patterns query to refresh the list
        queryClient.invalidateQueries({
          queryKey: ["/api/sewing-patterns"],
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Research failed",
        description: `Failed to research pattern: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (values: PatternResearchValues) => {
    setResearchResult(null);
    researchPatternMutation.mutate(values);
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>AI Pattern Research</CardTitle>
        <CardDescription>
          Research detailed measurements and specifications for clothing patterns
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pattern Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., Athletic Leggings, Oxford Shirt" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Enter the specific pattern or garment name
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pattern Type</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select pattern type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PATTERN_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="specificBrand"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Specific Brand/Reference (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., Nike Dri-FIT, Lululemon Align, Champion" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Add a brand reference for more specific measurements
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className={isExpanded ? "block" : "hidden"}>
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Add any specific details or requirements you're looking for..." 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <Button 
              type="button" 
              variant="ghost" 
              className="w-full py-1 h-auto" 
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? "Show Less" : "Show More Options"}
            </Button>
            
            <Separator />
            
            <FormField
              control={form.control}
              name="saveToDatabase"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Save to Pattern Library</FormLabel>
                    <FormDescription>
                      Save this research result to your pattern library for future use
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={researchPatternMutation.isPending}
            >
              {researchPatternMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Researching Pattern...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Research Pattern
                </>
              )}
            </Button>
          </form>
        </Form>
        
        {researchResult && (
          <div className="mt-8 space-y-4">
            <Alert className="bg-green-50 border-green-200">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">Research Complete</AlertTitle>
              <AlertDescription className="text-green-700">
                Pattern research has been completed successfully. 
                {researchResult.savedPatternId && 
                  <> 
                    <div className="mt-1 flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-1" />
                      <span>The pattern has been saved to your library.</span>
                    </div>
                  </>
                }
              </AlertDescription>
            </Alert>
            
            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{researchResult.name}</CardTitle>
                    <div className="flex gap-2 mt-1">
                      <Badge>{researchResult.type}</Badge>
                      <Badge variant="outline">{researchResult.complexity}</Badge>
                    </div>
                  </div>
                </div>
                <CardDescription className="mt-2">
                  {researchResult.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Key Measurements</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {researchResult.measurements?.slice(0, 6).map((measurement, idx) => (
                      <div key={idx} className="border rounded p-2">
                        <div className="text-sm text-muted-foreground">{measurement.name}</div>
                        <div className="font-medium">{measurement.value} {measurement.unit}</div>
                      </div>
                    ))}
                  </div>
                  {researchResult.measurements?.length > 6 && (
                    <div className="text-sm text-muted-foreground mt-2">
                      And {researchResult.measurements.length - 6} more measurements...
                    </div>
                  )}
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Suitable Fabrics</h4>
                  <div className="flex flex-wrap gap-2">
                    {researchResult.suitableFabrics?.map((fabric, idx) => (
                      <Badge key={idx} variant="secondary">{fabric}</Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between pt-0">
                <div className="text-sm text-muted-foreground flex items-center">
                  <Lightbulb className="h-3 w-3 mr-1" />
                  {researchResult.tips && researchResult.tips.length > 0 
                    ? `${researchResult.tips.length} tips available` 
                    : "No tips available"}
                </div>
                <Button 
                  variant="default" 
                  disabled={!researchResult.savedPatternId}
                  onClick={() => {
                    if (researchResult.savedPatternId) {
                      setSelectedPatternId(researchResult.savedPatternId);
                      setPatternDetailOpen(true);
                    }
                  }}
                >
                  View Details
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}

        {/* Pattern Detail Dialog */}
        <PatternDetailDialog 
          patternId={selectedPatternId}
          isOpen={patternDetailOpen}
          onOpenChange={(open) => {
            setPatternDetailOpen(open);
            if (!open) {
              setSelectedPatternId(null);
            }
          }}
        />
      </CardContent>
    </Card>
  );
}