import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Users, MessageSquare, FileText } from "lucide-react";
import { getRelativeTime } from "@/lib/utils";
import { ActivityItem } from "@/types";

export default function RecentActivity() {
  const { data, isLoading } = useQuery({
    queryKey: ['/api/activities/recent'],
    refetchInterval: false,
    refetchOnWindowFocus: false,
  });

  // Sample data - would normally come from the API
  const sampleActivities: ActivityItem[] = [
    {
      id: 1,
      userId: 1,
      type: "order",
      content: "New order <span class='text-brand-600 dark:text-brand-400'>#67890</span> received",
      relatedId: 67890,
      relatedType: "order",
      createdAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
      icon: <ShoppingBag size={18} />,
      iconBg: "bg-green-100 dark:bg-green-900",
      iconColor: "text-green-600 dark:text-green-400",
    },
    {
      id: 2,
      userId: 1,
      type: "lead",
      content: "New lead assigned",
      relatedId: 123,
      relatedType: "lead",
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      icon: <Users size={18} />,
      iconBg: "bg-blue-100 dark:bg-blue-900",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    {
      id: 3,
      userId: 1,
      type: "message",
      content: "New message received",
      relatedId: 456,
      relatedType: "message",
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      icon: <MessageSquare size={18} />,
      iconBg: "bg-purple-100 dark:bg-purple-900",
      iconColor: "text-purple-600 dark:text-purple-400",
    },
    {
      id: 4,
      userId: 1,
      type: "report",
      content: "Monthly sales report is ready",
      relatedId: 789,
      relatedType: "report",
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      icon: <FileText size={18} />,
      iconBg: "bg-yellow-100 dark:bg-yellow-900",
      iconColor: "text-yellow-600 dark:text-yellow-400",
    },
  ];

  const activities = data?.data || sampleActivities;

  return (
    <Card className="col-span-1">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
          <Button variant="link" className="text-sm text-brand-500 dark:text-brand-400 p-0 h-auto">
            View all
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-5">
          {activities.map((activity, index) => (
            <div key={activity.id} className="flex items-start">
              <div className="mr-4 relative">
                <div className={`w-10 h-10 flex items-center justify-center rounded-full ${activity.iconBg} ${activity.iconColor}`}>
                  {activity.icon}
                </div>
                {index < activities.length - 1 && (
                  <div className="absolute top-10 bottom-0 left-1/2 w-0.5 -ml-0.5 bg-gray-200 dark:bg-gray-700"></div>
                )}
              </div>
              <div>
                <p 
                  className="text-sm font-medium text-gray-900 dark:text-gray-100"
                  dangerouslySetInnerHTML={{ __html: activity.content }}
                />
                {activity.type === "order" && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    John Smith ordered Premium Package
                  </p>
                )}
                {activity.type === "lead" && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Emma Johnson was assigned to you
                  </p>
                )}
                {activity.type === "message" && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Michael Brown sent you a message
                  </p>
                )}
                {activity.type === "report" && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Monthly sales report is ready
                  </p>
                )}
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {getRelativeTime(activity.createdAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
