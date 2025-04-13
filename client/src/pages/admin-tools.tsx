import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
import DebugTools from '@/components/debug-tools';

export default function AdminTools() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect non-admin users
  if (!isLoading && (!user || user.role !== 'admin')) {
    setLocation('/');
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Tools</h1>
      
      <Tabs defaultValue="user-settings">
        <TabsList className="mb-6">
          <TabsTrigger value="user-settings">User Settings Debugger</TabsTrigger>
          <TabsTrigger value="system-logs">System Logs</TabsTrigger>
        </TabsList>
        
        <TabsContent value="user-settings">
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>User Settings Troubleshooting</CardTitle>
                <CardDescription>
                  Tools to help diagnose and fix user permission and navigation settings issues
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-muted-foreground">
                  This tool helps identify and fix synchronization issues between a user's visible pages
                  and their navigation settings. Use it to troubleshoot when a user can't see certain pages
                  or when their sidebar doesn't show the right items.
                </p>
                
                <DebugTools />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="system-logs">
          <Card>
            <CardHeader>
              <CardTitle>System Logs</CardTitle>
              <CardDescription>
                View recent system logs and activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-12">
                System logs feature coming soon
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}