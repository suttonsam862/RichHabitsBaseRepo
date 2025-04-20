import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ListChecks, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { useState } from "react";
import { ScrollableDialogContent } from "@/components/ui/scrollable-dialog-content";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

// Task status types with corresponding UI components
const taskStatusConfig = {
  completed: {
    label: "Completed",
    icon: CheckCircle,
    class: "text-green-500",
    badgeVariant: "outline",
  },
  inProgress: {
    label: "In Progress",
    icon: Clock,
    class: "text-amber-500",
    badgeVariant: "outline",
  },
  pending: {
    label: "Pending",
    icon: Clock,
    class: "text-blue-500",
    badgeVariant: "outline",
  },
  overdue: {
    label: "Overdue",
    icon: AlertCircle,
    class: "text-red-500",
    badgeVariant: "destructive",
  },
};

export default function TaskManagementPage() {
  const [activeTab, setActiveTab] = useState("allTasks");
  const [selectedCamp, setSelectedCamp] = useState<string>("");
  
  // Fetch camps to get a list of camps that have tasks
  const {
    data: campsData,
    isLoading: isLoadingCamps,
  } = useQuery({
    queryKey: ["/api/camps"],
  });

  // Fetch tasks (we'll use mock data for now)
  const camps = campsData?.data || [];
  
  // Mock tasks for demo purposes
  const mockTasks = [
    {
      id: 1,
      title: "Confirm venue reservation",
      status: "completed",
      dueDate: "2025-05-15",
      assignedTo: "John Smith",
      campId: 3,
      campName: "Birmingham Slam Camp",
      priority: "high",
    },
    {
      id: 2,
      title: "Order camp t-shirts",
      status: "inProgress",
      dueDate: "2025-05-20",
      assignedTo: "Jane Doe",
      campId: 3,
      campName: "Birmingham Slam Camp",
      priority: "medium",
    },
    {
      id: 3,
      title: "Arrange transportation",
      status: "pending",
      dueDate: "2025-05-25",
      assignedTo: "Unassigned",
      campId: 3,
      campName: "Birmingham Slam Camp",
      priority: "low",
    },
    {
      id: 4,
      title: "Confirm clinician travel arrangements",
      status: "overdue",
      dueDate: "2025-04-30",
      assignedTo: "Michael Johnson",
      campId: 3,
      campName: "Birmingham Slam Camp",
      priority: "high",
    },
  ];
  
  // Filter tasks based on active tab
  const filteredTasks = mockTasks.filter(task => {
    if (activeTab === "allTasks") return true;
    if (activeTab === "completedTasks") return task.status === "completed";
    if (activeTab === "pendingTasks") return task.status === "pending" || task.status === "inProgress";
    if (activeTab === "overdueTasks") return task.status === "overdue";
    return true;
  }).filter(task => {
    if (!selectedCamp || selectedCamp === "all") return true;
    return task.campId.toString() === selectedCamp;
  });
  
  // Loading state
  if (isLoadingCamps) {
    return (
      <div className="container mx-auto py-10 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Helper to render task status
  const renderTaskStatus = (status) => {
    const config = taskStatusConfig[status];
    const Icon = config.icon;
    
    return (
      <Badge variant={config.badgeVariant} className={config.class}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Camp Task Management</h1>
        <div className="flex items-center space-x-4">
          <div className="flex flex-col space-y-1 w-64">
            <Label htmlFor="camp-select">Filter by Camp</Label>
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
            <ListChecks className="h-4 w-4 mr-2" />
            Add New Task
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-6">
        <TabsList className="mb-4">
          <TabsTrigger value="allTasks">
            <ListChecks className="h-4 w-4 mr-2" />
            All Tasks
          </TabsTrigger>
          <TabsTrigger value="pendingTasks">
            <Clock className="h-4 w-4 mr-2" />
            Pending Tasks
          </TabsTrigger>
          <TabsTrigger value="completedTasks">
            <CheckCircle className="h-4 w-4 mr-2" />
            Completed Tasks
          </TabsTrigger>
          <TabsTrigger value="overdueTasks">
            <AlertCircle className="h-4 w-4 mr-2" />
            Overdue Tasks
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab}>
          <Card>
            <CardHeader>
              <CardTitle>{activeTab === "allTasks" ? "All Tasks" : 
                         activeTab === "pendingTasks" ? "Pending Tasks" :
                         activeTab === "completedTasks" ? "Completed Tasks" : 
                         "Overdue Tasks"}</CardTitle>
              <CardDescription>
                {activeTab === "allTasks" ? "View and manage all camp tasks" : 
                 activeTab === "pendingTasks" ? "Tasks that are in progress or waiting to be started" :
                 activeTab === "completedTasks" ? "Tasks that have been completed" : 
                 "Tasks that are past their due date"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollableDialogContent className="max-h-[70vh]">
                {filteredTasks.length > 0 ? (
                  <div className="space-y-4">
                    {filteredTasks.map((task) => (
                      <Card key={task.id} className="overflow-hidden">
                        <CardHeader className="bg-primary/5 py-3">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-lg">{task.title}</CardTitle>
                            {renderTaskStatus(task.status)}
                          </div>
                          <CardDescription>
                            Camp: {task.campName}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-4">
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Due Date:</span>
                              <span className="font-medium">{task.dueDate}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Assigned To:</span>
                              <span className="font-medium">{task.assignedTo}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Priority:</span>
                              <span className="font-medium capitalize">{task.priority}</span>
                            </div>
                            <div className="flex space-x-2 mt-4">
                              <Button variant="outline" size="sm" className="flex-1">
                                Edit
                              </Button>
                              {task.status !== "completed" && (
                                <Button size="sm" className="flex-1">
                                  Mark Complete
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-8 text-muted-foreground">No tasks found</p>
                )}
              </ScrollableDialogContent>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}