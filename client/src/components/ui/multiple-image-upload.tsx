import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ImagePlus, X, Upload, Loader2, Camera } from "lucide-react";
import { cn } from "@/lib/utils";

interface MultipleImageUploadProps {
  onChange: (urls: string[]) => void;
  value?: string[];
  accept?: string;
  maxSize?: number;
  maxFiles?: number;
  className?: string;
  disabled?: boolean;
}

export function MultipleImageUpload({
  onChange,
  value = [],
  accept = "image/*",
  maxSize = 5 * 1024 * 1024, // 5MB
  maxFiles = 5,
  className,
  disabled,
}: MultipleImageUploadProps) {
  // Ensure value is always an array of strings
  const safeValue = Array.isArray(value) ? value.filter(item => typeof item === 'string') : [];
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    setError(null);

    if (!files || files.length === 0) return;

    if (files.length + safeValue.length > maxFiles) {
      setError(`You can only upload a maximum of ${maxFiles} images`);
      return;
    }

    // Check file sizes
    for (let i = 0; i < files.length; i++) {
      if (files[i].size > maxSize) {
        setError(`File ${files[i].name} is too large. Maximum size is ${maxSize / (1024 * 1024)}MB`);
        return;
      }
    }

    setIsUploading(true);

    // Convert all files to data URLs
    const newUrls: string[] = [];
    let processed = 0;

    const processFile = (file: File) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        newUrls.push(reader.result as string);
        processed++;
        
        if (processed === files.length) {
          onChange([...safeValue, ...newUrls]);
          setIsUploading(false);
        }
      };
      
      reader.onerror = () => {
        setError(`Failed to read file ${file.name}`);
        processed++;
        
        if (processed === files.length) {
          if (newUrls.length > 0) {
            onChange([...safeValue, ...newUrls]);
          }
          setIsUploading(false);
        }
      };
      
      reader.readAsDataURL(file);
    };

    // Process each file
    for (let i = 0; i < files.length; i++) {
      processFile(files[i]);
    }
  };

  const handleRemoveImage = (index: number) => {
    const newValue = [...safeValue];
    newValue.splice(index, 1);
    onChange(newValue);
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || disabled || safeValue.length >= maxFiles}
          className="gap-2"
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Camera className="h-4 w-4" />
          )}
          Upload Images
        </Button>
        <span className="text-xs text-muted-foreground">
          {safeValue.length} of {maxFiles} images
        </span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled || isUploading || safeValue.length >= maxFiles}
        multiple
      />

      {error && <p className="text-sm text-red-500">{error}</p>}

      {safeValue.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {safeValue.map((url, index) => (
            <div key={index} className="relative group">
              <div className="relative h-32 w-full overflow-hidden rounded-md border border-border">
                <img
                  src={url}
                  alt={`Product image ${index + 1}`}
                  className="h-full w-full object-cover"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={() => handleRemoveImage(index)}
                  disabled={disabled || isUploading}
                  className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {safeValue.length === 0 && (
        <div className="h-32 w-full border border-dashed border-border rounded-md flex flex-col items-center justify-center text-muted-foreground">
          <ImagePlus className="h-8 w-8 mb-2 opacity-20" />
          <p className="text-sm">No images uploaded</p>
          <p className="text-xs">Upload up to {maxFiles} product images</p>
        </div>
      )}
    </div>
  );
}