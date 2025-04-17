import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, FileText, CheckCircle2, ExternalLink, Clipboard } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

interface PatternDetailDialogProps {
  patternId: number | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PatternDetailDialog({
  patternId,
  isOpen,
  onOpenChange,
}: PatternDetailDialogProps) {
  const [activeTab, setActiveTab] = useState("measurements");

  // Fetch pattern details
  const { data: pattern, isLoading } = useQuery({
    queryKey: ['/api/sewing-patterns', patternId],
    queryFn: async () => {
      if (!patternId) return null;
      const response = await fetch(`/api/sewing-patterns/${patternId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch pattern details");
      }
      return response.json();
    },
    enabled: isOpen && !!patternId,
  });

  if (!isOpen || !patternId) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Pattern Details</DialogTitle>
          <DialogDescription>
            View comprehensive measurements and specifications
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : pattern ? (
          <div className="space-y-4 overflow-y-auto">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold">{pattern.data.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <Badge>{pattern.data.type}</Badge>
                  <Badge variant="outline">{pattern.data.complexity}</Badge>
                </div>
                <p className="text-muted-foreground mt-2">{pattern.data.description}</p>
              </div>
              <Button variant="outline" size="sm">
                <Clipboard className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="measurements">Measurements</TabsTrigger>
                <TabsTrigger value="materials">Materials</TabsTrigger>
                <TabsTrigger value="compatibility">Compatibility</TabsTrigger>
              </TabsList>

              <TabsContent value="measurements" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle>Reference Image</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="aspect-square w-full bg-muted-foreground/10 rounded-md overflow-hidden">
                        {pattern.data.referenceImageUrl ? (
                          <img
                            src={pattern.data.referenceImageUrl}
                            alt={pattern.data.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                            <FileText className="h-16 w-16 mb-2" />
                            <p>No reference image available</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle>Detailed Measurements</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <ScrollArea className="h-[300px]">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Measurement</TableHead>
                              <TableHead>Value</TableHead>
                              <TableHead>Required</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {pattern.data.measurements?.map((measurement, index) => (
                              <TableRow key={index}>
                                <TableCell className="font-medium">
                                  {measurement.name}
                                  {measurement.description && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {measurement.description}
                                    </p>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {measurement.value} {measurement.unit}
                                </TableCell>
                                <TableCell>
                                  {measurement.isRequired ? (
                                    <div className="bg-green-100 text-green-800 rounded-full w-6 h-6 flex items-center justify-center">
                                      <CheckCircle2 className="h-4 w-4" />
                                    </div>
                                  ) : (
                                    <div className="bg-gray-100 text-gray-400 rounded-full w-6 h-6 flex items-center justify-center">
                                      <span className="text-xs">Opt</span>
                                    </div>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                            {(!pattern.data.measurements || pattern.data.measurements.length === 0) && (
                              <TableRow>
                                <TableCell colSpan={3} className="text-center text-muted-foreground">
                                  No measurements available
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="materials" className="space-y-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle>Material Requirements</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="p-4 border-b">
                      <h3 className="font-semibold">Primary Fabric</h3>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <div>
                          <div className="text-sm text-muted-foreground">Type</div>
                          <div>{pattern.data.materialRequirements?.primaryFabric?.type || "Not specified"}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Amount</div>
                          <div>
                            {pattern.data.materialRequirements?.primaryFabric?.amount || "Not specified"} {" "}
                            {pattern.data.materialRequirements?.primaryFabric?.unit || ""}
                          </div>
                        </div>
                      </div>
                    </div>

                    {pattern.data.materialRequirements?.secondaryFabrics && 
                     pattern.data.materialRequirements.secondaryFabrics.length > 0 && (
                      <div className="p-4 border-b">
                        <h3 className="font-semibold">Secondary Fabrics</h3>
                        <div className="mt-2 space-y-3">
                          {pattern.data.materialRequirements.secondaryFabrics.map((fabric, idx) => (
                            <div key={idx} className="grid grid-cols-2 gap-2">
                              <div>
                                <div className="text-sm text-muted-foreground">Type</div>
                                <div>{fabric.type || "Not specified"}</div>
                              </div>
                              <div>
                                <div className="text-sm text-muted-foreground">Amount</div>
                                <div>{fabric.amount || "Not specified"} {fabric.unit || ""}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {pattern.data.materialRequirements?.notions && 
                     pattern.data.materialRequirements.notions.length > 0 && (
                      <div className="p-4">
                        <h3 className="font-semibold">Notions & Accessories</h3>
                        <div className="mt-2 space-y-2">
                          {pattern.data.materialRequirements.notions.map((notion, idx) => (
                            <div key={idx} className="flex justify-between">
                              <div className="font-medium">{notion.name}</div>
                              <div>{notion.quantity}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {pattern.data.instructions && pattern.data.instructions.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle>Basic Instructions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ol className="list-decimal pl-5 space-y-2">
                        {pattern.data.instructions.slice(0, 5).map((instruction, idx) => (
                          <li key={idx}>{instruction}</li>
                        ))}
                        {pattern.data.instructions.length > 5 && (
                          <li className="text-muted-foreground">
                            And {pattern.data.instructions.length - 5} more steps...
                          </li>
                        )}
                      </ol>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="compatibility" className="space-y-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle>Suitable Fabrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {pattern.data.suitableFabrics?.map((fabric, idx) => (
                        <Badge key={idx} variant="secondary">{fabric}</Badge>
                      ))}
                      {(!pattern.data.suitableFabrics || pattern.data.suitableFabrics.length === 0) && (
                        <p className="text-muted-foreground">No fabric compatibility information available</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {pattern.data.tips && pattern.data.tips.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle>Tips & Considerations</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {pattern.data.tips.map((tip, idx) => (
                          <li key={idx} className="flex gap-2">
                            <div className="mt-1 flex-shrink-0 rounded-full bg-primary/10 p-1">
                              <div className="h-2 w-2 rounded-full bg-primary" />
                            </div>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="default">
                Add to Product Catalog
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center p-8">
            <p className="text-muted-foreground">Pattern not found</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}