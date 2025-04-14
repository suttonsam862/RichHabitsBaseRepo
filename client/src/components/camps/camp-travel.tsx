import { useState } from "react";
import { useCampTravel } from "@/hooks/use-camps";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertTravelSchema } from "@shared/schema";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, PlusCircle, Plane, Map, Search } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";

// Extend schema for client-side validation
const travelFormSchema = insertTravelSchema.extend({
  departureDateTime: z.coerce.date().optional(),
  arrivalDateTime: z.coerce.date().optional(),
});

type TravelFormValues = z.infer<typeof travelFormSchema>;

interface CampTravelProps {
  campId: number;
}

export default function CampTravel({ campId }: CampTravelProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { data: travelArrangements, isLoading, error } = useCampTravel(campId);
  const { toast } = useToast();

  const form = useForm<TravelFormValues>({
    resolver: zodResolver(travelFormSchema),
    defaultValues: {
      campId,
      participantId: undefined,
      staffId: undefined,
      travelType: "flight",
      departureLocation: "",
      departureDateTime: undefined,
      arrivalLocation: "",
      arrivalDateTime: undefined,
      carrierName: "",
      carrierNumber: "",
      status: "scheduled",
      needsPickup: false,
      pickupAssigned: false,
      notes: "",
    },
  });

  const onSubmit = async (values: TravelFormValues) => {
    try {
      await apiRequest("POST", `/api/camps/${campId}/travel`, values);
      toast({
        title: "Success",
        description: "Travel arrangement added successfully",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/camps/${campId}/travel`] });
      setIsAddDialogOpen(false);
      form.reset();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add travel arrangement",
        variant: "destructive",
      });
    }
  };

  const filteredTravel = travelArrangements?.filter(arrangement => {
    if (!searchQuery) return true;
    
    const departureInfo = arrangement.departureLocation?.toLowerCase() || "";
    const arrivalInfo = arrangement.arrivalLocation?.toLowerCase() || "";
    const carrierInfo = `${arrangement.carrierName} ${arrangement.carrierNumber}`.toLowerCase();
    const query = searchQuery.toLowerCase();
    
    return departureInfo.includes(query) || 
           arrivalInfo.includes(query) || 
           carrierInfo.includes(query);
  });

  // Calculate statistics
  const flightCount = travelArrangements?.filter(t => t.travelType === "flight").length || 0;
  const confirmedCount = travelArrangements?.filter(t => t.status === "confirmed").length || 0;
  const needsPickupCount = travelArrangements?.filter(t => t.needsPickup).length || 0;
  const pickupAssignedCount = travelArrangements?.filter(t => t.pickupAssigned).length || 0;
  const pickupNeededCount = needsPickupCount - pickupAssignedCount;

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
          <h3 className="text-lg font-medium text-red-600">Error loading travel data</h3>
          <p className="mt-2 text-muted-foreground">
            {error instanceof Error ? error.message : "An unknown error occurred"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Travel Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border rounded-lg p-4 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Arrangements</p>
              <h3 className="text-2xl font-bold mt-1">{travelArrangements?.length || 0}</h3>
            </div>
            <div className="bg-primary-50 p-2 rounded-md">
              <Plane className="h-5 w-5 text-primary" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xs text-muted-foreground font-medium">
              {flightCount} flights
            </span>
          </div>
        </div>
        
        <div className="bg-card border rounded-lg p-4 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Confirmed</p>
              <h3 className="text-2xl font-bold mt-1">{confirmedCount}</h3>
            </div>
            <div className="bg-green-50 p-2 rounded-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="bg-card border rounded-lg p-4 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Needs Pickup</p>
              <h3 className="text-2xl font-bold mt-1">{needsPickupCount}</h3>
            </div>
            <div className="bg-orange-50 p-2 rounded-md">
              <Map className="h-5 w-5 text-orange-600" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xs text-orange-500 font-medium">
              {pickupNeededCount > 0 ? `${pickupNeededCount} unassigned` : "All assigned"}
            </span>
          </div>
        </div>
        
        <div className="bg-card border rounded-lg p-4 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground">This Week</p>
              <h3 className="text-2xl font-bold mt-1">
                {travelArrangements?.filter(t => {
                  if (!t.arrivalDateTime) return false;
                  const arrival = new Date(t.arrivalDateTime);
                  const now = new Date();
                  const weekFromNow = new Date();
                  weekFromNow.setDate(now.getDate() + 7);
                  return arrival >= now && arrival <= weekFromNow;
                }).length || 0}
              </h3>
            </div>
            <div className="bg-blue-50 p-2 rounded-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Travel Arrangements Table */}
      <Card>
        <div className="bg-white px-4 py-5 border-b sm:px-6 rounded-t-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900">Travel Arrangements</h3>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Manage all travel and transportation for camp participants and staff.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search travel..."
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
              Add Travel
            </Button>
          </div>
        </div>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-muted">
              <thead className="bg-muted">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Travel Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Departure
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Arrival
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Carrier
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Pickup
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-muted">
                {filteredTravel && filteredTravel.length > 0 ? (
                  filteredTravel.map((travel) => (
                    <tr key={travel.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-50 flex items-center justify-center">
                            {travel.travelType === "flight" ? (
                              <Plane className="h-5 w-5 text-primary" />
                            ) : travel.travelType === "bus" ? (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M13 7H7v6h6V7z" />
                                <path fillRule="evenodd" d="M7 2a1 1 0 00-.707 1.707L7 4.414v3.758a1 1 0 01-.293.707l-4 4C.817 14.769 2.156 18 4.828 18h10.343c2.673 0 4.012-3.231 2.122-5.121l-4-4A1 1 0 0113 8.172V4.414l.707-.707A1 1 0 0013 2H7zm2 6.172V4h2v4.172a3 3 0 00.879 2.12l1.168 1.168a4 4 0 01-8.092 0l1.17-1.169A3 3 0 0019 8.172z" clipRule="evenodd" />
                              </svg>
                            ) : (
                              <Map className="h-5 w-5 text-primary" />
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {travel.travelType.charAt(0).toUpperCase() + travel.travelType.slice(1)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {travel.participantId ? "Participant" : "Staff"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{travel.departureLocation}</div>
                        {travel.departureDateTime && (
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(travel.departureDateTime), "MMM d, yyyy h:mm a")}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{travel.arrivalLocation}</div>
                        {travel.arrivalDateTime && (
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(travel.arrivalDateTime), "MMM d, yyyy h:mm a")}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{travel.carrierName || "N/A"}</div>
                        {travel.carrierNumber && (
                          <div className="text-xs text-muted-foreground">{travel.carrierNumber}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            travel.status === "scheduled"
                              ? "bg-blue-100 text-blue-800"
                              : travel.status === "confirmed"
                              ? "bg-green-100 text-green-800"
                              : travel.status === "completed"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {travel.status.charAt(0).toUpperCase() + travel.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {travel.needsPickup ? (
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              travel.pickupAssigned
                                ? "bg-green-100 text-green-800"
                                : "bg-orange-100 text-orange-800"
                            }`}
                          >
                            {travel.pickupAssigned ? "Assigned" : "Needed"}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">Not needed</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button variant="link" className="text-primary hover:text-primary-700">
                          Edit
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-muted-foreground">
                      {searchQuery 
                        ? "No travel arrangements match your search query." 
                        : "No travel arrangements found. Add travel details to get started."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add Travel Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Travel Arrangement</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="travelType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Travel Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="flight">Flight</SelectItem>
                          <SelectItem value="bus">Bus</SelectItem>
                          <SelectItem value="train">Train</SelectItem>
                          <SelectItem value="car">Car</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="scheduled">Scheduled</SelectItem>
                          <SelectItem value="confirmed">Confirmed</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="participantId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Participant ID (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="For participant travel"
                          {...field} 
                          value={field.value || ''} 
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="staffId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Staff ID (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="For staff travel"
                          {...field} 
                          value={field.value || ''} 
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="departureLocation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Departure Location</FormLabel>
                    <FormControl>
                      <Input placeholder="E.g., LAX Airport, Los Angeles, CA" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="departureDateTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Departure Date/Time</FormLabel>
                    <FormControl>
                      <Input 
                        type="datetime-local" 
                        {...field} 
                        value={field.value instanceof Date ? field.value.toISOString().substring(0, 16) : field.value || ''} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="arrivalLocation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Arrival Location</FormLabel>
                    <FormControl>
                      <Input placeholder="E.g., ORD Airport, Chicago, IL" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="arrivalDateTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Arrival Date/Time</FormLabel>
                    <FormControl>
                      <Input 
                        type="datetime-local" 
                        {...field} 
                        value={field.value instanceof Date ? field.value.toISOString().substring(0, 16) : field.value || ''} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="carrierName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Carrier Name</FormLabel>
                      <FormControl>
                        <Input placeholder="E.g., United Airlines" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="carrierNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Carrier Number</FormLabel>
                      <FormControl>
                        <Input placeholder="E.g., UA123" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="needsPickup"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Needs Pickup
                        </FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Check if transportation from arrival location is needed
                        </p>
                      </div>
                    </FormItem>
                  )}
                />

                {form.watch("needsPickup") && (
                  <FormField
                    control={form.control}
                    name="pickupAssigned"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Pickup Assigned
                          </FormLabel>
                          <p className="text-sm text-muted-foreground">
                            Check if pickup has been arranged
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Additional notes about travel arrangements"
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
                  Add Travel
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
