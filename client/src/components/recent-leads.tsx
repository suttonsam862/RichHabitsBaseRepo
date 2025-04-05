import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Lead, LeadStatus } from "@/types";

export default function RecentLeads() {
  const { data, isLoading } = useQuery({
    queryKey: ['/api/leads/recent'],
    refetchInterval: false,
    refetchOnWindowFocus: false,
  });

  // Sample data - would normally come from the API
  const sampleLeads: Lead[] = [
    {
      id: 1,
      userId: 1,
      name: "Emily Davis",
      email: "emily@example.com",
      phone: "+1 (555) 123-4567",
      source: "Website",
      status: "new",
      notes: "Interested in the premium package",
      createdAt: new Date().toISOString(),
    },
    {
      id: 2,
      userId: 1,
      name: "Mark Wilson",
      email: "mark@example.com",
      phone: "+1 (555) 987-6543",
      source: "Referral",
      status: "contacted",
      notes: "Looking for custom solutions",
      createdAt: new Date().toISOString(),
    },
    {
      id: 3,
      userId: 1,
      name: "Sarah Johnson",
      email: "sarah@example.com",
      phone: "+1 (555) 789-0123",
      source: "Social Media",
      status: "qualified",
      notes: "Ready for a demo",
      createdAt: new Date().toISOString(),
    },
  ];

  const leads = data?.data || sampleLeads;

  const getStatusColor = (status: LeadStatus) => {
    switch (status) {
      case "new":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "contacted":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "qualified":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      case "proposal":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      case "negotiation":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "closed":
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300";
      case "lost":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold">Recent Leads</CardTitle>
          <Button variant="link" className="text-sm text-brand-500 dark:text-brand-400 p-0 h-auto">
            View all
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Source</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {leads.map((lead) => (
                <tr key={lead.id}>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <Avatar className="h-8 w-8 mr-3">
                        <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${lead.name}`} alt={lead.name} />
                        <AvatarFallback>{lead.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{lead.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{lead.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm text-gray-600 dark:text-gray-300">{lead.source}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Badge className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(lead.status as LeadStatus)}`}>
                      {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                    <Button variant="link" className="text-brand-500 dark:text-brand-400 p-0 h-auto">Details</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
