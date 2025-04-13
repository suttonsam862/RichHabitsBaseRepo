import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Loader2, Plus, Search, Calendar as CalendarIcon, Users, MapPin,
  Edit, Trash, X
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Event } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { format } from "date-fns";

// Event form schema
const eventFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  location: z.string().min(2, "Location is required"),
  startDate: z.date(),
  endDate: z.date(),
  type: z.string().min(1, "Event type is required"),
  capacity: z.coerce.number().min(1, "Capacity must be at least 1 person"),
  status: z.string().default("upcoming"),
});

type EventFormValues = z.infer<typeof eventFormSchema>;

export default function EventCalendar() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [view, setView] = useState<"calendar" | "list">("calendar");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const deleteEventRef = useRef<Event | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Fetch events data from the API
  const { data: eventsData, isLoading } = useQuery({
    queryKey: ['/api/events'],
    queryFn: async ({ queryKey }) => {
      const response = await fetch(queryKey[0] as string);
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      return response.json();
    },
  });
  
  // Create event mutation
  const createEventMutation = useMutation({
    mutationFn: async (eventData: EventFormValues) => {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create event');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Event created",
        description: "The event has been created successfully",
      });
      setIsCreateDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to create event",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Update event mutation
  const updateEventMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: EventFormValues }) => {
      const response = await fetch(`/api/events/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update event');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Event updated",
        description: "The event has been updated successfully",
      });
      setIsCreateDialogOpen(false);
      setEditingEvent(null);
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to update event",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Delete event mutation
  const deleteEventMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/events/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete event');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Event deleted",
        description: "The event has been deleted successfully",
      });
      setIsDeleteDialogOpen(false);
      deleteEventRef.current = null;
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete event",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Form setup
  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: "",
      description: "",
      location: "",
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default end date is 7 days from now
      type: "Other",
      capacity: 20,
      status: "upcoming",
    }
  });
  
  function onSubmit(values: EventFormValues) {
    if (editingEvent) {
      updateEventMutation.mutate({ id: editingEvent.id, data: values });
    } else {
      createEventMutation.mutate(values);
    }
  }
  
  // Handle opening edit form
  function handleEditEvent(event: Event) {
    setEditingEvent(event);
    
    // Set form values
    form.reset({
      title: event.title,
      description: event.description || "",
      location: event.location || "",
      startDate: new Date(event.startDate),
      endDate: new Date(event.endDate),
      type: event.type || "Other",
      capacity: event.capacity || 20,
      status: event.status || "upcoming",
    });
    
    setIsCreateDialogOpen(true);
  }
  
  // Handle opening delete dialog
  function handleDeleteEvent(event: Event) {
    deleteEventRef.current = event;
    setIsDeleteDialogOpen(true);
  }
  
  // Reset form when opening create dialog
  function handleOpenCreateDialog() {
    setEditingEvent(null);
    form.reset({
      title: "",
      description: "",
      location: "",
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      type: "Other",
      capacity: 20,
      status: "upcoming",
    });
    setIsCreateDialogOpen(true);
  }
  
  // Filter events based on search and filter selection
  const filterEvents = (events: Event[]) => {
    return events.filter(event => {
      const matchesSearch = searchTerm === "" || 
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (event.description && event.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (event.location && event.location.toLowerCase().includes(searchTerm.toLowerCase()));
      
      let matchesFilter = true;
      if (selectedFilter !== "all") {
        if (selectedFilter === "upcoming") {
          matchesFilter = new Date(event.startDate) > new Date();
        } else if (selectedFilter === "past") {
          matchesFilter = new Date(event.endDate) < new Date();
        } else {
          // Filter by type
          matchesFilter = event.type?.toLowerCase() === selectedFilter.toLowerCase();
        }
      }
      
      return matchesSearch && matchesFilter;
    });
  };
  
  const events = eventsData?.data ? filterEvents(eventsData.data) : [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Event Calendar</h1>
        <Button onClick={handleOpenCreateDialog}>
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
                                <div className="flex justify-between">
                                  <div className="font-medium">{event.title}</div>
                                  <div className="flex space-x-1">
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      onClick={() => handleEditEvent(event)}
                                      className="h-6 w-6"
                                    >
                                      <Edit className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      onClick={() => handleDeleteEvent(event)}
                                      className="h-6 w-6 text-red-500 hover:text-red-600"
                                    >
                                      <Trash className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                </div>
                                <div className="text-sm text-gray-500 flex items-center mt-1">
                                  <MapPin className="h-3.5 w-3.5 mr-1" />
                                  {event.location}
                                </div>
                                <div className="text-sm text-gray-500 mt-1">
                                  Capacity: {event.registered || 0}/{event.capacity} registered
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
                        <Input 
                          placeholder="Search events..." 
                          className="pl-8"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                      <Select 
                        value={selectedFilter} 
                        onValueChange={setSelectedFilter}
                      >
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
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-3">
                      {events.length === 0 ? (
                        <div className="text-center py-10 text-gray-500">
                          No events matching your filter
                        </div>
                      ) : (
                        events.map((event) => (
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
                              {event.description && (
                                <div className="text-sm text-gray-500 mt-1 max-w-md truncate">
                                  {event.description}
                                </div>
                              )}
                            </div>
                            <div className="text-right flex flex-col items-end">
                              <div className="text-sm font-medium">
                                Type: {event.type || 'Other'}
                              </div>
                              <div className="text-sm text-gray-500 mt-1">
                                {event.registered || 0}/{event.capacity} registered
                              </div>
                              <div className="flex space-x-2 mt-2">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleEditEvent(event)}
                                >
                                  <Edit className="h-3.5 w-3.5 mr-1" />
                                  Edit
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => handleDeleteEvent(event)}
                                >
                                  <Trash className="h-3.5 w-3.5 mr-1" />
                                  Delete
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
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
                    {[
                      { name: 'Sports', color: 'blue', count: events.filter(e => e.type?.toLowerCase() === 'sports').length },
                      { name: 'Arts & Crafts', color: 'purple', count: events.filter(e => e.type?.toLowerCase() === 'arts').length },
                      { name: 'Science & Tech', color: 'green', count: events.filter(e => e.type?.toLowerCase() === 'science').length },
                      { name: 'Music', color: 'yellow', count: events.filter(e => e.type?.toLowerCase() === 'music').length },
                      { name: 'Other', color: 'gray', count: events.filter(e => !e.type || !['sports', 'arts', 'science', 'music'].includes(e.type.toLowerCase())).length },
                    ].map(category => (
                      <div key={category.name} className="flex justify-between items-center">
                        <Label>{category.name}</Label>
                        <span className={`text-sm bg-${category.color}-100 text-${category.color}-800 px-2 py-0.5 rounded-full`}>
                          {category.count}
                        </span>
                      </div>
                    ))}
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
                      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                      .slice(0, 3)
                      .map(event => (
                        <div key={event.id} className="border-b pb-2 last:border-b-0 last:pb-0">
                          <div className="font-medium">{event.title}</div>
                          <div className="text-sm text-gray-500 mt-1">
                            {new Date(event.startDate).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    {events.filter(event => new Date(event.startDate) > new Date()).length === 0 && (
                      <div className="text-center py-4 text-gray-500">
                        No upcoming events scheduled
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Create/Edit Event Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingEvent ? 'Edit Event' : 'Create New Event'}</DialogTitle>
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
                      <Input placeholder="Enter event title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter event description" 
                        className="resize-none" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          value={format(field.value, "yyyy-MM-dd")}
                          onChange={(e) => {
                            const date = new Date(e.target.value);
                            field.onChange(date);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          value={format(field.value, "yyyy-MM-dd")}
                          onChange={(e) => {
                            const date = new Date(e.target.value);
                            field.onChange(date);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter event location" {...field} />
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
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select event type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Sports">Sports</SelectItem>
                          <SelectItem value="Arts">Arts & Crafts</SelectItem>
                          <SelectItem value="Science">Science & Tech</SelectItem>
                          <SelectItem value="Music">Music</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="capacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Capacity</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          placeholder="Enter capacity"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="upcoming">Upcoming</SelectItem>
                        <SelectItem value="ongoing">Ongoing</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={createEventMutation.isPending || updateEventMutation.isPending}
                >
                  {(createEventMutation.isPending || updateEventMutation.isPending) && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  {editingEvent ? 'Update Event' : 'Create Event'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Event</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete "{deleteEventRef.current?.title}"? This action cannot be undone.</p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteEventMutation.mutate(deleteEventRef.current?.id as number)}
              disabled={deleteEventMutation.isPending}
            >
              {deleteEventMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}