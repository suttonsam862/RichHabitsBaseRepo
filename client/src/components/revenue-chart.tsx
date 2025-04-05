import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { apiRequest } from "@/lib/queryClient";
import { ChartData } from "@/types";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type TimeRange = "daily" | "weekly" | "monthly";

export default function RevenueChart() {
  const [timeRange, setTimeRange] = useState<TimeRange>("monthly");

  const { data, isLoading } = useQuery({
    queryKey: [`/api/analytics/revenue/${timeRange}`],
    refetchInterval: false,
    refetchOnWindowFocus: false,
  });

  // Sample data - would normally come from the API
  const sampleData: ChartData[] = [
    { name: "Jan", current: 30000, previous: 25000 },
    { name: "Feb", current: 35000, previous: 30000 },
    { name: "Mar", current: 40000, previous: 35000 },
    { name: "Apr", current: 30000, previous: 25000 },
    { name: "May", current: 45000, previous: 35000 },
    { name: "Jun", current: 50000, previous: 40000 },
  ];

  const chartData = data?.data || sampleData;

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader className="pb-0">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <CardTitle className="text-lg font-semibold">Revenue Overview</CardTitle>
          <div className="flex items-center space-x-2">
            <Button 
              size="sm" 
              variant={timeRange === "monthly" ? "default" : "outline"}
              onClick={() => setTimeRange("monthly")}
              className={timeRange === "monthly" ? "bg-brand-50 text-brand-600 hover:bg-brand-100 dark:bg-gray-700 dark:text-brand-400" : ""}
            >
              Monthly
            </Button>
            <Button 
              size="sm" 
              variant={timeRange === "weekly" ? "default" : "outline"}
              onClick={() => setTimeRange("weekly")}
              className={timeRange === "weekly" ? "bg-brand-50 text-brand-600 hover:bg-brand-100 dark:bg-gray-700 dark:text-brand-400" : ""}
            >
              Weekly
            </Button>
            <Button 
              size="sm" 
              variant={timeRange === "daily" ? "default" : "outline"}
              onClick={() => setTimeRange("daily")}
              className={timeRange === "daily" ? "bg-brand-50 text-brand-600 hover:bg-brand-100 dark:bg-gray-700 dark:text-brand-400" : ""}
            >
              Daily
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80 mt-6">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12, fill: '#9ca3af' }}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#9ca3af' }}
                tickFormatter={(value) => `$${value / 1000}k`}
              />
              <Tooltip 
                formatter={(value) => formatCurrency(Number(value))}
                labelStyle={{ color: '#111827' }}
                contentStyle={{ 
                  backgroundColor: 'white', 
                  borderColor: '#e5e7eb',
                  borderRadius: '0.375rem',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                }}
              />
              <Area 
                type="monotone" 
                dataKey="current" 
                stroke="#0ea5e9" 
                fillOpacity={1} 
                fill="url(#colorCurrent)" 
                activeDot={{ r: 8 }}
                name="This Year"
              />
              <Area 
                type="monotone" 
                dataKey="previous" 
                stroke="#9ca3af" 
                strokeDasharray="4 4" 
                fillOpacity={0} 
                name="Last Year"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        <div className="flex items-center justify-center mt-3 space-x-6">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-brand-500 rounded-full mr-2"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">This Year</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-gray-400 rounded-full mr-2"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Last Year</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
