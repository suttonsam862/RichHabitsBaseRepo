import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Search, Filter, Calendar as CalendarIcon, Users, MapPin } from "lucide-react";

export default function EventCalendar() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [view, setView] = useState<"calendar" | "list">("calendar");
  
  // Fetch events data
  const { data: eventsData, isLoading } = useQuery({
    queryKey: ['/api/events'],
    queryFn: async ({ queryKey }) => {
      // This would fetch from API in production
      return {
        data: [
          {
            id: 1,
            title: "Summer Sports Camp",
            startDate: new Date(2025, 5, 15), // June 15, 2025
            endDate: new Date(2025, 5, 30), // June 30, 2025
            location: "Central Park Field",
            type: "Sports",
            capacity: 50,
            registered: 32,
            status: "upcoming",
          },
          {
            id: 2,
            title: "Art & Design Workshop",
            startDate: new Date(2025, 6, 10), // July 10, 2025
            endDate: new Date(2025, 6, 14), // July 14, 2025
            location: "Creative Studio Downtown",
            type: "Arts",
            capacity: 25,
            registered: 18,
            status: "upcoming",
          },
          {
            id: 3,
            title: "Science & Technology Camp",
            startDate: new Date(2025, 7, 5), // August 5, 2025
            endDate: new Date(2025, 7, 15), // August 15, 2025
            location: "Tech Innovation Center",
            type: "Science",
            capacity: 40,
            registered: 28,
            status: "upcoming",
          },
        ],
      };
    },
  });
  
  const events = eventsData?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Event Calendar</h1>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Event
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Events</CardTitle>
              <CardDescription>Manage and view all scheduled events</CardDescription>
            </div>
            <Tabs 
              value={view} 
              onValueChange={(val) => setView(val as "calendar" | "list")}
              className="w-auto"
            >
              <TabsList>
                <TabsTrigger value="calendar">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Calendar
                </TabsTrigger>
                <TabsTrigger value="list">
                  <Users className="h-4 w-4 mr-2" />
                  List
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-[1fr_300px]">
            <div>
              {isLoading ? (
                <div className="flex justify-center items-center h-80">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  <TabsContent value="calendar" className="mt-0">
                    <div className="bg-white p-4 rounded-md border">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        className="rounded-md"
                      />
                      
                      {/* Events for selected date */}
                      <div className="mt-6">
                        <h3 className="font-medium mb-2">
                          Events on {date?.toLocaleDateString()}
                        </h3>
                        <div className="space-y-3">
                          {events
                            .filter(
                              (event) =>
                                date &&
                                date >= new Date(event.startDate) &&
                                date <= new Date(event.endDate)
                            )
                            .map((event) => (
                              <div
                                key={event.id}
                                className="p-3 border rounded-md hover:bg-gray-50"
                              >
                                <div className="font-medium">{event.title}</div>
                                <div className="text-sm text-gray-500 flex items-center mt-1">
                                  <MapPin className="h-3.5 w-3.5 mr-1" />
                                  {event.location}
                                </div>
                                <div className="text-sm text-gray-500 mt-1">
                                  Capacity: {event.registered}/{event.capacity} registered
                                </div>
                              </div>
                            ))}
                          {date &&
                            events.filter(
                              (event) =>
                                date >= new Date(event.startDate) &&
                                date <= new Date(event.endDate)
                            ).length === 0 && (
                              <div className="text-center py-6 text-gray-500">
                                No events scheduled for this date
                              </div>
                            )}
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="list" className="mt-0">
                    <div className="flex mb-4 space-x-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                        <Input placeholder="Search events..." className="pl-8" />
                      </div>
                      <Select defaultValue="all">
                        <SelectTrigger className="w-[120px]">
                          <SelectValue placeholder="Filter" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Events</SelectItem>
                          <SelectItem value="upcoming">Upcoming</SelectItem>
                          <SelectItem value="past">Past</SelectItem>
                          <SelectItem value="sports">Sports</SelectItem>
                          <SelectItem value="arts">Arts</SelectItem>
                          <SelectItem value="science">Science</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-3">
                      {events.map((event) => (
                        <div
                          key={event.id}
                          className="p-4 border rounded-md hover:bg-gray-50 flex justify-between items-center"
                        >
                          <div>
                            <div className="font-medium">{event.title}</div>
                            <div className="text-sm text-gray-500 mt-1">
                              {new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center mt-1">
                              <MapPin className="h-3.5 w-3.5 mr-1" />
                              {event.location}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">
                              Type: {event.type}
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                              {event.registered}/{event.capacity} registered
                            </div>
                            <Button size="sm" variant="outline" className="mt-2">
                              View Details
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </>
              )}
            </div>
            
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Event Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label>Sports</Label>
                      <span className="text-sm bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">12</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <Label>Arts & Crafts</Label>
                      <span className="text-sm bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">8</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <Label>Science & Tech</Label>
                      <span className="text-sm bg-green-100 text-green-800 px-2 py-0.5 rounded-full">5</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <Label>Music</Label>
                      <span className="text-sm bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">4</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <Label>Other</Label>
                      <span className="text-sm bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full">3</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Events</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {events
                      .filter(event => new Date(event.startDate) > new Date())
                      .slice(0, 3)
                      .map(event => (
                        <div key={event.id} className="border-b pb-2 last:border-b-0 last:pb-0">
                          <div className="font-medium">{event.title}</div>
                          <div className="text-sm text-gray-500 mt-1">
                            {new Date(event.startDate).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
              
              <Button className="w-full">View All Events</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}