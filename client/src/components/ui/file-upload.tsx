import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ImagePlus, X, Upload, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onChange: (url: string) => void;
  value?: string;
  accept?: string;
  maxSize?: number;
  className?: string;
  disabled?: boolean;
}

export function FileUpload({
  onChange,
  value,
  accept = "image/*",
  maxSize = 5 * 1024 * 1024, // 5MB
  className,
  disabled,
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setError(null);

    if (!file) return;

    if (file.size > maxSize) {
      setError(`File too large. Maximum size is ${maxSize / (1024 * 1024)}MB`);
      return;
    }

    setIsUploading(true);

    // For now, we'll just simulate an upload and use FileReader to create a data URL
    // In a real app, you would upload the file to a server or cloud storage
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      onChange(result);
      setIsUploading(false);
    };
    reader.onerror = () => {
      setError("Failed to read file");
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleClear = () => {
    onChange("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || disabled}
          className="gap-2"
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          {value ? "Change file" : "Upload file"}
        </Button>
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            disabled={isUploading || disabled}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />

      {error && <p className="text-sm text-red-500">{error}</p>}

      {value && value.startsWith("data:image/") && (
        <div className="relative mt-2 h-40 w-40 overflow-hidden rounded-md border border-border">
          <img
            src={value}
            alt="Uploaded"
            className="h-full w-full object-cover"
          />
        </div>
      )}

      {value && !value.startsWith("data:image/") && value.startsWith("http") && (
        <div className="relative mt-2 h-40 w-40 overflow-hidden rounded-md border border-border">
          <img
            src={value}
            alt="Uploaded"
            className="h-full w-full object-cover"
          />
        </div>
      )}
    </div>
  );
}