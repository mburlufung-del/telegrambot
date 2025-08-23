import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, X } from 'lucide-react'

interface ObjectUploaderProps {
  onUpload?: (file: File) => Promise<string>
  onComplete?: (imageUrl: string) => void
  currentImageUrl?: string
  children: React.ReactNode
}

export function ObjectUploader({ 
  onUpload, 
  onComplete, 
  currentImageUrl, 
  children 
}: ObjectUploaderProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string>(currentImageUrl || '')
  
  // Update preview URL when currentImageUrl changes
  useEffect(() => {
    if (currentImageUrl && currentImageUrl !== previewUrl) {
      setPreviewUrl(currentImageUrl)
    }
  }, [currentImageUrl])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setIsUploading(true)
      
      // Create preview URL
      const preview = URL.createObjectURL(file)
      setPreviewUrl(preview)

      // Upload the file
      let imageUrl: string
      if (onUpload) {
        imageUrl = await onUpload(file)
      } else {
        // Default upload handling
        imageUrl = await handleImageUpload(file)
      }

      // Clean up preview URL and set final URL
      URL.revokeObjectURL(preview)
      console.log('Setting final preview URL:', imageUrl);
      setPreviewUrl(imageUrl)
      
      // Call completion callback
      if (onComplete) {
        onComplete(imageUrl)
      }
    } catch (error) {
      console.error('Upload failed:', error)
      // Reset to previous state on error
      setPreviewUrl(currentImageUrl || '')
    } finally {
      setIsUploading(false)
    }
  }

  const handleImageUpload = async (file: File): Promise<string> => {
    // Simple upload that generates a unique URL for each image
    const uploadResponse = await fetch('/api/upload/image', {
      method: 'POST',
    })

    if (!uploadResponse.ok) {
      throw new Error('Failed to get upload URL')
    }

    const result = await uploadResponse.json()
    console.log('Upload response:', result);
    return result.imageUrl
  }

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  const handleRemoveImage = () => {
    setPreviewUrl('')
    if (onComplete) {
      onComplete('')
    }
  }

  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant="outline"
        onClick={handleButtonClick}
        disabled={isUploading}
        className="w-full"
      >
        <Upload className="w-4 h-4 mr-2" />
        {isUploading ? 'Uploading...' : children}
      </Button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {previewUrl && (
        <div className="relative border rounded-lg p-2 bg-gray-50">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Image Preview:</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemoveImage}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="border rounded bg-white p-2 flex items-center justify-center">
            <img
              src={previewUrl}
              alt="Product preview"
              className="max-w-full max-h-32 object-contain rounded"
              onLoad={() => console.log('Image loaded successfully:', previewUrl)}
              onError={(e) => {
                console.error('Image failed to load:', previewUrl);
                console.error('Error event:', e);
              }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">Preview: {previewUrl}</p>
        </div>
      )}
    </div>
  )
}