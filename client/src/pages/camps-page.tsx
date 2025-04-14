import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import AppLayout from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabTrigger, TabContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useCamp } from "@/hooks/use-camps";
import { Plus } from "lucide-react";
import CampList from "@/components/camps/camp-list";
import CampForm from "@/components/camps/camp-form";
import CampDashboard from "@/components/camps/camp-dashboard";
import CampBudget from "@/components/camps/camp-budget";
import CampParticipants from "@/components/camps/camp-participants";
import CampHousing from "@/components/camps/camp-housing";
import CampTravel from "@/components/camps/camp-travel";
import CampSchedule from "@/components/camps/camp-schedule";
import CampStaff from "@/components/camps/camp-staff";
import CampDocuments from "@/components/camps/camp-documents";

export default function CampsPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [match, params] = useRoute("/camps/:id");
  const [_, navigate] = useLocation();
  
  const campId = match ? parseInt(params.id) : undefined;
  const { data: camp } = useCamp(campId);

  useEffect(() => {
    document.title = camp 
      ? `${camp.name} | Rich Habits Camp Management` 
      : "Camps | Rich Habits Camp Management";
  }, [camp]);

  // Reset tab when changing between camps
  useEffect(() => {
    setActiveTab("dashboard");
  }, [campId]);

  const handleCreateCamp = () => {
    setIsCreateDialogOpen(true);
  };

  const handleCampCreated = (campId: number) => {
    setIsCreateDialogOpen(false);
    navigate(`/camps/${campId}`);
  };

  return (
    <AppLayout
      title={camp ? camp.name : "Camp Management"}
      action={
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleCreateCamp} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Camp
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <CampForm onSuccess={handleCampCreated} />
          </DialogContent>
        </Dialog>
      }
    >
      {!campId ? (
        <CampList />
      ) : (
        <div className="space-y-6">
          <Tabs defaultValue={activeTab}>
            <TabsList className="mb-6">
              <TabTrigger value="dashboard" onClick={() => setActiveTab("dashboard")}>
                Dashboard
              </TabTrigger>
              <TabTrigger value="budget" onClick={() => setActiveTab("budget")}>
                Budget
              </TabTrigger>
              <TabTrigger value="participants" onClick={() => setActiveTab("participants")}>
                Participants
              </TabTrigger>
              <TabTrigger value="housing" onClick={() => setActiveTab("housing")}>
                Housing
              </TabTrigger>
              <TabTrigger value="travel" onClick={() => setActiveTab("travel")}>
                Travel
              </TabTrigger>
              <TabTrigger value="schedule" onClick={() => setActiveTab("schedule")}>
                Schedule
              </TabTrigger>
              <TabTrigger value="staff" onClick={() => setActiveTab("staff")}>
                Staff
              </TabTrigger>
              <TabTrigger value="documents" onClick={() => setActiveTab("documents")}>
                Documents
              </TabTrigger>
            </TabsList>

            <TabContent value="dashboard">
              <CampDashboard campId={campId} />
            </TabContent>
            
            <TabContent value="budget">
              <CampBudget campId={campId} />
            </TabContent>
            
            <TabContent value="participants">
              <CampParticipants campId={campId} />
            </TabContent>
            
            <TabContent value="housing">
              <CampHousing campId={campId} />
            </TabContent>
            
            <TabContent value="travel">
              <CampTravel campId={campId} />
            </TabContent>
            
            <TabContent value="schedule">
              <CampSchedule campId={campId} />
            </TabContent>
            
            <TabContent value="staff">
              <CampStaff campId={campId} />
            </TabContent>
            
            <TabContent value="documents">
              <CampDocuments campId={campId} />
            </TabContent>
          </Tabs>
        </div>
      )}
    </AppLayout>
  );
}
