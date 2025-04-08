import { useState } from 'react';
import { Loader2, Upload } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollableDialogContent } from '@/components/ui/scrollable-dialog-content';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface CSVImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CSVImportDialog({ open, onOpenChange }: CSVImportDialogProps) {
  const { toast } = useToast();
  const [csvData, setCsvData] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [importSummary, setImportSummary] = useState<any>(null);
  const [stage, setStage] = useState<'upload' | 'preview' | 'results'>('upload');
  
  const importMutation = useMutation({
    mutationFn: async (data: { csvData: string }) => {
      const response = await apiRequest('POST', '/api/products/import-csv', data);
      return await response.json();
    },
    onSuccess: (data) => {
      setImportSummary(data);
      setStage('results');
      
      // Invalidate products cache
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      
      toast({
        title: 'CSV Import Completed',
        description: `Successfully imported ${data.imported} products`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Import Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      
      // Read file contents
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setCsvData(content);
        setStage('preview');
      };
      reader.readAsText(selectedFile);
    }
  };

  const handlePasteCSV = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCsvData(event.target.value);
  };

  const handleImport = () => {
    if (csvData.trim()) {
      importMutation.mutate({ csvData });
    } else {
      toast({
        title: 'No Data',
        description: 'Please provide CSV data to import',
        variant: 'destructive',
      });
    }
  };

  const handleClose = () => {
    setCsvData('');
    setFile(null);
    setImportSummary(null);
    setStage('upload');
    onOpenChange(false);
  };

  const handleReset = () => {
    setCsvData('');
    setFile(null);
    setImportSummary(null);
    setStage('upload');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Import Products from CSV</DialogTitle>
          <DialogDescription>
            Upload or paste CSV data to import products into the catalog.
          </DialogDescription>
        </DialogHeader>
        
        {stage === 'upload' && (
          <div className="space-y-4">
            <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-md">
              <Upload className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-4">
                Upload a CSV file or paste CSV data below
              </p>
              <div className="flex items-center justify-center">
                <input 
                  type="file"
                  accept=".csv"
                  id="csv-upload"
                  className="sr-only"
                  onChange={handleFileChange}
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  className="cursor-pointer"
                  onClick={() => document.getElementById('csv-upload')?.click()}
                >
                  Select CSV File
                </Button>
              </div>
            </div>
            
            <div>
              <p className="text-sm font-medium mb-2">Or paste CSV data:</p>
              <Textarea
                placeholder="Paste CSV data here..."
                rows={10}
                onChange={handlePasteCSV}
                value={csvData}
              />
            </div>
            
            <Alert>
              <AlertTitle>CSV Format</AlertTitle>
              <AlertDescription>
                CSV should include the following columns: Item SKU, Item Name, Sport, Category, Item, Fabric Options, COGS, Wholesale Price.
              </AlertDescription>
            </Alert>
          </div>
        )}
        
        {stage === 'preview' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium">Previewing file:</p>
              <span className="text-sm text-muted-foreground">{file?.name || 'Pasted CSV data'}</span>
            </div>
            
            <ScrollableDialogContent className="max-h-[400px]">
              <pre className="text-xs p-4 bg-secondary/50 rounded-md overflow-auto whitespace-pre">
                {csvData}
              </pre>
            </ScrollableDialogContent>
          </div>
        )}
        
        {stage === 'results' && importSummary && (
          <div className="space-y-4">
            <Alert className={importSummary.errors ? 'bg-amber-50' : 'bg-green-50'}>
              <AlertTitle>Import Summary</AlertTitle>
              <AlertDescription>
                Processed {importSummary.message}
                <br />
                Successfully imported {importSummary.imported} products
                {importSummary.errors && (
                  <><br />Encountered {importSummary.errors.length} errors</>
                )}
              </AlertDescription>
            </Alert>
            
            {importSummary.errors && (
              <ScrollableDialogContent className="max-h-[300px]">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Errors:</p>
                  <ul className="list-disc list-inside text-sm text-red-600 space-y-1">
                    {importSummary.errors.map((error: string, index: number) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </ScrollableDialogContent>
            )}
          </div>
        )}
        
        <DialogFooter className="flex items-center justify-between">
          {stage === 'upload' && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={() => csvData.trim() ? setStage('preview') : null}
                disabled={!csvData.trim()}
              >
                Preview
              </Button>
            </div>
          )}
          
          {stage === 'preview' && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStage('upload')}>
                Back
              </Button>
              <Button 
                onClick={handleImport} 
                disabled={importMutation.isPending}
              >
                {importMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Import Products
              </Button>
            </div>
          )}
          
          {stage === 'results' && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleReset}>
                Import More
              </Button>
              <Button onClick={handleClose}>
                Done
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}