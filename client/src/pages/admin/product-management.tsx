import { FC, useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import Layout from "@/components/layout";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Edit,
  FileSpreadsheet,
  Loader2,
  Plus,
  PlusCircle,
  Search,
  ShoppingBag,
  Trash,
  Upload,
  ImagePlus,
  X,
  Camera,
  Ruler,
  Grid,
  AlignJustify,
  Scissors,
  Pencil,
  ArrowRight,
  MoreHorizontal,
  RefreshCw,
  Archive,
  CheckCircle,
  AlertTriangle,
  ClipboardList,
  Tags,
  Package,
  Layers,
  Settings,
  Copy,
  PackageCheck,
  Palette,
  MessageSquare,
  Tag,
  Shirt,
} from "lucide-react";
import { CSVImportDialog } from "@/components/products/csv-import-dialog";
import {
  Product,
  FabricOption,
  FabricCut,
  CustomizationOption,
  insertProductSchema,
  insertFabricOptionSchema,
  insertFabricCutSchema,
  insertCustomizationOptionSchema,
} from "@shared/schema";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUpload } from "@/components/ui/file-upload";
import { MultipleImageUpload } from "@/components/ui/multiple-image-upload";
import { MeasurementGrid, type MeasurementGridItem } from "@/components/ui/measurement-grid";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const sportOptions = [
  "All",
  "Football",
  "Baseball",
  "Basketball",
  "Soccer",
  "Volleyball",
  "Lacrosse",
  "Hockey",
  "Rugby",
  "Track",
  "Wrestling",
  "Cheerleading",
  "Other",
];

const categoryOptions = [
  "All",
  "Jersey",
  "Pants",
  "Shorts",
  "Jacket",
  "Shirt",
  "Sweatshirt",
  "Hat",
  "Socks",
  "Accessories",
  "Other",
];

const genderOptions = ["All", "Men", "Women", "Unisex", "Youth"];

// Utility function to generate a random SKU
const generateRandomSku = (category?: string, sport?: string): string => {
  // Create prefix from category or default to "PROD"
  const categoryPrefix = category && category !== "All" 
    ? category.substring(0, 4).toUpperCase() 
    : "PROD";
  
  // Add sport code if available (first 2 letters)
  const sportCode = sport && sport !== "All"
    ? `-${sport.substring(0, 2).toUpperCase()}`
    : "";
  
  // Generate random 3-digit number
  const randomNum = Math.floor(Math.random() * 900) + 100;
  
  // Combine parts to create SKU
  return `${categoryPrefix}${sportCode}-${randomNum}`;
};

// Product Form
const productFormSchema = insertProductSchema.extend({
  price: z.string().min(1, "Price is required"),
  id: z.number().optional(),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

interface ProductFormProps {
  defaultValues?: Partial<ProductFormValues>;
  onSubmit: (values: ProductFormValues) => void;
  isSubmitting: boolean;
}

const ProductForm: FC<ProductFormProps> = ({
  defaultValues,
  onSubmit,
  isSubmitting,
}) => {
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: defaultValues || {
      name: "",
      sku: "",
      description: "",
      sport: "",
      category: "",
      gender: "",
      item: "",  // Add missing required field from schema
      fabricOptions: "", // Add missing required field from schema
      cogs: "", // Add missing required field from schema
      wholesalePrice: "", // Add missing required field from schema
      imageUrl: "",
      productImages: [],
      measurementGrid: [],
      fabricDetails: {},
      price: "",
      minOrder: 1,
      leadTime: 14,
      isActive: true,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product Name</FormLabel>
                <FormControl>
                  <Input placeholder="Team Jersey" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sku"
            render={({ field }) => (
              <FormItem>
                <FormLabel>SKU</FormLabel>
                <div className="flex gap-2">
                  <FormControl>
                    <Input placeholder="JERSY-001" {...field} />
                  </FormControl>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    className="flex items-center gap-1" 
                    onClick={() => {
                      // Generate a random SKU based on the selected category and sport
                      const category = form.getValues("category");
                      const sport = form.getValues("sport");
                      const newSku = generateRandomSku(category, sport);
                      field.onChange(newSku);
                    }}
                  >
                    <RefreshCw className="h-4 w-4" />
                    Generate
                  </Button>
                </div>
                <FormDescription>
                  Click "Generate" to create a unique SKU automatically
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Product description"
                  className="min-h-32"
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <FormField
            control={form.control}
            name="sport"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sport</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value ?? ""}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select sport" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {sportOptions.map((sport) => (
                      <SelectItem key={sport} value={sport}>
                        {sport}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value ?? ""}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categoryOptions.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gender</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value ?? ""}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {genderOptions.map((gender) => (
                      <SelectItem key={gender} value={gender}>
                        {gender}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        {/* Additional required fields */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="item"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Item Type</FormLabel>
                <FormControl>
                  <Input placeholder="Jersey" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="fabricOptions"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fabric Options</FormLabel>
                <FormControl>
                  <Input placeholder="Cotton, Polyester, Blend" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="cogs"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cost of Goods Sold</FormLabel>
                <FormControl>
                  <Input placeholder="12.99" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="wholesalePrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Wholesale Price</FormLabel>
                <FormControl>
                  <Input placeholder="19.99" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Base Price ($)</FormLabel>
                <FormControl>
                  <Input type="text" placeholder="29.99" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="minOrder"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Minimum Order</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    {...field}
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : '')}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="leadTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lead Time (days)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    {...field}
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : '')}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Main Product Image</FormLabel>
              <FormControl>
                <FileUpload
                  value={field.value || ""}
                  onChange={field.onChange}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormDescription>
                Upload the main product image
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="productImages"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Additional Product Images</FormLabel>
              <FormControl>
                <MultipleImageUpload
                  value={Array.isArray(field.value) ? 
                    field.value.filter(item => typeof item === 'string') as string[] : 
                    undefined}
                  onChange={field.onChange}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormDescription>
                Upload additional product images (up to 5)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="measurementGrid"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Measurement Grid</FormLabel>
              <FormControl>
                <MeasurementGrid
                  value={Array.isArray(field.value) ? field.value.filter(item => typeof item === 'object') : []}
                  onChange={field.onChange}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormDescription>
                Add size and measurement information
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {defaultValues?.id ? "Update Product" : "Add Product"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
};

// Fabric Option Form
const fabricOptionFormSchema = insertFabricOptionSchema.extend({
  id: z.number().optional(),
});
type FabricOptionFormValues = z.infer<typeof fabricOptionFormSchema>;

interface FabricOptionFormProps {
  defaultValues?: Partial<FabricOptionFormValues>;
  onSubmit: (values: FabricOptionFormValues) => void;
  isSubmitting: boolean;
}

const FabricOptionForm: FC<FabricOptionFormProps> = ({
  defaultValues,
  onSubmit,
  isSubmitting,
}) => {
  const form = useForm<FabricOptionFormValues>({
    resolver: zodResolver(fabricOptionFormSchema),
    defaultValues: defaultValues || {
      name: "",
      description: "",
      materialType: "",
      weight: "",
      colors: [],
      imageUrl: "",
      isActive: true,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fabric Name</FormLabel>
                <FormControl>
                  <Input placeholder="Premium Polyester" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="materialType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Material Type</FormLabel>
                <FormControl>
                  <Input placeholder="100% Polyester" {...field} value={field.value ?? ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Fabric description"
                  className="min-h-32"
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="weight"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Weight</FormLabel>
                <FormControl>
                  <Input placeholder="160 gsm" {...field} value={field.value ?? ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />


        </div>

        <FormField
          control={form.control}
          name="colors"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Available Colors (comma separated)</FormLabel>
              <FormControl>
                <Input
                  placeholder="Red, Blue, Green"
                  value={field.value?.join(", ") || ""}
                  onChange={(e) => {
                    const colors = e.target.value
                      .split(",")
                      .map((c) => c.trim())
                      .filter(Boolean);
                    field.onChange(colors);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fabric Swatch Image</FormLabel>
              <FormControl>
                <FileUpload
                  value={field.value || ""}
                  onChange={field.onChange}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormDescription>
                Upload a swatch image of the fabric
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {defaultValues?.id ? "Update Fabric" : "Add Fabric"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
};

// Fabric Cut Form
const fabricCutFormSchema = insertFabricCutSchema.extend({
  pdfUrl: z.string().optional(),
  id: z.number().optional(),
});
type FabricCutFormValues = z.infer<typeof fabricCutFormSchema>;

interface FabricCutFormProps {
  defaultValues?: Partial<FabricCutFormValues>;
  onSubmit: (values: FabricCutFormValues) => void;
  isSubmitting: boolean;
}

const FabricCutForm: FC<FabricCutFormProps> = ({
  defaultValues,
  onSubmit,
  isSubmitting,
}) => {
  const form = useForm<FabricCutFormValues>({
    resolver: zodResolver(fabricCutFormSchema),
    defaultValues: defaultValues || {
      name: "",
      description: "",
      imageUrl: "",
      isActive: true,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cutting Pattern Title</FormLabel>
              <FormControl>
                <Input placeholder="Standard Jersey Pattern" {...field} value={field.value ?? ''} />
              </FormControl>
              <FormDescription>
                Enter a descriptive name for this cutting pattern
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Detailed description of the cutting pattern"
                  className="min-h-32"
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>PDF Cutting Pattern</FormLabel>
              <FormControl>
                <FileUpload
                  value={field.value || ""}
                  onChange={field.onChange}
                  disabled={isSubmitting}
                  accept=".pdf"
                />
              </FormControl>
              <FormDescription>
                Upload a PDF file with the detailed cutting pattern (max 20MB)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {defaultValues?.id ? "Update Cut" : "Add Cut"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
};

// Product Management Page
const ProductManagementPage: FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("products");
  const [addProductOpen, setAddProductOpen] = useState(false);
  const [editProductOpen, setEditProductOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSport, setFilterSport] = useState("All");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterGender, setFilterGender] = useState("All");
  const [importOpen, setImportOpen] = useState(false);
  const [csvImportOpen, setCsvImportOpen] = useState(false);
  const [clearAllProductsDialog, setClearAllProductsDialog] = useState(false);
  
  // Fabric options dialog state
  const [addFabricOptionOpen, setAddFabricOptionOpen] = useState(false);
  const [addFabricOpen, setAddFabricOpen] = useState(false);
  const [editFabricOptionOpen, setEditFabricOptionOpen] = useState(false);
  const [editFabricOpen, setEditFabricOpen] = useState(false);
  const [selectedFabricOption, setSelectedFabricOption] = useState<FabricOption | null>(null);
  const [selectedFabric, setSelectedFabric] = useState<FabricOption | null>(null);

  // Fabric cuts dialog state
  const [addCutOpen, setAddCutOpen] = useState(false);
  const [editCutOpen, setEditCutOpen] = useState(false);
  const [selectedCut, setSelectedCut] = useState<FabricCut | null>(null);
  
  // Products Query
  const {
    data: products = [],
    isLoading: isLoadingProducts,
  } = useQuery<Product[]>({
    queryKey: ['/api/products'],
    select: (data: any) => data?.data || [],
  });

  // Fabric Options Query
  const {
    data: fabricOptions = [],
    isLoading: isLoadingFabrics,
  } = useQuery<FabricOption[]>({
    queryKey: ['/api/fabric-options'],
    select: (data: any) => data?.data || [],
  });

  // Fabric Cuts Query
  const {
    data: fabricCuts = [],
    isLoading: isLoadingCuts,
  } = useQuery<FabricCut[]>({
    queryKey: ['/api/fabric-cuts'],
    select: (data: any) => data?.data || [],
  });

  // Product Mutations
  const createProductMutation = useMutation({
    mutationFn: async (data: ProductFormValues) => {
      const res = await apiRequest('POST', '/api/products', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      setAddProductOpen(false);
      toast({
        title: "Product created",
        description: "The product has been added to the catalog.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to create product",
        description: error.message || "An error occurred. Please try again.",
      });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async (data: ProductFormValues & { id: number }) => {
      const { id, ...productData } = data;
      const res = await apiRequest('PUT', `/api/products/${id}`, productData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      setEditProductOpen(false);
      setSelectedProduct(null);
      toast({
        title: "Product updated",
        description: "The product has been updated successfully.",
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

  const deleteProductMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/products/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      toast({
        title: "Product deleted",
        description: "The product has been removed from the catalog.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to delete product",
        description: error.message || "An error occurred. Please try again.",
      });
    },
  });

  // Fabric Option Mutations
  const createFabricMutation = useMutation({
    mutationFn: async (data: FabricOptionFormValues) => {
      const res = await apiRequest('POST', '/api/fabric-options', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/fabric-options'] });
      setAddFabricOpen(false);
      toast({
        title: "Fabric option created",
        description: "The fabric option has been added successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to create fabric option",
        description: error.message || "An error occurred. Please try again.",
      });
    },
  });

  const updateFabricMutation = useMutation({
    mutationFn: async (data: FabricOptionFormValues & { id: number }) => {
      const { id, ...fabricData } = data;
      const res = await apiRequest('PUT', `/api/fabric-options/${id}`, fabricData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/fabric-options'] });
      setEditFabricOpen(false);
      setSelectedFabric(null);
      toast({
        title: "Fabric option updated",
        description: "The fabric option has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to update fabric option",
        description: error.message || "An error occurred. Please try again.",
      });
    },
  });

  const deleteFabricMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/fabric-options/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/fabric-options'] });
      toast({
        title: "Fabric option deleted",
        description: "The fabric option has been removed.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to delete fabric option",
        description: error.message || "An error occurred. Please try again.",
      });
    },
  });

  // Clear all products mutation
  const clearAllProductsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/data/clear-all-products');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/fabric-options'] });
      queryClient.invalidateQueries({ queryKey: ['/api/fabric-cuts'] });
      setClearAllProductsDialog(false);
      toast({
        title: "Products cleared",
        description: "All products, fabric options, and cutting patterns have been deleted.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to clear products",
        description: error.message || "An error occurred. Please try again.",
      });
    },
  });

  // Fabric Cut Mutations
  const createCutMutation = useMutation({
    mutationFn: async (data: FabricCutFormValues) => {
      const res = await apiRequest('POST', '/api/fabric-cuts', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/fabric-cuts'] });
      setAddCutOpen(false);
      toast({
        title: "Fabric cut created",
        description: "The fabric cut has been added successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to create fabric cut",
        description: error.message || "An error occurred. Please try again.",
      });
    },
  });

  const updateCutMutation = useMutation({
    mutationFn: async (data: FabricCutFormValues & { id: number }) => {
      const { id, ...cutData } = data;
      const res = await apiRequest('PUT', `/api/fabric-cuts/${id}`, cutData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/fabric-cuts'] });
      setEditCutOpen(false);
      setSelectedCut(null);
      toast({
        title: "Fabric cut updated",
        description: "The fabric cut has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to update fabric cut",
        description: error.message || "An error occurred. Please try again.",
      });
    },
  });

  const deleteCutMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/fabric-cuts/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/fabric-cuts'] });
      toast({
        title: "Fabric cut deleted",
        description: "The fabric cut has been removed.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to delete fabric cut",
        description: error.message || "An error occurred. Please try again.",
      });
    },
  });

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setEditProductOpen(true);
  };

  const handleEditFabricOption = (fabric: FabricOption) => {
    setSelectedFabric(fabric);
    setEditFabricOpen(true);
  };

  const handleEditFabricCut = (cut: FabricCut) => {
    setSelectedCut(cut);
    setEditCutOpen(true);
  };

  const handleDeleteProduct = (id: number) => {
    if (confirm("Are you sure you want to delete this product?")) {
      deleteProductMutation.mutate(id);
    }
  };

  const handleDeleteFabricOption = (id: number) => {
    if (confirm("Are you sure you want to delete this fabric option?")) {
      deleteFabricMutation.mutate(id);
    }
  };

  const handleDeleteFabricCut = (id: number) => {
    if (confirm("Are you sure you want to delete this fabric cut?")) {
      deleteCutMutation.mutate(id);
    }
  };

  return (
      <div className="container px-4 py-6 mx-auto max-w-7xl">
        <div className="flex flex-col">
          <h1 className="text-3xl font-bold tracking-tight">
            Product Management
          </h1>
          <p className="mt-2 text-muted-foreground">
            Manage your products, fabric options, and cutting patterns
          </p>

          <Tabs
            defaultValue="products"
            value={activeTab}
            onValueChange={setActiveTab}
            className="mt-6"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="products">Products</TabsTrigger>
              <TabsTrigger value="fabrics">Fabric Options</TabsTrigger>
              <TabsTrigger value="cuts">Cutting Patterns</TabsTrigger>
            </TabsList>

            {/* Products Tab */}
            <TabsContent value="products" className="mt-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Product Catalog</h2>
                <div className="flex space-x-2">
                  <Dialog open={clearAllProductsDialog} onOpenChange={setClearAllProductsDialog}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-200 hover:bg-red-50 gap-1"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Clear All
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle className="text-red-600">Clear All Products</DialogTitle>
                        <DialogDescription>
                          This action will delete ALL products, fabric options, and cutting patterns.
                          This cannot be undone. Are you sure you want to proceed?
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter className="flex items-center justify-end space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => setClearAllProductsDialog(false)}
                        >
                          Cancel
                        </Button>
                        <Button 
                          variant="destructive"
                          onClick={() => clearAllProductsMutation.mutate()}
                          disabled={clearAllProductsMutation.isPending}
                        >
                          {clearAllProductsMutation.isPending ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Clearing...
                            </>
                          ) : (
                            "Yes, Delete Everything"
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                
                  <Button 
                    variant="outline" 
                    className="gap-1"
                    onClick={() => setCsvImportOpen(true)}
                  >
                    <FileSpreadsheet className="w-4 h-4" /> Import CSV
                  </Button>
                  <Dialog open={addProductOpen} onOpenChange={setAddProductOpen}>
                    <DialogTrigger asChild>
                      <Button className="gap-1">
                        <Plus className="w-4 h-4" /> Add Product
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl max-h-[calc(100vh-64px)] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Add New Product</DialogTitle>
                        <DialogDescription>
                          Add a new product to your catalog. Fill out the details below.
                        </DialogDescription>
                      </DialogHeader>
                      <ProductForm
                        onSubmit={(values) => createProductMutation.mutate(values as any)}
                        isSubmitting={createProductMutation.isPending}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
              
              {/* CSV Import Dialog */}
              <CSVImportDialog 
                open={csvImportOpen} 
                onOpenChange={setCsvImportOpen} 
              />

              {isLoadingProducts ? (
                <div className="p-12 text-center">
                  <Loader2 className="mx-auto w-8 h-8 animate-spin text-primary" />
                  <p className="mt-2">Loading products...</p>
                </div>
              ) : products.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 border rounded-lg">
                  <ShoppingBag className="w-16 h-16 text-muted-foreground" />
                  <h3 className="mt-4 text-xl font-medium">No products yet</h3>
                  <p className="mt-2 text-center text-muted-foreground">
                    You haven't added any products to your catalog yet.
                  </p>
                  <Button
                    onClick={() => setAddProductOpen(true)}
                    className="mt-4 gap-1"
                  >
                    <PlusCircle className="w-4 h-4" /> Add First Product
                  </Button>
                </div>
              ) : (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead>Sport</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">
                            {product.name}
                          </TableCell>
                          <TableCell>{product.sku}</TableCell>
                          <TableCell>{product.sport}</TableCell>
                          <TableCell>{product.category}</TableCell>
                          <TableCell>${product.price}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleEditProduct(product)}
                                >
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDeleteProduct(product.id)}
                                  className="text-red-600"
                                >
                                  <Trash className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Edit Product Dialog */}
              <Dialog open={editProductOpen} onOpenChange={setEditProductOpen}>
                <DialogContent className="max-w-4xl max-h-[calc(100vh-64px)] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Edit Product</DialogTitle>
                    <DialogDescription>
                      Update the details of this product with advanced fabric specifications and images.
                    </DialogDescription>
                  </DialogHeader>
                  {selectedProduct && (
                    <ProductForm
                      defaultValues={{
                        id: selectedProduct.id,
                        name: selectedProduct.name,
                        sku: selectedProduct.sku,
                        description: selectedProduct.description,
                        sport: selectedProduct.sport,
                        category: selectedProduct.category,
                        gender: selectedProduct.gender,
                        imageUrl: selectedProduct.imageUrl,
                        price: selectedProduct.price ? selectedProduct.price.toString() : '',
                        minOrder: selectedProduct.minOrder,
                        leadTime: selectedProduct.leadTime,
                        isActive: selectedProduct.isActive,
                        fabricDetails: selectedProduct.fabricDetails || null,
                        measurementGrid: selectedProduct.measurementGrid || null,
                        productImages: selectedProduct.productImages || [],
                      }}
                      onSubmit={(values) =>
                        updateProductMutation.mutate({
                          ...values,
                          id: selectedProduct.id,
                        } as any)
                      }
                      isSubmitting={updateProductMutation.isPending}
                    />
                  )}
                </DialogContent>
              </Dialog>
            </TabsContent>

            {/* Fabrics Tab */}
            <TabsContent value="fabrics" className="mt-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Fabric Options</h2>
                <Dialog open={addFabricOpen} onOpenChange={setAddFabricOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-1">
                      <Plus className="w-4 h-4" /> Add Fabric
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl max-h-[calc(100vh-64px)] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Add New Fabric Option</DialogTitle>
                      <DialogDescription>
                        Add a new fabric option for your products.
                      </DialogDescription>
                    </DialogHeader>
                    <FabricOptionForm
                      onSubmit={(values) => createFabricMutation.mutate(values as any)}
                      isSubmitting={createFabricMutation.isPending}
                    />
                  </DialogContent>
                </Dialog>
              </div>

              {isLoadingFabrics ? (
                <div className="p-12 text-center">
                  <Loader2 className="mx-auto w-8 h-8 animate-spin text-primary" />
                  <p className="mt-2">Loading fabric options...</p>
                </div>
              ) : fabricOptions.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 border rounded-lg">
                  <h3 className="mt-4 text-xl font-medium">No fabric options yet</h3>
                  <p className="mt-2 text-center text-muted-foreground">
                    You haven't added any fabric options yet.
                  </p>
                  <Button
                    onClick={() => setAddFabricOpen(true)}
                    className="mt-4 gap-1"
                  >
                    <PlusCircle className="w-4 h-4" /> Add First Fabric Option
                  </Button>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {fabricOptions.map((fabric) => (
                    <Card key={fabric.id} className="overflow-hidden">
                      <div className="relative h-48 bg-gray-100">
                        {fabric.imageUrl ? (
                          <img
                            src={fabric.imageUrl}
                            alt={fabric.name}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <div className="flex items-center justify-center w-full h-full">
                            <div className="text-muted-foreground">No image</div>
                          </div>
                        )}
                        {fabric.priceModifier && parseFloat(fabric.priceModifier) > 0 && (
                          <Badge className="absolute top-2 right-2 bg-primary">
                            +${parseFloat(fabric.priceModifier).toFixed(2)}
                          </Badge>
                        )}
                      </div>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle>{fabric.name}</CardTitle>
                            <CardDescription className="mt-1">
                              {fabric.materialType}
                            </CardDescription>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleEditFabricOption(fabric)}
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteFabricOption(fabric.id)}
                                className="text-red-600"
                              >
                                <Trash className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {fabric.description}
                        </p>
                        <div className="mt-2">
                          <span className="text-sm font-medium">Weight:</span>{" "}
                          <span className="text-sm">{fabric.weight}</span>
                        </div>
                        {fabric.colors && fabric.colors.length > 0 && (
                          <div className="mt-2">
                            <span className="text-sm font-medium">Colors:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {fabric.colors.map((color, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {color}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Edit Fabric Dialog */}
              <Dialog open={editFabricOpen} onOpenChange={setEditFabricOpen}>
                <DialogContent className="max-w-3xl max-h-[calc(100vh-64px)] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Edit Fabric Option</DialogTitle>
                    <DialogDescription>
                      Update the details of this fabric option.
                    </DialogDescription>
                  </DialogHeader>
                  {selectedFabric && (
                    <FabricOptionForm
                      defaultValues={{
                        id: selectedFabric.id,
                        name: selectedFabric.name,
                        description: selectedFabric.description,
                        materialType: selectedFabric.materialType,
                        weight: selectedFabric.weight,
                        colors: selectedFabric.colors,
                        priceModifier: selectedFabric.priceModifier,
                        imageUrl: selectedFabric.imageUrl,
                        isActive: selectedFabric.isActive,
                      }}
                      onSubmit={(values) =>
                        updateFabricMutation.mutate({
                          ...values,
                          id: selectedFabric.id,
                        } as any)
                      }
                      isSubmitting={updateFabricMutation.isPending}
                    />
                  )}
                </DialogContent>
              </Dialog>
            </TabsContent>

            {/* Cuts Tab */}
            <TabsContent value="cuts" className="mt-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Cutting Patterns</h2>
                <Dialog open={addCutOpen} onOpenChange={setAddCutOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-1">
                      <Plus className="w-4 h-4" /> Add Cut
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl max-h-[calc(100vh-64px)] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Add New Cutting Pattern</DialogTitle>
                      <DialogDescription>
                        Add a new cutting pattern for your products.
                      </DialogDescription>
                    </DialogHeader>
                    <FabricCutForm
                      onSubmit={(values) => createCutMutation.mutate(values as any)}
                      isSubmitting={createCutMutation.isPending}
                    />
                  </DialogContent>
                </Dialog>
              </div>

              {isLoadingCuts ? (
                <div className="p-12 text-center">
                  <Loader2 className="mx-auto w-8 h-8 animate-spin text-primary" />
                  <p className="mt-2">Loading cutting patterns...</p>
                </div>
              ) : fabricCuts.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 border rounded-lg">
                  <h3 className="mt-4 text-xl font-medium">No cutting patterns yet</h3>
                  <p className="mt-2 text-center text-muted-foreground">
                    You haven't added any cutting patterns yet.
                  </p>
                  <Button
                    onClick={() => setAddCutOpen(true)}
                    className="mt-4 gap-1"
                  >
                    <PlusCircle className="w-4 h-4" /> Add First Cutting Pattern
                  </Button>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {fabricCuts.map((cut) => (
                    <Card key={cut.id} className="overflow-hidden">
                      <div className="relative h-48 bg-gray-100">
                        {cut.imageUrl ? (
                          <img
                            src={cut.imageUrl}
                            alt={cut.name}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <div className="flex items-center justify-center w-full h-full">
                            <div className="text-muted-foreground">No image</div>
                          </div>
                        )}
                        {cut.priceModifier && parseFloat(cut.priceModifier) > 0 && (
                          <Badge className="absolute top-2 right-2 bg-primary">
                            +${parseFloat(cut.priceModifier).toFixed(2)}
                          </Badge>
                        )}
                      </div>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle>{cut.name}</CardTitle>
                            <CardDescription className="mt-1">
                              {cut.applicationMethod}
                            </CardDescription>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleEditFabricCut(cut)}
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteFabricCut(cut.id)}
                                className="text-red-600"
                              >
                                <Trash className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {cut.description}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Edit Cut Dialog */}
              <Dialog open={editCutOpen} onOpenChange={setEditCutOpen}>
                <DialogContent className="max-w-3xl max-h-[calc(100vh-64px)] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Edit Cutting Pattern</DialogTitle>
                    <DialogDescription>
                      Update the details of this cutting pattern.
                    </DialogDescription>
                  </DialogHeader>
                  {selectedCut && (
                    <FabricCutForm
                      defaultValues={{
                        id: selectedCut.id,
                        name: selectedCut.name,
                        description: selectedCut.description,
                        applicationMethod: selectedCut.applicationMethod,
                        priceModifier: selectedCut.priceModifier,
                        imageUrl: selectedCut.imageUrl,
                        isActive: selectedCut.isActive,
                      }}
                      onSubmit={(values) =>
                        updateCutMutation.mutate({
                          ...values,
                          id: selectedCut.id,
                        } as any)
                      }
                      isSubmitting={updateCutMutation.isPending}
                    />
                  )}
                </DialogContent>
              </Dialog>
            </TabsContent>
          </Tabs>
        </div>
      </div>
  );
};



export default ProductManagementPage;