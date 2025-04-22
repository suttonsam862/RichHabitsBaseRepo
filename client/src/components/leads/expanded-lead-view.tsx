import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Phone, Mail, Calendar, Edit, MessageSquare, ArrowUpRight, CheckCircle2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { ContactLog } from "@/types";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import LeadProgressChecklist from "./lead-progress-checklist";

interface ExpandedLeadViewProps {
  lead: any;
  onEdit?: () => void;
  onConvert?: () => void;
  isAdmin: boolean;
  onClose: () => void;
}

export default function ExpandedLeadView({ 
  lead,
  onEdit,
  onConvert,
  isAdmin,
  onClose
}: ExpandedLeadViewProps) {
  const [contactLogs, setContactLogs] = useState<ContactLog[]>([]);
  const [activeSection, setActiveSection] = useState<string>("details");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch contact logs when lead changes
  useEffect(() => {
    if (lead?.id) {
      console.log(`Fetching contact logs for lead ${lead.id}`);
      apiRequest("GET", `/api/leads/${lead.id}/contact-logs`)
        .then(res => {
          if (!res.ok) {
            console.warn(`Contact logs response not OK: ${res.status} ${res.statusText}`);
            return { data: [] };
          }
          
          try {
            return res.json();
          } catch (e) {
            console.error("Error parsing contact logs JSON:", e);
            return { data: [] };
          }
        })
        .then(data => {
          console.log("Contact logs loaded:", data);
          const logs = Array.isArray(data.data) ? data.data : [];
          setContactLogs(logs);
        })
        .catch(error => {
          console.error("Error fetching contact logs:", error);
          setContactLogs([]);
        });
    }
  }, [lead?.id]);

  // Function to handle refreshing lead data
  const refreshLeadData = async () => {
    if (!lead?.id) return;
    
    try {
      console.log(`Refreshing data for lead ${lead.id}`);
      const response = await apiRequest("GET", `/api/leads/${lead.id}`);
      
      if (!response.ok) {
        console.warn(`Lead data response not OK: ${response.status}`);
        return;
      }
      
      const updatedLeadData = await response.json();
      console.log("Updated lead data:", updatedLeadData);
      
      // Update the cache with the latest data
      queryClient.setQueryData(["/api/leads"], (oldData: any) => {
        if (!oldData?.data) return oldData;
        
        return {
          ...oldData,
          data: oldData.data.map((oldLead: any) => {
            if (oldLead.id === lead.id) {
              return updatedLeadData.data;
            }
            return oldLead;
          })
        };
      });
    } catch (error) {
      console.error("Error refreshing lead data:", error);
      // Schedule a background invalidation on error
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
      }, 500);
    }
  };

  // Function to handle progress updates
  const handleProgressUpdate = () => {
    console.log("Lead progress updated, refreshing lead data");
    refreshLeadData();
    
    // Also refresh contact logs
    if (lead?.id) {
      apiRequest("GET", `/api/leads/${lead.id}/contact-logs`)
        .then(res => {
          if (!res.ok) {
            console.warn(`Contact logs response not OK: ${res.status}`);
            return { data: [] };
          }
          
          return res.json();
        })
        .then(data => {
          const logs = Array.isArray(data.data) ? data.data : [];
          setContactLogs(logs);
        })
        .catch(error => {
          console.error("Error refreshing contact logs:", error);
          setContactLogs([]);
        });
    }
  };

  // Function to safely close and save all changes
  const handleClose = () => {
    // Do a final refresh before closing to make sure all data is saved
    refreshLeadData().then(() => {
      onClose();
    });
  };

  if (!lead) return null;

  return (
    <Card className="border-t-4 border-t-blue-500 shadow-lg">
      {/* Header with key info and actions */}
      <div className="p-4 bg-gray-50 rounded-t-lg flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">{lead.name}</h3>
          <p className="text-sm text-gray-500">
            {lead.companyName && `${lead.companyName} • `}
            Added {formatDate(lead.createdAt)}
          </p>
        </div>
        <div className="flex gap-2">
          {onEdit && isAdmin && (
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit className="w-4 h-4 mr-1" /> Edit
            </Button>
          )}
          {onConvert && lead.status !== 'converted' && (
            <Button 
              size="sm" 
              className="bg-brand-600 hover:bg-brand-700 text-white"
              onClick={onConvert}
            >
              <ArrowUpRight className="w-4 h-4 mr-1" /> Convert
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleClose}>
            Close
          </Button>
        </div>
      </div>

      {/* Tab-like navigation */}
      <div className="px-4 flex border-b">
        <Button 
          variant="ghost" 
          className={`rounded-none border-b-2 ${activeSection === 'details' ? 'border-brand-600 text-brand-700' : 'border-transparent'}`}
          onClick={() => setActiveSection('details')}
        >
          Details
        </Button>
        <Button 
          variant="ghost" 
          className={`rounded-none border-b-2 ${activeSection === 'progress' ? 'border-brand-600 text-brand-700' : 'border-transparent'}`}
          onClick={() => setActiveSection('progress')}
        >
          Progress
        </Button>
        <Button 
          variant="ghost" 
          className={`rounded-none border-b-2 ${activeSection === 'logs' ? 'border-brand-600 text-brand-700' : 'border-transparent'}`}
          onClick={() => setActiveSection('logs')}
        >
          Contact Logs
        </Button>
      </div>

      {/* Content sections */}
      <div className="p-4">
        {/* Details Section */}
        {activeSection === 'details' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Contact Information</h4>
              <div className="space-y-2">
                <div className="flex items-center">
                  <Mail className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm">{lead.email || "No email provided"}</span>
                </div>
                <div className="flex items-center">
                  <Phone className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm">{lead.phone || "No phone provided"}</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm">Added {formatDate(lead.createdAt)}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Lead Information</h4>
              <div className="space-y-2">
                <div className="flex items-start">
                  <span className="text-sm font-medium w-24">Status:</span>
                  <Badge className="capitalize">{lead.status}</Badge>
                </div>
                <div className="flex items-start">
                  <span className="text-sm font-medium w-24">Source:</span>
                  <span className="text-sm">{lead.source}</span>
                </div>
                {lead.value && (
                  <div className="flex items-start">
                    <span className="text-sm font-medium w-24">Value:</span>
                    <span className="text-sm">${lead.value}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="col-span-1 md:col-span-2">
              <h4 className="text-sm font-medium text-gray-500 mb-2">Notes</h4>
              <p className="text-sm bg-gray-50 p-3 rounded-md">{lead.notes || "No notes available"}</p>
            </div>
          </div>
        )}

        {/* Progress Section */}
        {activeSection === 'progress' && lead.claimed && (
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">Lead Progress</h4>
            <LeadProgressChecklist 
              leadId={lead.id}
              contactComplete={lead.contactComplete || false}
              itemsConfirmed={lead.itemsConfirmed || false}
              submittedToDesign={lead.submittedToDesign || false}
              contactLogs={contactLogs}
              onUpdate={handleProgressUpdate}
            />
          </div>
        )}

        {/* Contact Logs Section */}
        {activeSection === 'logs' && (
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">Contact History</h4>
            {contactLogs && contactLogs.length > 0 ? (
              <div className="space-y-3">
                {contactLogs.map((log) => (
                  <div key={log.id} className="p-3 bg-gray-50 rounded-md">
                    <div className="flex justify-between">
                      <Badge variant="outline" className="capitalize">
                        {log.contactMethod}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {formatDate(log.timestamp)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm">{log.notes || "No notes provided"}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-gray-50 rounded-md text-center">
                <MessageSquare className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                <p className="text-gray-500 text-sm">No contact logs found for this lead.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}