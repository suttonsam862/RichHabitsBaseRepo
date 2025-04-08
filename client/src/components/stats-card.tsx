import { cn } from "@/lib/utils";
import { StatCard } from "@/types";
import { HelpTooltip } from "@/components/ui/help-tooltip";

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

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-1">
            <HelpTooltip 
              content={getHelpContent(card.title)}
              side="top"
            >
              <p className="text-sm font-medium text-gray-500">{card.title}</p>
            </HelpTooltip>
          </div>
          <h3 className="text-2xl font-bold mt-1">{card.value}</h3>
          <p className="text-xs font-medium text-green-500 mt-1 flex items-center">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="14" 
              height="14" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="mr-1"
            >
              <path d="m6 9 6-6 6 6"></path>
              <path d="M6 12h12"></path>
              <path d="m6 15 6 6 6-6"></path>
            </svg>
            <span>{card.change}</span>
          </p>
        </div>
        <div className={cn("p-3 rounded-full", card.iconBg)}>
          <div className={cn("text-[20px]", card.iconColor)}>
            {card.icon}
          </div>
        </div>
      </div>
    </div>
  );
}
