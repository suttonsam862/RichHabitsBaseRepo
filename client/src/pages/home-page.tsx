import { useEffect } from "react";
import { useLocation } from "wouter";
import AppLayout from "@/components/layout/app-layout";
import { useCamps } from "@/hooks/use-camps";
import { Loader2, Users, Calendar, CheckSquare, Tent } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

export default function HomePage() {
  const { data: camps, isLoading } = useCamps();
  const [_, navigate] = useLocation();

  useEffect(() => {
    document.title = "Dashboard | Rich Habits Camp Management";
  }, []);

  const navigateToCamps = () => {
    navigate("/camps");
  };

  // Count upcoming camps (where start date is in the future)
  const upcomingCamps = camps?.filter(
    (camp) => new Date(camp.startDate) > new Date()
  ).length || 0;

  // Count active camps (where current date is between start and end dates)
  const activeCamps = camps?.filter(
    (camp) =>
      new Date(camp.startDate) <= new Date() &&
      new Date(camp.endDate) >= new Date()
  ).length || 0;

  // Count total participants (placeholder for a real API call)
  const totalParticipants = 248; // This would normally come from an API

  // Count total tasks (placeholder for a real API call)
  const completedTasksPercentage = 65; // This would normally come from an API

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  const recentCamps = camps?.slice(0, 5) || [];

  return (
    <AppLayout
      title="Dashboard"
      action={
        <Button onClick={navigateToCamps} className="flex items-center gap-2">
          <Tent className="h-4 w-4" />
          View All Camps
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card border rounded-lg p-4 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Upcoming Camps
                </p>
                <h3 className="text-2xl font-bold mt-1">{upcomingCamps}</h3>
              </div>
              <div className="bg-primary-50 p-2 rounded-md">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-xs text-success font-medium">
                {upcomingCamps > 0
                  ? `${upcomingCamps} camps planned`
                  : "No upcoming camps"}
              </span>
            </div>
          </div>

          <div className="bg-card border rounded-lg p-4 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Active Camps
                </p>
                <h3 className="text-2xl font-bold mt-1">{activeCamps}</h3>
              </div>
              <div className="bg-primary-50 p-2 rounded-md">
                <Tent className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-xs text-success font-medium">
                {activeCamps > 0
                  ? `${activeCamps} currently running`
                  : "No active camps"}
              </span>
            </div>
          </div>

          <div className="bg-card border rounded-lg p-4 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Participants
                </p>
                <h3 className="text-2xl font-bold mt-1">
                  {totalParticipants}
                </h3>
              </div>
              <div className="bg-primary-50 p-2 rounded-md">
                <Users className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-xs text-success font-medium">
                +32 this week
              </span>
            </div>
          </div>

          <div className="bg-card border rounded-lg p-4 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Tasks Completed
                </p>
                <h3 className="text-2xl font-bold mt-1">
                  {completedTasksPercentage}%
                </h3>
              </div>
              <div className="bg-primary-50 p-2 rounded-md">
                <CheckSquare className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="mt-2">
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-success h-2 rounded-full"
                  style={{ width: `${completedTasksPercentage}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Camps */}
        <Card>
          <div className="bg-white px-4 py-5 border-b sm:px-6 rounded-t-lg">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              Recent Camps
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              A list of your recent camp events.
            </p>
          </div>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-muted">
                <thead className="bg-muted">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                    >
                      Camp Name
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                    >
                      Dates
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                    >
                      Location
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="relative px-6 py-3"
                    >
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-muted">
                  {recentCamps.length > 0 ? (
                    recentCamps.map((camp) => (
                      <tr key={camp.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-50 flex items-center justify-center">
                              <Tent className="h-5 w-5 text-primary" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {camp.name}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {camp.campCode}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {format(new Date(camp.startDate), "MMM d, yyyy")} -{" "}
                            {format(new Date(camp.endDate), "MMM d, yyyy")}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {Math.round(
                              (new Date(camp.endDate).getTime() -
                                new Date(camp.startDate).getTime()) /
                                (1000 * 60 * 60 * 24)
                            )}{" "}
                            days
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {camp.location}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {camp.city}, {camp.state}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              camp.status === "registration_open"
                                ? "bg-green-100 text-green-800"
                                : camp.status === "planning"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {camp.status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Button
                            variant="link"
                            onClick={() => navigate(`/camps/${camp.id}`)}
                            className="text-primary hover:text-primary-700"
                          >
                            View
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-4 text-center text-muted-foreground"
                      >
                        No camps found. Create your first camp to get started.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="bg-muted px-4 py-3 text-right sm:px-6 rounded-b-lg">
              <Button
                variant="outline"
                onClick={navigateToCamps}
                className="text-sm"
              >
                View All Camps
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
