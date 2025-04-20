import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Users, UserCheck } from "lucide-react";
import { useState } from "react";
import { ScrollableDialogContent } from "@/components/ui/scrollable-dialog-content";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function StaffAssignmentsPage() {
  const [activeTab, setActiveTab] = useState("richHabitsStaff");
  const [selectedCamp, setSelectedCamp] = useState<string>("");
  
  // Fetch camps to get a list of camps that need staff assignments
  const {
    data: campsData,
    isLoading: isLoadingCamps,
  } = useQuery({
    queryKey: ["/api/camps"],
  });

  // Fetch staff members (both Rich Habits staff and clinicians)
  const {
    data: staffData,
    isLoading: isLoadingStaff,
  } = useQuery({
    queryKey: ["/api/staff"],
  });

  const camps = campsData?.data || [];
  const allStaff = staffData?.data || [];
  
  // Separate staff and clinicians
  const richHabitsStaff = allStaff.filter(staff => staff.role !== 'Clinician');
  const clinicians = allStaff.filter(staff => staff.role === 'Clinician');
  
  // Loading state
  if (isLoadingCamps || isLoadingStaff) {
    return (
      <div className="container mx-auto py-10 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Camp Staff Assignments</h1>
        <div className="flex items-center space-x-4">
          <div className="flex flex-col space-y-1 w-64">
            <Label htmlFor="camp-select">Select Camp</Label>
            <Select value={selectedCamp} onValueChange={setSelectedCamp}>
              <SelectTrigger id="camp-select">
                <SelectValue placeholder="Select a camp" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Camps</SelectItem>
                {camps.map((camp) => (
                  <SelectItem key={camp.id} value={camp.id.toString()}>
                    {camp.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button>
            <UserCheck className="h-4 w-4 mr-2" />
            Assign Staff
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-6">
        <TabsList className="mb-4">
          <TabsTrigger value="richHabitsStaff">
            <Users className="h-4 w-4 mr-2" />
            Rich Habits Staff
          </TabsTrigger>
          <TabsTrigger value="clinicians">
            <UserCheck className="h-4 w-4 mr-2" />
            Clinicians
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="richHabitsStaff">
          <Card>
            <CardHeader>
              <CardTitle>Rich Habits Staff Assignments</CardTitle>
              <CardDescription>
                View and manage Rich Habits staff assigned to camps
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollableDialogContent className="max-h-[70vh]">
                {richHabitsStaff.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {richHabitsStaff.map((staff) => (
                      <Card key={staff.id} className="overflow-hidden">
                        <CardHeader className="bg-primary/5 py-3">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-lg">{staff.name}</CardTitle>
                            <Badge variant="outline">{staff.role}</Badge>
                          </div>
                          <CardDescription>
                            {staff.specialization || "No specialization"}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-4">
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Assigned Camps:</span>
                              <span className="font-medium">{staff.campAssignments ? staff.campAssignments.length : 0}</span>
                            </div>
                            <Button variant="outline" size="sm" className="w-full">
                              View Assignments
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-8 text-muted-foreground">No Rich Habits staff members found</p>
                )}
              </ScrollableDialogContent>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="clinicians">
          <Card>
            <CardHeader>
              <CardTitle>Clinicians</CardTitle>
              <CardDescription>
                View and manage clinicians assigned to camps
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollableDialogContent className="max-h-[70vh]">
                {clinicians.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {clinicians.map((clinician) => (
                      <Card key={clinician.id} className="overflow-hidden">
                        <CardHeader className="bg-primary/5 py-3">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-lg">{clinician.name}</CardTitle>
                            <Badge>Clinician</Badge>
                          </div>
                          <CardDescription>
                            {clinician.specialization || "No specialization"}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-4">
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Assigned Camps:</span>
                              <span className="font-medium">{clinician.campAssignments ? clinician.campAssignments.length : 0}</span>
                            </div>
                            <Button variant="outline" size="sm" className="w-full">
                              View Assignments
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-8 text-muted-foreground">No clinicians found</p>
                )}
              </ScrollableDialogContent>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}