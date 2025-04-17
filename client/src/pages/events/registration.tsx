import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { 
  Plus, 
  Search, 
  Filter, 
  ArrowUpDown, 
  MoreHorizontal, 
  FileText, 
  Mail, 
  Trash2,
  ChevronLeft,
  Loader2
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PaginationBar } from "@/components/pagination-bar";

import { formatDate, formatCurrency } from "@/lib/utils";

// Registration Management Page
function RegistrationManagement() {
  const [location, setLocation] = useLocation();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [campFilter, setcampFilter] = useState("all");
  const [selectedTab, setSelectedTab] = useState("active");
  
  // Get camps for filtering
  const { data: camps, isLoading: isLoadingCamps } = useQuery({
    queryKey: ['/api/camps'],
  });
  
  // Get registrations with filters
  const { 
    data: registrationsData, 
    isLoading: isLoadingRegistrations 
  } = useQuery({
    queryKey: [
      '/api/registrations', 
      { 
        page: currentPage, 
        search: searchTerm,
        status: statusFilter,
        campId: campFilter,
        tab: selectedTab
      }
    ],
  });

  // Calculate pagination
  const totalRegistrations = registrationsData?.totalCount || 0;
  const pageSize = 10;
  const totalPages = Math.ceil(totalRegistrations / pageSize);
  
  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page on new search
  };
  
  // Handle status filter change
  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1); // Reset to first page on filter change
  };
  
  // Handle camp filter change
  const handleCampChange = (value: string) => {
    setcampFilter(value);
    setCurrentPage(1); // Reset to first page on filter change
  };
  
  // Handle tab change
  const handleTabChange = (value: string) => {
    setSelectedTab(value);
    setCurrentPage(1); // Reset to first page on tab change
  };
  
  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  // View registration details
  const viewRegistrationDetails = (registrationId: number) => {
    setLocation(`/events/registration-details/${registrationId}`);
  };
  
  // Loading state
  if (isLoadingCamps) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Camp Registrations</h1>
          <p className="text-muted-foreground mt-1">
            Manage all camp registrations and participant information
          </p>
        </div>
        <div className="mt-4 md:mt-0 space-x-2">
          <Button 
            variant="outline"
            asChild
          >
            <Link href="/events/overview">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Camps
            </Link>
          </Button>
          <Button className="bg-brand-600 hover:bg-brand-700">
            <Plus className="mr-2 h-4 w-4" />
            Add Registration
          </Button>
        </div>
      </div>
      
      {/* Tabs */}
      <Tabs
        defaultValue="active"
        className="mb-6"
        onValueChange={handleTabChange}
      >
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-4 lg:w-[600px]">
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>
      </Tabs>
      
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-grow md:max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search registrations..."
            className="pl-8"
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <Select value={statusFilter} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="waiting">Waiting List</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={campFilter} onValueChange={handleCampChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by Camp" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Camps</SelectItem>
              {camps?.data?.map((camp) => (
                <SelectItem key={camp.id} value={camp.id.toString()}>
                  {camp.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Registrations List */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Registrations</CardTitle>
          <CardDescription>
            Showing {Math.min((currentPage - 1) * pageSize + 1, totalRegistrations)} - {Math.min(currentPage * pageSize, totalRegistrations)} of {totalRegistrations} registrations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingRegistrations ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : registrationsData?.data?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No registrations found. Adjust your filters or add a new registration.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 font-medium">
                      <div className="flex items-center">
                        ID
                        <ArrowUpDown className="ml-1 h-4 w-4" />
                      </div>
                    </th>
                    <th className="text-left py-3 px-2 font-medium">
                      <div className="flex items-center">
                        Participant
                        <ArrowUpDown className="ml-1 h-4 w-4" />
                      </div>
                    </th>
                    <th className="text-left py-3 px-2 font-medium">
                      <div className="flex items-center">
                        Camp
                        <ArrowUpDown className="ml-1 h-4 w-4" />
                      </div>
                    </th>
                    <th className="text-left py-3 px-2 font-medium">
                      <div className="flex items-center">
                        Tier
                      </div>
                    </th>
                    <th className="text-left py-3 px-2 font-medium">
                      <div className="flex items-center">
                        Date
                        <ArrowUpDown className="ml-1 h-4 w-4" />
                      </div>
                    </th>
                    <th className="text-left py-3 px-2 font-medium">
                      <div className="flex items-center">
                        Status
                      </div>
                    </th>
                    <th className="text-left py-3 px-2 font-medium">
                      <div className="flex items-center">
                        Payment
                      </div>
                    </th>
                    <th className="text-left py-3 px-2 font-medium">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {registrationsData?.data?.map((registration) => (
                    <tr 
                      key={registration.id} 
                      className="border-b hover:bg-muted/50 cursor-pointer"
                      onClick={() => viewRegistrationDetails(registration.id)}
                    >
                      <td className="py-3 px-2">#{registration.id}</td>
                      <td className="py-3 px-2">
                        <div>
                          <div className="font-medium">{registration.firstName} {registration.lastName}</div>
                          <div className="text-sm text-muted-foreground">{registration.email}</div>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <div>
                          <div className="font-medium">{registration.campName}</div>
                          <div className="text-sm text-muted-foreground">{registration.campType}</div>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <div className="font-medium">{registration.tierName}</div>
                      </td>
                      <td className="py-3 px-2">
                        <div>
                          <div className="font-medium">{formatDate(registration.registrationDate)}</div>
                          {registration.lastUpdated && (
                            <div className="text-sm text-muted-foreground">
                              Updated: {formatDate(registration.lastUpdated)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <Badge
                          className={`
                            ${registration.status === 'confirmed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 
                            registration.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' : 
                            registration.status === 'cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' : 
                            registration.status === 'waiting' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'}`
                          }
                          variant="outline"
                        >
                          {registration.status.charAt(0).toUpperCase() + registration.status.slice(1)}
                        </Badge>
                      </td>
                      <td className="py-3 px-2">
                        <div>
                          <div className="font-medium">{formatCurrency(registration.amount)}</div>
                          <div className="text-sm text-muted-foreground">{registration.paymentStatus}</div>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              viewRegistrationDetails(registration.id);
                            }}>
                              <FileText className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                              <Mail className="mr-2 h-4 w-4" />
                              Send Email
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={(e) => e.stopPropagation()}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <PaginationBar
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default RegistrationManagement;