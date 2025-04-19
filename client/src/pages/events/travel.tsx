import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  MapPin, 
  Plane,
  Car,
  Bus, 
  Hotel,
  Utensils,
  Calendar,
  Clock,
  Plus,
  Search,
  Filter,
  ExternalLink,
  Check,
  X
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";

// Sample data for the page
const sampleTravelArrangements = [
  {
    id: 1,
    campId: 1,
    campName: "Summer Wrestling Camp 2025",
    transportationType: "Air",
    departureDate: "2025-06-14",
    departureTime: "09:30 AM",
    departureLocation: "Denver International Airport",
    arrivalDate: "2025-06-14",
    arrivalTime: "11:45 AM",
    arrivalLocation: "Boulder Municipal Airport",
    carrier: "Mountain Air",
    confirmationNumber: "MA12345",
    passengers: [
      { id: 1, name: "Coach John Smith", role: "Head Coach", confirmed: true },
      { id: 2, name: "Sarah Thompson", role: "Assistant Coach", confirmed: true },
      { id: 3, name: "Michael Johnson", role: "Athletic Trainer", confirmed: false }
    ],
    status: "confirmed"
  },
  {
    id: 2,
    campId: 1,
    campName: "Summer Wrestling Camp 2025",
    transportationType: "Ground",
    departureDate: "2025-06-14",
    departureTime: "12:15 PM",
    departureLocation: "Boulder Municipal Airport",
    arrivalDate: "2025-06-14",
    arrivalTime: "01:00 PM",
    arrivalLocation: "Mountain View Training Center",
    carrier: "Alpine Shuttle Service",
    confirmationNumber: "GS56789",
    passengers: [
      { id: 1, name: "Coach John Smith", role: "Head Coach", confirmed: true },
      { id: 2, name: "Sarah Thompson", role: "Assistant Coach", confirmed: true },
      { id: 3, name: "Michael Johnson", role: "Athletic Trainer", confirmed: true },
      { id: 4, name: "Team (15 people)", role: "Athletes", confirmed: true }
    ],
    status: "confirmed"
  },
  {
    id: 3,
    campId: 2,
    campName: "Spring Training Clinic",
    transportationType: "Ground",
    departureDate: "2025-04-10",
    departureTime: "07:30 AM",
    departureLocation: "High School Parking Lot",
    arrivalDate: "2025-04-10",
    arrivalTime: "09:45 AM",
    arrivalLocation: "Lakeside Sports Complex",
    carrier: "Charter Bus Company",
    confirmationNumber: "CB34567",
    passengers: [
      { id: 1, name: "Coach Sarah Wilson", role: "Head Coach", confirmed: true },
      { id: 2, name: "Robert Davis", role: "Assistant Coach", confirmed: true },
      { id: 3, name: "Team (22 people)", role: "Athletes", confirmed: true }
    ],
    status: "confirmed"
  }
];

const sampleAccommodations = [
  {
    id: 1,
    campId: 1,
    campName: "Summer Wrestling Camp 2025",
    name: "Mountain Lodge Hotel",
    address: "234 Summit Road, Boulder, CO 80302",
    checkInDate: "2025-06-14",
    checkInTime: "03:00 PM",
    checkOutDate: "2025-06-22",
    checkOutTime: "11:00 AM",
    roomCount: {
      single: 4,
      double: 10,
      suite: 2
    },
    amenities: ["Free WiFi", "Breakfast Included", "Fitness Center", "Meeting Room", "Laundry Service"],
    confirmationNumber: "ML78901",
    specialRequests: "Training room for evening team meetings",
    status: "confirmed",
    totalCost: 7850,
    contactPerson: "Emma Rodriguez",
    contactEmail: "reservations@mountainlodge.com",
    contactPhone: "(303) 555-1234"
  },
  {
    id: 2,
    campId: 2,
    campName: "Spring Training Clinic",
    name: "Lakeside Inn",
    address: "567 Shore Drive, Tampa, FL 33601",
    checkInDate: "2025-04-09",
    checkInTime: "04:00 PM",
    checkOutDate: "2025-04-13",
    checkOutTime: "10:00 AM",
    roomCount: {
      single: 2,
      double: 6,
      suite: 1
    },
    amenities: ["Free WiFi", "Pool", "Restaurant", "Business Center"],
    confirmationNumber: "LI45678",
    specialRequests: "Early check-in if possible",
    status: "confirmed",
    totalCost: 3200,
    contactPerson: "James Wilson",
    contactEmail: "bookings@lakesideinn.com",
    contactPhone: "(813) 555-6789"
  }
];

const sampleMealArrangements = [
  {
    id: 1,
    campId: 1,
    campName: "Summer Wrestling Camp 2025",
    provider: "Mountain Catering Co.",
    location: "Mountain View Training Center Cafeteria",
    mealPlans: [
      {
        date: "2025-06-15",
        meals: [
          { type: "Breakfast", time: "07:00 AM", menu: "Continental breakfast with fruit, yogurt, and whole grain options" },
          { type: "Lunch", time: "12:00 PM", menu: "Build-your-own sandwich bar, salad, and soup" },
          { type: "Dinner", time: "06:30 PM", menu: "Protein options with vegetables and complex carbohydrates" }
        ]
      },
      {
        date: "2025-06-16",
        meals: [
          { type: "Breakfast", time: "07:00 AM", menu: "Hot breakfast with eggs, oatmeal, and fruit" },
          { type: "Lunch", time: "12:00 PM", menu: "Protein bowls with rice, vegetables, and choice of protein" },
          { type: "Dinner", time: "06:30 PM", menu: "Pasta night with protein options and salad bar" }
        ]
      }
    ],
    specialRequests: "Vegetarian, vegan, and gluten-free options required",
    confirmationNumber: "MC23456",
    status: "confirmed",
    totalCost: 4500,
    contactPerson: "Chef Michael Stevens",
    contactEmail: "michael@mountaincatering.com",
    contactPhone: "(303) 555-9876"
  },
  {
    id: 2,
    campId: 2,
    campName: "Spring Training Clinic",
    provider: "Coastal Cuisine",
    location: "Lakeside Sports Complex Dining Hall",
    mealPlans: [
      {
        date: "2025-04-10",
        meals: [
          { type: "Lunch", time: "12:30 PM", menu: "Grilled chicken wraps, fresh fruit, and sports drinks" },
          { type: "Dinner", time: "06:00 PM", menu: "Lean proteins, complex carbohydrates, and vegetables" }
        ]
      },
      {
        date: "2025-04-11",
        meals: [
          { type: "Breakfast", time: "07:30 AM", menu: "Protein pancakes, egg whites, fresh fruit" },
          { type: "Lunch", time: "12:30 PM", menu: "Deli sandwich buffet with salad options" },
          { type: "Dinner", time: "06:00 PM", menu: "Grilled options with sides and salad bar" }
        ]
      }
    ],
    specialRequests: "High-protein options for all meals, dairy-free alternatives",
    confirmationNumber: "CC56789",
    status: "confirmed",
    totalCost: 2100,
    contactPerson: "Lisa Martinez",
    contactEmail: "lisa@coastalcuisine.com",
    contactPhone: "(813) 555-4321"
  }
];

// Format date for display
const formatDate = (dateString: string) => {
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
};

// Get transportation icon
const getTransportationIcon = (type: string) => {
  switch(type.toLowerCase()) {
    case 'air':
      return <Plane className="h-5 w-5" />;
    case 'ground':
      return <Bus className="h-5 w-5" />;
    default:
      return <Car className="h-5 w-5" />;
  }
};

// Get status badge color
const getStatusColor = (status: string) => {
  switch(status.toLowerCase()) {
    case 'confirmed':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    case 'cancelled':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  }
};

export default function TravelAccommodations() {
  const searchParams = new URLSearchParams(window.location.search);
  const campId = searchParams.get('id');
  const [searchTerm, setSearchTerm] = useState("");
  const [campFilter, setCampFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // In a real app, you would fetch travel arrangements from the server
  const { data: travelArrangements = sampleTravelArrangements } = useQuery({
    queryKey: ['/api/camps', campId, 'travel-arrangements'],
    enabled: !!campId && false, // Disabled for now as we're using sample data
  });
  
  const { data: accommodations = sampleAccommodations } = useQuery({
    queryKey: ['/api/camps', campId, 'accommodations'],
    enabled: !!campId && false, // Disabled for now as we're using sample data
  });
  
  const { data: mealArrangements = sampleMealArrangements } = useQuery({
    queryKey: ['/api/camps', campId, 'meal-arrangements'],
    enabled: !!campId && false, // Disabled for now as we're using sample data
  });
  
  // Helper function to filter items based on search and filters
  const filterItems = (items: any[], itemType: string) => {
    return items.filter((item) => {
      // Apply camp filter
      if (campFilter !== "all" && item.campId.toString() !== campFilter) {
        return false;
      }
      
      // Apply status filter
      if (statusFilter !== "all" && item.status.toLowerCase() !== statusFilter.toLowerCase()) {
        return false;
      }
      
      // Apply search term
      const searchFields = ['campName', 'carrier', 'name', 'provider', 'location'];
      const matchesSearch = searchFields.some(field => 
        item[field] && item[field].toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      return matchesSearch;
    });
  };
  
  // Apply filters
  const filteredTravelArrangements = filterItems(travelArrangements, 'travel');
  const filteredAccommodations = filterItems(accommodations, 'accommodation');
  const filteredMealArrangements = filterItems(mealArrangements, 'meal');
  
  // Get unique camps for filter
  const allCamps = [...new Set([
    ...travelArrangements.map((item: any) => ({ id: item.campId, name: item.campName })),
    ...accommodations.map((item: any) => ({ id: item.campId, name: item.campName })),
    ...mealArrangements.map((item: any) => ({ id: item.campId, name: item.campName }))
  ].map(JSON.stringify))].map(JSON.parse);
  
  // Remove duplicates by id
  const uniqueCamps = Array.from(new Map(allCamps.map(item => [item.id, item])).values());

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Travel & Accommodations</h1>
          <p className="text-gray-500 mt-1">Manage all travel, lodging, and meal arrangements</p>
        </div>
        <div className="mt-4 md:mt-0 space-x-2">
          <Button variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Add Transportation
          </Button>
          <Button variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Add Accommodation
          </Button>
          <Button className="bg-brand-600 hover:bg-brand-700">
            <Plus className="mr-2 h-4 w-4" />
            Add Meal Plan
          </Button>
        </div>
      </div>
      
      {/* Filters Row */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-grow md:max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search arrangements..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Select value={campFilter} onValueChange={setCampFilter}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Filter by camp" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Camps</SelectItem>
            {uniqueCamps.map((camp: any) => (
              <SelectItem key={camp.id} value={camp.id.toString()}>{camp.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        
        <Button variant="outline" className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          More Filters
        </Button>
      </div>

      {/* Main Content with Tabs */}
      <Tabs defaultValue="transportation" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="transportation">Transportation</TabsTrigger>
          <TabsTrigger value="accommodations">Accommodations</TabsTrigger>
          <TabsTrigger value="meals">Meals</TabsTrigger>
        </TabsList>
        
        {/* Transportation Tab */}
        <TabsContent value="transportation" className="space-y-6">
          {filteredTravelArrangements.length > 0 ? (
            filteredTravelArrangements.map((travel: any) => (
              <Card key={travel.id} className="overflow-hidden">
                <CardHeader className="pb-3 flex flex-col md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      {getTransportationIcon(travel.transportationType)}
                      <CardTitle className="text-xl">{travel.transportationType} Transportation</CardTitle>
                      <Badge className={getStatusColor(travel.status)}>
                        {travel.status.charAt(0).toUpperCase() + travel.status.slice(1)}
                      </Badge>
                    </div>
                    <CardDescription>For {travel.campName}</CardDescription>
                  </div>
                  <div className="mt-2 md:mt-0">
                    <p className="text-sm text-gray-500">Confirmation #: <span className="font-medium">{travel.confirmationNumber}</span></p>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-medium text-lg mb-3">Departure</h3>
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <Calendar className="h-4 w-4 text-gray-400 mt-1" />
                          <div>
                            <p className="font-medium">{formatDate(travel.departureDate)}</p>
                            <p className="text-sm text-gray-500">Date</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Clock className="h-4 w-4 text-gray-400 mt-1" />
                          <div>
                            <p className="font-medium">{travel.departureTime}</p>
                            <p className="text-sm text-gray-500">Time</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-gray-400 mt-1" />
                          <div>
                            <p className="font-medium">{travel.departureLocation}</p>
                            <p className="text-sm text-gray-500">Location</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-lg mb-3">Arrival</h3>
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <Calendar className="h-4 w-4 text-gray-400 mt-1" />
                          <div>
                            <p className="font-medium">{formatDate(travel.arrivalDate)}</p>
                            <p className="text-sm text-gray-500">Date</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Clock className="h-4 w-4 text-gray-400 mt-1" />
                          <div>
                            <p className="font-medium">{travel.arrivalTime}</p>
                            <p className="text-sm text-gray-500">Time</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-gray-400 mt-1" />
                          <div>
                            <p className="font-medium">{travel.arrivalLocation}</p>
                            <p className="text-sm text-gray-500">Location</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div>
                    <h3 className="font-medium text-lg mb-3">Passengers</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 px-4 font-medium">Name</th>
                            <th className="text-left py-2 px-4 font-medium">Role</th>
                            <th className="text-left py-2 px-4 font-medium">Confirmed</th>
                          </tr>
                        </thead>
                        <tbody>
                          {travel.passengers.map((passenger: any) => (
                            <tr key={passenger.id} className="border-b">
                              <td className="py-2 px-4">{passenger.name}</td>
                              <td className="py-2 px-4">{passenger.role}</td>
                              <td className="py-2 px-4">
                                {passenger.confirmed ? (
                                  <span className="text-green-600"><Check className="h-4 w-4 inline-block" /></span>
                                ) : (
                                  <span className="text-red-600"><X className="h-4 w-4 inline-block" /></span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2 bg-gray-50">
                  <Button variant="outline" size="sm">
                    Edit Details
                  </Button>
                  <Button variant="outline" size="sm">
                    Print Itinerary
                  </Button>
                  <Button size="sm" className="bg-brand-600 hover:bg-brand-700">
                    Send to Team
                  </Button>
                </CardFooter>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <p className="text-muted-foreground mb-4">No transportation arrangements found with the current filters</p>
                <Button onClick={() => {
                  setSearchTerm("");
                  setCampFilter("all");
                  setStatusFilter("all");
                }}>Clear Filters</Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* Accommodations Tab */}
        <TabsContent value="accommodations" className="space-y-6">
          {filteredAccommodations.length > 0 ? (
            filteredAccommodations.map((accommodation: any) => (
              <Card key={accommodation.id} className="overflow-hidden">
                <CardHeader className="pb-3 flex flex-col md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Hotel className="h-5 w-5" />
                      <CardTitle className="text-xl">{accommodation.name}</CardTitle>
                      <Badge className={getStatusColor(accommodation.status)}>
                        {accommodation.status.charAt(0).toUpperCase() + accommodation.status.slice(1)}
                      </Badge>
                    </div>
                    <CardDescription>For {accommodation.campName}</CardDescription>
                  </div>
                  <div className="mt-2 md:mt-0">
                    <p className="text-sm text-gray-500">Confirmation #: <span className="font-medium">{accommodation.confirmationNumber}</span></p>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-medium text-lg mb-3">Location</h3>
                      <div className="flex items-start gap-2 mb-4">
                        <MapPin className="h-4 w-4 text-gray-400 mt-1" />
                        <p>{accommodation.address}</p>
                      </div>
                      
                      <h3 className="font-medium text-lg mb-3">Check-in/Check-out</h3>
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <div className="w-24 text-sm text-gray-500">Check-in:</div>
                          <div>
                            <span className="font-medium">{formatDate(accommodation.checkInDate)}</span> at <span className="font-medium">{accommodation.checkInTime}</span>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <div className="w-24 text-sm text-gray-500">Check-out:</div>
                          <div>
                            <span className="font-medium">{formatDate(accommodation.checkOutDate)}</span> at <span className="font-medium">{accommodation.checkOutTime}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-lg mb-3">Room Information</h3>
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center">
                          <div className="w-24 text-sm text-gray-500">Single:</div>
                          <div><span className="font-medium">{accommodation.roomCount.single}</span> rooms</div>
                        </div>
                        <div className="flex items-center">
                          <div className="w-24 text-sm text-gray-500">Double:</div>
                          <div><span className="font-medium">{accommodation.roomCount.double}</span> rooms</div>
                        </div>
                        <div className="flex items-center">
                          <div className="w-24 text-sm text-gray-500">Suite:</div>
                          <div><span className="font-medium">{accommodation.roomCount.suite}</span> rooms</div>
                        </div>
                        <div className="flex items-center mt-2">
                          <div className="w-24 text-sm text-gray-500">Total Cost:</div>
                          <div><span className="font-medium">${accommodation.totalCost.toLocaleString()}</span></div>
                        </div>
                      </div>
                      
                      <h3 className="font-medium text-lg mb-3">Contact</h3>
                      <div className="space-y-1">
                        <p>{accommodation.contactPerson}</p>
                        <p className="text-sm">{accommodation.contactEmail}</p>
                        <p className="text-sm">{accommodation.contactPhone}</p>
                      </div>
                    </div>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div>
                    <h3 className="font-medium text-lg mb-3">Amenities & Special Requests</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-2">Amenities</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          {accommodation.amenities.map((amenity: string, index: number) => (
                            <li key={index}>{amenity}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-2">Special Requests</h4>
                        <p>{accommodation.specialRequests}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2 bg-gray-50">
                  <Button variant="outline" size="sm">
                    Edit Details
                  </Button>
                  <Button variant="outline" size="sm">
                    View on Map
                  </Button>
                  <Button size="sm" className="bg-brand-600 hover:bg-brand-700">
                    Send to Team
                  </Button>
                </CardFooter>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <p className="text-muted-foreground mb-4">No accommodation arrangements found with the current filters</p>
                <Button onClick={() => {
                  setSearchTerm("");
                  setCampFilter("all");
                  setStatusFilter("all");
                }}>Clear Filters</Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* Meals Tab */}
        <TabsContent value="meals" className="space-y-6">
          {filteredMealArrangements.length > 0 ? (
            filteredMealArrangements.map((meal: any) => (
              <Card key={meal.id} className="overflow-hidden">
                <CardHeader className="pb-3 flex flex-col md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Utensils className="h-5 w-5" />
                      <CardTitle className="text-xl">{meal.provider}</CardTitle>
                      <Badge className={getStatusColor(meal.status)}>
                        {meal.status.charAt(0).toUpperCase() + meal.status.slice(1)}
                      </Badge>
                    </div>
                    <CardDescription>For {meal.campName}</CardDescription>
                  </div>
                  <div className="mt-2 md:mt-0">
                    <p className="text-sm text-gray-500">Confirmation #: <span className="font-medium">{meal.confirmationNumber}</span></p>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                      <h3 className="font-medium text-lg mb-3">Meal Plans</h3>
                      <div className="space-y-6">
                        {meal.mealPlans.map((day: any, dayIndex: number) => (
                          <div key={dayIndex}>
                            <h4 className="font-medium mb-2">{formatDate(day.date)}</h4>
                            <div className="space-y-3">
                              {day.meals.map((mealItem: any, mealIndex: number) => (
                                <div key={mealIndex} className="bg-gray-50 p-3 rounded-md">
                                  <div className="flex justify-between mb-1">
                                    <span className="font-medium">{mealItem.type}</span>
                                    <span className="text-sm text-gray-500">{mealItem.time}</span>
                                  </div>
                                  <p className="text-sm">{mealItem.menu}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <div className="bg-gray-50 p-4 rounded-md mb-4">
                        <h3 className="font-medium text-lg mb-3">Details</h3>
                        <div className="space-y-3">
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Location</h4>
                            <p>{meal.location}</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Total Cost</h4>
                            <p>${meal.totalCost.toLocaleString()}</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Special Requests</h4>
                            <p className="text-sm">{meal.specialRequests}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-md">
                        <h3 className="font-medium text-lg mb-3">Contact</h3>
                        <div className="space-y-1">
                          <p>{meal.contactPerson}</p>
                          <p className="text-sm">{meal.contactEmail}</p>
                          <p className="text-sm">{meal.contactPhone}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2 bg-gray-50">
                  <Button variant="outline" size="sm">
                    Edit Menu
                  </Button>
                  <Button variant="outline" size="sm">
                    Print Plan
                  </Button>
                  <Button size="sm" className="bg-brand-600 hover:bg-brand-700">
                    Send to Team
                  </Button>
                </CardFooter>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <p className="text-muted-foreground mb-4">No meal arrangements found with the current filters</p>
                <Button onClick={() => {
                  setSearchTerm("");
                  setCampFilter("all");
                  setStatusFilter("all");
                }}>Clear Filters</Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}