import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  AreaChart, Area, 
  BarChart, Bar, 
  LineChart, Line, 
  PieChart, Pie, Cell,
  ComposedChart, Scatter,
  ResponsiveContainer, 
  XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend 
} from "recharts";
import { addDays, format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default function Analytics() {
  const [dateRange, setDateRange] = useState({
    from: addDays(new Date(), -30),
    to: new Date(),
  });
  
  const [segmentBy, setSegmentBy] = useState("month");

  // Revenue Trend Data
  const { data: revenueTrendData, isLoading: revenueTrendLoading } = useQuery({
    queryKey: ['/api/analytics/revenue-trend', dateRange, segmentBy],
    refetchInterval: false,
    refetchOnWindowFocus: false,
  });

  // Customer Acquisition Data
  const { data: customerAcquisitionData, isLoading: customerAcquisitionLoading } = useQuery({
    queryKey: ['/api/analytics/customer-acquisition', dateRange, segmentBy],
    refetchInterval: false,
    refetchOnWindowFocus: false,
  });

  // Conversion Funnel Data
  const { data: conversionFunnelData, isLoading: conversionFunnelLoading } = useQuery({
    queryKey: ['/api/analytics/conversion-funnel', dateRange],
    refetchInterval: false,
    refetchOnWindowFocus: false,
  });

  // Sample data - would normally come from the API
  const sampleRevenueTrend = [
    { name: "Jan", revenue: 28000, expenses: 18000, profit: 10000 },
    { name: "Feb", revenue: 32000, expenses: 20000, profit: 12000 },
    { name: "Mar", revenue: 35000, expenses: 22000, profit: 13000 },
    { name: "Apr", revenue: 30000, expenses: 19000, profit: 11000 },
    { name: "May", revenue: 40000, expenses: 24000, profit: 16000 },
    { name: "Jun", revenue: 45000, expenses: 26000, profit: 19000 },
  ];

  const sampleCustomerAcquisition = [
    { name: "Jan", newCustomers: 35, returningCustomers: 65 },
    { name: "Feb", newCustomers: 40, returningCustomers: 70 },
    { name: "Mar", newCustomers: 38, returningCustomers: 72 },
    { name: "Apr", newCustomers: 45, returningCustomers: 68 },
    { name: "May", newCustomers: 48, returningCustomers: 75 },
    { name: "Jun", newCustomers: 52, returningCustomers: 78 },
  ];

  const sampleConversionFunnel = [
    { name: "Visitors", value: 5000 },
    { name: "Leads", value: 2500 },
    { name: "Qualified", value: 1200 },
    { name: "Proposals", value: 600 },
    { name: "Sales", value: 300 },
  ];

  const revenueTrend = revenueTrendData?.data || sampleRevenueTrend;
  const customerAcquisition = customerAcquisitionData?.data || sampleCustomerAcquisition;
  const conversionFunnel = conversionFunnelData?.data || sampleConversionFunnel;

  const COLORS = ['#0ea5e9', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444'];

  return (
    <>
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-800 py-4 px-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">Analytics</h1>
          
          <div className="flex items-center gap-3">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-[260px] justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} -{" "}
                        {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
            
            <Select
              value={segmentBy}
              onValueChange={setSegmentBy}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Segment by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Day</SelectItem>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="month">Month</SelectItem>
                <SelectItem value="quarter">Quarter</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <Tabs defaultValue="overview">
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
            <TabsTrigger value="conversion">Conversion</TabsTrigger>
          </TabsList>
          
          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(210000)}</div>
                  <p className="text-xs font-medium text-green-500 mt-1 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                      <path d="m6 9 6-6 6 6"></path><path d="M6 12h12"></path><path d="m6 15 6 6 6-6"></path>
                    </svg>
                    <span>12.5% from previous period</span>
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">New Customers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">258</div>
                  <p className="text-xs font-medium text-green-500 mt-1 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                      <path d="m6 9 6-6 6 6"></path><path d="M6 12h12"></path><path d="m6 15 6 6 6-6"></path>
                    </svg>
                    <span>8.3% from previous period</span>
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Conversion Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">6.8%</div>
                  <p className="text-xs font-medium text-red-500 mt-1 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                      <path d="m6 15 6 6 6-6"></path><path d="M6 12h12"></path><path d="m6 9 6-6 6 6"></path>
                    </svg>
                    <span>1.2% from previous period</span>
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Average Order Value</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(1250)}</div>
                  <p className="text-xs font-medium text-green-500 mt-1 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                      <path d="m6 9 6-6 6 6"></path><path d="M6 12h12"></path><path d="m6 15 6 6 6-6"></path>
                    </svg>
                    <span>3.7% from previous period</span>
                  </p>
                </CardContent>
              </Card>
            </div>
            
            {/* Revenue Trend Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Revenue Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={revenueTrend}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis yAxisId="left" orientation="left" tickFormatter={(value) => `$${value / 1000}k`} />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip formatter={(value, name) => {
                        if (name === "revenue" || name === "expenses" || name === "profit") {
                          return formatCurrency(Number(value));
                        }
                        return value;
                      }} />
                      <Legend />
                      <Area yAxisId="left" type="monotone" dataKey="revenue" fill="#0ea5e9" stroke="#0ea5e9" name="Revenue" />
                      <Bar yAxisId="left" dataKey="expenses" barSize={20} fill="#f59e0b" name="Expenses" />
                      <Line yAxisId="left" type="monotone" dataKey="profit" stroke="#10b981" name="Profit" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Customer Acquisition Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Customer Acquisition</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={customerAcquisition}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="newCustomers" stackId="a" fill="#0ea5e9" name="New Customers" />
                        <Bar dataKey="returningCustomers" stackId="a" fill="#8b5cf6" name="Returning Customers" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              {/* Conversion Funnel Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Conversion Funnel</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={conversionFunnel}
                        layout="vertical"
                        margin={{ top: 20, right: 30, left: 80, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="name" />
                        <Tooltip />
                        <Bar dataKey="value" fill="#0ea5e9">
                          {conversionFunnel.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Revenue Tab */}
          <TabsContent value="revenue" className="space-y-6">
            {/* Revenue by Product Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Revenue by Product</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: "Premium Package", value: 35000 },
                          { name: "Standard Package", value: 25000 },
                          { name: "Basic Package", value: 18000 },
                          { name: "Coaching Sessions", value: 12000 },
                          { name: "Custom Solutions", value: 8000 },
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {
                          [
                            { name: "Premium Package", value: 35000 },
                            { name: "Standard Package", value: 25000 },
                            { name: "Basic Package", value: 18000 },
                            { name: "Coaching Sessions", value: 12000 },
                            { name: "Custom Solutions", value: 8000 },
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))
                        }
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            {/* Monthly Revenue Comparison */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Monthly Revenue Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: "Jan", thisYear: 28000, lastYear: 22000 },
                        { name: "Feb", thisYear: 32000, lastYear: 25000 },
                        { name: "Mar", thisYear: 35000, lastYear: 28000 },
                        { name: "Apr", thisYear: 30000, lastYear: 26000 },
                        { name: "May", thisYear: 40000, lastYear: 30000 },
                        { name: "Jun", thisYear: 45000, lastYear: 32000 },
                      ]}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis tickFormatter={(value) => `$${value / 1000}k`} />
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Legend />
                      <Bar dataKey="thisYear" fill="#0ea5e9" name="This Year" />
                      <Bar dataKey="lastYear" fill="#9ca3af" name="Last Year" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            {/* Revenue Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Revenue Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left p-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Metric</th>
                        <th className="text-left p-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Current Period</th>
                        <th className="text-left p-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Previous Period</th>
                        <th className="text-left p-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Change</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      <tr>
                        <td className="p-4 text-sm font-medium text-gray-900 dark:text-gray-100">Total Revenue</td>
                        <td className="p-4 text-sm text-gray-600 dark:text-gray-300">{formatCurrency(210000)}</td>
                        <td className="p-4 text-sm text-gray-600 dark:text-gray-300">{formatCurrency(186000)}</td>
                        <td className="p-4 text-sm text-green-600">+12.9%</td>
                      </tr>
                      <tr>
                        <td className="p-4 text-sm font-medium text-gray-900 dark:text-gray-100">Average Order Value</td>
                        <td className="p-4 text-sm text-gray-600 dark:text-gray-300">{formatCurrency(1250)}</td>
                        <td className="p-4 text-sm text-gray-600 dark:text-gray-300">{formatCurrency(1180)}</td>
                        <td className="p-4 text-sm text-green-600">+5.9%</td>
                      </tr>
                      <tr>
                        <td className="p-4 text-sm font-medium text-gray-900 dark:text-gray-100">Total Orders</td>
                        <td className="p-4 text-sm text-gray-600 dark:text-gray-300">168</td>
                        <td className="p-4 text-sm text-gray-600 dark:text-gray-300">157</td>
                        <td className="p-4 text-sm text-green-600">+7.0%</td>
                      </tr>
                      <tr>
                        <td className="p-4 text-sm font-medium text-gray-900 dark:text-gray-100">Refund Rate</td>
                        <td className="p-4 text-sm text-gray-600 dark:text-gray-300">2.4%</td>
                        <td className="p-4 text-sm text-gray-600 dark:text-gray-300">3.2%</td>
                        <td className="p-4 text-sm text-green-600">-25.0%</td>
                      </tr>
                      <tr>
                        <td className="p-4 text-sm font-medium text-gray-900 dark:text-gray-100">Revenue per Customer</td>
                        <td className="p-4 text-sm text-gray-600 dark:text-gray-300">{formatCurrency(1950)}</td>
                        <td className="p-4 text-sm text-gray-600 dark:text-gray-300">{formatCurrency(1850)}</td>
                        <td className="p-4 text-sm text-green-600">+5.4%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Customers Tab */}
          <TabsContent value="customers" className="space-y-6">
            {/* Customer Growth Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Customer Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={[
                        { name: "Jan", customers: 350 },
                        { name: "Feb", customers: 390 },
                        { name: "Mar", customers: 430 },
                        { name: "Apr", customers: 480 },
                        { name: "May", customers: 520 },
                        { name: "Jun", customers: 570 },
                      ]}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="customers" stroke="#0ea5e9" activeDot={{ r: 8 }} name="Total Customers" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Customer Acquisition Source */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Customer Acquisition Source</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: "Website", value: 35 },
                            { name: "Referral", value: 25 },
                            { name: "Social Media", value: 20 },
                            { name: "Email Campaign", value: 15 },
                            { name: "Other", value: 5 },
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {
                            [
                              { name: "Website", value: 35 },
                              { name: "Referral", value: 25 },
                              { name: "Social Media", value: 20 },
                              { name: "Email Campaign", value: 15 },
                              { name: "Other", value: 5 },
                            ].map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))
                          }
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              {/* Customer Retention */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Customer Retention Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={[
                          { name: "Jan", retention: 75 },
                          { name: "Feb", retention: 78 },
                          { name: "Mar", retention: 76 },
                          { name: "Apr", retention: 80 },
                          { name: "May", retention: 82 },
                          { name: "Jun", retention: 85 },
                        ]}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis domain={[60, 100]} />
                        <Tooltip formatter={(value) => `${value}%`} />
                        <Line type="monotone" dataKey="retention" stroke="#10b981" activeDot={{ r: 8 }} name="Retention Rate" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Customer Segmentation */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Customer Segmentation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left p-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Segment</th>
                        <th className="text-left p-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Customers</th>
                        <th className="text-left p-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Revenue</th>
                        <th className="text-left p-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Avg. Order Value</th>
                        <th className="text-left p-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Retention Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      <tr>
                        <td className="p-4 text-sm font-medium text-gray-900 dark:text-gray-100">Premium</td>
                        <td className="p-4 text-sm text-gray-600 dark:text-gray-300">85</td>
                        <td className="p-4 text-sm text-gray-600 dark:text-gray-300">{formatCurrency(76500)}</td>
                        <td className="p-4 text-sm text-gray-600 dark:text-gray-300">{formatCurrency(2850)}</td>
                        <td className="p-4 text-sm text-gray-600 dark:text-gray-300">92%</td>
                      </tr>
                      <tr>
                        <td className="p-4 text-sm font-medium text-gray-900 dark:text-gray-100">Standard</td>
                        <td className="p-4 text-sm text-gray-600 dark:text-gray-300">168</td>
                        <td className="p-4 text-sm text-gray-600 dark:text-gray-300">{formatCurrency(84000)}</td>
                        <td className="p-4 text-sm text-gray-600 dark:text-gray-300">{formatCurrency(1250)}</td>
                        <td className="p-4 text-sm text-gray-600 dark:text-gray-300">85%</td>
                      </tr>
                      <tr>
                        <td className="p-4 text-sm font-medium text-gray-900 dark:text-gray-100">Basic</td>
                        <td className="p-4 text-sm text-gray-600 dark:text-gray-300">245</td>
                        <td className="p-4 text-sm text-gray-600 dark:text-gray-300">{formatCurrency(49500)}</td>
                        <td className="p-4 text-sm text-gray-600 dark:text-gray-300">{formatCurrency(650)}</td>
                        <td className="p-4 text-sm text-gray-600 dark:text-gray-300">78%</td>
                      </tr>
                      <tr>
                        <td className="p-4 text-sm font-medium text-gray-900 dark:text-gray-100">One-time</td>
                        <td className="p-4 text-sm text-gray-600 dark:text-gray-300">72</td>
                        <td className="p-4 text-sm text-gray-600 dark:text-gray-300">{formatCurrency(12600)}</td>
                        <td className="p-4 text-sm text-gray-600 dark:text-gray-300">{formatCurrency(350)}</td>
                        <td className="p-4 text-sm text-gray-600 dark:text-gray-300">42%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Conversion Tab */}
          <TabsContent value="conversion" className="space-y-6">
            {/* Conversion Funnel */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Conversion Funnel</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      layout="vertical"
                      data={conversionFunnel}
                      margin={{ top: 20, right: 80, bottom: 20, left: 100 }}
                    >
                      <CartesianGrid stroke="#f5f5f5" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" barSize={20} fill="#0ea5e9" name="Number of People">
                        {conversionFunnel.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                      <Line dataKey="value" type="monotone" stroke="#ff7300" name="Funnel Stage" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Visitor to Lead</h4>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">50.0%</p>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">2,500 of 5,000 visitors</p>
                  </div>
                  
                  <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Lead to Qualified</h4>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">48.0%</p>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">1,200 of 2,500 leads</p>
                  </div>
                  
                  <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Qualified to Proposal</h4>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">50.0%</p>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">600 of 1,200 qualified</p>
                  </div>
                  
                  <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Proposal to Sale</h4>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">50.0%</p>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">300 of 600 proposals</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Conversion by Source */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Conversion Rate by Source</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: "Website", rate: 6.3 },
                        { name: "Referral", rate: 8.5 },
                        { name: "Social Media", rate: 4.2 },
                        { name: "Email Campaign", rate: 7.8 },
                        { name: "Trade Show", rate: 5.6 },
                      ]}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis tickFormatter={(value) => `${value}%`} />
                      <Tooltip formatter={(value) => `${value}%`} />
                      <Bar dataKey="rate" fill="#0ea5e9" name="Conversion Rate">
                        {[
                          { name: "Website", rate: 6.3 },
                          { name: "Referral", rate: 8.5 },
                          { name: "Social Media", rate: 4.2 },
                          { name: "Email Campaign", rate: 7.8 },
                          { name: "Trade Show", rate: 5.6 },
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            {/* Conversion Over Time */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Conversion Rate Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={[
                        { name: "Jan", rate: 5.8 },
                        { name: "Feb", rate: 6.2 },
                        { name: "Mar", rate: 5.9 },
                        { name: "Apr", rate: 6.5 },
                        { name: "May", rate: 7.1 },
                        { name: "Jun", rate: 6.8 },
                      ]}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis domain={[4, 8]} tickFormatter={(value) => `${value}%`} />
                      <Tooltip formatter={(value) => `${value}%`} />
                      <Line type="monotone" dataKey="rate" stroke="#0ea5e9" activeDot={{ r: 8 }} name="Conversion Rate" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
