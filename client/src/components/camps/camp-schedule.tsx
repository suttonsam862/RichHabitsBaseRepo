import { useState } from "react";
import { useCampSchedule } from "@/hooks/use-camps";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertScheduleEventSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, PlusCircle, Calendar, Clock, Search } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";

// Extend schema for client-side validation
const scheduleEventFormSchema = insertScheduleEventSchema.extend({
  startDateTime: z.coerce.date(),
  endDateTime: z.coerce.date(),
  staffAssigned: z.any().optional(),
}).refine((data) => data.endDateTime >= data.startDateTime, {
  message: "End time must be after start time",
  path: ["endDateTime"],
});

type ScheduleEventFormValues = z.infer<typeof scheduleEventFormSchema>;

interface CampScheduleProps {
  campId: number;
}

export default function CampSchedule({ campId }: CampScheduleProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeDay, setActiveDay] = useState<string | null>(null);
  const { data: scheduleEvents, isLoading, error } = useCampSchedule(campId);
  const { toast } = useToast();

  const form = useForm<ScheduleEventFormValues>({
    resolver: zodResolver(scheduleEventFormSchema),
    defaultValues: {
      campId,
      title: "",
      description: "",
      location: "",
      startDateTime: new Date(),
      endDateTime: new Date(new Date().getTime() + 60 * 60 * 1000), // 1 hour later
      type: "activity",
      staffAssigned: [],
      notes: "",
    },
  });

  const onSubmit = async (values: ScheduleEventFormValues) => {
    try {
      await apiRequest("POST", `/api/camps/${campId}/schedule`, {
        ...values,
        staffAssigned: values.staffAssigned || []
      });
      toast({
        title: "Success",
        description: "Schedule event added successfully",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/camps/${campId}/schedule`] });
      setIsAddDialogOpen(false);
      form.reset();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add schedule event",
        variant: "destructive",
      });
    }
  };

  // Group events by day
  const eventsByDay: Record<string, typeof scheduleEvents> = {};
  
  scheduleEvents?.forEach(event => {
    const day = format(new Date(event.startDateTime), "yyyy-MM-dd");
    if (!eventsByDay[day]) {
      eventsByDay[day] = [];
    }
    eventsByDay[day].push(event);
  });

  // Sort days
  const sortedDays = Object.keys(eventsByDay).sort();
  
  // Set active day to first day if not set
  if (sortedDays.length > 0 && !activeDay) {
    setActiveDay(sortedDays[0]);
  }

  // Filter events by search query and active day
  const filteredEvents = scheduleEvents?.filter(event => {
    if (searchQuery) {
      const title = event.title.toLowerCase();
      const description = event.description?.toLowerCase() || "";
      const location = event.location?.toLowerCase() || "";
      const query = searchQuery.toLowerCase();
      
      return title.includes(query) || description.includes(query) || location.includes(query);
    }
    
    if (activeDay) {
      const eventDay = format(new Date(event.startDateTime), "yyyy-MM-dd");
      return eventDay === activeDay;
    }
    
    return true;
  });

  // Sort events by start time
  filteredEvents?.sort((a, b) => {
    return new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime();
  });

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
          <h3 className="text-lg font-medium text-red-600">Error loading schedule</h3>
          <p className="mt-2 text-muted-foreground">
            {error instanceof Error ? error.message : "An unknown error occurred"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Schedule Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border rounded-lg p-4 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Events</p>
              <h3 className="text-2xl font-bold mt-1">{scheduleEvents?.length || 0}</h3>
            </div>
            <div className="bg-primary-50 p-2 rounded-md">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
          </div>
        </div>
        
        <div className="bg-card border rounded-lg p-4 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Days Scheduled</p>
              <h3 className="text-2xl font-bold mt-1">{sortedDays.length}</h3>
            </div>
            <div className="bg-green-50 p-2 rounded-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="bg-card border rounded-lg p-4 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Activities</p>
              <h3 className="text-2xl font-bold mt-1">
                {scheduleEvents?.filter(e => e.type === "activity").length || 0}
              </h3>
            </div>
            <div className="bg-blue-50 p-2 rounded-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6 3a1 1 0 011-1h.01a1 1 0 010 2H7a1 1 0 01-1-1zm2 3a1 1 0 00-2 0v1a2 2 0 00-2 2v1a2 2 0 00-2 2v.683a3.7 3.7 0 011.055.485 1.704 1.704 0 001.89 0 3.704 3.704 0 014.11 0 1.704 1.704 0 001.89 0 3.704 3.704 0 014.11 0 1.704 1.704 0 001.89 0A3.7 3.7 0 0118 12.683V12a2 2 0 00-2-2V9a2 2 0 00-2-2V6a1 1 0 10-2 0v1h-1V6a1 1 0 10-2 0v1H8V6zm10 8.868a3.704 3.704 0 01-4.055-.036 1.704 1.704 0 00-1.89 0 3.704 3.704 0 01-4.11 0 1.704 1.704 0 00-1.89 0A3.704 3.704 0 012 14.868V17a1 1 0 001 1h14a1 1 0 001-1v-2.132zM9 3a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1zm3 0a1 1 0 011-1h.01a1 1 0 110 2H13a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="bg-card border rounded-lg p-4 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Today's Events</p>
              <h3 className="text-2xl font-bold mt-1">
                {scheduleEvents?.filter(e => {
                  const today = format(new Date(), "yyyy-MM-dd");
                  const eventDay = format(new Date(e.startDateTime), "yyyy-MM-dd");
                  return eventDay === today;
                }).length || 0}
              </h3>
            </div>
            <div className="bg-purple-50 p-2 rounded-md">
              <Clock className="h-5 w-5 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Day Tabs */}
      {sortedDays.length > 0 && (
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {sortedDays.map(day => (
            <Button
              key={day}
              variant={activeDay === day ? "default" : "outline"}
              className="rounded-full"
              onClick={() => setActiveDay(day)}
            >
              {format(new Date(day), "EEE, MMM d")}
            </Button>
          ))}
        </div>
      )}

      {/* Schedule Events Table */}
      <Card>
        <div className="bg-white px-4 py-5 border-b sm:px-6 rounded-t-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              {activeDay 
                ? `Schedule for ${format(new Date(activeDay), "EEEE, MMMM d, yyyy")}`
                : "Schedule"
              }
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Manage camp activities, meals, and events.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search schedule..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button 
              className="flex items-center gap-2"
              onClick={() => setIsAddDialogOpen(true)}
            >
              <PlusCircle className="h-4 w-4" />
              Add Event
            </Button>
          </div>
        </div>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-muted">
              <thead className="bg-muted">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Time
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Event
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Location
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Duration
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-muted">
                {filteredEvents && filteredEvents.length > 0 ? (
                  filteredEvents.map((event) => {
                    const startTime = new Date(event.startDateTime);
                    const endTime = new Date(event.endDateTime);
                    const durationMs = endTime.getTime() - startTime.getTime();
                    const hours = Math.floor(durationMs / (1000 * 60 * 60));
                    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
                    const duration = `${hours > 0 ? `${hours}h ` : ''}${minutes > 0 ? `${minutes}m` : ''}`;
                    
                    return (
                      <tr key={event.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {format(startTime, "h:mm a")}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {format(startTime, "EEEE, MMM d")}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{event.title}</div>
                          {event.description && (
                            <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{event.description}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {event.location || "TBD"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              event.type === "activity"
                                ? "bg-blue-100 text-blue-800"
                                : event.type === "meal"
                                ? "bg-green-100 text-green-800"
                                : event.type === "free_time"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {event.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {duration}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Button variant="link" className="text-primary hover:text-primary-700">
                            Edit
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-muted-foreground">
                      {searchQuery 
                        ? "No events match your search query." 
                        : activeDay
                        ? "No events scheduled for this day. Add events to get started."
                        : "No events found. Add your first event to get started."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add Event Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Schedule Event</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Morning Yoga" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="activity">Activity</SelectItem>
                          <SelectItem value="meal">Meal</SelectItem>
                          <SelectItem value="free_time">Free Time</SelectItem>
                          <SelectItem value="workshop">Workshop</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Main Hall" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDateTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date/Time</FormLabel>
                      <FormControl>
                        <Input 
                          type="datetime-local" 
                          {...field} 
                          value={field.value instanceof Date ? field.value.toISOString().substring(0, 16) : field.value} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endDateTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date/Time</FormLabel>
                      <FormControl>
                        <Input 
                          type="datetime-local" 
                          {...field} 
                          value={field.value instanceof Date ? field.value.toISOString().substring(0, 16) : field.value} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Description of the event"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Additional notes or instructions"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Add Event
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
