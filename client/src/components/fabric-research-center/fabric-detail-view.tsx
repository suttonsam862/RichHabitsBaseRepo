import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Pencil, Trash2, Save, X, Clipboard, CheckCircle2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useState } from "react";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";

interface FabricDetailViewProps {
  fabricId: number;
  onDelete: (id: number) => void;
}

export function FabricDetailView({ fabricId, onDelete }: FabricDetailViewProps) {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("general");
  const [copied, setCopied] = useState(false);
  
  const { 
    data: fabric, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: [`/api/fabric-types/${fabricId}`],
  });
  
  const handleCopyToClipboard = () => {
    if (!fabric) return;
    
    navigator.clipboard.writeText(JSON.stringify(fabric.data, null, 2));
    setCopied(true);
    toast({
      title: "Copied",
      description: "Fabric details copied to clipboard",
    });
    
    setTimeout(() => setCopied(false), 2000);
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (error || !fabric) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Error loading fabric details: {(error as Error)?.message || "Unknown error"}
        </AlertDescription>
      </Alert>
    );
  }
  
  const fabricData = fabric.data;
  
  return (
    <>
      <DialogHeader className="pb-2">
        <div className="flex justify-between items-center">
          <DialogTitle className="text-xl">{fabricData.name}</DialogTitle>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleCopyToClipboard}
              className="h-8 w-8 p-0"
            >
              {copied ? <CheckCircle2 className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        <DialogDescription>
          {fabricData.description?.substring(0, 100)}
          {fabricData.description && fabricData.description.length > 100 ? "..." : ""}
        </DialogDescription>
      </DialogHeader>
      
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid grid-cols-5 mb-2">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="properties">Properties</TabsTrigger>
          <TabsTrigger value="manufacturing">Manufacturing</TabsTrigger>
          <TabsTrigger value="sustainability">Sustainability</TabsTrigger>
          <TabsTrigger value="sources">Sources</TabsTrigger>
        </TabsList>
        
        <ScrollArea className="h-[400px] pr-3">
          <TabsContent value="general" className="mt-0 space-y-4">
            <div>
              <h3 className="font-medium text-lg">Description</h3>
              <p className="text-sm text-muted-foreground">
                {fabricData.description || "No description available."}
              </p>
            </div>
            
            <div>
              <h3 className="font-medium text-lg">Composition</h3>
              {fabricData.composition && fabricData.composition.length > 0 ? (
                <div className="flex flex-wrap gap-2 mt-2">
                  {fabricData.composition.map((comp: string, idx: number) => (
                    <Badge key={idx} variant="outline">{comp}</Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No composition data available.</p>
              )}
            </div>
            
            <div>
              <h3 className="font-medium text-lg">Applications</h3>
              {fabricData.applications && fabricData.applications.length > 0 ? (
                <ul className="text-sm text-muted-foreground list-disc list-inside">
                  {fabricData.applications.map((app: string, idx: number) => (
                    <li key={idx}>{app}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No applications data available.</p>
              )}
            </div>
            
            <div>
              <h3 className="font-medium text-lg">Care Instructions</h3>
              {fabricData.careInstructions && fabricData.careInstructions.length > 0 ? (
                <ul className="text-sm text-muted-foreground list-disc list-inside">
                  {fabricData.careInstructions.map((instr: string, idx: number) => (
                    <li key={idx}>{instr}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No care instructions available.</p>
              )}
            </div>
            
            <div>
              <h3 className="font-medium text-lg">Alternative Fabrics</h3>
              {fabricData.alternatives && fabricData.alternatives.length > 0 ? (
                <div className="flex flex-wrap gap-2 mt-2">
                  {fabricData.alternatives.map((alt: string, idx: number) => (
                    <Badge key={idx} variant="secondary">{alt}</Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No alternatives data available.</p>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="properties" className="mt-0">
            {fabricData.properties && fabricData.properties.length > 0 ? (
              <div className="space-y-4">
                {fabricData.properties.map((prop: any, idx: number) => (
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
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No properties data available.</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="manufacturing" className="mt-0">
            {fabricData.manufacturingCosts && fabricData.manufacturingCosts.length > 0 ? (
              <div className="space-y-4">
                {fabricData.manufacturingCosts.map((cost: any, idx: number) => (
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
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No manufacturing cost data available.</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="sustainability" className="mt-0">
            {fabricData.sustainabilityInfo ? (
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-lg">Environmental Impact</h3>
                  <p className="text-sm text-muted-foreground">
                    {fabricData.sustainabilityInfo.environmentalImpact || "No data available."}
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium text-lg">Recyclability</h3>
                  <p className="text-sm text-muted-foreground">
                    {fabricData.sustainabilityInfo.recyclability || "No data available."}
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium text-lg">Certifications</h3>
                  {fabricData.sustainabilityInfo.certifications && 
                   fabricData.sustainabilityInfo.certifications.length > 0 ? (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {fabricData.sustainabilityInfo.certifications.map((cert: string, idx: number) => (
                        <Badge key={idx} variant="outline" className="bg-green-50">
                          {cert}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No certification data available.</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No sustainability data available.</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="sources" className="mt-0">
            {fabricData.sources && fabricData.sources.length > 0 ? (
              <div className="space-y-2">
                <h3 className="font-medium text-lg">Reference Sources</h3>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                  {fabricData.sources.map((source: string, idx: number) => (
                    <li key={idx}>{source}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No source information available.</p>
              </div>
            )}
          </TabsContent>
        </ScrollArea>
      </Tabs>
      
      <DialogFooter className="flex justify-between items-center pt-4 border-t mt-4">
        <div className="text-sm text-muted-foreground">
          Created: {new Date(fabricData.createdAt).toLocaleDateString()}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => onDelete(fabricId)}
          >
            <Trash2 className="h-4 w-4 mr-2" /> Delete
          </Button>
          <Button variant="default">
            <Pencil className="h-4 w-4 mr-2" /> Edit
          </Button>
        </div>
      </DialogFooter>
    </>
  );
}