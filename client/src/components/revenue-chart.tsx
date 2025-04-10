import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Legend, ReferenceLine 
} from "recharts";
import { TrendingUp, ArrowRight, TrendingDown } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { ChartData } from "@/types";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type TimeRange = "daily" | "weekly" | "monthly" | "quarterly" | "yearly";

export default function RevenueChart() {
  const [timeRange, setTimeRange] = useState<TimeRange>("monthly");

  const { data, isLoading } = useQuery({
    queryKey: [`/api/analytics/revenue/${timeRange}`],
    refetchInterval: false,
    refetchOnWindowFocus: false,
  });

  // Default data (will be replaced by API data when available)
  const defaultData: ChartData[] = [
    { name: "Jan", current: 30000, previous: 25000 },
    { name: "Feb", current: 35000, previous: 30000 },
    { name: "Mar", current: 40000, previous: 35000 },
    { name: "Apr", current: 30000, previous: 25000 },
    { name: "May", current: 45000, previous: 35000 },
    { name: "Jun", current: 50000, previous: 40000 },
  ];

  const chartData = data?.data || defaultData;
  
  // Calculate metrics
  const currentTotal = chartData.reduce((sum, item) => sum + (item.current || 0), 0);
  const previousTotal = chartData.reduce((sum, item) => sum + (item.previous || 0), 0);
  const percentChange = previousTotal ? ((currentTotal - previousTotal) / previousTotal) * 100 : 0;
  const isPositive = percentChange >= 0;

  // Find peak value for reference line
  const peakValue = Math.max(...chartData.map(item => Math.max(item.current || 0, item.previous || 0)));
  
  // Format time range for display
  const timeRangeDisplay = {
    daily: "Daily",
    weekly: "Weekly",
    monthly: "Monthly",
    quarterly: "Quarterly",
    yearly: "Yearly"
  };

  return (
    <Card className="col-span-1 lg:col-span-2 overflow-hidden border border-gray-200 shadow-sm">
      <CardHeader className="pb-0 border-b border-gray-100">
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-xl font-semibold text-gray-900">Revenue Overview</CardTitle>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium 
                ${isPositive 
                  ? 'bg-green-50 text-green-600' 
                  : 'bg-red-50 text-red-600'}`}>
                {isPositive ? <TrendingUp size={12} className="mr-1" /> : <TrendingDown size={12} className="mr-1" />}
                {isPositive ? '+' : ''}{percentChange.toFixed(1)}%
              </span>
            </div>
            <CardDescription className="text-gray-500 mt-1">
              {timeRangeDisplay[timeRange]} revenue analysis compared to previous period
            </CardDescription>
          </div>
          
          <Tabs defaultValue="monthly" className="mt-0" onValueChange={(value) => setTimeRange(value as TimeRange)}>
            <TabsList>
              <TabsTrigger value="daily">Daily</TabsTrigger>
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="quarterly">Quarterly</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      
      <CardContent className="pt-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div>
            <p className="text-sm font-medium text-gray-500">Current Period</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(currentTotal)}</h3>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Previous Period</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(previousTotal)}</h3>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Difference</p>
            <h3 className={`text-2xl font-bold mt-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? '+' : ''}{formatCurrency(currentTotal - previousTotal)}
            </h3>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Period High</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(peakValue)}</h3>
          </div>
        </div>
        
        {/* Chart */}
        <div className="h-72 mt-6">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorPrevious" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#9ca3af" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#9ca3af" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#64748b' }}
                tickFormatter={(value) => `$${value/1000}k`}
                axisLine={false}
                tickLine={false}
                width={50}
              />
              <Tooltip 
                formatter={(value) => [formatCurrency(Number(value)), "Revenue"]}
                labelFormatter={(label) => `${label} ${timeRange === 'daily' ? '' : timeRange.slice(0, -2)}`}
                contentStyle={{ 
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                  border: 'none',
                  padding: '12px'
                }}
              />
              <ReferenceLine y={peakValue} stroke="#e11d48" strokeDasharray="3 3" />
              <Area 
                type="monotone" 
                dataKey="previous" 
                name="Previous Period"
                stroke="#9ca3af" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorPrevious)" 
                strokeDasharray="4 4"
              />
              <Area 
                type="monotone" 
                dataKey="current" 
                name="Current Period"
                stroke="#3b82f6" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorCurrent)" 
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        {/* Legend */}
        <div className="flex items-center justify-between mt-4 px-2">
          <div className="flex items-center space-x-6">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
              <span className="text-sm text-gray-600">Current Period</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-gray-400 rounded-full mr-2"></div>
              <span className="text-sm text-gray-600">Previous Period</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-0.5 bg-red-500 stroke-dasharray-2 mr-2"></div>
              <span className="text-sm text-gray-600">Period High</span>
            </div>
          </div>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-sm text-blue-600 hover:text-blue-800 p-0 h-auto flex items-center"
          >
            View detailed report
            <ArrowRight size={14} className="ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
