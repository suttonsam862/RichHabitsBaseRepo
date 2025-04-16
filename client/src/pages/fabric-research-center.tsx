import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  Loader2,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FileText,
  ClipboardCheck,
  Filter,
  RefreshCw,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FabricResearchForm } from "@/components/fabric-research-center/fabric-research-form";
import { FabricDetailView } from "@/components/fabric-research-center/fabric-detail-view";
import { FabricCompatibilityAnalyzer } from "@/components/fabric-research-center/fabric-compatibility-analyzer";
import { FabricSuggestionTool } from "@/components/fabric-research-center/fabric-suggestion-tool";
import { Separator } from "@/components/ui/separator";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function FabricResearchCenter() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("library");
  const [selectedFabricId, setSelectedFabricId] = useState<number | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Fetch fabric types
  const { 
    data: fabricTypes, 
    isLoading: isLoadingFabrics,
    error: fabricsError,
    refetch: refetchFabrics
  } = useQuery({
    queryKey: ["/api/fabric-types"],
    enabled: activeTab === "library",
  });
  
  // Delete fabric mutation
  const deleteFabricMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/fabric-types/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Fabric deleted",
        description: "The fabric has been deleted from the library.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/fabric-types"] });
      setSelectedFabricId(null);
      setIsViewDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete fabric: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const handleDeleteFabric = (id: number) => {
    if (confirm("Are you sure you want to delete this fabric? This cannot be undone.")) {
      deleteFabricMutation.mutate(id);
    }
  };
  
  // Filter fabrics based on search query
  const filteredFabrics = fabricTypes?.data 
    ? fabricTypes.data.filter(fabric => 
        fabric.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        fabric.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        fabric.composition?.some(comp => comp.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];
  
  // Handle view fabric details
  const handleViewFabric = (id: number) => {
    setSelectedFabricId(id);
    setIsViewDialogOpen(true);
  };
  
  return (
    <div className="container p-4 mx-auto">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Fabric Research Center</h1>
            <p className="text-muted-foreground">
              Research, analyze, and manage fabric types for product creation
            </p>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-6 w-full max-w-5xl mb-4">
            <TabsTrigger value="library">Fabric Library</TabsTrigger>
            <TabsTrigger value="unpublished">Unpublished</TabsTrigger>
            <TabsTrigger value="research">Fabric Research</TabsTrigger>
            <TabsTrigger value="patterns">Pattern Research</TabsTrigger>
            <TabsTrigger value="compatibility">Compatibility</TabsTrigger>
            <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
          </TabsList>
          
          {/* Fabric Library Tab */}
          <TabsContent value="library" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search fabrics..."
                  className="pl-8 w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => refetchFabrics()}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Fabric
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[625px]">
                    <DialogHeader>
                      <DialogTitle>Add New Fabric</DialogTitle>
                      <DialogDescription>
                        Manually add a new fabric to the library
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      {/* Add Fabric Form */}
                      <Label htmlFor="name">Name</Label>
                      <Input id="name" placeholder="e.g., Cotton Jersey" />
                      
                      <Label htmlFor="description">Description</Label>
                      <Textarea id="description" placeholder="Describe the fabric and its key features..." />
                      
                      {/* Add more fields as needed */}
                    </div>
                    <DialogFooter>
                      <Button type="submit">Save Fabric</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            
            {isLoadingFabrics ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : fabricsError ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-red-500">Error loading fabrics: {(fabricsError as Error).message}</p>
                  <Button variant="outline" className="mt-4" onClick={() => refetchFabrics()}>
                    Try Again
                  </Button>
                </CardContent>
              </Card>
            ) : filteredFabrics.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-muted-foreground">No fabrics found. Add a new fabric or use the AI Research tool.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredFabrics.map((fabric) => (
                  <Card key={fabric.id} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <CardTitle>{fabric.name}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {fabric.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-3">
                      <div className="flex flex-wrap gap-2 mb-3">
                        {fabric.composition?.slice(0, 3).map((comp, idx) => (
                          <Badge key={idx} variant="outline">{comp}</Badge>
                        ))}
                        {fabric.composition && fabric.composition.length > 3 && (
                          <Badge variant="outline">+{fabric.composition.length - 3} more</Badge>
                        )}
                      </div>
                      <Button 
                        variant="secondary" 
                        className="w-full"
                        onClick={() => handleViewFabric(fabric.id)}
                      >
                        View Details
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          {/* AI Research Tab */}
          <TabsContent value="research">
            <FabricResearchForm />
          </TabsContent>
          
          {/* Compatibility Analysis Tab */}
          <TabsContent value="compatibility">
            <FabricCompatibilityAnalyzer />
          </TabsContent>
          
          {/* Product Suggestions Tab */}
          <TabsContent value="suggestions">
            <FabricSuggestionTool />
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Fabric Detail Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-hidden">
          {selectedFabricId && (
            <FabricDetailView 
              fabricId={selectedFabricId} 
              onDelete={handleDeleteFabric}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}