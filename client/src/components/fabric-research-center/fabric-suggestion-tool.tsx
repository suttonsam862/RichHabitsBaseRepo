import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  AlertTriangle, 
  Plus, 
  ArrowRight, 
  ArrowDown, 
  Star, 
  StarHalf, 
  Stars, 
  Save,
  Check,
  BookmarkPlus
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function FabricSuggestionTool() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [productType, setProductType] = useState("");
  const [properties, setProperties] = useState<string[]>([]);
  const [sustainabilityRequired, setSustainabilityRequired] = useState(false);
  const [budget, setBudget] = useState("medium");
  const [region, setRegion] = useState("global");
  const [suggestions, setSuggestions] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const [selectedFabricForSave, setSelectedFabricForSave] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const propertyOptions = [
    { id: "breathable", label: "Breathable" },
    { id: "durable", label: "Durable" },
    { id: "stretchy", label: "Stretchy" },
    { id: "lightweight", label: "Lightweight" },
    { id: "waterproof", label: "Waterproof" },
    { id: "moisture-wicking", label: "Moisture Wicking" },
    { id: "wrinkle-resistant", label: "Wrinkle Resistant" },
    { id: "stain-resistant", label: "Stain Resistant" },
    { id: "uv-protective", label: "UV Protective" },
    { id: "anti-microbial", label: "Anti-microbial" },
    { id: "soft", label: "Soft to Touch" },
    { id: "structured", label: "Structured" },
  ];
  
  const suggestFabricsMutation = useMutation({
    mutationFn: async (data: {
      productType: string;
      properties: string[];
      sustainabilityRequired: boolean;
      budget: string;
      region: string;
    }) => {
      const response = await apiRequest("POST", "/api/fabric-suggestions", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Suggestions Ready",
        description: "Fabric suggestions have been generated",
      });
      setSuggestions(data.data);
    },
    onError: (error: Error) => {
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsGenerating(false);
    },
  });
  
  const handleGetSuggestions = () => {
    if (!productType) {
      toast({
        title: "Missing Information",
        description: "Please enter a product type",
        variant: "destructive",
      });
      return;
    }
    
    if (properties.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please select at least one property",
        variant: "destructive",
      });
      return;
    }
    
    setIsGenerating(true);
    suggestFabricsMutation.mutate({
      productType,
      properties,
      sustainabilityRequired,
      budget,
      region,
    });
  };
  
  const handlePropertyChange = (property: string, checked: boolean) => {
    if (checked) {
      setProperties([...properties, property]);
    } else {
      setProperties(properties.filter((p) => p !== property));
    }
  };
  
  // Helper function to render star ratings
  const renderRating = (rating: number) => {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    
    return (
      <div className="flex items-center">
        {Array(fullStars)
          .fill(0)
          .map((_, i) => (
            <Star key={i} className="h-3.5 w-3.5 fill-current text-yellow-400" />
          ))}
        {halfStar && <StarHalf className="h-3.5 w-3.5 fill-current text-yellow-400" />}
        {Array(5 - fullStars - (halfStar ? 1 : 0))
          .fill(0)
          .map((_, i) => (
            <Star key={i + fullStars + (halfStar ? 1 : 0)} className="h-3.5 w-3.5 text-gray-300" />
          ))}
      </div>
    );
  };
  
  const productTypeOptions = [
    "T-shirt",
    "Jacket",
    "Pants",
    "Dress",
    "Sportswear",
    "Swimwear",
    "Activewear",
    "Outerwear",
    "Formal wear",
    "Sleepwear",
    "Underwear",
    "Socks",
    "Bag",
    "Hat",
    "Scarf"
  ];
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Fabric Suggestions</CardTitle>
          <CardDescription>
            Get AI-powered fabric recommendations based on your product requirements
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="productType">Product Type</Label>
            <div className="relative">
              <Input
                id="productType"
                value={productType}
                onChange={(e) => setProductType(e.target.value)}
                placeholder="e.g., Yoga Pants, Rain Jacket, Formal Shirt"
                list="productTypeOptions"
              />
              <datalist id="productTypeOptions">
                {productTypeOptions.map((type, idx) => (
                  <option key={idx} value={type} />
                ))}
              </datalist>
            </div>
            <p className="text-sm text-muted-foreground">
              What product will you be creating?
            </p>
          </div>
          
          <div className="space-y-2">
            <Label>Required Properties</Label>
            <div className="grid grid-cols-2 gap-2 border rounded-md p-3">
              {propertyOptions.map((property) => (
                <div key={property.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={property.id}
                    checked={properties.includes(property.label)}
                    onCheckedChange={(checked) =>
                      handlePropertyChange(property.label, checked === true)
                    }
                  />
                  <label
                    htmlFor={property.id}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {property.label}
                  </label>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              Select the properties required for your product
            </p>
          </div>
          
          <div className="space-y-2">
            <Label>Budget Range</Label>
            <RadioGroup defaultValue={budget} onValueChange={setBudget}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="low" id="budget-low" />
                <label htmlFor="budget-low">Low Cost</label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="medium" id="budget-medium" />
                <label htmlFor="budget-medium">Medium Cost</label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="high" id="budget-high" />
                <label htmlFor="budget-high">Premium</label>
              </div>
            </RadioGroup>
          </div>
          
          <div className="space-y-2">
            <Label>Region</Label>
            <RadioGroup defaultValue={region} onValueChange={setRegion}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="global" id="region-global" />
                <label htmlFor="region-global">Global (All regions)</label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="north-america" id="region-na" />
                <label htmlFor="region-na">North America</label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="europe" id="region-europe" />
                <label htmlFor="region-europe">Europe</label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="asia" id="region-asia" />
                <label htmlFor="region-asia">Asia</label>
              </div>
            </RadioGroup>
          </div>
          
          <div className="flex items-start space-x-3 space-y-0 p-4 border rounded-md">
            <Checkbox
              id="sustainability"
              checked={sustainabilityRequired}
              onCheckedChange={(checked) => setSustainabilityRequired(checked === true)}
            />
            <div className="space-y-1 leading-none">
              <label
                htmlFor="sustainability"
                className="font-medium text-sm peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Sustainability Required
              </label>
              <p className="text-sm text-muted-foreground">
                Focus on sustainable and eco-friendly fabric options
              </p>
            </div>
          </div>
          
          <Button
            onClick={handleGetSuggestions}
            className="w-full mt-4"
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...
              </>
            ) : (
              <>Get Fabric Suggestions</>
            )}
          </Button>
        </CardContent>
      </Card>
      
      <div className="flex flex-col gap-4">
        {suggestions ? (
          <Card className="flex flex-col h-full">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Suggested Fabrics</CardTitle>
                  <CardDescription>
                    For {productType} with {properties.join(", ")}
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowCompare(!showCompare)}
                >
                  {showCompare ? "Hide Comparison" : "Compare All"}
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="flex-grow p-0">
              {showCompare ? (
                <div className="p-4">
                  <Tabs defaultValue="properties">
                    <TabsList className="w-full grid grid-cols-3">
                      <TabsTrigger value="properties">Properties</TabsTrigger>
                      <TabsTrigger value="costs">Costs</TabsTrigger>
                      <TabsTrigger value="sustainability">Sustainability</TabsTrigger>
                    </TabsList>
                    
                    <ScrollArea className="h-[350px] mt-2">
                      <TabsContent value="properties" className="mt-0">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="border-b text-xs">
                              <th className="p-2 text-left">Fabric</th>
                              {properties.map((prop) => (
                                <th key={prop} className="p-2 text-center">{prop}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {suggestions.recommendedFabrics.map((fabric: any) => (
                              <tr key={fabric.name} className="border-b">
                                <td className="p-2 font-medium text-sm">{fabric.name}</td>
                                {properties.map((prop) => {
                                  const rating = fabric.propertyRatings[prop] || 0;
                                  return (
                                    <td key={`${fabric.name}-${prop}`} className="p-2 text-center">
                                      {renderRating(rating)}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </TabsContent>
                      
                      <TabsContent value="costs" className="mt-0">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="border-b text-xs">
                              <th className="p-2 text-left">Fabric</th>
                              <th className="p-2 text-center">Cost</th>
                              <th className="p-2 text-center">Availability</th>
                              <th className="p-2 text-center">Durability</th>
                            </tr>
                          </thead>
                          <tbody>
                            {suggestions.recommendedFabrics.map((fabric: any) => (
                              <tr key={fabric.name} className="border-b">
                                <td className="p-2 font-medium text-sm">{fabric.name}</td>
                                <td className="p-2 text-center">
                                  {fabric.costRating ? renderRating(fabric.costRating) : "N/A"}
                                </td>
                                <td className="p-2 text-center">
                                  {fabric.availabilityRating ? renderRating(fabric.availabilityRating) : "N/A"}
                                </td>
                                <td className="p-2 text-center">
                                  {fabric.durabilityRating ? renderRating(fabric.durabilityRating) : "N/A"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </TabsContent>
                      
                      <TabsContent value="sustainability" className="mt-0">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="border-b text-xs">
                              <th className="p-2 text-left">Fabric</th>
                              <th className="p-2 text-center">Eco Rating</th>
                              <th className="p-2 text-center">Recyclable</th>
                              <th className="p-2 text-center">Water Usage</th>
                            </tr>
                          </thead>
                          <tbody>
                            {suggestions.recommendedFabrics.map((fabric: any) => (
                              <tr key={fabric.name} className="border-b">
                                <td className="p-2 font-medium text-sm">{fabric.name}</td>
                                <td className="p-2 text-center">
                                  {fabric.sustainabilityRating ? renderRating(fabric.sustainabilityRating) : "N/A"}
                                </td>
                                <td className="p-2 text-center">
                                  {fabric.recyclability ? renderRating(fabric.recyclability) : "N/A"}
                                </td>
                                <td className="p-2 text-center">
                                  {fabric.waterUsage ? renderRating(5 - fabric.waterUsage) : "N/A"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </TabsContent>
                    </ScrollArea>
                  </Tabs>
                </div>
              ) : (
                <ScrollArea className="h-[400px] pt-2 px-4">
                  <div className="space-y-4">
                    {suggestions.recommendedFabrics.map((fabric: any, idx: number) => (
                      <Card key={idx} className="overflow-hidden border">
                        <CardHeader className="p-3 pb-0">
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-base">{fabric.name}</CardTitle>
                            <Badge variant={idx === 0 ? "default" : "outline"}>
                              {idx === 0 ? "Best Match" : `Option ${idx + 1}`}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="p-3 pt-2">
                          <p className="text-sm text-muted-foreground mb-2">
                            {fabric.description || "No description available."}
                          </p>
                          
                          <div className="grid grid-cols-2 gap-2 text-xs mt-3">
                            <div>
                              <span className="text-muted-foreground">Primary Use:</span>{" "}
                              {fabric.primaryUse || "Various"}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Best For:</span>{" "}
                              {fabric.bestFor || "General use"}
                            </div>
                            {fabric.weight && (
                              <div>
                                <span className="text-muted-foreground">Weight:</span>{" "}
                                {fabric.weight}
                              </div>
                            )}
                            {fabric.care && (
                              <div>
                                <span className="text-muted-foreground">Care:</span>{" "}
                                {fabric.care}
                              </div>
                            )}
                          </div>
                          
                          <Separator className="my-3" />
                          
                          <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2">
                            {Object.entries(fabric.propertyRatings || {}).map(
                              ([property, rating]: [string, any], propIdx) => (
                                <div
                                  key={propIdx}
                                  className="flex justify-between items-center text-xs"
                                >
                                  <span>{property}:</span>
                                  {renderRating(rating)}
                                </div>
                              )
                            )}
                          </div>
                          
                          {fabric.considerations && (
                            <div className="mt-3 text-xs text-muted-foreground">
                              <span className="font-medium">Considerations:</span>{" "}
                              {fabric.considerations}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
            
            <CardFooter className="border-t p-3 mt-auto">
              <div className="text-xs text-muted-foreground w-full">
                Based on {productType} requirements: {properties.join(", ")}
                {sustainabilityRequired && ", with sustainability focus"}
              </div>
            </CardFooter>
          </Card>
        ) : (
          <Card className="h-full flex items-center justify-center p-6 text-center">
            <div className="max-w-md space-y-4">
              <h3 className="text-xl font-medium">AI Fabric Recommendations</h3>
              <p className="text-muted-foreground">
                Complete the form to receive personalized fabric suggestions for your
                specific product needs. Our AI will analyze your requirements and
                recommend the best fabrics.
              </p>
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center mb-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500 mr-2" />
                  <span className="text-sm font-medium">Pro Tip</span>
                </div>
                <p className="text-xs text-muted-foreground text-left">
                  Be specific with your product type and select properties that are
                  most important for your application. For performance sportswear,
                  consider moisture-wicking and stretch. For outerwear, prioritize
                  water resistance and durability.
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}