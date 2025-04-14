import { useEffect } from "react";
import { useLocation } from "wouter";
import { useCamps } from "@/hooks/use-camps";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Tent } from "lucide-react";
import { format } from "date-fns";

export default function CampList() {
  const [_, navigate] = useLocation();
  const { data: camps, isLoading, error } = useCamps();

  const handleViewCamp = (id: number) => {
    navigate(`/camps/${id}`);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <h3 className="text-lg font-medium text-red-600">Error loading camps</h3>
          <p className="mt-2 text-muted-foreground">
            {error instanceof Error ? error.message : "An unknown error occurred"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <Card>
      <div className="bg-white px-4 py-5 border-b sm:px-6 rounded-t-lg">
        <h3 className="text-lg font-medium leading-6 text-gray-900">
          All Camps
        </h3>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          A list of all your camp events.
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
                  Participants
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                >
                  Budget
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-muted">
              {camps && camps.length > 0 ? (
                camps.map((camp) => (
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {/* This would ideally be pulled from an API for each camp */}
                      {camp.id === 1 ? "128/150" : camp.id === 2 ? "85/100" : "35/80"}
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {/* This would ideally be pulled from the budget API */}
                      {camp.id === 1 
                        ? "$48,500 / $62,000" 
                        : camp.id === 2 
                        ? "$28,750 / $35,000" 
                        : "$12,200 / $45,000"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button
                        variant="link"
                        onClick={() => handleViewCamp(camp.id)}
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
                    colSpan={7}
                    className="px-6 py-4 text-center text-muted-foreground"
                  >
                    No camps found. Create your first camp to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
