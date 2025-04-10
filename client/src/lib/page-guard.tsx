import { ReactNode } from 'react';
import { Redirect } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';
import NotFound from '@/pages/not-found';

interface PageGuardProps {
  pageId: string;
  children: ReactNode;
}

/**
 * PageGuard component that checks if the current user has permission to view a specific page
 * based on their visiblePages array.
 *
 * This is used to prevent direct URL access to pages a user shouldn't see.
 */
export function PageGuard({ pageId, children }: PageGuardProps) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }
  
  if (!user) {
    return <Redirect to="/auth" />;
  }
  
  // Always grant access to essential pages
  const essentialPages = ['dashboard', 'profile', 'settings'];
  if (essentialPages.includes(pageId)) {
    return <>{children}</>;
  }
  
  // Admin users have access to all pages
  if (user.role === 'admin') {
    return <>{children}</>;
  }
  
  // Check if the page ID is in the user's visiblePages
  if (user.visiblePages && Array.isArray(user.visiblePages)) {
    const hasAccess = user.visiblePages.includes(pageId);
    console.log(`PageGuard: User ${user.username} ${hasAccess ? 'has' : 'does not have'} access to ${pageId}`);
    
    if (hasAccess) {
      return <>{children}</>;
    }
  }
  
  // If not authorized to view this page, show not found
  console.warn(`User ${user.username} attempted to access unauthorized page: ${pageId}`);
  return <NotFound />;
}