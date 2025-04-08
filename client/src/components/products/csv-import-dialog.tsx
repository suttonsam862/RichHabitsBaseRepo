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
        if (content) {
          setCsvData(content);
          setStage('preview'); // Immediately go to preview when file is loaded
        }
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

  // Override the default dialog close behavior to use our handleClose function
  const handleDialogOpenChange = (value: boolean) => {
    if (!value) {
      handleClose();
    } else {
      onOpenChange(true);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="max-w-3xl">
        <div className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
          {stage === 'preview' ? (
            <div className="flex items-center gap-2">
              <Button 
                onClick={handleImport} 
                disabled={importMutation.isPending}
                variant="default"
                size="sm"
                className="h-8"
              >
                Import Now
              </Button>
            </div>
          ) : null}
        </div>
        
        <DialogHeader>
          <DialogTitle>Import Products from CSV</DialogTitle>
          <DialogDescription>
            Upload or paste CSV data to import products into the catalog.
          </DialogDescription>
        </DialogHeader>
        
        {stage === 'upload' && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-100 rounded-md p-4 mb-2">
              <h3 className="text-sm font-semibold text-blue-700 mb-1">CSV Import Guide</h3>
              <p className="text-xs text-blue-700">
                You can either upload a CSV file or paste data directly in the text area below.
                Make sure to follow the required format with all columns in the correct order.
              </p>
            </div>
          
            <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-md">
              <Upload className="h-10 w-10 text-primary mb-2" />
              <p className="text-sm font-medium mb-1">
                Upload a CSV file
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                Select a properly formatted CSV file from your computer
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
                  variant="secondary" 
                  className="cursor-pointer"
                  onClick={() => document.getElementById('csv-upload')?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Select CSV File
                </Button>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-md p-4">
              <p className="text-sm font-medium mb-2">Or paste CSV data directly:</p>
              <Textarea
                placeholder="Item SKU,Item Name,Sport,Category,Item,Fabric Options,COGS,Wholesale Price"
                rows={8}
                onChange={handlePasteCSV}
                value={csvData}
                className="font-mono text-xs"
              />
            </div>
            
            <Alert>
              <AlertTitle>CSV Format</AlertTitle>
              <AlertDescription>
                <p className="mb-2">Your CSV file should have the following format:</p>
                <p className="text-xs font-mono bg-gray-100 p-2 rounded">
                  Item SKU,Item Name,Sport,Category,Item,Fabric Options,COGS,Wholesale Price
                </p>
                <p className="mt-2 text-xs">
                  For example: <span className="font-mono">FOO-B744,Football - Game Jersey,Football,Uniforms,Game Jersey,Polyester,45.00,90.00</span>
                </p>
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
            
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h3 className="text-sm font-medium flex items-center mb-1">
                <span className="mr-2">🔍</span> Data Review
              </h3>
              <p className="text-sm text-muted-foreground">
                Please review your CSV data below to ensure it matches the required format before importing. 
                Each line should contain all required fields in the correct order.
              </p>
            </div>
            
            <ScrollableDialogContent className="max-h-[400px]">
              <pre className="text-xs p-4 bg-secondary/50 rounded-md overflow-auto whitespace-pre">
                {csvData}
              </pre>
            </ScrollableDialogContent>
            
            <div className="text-sm bg-gray-50 p-3 rounded-md">
              <p className="font-medium mb-1">Ready to import?</p>
              <p className="text-muted-foreground">
                Click "Import Products" below to add these items to your catalog, or go back to make changes.
              </p>
            </div>
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