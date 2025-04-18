import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronLeft,
  Save,
  Trash2,
  Plus,
  Download,
  Upload,
  Loader2,
  Search,
  DollarSign,
  Receipt,
  ShoppingCart,
  CreditCard,
  Users,
  Truck,
  Building,
  FileText,
  CalendarDays,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  Filter,
  ChevronDown,
  FileSpreadsheet
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ScrollableDialog } from "@/components/ui/scrollable-dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDate, formatCurrency } from "@/lib/utils";

// Types for budget data
interface Revenue {
  id: number;
  source: string;
  category: 'registration' | 'merchandise' | 'sponsorship' | 'other';
  amount: number;
  date: string;
  notes?: string;
  orderId?: string;
  paymentMethod?: string;
  shopifyOrderId?: string;
  stripePaymentId?: string;
}

interface Expense {
  id: number;
  name: string;
  category: 'venue' | 'equipment' | 'travel' | 'food' | 'staff' | 'marketing' | 'other';
  amount: number;
  date: string;
  notes?: string;
  receiptUrl?: string;
  vendor?: string;
  paid: boolean;
  paymentMethod?: string;
  approvedBy?: string;
}

interface BudgetSummary {
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  revenueByCategory: Record<string, number>;
  expensesByCategory: Record<string, number>;
  projectedRevenue?: number;
  projectedExpenses?: number;
  projectedNetIncome?: number;
  campCapacity?: number;
  currentRegistrations?: number;
  targetedProfit?: number;
  breakEvenPoint?: number;
}

interface RegistrationTier {
  id: number;
  name: string;
  price: number;
  campId: number;
}

function BudgetTracker() {
  const [location, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const campId = searchParams.get('campId');
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [showAddRevenue, setShowAddRevenue] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [newRevenue, setNewRevenue] = useState<Partial<Revenue>>({
    source: '',
    category: 'registration',
    amount: 0,
    date: new Date().toISOString().split('T')[0]
  });
  const [newExpense, setNewExpense] = useState<Partial<Expense>>({
    name: '',
    category: 'venue',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    paid: false
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [isMergingShopify, setIsMergingShopify] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ type: 'revenue' | 'expense', id: number } | null>(null);
  
  // Fetch camp details
  const {
    data: camp,
    isLoading: isLoadingCamp,
    isError: isCampError
  } = useQuery({
    queryKey: ['/api/camps', campId],
    enabled: !!campId,
  });
  
  // Fetch budget data
  const {
    data: budgetData,
    isLoading: isLoadingBudget,
    isError: isBudgetError
  } = useQuery({
    queryKey: ['/api/camps', campId, 'budget'],
    enabled: !!campId,
  });
  
  // Fetch registration tiers
  const {
    data: tiersData,
    isLoading: isLoadingTiers
  } = useQuery({
    queryKey: ['/api/camps', campId, 'registration-tiers'],
    enabled: !!campId,
  });
  
  // Fetch Shopify orders
  const {
    data: shopifyData,
    isLoading: isLoadingShopify
  } = useQuery({
    queryKey: ['/api/shopify/orders', { campId }],
    enabled: !!campId && isMergingShopify,
  });
  
  // Save budget mutation
  const saveBudgetMutation = useMutation({
    mutationFn: async (data: { revenues?: Revenue[], expenses?: Expense[] }) => {
      const response = await apiRequest(
        "POST",
        `/api/camps/${campId}/budget`,
        data
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Budget saved",
        description: "Budget data has been saved successfully."
      });
      queryClient.invalidateQueries({
        queryKey: ['/api/camps', campId, 'budget']
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
  
  // Add revenue mutation
  const addRevenueMutation = useMutation({
    mutationFn: async (revenueData: Partial<Revenue>) => {
      const response = await apiRequest(
        "POST",
        `/api/camps/${campId}/budget/revenue`,
        revenueData
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Revenue added",
        description: "Revenue item has been added successfully."
      });
      queryClient.invalidateQueries({
        queryKey: ['/api/camps', campId, 'budget']
      });
      setShowAddRevenue(false);
      setNewRevenue({
        source: '',
        category: 'registration',
        amount: 0,
        date: new Date().toISOString().split('T')[0]
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add revenue",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Add expense mutation
  const addExpenseMutation = useMutation({
    mutationFn: async (expenseData: Partial<Expense>) => {
      const response = await apiRequest(
        "POST",
        `/api/camps/${campId}/budget/expense`,
        expenseData
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Expense added",
        description: "Expense item has been added successfully."
      });
      queryClient.invalidateQueries({
        queryKey: ['/api/camps', campId, 'budget']
      });
      setShowAddExpense(false);
      setNewExpense({
        name: '',
        category: 'venue',
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        paid: false
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add expense",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Delete item mutation
  const deleteItemMutation = useMutation({
    mutationFn: async ({ type, id }: { type: 'revenue' | 'expense', id: number }) => {
      const response = await apiRequest(
        "DELETE",
        `/api/camps/${campId}/budget/${type}/${id}`,
        {}
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Item deleted",
        description: "Budget item has been deleted successfully."
      });
      queryClient.invalidateQueries({
        queryKey: ['/api/camps', campId, 'budget']
      });
      setShowDeleteConfirm(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete item",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Import Shopify data mutation
  const importShopifyMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(
        "POST",
        `/api/camps/${campId}/budget/import-shopify`,
        {}
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Data imported",
        description: "Shopify data has been imported successfully."
      });
      queryClient.invalidateQueries({
        queryKey: ['/api/camps', campId, 'budget']
      });
      setIsMergingShopify(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Import failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Export budget data
  const handleExportBudget = () => {
    if (!budgetData) return;
    
    const exportData = {
      campName: camp?.data?.name,
      exportDate: new Date().toISOString(),
      revenues: budgetData.revenues,
      expenses: budgetData.expenses,
      summary: calculateBudgetSummary(budgetData.revenues, budgetData.expenses)
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileName = `budget_camp_${campId}_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileName);
    linkElement.click();
  };
  
  // Export as CSV
  const handleExportCSV = () => {
    if (!budgetData) return;
    
    // Create revenue CSV
    let revenueCSV = 'ID,Source,Category,Amount,Date,Notes,Order ID,Payment Method\n';
    budgetData.revenues.forEach((revenue) => {
      revenueCSV += `${revenue.id},${revenue.source},"${revenue.category}",${revenue.amount},"${revenue.date}","${revenue.notes || ''}","${revenue.orderId || ''}","${revenue.paymentMethod || ''}"\n`;
    });
    
    // Create expense CSV
    let expenseCSV = 'ID,Name,Category,Amount,Date,Notes,Vendor,Paid,Payment Method\n';
    budgetData.expenses.forEach((expense) => {
      expenseCSV += `${expense.id},"${expense.name}","${expense.category}",${expense.amount},"${expense.date}","${expense.notes || ''}","${expense.vendor || ''}",${expense.paid ? 'Yes' : 'No'},"${expense.paymentMethod || ''}"\n`;
    });
    
    // Revenue export
    const revenueUri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(revenueCSV);
    const revenueFileName = `revenues_camp_${campId}_${new Date().toISOString().split('T')[0]}.csv`;
    
    const revenueLinkElement = document.createElement('a');
    revenueLinkElement.setAttribute('href', revenueUri);
    revenueLinkElement.setAttribute('download', revenueFileName);
    revenueLinkElement.click();
    
    // Expense export
    setTimeout(() => {
      const expenseUri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(expenseCSV);
      const expenseFileName = `expenses_camp_${campId}_${new Date().toISOString().split('T')[0]}.csv`;
      
      const expenseLinkElement = document.createElement('a');
      expenseLinkElement.setAttribute('href', expenseUri);
      expenseLinkElement.setAttribute('download', expenseFileName);
      expenseLinkElement.click();
    }, 100);
  };
  
  // Handle adding new revenue
  const handleAddRevenue = () => {
    if (!newRevenue.source || !newRevenue.amount) {
      toast({
        title: "Missing information",
        description: "Please fill out all required fields.",
        variant: "destructive"
      });
      return;
    }
    
    addRevenueMutation.mutate(newRevenue);
  };
  
  // Handle adding new expense
  const handleAddExpense = () => {
    if (!newExpense.name || !newExpense.amount) {
      toast({
        title: "Missing information",
        description: "Please fill out all required fields.",
        variant: "destructive"
      });
      return;
    }
    
    addExpenseMutation.mutate(newExpense);
  };
  
  // Handle delete item
  const handleDeleteItem = () => {
    if (!showDeleteConfirm) return;
    deleteItemMutation.mutate(showDeleteConfirm);
  };
  
  // Calculate budget summary
  const calculateBudgetSummary = (revenues: Revenue[], expenses: Expense[]): BudgetSummary => {
    const totalRevenue = revenues.reduce((sum, item) => sum + item.amount, 0);
    const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);
    const netIncome = totalRevenue - totalExpenses;
    
    // Calculate by category
    const revenueByCategory: Record<string, number> = {};
    const expensesByCategory: Record<string, number> = {};
    
    revenues.forEach(item => {
      revenueByCategory[item.category] = (revenueByCategory[item.category] || 0) + item.amount;
    });
    
    expenses.forEach(item => {
      expensesByCategory[item.category] = (expensesByCategory[item.category] || 0) + item.amount;
    });
    
    // Calculate projected revenue based on registration tiers
    const campData = camp?.data;
    const tiers = tiersData?.data || [];
    
    let projectedRevenue = 0;
    let currentRegistrations = 0;
    
    if (campData && tiers.length > 0) {
      const registrationRevenue = revenues.filter(r => r.category === 'registration');
      currentRegistrations = registrationRevenue.length;
      
      // Assume full capacity for projection
      const campCapacity = campData.participants || 0;
      const averageTierPrice = tiers.reduce((sum, tier) => sum + tier.price, 0) / tiers.length;
      
      projectedRevenue = averageTierPrice * campCapacity;
    }
    
    // Project expenses
    const projectedExpenses = totalExpenses * 1.1; // 10% buffer
    const projectedNetIncome = projectedRevenue - projectedExpenses;
    
    // Calculate break-even point
    const breakEvenPoint = totalExpenses > 0 
      ? Math.ceil(totalExpenses / (totalRevenue / currentRegistrations || 1))
      : 0;
    
    return {
      totalRevenue,
      totalExpenses,
      netIncome,
      revenueByCategory,
      expensesByCategory,
      projectedRevenue,
      projectedExpenses,
      projectedNetIncome,
      campCapacity: campData?.participants,
      currentRegistrations,
      breakEvenPoint
    };
  };
  
  // Filter revenues and expenses based on search and filters
  const filteredRevenues = budgetData?.revenues?.filter(revenue => {
    const matchesSearch = 
      revenue.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (revenue.notes && revenue.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = categoryFilter === 'all' || revenue.category === categoryFilter;
    
    const matchesDate = dateFilter === 'all' ||
      (dateFilter === 'thisMonth' && new Date(revenue.date).getMonth() === new Date().getMonth() && 
       new Date(revenue.date).getFullYear() === new Date().getFullYear()) ||
      (dateFilter === 'lastMonth' && 
        ((new Date(revenue.date).getMonth() === new Date().getMonth() - 1 && 
          new Date(revenue.date).getFullYear() === new Date().getFullYear()) ||
         (new Date(revenue.date).getMonth() === 11 && 
          new Date().getMonth() === 0 && 
          new Date(revenue.date).getFullYear() === new Date().getFullYear() - 1)));
    
    return matchesSearch && matchesCategory && matchesDate;
  }) || [];
  
  const filteredExpenses = budgetData?.expenses?.filter(expense => {
    const matchesSearch = 
      expense.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (expense.notes && expense.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (expense.vendor && expense.vendor.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = categoryFilter === 'all' || expense.category === categoryFilter;
    
    const matchesDate = dateFilter === 'all' ||
      (dateFilter === 'thisMonth' && new Date(expense.date).getMonth() === new Date().getMonth() && 
       new Date(expense.date).getFullYear() === new Date().getFullYear()) ||
      (dateFilter === 'lastMonth' && 
        ((new Date(expense.date).getMonth() === new Date().getMonth() - 1 && 
          new Date(expense.date).getFullYear() === new Date().getFullYear()) ||
         (new Date(expense.date).getMonth() === 11 && 
          new Date().getMonth() === 0 && 
          new Date(expense.date).getFullYear() === new Date().getFullYear() - 1)));
    
    return matchesSearch && matchesCategory && matchesDate;
  }) || [];
  
  // Back to camp page
  const handleBackToCamp = () => {
    setLocation(`/events/camp-project/${campId}`);
  };
  
  // Import from Shopify
  const handleImportShopify = () => {
    importShopifyMutation.mutate();
  };
  
  // Loading state
  if (isLoadingCamp || isLoadingBudget) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // Calculate budget summary
  const budgetSummary = calculateBudgetSummary(
    budgetData?.revenues || [],
    budgetData?.expenses || []
  );
  
  // Revenue category options
  const revenueCategoryOptions = [
    { value: 'registration', label: 'Registration' },
    { value: 'merchandise', label: 'Merchandise' },
    { value: 'sponsorship', label: 'Sponsorship' },
    { value: 'other', label: 'Other' }
  ];
  
  // Expense category options
  const expenseCategoryOptions = [
    { value: 'venue', label: 'Venue' },
    { value: 'equipment', label: 'Equipment' },
    { value: 'travel', label: 'Travel' },
    { value: 'food', label: 'Food & Beverages' },
    { value: 'staff', label: 'Staff & Clinicians' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'other', label: 'Other' }
  ];
  
  // Format category name
  const formatCategoryName = (category: string) => {
    return category.charAt(0).toUpperCase() + category.slice(1);
  };
  
  // Get category icon
  const getCategoryIcon = (category: string, type: 'revenue' | 'expense') => {
    if (type === 'revenue') {
      switch (category) {
        case 'registration':
          return <Users className="h-4 w-4" />;
        case 'merchandise':
          return <ShoppingCart className="h-4 w-4" />;
        case 'sponsorship':
          return <Building className="h-4 w-4" />;
        case 'other':
          return <DollarSign className="h-4 w-4" />;
        default:
          return <DollarSign className="h-4 w-4" />;
      }
    } else {
      switch (category) {
        case 'venue':
          return <Building className="h-4 w-4" />;
        case 'equipment':
          return <FileText className="h-4 w-4" />;
        case 'travel':
          return <Truck className="h-4 w-4" />;
        case 'food':
          return <ShoppingCart className="h-4 w-4" />;
        case 'staff':
          return <Users className="h-4 w-4" />;
        case 'marketing':
          return <ArrowUpRight className="h-4 w-4" />;
        case 'other':
          return <CreditCard className="h-4 w-4" />;
        default:
          return <CreditCard className="h-4 w-4" />;
      }
    }
  };
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleBackToCamp} className="mr-2">
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:block ml-1">Back to Camp</span>
            </Button>
            <h1 className="text-2xl font-bold md:text-3xl">Budget Tracker</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            {camp?.data?.name} - {formatDate(camp?.data?.startDate)} to {formatDate(camp?.data?.endDate)}
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={handleExportBudget}>
                <FileText className="mr-2 h-4 w-4" />
                Export as JSON
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportCSV}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Export as CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button onClick={() => setIsMergingShopify(true)}>
            <ShoppingCart className="mr-2 h-4 w-4" />
            Import from Shopify
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:w-[600px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Summary Cards */}
            <Card className={`${budgetSummary.netIncome >= 0 ? 'border-green-500' : 'border-red-500'} border-t-4`}>
              <CardHeader className="pb-2">
                <CardTitle>Net Income</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {formatCurrency(budgetSummary.netIncome)}
                </div>
                <div className="flex justify-between mt-2">
                  <div className="flex flex-col">
                    <span className="text-sm text-muted-foreground">Revenue</span>
                    <span className="font-medium text-green-600">{formatCurrency(budgetSummary.totalRevenue)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm text-muted-foreground">Expenses</span>
                    <span className="font-medium text-red-600">{formatCurrency(budgetSummary.totalExpenses)}</span>
                  </div>
                </div>
                <Progress 
                  value={budgetSummary.totalExpenses ? (budgetSummary.totalRevenue / budgetSummary.totalExpenses) * 100 : 100} 
                  className="mt-3"
                />
                <div className="text-xs text-muted-foreground text-center mt-1">
                  {budgetSummary.totalExpenses ? 
                    `${Math.round((budgetSummary.totalRevenue / budgetSummary.totalExpenses) * 100)}% of expenses covered` :
                    'No expenses recorded'
                  }
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Registrations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {budgetSummary.currentRegistrations}
                </div>
                <div className="flex justify-between mt-2">
                  <div className="flex flex-col">
                    <span className="text-sm text-muted-foreground">Capacity</span>
                    <span className="font-medium">{budgetSummary.campCapacity || 'N/A'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm text-muted-foreground">Break-even</span>
                    <span className="font-medium">{budgetSummary.breakEvenPoint || 'N/A'}</span>
                  </div>
                </div>
                <Progress 
                  value={budgetSummary.campCapacity ? (budgetSummary.currentRegistrations / budgetSummary.campCapacity) * 100 : 0} 
                  className="mt-3"
                />
                <div className="text-xs text-muted-foreground text-center mt-1">
                  {budgetSummary.campCapacity ? 
                    `${Math.round((budgetSummary.currentRegistrations / budgetSummary.campCapacity) * 100)}% of capacity filled` :
                    'Capacity not set'
                  }
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Projection</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {formatCurrency(budgetSummary.projectedNetIncome || 0)}
                </div>
                <div className="flex justify-between mt-2">
                  <div className="flex flex-col">
                    <span className="text-sm text-muted-foreground">Revenue</span>
                    <span className="font-medium text-green-600">{formatCurrency(budgetSummary.projectedRevenue || 0)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm text-muted-foreground">Expenses</span>
                    <span className="font-medium text-red-600">{formatCurrency(budgetSummary.projectedExpenses || 0)}</span>
                  </div>
                </div>
                <Progress 
                  value={budgetSummary.projectedExpenses ? (budgetSummary.projectedRevenue! / budgetSummary.projectedExpenses) * 100 : 100} 
                  className="mt-3"
                />
                <div className="text-xs text-muted-foreground text-center mt-1">
                  Projected ROI: {budgetSummary.projectedExpenses ? 
                    `${Math.round(((budgetSummary.projectedRevenue! - budgetSummary.projectedExpenses) / budgetSummary.projectedExpenses) * 100)}%` :
                    'N/A'
                  }
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Revenue Categories */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Revenue Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                {Object.keys(budgetSummary.revenueByCategory).length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <p>No revenue data available</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(budgetSummary.revenueByCategory).map(([category, amount]) => (
                      <div key={category} className="space-y-1">
                        <div className="flex justify-between">
                          <div className="flex items-center">
                            {getCategoryIcon(category, 'revenue')}
                            <span className="ml-2">{formatCategoryName(category)}</span>
                          </div>
                          <span className="font-medium">{formatCurrency(amount)}</span>
                        </div>
                        <Progress 
                          value={(amount / budgetSummary.totalRevenue) * 100} 
                          className="h-2"
                          indicatorColor={
                            category === 'registration' ? 'bg-blue-500' :
                            category === 'merchandise' ? 'bg-purple-500' :
                            category === 'sponsorship' ? 'bg-yellow-500' :
                            'bg-green-500'
                          }
                        />
                        <div className="text-xs text-right text-muted-foreground">
                          {Math.round((amount / budgetSummary.totalRevenue) * 100)}% of revenue
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="mt-4">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      setActiveTab("revenue");
                      setShowAddRevenue(true);
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Revenue
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Expense Categories */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Expense Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                {Object.keys(budgetSummary.expensesByCategory).length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <p>No expense data available</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(budgetSummary.expensesByCategory).map(([category, amount]) => (
                      <div key={category} className="space-y-1">
                        <div className="flex justify-between">
                          <div className="flex items-center">
                            {getCategoryIcon(category, 'expense')}
                            <span className="ml-2">{formatCategoryName(category)}</span>
                          </div>
                          <span className="font-medium">{formatCurrency(amount)}</span>
                        </div>
                        <Progress 
                          value={(amount / budgetSummary.totalExpenses) * 100} 
                          className="h-2"
                          indicatorColor={
                            category === 'venue' ? 'bg-blue-500' :
                            category === 'equipment' ? 'bg-purple-500' :
                            category === 'travel' ? 'bg-yellow-500' :
                            category === 'food' ? 'bg-green-500' :
                            category === 'staff' ? 'bg-indigo-500' :
                            category === 'marketing' ? 'bg-pink-500' :
                            'bg-gray-500'
                          }
                        />
                        <div className="text-xs text-right text-muted-foreground">
                          {Math.round((amount / budgetSummary.totalExpenses) * 100)}% of expenses
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="mt-4">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      setActiveTab("expenses");
                      setShowAddExpense(true);
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Expense
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {/* Recent Transactions */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                {(!budgetData?.revenues?.length && !budgetData?.expenses?.length) ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <p>No transactions available</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {/* Combine revenues and expenses and sort by date */}
                      {[...(budgetData?.revenues || []).map(r => ({ 
                        ...r, 
                        type: 'revenue', 
                        description: r.source 
                      })),
                      ...(budgetData?.expenses || []).map(e => ({ 
                        ...e, 
                        type: 'expense', 
                        description: e.name 
                      }))]
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .slice(0, 10) // Get only 10 most recent
                      .map((item, index) => (
                        <TableRow key={`${item.type}-${item.id}`}>
                          <TableCell>{formatDate(item.date)}</TableCell>
                          <TableCell>
                            <div className="font-medium">{item.description}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {formatCategoryName(item.category)}
                            </Badge>
                          </TableCell>
                          <TableCell className={`text-right font-medium ${item.type === 'revenue' ? 'text-green-600' : 'text-red-600'}`}>
                            {item.type === 'revenue' ? '+' : '-'}{formatCurrency(item.amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-center mb-4">
            <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto mb-4 md:mb-0">
              <div className="relative flex-grow">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search revenues..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {revenueCategoryOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="All Dates" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Dates</SelectItem>
                    <SelectItem value="thisMonth">This Month</SelectItem>
                    <SelectItem value="lastMonth">Last Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Button onClick={() => setShowAddRevenue(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Revenue
            </Button>
          </div>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex justify-between items-center">
                <span>Revenue Entries</span>
                <span className="text-sm font-normal text-muted-foreground">
                  {filteredRevenues.length} items • {formatCurrency(filteredRevenues.reduce((sum, item) => sum + item.amount, 0))}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredRevenues.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No revenue entries found. Add your first revenue item to get started.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRevenues.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((revenue) => (
                      <TableRow key={revenue.id}>
                        <TableCell>{formatDate(revenue.date)}</TableCell>
                        <TableCell>
                          <div className="font-medium">{revenue.source}</div>
                          {revenue.orderId && (
                            <div className="text-xs text-muted-foreground">
                              Order: {revenue.orderId}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline"
                            className={
                              revenue.category === 'registration' ? 'bg-blue-100 text-blue-800 hover:bg-blue-100' :
                              revenue.category === 'merchandise' ? 'bg-purple-100 text-purple-800 hover:bg-purple-100' :
                              revenue.category === 'sponsorship' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' :
                              'bg-green-100 text-green-800 hover:bg-green-100'
                            }
                          >
                            {formatCategoryName(revenue.category)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[200px] truncate">
                            {revenue.notes || '—'}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium text-green-600">
                          {formatCurrency(revenue.amount)}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setShowDeleteConfirm({ type: 'revenue', id: revenue.id })}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Expenses Tab */}
        <TabsContent value="expenses" className="space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-center mb-4">
            <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto mb-4 md:mb-0">
              <div className="relative flex-grow">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search expenses..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {expenseCategoryOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="All Dates" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Dates</SelectItem>
                    <SelectItem value="thisMonth">This Month</SelectItem>
                    <SelectItem value="lastMonth">Last Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Button onClick={() => setShowAddExpense(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Expense
            </Button>
          </div>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex justify-between items-center">
                <span>Expense Entries</span>
                <span className="text-sm font-normal text-muted-foreground">
                  {filteredExpenses.length} items • {formatCurrency(filteredExpenses.reduce((sum, item) => sum + item.amount, 0))}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredExpenses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No expense entries found. Add your first expense item to get started.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredExpenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell>{formatDate(expense.date)}</TableCell>
                        <TableCell>
                          <div className="font-medium">{expense.name}</div>
                          {expense.notes && (
                            <div className="text-xs text-muted-foreground max-w-[200px] truncate">
                              {expense.notes}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline"
                            className={
                              expense.category === 'venue' ? 'bg-blue-100 text-blue-800 hover:bg-blue-100' :
                              expense.category === 'equipment' ? 'bg-purple-100 text-purple-800 hover:bg-purple-100' :
                              expense.category === 'travel' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' :
                              expense.category === 'food' ? 'bg-green-100 text-green-800 hover:bg-green-100' :
                              expense.category === 'staff' ? 'bg-indigo-100 text-indigo-800 hover:bg-indigo-100' :
                              expense.category === 'marketing' ? 'bg-pink-100 text-pink-800 hover:bg-pink-100' :
                              'bg-gray-100 text-gray-800 hover:bg-gray-100'
                            }
                          >
                            {formatCategoryName(expense.category)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {expense.vendor || '—'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={expense.paid ? 'default' : 'outline'}>
                            {expense.paid ? 'Paid' : 'Pending'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium text-red-600">
                          {formatCurrency(expense.amount)}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setShowDeleteConfirm({ type: 'expense', id: expense.id })}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Add Revenue Dialog */}
      <Dialog open={showAddRevenue} onOpenChange={setShowAddRevenue}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Revenue</DialogTitle>
            <DialogDescription>
              Add a new revenue entry to the budget tracker.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="revenue-source" className="text-right">
                Source
              </Label>
              <Input
                id="revenue-source"
                value={newRevenue.source}
                onChange={(e) => setNewRevenue({...newRevenue, source: e.target.value})}
                className="col-span-3"
                placeholder="Registration Fees"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="revenue-category" className="text-right">
                Category
              </Label>
              <Select 
                value={newRevenue.category}
                onValueChange={(value: any) => setNewRevenue({...newRevenue, category: value})}
              >
                <SelectTrigger id="revenue-category" className="col-span-3">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {revenueCategoryOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="revenue-amount" className="text-right">
                Amount
              </Label>
              <Input
                id="revenue-amount"
                type="number"
                step="0.01"
                min="0"
                value={newRevenue.amount || ''}
                onChange={(e) => setNewRevenue({...newRevenue, amount: parseFloat(e.target.value) || 0})}
                className="col-span-3"
                placeholder="100.00"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="revenue-date" className="text-right">
                Date
              </Label>
              <Input
                id="revenue-date"
                type="date"
                value={newRevenue.date}
                onChange={(e) => setNewRevenue({...newRevenue, date: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="revenue-order-id" className="text-right">
                Order ID
              </Label>
              <Input
                id="revenue-order-id"
                value={newRevenue.orderId || ''}
                onChange={(e) => setNewRevenue({...newRevenue, orderId: e.target.value})}
                className="col-span-3"
                placeholder="Optional"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="revenue-payment-method" className="text-right">
                Payment Method
              </Label>
              <Input
                id="revenue-payment-method"
                value={newRevenue.paymentMethod || ''}
                onChange={(e) => setNewRevenue({...newRevenue, paymentMethod: e.target.value})}
                className="col-span-3"
                placeholder="Credit Card, Cash, etc."
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="revenue-notes" className="text-right">
                Notes
              </Label>
              <Textarea
                id="revenue-notes"
                value={newRevenue.notes || ''}
                onChange={(e) => setNewRevenue({...newRevenue, notes: e.target.value})}
                className="col-span-3"
                placeholder="Optional notes"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowAddRevenue(false)}
              disabled={addRevenueMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddRevenue}
              disabled={addRevenueMutation.isPending}
            >
              {addRevenueMutation.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...</>
              ) : (
                <>Add Revenue</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Add Expense Dialog */}
      <Dialog open={showAddExpense} onOpenChange={setShowAddExpense}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Expense</DialogTitle>
            <DialogDescription>
              Add a new expense entry to the budget tracker.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="expense-name" className="text-right">
                Name
              </Label>
              <Input
                id="expense-name"
                value={newExpense.name}
                onChange={(e) => setNewExpense({...newExpense, name: e.target.value})}
                className="col-span-3"
                placeholder="Venue Rental"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="expense-category" className="text-right">
                Category
              </Label>
              <Select 
                value={newExpense.category}
                onValueChange={(value: any) => setNewExpense({...newExpense, category: value})}
              >
                <SelectTrigger id="expense-category" className="col-span-3">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {expenseCategoryOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="expense-amount" className="text-right">
                Amount
              </Label>
              <Input
                id="expense-amount"
                type="number"
                step="0.01"
                min="0"
                value={newExpense.amount || ''}
                onChange={(e) => setNewExpense({...newExpense, amount: parseFloat(e.target.value) || 0})}
                className="col-span-3"
                placeholder="100.00"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="expense-date" className="text-right">
                Date
              </Label>
              <Input
                id="expense-date"
                type="date"
                value={newExpense.date}
                onChange={(e) => setNewExpense({...newExpense, date: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="expense-vendor" className="text-right">
                Vendor
              </Label>
              <Input
                id="expense-vendor"
                value={newExpense.vendor || ''}
                onChange={(e) => setNewExpense({...newExpense, vendor: e.target.value})}
                className="col-span-3"
                placeholder="Vendor name"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="expense-payment-method" className="text-right">
                Payment Method
              </Label>
              <Input
                id="expense-payment-method"
                value={newExpense.paymentMethod || ''}
                onChange={(e) => setNewExpense({...newExpense, paymentMethod: e.target.value})}
                className="col-span-3"
                placeholder="Credit Card, Cash, etc."
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <div className="text-right">
                <Label>Payment Status</Label>
              </div>
              <div className="col-span-3">
                <RadioGroup 
                  value={newExpense.paid ? "paid" : "pending"}
                  onValueChange={(value) => setNewExpense({...newExpense, paid: value === "paid"})}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="paid" id="paid" />
                    <Label htmlFor="paid">Paid</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="pending" id="pending" />
                    <Label htmlFor="pending">Pending</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="expense-notes" className="text-right">
                Notes
              </Label>
              <Textarea
                id="expense-notes"
                value={newExpense.notes || ''}
                onChange={(e) => setNewExpense({...newExpense, notes: e.target.value})}
                className="col-span-3"
                placeholder="Optional notes"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowAddExpense(false)}
              disabled={addExpenseMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddExpense}
              disabled={addExpenseMutation.isPending}
            >
              {addExpenseMutation.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...</>
              ) : (
                <>Add Expense</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={!!showDeleteConfirm} onOpenChange={(open) => !open && setShowDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this {showDeleteConfirm?.type} item? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteConfirm(null)}
              disabled={deleteItemMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteItem}
              disabled={deleteItemMutation.isPending}
            >
              {deleteItemMutation.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...</>
              ) : (
                <>Delete</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Import Shopify Dialog */}
      <Dialog open={isMergingShopify} onOpenChange={setIsMergingShopify}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Import from Shopify</DialogTitle>
            <DialogDescription>
              Import registration and merchandise revenue from Shopify orders.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {isLoadingShopify ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : shopifyData?.orders?.length ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Found {shopifyData.orders.length} Shopify orders</span>
                  <Badge>{formatCurrency(shopifyData.totalAmount || 0)}</Badge>
                </div>
                
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {shopifyData.orders.slice(0, 5).map((order: any) => (
                        <TableRow key={order.id}>
                          <TableCell>#{order.name}</TableCell>
                          <TableCell>{order.customer?.name || 'N/A'}</TableCell>
                          <TableCell>{formatDate(order.created_at)}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(order.total_price)}
                          </TableCell>
                        </TableRow>
                      ))}
                      {shopifyData.orders.length > 5 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground">
                            And {shopifyData.orders.length - 5} more orders...
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p>No new Shopify orders found for this camp.</p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMergingShopify(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleImportShopify}
              disabled={importShopifyMutation.isPending || !shopifyData?.orders?.length}
            >
              {importShopifyMutation.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Importing...</>
              ) : (
                <>Import Orders</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default BudgetTracker;