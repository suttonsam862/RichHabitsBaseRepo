import { cn } from "@/lib/utils";
import { StatCard } from "@/types";

interface StatsCardProps {
  card: StatCard;
}

export default function StatsCard({ card }: StatsCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{card.title}</p>
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
