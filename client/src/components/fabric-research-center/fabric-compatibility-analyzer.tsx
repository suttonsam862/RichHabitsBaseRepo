import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
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
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, XCircle, AlertTriangle, ArrowRight } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { apiRequest } from "@/lib/queryClient";
import { Separator } from "@/components/ui/separator";

export function FabricCompatibilityAnalyzer() {
  const { toast } = useToast();
  const [fabricType, setFabricType] = useState("");
  const [productionMethod, setProductionMethod] = useState("");
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Get all production methods for autocomplete
  const productionMethods = [
    "Screen Printing",
    "Digital Printing",
    "Sublimation Printing",
    "Embroidery",
    "Laser Cutting",
    "Ultrasonic Welding",
    "Heat Transfer",
    "Direct-to-Garment (DTG)",
    "Cut-and-Sew",
    "Rotary Printing",
    "3D Knitting",
    "Seamless Knitting",
    "Quilting",
    "Appliqué",
    "Hot-melt Bonding",
    "Die Cutting"
  ];
  
  // Fetch fabric types for autocomplete
  const { data: fabricTypes } = useQuery({
    queryKey: ["/api/fabric-types"],
  });
  
  const compatibilityMutation = useMutation({
    mutationFn: async (data: { fabricType: string; productionMethod: string }) => {
      const response = await apiRequest("POST", "/api/fabric-compatibility-analysis", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Analysis Complete",
        description: "Fabric compatibility analysis has been completed",
      });
      setAnalysisResults(data.data);
    },
    onError: (error: Error) => {
      toast({
        title: "Analysis Failed",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsAnalyzing(false);
    },
  });
  
  const handleAnalyze = () => {
    if (!fabricType || !productionMethod) {
      toast({
        title: "Missing Information",
        description: "Please enter both fabric type and production method",
        variant: "destructive",
      });
      return;
    }
    
    setIsAnalyzing(true);
    compatibilityMutation.mutate({ fabricType, productionMethod });
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Compatibility Analysis</CardTitle>
          <CardDescription>
            Analyze compatibility between fabrics and production methods
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fabricType">Fabric Type</Label>
            <div className="relative">
              <Input
                id="fabricType"
                value={fabricType}
                onChange={(e) => setFabricType(e.target.value)}
                placeholder="e.g., Cotton Jersey, Polyester, Silk Chiffon"
                list="fabricTypeOptions"
              />
              <datalist id="fabricTypeOptions">
                {fabricTypes?.data?.map((fabric: any) => (
                  <option key={fabric.id} value={fabric.name} />
                ))}
              </datalist>
            </div>
            <p className="text-sm text-muted-foreground">
              Enter the fabric you want to analyze
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="productionMethod">Production Method</Label>
            <div className="relative">
              <Input
                id="productionMethod"
                value={productionMethod}
                onChange={(e) => setProductionMethod(e.target.value)}
                placeholder="e.g., Screen Printing, Embroidery, Laser Cutting"
                list="productionMethodOptions"
              />
              <datalist id="productionMethodOptions">
                {productionMethods.map((method, idx) => (
                  <option key={idx} value={method} />
                ))}
              </datalist>
            </div>
            <p className="text-sm text-muted-foreground">
              Enter the production method to check compatibility
            </p>
          </div>
          
          <Button 
            onClick={handleAnalyze} 
            className="w-full mt-4" 
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...
              </>
            ) : (
              <>Analyze Compatibility</>
            )}
          </Button>
        </CardContent>
        
        <CardFooter className="flex-col items-start pt-0">
          <Separator className="mb-4" />
          <div className="space-y-2 w-full">
            <h3 className="text-sm font-medium">Common Production Methods</h3>
            <div className="flex flex-wrap gap-2">
              {productionMethods.slice(0, 8).map((method, idx) => (
                <Badge 
                  key={idx} 
                  variant="outline"
                  className="cursor-pointer hover:bg-accent"
                  onClick={() => setProductionMethod(method)}
                >
                  {method}
                </Badge>
              ))}
            </div>
          </div>
        </CardFooter>
      </Card>
      
      <div className="flex flex-col gap-4">
        {analysisResults ? (
          <Card className="flex flex-col h-full">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Analysis Results</CardTitle>
                  <CardDescription>
                    {fabricType} + {productionMethod}
                  </CardDescription>
                </div>
                <div>
                  {analysisResults.isCompatible ? (
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      <CheckCircle className="h-3.5 w-3.5 mr-1" /> 
                      Compatible
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <XCircle className="h-3.5 w-3.5 mr-1" /> 
                      Not Compatible
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="flex-grow pb-0">
              <ScrollArea className="h-[350px] pr-3">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-base">Compatibility Summary</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {analysisResults.summary}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-base">Technical Details</h3>
                    {analysisResults.technicalDetails ? (
                      <div className="mt-1 space-y-2">
                        {analysisResults.technicalDetails.map((detail: string, idx: number) => (
                          <div key={idx} className="text-sm">
                            • {detail}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground mt-1">
                        No technical details available.
                      </p>
                    )}
                  </div>
                  
                  {!analysisResults.isCompatible && analysisResults.alternatives && (
                    <div>
                      <h3 className="font-medium text-base">Recommended Alternatives</h3>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {analysisResults.alternatives.map((alt: string, idx: number) => (
                          <Badge key={idx} variant="secondary">
                            {alt}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {analysisResults.considerations && analysisResults.considerations.length > 0 && (
                    <div>
                      <h3 className="font-medium text-base">Special Considerations</h3>
                      <Alert variant="outline" className="mt-2">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Important Notes</AlertTitle>
                        <AlertDescription>
                          <ul className="list-disc list-inside space-y-1 text-sm">
                            {analysisResults.considerations.map((cons: string, idx: number) => (
                              <li key={idx}>{cons}</li>
                            ))}
                          </ul>
                        </AlertDescription>
                      </Alert>
                    </div>
                  )}
                  
                  {analysisResults.processTips && (
                    <div>
                      <h3 className="font-medium text-base">Process Tips</h3>
                      <div className="mt-1 space-y-2">
                        {analysisResults.processTips.map((tip: string, idx: number) => (
                          <div key={idx} className="text-sm">
                            • {tip}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
            
            <CardFooter className="pt-4 pb-4 border-t mt-2">
              <div className="w-full">
                {analysisResults.isCompatible ? (
                  <Button className="w-full bg-green-600 hover:bg-green-700">
                    Proceed with This Combination
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <Alert variant="destructive" className="py-2">
                      <AlertDescription className="text-sm">
                        This combination is not recommended for production.
                      </AlertDescription>
                    </Alert>
                    <Button variant="outline" className="w-full">
                      View Alternative Production Methods <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardFooter>
          </Card>
        ) : (
          <Card className="h-full flex items-center justify-center p-6 text-center">
            <div className="max-w-md space-y-4">
              <h3 className="text-xl font-medium">Check Production Compatibility</h3>
              <p className="text-muted-foreground">
                Enter a fabric type and production method to analyze their compatibility.
                The system will evaluate whether they work well together and provide
                recommendations.
              </p>
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="flex flex-col items-center p-4 bg-muted/50 rounded-lg">
                  <CheckCircle className="h-8 w-8 text-green-500 mb-2" />
                  <p className="text-sm font-medium">Compatible</p>
                  <p className="text-xs text-muted-foreground">
                    Can be used together with normal processing
                  </p>
                </div>
                <div className="flex flex-col items-center p-4 bg-muted/50 rounded-lg">
                  <XCircle className="h-8 w-8 text-red-500 mb-2" />
                  <p className="text-sm font-medium">Not Compatible</p>
                  <p className="text-xs text-muted-foreground">
                    May result in production issues or poor quality
                  </p>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}