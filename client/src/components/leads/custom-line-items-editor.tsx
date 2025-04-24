import { useState, useEffect } from "react";
import { Plus, Trash2, Package2, Shirt, Ruler, Search, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

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

  // Function to add a new empty line item
  const handleAddItem = () => {
    const newItem: LineItem = {
      id: generateUniqueId(),
      name: ""
    };
    setItems([...items, newItem]);
    setCurrentItemId(newItem.id);
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

      {/* Add item button */}
      <Button 
        variant="outline" 
        className="w-full"
        onClick={handleAddItem}
        disabled={disabled}
      >
        <Plus className="mr-2 h-4 w-4" />
        Add Item
      </Button>

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