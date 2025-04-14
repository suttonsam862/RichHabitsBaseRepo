import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  DollarSign, 
  Plus,
  Search,
  Filter,
  Download,
  CreditCard,
  TrendingUp,
  TrendingDown,
  BarChart4,
  PieChart,
  Calendar,
  CalendarRange,
  Tag,
  Share2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";

// Sample data for the page
const sampleCampBudgets = [
  {
    id: 1,
    campId: 1,
    campName: "Summer Wrestling Camp 2025",
    startDate: "2025-06-15",
    endDate: "2025-06-22",
    totalBudget: 12500,
    usedBudget: 9850,
    status: "active",
    revenues: [
      { id: 1, description: "Participant Registration (45 x $250)", amount: 11250, date: "2025-05-30", category: "Registration" },
      { id: 2, description: "Equipment Sales", amount: 1850, date: "2025-06-18", category: "Merchandise" },
      { id: 3, description: "Sponsorship - Local Business", amount: 1000, date: "2025-04-12", category: "Sponsorship" }
    ],
    expenses: [
      { id: 1, description: "Venue Rental", amount: 3500, date: "2025-04-02", category: "Facility", status: "paid" },
      { id: 2, description: "Staff Salaries", amount: 4200, date: "2025-06-23", category: "Personnel", status: "pending" },
      { id: 3, description: "Transportation", amount: 850, date: "2025-06-14", category: "Travel", status: "paid" },
      { id: 4, description: "Accommodation", amount: 2800, date: "2025-06-14", category: "Lodging", status: "paid" },
      { id: 5, description: "Equipment", amount: 1200, date: "2025-05-20", category: "Supplies", status: "paid" },
      { id: 6, description: "Meals & Catering", amount: 3200, date: "2025-06-22", category: "Food", status: "pending" },
      { id: 7, description: "Marketing Materials", amount: 600, date: "2025-04-15", category: "Marketing", status: "paid" }
    ]
  },
  {
    id: 2,
    campId: 2,
    campName: "Spring Training Clinic",
    startDate: "2025-04-10",
    endDate: "2025-04-12",
    totalBudget: 5200,
    usedBudget: 4750,
    status: "active",
    revenues: [
      { id: 1, description: "Participant Registration (30 x $150)", amount: 4500, date: "2025-03-30", category: "Registration" },
      { id: 2, description: "Equipment Sales", amount: 950, date: "2025-04-11", category: "Merchandise" }
    ],
    expenses: [
      { id: 1, description: "Venue Rental", amount: 1200, date: "2025-03-15", category: "Facility", status: "paid" },
      { id: 2, description: "Staff Salaries", amount: 1800, date: "2025-04-13", category: "Personnel", status: "pending" },
      { id: 3, description: "Transportation", amount: 450, date: "2025-04-10", category: "Travel", status: "paid" },
      { id: 4, description: "Accommodation", amount: 900, date: "2025-04-09", category: "Lodging", status: "paid" },
      { id: 5, description: "Equipment", amount: 400, date: "2025-03-25", category: "Supplies", status: "paid" }
    ]
  },
  {
    id: 3,
    campId: 3,
    campName: "Winter Training Camp",
    startDate: "2025-01-05",
    endDate: "2025-01-10",
    totalBudget: 8900,
    usedBudget: 8900,
    status: "completed",
    revenues: [
      { id: 1, description: "Participant Registration (25 x $300)", amount: 7500, date: "2024-12-15", category: "Registration" },
      { id: 2, description: "Equipment Sales", amount: 1200, date: "2025-01-07", category: "Merchandise" },
      { id: 3, description: "Sponsorship - Sports Brand", amount: 1500, date: "2024-11-20", category: "Sponsorship" }
    ],
    expenses: [
      { id: 1, description: "Venue Rental", amount: 2500, date: "2024-11-10", category: "Facility", status: "paid" },
      { id: 2, description: "Staff Salaries", amount: 3200, date: "2025-01-11", category: "Personnel", status: "paid" },
      { id: 3, description: "Transportation", amount: 750, date: "2025-01-05", category: "Travel", status: "paid" },
      { id: 4, description: "Accommodation", amount: 1500, date: "2025-01-04", category: "Lodging", status: "paid" },
      { id: 5, description: "Equipment", amount: 650, date: "2024-12-20", category: "Supplies", status: "paid" },
      { id: 6, description: "Meals & Catering", amount: 1800, date: "2025-01-10", category: "Food", status: "paid" }
    ]
  }
];

// Format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
};

// Format date
const formatDate = (dateString: string) => {
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
};

// Get status badge color
const getStatusColor = (status: string) => {
  switch(status.toLowerCase()) {
    case 'paid':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    case 'overdue':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    case 'active':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    case 'completed':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  }
};

// Calculate total revenue
const calculateTotalRevenue = (budget: any) => {
  return budget.revenues.reduce((sum: number, item: any) => sum + item.amount, 0);
};

// Calculate total expenses
const calculateTotalExpenses = (budget: any) => {
  return budget.expenses.reduce((sum: number, item: any) => sum + item.amount, 0);
};

// Calculate profit or loss
const calculateProfitLoss = (budget: any) => {
  const totalRevenue = calculateTotalRevenue(budget);
  const totalExpenses = calculateTotalExpenses(budget);
  return totalRevenue - totalExpenses;
};

// Budget Summary Card
const BudgetSummaryCard = ({ budget }: { budget: any }) => {
  const totalRevenue = calculateTotalRevenue(budget);
  const totalExpenses = calculateTotalExpenses(budget);
  const profitLoss = calculateProfitLoss(budget);
  const budgetUtilization = (totalExpenses / budget.totalBudget) * 100;
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex justify-between items-center">
          <span>Budget Summary</span>
          <Badge className={getStatusColor(budget.status)}>
            {budget.status.charAt(0).toUpperCase() + budget.status.slice(1)}
          </Badge>
        </CardTitle>
        <CardDescription>
          {formatDate(budget.startDate)} to {formatDate(budget.endDate)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="text-sm font-medium text-gray-500 mb-1">Total Budget</div>
            <div className="text-2xl font-bold">{formatCurrency(budget.totalBudget)}</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="text-sm font-medium text-gray-500 mb-1">Used Budget</div>
            <div className="text-2xl font-bold">{formatCurrency(totalExpenses)}</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="text-sm font-medium text-gray-500 mb-1">Remaining</div>
            <div className="text-2xl font-bold">{formatCurrency(budget.totalBudget - totalExpenses)}</div>
          </div>
        </div>
        
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Budget Utilization</span>
            <span className="text-sm font-medium">{budgetUtilization.toFixed(1)}%</span>
          </div>
          <Progress value={budgetUtilization} className="h-2" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border border-gray-200 rounded-md">
            <div className="flex items-center mb-1">
              <TrendingUp className="h-4 w-4 mr-2 text-green-600" />
              <span className="text-sm font-medium">Revenue</span>
            </div>
            <div className="text-xl font-bold">{formatCurrency(totalRevenue)}</div>
          </div>
          <div className="p-4 border border-gray-200 rounded-md">
            <div className="flex items-center mb-1">
              <TrendingDown className="h-4 w-4 mr-2 text-red-600" />
              <span className="text-sm font-medium">Expenses</span>
            </div>
            <div className="text-xl font-bold">{formatCurrency(totalExpenses)}</div>
          </div>
          <div className={`p-4 border border-gray-200 rounded-md ${profitLoss >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
            <div className="flex items-center mb-1">
              <DollarSign className={`h-4 w-4 mr-2 ${profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              <span className="text-sm font-medium">{profitLoss >= 0 ? 'Profit' : 'Loss'}</span>
            </div>
            <div className={`text-xl font-bold ${profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(Math.abs(profitLoss))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function FinancialManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [campFilter, setCampFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedBudget, setSelectedBudget] = useState<any>(sampleCampBudgets[0]);
  
  // In a real app, you would fetch budgets from the server
  const { data: budgets = sampleCampBudgets, isLoading } = useQuery({
    queryKey: ['/api/budgets'],
    enabled: false, // Disabled for now as we're using sample data
  });
  
  // Filter budgets based on search term and camp filter
  const filteredBudgets = budgets.filter((budget: any) => {
    const matchesSearch = budget.campName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCamp = campFilter === "all" || budget.campId.toString() === campFilter;
    return matchesSearch && matchesCamp;
  });
  
  // Get unique camps for filter
  const uniqueCamps = Array.from(
    new Map(budgets.map(item => [item.campId, { id: item.campId, name: item.campName }])).values()
  );
  
  // Get categories for filter
  const expenseCategories = [
    "All Categories",
    "Facility",
    "Personnel",
    "Travel",
    "Lodging",
    "Supplies",
    "Food",
    "Marketing"
  ];
  
  // Filter expenses based on category
  const filteredExpenses = selectedBudget?.expenses.filter((expense: any) => {
    return categoryFilter === "all" || expense.category.toLowerCase() === categoryFilter.toLowerCase();
  });

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Financial Management</h1>
          <p className="text-gray-500 mt-1">Track budgets, expenses, and revenues for all camps</p>
        </div>
        <div className="mt-4 md:mt-0 space-x-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Reports
          </Button>
          <Button className="bg-brand-600 hover:bg-brand-700">
            <Plus className="mr-2 h-4 w-4" />
            Add Expense
          </Button>
        </div>
      </div>
      
      {/* Filters Row */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-grow md:max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search budgets..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Select value={campFilter} onValueChange={setCampFilter}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Filter by camp" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Camps</SelectItem>
            {uniqueCamps.map((camp: any) => (
              <SelectItem key={camp.id} value={camp.id.toString()}>{camp.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Button variant="outline" className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          More Filters
        </Button>
        
        <Button variant="outline" className="flex items-center gap-2">
          <BarChart4 className="h-4 w-4" />
          Analytics
        </Button>
      </div>

      {/* Main Content with Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Budget Overview</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>
        
        {/* Budget Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Budget Selection */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Select Budget</CardTitle>
              <CardDescription>Choose a camp to view its financial details</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-medium">Camp Name</th>
                      <th className="text-left p-4 font-medium">Date Range</th>
                      <th className="text-left p-4 font-medium">Total Budget</th>
                      <th className="text-left p-4 font-medium">Used</th>
                      <th className="text-left p-4 font-medium">Status</th>
                      <th className="text-right p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBudgets.map((budget: any) => (
                      <tr 
                        key={budget.id} 
                        className={`border-b hover:bg-gray-50 cursor-pointer ${selectedBudget?.id === budget.id ? 'bg-gray-50' : ''}`}
                        onClick={() => setSelectedBudget(budget)}
                      >
                        <td className="p-4 font-medium">{budget.campName}</td>
                        <td className="p-4">
                          {formatDate(budget.startDate)} - {formatDate(budget.endDate)}
                        </td>
                        <td className="p-4">{formatCurrency(budget.totalBudget)}</td>
                        <td className="p-4">
                          <div className="flex items-center">
                            <div className="w-24 bg-gray-200 rounded-full h-2.5 mr-2">
                              <div 
                                className="bg-brand-600 h-2.5 rounded-full" 
                                style={{ width: `${(budget.usedBudget / budget.totalBudget) * 100}%` }}
                              ></div>
                            </div>
                            <span>{((budget.usedBudget / budget.totalBudget) * 100).toFixed(0)}%</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge className={getStatusColor(budget.status)}>
                            {budget.status.charAt(0).toUpperCase() + budget.status.slice(1)}
                          </Badge>
                        </td>
                        <td className="p-4 text-right">
                          <Button variant="ghost" size="sm">View</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
          
          {/* Selected Budget Details */}
          {selectedBudget && (
            <>
              <BudgetSummaryCard budget={selectedBudget} />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Revenue Summary */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center">
                      <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                      Revenue Summary
                    </CardTitle>
                    <CardDescription>Total: {formatCurrency(calculateTotalRevenue(selectedBudget))}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-4 font-medium">Description</th>
                            <th className="text-left p-4 font-medium">Category</th>
                            <th className="text-left p-4 font-medium">Date</th>
                            <th className="text-right p-4 font-medium">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedBudget.revenues.map((revenue: any) => (
                            <tr key={revenue.id} className="border-b hover:bg-gray-50">
                              <td className="p-4">{revenue.description}</td>
                              <td className="p-4">
                                <Badge variant="outline" className="font-normal">
                                  {revenue.category}
                                </Badge>
                              </td>
                              <td className="p-4">{formatDate(revenue.date)}</td>
                              <td className="p-4 text-right font-medium text-green-600">
                                {formatCurrency(revenue.amount)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end gap-2 bg-gray-50 p-2">
                    <Button variant="ghost" size="sm">
                      Add Revenue
                    </Button>
                  </CardFooter>
                </Card>
                
                {/* Expense Summary */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center">
                      <TrendingDown className="h-5 w-5 mr-2 text-red-600" />
                      Expense Summary
                    </CardTitle>
                    <CardDescription>Total: {formatCurrency(calculateTotalExpenses(selectedBudget))}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-4 font-medium">Description</th>
                            <th className="text-left p-4 font-medium">Category</th>
                            <th className="text-left p-4 font-medium">Status</th>
                            <th className="text-right p-4 font-medium">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedBudget.expenses.slice(0, 5).map((expense: any) => (
                            <tr key={expense.id} className="border-b hover:bg-gray-50">
                              <td className="p-4">{expense.description}</td>
                              <td className="p-4">
                                <Badge variant="outline" className="font-normal">
                                  {expense.category}
                                </Badge>
                              </td>
                              <td className="p-4">
                                <Badge className={getStatusColor(expense.status)}>
                                  {expense.status.charAt(0).toUpperCase() + expense.status.slice(1)}
                                </Badge>
                              </td>
                              <td className="p-4 text-right font-medium text-red-600">
                                {formatCurrency(expense.amount)}
                              </td>
                            </tr>
                          ))}
                          {selectedBudget.expenses.length > 5 && (
                            <tr>
                              <td colSpan={4} className="p-4 text-center">
                                <Button variant="link" size="sm">
                                  View all {selectedBudget.expenses.length} expenses
                                </Button>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end gap-2 bg-gray-50 p-2">
                    <Button variant="ghost" size="sm">
                      Add Expense
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </>
          )}
        </TabsContent>
        
        {/* Expenses Tab */}
        <TabsContent value="expenses" className="space-y-6">
          {selectedBudget && (
            <>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>All Expenses</CardTitle>
                  <CardDescription>
                    {selectedBudget.campName} - {formatDate(selectedBudget.startDate)} to {formatDate(selectedBudget.endDate)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row gap-4 mb-4">
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger className="w-full md:w-[200px]">
                        <SelectValue placeholder="Filter by category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {expenseCategories.slice(1).map((category) => (
                          <SelectItem key={category} value={category.toLowerCase()}>{category}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Select defaultValue="all">
                      <SelectTrigger className="w-full md:w-[200px]">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select defaultValue="date-desc">
                      <SelectTrigger className="w-full md:w-[200px]">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="date-desc">Date (Newest First)</SelectItem>
                        <SelectItem value="date-asc">Date (Oldest First)</SelectItem>
                        <SelectItem value="amount-desc">Amount (Highest First)</SelectItem>
                        <SelectItem value="amount-asc">Amount (Lowest First)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3 font-medium">Description</th>
                          <th className="text-left p-3 font-medium">Category</th>
                          <th className="text-left p-3 font-medium">Date</th>
                          <th className="text-left p-3 font-medium">Status</th>
                          <th className="text-right p-3 font-medium">Amount</th>
                          <th className="text-right p-3 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredExpenses.map((expense: any) => (
                          <tr key={expense.id} className="border-b hover:bg-gray-50">
                            <td className="p-3">{expense.description}</td>
                            <td className="p-3">
                              <Badge variant="outline" className="font-normal">
                                {expense.category}
                              </Badge>
                            </td>
                            <td className="p-3">{formatDate(expense.date)}</td>
                            <td className="p-3">
                              <Badge className={getStatusColor(expense.status)}>
                                {expense.status.charAt(0).toUpperCase() + expense.status.slice(1)}
                              </Badge>
                            </td>
                            <td className="p-3 text-right font-medium text-red-600">
                              {formatCurrency(expense.amount)}
                            </td>
                            <td className="p-3 text-right">
                              <Button variant="ghost" size="sm">Edit</Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t bg-gray-50">
                          <td colSpan={4} className="p-3 font-medium text-right">Total:</td>
                          <td className="p-3 font-bold text-right text-red-600">
                            {formatCurrency(filteredExpenses.reduce((sum: number, item: any) => sum + item.amount, 0))}
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between gap-2 bg-gray-50">
                  <div className="text-sm text-gray-500">
                    Showing {filteredExpenses.length} of {selectedBudget.expenses.length} expenses
                  </div>
                  <Button size="sm" className="bg-brand-600 hover:bg-brand-700">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Expense
                  </Button>
                </CardFooter>
              </Card>
            </>
          )}
        </TabsContent>
        
        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-6">
          {selectedBudget && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Revenue Tracking</CardTitle>
                <CardDescription>
                  {selectedBudget.campName} - {formatDate(selectedBudget.startDate)} to {formatDate(selectedBudget.endDate)}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gray-50 p-4 rounded-md">
                    <div className="text-sm font-medium text-gray-500 mb-1">Total Revenue</div>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(calculateTotalRevenue(selectedBudget))}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <div className="text-sm font-medium text-gray-500 mb-1">Total Expenses</div>
                    <div className="text-2xl font-bold text-red-600">
                      {formatCurrency(calculateTotalExpenses(selectedBudget))}
                    </div>
                  </div>
                  <div className={`bg-gray-50 p-4 rounded-md ${calculateProfitLoss(selectedBudget) >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                    <div className="text-sm font-medium text-gray-500 mb-1">Net Profit/Loss</div>
                    <div className={`text-2xl font-bold ${calculateProfitLoss(selectedBudget) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(calculateProfitLoss(selectedBudget))}
                    </div>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-medium">Description</th>
                        <th className="text-left p-3 font-medium">Category</th>
                        <th className="text-left p-3 font-medium">Date</th>
                        <th className="text-right p-3 font-medium">Amount</th>
                        <th className="text-right p-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedBudget.revenues.map((revenue: any) => (
                        <tr key={revenue.id} className="border-b hover:bg-gray-50">
                          <td className="p-3">{revenue.description}</td>
                          <td className="p-3">
                            <Badge variant="outline" className="font-normal">
                              {revenue.category}
                            </Badge>
                          </td>
                          <td className="p-3">{formatDate(revenue.date)}</td>
                          <td className="p-3 text-right font-medium text-green-600">
                            {formatCurrency(revenue.amount)}
                          </td>
                          <td className="p-3 text-right">
                            <Button variant="ghost" size="sm">Edit</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t bg-gray-50">
                        <td colSpan={3} className="p-3 font-medium text-right">Total:</td>
                        <td className="p-3 font-bold text-right text-green-600">
                          {formatCurrency(calculateTotalRevenue(selectedBudget))}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2 bg-gray-50">
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
                <Button size="sm" className="bg-brand-600 hover:bg-brand-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Revenue
                </Button>
              </CardFooter>
            </Card>
          )}
        </TabsContent>
        
        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Financial Reports</CardTitle>
              <CardDescription>
                Generate and download financial reports for your camps
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <BarChart4 className="h-5 w-5 mr-2 text-brand-600" />
                      Budget vs. Actual
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <p className="text-sm text-gray-500 mb-4">
                      Compare planned budget against actual spending across categories
                    </p>
                    <Button variant="outline" size="sm" className="w-full">
                      <Download className="mr-2 h-4 w-4" />
                      Generate Report
                    </Button>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <PieChart className="h-5 w-5 mr-2 text-brand-600" />
                      Expense Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <p className="text-sm text-gray-500 mb-4">
                      Detailed breakdown of expenses by category with visualizations
                    </p>
                    <Button variant="outline" size="sm" className="w-full">
                      <Download className="mr-2 h-4 w-4" />
                      Generate Report
                    </Button>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <CalendarRange className="h-5 w-5 mr-2 text-brand-600" />
                      Historical Comparison
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <p className="text-sm text-gray-500 mb-4">
                      Compare financial performance with previous camp sessions
                    </p>
                    <Button variant="outline" size="sm" className="w-full">
                      <Download className="mr-2 h-4 w-4" />
                      Generate Report
                    </Button>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <Tag className="h-5 w-5 mr-2 text-brand-600" />
                      Cost Per Participant
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <p className="text-sm text-gray-500 mb-4">
                      Analyze cost efficiency by calculating expenses per participant
                    </p>
                    <Button variant="outline" size="sm" className="w-full">
                      <Download className="mr-2 h-4 w-4" />
                      Generate Report
                    </Button>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <CreditCard className="h-5 w-5 mr-2 text-brand-600" />
                      Transaction History
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <p className="text-sm text-gray-500 mb-4">
                      Complete record of all financial transactions with details
                    </p>
                    <Button variant="outline" size="sm" className="w-full">
                      <Download className="mr-2 h-4 w-4" />
                      Generate Report
                    </Button>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <Share2 className="h-5 w-5 mr-2 text-brand-600" />
                      Stakeholder Report
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <p className="text-sm text-gray-500 mb-4">
                      Executive summary for stakeholders with key metrics and insights
                    </p>
                    <Button variant="outline" size="sm" className="w-full">
                      <Download className="mr-2 h-4 w-4" />
                      Generate Report
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2 bg-gray-50">
              <Button className="bg-brand-600 hover:bg-brand-700">
                Custom Report Builder
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}