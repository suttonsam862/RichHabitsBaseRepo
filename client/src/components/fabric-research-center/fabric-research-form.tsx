import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, RefreshCw, ArrowUpRight, Download, Clipboard, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const researchFormSchema = z.object({
  fabricType: z.string().min(2, "Fabric type must be at least 2 characters"),
  properties: z.array(z.string()).optional(),
  region: z.string().optional(),
  sustainabilityFocus: z.boolean().optional(),
  detailLevel: z.enum(["basic", "detailed", "comprehensive"]).default("detailed"),
});

type ResearchFormValues = z.infer<typeof researchFormSchema>;

export function FabricResearchForm() {
  const { toast } = useToast();
  const [isResearching, setIsResearching] = useState(false);
  const [researchResults, setResearchResults] = useState<any>(null);
  const [customProperty, setCustomProperty] = useState("");
  const [selectedTab, setSelectedTab] = useState("general");
  const [copied, setCopied] = useState(false);
  
  const form = useForm<ResearchFormValues>({
    resolver: zodResolver(researchFormSchema),
    defaultValues: {
      fabricType: "",
      properties: [],
      region: "global",
      sustainabilityFocus: false,
      detailLevel: "detailed",
    },
  });
  
  const fabricResearchMutation = useMutation({
    mutationFn: async (data: ResearchFormValues) => {
      const response = await apiRequest("POST", "/api/fabric-research", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Research Complete",
        description: "Fabric research has been successfully completed",
      });
      setResearchResults(data.data);
      // Also refresh the fabric library
      queryClient.invalidateQueries({ queryKey: ["/api/fabric-types"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Research Failed",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsResearching(false);
    },
  });
  
  const onSubmit = (data: ResearchFormValues) => {
    setIsResearching(true);
    fabricResearchMutation.mutate(data);
  };
  
  const handleAddProperty = () => {
    if (!customProperty.trim()) return;
    
    const currentProperties = form.getValues("properties") || [];
    if (!currentProperties.includes(customProperty)) {
      form.setValue("properties", [...currentProperties, customProperty]);
      setCustomProperty("");
    }
  };
  
  const handleRemoveProperty = (property: string) => {
    const currentProperties = form.getValues("properties") || [];
    form.setValue(
      "properties",
      currentProperties.filter((p) => p !== property)
    );
  };
  
  const commonProperties = [
    "Breathability",
    "Durability",
    "Stretch",
    "Water Resistance",
    "Moisture Wicking",
    "UV Protection",
    "Wrinkle Resistance",
    "Softness",
    "Weight",
    "Thermal Insulation",
  ];
  
  const copyToClipboard = () => {
    if (!researchResults) return;
    
    navigator.clipboard.writeText(JSON.stringify(researchResults, null, 2));
    setCopied(true);
    toast({
      title: "Copied",
      description: "Research results copied to clipboard",
    });
    
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Fabric Research Request</CardTitle>
          <CardDescription>
            Use AI to research and analyze fabric properties and characteristics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="fabricType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fabric Type</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., Cotton Jersey, Merino Wool, Elastane Blend" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Enter the specific fabric you want to research
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="properties"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Properties of Interest</FormLabel>
                    <FormDescription className="mb-2">
                      Select properties you're interested in researching
                    </FormDescription>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {commonProperties.map((property) => (
                        <div key={property} className="flex items-center space-x-2">
                          <Checkbox
                            id={property}
                            checked={(field.value || []).includes(property)}
                            onCheckedChange={(checked) => {
                              const currentProperties = field.value || [];
                              if (checked) {
                                form.setValue("properties", [...currentProperties, property]);
                              } else {
                                form.setValue(
                                  "properties",
                                  currentProperties.filter((p) => p !== property)
                                );
                              }
                            }}
                          />
                          <label
                            htmlFor={property}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {property}
                          </label>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex items-center space-x-2 mb-3">
                      <Input
                        placeholder="Add custom property..."
                        value={customProperty}
                        onChange={(e) => setCustomProperty(e.target.value)}
                        className="flex-grow"
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={handleAddProperty}
                      >
                        Add
                      </Button>
                    </div>
                    
                    {(field.value || []).length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {(field.value || []).map((property) => (
                          <Badge 
                            key={property} 
                            variant="secondary"
                            className="flex items-center gap-1"
                          >
                            {property}
                            <button
                              type="button"
                              className="ml-1 rounded-full outline-none focus:ring-2 focus:ring-offset-2"
                              onClick={() => handleRemoveProperty(property)}
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="region"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Region</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="global" id="global" />
                          <label htmlFor="global">Global (All regions)</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="north-america" id="north-america" />
                          <label htmlFor="north-america">North America</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="europe" id="europe" />
                          <label htmlFor="europe">Europe</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="asia" id="asia" />
                          <label htmlFor="asia">Asia</label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormDescription>
                      Region-specific information on manufacturing and availability
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="sustainabilityFocus"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-md">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Sustainability Focus</FormLabel>
                      <FormDescription>
                        Prioritize environmental impact and sustainability information
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="detailLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Level of Detail</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="basic" id="basic" />
                          <label htmlFor="basic">Basic (Quick overview)</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="detailed" id="detailed" />
                          <label htmlFor="detailed">Detailed (Standard research)</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="comprehensive" id="comprehensive" />
                          <label htmlFor="comprehensive">Comprehensive (In-depth analysis)</label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormDescription>
                      Select the level of detail for the research results
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button
                type="submit"
                className="w-full"
                disabled={isResearching}
              >
                {isResearching ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Researching...
                  </>
                ) : (
                  <>Research Fabric</>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      <div className="flex flex-col gap-4">
        {researchResults ? (
          <Card className="flex flex-col h-full">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>{researchResults.fabricType}</CardTitle>
                  <CardDescription>
                    Research Results
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={copyToClipboard}
                  >
                    {copied ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <Clipboard className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-grow p-0">
              <Tabs value={selectedTab} onValueChange={setSelectedTab} className="flex flex-col h-full">
                <TabsList className="grid grid-cols-5 w-full">
                  <TabsTrigger value="general">General</TabsTrigger>
                  <TabsTrigger value="properties">Properties</TabsTrigger>
                  <TabsTrigger value="manufacturing">Manufacturing</TabsTrigger>
                  <TabsTrigger value="sustainability">Sustainability</TabsTrigger>
                  <TabsTrigger value="sources">Sources</TabsTrigger>
                </TabsList>
                
                <ScrollArea className="flex-grow p-4 h-[calc(100%-2rem)]">
                  <TabsContent value="general" className="mt-0 h-full">
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-medium text-lg">Description</h3>
                        <p className="text-sm text-muted-foreground">
                          {researchResults.description}
                        </p>
                      </div>
                      
                      <div>
                        <h3 className="font-medium text-lg">Composition</h3>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {researchResults.composition.map((comp: string, idx: number) => (
                            <Badge key={idx} variant="outline">{comp}</Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="font-medium text-lg">Applications</h3>
                        <ul className="text-sm text-muted-foreground list-disc list-inside">
                          {researchResults.applications.map((app: string, idx: number) => (
                            <li key={idx}>{app}</li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h3 className="font-medium text-lg">Care Instructions</h3>
                        <ul className="text-sm text-muted-foreground list-disc list-inside">
                          {researchResults.careInstructions.map((instr: string, idx: number) => (
                            <li key={idx}>{instr}</li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h3 className="font-medium text-lg">Alternative Fabrics</h3>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {researchResults.alternatives.map((alt: string, idx: number) => (
                            <Badge key={idx} variant="secondary">{alt}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="properties" className="mt-0 h-full">
                    <div className="space-y-4">
                      {researchResults.properties.map((prop: any, idx: number) => (
                        <div key={idx} className="p-3 border rounded-lg">
                          <div className="flex justify-between">
                            <h3 className="font-medium">{prop.name}</h3>
                            <Badge variant="outline">
                              {prop.value} {prop.unit || ''}
                            </Badge>
                          </div>
                          {prop.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {prop.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="manufacturing" className="mt-0 h-full">
                    <div className="space-y-4">
                      {researchResults.manufacturingCosts.map((cost: any, idx: number) => (
                        <div key={idx} className="p-3 border rounded-lg">
                          <div className="flex justify-between items-center">
                            <h3 className="font-medium">Region: {cost.region}</h3>
                            <Badge variant="outline">
                              {cost.currency} {cost.baseUnitCost}/unit
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">Min Order:</span>{" "}
                              {cost.minOrderQuantity} units
                            </div>
                            <div>
                              <span className="text-muted-foreground">Lead Time:</span>{" "}
                              {cost.leadTime}
                            </div>
                          </div>
                          {cost.notes && (
                            <p className="text-sm text-muted-foreground mt-2">
                              {cost.notes}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="sustainability" className="mt-0 h-full">
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-medium text-lg">Environmental Impact</h3>
                        <p className="text-sm text-muted-foreground">
                          {researchResults.sustainabilityInfo.environmentalImpact}
                        </p>
                      </div>
                      
                      <div>
                        <h3 className="font-medium text-lg">Recyclability</h3>
                        <p className="text-sm text-muted-foreground">
                          {researchResults.sustainabilityInfo.recyclability}
                        </p>
                      </div>
                      
                      <div>
                        <h3 className="font-medium text-lg">Certifications</h3>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {researchResults.sustainabilityInfo.certifications.map((cert: string, idx: number) => (
                            <Badge key={idx} variant="outline" className="bg-green-50">
                              {cert}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="sources" className="mt-0 h-full">
                    <div className="space-y-2">
                      <h3 className="font-medium text-lg">Reference Sources</h3>
                      <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                        {researchResults.sources.map((source: string, idx: number) => (
                          <li key={idx}>{source}</li>
                        ))}
                      </ul>
                    </div>
                  </TabsContent>
                </ScrollArea>
                
                {researchResults.savedTypeId && (
                  <div className="p-3 mt-2 border-t">
                    <Alert className="bg-green-50">
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertTitle>Saved to Fabric Library</AlertTitle>
                      <AlertDescription>
                        This fabric has been added to your fabric library for future reference.
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
              </Tabs>
            </CardContent>
          </Card>
        ) : (
          <Card className="h-full flex items-center justify-center p-6 text-center">
            <div className="max-w-md space-y-4">
              <h3 className="text-xl font-medium">Research Fabric Properties</h3>
              <p className="text-muted-foreground">
                Fill out the form to research fabrics using AI. The system will provide
                detailed information about properties, manufacturing costs, and environmental impact.
              </p>
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Research results will appear here and can be saved to your fabric library for future reference.
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}