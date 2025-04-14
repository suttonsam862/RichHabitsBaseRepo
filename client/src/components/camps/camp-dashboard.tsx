import { useCamp, useCampActivities, useCampTasks } from "@/hooks/use-camps";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Activity, Task } from "@shared/schema";

interface CampDashboardProps {
  campId: number;
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  subtext?: string;
  progress?: number;
  progressColor?: string;
}

const StatCard = ({ title, value, icon, subtext, progress, progressColor = "bg-primary" }: StatCardProps) => (
  <div className="bg-card border rounded-lg p-4 shadow-sm">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <h3 className="text-2xl font-bold mt-1">{value}</h3>
      </div>
      <div className="bg-primary-50 p-2 rounded-md">
        {icon}
      </div>
    </div>
    {(subtext || progress !== undefined) && (
      <div className="mt-2">
        {subtext && <span className="text-xs text-success font-medium">{subtext}</span>}
        {progress !== undefined && (
          <div className="w-full bg-muted rounded-full h-2">
            <div className={`${progressColor} h-2 rounded-full`} style={{ width: `${progress}%` }}></div>
          </div>
        )}
      </div>
    )}
  </div>
);

export default function CampDashboard({ campId }: CampDashboardProps) {
  const { data: camp, isLoading: isLoadingCamp } = useCamp(campId);
  const { data: activities, isLoading: isLoadingActivities } = useCampActivities(campId);
  const { data: tasks, isLoading: isLoadingTasks } = useCampTasks(campId);
  
  if (isLoadingCamp || isLoadingActivities || isLoadingTasks) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!camp) {
    return <div>Camp not found</div>;
  }
  
  // Calculate camp duration in days
  const startDate = new Date(camp.startDate);
  const endDate = new Date(camp.endDate);
  const durationInDays = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Calculate days until camp starts
  const today = new Date();
  const daysUntilCamp = Math.round((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  // Calculate completion percentage for tasks
  const completedTasks = tasks?.filter(task => task.status === "completed").length || 0;
  const totalTasks = tasks?.length || 0;
  const tasksCompletion = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  // Format activities for display
  const recentActivities = activities?.slice(0, 4) || [];
  
  // Get pending tasks (that are not completed)
  const pendingTasks = tasks?.filter(task => task.status !== "completed").slice(0, 4) || [];

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Camp Start Date"
          value={format(new Date(camp.startDate), "MMM d, yyyy")}
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
          </svg>}
          subtext={daysUntilCamp > 0 ? `${daysUntilCamp} days remaining` : "In progress"}
        />
        
        <StatCard
          title="Duration"
          value={`${durationInDays} Days`}
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>}
          subtext={`${camp.location}, ${camp.city}`}
        />
        
        <StatCard
          title="Registration Status"
          value={camp.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" viewBox="0 0 20 20" fill="currentColor">
            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
          </svg>}
          subtext={`Max: ${camp.maxParticipants || 'Unlimited'}`}
        />
        
        <StatCard
          title="Tasks Completed"
          value={`${tasksCompletion}%`}
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>}
          progress={tasksCompletion}
          progressColor={tasksCompletion > 75 ? "bg-success" : "bg-primary"}
        />
      </div>

      {/* Upcoming Tasks & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Tasks */}
        <Card>
          <div className="bg-white px-4 py-5 border-b sm:px-6 rounded-t-lg">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Upcoming Tasks</h3>
          </div>
          <CardContent className="p-0">
            <ul className="divide-y divide-muted">
              {pendingTasks.length > 0 ? (
                pendingTasks.map((task: Task) => (
                  <li key={task.id} className="p-4 flex items-start">
                    <input 
                      type="checkbox" 
                      className="h-4 w-4 mt-1 rounded border-muted-foreground text-primary focus:ring-primary"
                    />
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium">{task.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {task.dueDate ? `Due ${format(new Date(task.dueDate), "MMM d, yyyy")}` : "No due date"}
                      </p>
                    </div>
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      task.priority === 'high' 
                        ? 'bg-red-100 text-red-800' 
                        : task.priority === 'medium'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                    }`}>
                      {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                    </span>
                  </li>
                ))
              ) : (
                <li className="p-4 text-center text-muted-foreground">No upcoming tasks</li>
              )}
            </ul>
            <div className="bg-muted px-4 py-3 rounded-b-lg">
              <a href="#" className="text-sm text-primary font-medium">View all tasks</a>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <div className="bg-white px-4 py-5 border-b sm:px-6 rounded-t-lg">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Recent Activity</h3>
          </div>
          <CardContent className="p-0">
            <ul className="divide-y divide-muted">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity: Activity) => {
                  // Format the activity details
                  const formattedActivity = formatActivity(activity);
                  
                  return (
                    <li key={activity.id} className="p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-medium">
                            {activity.userId.toString().charAt(0)}
                          </div>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm" dangerouslySetInnerHTML={{ __html: formattedActivity }} />
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatTimestamp(activity.timestamp)}
                          </p>
                        </div>
                      </div>
                    </li>
                  );
                })
              ) : (
                <li className="p-4 text-center text-muted-foreground">No recent activities</li>
              )}
            </ul>
            <div className="bg-muted px-4 py-3 rounded-b-lg">
              <a href="#" className="text-sm text-primary font-medium">View all activity</a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Helper functions
function formatActivity(activity: Activity): string {
  const action = activity.action.charAt(0).toUpperCase() + activity.action.slice(1);
  const entity = activity.entity.replace(/_/g, ' ');
  
  const details = activity.details as any;
  const entityName = details?.name || details?.title || details?.description || `${entity} #${activity.entityId}`;

  return `<span class="font-medium">User ${activity.userId}</span> ${action} ${entity} <a href="#" class="font-medium text-primary">${entityName}</a>`;
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return `${diffInSeconds} seconds ago`;
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
  }
  
  return format(date, "MMM d, yyyy");
}
