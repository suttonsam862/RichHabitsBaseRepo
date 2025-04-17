import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { 
  Check, 
  Loader2, 
  File, 
  Link, 
  Upload, 
  Trash2, 
  BookOpen, 
  FileText, 
  ShirtIcon,
  Ruler,
  Scissors
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AITrainingDataPage() {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [dataType, setDataType] = useState("fabric");
  const [dataName, setDataName] = useState("");
  const [dataDescription, setDataDescription] = useState("");
  const [url, setUrl] = useState("");
  const [isParsing, setIsParsing] = useState(false);

  // Query for fetching training datasets
  const { data: trainingData, isLoading } = useQuery({
    queryKey: ["/api/ai-training-data"],
    placeholderData: { fabrics: [], patterns: [], measurements: [], products: [] },
  });

  // Mutation for uploading file
  const uploadFileMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await apiRequest(
        "POST", 
        "/api/ai-training-data/upload", 
        undefined, 
        { body: formData }
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Upload Successful",
        description: "Your training data has been uploaded and is being processed",
      });
      setSelectedFile(null);
      setDataName("");
      setDataDescription("");
      setUploadProgress(0);
      queryClient.invalidateQueries({ queryKey: ["/api/ai-training-data"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsUploading(false);
    },
  });

  // Mutation for adding URL source
  const addUrlMutation = useMutation({
    mutationFn: async (data: { url: string; type: string; name: string; description: string }) => {
      const response = await apiRequest("POST", "/api/ai-training-data/url", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "URL Added",
        description: "The website data is being fetched and processed",
      });
      setUrl("");
      setDataName("");
      setDataDescription("");
      queryClient.invalidateQueries({ queryKey: ["/api/ai-training-data"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Add URL",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsParsing(false);
    },
  });

  // Mutation for deleting training data
  const deleteDataMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/ai-training-data/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Data Deleted",
        description: "The training data has been removed",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/ai-training-data"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Deletion Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleFileUpload = () => {
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }

    if (!dataName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide a name for this dataset",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("type", dataType);
    formData.append("name", dataName);
    formData.append("description", dataDescription);

    setIsUploading(true);
    
    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 95) {
          clearInterval(progressInterval);
          return 95;
        }
        return prev + 5;
      });
    }, 300);

    uploadFileMutation.mutate(formData);
  };

  const handleUrlAdd = () => {
    if (!url.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide a valid URL",
        variant: "destructive",
      });
      return;
    }

    if (!dataName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide a name for this dataset",
        variant: "destructive",
      });
      return;
    }

    setIsParsing(true);
    addUrlMutation.mutate({
      url,
      type: dataType,
      name: dataName,
      description: dataDescription,
    });
  };

  const handleDeleteData = (id: number) => {
    deleteDataMutation.mutate(id);
  };

  const dataTypeOptions = [
    { id: "fabric", label: "Fabric Information", icon: <ShirtIcon className="h-4 w-4 mr-2" /> },
    { id: "pattern", label: "Sewing Patterns", icon: <Scissors className="h-4 w-4 mr-2" /> },
    { id: "measurement", label: "Measurements", icon: <Ruler className="h-4 w-4 mr-2" /> },
    { id: "product", label: "Product Designs", icon: <FileText className="h-4 w-4 mr-2" /> },
  ];

  const renderDatasetList = (dataset: any[], dataType: string) => {
    if (!dataset || dataset.length === 0) {
      return (
        <div className="text-center p-4 text-muted-foreground">
          No {dataType} datasets available
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {dataset.map((item) => (
          <Card key={item.id} className="relative group">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-base flex items-center">
                    {item.sourceType === 'file' ? <File className="h-4 w-4 mr-2" /> : <Link className="h-4 w-4 mr-2" />}
                    {item.name}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {new Date(item.createdAt).toLocaleDateString()} · {item.sourceType}
                  </CardDescription>
                </div>
                <div className="flex space-x-1">
                  {item.status === 'processed' && <Badge variant="outline" className="bg-green-50">Processed</Badge>}
                  {item.status === 'processing' && <Badge variant="outline" className="bg-yellow-50">Processing</Badge>}
                  {item.status === 'error' && <Badge variant="outline" className="bg-red-50">Error</Badge>}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pb-2">
              <p className="text-sm">{item.description}</p>
            </CardContent>
            <CardFooter className="pt-0 flex justify-between">
              <div className="text-xs text-muted-foreground">
                {item.sourceType === 'file' ? `File: ${item.fileName}` : `URL: ${item.sourceUrl}`}
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleDeleteData(item.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Training Data Management</h1>
          <p className="text-muted-foreground">
            Upload and manage training data to enhance AI-powered features
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Add Training Data</CardTitle>
              <CardDescription>
                Upload files or provide URLs to train the AI on domain-specific knowledge
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs defaultValue="file">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="file">File Upload</TabsTrigger>
                  <TabsTrigger value="url">Website URL</TabsTrigger>
                </TabsList>
                
                <TabsContent value="file" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="file-upload">Select File</Label>
                    <Input 
                      id="file-upload" 
                      type="file" 
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx,.txt,.csv,.xlsx,.xls,.json,.html,.htm"
                    />
                    <p className="text-xs text-muted-foreground">
                      Supported formats: PDF, DOC, DOCX, TXT, CSV, XLS, XLSX, JSON, HTML
                    </p>
                  </div>
                  
                  {selectedFile && (
                    <div className="p-3 bg-muted rounded-md text-sm">
                      <div className="font-medium">{selectedFile.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                    </div>
                  )}
                  
                  {isUploading && (
                    <div className="space-y-2">
                      <Progress value={uploadProgress} className="h-2" />
                      <p className="text-xs text-center text-muted-foreground">
                        Uploading... {uploadProgress}%
                      </p>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="url" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="url-input">Website URL</Label>
                    <Input 
                      id="url-input" 
                      type="url" 
                      placeholder="https://example.com/resource" 
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      The AI will crawl and extract relevant information from the website
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
              
              <div className="space-y-2">
                <Label>Data Category</Label>
                <RadioGroup value={dataType} onValueChange={setDataType} className="gap-3">
                  {dataTypeOptions.map((option) => (
                    <div key={option.id} className="flex items-center space-x-2">
                      <RadioGroupItem value={option.id} id={`data-type-${option.id}`} />
                      <Label 
                        htmlFor={`data-type-${option.id}`}
                        className="flex items-center cursor-pointer"
                      >
                        {option.icon}
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="data-name">Dataset Name</Label>
                <Input
                  id="data-name"
                  placeholder="E.g., 'Winter Fabrics Guide 2024'"
                  value={dataName}
                  onChange={(e) => setDataName(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="data-description">Description (Optional)</Label>
                <Textarea
                  id="data-description"
                  placeholder="Describe what information this dataset contains..."
                  rows={3}
                  value={dataDescription}
                  onChange={(e) => setDataDescription(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Tabs.Content value="file">
                <Button 
                  className="w-full" 
                  onClick={handleFileUpload} 
                  disabled={!selectedFile || isUploading}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" /> Upload File
                    </>
                  )}
                </Button>
              </Tabs.Content>
              <Tabs.Content value="url">
                <Button 
                  className="w-full" 
                  onClick={handleUrlAdd} 
                  disabled={!url || isParsing}
                >
                  {isParsing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
                    </>
                  ) : (
                    <>
                      <Link className="mr-2 h-4 w-4" /> Add URL
                    </>
                  )}
                </Button>
              </Tabs.Content>
            </CardFooter>
          </Card>
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Training Settings</CardTitle>
              <CardDescription>
                Configure how AI models utilize your training data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-train" className="flex flex-col space-y-1">
                  <span>Auto-Train on New Data</span>
                  <span className="font-normal text-xs text-muted-foreground">
                    Automatically retrain models when new data is added
                  </span>
                </Label>
                <Switch id="auto-train" defaultChecked />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="model-priority">Model Priority</Label>
                <Select defaultValue="balanced">
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="custom">Custom Data Priority</SelectItem>
                    <SelectItem value="balanced">Balanced (Default)</SelectItem>
                    <SelectItem value="general">General Knowledge Priority</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Controls how much weight is given to your custom data vs. general knowledge
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Training Data Library</CardTitle>
              <CardDescription>
                Manage your uploaded datasets and training resources
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs defaultValue="fabrics" className="h-full">
                <div className="px-6 pt-2">
                  <TabsList className="grid grid-cols-4 w-full">
                    <TabsTrigger value="fabrics" className="flex items-center">
                      <Fabric className="h-4 w-4 mr-2" /> Fabrics
                    </TabsTrigger>
                    <TabsTrigger value="patterns" className="flex items-center">
                      <Scissors className="h-4 w-4 mr-2" /> Patterns
                    </TabsTrigger>
                    <TabsTrigger value="measurements" className="flex items-center">
                      <PencilRuler className="h-4 w-4 mr-2" /> Measurements
                    </TabsTrigger>
                    <TabsTrigger value="products" className="flex items-center">
                      <FileText className="h-4 w-4 mr-2" /> Products
                    </TabsTrigger>
                  </TabsList>
                </div>
                
                <ScrollArea className="h-[600px]">
                  <TabsContent value="fabrics" className="p-6 mt-0">
                    {isLoading ? (
                      <div className="flex justify-center items-center h-24">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      renderDatasetList(trainingData?.fabrics || [], "fabric")
                    )}
                  </TabsContent>
                  
                  <TabsContent value="patterns" className="p-6 mt-0">
                    {isLoading ? (
                      <div className="flex justify-center items-center h-24">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      renderDatasetList(trainingData?.patterns || [], "pattern")
                    )}
                  </TabsContent>
                  
                  <TabsContent value="measurements" className="p-6 mt-0">
                    {isLoading ? (
                      <div className="flex justify-center items-center h-24">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      renderDatasetList(trainingData?.measurements || [], "measurement")
                    )}
                  </TabsContent>
                  
                  <TabsContent value="products" className="p-6 mt-0">
                    {isLoading ? (
                      <div className="flex justify-center items-center h-24">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      renderDatasetList(trainingData?.products || [], "product")
                    )}
                  </TabsContent>
                </ScrollArea>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}