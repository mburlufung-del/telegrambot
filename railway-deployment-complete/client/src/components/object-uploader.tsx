import { useState } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, Check } from "lucide-react";

interface ObjectUploaderProps {
  onUploadComplete?: (imageUrl: string) => void;
  children: ReactNode;
  buttonClassName?: string;
}

export default function ObjectUploader({
  onUploadComplete,
  children,
  buttonClassName = ""
}: ObjectUploaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File Type",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 10MB.",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);
    setIsComplete(false);

    try {
      // Get upload URL
      const response = await fetch('/api/objects/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error('Failed to get upload URL');
      }

      const { uploadURL } = await response.json();
      setUploadProgress(25);

      // Upload file directly to storage
      const uploadResponse = await fetch(uploadURL, {
        method: 'PUT',
        body: selectedFile,
        headers: {
          'Content-Type': selectedFile.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file');
      }

      setUploadProgress(75);

      // Extract object path from the upload URL to create our serving URL
      const url = new URL(uploadURL);
      const objectPath = url.pathname;
      
      // Convert from /bucket-name/path to /objects/uploads/uuid
      const pathParts = objectPath.split('/');
      let imageUrl: string;
      
      if (pathParts.length >= 4) {
        // Format: /bucket-name/.private/uploads/uuid -> /objects/uploads/uuid
        const uploadPath = pathParts.slice(3).join('/'); // Gets "uploads/uuid"
        imageUrl = `/objects/${uploadPath}`;
      } else {
        console.error('Unexpected upload URL format:', uploadURL);
        imageUrl = `/objects/uploads/${Date.now()}-${selectedFile.name}`;
      }
      
      console.log('Generated image URL:', imageUrl);
      
      setUploadProgress(100);
      setIsComplete(true);

      toast({
        title: "Upload Complete",
        description: "Image uploaded successfully!",
      });

      // Notify parent component
      if (onUploadComplete) {
        onUploadComplete(imageUrl);
      }

      // Auto-close after success
      setTimeout(() => {
        setIsOpen(false);
        resetState();
      }, 1500);

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const resetState = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setIsUploading(false);
    setUploadProgress(0);
    setIsComplete(false);
  };

  const handleClose = () => {
    if (!isUploading) {
      setIsOpen(false);
      resetState();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className={buttonClassName}>
          {children}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Image</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {!selectedFile ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Choose an image file</p>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="cursor-pointer"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Preview */}
              <div className="relative">
                <img
                  src={previewUrl || ''}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg border"
                />
                {!isUploading && (
                  <Button
                    size="sm"
                    variant="destructive"
                    className="absolute top-2 right-2"
                    onClick={resetState}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* File info */}
              <div className="text-sm text-gray-600">
                <p>File: {selectedFile.name}</p>
                <p>Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>

              {/* Upload progress */}
              {isUploading && (
                <div className="space-y-2">
                  <Progress value={uploadProgress} className="w-full" />
                  <p className="text-sm text-gray-600 text-center">
                    {uploadProgress < 100 ? 'Uploading...' : 'Upload complete!'}
                  </p>
                </div>
              )}

              {/* Upload button */}
              {!isUploading && !isComplete && (
                <Button onClick={handleUpload} className="w-full">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Image
                </Button>
              )}

              {/* Success state */}
              {isComplete && (
                <div className="text-center text-green-600">
                  <Check className="mx-auto h-8 w-8 mb-2" />
                  <p>Upload successful!</p>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}