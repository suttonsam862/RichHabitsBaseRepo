import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarIcon, Mail, Phone, Building2, Clock, BriefcaseIcon, DollarSign, Clipboard, Tag } from 'lucide-react';
import LeadProgressChecklist from './lead-progress-checklist';
import { useToast } from '@/hooks/use-toast';

interface ContactLog {
  id: number;
  leadId: number;
  userId: number;
  contactMethod: string;
  notes: string | null;
  timestamp: string;
}

interface LeadDetailsPanelProps {
  lead: any;
  isAdmin: boolean;
  onClose: () => void;
  onUpdate: () => void;
  onEdit: (lead: any) => void;
}

export default function LeadDetailsPanel({ 
  lead, 
  isAdmin, 
  onClose, 
  onUpdate,
  onEdit
}: LeadDetailsPanelProps) {
  const [contactLogs, setContactLogs] = useState<ContactLog[]>([]);
  const [activeTab, setActiveTab] = useState('details');
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Fetch contact logs when the component mounts
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

  // Handle saving lead changes before closing
  const handleClose = async () => {
    console.log("Saving changes before closing lead details panel");
    
    try {
      // Get fresh data from the server
      const response = await apiRequest("GET", `/api/leads/${lead.id}`);
      
      if (!response.ok) {
        console.warn(`Lead data response not OK: ${response.status}`);
        onClose();
        return;
      }
      
      const updatedLeadData = await response.json();
      
      // Update the cache with the latest data
      queryClient.setQueryData(['/api/leads'], (oldData: any) => {
        if (!oldData || !oldData.data) return oldData;
        
        return {
          ...oldData,
          data: oldData.data.map((l: any) => {
            if (l.id === lead.id) {
              return updatedLeadData.data;
            }
            return l;
          })
        };
      });
      
      // Now we can safely close
      onClose();
    } catch (error) {
      console.error("Error doing final save:", error);
      // Close anyway to prevent user from being stuck
      onClose();
    }
  };

  // Format phone number for display
  const formatPhone = (phone: string | null) => {
    if (!phone) return 'Not provided';
    return phone;
  };

  return (
    <Card className="w-full border-0 shadow-none">
      <CardHeader className="bg-gray-50 pb-4 sticky top-0 z-10">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl font-semibold">{lead.name}</CardTitle>
            <CardDescription>
              {lead.companyName ? lead.companyName : 'No company'} · Lead #{lead.id}
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            {isAdmin && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onEdit(lead)}
              >
                Edit
              </Button>
            )}
            <Button 
              variant="default" 
              size="sm"
              onClick={handleClose}
              className="bg-brand-600 hover:bg-brand-700 text-white"
            >
              Close
            </Button>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 mt-2">
          <Badge 
            className={`
              ${lead.status === 'new' ? 'bg-green-100 text-green-800' : ''}
              ${lead.status === 'contacted' ? 'bg-blue-100 text-blue-800' : ''}
              ${lead.status === 'qualified' ? 'bg-purple-100 text-purple-800' : ''}
              ${lead.status === 'proposal' ? 'bg-orange-100 text-orange-800' : ''}
              ${lead.status === 'negotiation' ? 'bg-yellow-100 text-yellow-800' : ''}
              ${lead.status === 'closed' ? 'bg-brand-100 text-brand-800' : ''}
              ${lead.status === 'lost' ? 'bg-gray-100 text-gray-800' : ''}
              ${lead.status === 'converted' ? 'bg-indigo-100 text-indigo-800' : ''}
            `}
          >
            {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
          </Badge>
          
          <Badge variant="outline" className="bg-white">
            <Tag className="h-3 w-3 mr-1" />
            {lead.source}
          </Badge>
          
          {lead.claimed && (
            <Badge className="bg-teal-100 text-teal-800">
              Claimed
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <Tabs 
          defaultValue="details" 
          value={activeTab} 
          onValueChange={setActiveTab} 
          className="w-full"
          // Add a key to ensure the tabs don't unmount during state changes
          key={`lead-tabs-${lead.id}`}
        >
          <TabsList className="w-full grid grid-cols-3 bg-gray-50 rounded-none border-y">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="progress" className="progress-tab-trigger">Progress</TabsTrigger>
            <TabsTrigger value="logs">Contact Logs</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-start space-x-2">
                  <Mail className="h-4 w-4 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-sm text-gray-700">{lead.email || 'Not provided'}</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <Phone className="h-4 w-4 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Phone</p>
                    <p className="text-sm text-gray-700">{formatPhone(lead.phone)}</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <Building2 className="h-4 w-4 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Company</p>
                    <p className="text-sm text-gray-700">{lead.companyName || 'Not provided'}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-start space-x-2">
                  <DollarSign className="h-4 w-4 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Estimated Value</p>
                    <p className="text-sm text-gray-700">
                      {lead.value ? `$${parseInt(lead.value).toLocaleString()}` : 'Not estimated'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <Clock className="h-4 w-4 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Created At</p>
                    <p className="text-sm text-gray-700">{formatDate(lead.createdAt)}</p>
                  </div>
                </div>
                
                {lead.claimed && (
                  <div className="flex items-start space-x-2">
                    <BriefcaseIcon className="h-4 w-4 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Claimed At</p>
                      <p className="text-sm text-gray-700">{formatDate(lead.claimedAt)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-4">
              <h3 className="text-sm font-medium mb-2">Notes</h3>
              <div className="p-3 bg-gray-50 rounded-md">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {lead.notes || 'No notes provided for this lead.'}
                </p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent 
            value="progress" 
            className="p-4"
            // Add a stable key to prevent the component from unmounting during updates
            key={`progress-tab-${lead.id}`}
            // Add data attribute to make targeting easier with CSS
            data-progress-panel="true"
          >
            {lead.claimed ? (
              <LeadProgressChecklist 
                leadId={lead.id}
                contactComplete={lead.contactComplete || false}
                itemsConfirmed={lead.itemsConfirmed || false}
                submittedToDesign={lead.submittedToDesign || false}
                contactLogs={contactLogs}
                onUpdate={() => {
                  console.log("Lead progress updated, refreshing lead view");
                  
                  // Force the active tab to stay on "progress"
                  setActiveTab("progress");
                  
                  // Use the parent component's update handler
                  onUpdate();
                  
                  // Also refresh contact logs
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
                      console.log("Contact logs refreshed:", data);
                      const logs = Array.isArray(data.data) ? data.data : [];
                      setContactLogs(logs);
                    })
                    .catch(error => {
                      console.error("Error refreshing contact logs:", error);
                      // Keep existing logs on error
                    });
                }}
              />
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Clipboard className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <h3 className="text-lg font-medium mb-1">Lead Not Claimed</h3>
                <p>This lead needs to be claimed before tracking progress.</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="logs" className="p-4">
            <h3 className="text-sm font-medium mb-4">Contact History</h3>
            {contactLogs && contactLogs.length > 0 ? (
              <div className="space-y-3">
                {contactLogs.map((log) => (
                  <div key={log.id} className="p-3 bg-gray-50 rounded-md">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium capitalize">{log.contactMethod}</span>
                      <span className="text-xs text-gray-500">
                        {formatDate(log.timestamp)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">
                      {log.notes || "No notes provided for this contact."}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 bg-gray-50 rounded-md text-center">
                <CalendarIcon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-gray-500 text-sm">No contact logs found for this lead.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="flex justify-between py-3 px-4 bg-gray-50">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setActiveTab(activeTab === 'details' ? 'progress' : (activeTab === 'progress' ? 'logs' : 'details'))}
        >
          Next Section
        </Button>
        
        <Button 
          variant="default" 
          size="sm"
          onClick={handleClose}
          className="bg-brand-600 hover:bg-brand-700 text-white"
        >
          Close
        </Button>
      </CardFooter>
    </Card>
  );
}