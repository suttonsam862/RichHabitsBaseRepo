import { useState } from "react";
import { useCampDocuments } from "@/hooks/use-camps";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertDocumentSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabTrigger, TabContent } from "@/components/ui/tabs";
import { Loader2, PlusCircle, FileIcon, Search, FolderIcon, Download, Eye, File, FilePen, FileSpreadsheet, FileText } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";

// Extend schema for client-side validation
const documentFormSchema = insertDocumentSchema.extend({});

type DocumentFormValues = z.infer<typeof documentFormSchema>;

interface CampDocumentsProps {
  campId: number;
}

export default function CampDocuments({ campId }: CampDocumentsProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const { data: documents, isLoading, error } = useCampDocuments(campId);
  const { toast } = useToast();

  const form = useForm<DocumentFormValues>({
    resolver: zodResolver(documentFormSchema),
    defaultValues: {
      campId,
      title: "",
      description: "",
      fileUrl: "",
      fileType: "",
      category: "general",
      uploadedBy: 1, // Default to user ID 1
      isPublic: false,
    },
  });

  const onSubmit = async (values: DocumentFormValues) => {
    try {
      await apiRequest("POST", `/api/camps/${campId}/documents`, values);
      toast({
        title: "Success",
        description: "Document added successfully",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/camps/${campId}/documents`] });
      setIsAddDialogOpen(false);
      form.reset();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add document",
        variant: "destructive",
      });
    }
  };

  // Get unique categories
  const uniqueCategories = [...new Set(documents?.map(doc => doc.category) || [])];

  // Filter documents by search query and category
  const filteredDocuments = documents?.filter(doc => {
    // Filter by search query
    if (searchQuery) {
      const title = doc.title.toLowerCase();
      const description = doc.description?.toLowerCase() || "";
      const fileType = doc.fileType?.toLowerCase() || "";
      const query = searchQuery.toLowerCase();
      
      return title.includes(query) || description.includes(query) || fileType.includes(query);
    }
    
    // Filter by category
    if (activeCategory !== "all") {
      return doc.category === activeCategory;
    }
    
    return true;
  });

  // Count documents by type
  const totalDocuments = documents?.length || 0;
  const pdfCount = documents?.filter(doc => doc.fileType === "pdf").length || 0;
  const docCount = documents?.filter(doc => doc.fileType === "doc" || doc.fileType === "docx").length || 0;
  const xlsCount = documents?.filter(doc => doc.fileType === "xls" || doc.fileType === "xlsx").length || 0;
  const otherCount = totalDocuments - pdfCount - docCount - xlsCount;

  // Get document icon based on file type
  const getDocumentIcon = (fileType: string | null) => {
    if (!fileType) return <File className="h-10 w-10 text-blue-500" />;
    
    switch (fileType.toLowerCase()) {
      case 'pdf':
        return <FilePen className="h-10 w-10 text-red-500" />;
      case 'doc':
      case 'docx':
        return <FileText className="h-10 w-10 text-blue-500" />;
      case 'xls':
      case 'xlsx':
        return <FileSpreadsheet className="h-10 w-10 text-green-500" />;
      default:
        return <File className="h-10 w-10 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <h3 className="text-lg font-medium text-red-600">Error loading documents</h3>
          <p className="mt-2 text-muted-foreground">
            {error instanceof Error ? error.message : "An unknown error occurred"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Document Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border rounded-lg p-4 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Documents</p>
              <h3 className="text-2xl font-bold mt-1">{totalDocuments}</h3>
            </div>
            <div className="bg-primary-50 p-2 rounded-md">
              <FolderIcon className="h-5 w-5 text-primary" />
            </div>
          </div>
        </div>
        
        <div className="bg-card border rounded-lg p-4 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground">PDFs</p>
              <h3 className="text-2xl font-bold mt-1">{pdfCount}</h3>
            </div>
            <div className="bg-red-50 p-2 rounded-md">
              <FilePen className="h-5 w-5 text-red-500" />
            </div>
          </div>
        </div>
        
        <div className="bg-card border rounded-lg p-4 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Word Documents</p>
              <h3 className="text-2xl font-bold mt-1">{docCount}</h3>
            </div>
            <div className="bg-blue-50 p-2 rounded-md">
              <FileText className="h-5 w-5 text-blue-500" />
            </div>
          </div>
        </div>
        
        <div className="bg-card border rounded-lg p-4 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Spreadsheets</p>
              <h3 className="text-2xl font-bold mt-1">{xlsCount}</h3>
            </div>
            <div className="bg-green-50 p-2 rounded-md">
              <FileSpreadsheet className="h-5 w-5 text-green-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Document Browser */}
      <Card>
        <div className="bg-white px-4 py-5 border-b sm:px-6 rounded-t-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900">Document Vault</h3>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Store and manage camp documents, forms, and resources.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search documents..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button 
              className="flex items-center gap-2"
              onClick={() => setIsAddDialogOpen(true)}
            >
              <PlusCircle className="h-4 w-4" />
              Add Document
            </Button>
          </div>
        </div>
        <CardContent className="p-0">
          {/* Category Tabs */}
          <Tabs defaultValue="all" className="w-full">
            <div className="border-b px-4">
              <TabsList className="gap-4">
                <TabTrigger 
                  value="all" 
                  onClick={() => setActiveCategory("all")}
                >
                  All Documents
                </TabTrigger>
                {uniqueCategories.map(category => (
                  <TabTrigger 
                    key={category} 
                    value={category}
                    onClick={() => setActiveCategory(category)}
                  >
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </TabTrigger>
                ))}
              </TabsList>
            </div>

            <TabContent value={activeCategory} className="p-4">
              {filteredDocuments && filteredDocuments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredDocuments.map((document) => (
                    <div key={document.id} className="border rounded-lg p-4 hover:border-primary transition-colors">
                      <div className="flex items-start space-x-4">
                        {getDocumentIcon(document.fileType)}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 truncate">{document.title}</h4>
                          {document.description && (
                            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{document.description}</p>
                          )}
                          <div className="mt-2 flex items-center text-xs text-muted-foreground">
                            <span className="capitalize">{document.fileType || "Unknown"}</span>
                            <span className="mx-1">•</span>
                            <span>Uploaded {format(new Date(document.uploadedAt), "MMM d, yyyy")}</span>
                          </div>
                          <div className="mt-1">
                            <span
                              className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                document.isPublic
                                  ? "bg-green-100 text-green-800"
                                  : "bg-orange-100 text-orange-800"
                              }`}
                            >
                              {document.isPublic ? "Public" : "Private"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 flex space-x-2 justify-end">
                        <Button size="sm" variant="outline" className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          <span>View</span>
                        </Button>
                        <Button size="sm" variant="outline" className="flex items-center gap-1">
                          <Download className="h-3 w-3" />
                          <span>Download</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileIcon className="mx-auto h-12 w-12 text-muted-foreground/60" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No documents found</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {searchQuery 
                      ? "No documents match your search query." 
                      : activeCategory !== "all"
                      ? `No documents in the ${activeCategory} category.`
                      : "Get started by uploading your first document."}
                  </p>
                  <div className="mt-6">
                    <Button 
                      onClick={() => setIsAddDialogOpen(true)}
                      className="flex items-center gap-2 mx-auto"
                    >
                      <PlusCircle className="h-4 w-4" />
                      Add Document
                    </Button>
                  </div>
                </div>
              )}
            </TabContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Add Document Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Document</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Document Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Camp Waiver Form" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Brief description of the document"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="general">General</SelectItem>
                          <SelectItem value="waiver">Waiver</SelectItem>
                          <SelectItem value="schedule">Schedule</SelectItem>
                          <SelectItem value="map">Map</SelectItem>
                          <SelectItem value="instruction">Instruction</SelectItem>
                          <SelectItem value="policy">Policy</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fileType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>File Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select file type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pdf">PDF</SelectItem>
                          <SelectItem value="doc">DOC</SelectItem>
                          <SelectItem value="docx">DOCX</SelectItem>
                          <SelectItem value="xls">XLS</SelectItem>
                          <SelectItem value="xlsx">XLSX</SelectItem>
                          <SelectItem value="txt">TXT</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="fileUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>File URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/document.pdf" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isPublic"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Public Document
                      </FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Make this document visible to all participants
                      </p>
                    </div>
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Add Document
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
