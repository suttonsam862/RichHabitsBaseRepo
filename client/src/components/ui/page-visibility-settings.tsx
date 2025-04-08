import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  AVAILABLE_PAGES, 
  PAGE_ACCESS_TEMPLATES 
} from "@/lib/page-settings";

// Interface for the page visibility settings component
interface PageVisibilitySettingsProps {
  visiblePages: string[];
  onChange: (pages: string[]) => void;
}

// PageVisibilitySettings component
export function PageVisibilitySettings({
  visiblePages,
  onChange,
}: PageVisibilitySettingsProps) {
  const handleTogglePage = (pageId: string) => {
    if (visiblePages.includes(pageId)) {
      onChange(visiblePages.filter(id => id !== pageId));
    } else {
      onChange([...visiblePages, pageId]);
    }
  };

  const handleApplyTemplate = (templateKey: keyof typeof PAGE_ACCESS_TEMPLATES) => {
    onChange([...PAGE_ACCESS_TEMPLATES[templateKey]]);
  };

  // Group pages by category
  const pagesByCategory = AVAILABLE_PAGES.reduce((acc, page) => {
    const category = page.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(page);
    return acc;
  }, {} as Record<string, typeof AVAILABLE_PAGES>);

  // Order categories for display
  const categoryOrder = [
    'Core', 'Sales', 'Design', 'Production', 'Products', 
    'Communication', 'Reports', 'User', 'System', 'Administration', 'Other'
  ];

  const sortedCategories = Object.keys(pagesByCategory).sort(
    (a, b) => categoryOrder.indexOf(a) - categoryOrder.indexOf(b)
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Page Visibility</CardTitle>
        <CardDescription>
          Control which pages are visible to this user
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 space-y-2">
          <Label className="text-sm">Quick Apply Template:</Label>
          <div className="flex flex-wrap gap-2">
            <button 
              type="button"
              onClick={() => handleApplyTemplate('ADMIN')}
              className="px-3 py-1 text-xs rounded-md bg-primary/10 hover:bg-primary/20 text-primary"
            >
              Admin (All Pages)
            </button>
            <button 
              type="button"
              onClick={() => handleApplyTemplate('MANAGER')}
              className="px-3 py-1 text-xs rounded-md bg-primary/10 hover:bg-primary/20 text-primary"
            >
              Manager
            </button>
            <button 
              type="button"
              onClick={() => handleApplyTemplate('SALES')}
              className="px-3 py-1 text-xs rounded-md bg-primary/10 hover:bg-primary/20 text-primary"
            >
              Sales
            </button>
            <button 
              type="button"
              onClick={() => handleApplyTemplate('DESIGNER')}
              className="px-3 py-1 text-xs rounded-md bg-primary/10 hover:bg-primary/20 text-primary"
            >
              Designer
            </button>
            <button 
              type="button"
              onClick={() => handleApplyTemplate('MANUFACTURER')}
              className="px-3 py-1 text-xs rounded-md bg-primary/10 hover:bg-primary/20 text-primary"
            >
              Manufacturer
            </button>
            <button 
              type="button"
              onClick={() => handleApplyTemplate('CUSTOMER')}
              className="px-3 py-1 text-xs rounded-md bg-primary/10 hover:bg-primary/20 text-primary"
            >
              Customer
            </button>
            <button 
              type="button"
              onClick={() => handleApplyTemplate('MINIMAL')}
              className="px-3 py-1 text-xs rounded-md bg-primary/10 hover:bg-primary/20 text-primary"
            >
              Minimal
            </button>
          </div>
        </div>
        
        {sortedCategories.map(category => (
          <div key={category} className="mb-6">
            <h3 className="text-sm font-semibold mb-2">{category}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pagesByCategory[category].map((page) => (
                <div
                  key={page.id}
                  className="flex items-start space-x-3 space-y-0"
                >
                  <Checkbox
                    id={`page-${page.id}`}
                    checked={visiblePages.includes(page.id)}
                    onCheckedChange={() => handleTogglePage(page.id)}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label
                      htmlFor={`page-${page.id}`}
                      className="text-sm font-medium cursor-pointer"
                    >
                      {page.name}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {page.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}