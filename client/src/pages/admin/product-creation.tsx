import { FC, useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileUpload } from "@/components/ui/file-upload";
import { MultipleImageUpload } from "@/components/ui/multiple-image-upload";
import { MeasurementGrid, type MeasurementGridItem } from "@/components/ui/measurement-grid";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Product } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, XCircle, Info, Camera, Ruler, ImagePlus, Search, Filter, Pencil, RefreshCw, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ProductTask {
  id: number;
  completed: boolean;
  mainImage: boolean;
  additionalImages: boolean;
  measurements: boolean;
}

const ProductCreationPage: FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sportFilter, setSportFilter] = useState("all");
  const [productTasks, setProductTasks] = useState<ProductTask[]>([]);
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [productImages, setProductImages] = useState<string[]>([]);
  const [mainImage, setMainImage] = useState("");
  const [measurementGrid, setMeasurementGrid] = useState<MeasurementGridItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch products query
  const {
    data: products = [],
    isLoading,
    isError,
  } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    select: (data: any) => data?.data || [],
  });

  // Get incomplete products - those with missing images or measurements
  const incompleteProducts = products.filter(p => 
    !p.imageUrl || 
    !p.productImages || 
    !p.measurementGrid
  );

  // Calculate completion status
  const calculateCompletionStatus = (product: Product): number => {
    let completedSteps = 0;
    let totalSteps = 3; // Main image, additional images, measurements
    
    if (product.imageUrl) completedSteps++;
    if (product.productImages && Array.isArray(product.productImages) && product.productImages.length > 0) completedSteps++;
    if (product.measurementGrid && Array.isArray(product.measurementGrid) && product.measurementGrid.length > 0) completedSteps++;
    
    return Math.floor((completedSteps / totalSteps) * 100);
  };

  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: async (data: any) => {
      const { id, ...productData } = data;
      const res = await apiRequest("PUT", `/api/products/${id}`, productData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setEditDialogOpen(false);
      setActiveProduct(null);
      toast({
        title: "Product updated",
        description: "The product details have been saved successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to update product",
        description: error.message || "An error occurred. Please try again.",
      });
    },
  });

  // Filter products based on search and filters
  const filteredProducts = incompleteProducts.filter(product => {
    const matchesSearch = searchTerm === "" || 
      product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === "all" || categoryFilter === "" || product.category === categoryFilter;
    const matchesSport = sportFilter === "all" || sportFilter === "" || product.sport === sportFilter;
    
    return matchesSearch && matchesCategory && matchesSport;
  });

  // Get unique categories and sports for filters
  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];
  const sports = [...new Set(products.map(p => p.sport).filter(Boolean))];

  // Handle dialog open - prepare editing state
  const handleEditProduct = (product: Product) => {
    setActiveProduct(product);
    setMainImage(product.imageUrl || "");
    setProductImages(Array.isArray(product.productImages) ? product.productImages : []);
    setMeasurementGrid(Array.isArray(product.measurementGrid) ? product.measurementGrid : []);
    setEditDialogOpen(true);
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!activeProduct) return;
    
    setIsSubmitting(true);
    
    try {
      await updateProductMutation.mutateAsync({
        id: activeProduct.id,
        imageUrl: mainImage,
        productImages: productImages,
        measurementGrid: measurementGrid
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout user={user}>
      <div className="container px-4 py-6 mx-auto max-w-7xl">
        <div className="flex flex-col space-y-4">
          <h1 className="text-3xl font-bold tracking-tight">
            Product Creation Checklist
          </h1>
          <p className="text-muted-foreground">
            Complete missing product details by adding photos and measurements
          </p>

          {/* Filter and search bar */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 gap-2">
              <div className="relative flex-1">
                <Search className="absolute w-4 h-4 text-muted-foreground left-3 top-3" />
                <Input
                  placeholder="Search by product name or SKU..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category || "unknown"}>
                      {category || "Uncategorized"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sportFilter} onValueChange={setSportFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sport" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sports</SelectItem>
                  {sports.map((sport) => (
                    <SelectItem key={sport} value={sport || "unknown"}>
                      {sport || "Uncategorized"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={() => {
                setSearchTerm("");
                setCategoryFilter("all");
                setSportFilter("all");
              }}
            >
              <RefreshCw className="w-4 h-4" /> Clear Filters
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : isError ? (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                Failed to load products. Please try refreshing the page.
              </AlertDescription>
            </Alert>
          ) : filteredProducts.length === 0 ? (
            <Alert>
              <Info className="w-4 h-4" />
              <AlertTitle>No incomplete products found</AlertTitle>
              <AlertDescription>
                {searchTerm || (categoryFilter !== "all") || (sportFilter !== "all")
                  ? "Try adjusting your search or filters."
                  : "All products have complete information."}
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredProducts.map((product) => {
                const completionStatus = calculateCompletionStatus(product);
                return (
                  <Card key={product.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between">
                        <Badge variant={product.isActive ? "default" : "secondary"}>
                          {product.sport || "Uncategorized"}
                        </Badge>
                        <Badge variant="outline">{product.sku}</Badge>
                      </div>
                      <CardTitle className="mt-2">{product.name}</CardTitle>
                      <CardDescription>{product.category}</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">Completion Status</span>
                            <span className="text-sm text-right">{completionStatus}%</span>
                          </div>
                          <Progress value={completionStatus} className="h-2" />
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            {product.imageUrl ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-500" />
                            )}
                            <span className="text-sm">Main Product Image</span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {product.productImages && Array.isArray(product.productImages) && product.productImages.length > 0 ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-500" />
                            )}
                            <span className="text-sm">Additional Images</span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {product.measurementGrid && Array.isArray(product.measurementGrid) && product.measurementGrid.length > 0 ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-500" />
                            )}
                            <span className="text-sm">Measurement Grid</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        className="w-full gap-2" 
                        variant="outline"
                        onClick={() => handleEditProduct(product)}
                      >
                        <Pencil className="w-4 h-4" /> Edit Product Details
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Edit Product Dialog */}
      {activeProduct && (
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Product Details: {activeProduct.name}</DialogTitle>
              <DialogDescription>
                Complete the missing information for {activeProduct.sku || "this product"}.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 space-y-6">
              <Tabs defaultValue="images" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="images">Images</TabsTrigger>
                  <TabsTrigger value="measurements">Measurements</TabsTrigger>
                </TabsList>

                <TabsContent value="images" className="space-y-6 pt-4">
                  <div className="space-y-4">
                    <div>
                      <h3 className="mb-2 text-lg font-medium">Main Product Image</h3>
                      <FileUpload
                        value={mainImage}
                        onChange={setMainImage}
                        disabled={isSubmitting}
                      />
                    </div>

                    <div>
                      <h3 className="mb-2 text-lg font-medium">Additional Product Images</h3>
                      <MultipleImageUpload
                        value={productImages}
                        onChange={setProductImages}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="measurements" className="space-y-6 pt-4">
                  <div>
                    <h3 className="mb-2 text-lg font-medium">Measurement Grid</h3>
                    <p className="mb-4 text-sm text-muted-foreground">
                      Add sizes and measurements for this product. Include all relevant dimensions.
                    </p>
                    <MeasurementGrid
                      value={measurementGrid}
                      onChange={setMeasurementGrid}
                      disabled={isSubmitting}
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Layout>
  );
};

export default ProductCreationPage;