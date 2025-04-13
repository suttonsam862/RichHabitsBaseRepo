import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { Label } from '@/components/ui/label';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';
import { apiRequest } from '@/lib/queryClient';

export default function DebugTools() {
  const [email, setEmail] = useState('charliereeves@rich-habits.com');
  const [queryData, setQueryData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchUserData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/users/email/${email}`);
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      const data = await response.json();
      setQueryData(data);
      
      // Also fetch nav settings
      if (data.user?.id) {
        try {
          const settingsResponse = await fetch(`/api/settings/navigation?userId=${data.user.id}`);
          if (settingsResponse.ok) {
            const settingsData = await settingsResponse.json();
            setQueryData(prev => ({
              ...prev,
              navSettings: settingsData
            }));
          }
        } catch (settingsErr) {
          console.error('Error fetching settings:', settingsErr);
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const syncUserPages = async () => {
    if (!queryData?.user?.id) {
      setError('No user data loaded');
      return;
    }
    
    setLoading(true);
    try {
      // First, update the user's visiblePages directly
      const updateResponse = await apiRequest('PUT', `/api/users/${queryData.user.id}/visible-pages`, {
        visiblePages: queryData.user.visiblePages
      });
      
      if (!updateResponse.ok) {
        throw new Error('Failed to update visible pages');
      }
      
      // Then, force a sync with the navigation settings
      const syncResponse = await apiRequest('POST', `/api/users/${queryData.user.id}/sync-settings`, {});
      
      if (!syncResponse.ok) {
        throw new Error('Failed to sync user settings');
      }
      
      // Refetch the data
      await fetchUserData();
      
      alert('User pages and settings synced successfully!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Debug Tools</CardTitle>
        <CardDescription>Troubleshoot user permissions and navigation settings</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex space-x-2 mb-4">
          <div className="flex-1">
            <Label htmlFor="email">User Email</Label>
            <Input 
              id="email"
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="Enter email address" 
            />
          </div>
          <div className="flex items-end">
            <Button onClick={fetchUserData} disabled={loading}>
              {loading ? 'Loading...' : 'Fetch User Data'}
            </Button>
          </div>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {queryData && (
          <>
            <Tabs defaultValue="user">
              <TabsList className="mb-4">
                <TabsTrigger value="user">User Details</TabsTrigger>
                <TabsTrigger value="pages">Visible Pages</TabsTrigger>
                <TabsTrigger value="settings">Nav Settings</TabsTrigger>
              </TabsList>
              
              <TabsContent value="user">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>ID</Label>
                      <div className="text-sm">{queryData.user?.id}</div>
                    </div>
                    <div>
                      <Label>Email</Label>
                      <div className="text-sm">{queryData.user?.email}</div>
                    </div>
                    <div>
                      <Label>Name</Label>
                      <div className="text-sm">{queryData.user?.fullName}</div>
                    </div>
                    <div>
                      <Label>Role</Label>
                      <div className="text-sm">{queryData.user?.role}</div>
                    </div>
                  </div>
                  
                  <div>
                    <Label>Permissions</Label>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      {queryData.user?.permissions?.map((perm: string) => (
                        <div key={perm} className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded">
                          {perm}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="pages">
                <div>
                  <Label>Visible Pages (from User Record)</Label>
                  {queryData.user?.visiblePages && queryData.user.visiblePages.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {queryData.user.visiblePages.map((page: string) => (
                        <div key={page} className="bg-green-50 text-green-700 text-xs px-2 py-1 rounded">
                          {page}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-orange-500 mt-2">No visible pages found!</div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="settings">
                <div>
                  <Label>Navigation Settings (from user_settings table)</Label>
                  {queryData.navSettings?.settings ? (
                    <Accordion type="single" collapsible className="mt-2">
                      <AccordionItem value="item-1">
                        <AccordionTrigger>Navigation Structure</AccordionTrigger>
                        <AccordionContent>
                          <pre className="bg-slate-100 p-3 rounded text-xs overflow-auto max-h-[300px]">
                            {JSON.stringify(queryData.navSettings.settings, null, 2)}
                          </pre>
                        </AccordionContent>
                      </AccordionItem>
                      
                      {queryData.navSettings.settings.visiblePages && (
                        <AccordionItem value="item-2">
                          <AccordionTrigger>Visible Pages (from Settings)</AccordionTrigger>
                          <AccordionContent>
                            <div className="grid grid-cols-3 gap-2">
                              {queryData.navSettings.settings.visiblePages.map((page: string) => (
                                <div key={page} className="bg-purple-50 text-purple-700 text-xs px-2 py-1 rounded">
                                  {page}
                                </div>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      )}
                    </Accordion>
                  ) : (
                    <div className="text-orange-500 mt-2">No navigation settings found!</div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
            
            <Separator className="my-4" />
            
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
              <h3 className="font-medium">Sync Analysis</h3>
              <p className="text-sm mt-1">
                {(() => {
                  // Compare user.visiblePages with settings.visiblePages
                  const userPages = queryData.user?.visiblePages || [];
                  const settingsPages = queryData.navSettings?.settings?.visiblePages || [];
                  
                  if (userPages.length === 0 && settingsPages.length === 0) {
                    return "Both user record and settings have no visible pages.";
                  }
                  
                  if (userPages.length === 0) {
                    return "User record has no visible pages, but settings has them.";
                  }
                  
                  if (settingsPages.length === 0) {
                    return "Settings has no visible pages, but user record has them.";
                  }
                  
                  // Check if arrays are identical
                  const isIdentical = userPages.length === settingsPages.length && 
                    userPages.every((page: string) => settingsPages.includes(page));
                  
                  if (isIdentical) {
                    return "User record and settings visible pages are in sync.";
                  } else {
                    return "User record and settings visible pages are out of sync.";
                  }
                })()}
              </p>
            </div>
          </>
        )}
      </CardContent>
      {queryData && (
        <CardFooter>
          <Button onClick={syncUserPages} variant="outline" disabled={loading}>
            {loading ? 'Syncing...' : 'Force Sync User Pages with Settings'}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}