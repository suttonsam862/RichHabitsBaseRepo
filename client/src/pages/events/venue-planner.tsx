import React, { useState, useRef, useEffect } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronLeft,
  Save,
  Trash2,
  Plus,
  Move,
  Square,
  Circle,
  Type,
  Edit2,
  Image,
  Undo2,
  Redo2,
  Download,
  Upload,
  ArrowDown,
  Loader2,
  ListChecks,
  Users,
  Table,
  MonitorSmartphone,
  MessageSquare,
  Search,
  CheckCircle2,
  XCircle,
  CopyPlus
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDate, formatCurrency } from "@/lib/utils";

// Canvas element types
type ElementType = 'rectangle' | 'circle' | 'text' | 'image' | 'mat' | 'table' | 'chair' | 'booth';

interface CanvasElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  color: string;
  label?: string;
  quantity?: number;
  notes?: string;
  category?: string;
  zIndex: number;
}

// Equipment item interface
interface EquipmentItem {
  id: number;
  name: string;
  type: string;
  quantity: number;
  isChecked: boolean;
  notes?: string;
  responsible?: string;
}

// Vendor request interface
interface VendorRequest {
  id: number;
  name: string;
  type: string;
  details: string;
  status: 'pending' | 'approved' | 'denied' | 'booked';
  cost?: number;
  contactInfo?: string;
  dueDate?: string;
}

function VenuePlanner() {
  const [location, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const campId = searchParams.get('id');
  const { toast } = useToast();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState("layout");
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [equipmentItems, setEquipmentItems] = useState<EquipmentItem[]>([]);
  const [vendorRequests, setVendorRequests] = useState<VendorRequest[]>([]);
  const [isAddingElement, setIsAddingElement] = useState(false);
  const [newElementType, setNewElementType] = useState<ElementType>('rectangle');
  const [dragInfo, setDragInfo] = useState<{ isDragging: boolean, startX: number, startY: number, elementId: string | null }>({
    isDragging: false,
    startX: 0,
    startY: 0,
    elementId: null
  });
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [editLabelValue, setEditLabelValue] = useState("");
  const [canvasScale, setCanvasScale] = useState(1);
  const [showGrid, setShowGrid] = useState(true);
  const [isAddingEquipment, setIsAddingEquipment] = useState(false);
  const [newEquipment, setNewEquipment] = useState<Partial<EquipmentItem>>({
    name: '',
    type: 'Mat',
    quantity: 1,
    isChecked: false
  });
  const [isAddingVendor, setIsAddingVendor] = useState(false);
  const [newVendor, setNewVendor] = useState<Partial<VendorRequest>>({
    name: '',
    type: 'AV Equipment',
    details: '',
    status: 'pending'
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  
  // Fetch camp details
  const {
    data: camp,
    isLoading: isLoadingCamp,
    isError: isCampError
  } = useQuery({
    queryKey: ['/api/camps', campId],
    enabled: !!campId,
  });
  
  // Fetch venue layout data
  const {
    data: layoutData,
    isLoading: isLoadingLayout
  } = useQuery({
    queryKey: ['/api/camps', campId, 'venue-layout'],
    enabled: !!campId,
    onSuccess: (data) => {
      if (data?.elements) {
        setElements(data.elements);
      }
    }
  });
  
  // Fetch equipment list
  const {
    data: equipmentData,
    isLoading: isLoadingEquipment
  } = useQuery({
    queryKey: ['/api/camps', campId, 'equipment'],
    enabled: !!campId,
    onSuccess: (data) => {
      if (data?.items) {
        setEquipmentItems(data.items);
      }
    }
  });
  
  // Fetch vendor requests
  const {
    data: vendorData,
    isLoading: isLoadingVendors
  } = useQuery({
    queryKey: ['/api/camps', campId, 'vendors'],
    enabled: !!campId,
    onSuccess: (data) => {
      if (data?.requests) {
        setVendorRequests(data.requests);
      }
    }
  });
  
  // Save venue layout mutation
  const saveLayoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(
        "POST",
        `/api/camps/${campId}/venue-layout`,
        { elements }
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Layout saved",
        description: "Venue layout has been saved successfully."
      });
      queryClient.invalidateQueries({
        queryKey: ['/api/camps', campId, 'venue-layout']
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Save failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Save equipment list mutation
  const saveEquipmentMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(
        "POST",
        `/api/camps/${campId}/equipment`,
        { items: equipmentItems }
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Equipment list saved",
        description: "Equipment list has been saved successfully."
      });
      queryClient.invalidateQueries({
        queryKey: ['/api/camps', campId, 'equipment']
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Save failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Save vendor requests mutation
  const saveVendorsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(
        "POST",
        `/api/camps/${campId}/vendors`,
        { requests: vendorRequests }
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Vendor requests saved",
        description: "Vendor requests have been saved successfully."
      });
      queryClient.invalidateQueries({
        queryKey: ['/api/camps', campId, 'vendors']
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Save failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Back to camp page
  const handleBackToCamp = () => {
    window.location.href = `/events/camp-project?id=${campId}`;
  };
  
  // Generate a unique element ID
  const generateElementId = (): string => {
    return 'element_' + Date.now().toString();
  };
  
  // Add a new element to the canvas
  const handleAddElement = (type: ElementType) => {
    setNewElementType(type);
    setIsAddingElement(true);
  };
  
  // Handle canvas click to add new element
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isAddingElement || !canvasRef.current) return;
    
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - canvasRect.left) / canvasScale;
    const y = (e.clientY - canvasRect.top) / canvasScale;
    
    // Default sizes based on element type
    let width = 100;
    let height = 100;
    let label = '';
    let color = '#6b7280';
    
    switch (newElementType) {
      case 'rectangle':
        width = 120;
        height = 80;
        color = '#e5e7eb';
        break;
      case 'circle':
        width = 80;
        height = 80;
        color = '#e5e7eb';
        break;
      case 'text':
        width = 100;
        height = 30;
        label = 'Text Label';
        color = '#000000';
        break;
      case 'mat':
        width = 200;
        height = 200;
        label = 'Wrestling Mat';
        color = '#3b82f6';
        break;
      case 'table':
        width = 80;
        height = 120;
        label = 'Table';
        color = '#a1a1aa';
        break;
      case 'chair':
        width = 40;
        height = 40;
        label = 'Chair';
        color = '#a1a1aa';
        break;
      case 'booth':
        width = 100;
        height = 100;
        label = 'Booth';
        color = '#a855f7';
        break;
    }
    
    const newElement: CanvasElement = {
      id: generateElementId(),
      type: newElementType,
      x,
      y,
      width,
      height,
      rotation: 0,
      color,
      label,
      zIndex: elements.length + 1
    };
    
    setElements([...elements, newElement]);
    setSelectedElementId(newElement.id);
    setIsAddingElement(false);
  };
  
  // Handle mouse down on element for dragging
  const handleElementMouseDown = (e: React.MouseEvent<HTMLDivElement>, elementId: string) => {
    e.stopPropagation();
    setSelectedElementId(elementId);
    setDragInfo({
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      elementId: elementId
    });
  };
  
  // Handle mouse move for dragging elements
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!dragInfo.isDragging || !canvasRef.current) return;
    
    const dx = (e.clientX - dragInfo.startX) / canvasScale;
    const dy = (e.clientY - dragInfo.startY) / canvasScale;
    
    setElements(elements.map(el => {
      if (el.id === dragInfo.elementId) {
        return {
          ...el,
          x: el.x + dx,
          y: el.y + dy
        };
      }
      return el;
    }));
    
    setDragInfo({
      ...dragInfo,
      startX: e.clientX,
      startY: e.clientY
    });
  };
  
  // Handle mouse up to stop dragging
  const handleMouseUp = () => {
    setDragInfo({
      isDragging: false,
      startX: 0,
      startY: 0,
      elementId: null
    });
  };
  
  // Edit element label
  const handleEditLabel = () => {
    const element = elements.find(el => el.id === selectedElementId);
    if (element) {
      setEditLabelValue(element.label || '');
      setIsEditingLabel(true);
    }
  };
  
  // Save edited label
  const handleSaveLabel = () => {
    setElements(elements.map(el => {
      if (el.id === selectedElementId) {
        return {
          ...el,
          label: editLabelValue
        };
      }
      return el;
    }));
    setIsEditingLabel(false);
  };
  
  // Delete selected element
  const handleDeleteElement = () => {
    setElements(elements.filter(el => el.id !== selectedElementId));
    setSelectedElementId(null);
  };
  
  // Rotate selected element
  const handleRotateElement = (amount: number) => {
    setElements(elements.map(el => {
      if (el.id === selectedElementId) {
        return {
          ...el,
          rotation: (el.rotation + amount) % 360
        };
      }
      return el;
    }));
  };
  
  // Change element color
  const handleChangeColor = (color: string) => {
    setElements(elements.map(el => {
      if (el.id === selectedElementId) {
        return {
          ...el,
          color: color
        };
      }
      return el;
    }));
  };
  
  // Resize selected element
  const handleResizeElement = (widthChange: number, heightChange: number) => {
    setElements(elements.map(el => {
      if (el.id === selectedElementId) {
        return {
          ...el,
          width: Math.max(20, el.width + widthChange),
          height: Math.max(20, el.height + heightChange)
        };
      }
      return el;
    }));
  };
  
  // Change z-index of element (bring forward/backward)
  const handleChangeZIndex = (change: number) => {
    const element = elements.find(el => el.id === selectedElementId);
    if (!element) return;
    
    setElements(elements.map(el => {
      if (el.id === selectedElementId) {
        return {
          ...el,
          zIndex: el.zIndex + change
        };
      }
      return el;
    }).sort((a, b) => a.zIndex - b.zIndex));
  };
  
  // Save the current layout
  const handleSaveLayout = () => {
    saveLayoutMutation.mutate();
  };
  
  // Export layout as JSON
  const handleExportLayout = () => {
    const dataStr = JSON.stringify(elements);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const fileName = `venue_layout_camp_${campId}_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', fileName);
    linkElement.click();
  };
  
  // Import layout from JSON file
  const handleImportLayout = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (Array.isArray(json)) {
          setElements(json);
          toast({
            title: "Layout imported",
            description: "Venue layout has been imported successfully."
          });
        }
      } catch (error) {
        toast({
          title: "Import failed",
          description: "The file format is not valid.",
          variant: "destructive"
        });
      }
    };
    reader.readAsText(file);
  };
  
  // Add new equipment item
  const handleAddEquipment = () => {
    if (!newEquipment.name || newEquipment.name.trim() === '') {
      toast({
        title: "Missing information",
        description: "Please enter a name for the equipment item.",
        variant: "destructive"
      });
      return;
    }
    
    const newItem: EquipmentItem = {
      id: Date.now(),
      name: newEquipment.name,
      type: newEquipment.type || 'Other',
      quantity: newEquipment.quantity || 1,
      isChecked: false,
      notes: newEquipment.notes
    };
    
    setEquipmentItems([...equipmentItems, newItem]);
    setNewEquipment({
      name: '',
      type: 'Mat',
      quantity: 1
    });
    setIsAddingEquipment(false);
    
    // Auto-save equipment list
    setTimeout(() => {
      saveEquipmentMutation.mutate();
    }, 500);
  };
  
  // Toggle equipment checked status
  const handleToggleEquipment = (id: number, checked: boolean) => {
    const updatedItems = equipmentItems.map(item => {
      if (item.id === id) {
        return { ...item, isChecked: checked };
      }
      return item;
    });
    
    setEquipmentItems(updatedItems);
    
    // Auto-save equipment list
    setTimeout(() => {
      saveEquipmentMutation.mutate();
    }, 500);
  };
  
  // Delete equipment item
  const handleDeleteEquipment = (id: number) => {
    setEquipmentItems(equipmentItems.filter(item => item.id !== id));
    
    // Auto-save equipment list
    setTimeout(() => {
      saveEquipmentMutation.mutate();
    }, 500);
  };
  
  // Add new vendor request
  const handleAddVendor = () => {
    if (!newVendor.name || newVendor.name.trim() === '' || !newVendor.details) {
      toast({
        title: "Missing information",
        description: "Please enter name and details for the vendor request.",
        variant: "destructive"
      });
      return;
    }
    
    const newRequest: VendorRequest = {
      id: Date.now(),
      name: newVendor.name,
      type: newVendor.type || 'Other',
      details: newVendor.details || '',
      status: newVendor.status as 'pending' | 'approved' | 'denied' | 'booked' || 'pending',
      cost: newVendor.cost,
      contactInfo: newVendor.contactInfo,
      dueDate: newVendor.dueDate
    };
    
    setVendorRequests([...vendorRequests, newRequest]);
    setNewVendor({
      name: '',
      type: 'AV Equipment',
      details: '',
      status: 'pending'
    });
    setIsAddingVendor(false);
    
    // Auto-save vendor requests
    setTimeout(() => {
      saveVendorsMutation.mutate();
    }, 500);
  };
  
  // Update vendor request status
  const handleVendorStatusChange = (id: number, status: 'pending' | 'approved' | 'denied' | 'booked') => {
    const updatedRequests = vendorRequests.map(request => {
      if (request.id === id) {
        return { ...request, status };
      }
      return request;
    });
    
    setVendorRequests(updatedRequests);
    
    // Auto-save vendor requests
    setTimeout(() => {
      saveVendorsMutation.mutate();
    }, 500);
  };
  
  // Delete vendor request
  const handleDeleteVendor = (id: number) => {
    setVendorRequests(vendorRequests.filter(request => request.id !== id));
    
    // Auto-save vendor requests
    setTimeout(() => {
      saveVendorsMutation.mutate();
    }, 500);
  };
  
  // Render a canvas element
  const renderElement = (element: CanvasElement) => {
    const isSelected = element.id === selectedElementId;
    const style: React.CSSProperties = {
      position: 'absolute',
      left: `${element.x}px`,
      top: `${element.y}px`,
      width: `${element.width}px`,
      height: `${element.height}px`,
      transform: `rotate(${element.rotation}deg)`,
      backgroundColor: element.color,
      border: isSelected ? '2px dashed #000' : 'none',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      cursor: 'move',
      zIndex: element.zIndex,
      overflow: 'hidden',
      userSelect: 'none'
    };
    
    let content;
    
    switch (element.type) {
      case 'rectangle':
        style.borderRadius = '4px';
        content = element.label && (
          <span className="text-xs whitespace-nowrap overflow-hidden text-ellipsis px-1">{element.label}</span>
        );
        break;
      case 'circle':
        style.borderRadius = '50%';
        content = element.label && (
          <span className="text-xs whitespace-nowrap overflow-hidden text-ellipsis px-1">{element.label}</span>
        );
        break;
      case 'text':
        style.backgroundColor = 'transparent';
        style.color = element.color;
        content = (
          <span className="text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis px-1">{element.label}</span>
        );
        break;
      case 'mat':
        style.borderRadius = '8px';
        content = (
          <div className="flex flex-col items-center justify-center">
            <span className="text-xs font-medium text-white whitespace-nowrap overflow-hidden text-ellipsis px-1">{element.label}</span>
          </div>
        );
        break;
      case 'table':
        style.borderRadius = '4px';
        content = (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-xs font-medium text-white whitespace-nowrap overflow-hidden text-ellipsis px-1">{element.label}</span>
          </div>
        );
        break;
      case 'chair':
        style.borderRadius = '30% 30% 4px 4px';
        break;
      case 'booth':
        style.borderRadius = '4px';
        content = (
          <div className="flex flex-col items-center justify-center">
            <span className="text-xs font-medium text-white whitespace-nowrap overflow-hidden text-ellipsis px-1">{element.label}</span>
          </div>
        );
        break;
    }
    
    return (
      <div
        key={element.id}
        style={style}
        onMouseDown={(e) => handleElementMouseDown(e, element.id)}
      >
        {content}
      </div>
    );
  };
  
  // Loading state
  if (isLoadingCamp) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // Filter equipment items based on search and category
  const filteredEquipment = equipmentItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || item.type === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });
  
  // Filter vendor requests based on search and category
  const filteredVendors = vendorRequests.filter(vendor => {
    const matchesSearch = vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          vendor.details.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || vendor.type === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });
  
  const equipmentCategories = ['Mat', 'Ring', 'Barricade', 'Timer', 'Scoreboard', 'Table', 'Chair', 'Signage', 'Audio', 'Lighting', 'Other'];
  const vendorCategories = ['AV Equipment', 'Security', 'Cleaning', 'Food Service', 'Medical', 'Transportation', 'Entertainment', 'Other'];

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleBackToCamp} className="mr-2">
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:block ml-1">Back to Camp</span>
            </Button>
            <h1 className="text-2xl font-bold md:text-3xl">Venue & Equipment Planner</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            {camp?.data?.name} - {formatDate(camp?.data?.startDate)} to {formatDate(camp?.data?.endDate)}
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
          {activeTab === "layout" && (
            <Button onClick={handleSaveLayout} disabled={saveLayoutMutation.isPending}>
              {saveLayoutMutation.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving</>
              ) : (
                <><Save className="mr-2 h-4 w-4" /> Save Layout</>
              )}
            </Button>
          )}
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:w-[600px]">
          <TabsTrigger value="layout">Venue Layout</TabsTrigger>
          <TabsTrigger value="equipment">Equipment Checklist</TabsTrigger>
          <TabsTrigger value="vendors">Vendor Requests</TabsTrigger>
        </TabsList>
        
        {/* Venue Layout Tab */}
        <TabsContent value="layout" className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Toolbox */}
            <Card className="md:w-64 flex-shrink-0">
              <CardHeader className="pb-2">
                <CardTitle>Layout Tools</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Add Elements</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button 
                      variant="outline" 
                      className="flex flex-col items-center p-2 h-auto"
                      onClick={() => handleAddElement('rectangle')}
                    >
                      <Square className="h-4 w-4 mb-1" />
                      <span className="text-xs">Area</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex flex-col items-center p-2 h-auto"
                      onClick={() => handleAddElement('mat')}
                    >
                      <Square className="h-4 w-4 mb-1" />
                      <span className="text-xs">Mat</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex flex-col items-center p-2 h-auto"
                      onClick={() => handleAddElement('table')}
                    >
                      <Table className="h-4 w-4 mb-1" />
                      <span className="text-xs">Table</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex flex-col items-center p-2 h-auto"
                      onClick={() => handleAddElement('chair')}
                    >
                      <Users className="h-4 w-4 mb-1" />
                      <span className="text-xs">Chair</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex flex-col items-center p-2 h-auto"
                      onClick={() => handleAddElement('booth')}
                    >
                      <MonitorSmartphone className="h-4 w-4 mb-1" />
                      <span className="text-xs">Booth</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex flex-col items-center p-2 h-auto"
                      onClick={() => handleAddElement('text')}
                    >
                      <Type className="h-4 w-4 mb-1" />
                      <span className="text-xs">Text</span>
                    </Button>
                  </div>
                </div>
                
                <Separator />
                
                {selectedElementId && (
                  <div className="space-y-3">
                    <Label>Element Properties</Label>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleEditLabel}
                      >
                        <Edit2 className="h-3.5 w-3.5 mr-1" />
                        <span className="text-xs">Edit Label</span>
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleRotateElement(90)}
                      >
                        <ArrowDown className="h-3.5 w-3.5 mr-1 rotate-90" />
                        <span className="text-xs">Rotate</span>
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleChangeZIndex(1)}
                      >
                        <ArrowDown className="h-3.5 w-3.5 mr-1 rotate-180" />
                        <span className="text-xs">Forward</span>
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleChangeZIndex(-1)}
                      >
                        <ArrowDown className="h-3.5 w-3.5 mr-1" />
                        <span className="text-xs">Backward</span>
                      </Button>
                    </div>
                    
                    <div className="space-y-1">
                      <Label className="text-xs">Color</Label>
                      <div className="grid grid-cols-6 gap-1">
                        {['#e5e7eb', '#fecaca', '#fef3c7', '#d1fae5', '#bfdbfe', '#e9d5ff'].map(color => (
                          <div 
                            key={color} 
                            className="w-6 h-6 rounded cursor-pointer border border-gray-300"
                            style={{ backgroundColor: color }}
                            onClick={() => handleChangeColor(color)}
                          />
                        ))}
                        {['#d1d5db', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'].map(color => (
                          <div 
                            key={color} 
                            className="w-6 h-6 rounded cursor-pointer border border-gray-300"
                            style={{ backgroundColor: color }}
                            onClick={() => handleChangeColor(color)}
                          />
                        ))}
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <Label className="text-xs">Size</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleResizeElement(10, 0)}
                        >
                          <span className="text-xs">Width +</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleResizeElement(-10, 0)}
                        >
                          <span className="text-xs">Width -</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleResizeElement(0, 10)}
                        >
                          <span className="text-xs">Height +</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleResizeElement(0, -10)}
                        >
                          <span className="text-xs">Height -</span>
                        </Button>
                      </div>
                    </div>
                    
                    <Button 
                      variant="destructive" 
                      size="sm"
                      className="w-full"
                      onClick={handleDeleteElement}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      <span>Delete Element</span>
                    </Button>
                  </div>
                )}
                
                <Separator />
                
                <div className="space-y-2">
                  <Label>Layout Options</Label>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Show Grid</span>
                    <Switch
                      checked={showGrid}
                      onCheckedChange={setShowGrid}
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Zoom</span>
                      <span className="text-xs text-muted-foreground">{Math.round(canvasScale * 100)}%</span>
                    </div>
                    <Slider
                      min={0.5}
                      max={2}
                      step={0.1}
                      value={[canvasScale]}
                      onValueChange={(values) => setCanvasScale(values[0])}
                    />
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <Label>Import/Export</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleExportLayout}
                    >
                      <Download className="h-3.5 w-3.5 mr-1" />
                      <span className="text-xs">Export</span>
                    </Button>
                    <Label 
                      htmlFor="import-layout"
                      className="flex h-9 items-center justify-center rounded-md border border-input bg-background px-3 text-xs text-muted-foreground shadow-sm hover:bg-accent hover:text-accent-foreground cursor-pointer"
                    >
                      <Upload className="h-3.5 w-3.5 mr-1" />
                      <span className="text-xs">Import</span>
                    </Label>
                    <input
                      id="import-layout"
                      type="file"
                      accept=".json"
                      className="hidden"
                      onChange={handleImportLayout}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Canvas */}
            <Card className="flex-grow overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle>Venue Layout</CardTitle>
                  <div className="text-xs text-muted-foreground">
                    {isAddingElement ? 'Click on the canvas to place the element' : 'Select elements to edit properties'}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div
                  ref={canvasRef}
                  className="relative border border-dashed border-gray-300 rounded-md h-[600px] overflow-auto"
                  style={{ 
                    transform: `scale(${canvasScale})`,
                    transformOrigin: 'top left',
                    backgroundImage: showGrid ? 'linear-gradient(to right, #f0f0f0 1px, transparent 1px), linear-gradient(to bottom, #f0f0f0 1px, transparent 1px)' : 'none',
                    backgroundSize: '20px 20px'
                  }}
                  onClick={handleCanvasClick}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                >
                  {elements.map(renderElement)}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Label Edit Dialog */}
          <Dialog open={isEditingLabel} onOpenChange={setIsEditingLabel}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Edit Element Label</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="label" className="text-right">
                    Label
                  </Label>
                  <Input
                    id="label"
                    value={editLabelValue}
                    onChange={(e) => setEditLabelValue(e.target.value)}
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleSaveLabel} type="submit">Save changes</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
        
        {/* Equipment Checklist Tab */}
        <TabsContent value="equipment" className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <Card className="md:w-72 flex-shrink-0">
              <CardHeader className="pb-2">
                <CardTitle>Equipment Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  className="w-full"
                  onClick={() => setIsAddingEquipment(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Equipment Item
                </Button>
                
                <Separator />
                
                <div className="space-y-3">
                  <Label>Filter Equipment</Label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      placeholder="Search equipment..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <Label className="text-sm">Category</Label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {equipmentCategories.map(category => (
                          <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Equipment Stats</Label>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Total Items:</span>
                      <span>{equipmentItems.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Checked Off:</span>
                      <span>{equipmentItems.filter(item => item.isChecked).length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Remaining:</span>
                      <span>{equipmentItems.filter(item => !item.isChecked).length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Completion:</span>
                      <span>
                        {equipmentItems.length === 0 
                          ? '0%' 
                          : `${Math.round((equipmentItems.filter(item => item.isChecked).length / equipmentItems.length) * 100)}%`
                        }
                      </span>
                    </div>
                  </div>
                </div>
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => saveEquipmentMutation.mutate()}
                  disabled={saveEquipmentMutation.isPending}
                >
                  {saveEquipmentMutation.isPending ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving</>
                  ) : (
                    <><Save className="mr-2 h-4 w-4" /> Save Checklist</>
                  )}
                </Button>
              </CardContent>
            </Card>
            
            <div className="flex-grow space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Equipment Checklist</CardTitle>
                  <CardDescription>
                    {filteredEquipment.length} items found
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingEquipment ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : filteredEquipment.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>{searchQuery || selectedCategory !== 'all' 
                        ? 'No equipment items match your search criteria.' 
                        : 'No equipment items added yet. Add your first item to get started.'}</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {['Mat', 'Ring', 'Barricade', 'Table', 'Chair', 'Signage', 'Audio', 'Lighting', 'Timer', 'Scoreboard', 'Other'].map(category => {
                        const categoryItems = filteredEquipment.filter(item => item.type === category);
                        if (categoryItems.length === 0) return null;
                        
                        return (
                          <div key={category} className="space-y-2">
                            <h3 className="font-medium">{category}</h3>
                            <div className="space-y-2">
                              {categoryItems.map(item => (
                                <div 
                                  key={item.id} 
                                  className={`flex items-center justify-between p-3 rounded-md border ${
                                    item.isChecked ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <Checkbox 
                                      id={`equipment-${item.id}`}
                                      checked={item.isChecked}
                                      onCheckedChange={(checked) => 
                                        handleToggleEquipment(item.id, checked as boolean)
                                      }
                                    />
                                    <div className="space-y-1">
                                      <Label 
                                        htmlFor={`equipment-${item.id}`}
                                        className={`font-medium ${item.isChecked ? 'line-through text-muted-foreground' : ''}`}
                                      >
                                        {item.name}
                                      </Label>
                                      <div className="flex gap-2 text-xs">
                                        <Badge variant="outline">
                                          Qty: {item.quantity}
                                        </Badge>
                                        {item.responsible && (
                                          <Badge variant="outline" className="bg-blue-50">
                                            {item.responsible}
                                          </Badge>
                                        )}
                                      </div>
                                      {item.notes && (
                                        <p className="text-xs text-muted-foreground">{item.notes}</p>
                                      )}
                                    </div>
                                  </div>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon">
                                        <MessageSquare className="h-4 w-4" />
                                        <span className="sr-only">Open menu</span>
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem onClick={() => handleDeleteEquipment(item.id)}>
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
          
          {/* Add Equipment Dialog */}
          <Dialog open={isAddingEquipment} onOpenChange={setIsAddingEquipment}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add Equipment Item</DialogTitle>
                <DialogDescription>
                  Add a new item to your equipment checklist.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="equipment-name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="equipment-name"
                    value={newEquipment.name}
                    onChange={(e) => setNewEquipment({...newEquipment, name: e.target.value})}
                    className="col-span-3"
                    placeholder="Wrestling Mat"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="equipment-type" className="text-right">
                    Type
                  </Label>
                  <Select 
                    value={newEquipment.type}
                    onValueChange={(value) => setNewEquipment({...newEquipment, type: value})}
                  >
                    <SelectTrigger id="equipment-type" className="col-span-3">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {equipmentCategories.map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="equipment-quantity" className="text-right">
                    Quantity
                  </Label>
                  <Input
                    id="equipment-quantity"
                    type="number"
                    min="1"
                    value={newEquipment.quantity}
                    onChange={(e) => setNewEquipment({...newEquipment, quantity: parseInt(e.target.value) || 1})}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="equipment-notes" className="text-right">
                    Notes
                  </Label>
                  <Input
                    id="equipment-notes"
                    value={newEquipment.notes || ''}
                    onChange={(e) => setNewEquipment({...newEquipment, notes: e.target.value})}
                    className="col-span-3"
                    placeholder="Optional notes"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddingEquipment(false)}>Cancel</Button>
                <Button onClick={handleAddEquipment}>Add Item</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
        
        {/* Vendor Requests Tab */}
        <TabsContent value="vendors" className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <Card className="md:w-72 flex-shrink-0">
              <CardHeader className="pb-2">
                <CardTitle>Vendor Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  className="w-full"
                  onClick={() => setIsAddingVendor(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Vendor Request
                </Button>
                
                <Separator />
                
                <div className="space-y-3">
                  <Label>Filter Vendors</Label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      placeholder="Search vendors..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <Label className="text-sm">Category</Label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {vendorCategories.map(category => (
                          <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Vendor Stats</Label>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Total Requests:</span>
                      <span>{vendorRequests.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pending:</span>
                      <span>{vendorRequests.filter(v => v.status === 'pending').length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Approved:</span>
                      <span>{vendorRequests.filter(v => v.status === 'approved').length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Booked:</span>
                      <span>{vendorRequests.filter(v => v.status === 'booked').length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Denied:</span>
                      <span>{vendorRequests.filter(v => v.status === 'denied').length}</span>
                    </div>
                  </div>
                </div>
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => saveVendorsMutation.mutate()}
                  disabled={saveVendorsMutation.isPending}
                >
                  {saveVendorsMutation.isPending ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving</>
                  ) : (
                    <><Save className="mr-2 h-4 w-4" /> Save Requests</>
                  )}
                </Button>
              </CardContent>
            </Card>
            
            <div className="flex-grow space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Vendor Requests</CardTitle>
                  <CardDescription>
                    {filteredVendors.length} requests found
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingVendors ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : filteredVendors.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>{searchQuery || selectedCategory !== 'all' 
                        ? 'No vendor requests match your search criteria.' 
                        : 'No vendor requests added yet. Add your first request to get started.'}</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {vendorCategories.map(category => {
                        const categoryVendors = filteredVendors.filter(vendor => vendor.type === category);
                        if (categoryVendors.length === 0) return null;
                        
                        return (
                          <div key={category} className="space-y-3">
                            <h3 className="font-medium">{category}</h3>
                            <div className="space-y-3">
                              {categoryVendors.map(vendor => (
                                <Card key={vendor.id} className="overflow-hidden">
                                  <div className={`h-1 w-full ${
                                    vendor.status === 'approved' ? 'bg-green-500' :
                                    vendor.status === 'pending' ? 'bg-amber-500' :
                                    vendor.status === 'booked' ? 'bg-blue-500' :
                                    'bg-red-500'
                                  }`} />
                                  <CardHeader className="p-4 pb-2">
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <CardTitle className="text-base">{vendor.name}</CardTitle>
                                        <CardDescription>{vendor.type}</CardDescription>
                                      </div>
                                      <Badge 
                                        variant="outline"
                                        className={`
                                          ${vendor.status === 'approved' ? 'bg-green-100 text-green-800 hover:bg-green-100' :
                                            vendor.status === 'pending' ? 'bg-amber-100 text-amber-800 hover:bg-amber-100' :
                                            vendor.status === 'booked' ? 'bg-blue-100 text-blue-800 hover:bg-blue-100' :
                                            'bg-red-100 text-red-800 hover:bg-red-100'
                                          }
                                        `}
                                      >
                                        {vendor.status.charAt(0).toUpperCase() + vendor.status.slice(1)}
                                      </Badge>
                                    </div>
                                  </CardHeader>
                                  <CardContent className="p-4 pt-2">
                                    <p className="text-sm mb-2">{vendor.details}</p>
                                    
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                      {vendor.cost && (
                                        <div>
                                          <span className="text-muted-foreground mr-1">Cost:</span>
                                          <span className="font-medium">{formatCurrency(vendor.cost)}</span>
                                        </div>
                                      )}
                                      {vendor.dueDate && (
                                        <div>
                                          <span className="text-muted-foreground mr-1">Due:</span>
                                          <span className="font-medium">{formatDate(vendor.dueDate)}</span>
                                        </div>
                                      )}
                                      {vendor.contactInfo && (
                                        <div className="col-span-2">
                                          <span className="text-muted-foreground mr-1">Contact:</span>
                                          <span className="font-medium">{vendor.contactInfo}</span>
                                        </div>
                                      )}
                                    </div>
                                  </CardContent>
                                  <CardFooter className="p-3 bg-gray-50 flex justify-between">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="sm">
                                          Change Status
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent>
                                        <DropdownMenuItem 
                                          onClick={() => handleVendorStatusChange(vendor.id, 'pending')}
                                          className="flex items-center"
                                        >
                                          <Clock className="mr-2 h-4 w-4 text-amber-500" /> Pending
                                        </DropdownMenuItem>
                                        <DropdownMenuItem 
                                          onClick={() => handleVendorStatusChange(vendor.id, 'approved')}
                                          className="flex items-center"
                                        >
                                          <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" /> Approved
                                        </DropdownMenuItem>
                                        <DropdownMenuItem 
                                          onClick={() => handleVendorStatusChange(vendor.id, 'booked')}
                                          className="flex items-center"
                                        >
                                          <CheckCircle2 className="mr-2 h-4 w-4 text-blue-500" /> Booked
                                        </DropdownMenuItem>
                                        <DropdownMenuItem 
                                          onClick={() => handleVendorStatusChange(vendor.id, 'denied')}
                                          className="flex items-center"
                                        >
                                          <XCircle className="mr-2 h-4 w-4 text-red-500" /> Denied
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                    
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => handleDeleteVendor(vendor.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </CardFooter>
                                </Card>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
          
          {/* Add Vendor Request Dialog */}
          <Dialog open={isAddingVendor} onOpenChange={setIsAddingVendor}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add Vendor Request</DialogTitle>
                <DialogDescription>
                  Add a new vendor request for this camp.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="vendor-name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="vendor-name"
                    value={newVendor.name}
                    onChange={(e) => setNewVendor({...newVendor, name: e.target.value})}
                    className="col-span-3"
                    placeholder="AV Tech Solutions"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="vendor-type" className="text-right">
                    Type
                  </Label>
                  <Select 
                    value={newVendor.type}
                    onValueChange={(value) => setNewVendor({...newVendor, type: value})}
                  >
                    <SelectTrigger id="vendor-type" className="col-span-3">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {vendorCategories.map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="vendor-details" className="text-right">
                    Details
                  </Label>
                  <Input
                    id="vendor-details"
                    value={newVendor.details}
                    onChange={(e) => setNewVendor({...newVendor, details: e.target.value})}
                    className="col-span-3"
                    placeholder="Need 2 projectors and 4 microphones"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="vendor-cost" className="text-right">
                    Cost
                  </Label>
                  <Input
                    id="vendor-cost"
                    type="number"
                    min="0"
                    step="0.01"
                    value={newVendor.cost || ''}
                    onChange={(e) => setNewVendor({...newVendor, cost: parseFloat(e.target.value) || undefined})}
                    className="col-span-3"
                    placeholder="500.00"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="vendor-contact" className="text-right">
                    Contact
                  </Label>
                  <Input
                    id="vendor-contact"
                    value={newVendor.contactInfo || ''}
                    onChange={(e) => setNewVendor({...newVendor, contactInfo: e.target.value})}
                    className="col-span-3"
                    placeholder="john@avtech.com, 555-123-4567"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="vendor-due" className="text-right">
                    Due Date
                  </Label>
                  <Input
                    id="vendor-due"
                    type="date"
                    value={newVendor.dueDate || ''}
                    onChange={(e) => setNewVendor({...newVendor, dueDate: e.target.value})}
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddingVendor(false)}>Cancel</Button>
                <Button onClick={handleAddVendor}>Add Request</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default VenuePlanner;