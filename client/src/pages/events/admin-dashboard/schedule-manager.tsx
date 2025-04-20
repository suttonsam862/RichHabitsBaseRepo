import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Plus, CalendarDays, Clock } from "lucide-react";
import { useState } from "react";
import { ScrollableDialogContent } from "@/components/ui/scrollable-dialog-content";

export default function ScheduleManagerPage() {
  const [activeTab, setActiveTab] = useState("daily");
  
  // Fetch camps to get a list of camps that need schedules
  const {
    data: campsData,
    isLoading: isLoadingCamps,
  } = useQuery({
    queryKey: ["/api/camps"],
  });

  const camps = campsData?.data || [];
  
  // Loading state
  if (isLoadingCamps) {
    return (
      <div className="container mx-auto py-10 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Global Schedule Manager</h1>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create New Schedule
        </Button>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-6">
        <TabsList className="mb-4">
          <TabsTrigger value="daily">
            <CalendarDays className="h-4 w-4 mr-2" />
            Daily Schedules
          </TabsTrigger>
          <TabsTrigger value="detailed">
            <Clock className="h-4 w-4 mr-2" />
            Detailed View
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="daily">
          <Card>
            <CardHeader>
              <CardTitle>All Camp Schedules</CardTitle>
              <CardDescription>
                View and manage daily schedules for all camps
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollableDialogContent className="max-h-[70vh]">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {camps.map((camp) => (
                    <Card key={camp.id} className="overflow-hidden">
                      <CardHeader className="bg-primary/5 py-3">
                        <CardTitle className="text-lg">{camp.name}</CardTitle>
                        <CardDescription>
                          {camp.startDate} to {camp.endDate}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-4">
                        {camp.schedule ? (
                          <div>
                            <p>Schedule available</p>
                            <Button variant="outline" size="sm" className="mt-2">
                              View Schedule
                            </Button>
                          </div>
                        ) : (
                          <div>
                            <p className="text-muted-foreground">No schedule created yet</p>
                            <Button size="sm" className="mt-2">
                              Create Schedule
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollableDialogContent>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="detailed">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Schedule View</CardTitle>
              <CardDescription>
                Manage detailed session information and timing across all camps
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                Select a camp from the list to view and edit its detailed schedule
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}