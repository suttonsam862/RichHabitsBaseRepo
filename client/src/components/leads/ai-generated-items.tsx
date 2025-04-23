import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Check, 
  Edit, 
  File, 
  FileText, 
  RefreshCw, 
  Trash2, 
  PlusCircle, 
  Shirt,
  Scissors
} from "lucide-react";

// Interface for an item extracted by AI
export interface ParsedItem {
  itemName: string;
  category: string;
  designDetails: string;
  fabricType: string;
  colorDisplay: string;
  colorHex: string;
  yardagePerUnit: number;
  measurements: {
    [size: string]: {
      [measurement: string]: number;
    };
  };
  requiresReview?: boolean;
  alternativeItems?: string[];
  productCode?: string;
  primaryColor?: string;
  secondaryColor?: string;
  expectedQuantity?: number;
  priceEstimate?: number;
}

interface AiGeneratedItemsProps {
  items: ParsedItem[];
  onChange?: (items: ParsedItem[]) => void;
  onSave?: (items: ParsedItem[]) => void;
}

export default function AiGeneratedItems({ 
  items, 
  onChange,
  onSave 
}: AiGeneratedItemsProps) {
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editedItem, setEditedItem] = useState<ParsedItem | null>(null);
  const [activeTab, setActiveTab] = useState("0");

  // Handle editing an item
  const handleEdit = (index: number) => {
    setEditIndex(index);
    setEditedItem({ ...items[index] });
  };

  // Handle saving an edited item
  const handleSave = (index: number) => {
    if (!editedItem) return;
    
    const updatedItems = [...items];
    updatedItems[index] = editedItem;
    
    // Call the onChange callback with the updated items
    if (onChange) {
      onChange(updatedItems);
    }
    
    setEditIndex(null);
    setEditedItem(null);
  };

  // Handle saving all items
  const handleSaveAll = () => {
    if (onSave) {
      onSave(items);
    }
  };

  // Handle deleting an item
  const handleDelete = (index: number) => {
    const updatedItems = [...items];
    updatedItems.splice(index, 1);
    
    // Call the onChange callback with the updated items
    if (onChange) {
      onChange(updatedItems);
    }
  };

  // Handle updating an edited item field
  const handleFieldChange = (field: keyof ParsedItem, value: any) => {
    if (!editedItem) return;
    
    setEditedItem({
      ...editedItem,
      [field]: value
    });
  };

  // Handle adding a new empty item
  const handleAddItem = () => {
    const newItem: ParsedItem = {
      itemName: "New Item",
      category: "generic",
      designDetails: "",
      fabricType: "To be specified",
      colorDisplay: "Gray",
      colorHex: "#cccccc",
      yardagePerUnit: 1.0,
      expectedQuantity: 1,
      measurements: {
        small: { height: 20, width: 20 },
        medium: { height: 22, width: 22 },
        large: { height: 24, width: 24 }
      },
      requiresReview: true,
      priceEstimate: 25.00
    };
    
    // Call the onChange callback with the updated items
    if (onChange) {
      onChange([...items, newItem]);
    }
    
    // Switch to the new item tab
    setActiveTab(String(items.length));
  };

  // Handle measurement update
  const handleMeasurementChange = (size: string, measurement: string, value: string) => {
    if (!editedItem) return;

    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;

    const updatedMeasurements = {
      ...editedItem.measurements,
      [size]: {
        ...editedItem.measurements[size],
        [measurement]: numValue
      }
    };

    setEditedItem({
      ...editedItem,
      measurements: updatedMeasurements
    });
  };

  // Get the appropriate color for measurements based on category
  const getMeasurementFields = (category: string) => {
    const measurementSchemas: {[key: string]: string[]} = {
      pants: ["outseam", "waist", "inseam", "rise", "hip"],
      shorts: ["outseam", "waist", "hip"],
      shirt: ["bodyLength", "chest", "shoulder", "sleeve"],
      hoodie: ["bodyLength", "chest", "shoulder", "sleeve"],
      jacket: ["bodyLength", "chest", "shoulder", "sleeve"],
      singlet: ["bodyLength", "chest", "shoulder"],
      generic: ["height", "width"]
    };

    return measurementSchemas[category] || measurementSchemas.generic;
  };

  // Render function for the item form
  const renderItemForm = (item: ParsedItem) => {
    const measurementFields = getMeasurementFields(item.category);
    const sizes = Object.keys(item.measurements);

    return (
      <div className="space-y-4 p-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Item Name</label>
            <Input 
              value={item.itemName} 
              onChange={(e) => handleFieldChange('itemName', e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Category</label>
            <Select 
              value={item.category}
              onValueChange={(value) => handleFieldChange('category', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pants">Pants</SelectItem>
                <SelectItem value="shorts">Shorts</SelectItem>
                <SelectItem value="shirt">Shirt</SelectItem>
                <SelectItem value="hoodie">Hoodie</SelectItem>
                <SelectItem value="jacket">Jacket</SelectItem>
                <SelectItem value="singlet">Singlet</SelectItem>
                <SelectItem value="generic">Other / Generic</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Fabric Type</label>
            <Input 
              value={item.fabricType} 
              onChange={(e) => handleFieldChange('fabricType', e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Quantity</label>
            <Input 
              type="number"
              value={item.expectedQuantity || 1} 
              onChange={(e) => handleFieldChange('expectedQuantity', parseInt(e.target.value))}
              min={1}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Primary Color</label>
            <div className="flex gap-2">
              <Input 
                value={item.colorDisplay} 
                onChange={(e) => handleFieldChange('colorDisplay', e.target.value)}
              />
              <Input 
                type="color"
                value={item.colorHex} 
                onChange={(e) => handleFieldChange('colorHex', e.target.value)}
                className="w-12 h-9 p-1"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Yardage Per Unit</label>
            <Input 
              type="number"
              value={item.yardagePerUnit} 
              onChange={(e) => handleFieldChange('yardagePerUnit', parseFloat(e.target.value))}
              step={0.1}
              min={0.1}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Price Estimate</label>
            <Input 
              type="number"
              value={item.priceEstimate || 0} 
              onChange={(e) => handleFieldChange('priceEstimate', parseFloat(e.target.value))}
              step={0.01}
              min={0}
              prefix="$"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Design Details</label>
          <Textarea 
            value={item.designDetails} 
            onChange={(e) => handleFieldChange('designDetails', e.target.value)}
            rows={3}
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Measurements</label>
          <div className="border rounded-md">
            <ScrollArea className="h-[300px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Measurement</TableHead>
                    {sizes.map((size) => (
                      <TableHead key={size} className="capitalize">{size}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {measurementFields.map((field) => (
                    <TableRow key={field}>
                      <TableCell className="font-medium capitalize">
                        {field.replace(/([A-Z])/g, ' $1').trim()}
                      </TableCell>
                      {sizes.map((size) => (
                        <TableCell key={`${size}-${field}`}>
                          <Input 
                            type="number"
                            value={item.measurements[size]?.[field] || 0}
                            onChange={(e) => handleMeasurementChange(size, field, e.target.value)}
                            className="w-20"
                            step={0.5}
                          />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        </div>
      </div>
    );
  };

  // Render function for the read-only view of an item
  const renderItemView = (item: ParsedItem) => {
    const measurementFields = getMeasurementFields(item.category);
    const sizes = Object.keys(item.measurements);

    return (
      <div className="space-y-4 p-2">
        <div className="flex justify-between items-center">
          <div className="flex gap-2 items-center">
            <Shirt className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">{item.itemName}</h3>
          </div>
          <Badge className="capitalize">{item.category}</Badge>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p><span className="font-medium">Fabric Type:</span> {item.fabricType}</p>
            <p>
              <span className="font-medium">Color:</span> {item.colorDisplay}
              <span className="inline-block h-3 w-3 rounded-full ml-1" style={{ backgroundColor: item.colorHex }}></span>
            </p>
            <p><span className="font-medium">Yardage Per Unit:</span> {item.yardagePerUnit.toFixed(1)}</p>
          </div>
          
          <div>
            <p><span className="font-medium">Quantity:</span> {item.expectedQuantity || 1}</p>
            <p><span className="font-medium">Price Estimate:</span> ${item.priceEstimate?.toFixed(2) || "0.00"}</p>
            <p><span className="font-medium">Total Yardage:</span> {((item.yardagePerUnit || 0) * (item.expectedQuantity || 1)).toFixed(1)}</p>
          </div>
        </div>
        
        <div className="text-sm">
          <p className="font-medium">Design Details:</p>
          <p className="bg-gray-50 p-2 rounded-md">{item.designDetails || "No design details specified"}</p>
        </div>
        
        <div className="space-y-2">
          <p className="font-medium text-sm">Measurements:</p>
          <div className="border rounded-md">
            <ScrollArea className="h-[200px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Measurement</TableHead>
                    {sizes.map((size) => (
                      <TableHead key={size} className="capitalize">{size}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {measurementFields.map((field) => (
                    <TableRow key={field}>
                      <TableCell className="font-medium capitalize">
                        {field.replace(/([A-Z])/g, ' $1').trim()}
                      </TableCell>
                      {sizes.map((size) => (
                        <TableCell key={`${size}-${field}`}>
                          {item.measurements[size]?.[field] || 0}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        </div>
      </div>
    );
  };

  // If no items are available, show empty state
  if (!items || items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              AI Generated Items
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <File className="h-10 w-10 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">No items have been generated yet.</p>
            <Button 
              variant="outline" 
              className="mt-2"
              onClick={handleAddItem}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Item Manually
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2 border-b">
        <div className="flex justify-between items-center">
          <CardTitle>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              AI Generated Items ({items.length})
            </div>
          </CardTitle>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleAddItem}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Item
            </Button>
            {onSave && (
              <Button size="sm" onClick={handleSaveAll}>
                <Check className="h-4 w-4 mr-2" />
                Save All
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex mb-4 w-full overflow-x-auto">
            {items.map((item, index) => (
              <TabsTrigger key={index} value={String(index)} className="flex-shrink-0">
                <div className="flex items-center gap-2">
                  <Scissors className="h-4 w-4" />
                  <span className="truncate max-w-[120px]">{item.itemName}</span>
                </div>
              </TabsTrigger>
            ))}
          </TabsList>
          
          {items.map((item, index) => (
            <TabsContent key={index} value={String(index)} className="mt-0">
              <Card>
                <CardHeader className="py-2 px-4 bg-gray-50">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Shirt className="h-4 w-4 text-primary" />
                      <span className="font-medium">{item.itemName}</span>
                    </div>
                    <div className="flex gap-2">
                      {editIndex === index ? (
                        <>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => {
                              setEditIndex(null);
                              setEditedItem(null);
                            }}
                          >
                            Cancel
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => handleSave(index)}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Save
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleDelete(index)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                          <Button 
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(index)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {editIndex === index && editedItem
                    ? renderItemForm(editedItem)
                    : renderItemView(item)
                  }
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}