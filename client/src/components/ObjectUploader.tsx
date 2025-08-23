import { useState, useRef } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, Image } from "lucide-react";

interface ObjectUploaderProps {
  onUpload: (file: File) => Promise<string>;
  onComplete?: (imageUrl: string) => void;
  buttonClassName?: string;
  children: ReactNode;
  currentImageUrl?: string;
}

/**
 * A simple file upload component for images
 * Features:
 * - File selection with preview
 * - Direct upload to object storage
 * - Progress indication
 * - Image preview with removal option
 */
export function ObjectUploader({
  onUpload,
  onComplete,
  buttonClassName,
  children,
  currentImageUrl
}: ObjectUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(currentImageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10485760) {
      alert('File size must be less than 10MB');
      return;
    }

    // Create preview
    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);

    // Upload file
    setIsUploading(true);
    try {
      const uploadedImageUrl = await onUpload(file);
      setUploadedUrl(uploadedImageUrl);
      onComplete?.(uploadedImageUrl);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try again.');
      setPreview(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    setUploadedUrl(null);
    onComplete?.('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      
      {!preview ? (
        <Button 
          type="button"
          onClick={handleFileSelect} 
          className={buttonClassName}
          variant="outline"
          disabled={isUploading}
        >
          {isUploading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              {children}
            </>
          )}
        </Button>
      ) : (
        <div className="relative">
          <div className="border rounded-lg p-4 bg-gray-50">
            <img 
              src={preview} 
              alt="Product preview" 
              className="max-w-full max-h-48 object-contain rounded mx-auto"
            />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-2 text-center">
            {uploadedUrl ? 'Image uploaded successfully' : isUploading ? 'Uploading...' : 'Ready to upload'}
          </p>
        </div>
      )}
    </div>
  );
}