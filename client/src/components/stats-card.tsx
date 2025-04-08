import { cn } from "@/lib/utils";
import { StatCard } from "@/types";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { TrendingUp, TrendingDown, ArrowRightLeft } from "lucide-react";

interface StatsCardProps {
  card: StatCard;
}

export default function StatsCard({ card }: StatsCardProps) {
  // Prepare help content based on card title
  const getHelpContent = (title: string) => {
    switch (title) {
      case "Total Leads":
        return (
          <div>
            <p className="font-semibold mb-1">About Total Leads</p>
            <p>This represents the total number of leads in your system.</p>
            <ul className="list-disc pl-4 mt-2 space-y-1">
              <li>Includes all leads regardless of status</li>
              <li>Updated in real-time as new leads are added</li>
              <li>Click on "Leads" in the sidebar to manage all leads</li>
            </ul>
          </div>
        );
      case "Active Orders":
        return (
          <div>
            <p className="font-semibold mb-1">About Active Orders</p>
            <p>This shows the number of orders currently in progress.</p>
            <ul className="list-disc pl-4 mt-2 space-y-1">
              <li>Includes all orders with status: pending, processing, or paid</li>
              <li>Does not include completed or cancelled orders</li>
              <li>Click on "Orders" in the sidebar to manage all orders</li>
            </ul>
          </div>
        );
      case "Monthly Revenue":
        return (
          <div>
            <p className="font-semibold mb-1">About Monthly Revenue</p>
            <p>This displays the total revenue for the current month.</p>
            <ul className="list-disc pl-4 mt-2 space-y-1">
              <li>Includes all completed orders for the current month</li>
              <li>Automatically resets at the beginning of each month</li>
              <li>View detailed reports in the Analytics section</li>
            </ul>
          </div>
        );
      case "Unread Messages":
        return (
          <div>
            <p className="font-semibold mb-1">About Unread Messages</p>
            <p>This indicates the number of unread messages across all conversations.</p>
            <ul className="list-disc pl-4 mt-2 space-y-1">
              <li>Includes messages from customers, team members, and system notifications</li>
              <li>Click on "Messages" in the sidebar to view and respond</li>
              <li>Messages are marked as read automatically when viewed</li>
            </ul>
          </div>
        );
      default:
        return <p>Information about this metric will be available soon.</p>;
    }
  };

  // Determine trend indicator based on change text
  const getTrendIndicator = () => {
    const change = card.change.toLowerCase();
    if (change.includes('increase')) {
      return (
        <div className="flex items-center text-green-600 dark:text-green-500">
          <TrendingUp size={14} className="mr-1" />
          <span>{card.change}</span>
        </div>
      );
    } else if (change.includes('decrease')) {
      return (
        <div className="flex items-center text-red-600 dark:text-red-500">
          <TrendingDown size={14} className="mr-1" />
          <span>{card.change}</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center text-gray-600 dark:text-gray-400">
          <ArrowRightLeft size={14} className="mr-1" />
          <span>{card.change}</span>
        </div>
      );
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm">
      <div className="p-6">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <div className="flex items-center gap-1">
              <HelpTooltip 
                content={getHelpContent(card.title)}
                side="top"
              >
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{card.title}</p>
              </HelpTooltip>
            </div>
            <h3 className="text-2xl font-bold">{card.value}</h3>
            <p className="text-xs font-medium">
              {getTrendIndicator()}
            </p>
          </div>
          
          <div className={cn("p-3 rounded-full", card.iconBg)}>
            <div className={cn("text-[20px]", card.iconColor)}>
              {card.icon}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
