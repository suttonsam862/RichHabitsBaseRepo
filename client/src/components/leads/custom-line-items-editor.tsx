import { useState, useEffect } from "react";
import { 
  Plus, 
  Trash2, 
  Package2, 
  Shirt, 
  Ruler, 
  Search, 
  Edit, 
  Loader2, 
  Sparkles,
  Check,
  ChevronDown 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

// Define the type for a line item
interface LineItem {
  id: string;
  name: string;
  description?: string;
  fabric?: string;
  fabricId?: string;
  measurement?: string;
  measurementId?: string;
  quantity?: number;
  color?: string;
  productId?: string;
  notes?: string;
}

// Define types for the search results
interface Product {
  id: string;
  name: string;
  description?: string;
  category?: string;
}

interface Fabric {
  id: string;
  name: string;
  description?: string;
  type?: string;
}

interface Measurement {
  id: string;
  name: string;
  description?: string;
  category?: string;
}

interface CustomLineItemsEditorProps {
  value: LineItem[];
  onChange: (items: LineItem[]) => void;
  disabled?: boolean;
}

// Generate a unique ID for new line items
const generateUniqueId = () => `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export default function CustomLineItemsEditor({ 
  value = [], 
  onChange,
  disabled = false
}: CustomLineItemsEditorProps) {
  const { toast } = useToast();
  const [items, setItems] = useState<LineItem[]>(value || []);
  const [currentItemId, setCurrentItemId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState<"product" | "fabric" | "measurement">("product");
  const [isSearching, setIsSearching] = useState(false);

  // Update parent component when items change
  useEffect(() => {
    onChange(items);
  }, [items, onChange]);

  // Update internal state when value from parent changes
  useEffect(() => {
    if (JSON.stringify(value) !== JSON.stringify(items)) {
      setItems(value || []);
    }
  }, [value]);

  // State for product selection dropdown
  const [productPopoverOpen, setProductPopoverOpen] = useState(false);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGeneratingProduct, setIsGeneratingProduct] = useState(false);
  
  // Query products from API
  const { data: products = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ['/api/products'],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/products");
        if (!response.ok) {
          throw new Error("Failed to fetch products");
        }
        const data = await response.json();
        return data.products || [];
      } catch (error) {
        console.error("Error fetching products:", error);
        return [];
      }
    },
  });
  
  // Function to add a new item from product selection
  const handleAddItem = () => {
    setProductPopoverOpen(true);
  };
  
  // Function to add item after product selection
  const handleSelectProduct = (product: Product) => {
    const newItem: LineItem = {
      id: generateUniqueId(),
      name: product.name,
      description: product.description,
      productId: product.id
    };
    setItems([...items, newItem]);
    setCurrentItemId(newItem.id);
    setProductPopoverOpen(false);
  };
  
  // Function to generate a new product with AI
  const handleGenerateProductWithAi = async () => {
    if (!aiPrompt.trim()) {
      toast({
        title: "AI Prompt Required",
        description: "Please enter a description of the product you want to generate.",
        variant: "destructive",
      });
      return;
    }
    
    setIsGeneratingProduct(true);
    
    try {
      const response = await apiRequest("POST", "/api/products/generate", {
        prompt: aiPrompt
      });
      
      if (!response.ok) {
        throw new Error("Failed to generate product with AI");
      }
      
      const data = await response.json();
      
      // Add the generated product to the list
      const newItem: LineItem = {
        id: generateUniqueId(),
        name: data.product.name,
        description: data.product.description,
        fabric: data.product.fabric,
        measurement: data.product.measurement,
        color: data.product.color,
        productId: data.product.id
      };
      
      setItems([...items, newItem]);
      setCurrentItemId(newItem.id);
      
      // Close dialogs
      setAiDialogOpen(false);
      setProductPopoverOpen(false);
      
      // Show success message
      toast({
        title: "Product Generated",
        description: `Created new product: ${data.product.name}`,
      });
      
      // Invalidate products query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      
    } catch (error: any) {
      console.error("AI generation error:", error);
      toast({
        title: "AI Generation Failed",
        description: error.message || "Failed to generate product. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingProduct(false);
      setAiPrompt("");
    }
  };

  // Function to delete a line item
  const handleDeleteItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
    if (currentItemId === id) {
      setCurrentItemId(null);
    }
  };

  // Function to update a line item property
  const handleUpdateItem = (id: string, field: keyof LineItem, value: any) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  // Mock function to search products/fabrics/measurements
  // In a real implementation, this would connect to your API
  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    setIsSearching(true);
    
    try {
      // Simulate searching from catalog
      toast({
        title: "Searching Catalog",
        description: `Looking for ${searchType} matching "${searchTerm}"...`,
      });
      
      // In a real implementation, this would be a call to your API
      // const response = await apiRequest("GET", `/api/catalog/search?type=${searchType}&query=${encodeURIComponent(searchTerm)}`);
      // const results = await response.json();
      
      // For now, we'll just simulate success
      setTimeout(() => {
        toast({
          title: "Search Complete",
          description: "No matching items found. Please enter details manually.",
        });
        setIsSearching(false);
      }, 1000);
      
    } catch (error) {
      console.error("Search error:", error);
      toast({
        title: "Search Error",
        description: "Failed to search catalog. Please try again or enter details manually.",
        variant: "destructive",
      });
      setIsSearching(false);
    }
  };

  // Find the currently selected item
  const currentItem = currentItemId ? items.find(item => item.id === currentItemId) : null;

  return (
    <div className="space-y-4">
      {/* List of existing line items */}
      <div className="space-y-2">
        {items.length > 0 ? (
          items.map(item => (
            <div 
              key={item.id}
              className={`p-3 border rounded-md cursor-pointer flex justify-between items-center ${
                currentItemId === item.id ? 'border-primary bg-primary/5' : 'border-input'
              }`}
              onClick={() => setCurrentItemId(item.id)}
            >
              <div className="flex-1">
                <div className="font-medium">{item.name || "Unnamed Item"}</div>
                <div className="text-sm text-muted-foreground flex flex-wrap gap-2 mt-1">
                  {item.fabric && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Shirt className="h-3 w-3" />
                      {item.fabric}
                    </Badge>
                  )}
                  {item.measurement && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Ruler className="h-3 w-3" />
                      {item.measurement}
                    </Badge>
                  )}
                  {item.quantity && (
                    <span className="text-xs">Qty: {item.quantity}</span>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteItem(item.id);
                }}
                disabled={disabled}
              >
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          ))
        ) : (
          <div className="text-center p-4 border border-dashed rounded-md text-muted-foreground">
            No items added yet. Add your first item below.
          </div>
        )}
      </div>

      {/* Add item button with product selection dropdown */}
      <Popover open={productPopoverOpen} onOpenChange={setProductPopoverOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={handleAddItem}
            disabled={disabled}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="center">
          <Command>
            <CommandInput placeholder="Search products..." />
            <CommandList>
              <CommandEmpty>
                {isLoadingProducts ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <p className="py-3 px-4 text-sm text-center text-muted-foreground">
                    No products found
                  </p>
                )}
              </CommandEmpty>
              
              {/* Generate with AI option */}
              <CommandGroup heading="AI Creation">
                <CommandItem
                  onSelect={() => {
                    setAiDialogOpen(true);
                    setProductPopoverOpen(false);
                  }}
                  className="flex items-center gap-2 py-3 px-4 cursor-pointer hover:bg-primary/5"
                >
                  <Sparkles className="h-4 w-4 text-blue-500" />
                  <span className="font-medium">Generate New Product with AI</span>
                </CommandItem>
              </CommandGroup>
              
              <CommandSeparator />
              
              {/* Existing products list */}
              <CommandGroup heading="Existing Products">
                {Array.isArray(products) && products.length > 0 ? (
                  products.map((product: Product) => (
                    <CommandItem
                      key={product.id}
                      onSelect={() => handleSelectProduct(product)}
                      className="flex items-center gap-2 py-2"
                    >
                      <Package2 className="h-4 w-4 text-muted-foreground" />
                      <div className="flex flex-col">
                        <span>{product.name}</span>
                        {product.description && (
                          <span className="text-xs text-muted-foreground truncate max-w-[220px]">
                            {product.description}
                          </span>
                        )}
                      </div>
                    </CommandItem>
                  ))
                ) : (
                  <p className="py-3 px-4 text-sm text-center text-muted-foreground">
                    {isLoadingProducts 
                      ? "Loading products..." 
                      : "No products available. Create one with AI or manually."}
                  </p>
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      
      {/* AI Product Generation Dialog */}
      <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-500" />
              Generate Product with AI
            </DialogTitle>
            <DialogDescription>
              Describe the product you want to create. The AI will generate detailed specifications and add it to your catalog.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="ai-prompt">Product Description</Label>
              <Textarea
                id="ai-prompt"
                placeholder="E.g., Custom wrestling singlet with school logo, polyester/spandex blend, in red and black colors"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                className="min-h-[100px]"
                disabled={isGeneratingProduct}
              />
              <p className="text-xs text-muted-foreground">
                Include details like item type, materials, colors, and any special features.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setAiDialogOpen(false);
                setAiPrompt("");
              }}
              disabled={isGeneratingProduct}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleGenerateProductWithAi}
              disabled={!aiPrompt.trim() || isGeneratingProduct}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isGeneratingProduct ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Item editor section */}
      {currentItem && (
        <div className="mt-6 border rounded-md p-4 space-y-4">
          <h4 className="font-medium">Edit Item Details</h4>
          
          {/* Item name field */}
          <div className="space-y-2">
            <Label htmlFor="item-name">Item Name</Label>
            <div className="flex gap-2">
              <Input
                id="item-name"
                value={currentItem.name || ""}
                onChange={(e) => handleUpdateItem(currentItem.id, "name", e.target.value)}
                placeholder="Enter item name"
                disabled={disabled}
                className="flex-1"
              />
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => setSearchType("product")}
                disabled={disabled || isSearching}
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Item description field */}
          <div className="space-y-2">
            <Label htmlFor="item-desc">Description</Label>
            <Textarea
              id="item-desc"
              value={currentItem.description || ""}
              onChange={(e) => handleUpdateItem(currentItem.id, "description", e.target.value)}
              placeholder="Enter item description"
              disabled={disabled}
            />
          </div>

          {/* Fabric field */}
          <div className="space-y-2">
            <Label htmlFor="item-fabric">Fabric</Label>
            <div className="flex gap-2">
              <Input
                id="item-fabric"
                value={currentItem.fabric || ""}
                onChange={(e) => handleUpdateItem(currentItem.id, "fabric", e.target.value)}
                placeholder="Enter fabric type"
                disabled={disabled}
                className="flex-1"
              />
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => setSearchType("fabric")}
                disabled={disabled || isSearching}
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Measurement field */}
          <div className="space-y-2">
            <Label htmlFor="item-measurement">Measurement Chart</Label>
            <div className="flex gap-2">
              <Input
                id="item-measurement"
                value={currentItem.measurement || ""}
                onChange={(e) => handleUpdateItem(currentItem.id, "measurement", e.target.value)}
                placeholder="Enter measurement chart"
                disabled={disabled}
                className="flex-1"
              />
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => setSearchType("measurement")}
                disabled={disabled || isSearching}
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Quantity field */}
          <div className="space-y-2">
            <Label htmlFor="item-quantity">Quantity</Label>
            <Input
              id="item-quantity"
              type="number"
              min="1"
              value={currentItem.quantity || ""}
              onChange={(e) => handleUpdateItem(currentItem.id, "quantity", parseInt(e.target.value) || "")}
              placeholder="Enter quantity"
              disabled={disabled}
            />
          </div>

          {/* Color field */}
          <div className="space-y-2">
            <Label htmlFor="item-color">Primary Color</Label>
            <Input
              id="item-color"
              value={currentItem.color || ""}
              onChange={(e) => handleUpdateItem(currentItem.id, "color", e.target.value)}
              placeholder="Enter primary color"
              disabled={disabled}
            />
          </div>

          {/* Additional notes */}
          <div className="space-y-2">
            <Label htmlFor="item-notes">Additional Notes</Label>
            <Textarea
              id="item-notes"
              value={currentItem.notes || ""}
              onChange={(e) => handleUpdateItem(currentItem.id, "notes", e.target.value)}
              placeholder="Enter any additional notes"
              disabled={disabled}
            />
          </div>
        </div>
      )}

      {/* Search dialog (simplified for now) */}
      {isSearching && (
        <div className="p-4 border rounded-md bg-muted/30 mt-4">
          <div className="flex items-center gap-2">
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`Search for ${searchType}...`}
              className="flex-1"
              disabled={disabled}
            />
            <Button onClick={handleSearch} disabled={disabled || !searchTerm.trim()}>
              Search
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Search to find existing {searchType}s in the catalog
          </p>
        </div>
      )}
    </div>
  );
}