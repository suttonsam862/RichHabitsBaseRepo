import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { Order, OrderStatus } from "@/types";

export default function RecentOrders() {
  const { data, isLoading } = useQuery({
    queryKey: ['/api/orders/recent'],
    refetchInterval: false,
    refetchOnWindowFocus: false,
  });

  // Sample data - would normally come from the API
  const sampleOrders: Order[] = [
    {
      id: 1,
      userId: 1,
      orderId: "#67890",
      customerName: "John Smith",
      amount: "$2,500.00",
      status: "paid",
      notes: "Premium package",
      createdAt: new Date().toISOString(),
    },
    {
      id: 2,
      userId: 1,
      orderId: "#67889",
      customerName: "Emma Davis",
      amount: "$1,200.00",
      status: "processing",
      notes: "Basic package with add-ons",
      createdAt: new Date().toISOString(),
    },
    {
      id: 3,
      userId: 1,
      orderId: "#67888",
      customerName: "Michael Brown",
      amount: "$3,750.00",
      status: "refunded",
      notes: "Enterprise solution - customer requested refund",
      createdAt: new Date().toISOString(),
    },
  ];

  const orders = data?.data || sampleOrders;

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "processing":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "paid":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "shipped":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      case "delivered":
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "refunded":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold">Recent Orders</CardTitle>
          <Button variant="link" className="text-sm text-brand-500 dark:text-brand-400 p-0 h-auto">
            View all
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Order ID</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Customer</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{order.orderId}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm text-gray-600 dark:text-gray-300">{order.customerName}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm text-gray-600 dark:text-gray-300">{order.amount}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Badge className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status as OrderStatus)}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                    <Button variant="link" className="text-brand-500 dark:text-brand-400 p-0 h-auto">View</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
