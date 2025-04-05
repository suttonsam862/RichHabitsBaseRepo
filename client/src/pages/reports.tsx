import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell } from "recharts";
import { Download, ChevronDown } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export default function Reports() {
  const [dateRange, setDateRange] = useState("month");

  // Sales by Product Report
  const { data: salesByProductData, isLoading: salesByProductLoading } = useQuery({
    queryKey: ['/api/reports/sales-by-product', dateRange],
    refetchInterval: false,
    refetchOnWindowFocus: false,
  });

  // Sales by Channel Report
  const { data: salesByChannelData, isLoading: salesByChannelLoading } = useQuery({
    queryKey: ['/api/reports/sales-by-channel', dateRange],
    refetchInterval: false,
    refetchOnWindowFocus: false,
  });

  // Lead Conversion Report
  const { data: leadConversionData, isLoading: leadConversionLoading } = useQuery({
    queryKey: ['/api/reports/lead-conversion', dateRange],
    refetchInterval: false,
    refetchOnWindowFocus: false,
  });

  // Sample data (this would normally come from the API)
  const sampleSalesByProduct = [
    { name: "Premium Package", value: 35000 },
    { name: "Standard Package", value: 25000 },
    { name: "Basic Package", value: 18000 },
    { name: "Coaching Sessions", value: 12000 },
    { name: "Custom Solutions", value: 8000 },
  ];

  const sampleSalesByChannel = [
    { name: "Website", value: 45 },
    { name: "Referral", value: 25 },
    { name: "Social Media", value: 15 },
    { name: "Email Campaign", value: 10 },
    { name: "Other", value: 5 },
  ];

  const sampleLeadConversion = [
    { name: "Jan", leads: 45, conversions: 12 },
    { name: "Feb", leads: 52, conversions: 15 },
    { name: "Mar", leads: 48, conversions: 18 },
    { name: "Apr", leads: 70, conversions: 24 },
    { name: "May", leads: 55, conversions: 20 },
    { name: "Jun", leads: 60, conversions: 22 },
  ];

  const salesByProduct = salesByProductData?.data || sampleSalesByProduct;
  const salesByChannel = salesByChannelData?.data || sampleSalesByChannel;
  const leadConversion = leadConversionData?.data || sampleLeadConversion;

  const COLORS = ['#0ea5e9', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444'];

  const exportSalesReport = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.text("Rich Habits - Sales Report", 14, 22);
    
    // Add date
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()} | Period: ${dateRange}`, 14, 30);
    
    // Add sales by product table
    doc.setFontSize(14);
    doc.text("Sales by Product", 14, 45);
    
    const productTableColumn = ["Product", "Revenue"];
    const productTableRows = salesByProduct.map(item => [
      item.name,
      formatCurrency(item.value)
    ]);
    
    autoTable(doc, {
      head: [productTableColumn],
      body: productTableRows,
      startY: 50,
      theme: 'striped',
      headStyles: {
        fillColor: [14, 165, 233],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
    });
    
    // Add sales by channel table
    const finalY = (doc as any).lastAutoTable.finalY || 50;
    doc.setFontSize(14);
    doc.text("Sales by Channel", 14, finalY + 20);
    
    const channelTableColumn = ["Channel", "Percentage"];
    const channelTableRows = salesByChannel.map(item => [
      item.name,
      `${item.value}%`
    ]);
    
    autoTable(doc, {
      head: [channelTableColumn],
      body: channelTableRows,
      startY: finalY + 25,
      theme: 'striped',
      headStyles: {
        fillColor: [14, 165, 233],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
    });
    
    // Add lead conversion table
    const finalY2 = (doc as any).lastAutoTable.finalY || 50;
    doc.setFontSize(14);
    doc.text("Lead Conversion", 14, finalY2 + 20);
    
    const conversionTableColumn = ["Month", "Leads", "Conversions", "Rate"];
    const conversionTableRows = leadConversion.map(item => [
      item.name,
      item.leads,
      item.conversions,
      `${((item.conversions / item.leads) * 100).toFixed(1)}%`
    ]);
    
    autoTable(doc, {
      head: [conversionTableColumn],
      body: conversionTableRows,
      startY: finalY2 + 25,
      theme: 'striped',
      headStyles: {
        fillColor: [14, 165, 233],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
    });
    
    // Save PDF
    doc.save("rich-habits-sales-report.pdf");
  };

  return (
    <>
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-800 py-4 px-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">Reports</h1>
          
          <div className="flex items-center gap-3">
            <Select
              value={dateRange}
              onValueChange={setDateRange}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
            
            <Button onClick={exportSalesReport}>
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <Tabs defaultValue="sales">
          <TabsList className="mb-6">
            <TabsTrigger value="sales">Sales Reports</TabsTrigger>
            <TabsTrigger value="leads">Lead Reports</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>
          
          {/* Sales Reports Tab */}
          <TabsContent value="sales" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Sales by Product Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Sales by Product</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={salesByProduct}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis tickFormatter={(value) => `$${value / 1000}k`} />
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                        <Bar dataKey="value" fill="#0ea5e9">
                          {salesByProduct.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              {/* Sales by Channel Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Sales by Channel</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={salesByChannel}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {salesByChannel.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Sales Summary Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Sales Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left p-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Product</th>
                        <th className="text-left p-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Revenue</th>
                        <th className="text-left p-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Units Sold</th>
                        <th className="text-left p-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Avg. Price</th>
                        <th className="text-left p-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">% of Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      <tr>
                        <td className="p-4 text-sm font-medium text-gray-900 dark:text-gray-100">Premium Package</td>
                        <td className="p-4 text-sm text-gray-600 dark:text-gray-300">{formatCurrency(35000)}</td>
                        <td className="p-4 text-sm text-gray-600 dark:text-gray-300">14</td>
                        <td className="p-4 text-sm text-gray-600 dark:text-gray-300">{formatCurrency(2500)}</td>
                        <td className="p-4 text-sm text-gray-600 dark:text-gray-300">35.7%</td>
                      </tr>
                      <tr>
                        <td className="p-4 text-sm font-medium text-gray-900 dark:text-gray-100">Standard Package</td>
                        <td className="p-4 text-sm text-gray-600 dark:text-gray-300">{formatCurrency(25000)}</td>
                        <td className="p-4 text-sm text-gray-600 dark:text-gray-300">25</td>
                        <td className="p-4 text-sm text-gray-600 dark:text-gray-300">{formatCurrency(1000)}</td>
                        <td className="p-4 text-sm text-gray-600 dark:text-gray-300">25.5%</td>
                      </tr>
                      <tr>
                        <td className="p-4 text-sm font-medium text-gray-900 dark:text-gray-100">Basic Package</td>
                        <td className="p-4 text-sm text-gray-600 dark:text-gray-300">{formatCurrency(18000)}</td>
                        <td className="p-4 text-sm text-gray-600 dark:text-gray-300">36</td>
                        <td className="p-4 text-sm text-gray-600 dark:text-gray-300">{formatCurrency(500)}</td>
                        <td className="p-4 text-sm text-gray-600 dark:text-gray-300">18.4%</td>
                      </tr>
                      <tr>
                        <td className="p-4 text-sm font-medium text-gray-900 dark:text-gray-100">Coaching Sessions</td>
                        <td className="p-4 text-sm text-gray-600 dark:text-gray-300">{formatCurrency(12000)}</td>
                        <td className="p-4 text-sm text-gray-600 dark:text-gray-300">40</td>
                        <td className="p-4 text-sm text-gray-600 dark:text-gray-300">{formatCurrency(300)}</td>
                        <td className="p-4 text-sm text-gray-600 dark:text-gray-300">12.2%</td>
                      </tr>
                      <tr>
                        <td className="p-4 text-sm font-medium text-gray-900 dark:text-gray-100">Custom Solutions</td>
                        <td className="p-4 text-sm text-gray-600 dark:text-gray-300">{formatCurrency(8000)}</td>
                        <td className="p-4 text-sm text-gray-600 dark:text-gray-300">4</td>
                        <td className="p-4 text-sm text-gray-600 dark:text-gray-300">{formatCurrency(2000)}</td>
                        <td className="p-4 text-sm text-gray-600 dark:text-gray-300">8.2%</td>
                      </tr>
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                        <td className="p-4 text-sm font-medium text-gray-900 dark:text-gray-100">Total</td>
                        <td className="p-4 text-sm font-medium text-gray-900 dark:text-gray-100">{formatCurrency(98000)}</td>
                        <td className="p-4 text-sm font-medium text-gray-900 dark:text-gray-100">119</td>
                        <td className="p-4 text-sm font-medium text-gray-900 dark:text-gray-100">{formatCurrency(823.53)}</td>
                        <td className="p-4 text-sm font-medium text-gray-900 dark:text-gray-100">100%</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Lead Reports Tab */}
          <TabsContent value="leads" className="space-y-6">
            {/* Lead Conversion Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Lead Conversion Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={leadConversion}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Line yAxisId="left" type="monotone" dataKey="leads" stroke="#0ea5e9" activeDot={{ r: 8 }} name="Total Leads" />
                      <Line yAxisId="left" type="monotone" dataKey="conversions" stroke="#10b981" name="Conversions" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            {/* Lead Source Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Lead Source Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left p-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Lead Source</th>
                        <th className="text-left p-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Leads</th>
                        <th className="text-left p-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Qualified Leads</th>
                        <th className="text-left p-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Conversion Rate</th>
                        <th className="text-left p-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Avg. Sale Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      <tr>
                        <td className="p-4 text-sm font-medium text-gray-900 dark:text-gray-100">Website</td>
                        <td className="p-4 text-sm text-gray-600 dark:text-gray-300">120</td>
                        <td className="p-4 text-sm text-gray-600 dark:text-gray-300">45</td>
                        <td className="p-4 text-sm text-gray-600 dark:text-gray-300">37.5%</td>
                        <td className="p-4 text-sm text-gray-600 dark:text-gray-300">{formatCurrency(1250)}</td>
                      </tr>
                      <tr>
                        <td className="p-4 text-sm font-medium text-gray-900 dark:text-gray-100">Referral</td>
                        <td className="p-4 text-sm text-gray-600 dark:text-gray-300">85</td>
                        <td className="p-4 text-sm text-gray-600 dark:text-gray-300">52</td>
                        <td className="p-4 text-sm text-gray-600 dark:text-gray-300">61.2%</td>
                        <td className="p-4 text-sm text-gray-600 dark:text-gray-300">{formatCurrency(1850)}</td>
                      </tr>
                      <tr>
                        <td className="p-4 text-sm font-medium text-gray-900 dark:text-gray-100">Social Media</td>
                        <td className="p-4 text-sm text-gray-600 dark:text-gray-300">65</td>
                        <td className="p-4 text-sm text-gray-600 dark:text-gray-300">18</td>
                        <td className="p-4 text-sm text-gray-600 dark:text-gray-300">27.7%</td>
                        <td className="p-4 text-sm text-gray-600 dark:text-gray-300">{formatCurrency(950)}</td>
                      </tr>
                      <tr>
                        <td className="p-4 text-sm font-medium text-gray-900 dark:text-gray-100">Email Campaign</td>
                        <td className="p-4 text-sm text-gray-600 dark:text-gray-300">48</td>
                        <td className="p-4 text-sm text-gray-600 dark:text-gray-300">16</td>
                        <td className="p-4 text-sm text-gray-600 dark:text-gray-300">33.3%</td>
                        <td className="p-4 text-sm text-gray-600 dark:text-gray-300">{formatCurrency(1025)}</td>
                      </tr>
                      <tr>
                        <td className="p-4 text-sm font-medium text-gray-900 dark:text-gray-100">Trade Show</td>
                        <td className="p-4 text-sm text-gray-600 dark:text-gray-300">32</td>
                        <td className="p-4 text-sm text-gray-600 dark:text-gray-300">12</td>
                        <td className="p-4 text-sm text-gray-600 dark:text-gray-300">37.5%</td>
                        <td className="p-4 text-sm text-gray-600 dark:text-gray-300">{formatCurrency(1550)}</td>
                      </tr>
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                        <td className="p-4 text-sm font-medium text-gray-900 dark:text-gray-100">Total</td>
                        <td className="p-4 text-sm font-medium text-gray-900 dark:text-gray-100">350</td>
                        <td className="p-4 text-sm font-medium text-gray-900 dark:text-gray-100">143</td>
                        <td className="p-4 text-sm font-medium text-gray-900 dark:text-gray-100">40.9%</td>
                        <td className="p-4 text-sm font-medium text-gray-900 dark:text-gray-100">{formatCurrency(1325)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Monthly Performance Trend */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Monthly Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={[
                          { name: "Jan", revenue: 28000, target: 25000 },
                          { name: "Feb", revenue: 32000, target: 28000 },
                          { name: "Mar", revenue: 35000, target: 30000 },
                          { name: "Apr", revenue: 30000, target: 32000 },
                          { name: "May", revenue: 40000, target: 35000 },
                          { name: "Jun", revenue: 45000, target: 38000 },
                        ]}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis tickFormatter={(value) => `$${value / 1000}k`} />
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                        <Legend />
                        <Line type="monotone" dataKey="revenue" stroke="#0ea5e9" name="Actual Revenue" />
                        <Line type="monotone" dataKey="target" stroke="#f59e0b" strokeDasharray="5 5" name="Target" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              {/* Team Performance */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Team Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          { name: "Sarah", sales: 85000, quota: 75000 },
                          { name: "Michael", sales: 72000, quota: 75000 },
                          { name: "Emma", sales: 68000, quota: 65000 },
                          { name: "John", sales: 95000, quota: 80000 },
                          { name: "David", sales: 63000, quota: 70000 },
                        ]}
                        layout="vertical"
                        margin={{ top: 20, right: 30, left: 50, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" tickFormatter={(value) => `$${value / 1000}k`} />
                        <YAxis type="category" dataKey="name" />
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                        <Legend />
                        <Bar dataKey="sales" fill="#0ea5e9" name="Actual Sales" />
                        <Bar dataKey="quota" fill="#f59e0b" name="Sales Quota" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* KPI Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">KPI Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left p-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Metric</th>
                        <th className="text-left p-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Current</th>
                        <th className="text-left p-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Target</th>
                        <th className="text-left p-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Variance</th>
                        <th className="text-left p-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      <tr>
                        <td className="p-4 text-sm font-medium text-gray-900 dark:text-gray-100">Monthly Revenue</td>
                        <td className="p-4 text-sm text-gray-600 dark:text-gray-300">{formatCurrency(45000)}</td>
                        <td className="p-4 text-sm text-gray-600 dark:text-gray-300">{formatCurrency(38000)}</td>
                        <td className="p-4 text-sm text-green-600">+18.4%</td>
                        <td className="p-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                            Above Target
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="p-4 text-sm font-medium text-gray-900 dark:text-gray-100">Lead Conversion Rate</td>
                        <td className="p-4 text-sm text-gray-600 dark:text-gray-300">35.8%</td>
                        <td className="p-4 text-sm text-gray-600 dark:text-gray-300">30.0%</td>
                        <td className="p-4 text-sm text-green-600">+5.8%</td>
                        <td className="p-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                            Above Target
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="p-4 text-sm font-medium text-gray-900 dark:text-gray-100">Average Order Value</td>
                        <td className="p-4 text-sm text-gray-600 dark:text-gray-300">{formatCurrency(1325)}</td>
                        <td className="p-4 text-sm text-gray-600 dark:text-gray-300">{formatCurrency(1500)}</td>
                        <td className="p-4 text-sm text-red-600">-11.7%</td>
                        <td className="p-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                            Below Target
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="p-4 text-sm font-medium text-gray-900 dark:text-gray-100">Customer Retention</td>
                        <td className="p-4 text-sm text-gray-600 dark:text-gray-300">78.5%</td>
                        <td className="p-4 text-sm text-gray-600 dark:text-gray-300">75.0%</td>
                        <td className="p-4 text-sm text-green-600">+3.5%</td>
                        <td className="p-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                            Above Target
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="p-4 text-sm font-medium text-gray-900 dark:text-gray-100">New Leads</td>
                        <td className="p-4 text-sm text-gray-600 dark:text-gray-300">85</td>
                        <td className="p-4 text-sm text-gray-600 dark:text-gray-300">100</td>
                        <td className="p-4 text-sm text-red-600">-15.0%</td>
                        <td className="p-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                            Below Target
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
