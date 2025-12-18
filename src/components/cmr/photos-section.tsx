'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useAuthStore } from '@/store/auth.store';
import { uploadCmrPhoto, fetchCmrPhotos, deleteCmrPhoto } from '@/lib/utils/photo-upload';
import { Camera, Trash2, Loader2 } from 'lucide-react';
import Image from 'next/image'

interface Photo {
  id: string;
  storage_path: string;
  created_at: string;
  url: string;
}

interface PhotosSectionProps {
  cmrId: string;
  readonly?: boolean;
}

export function PhotosSection({ cmrId, readonly = false }: PhotosSectionProps) {
  const { user } = useAuthStore();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadPhotos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchCmrPhotos(cmrId);
      setPhotos(data);
    } catch (err) {
      console.error('Error loading photos:', err);
      setError('Failed to load photos');
    } finally {
      setLoading(false);
    }
  }, [cmrId]);

  // Fetch photos on mount
  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

  const handleAddPhoto = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be less than 10MB');
      return;
    }

    // Check photo limit (max 3 photos)
    if (photos.length >= 3) {
      setError('Maximum 3 photos allowed per CMR');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const newPhoto = await uploadCmrPhoto(file, cmrId, user.id);
      setPhotos([newPhoto, ...photos]);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload photo');
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeletePhoto = async (photo: Photo) => {
    if (!confirm('Are you sure you want to delete this photo?')) {
      return;
    }

    try {
      await deleteCmrPhoto(photo.id, photo.storage_path);
      setPhotos(photos.filter((p) => p.id !== photo.id));
    } catch (err) {
      console.error('Delete error:', err);
      setError('Failed to delete photo');
    }
  };

  const openPhotoModal = (photo: Photo) => {
    setSelectedPhoto(photo);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Photos</CardTitle>
        <CardDescription>
          Add up to 3 photos (goods, damages, existing CMR, etc.)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {/* Add Photo Button */}
        {!readonly && (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button
              onClick={handleAddPhoto}
              disabled={uploading || photos.length >= 3}
              variant="outline"
              className="gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Camera className="h-4 w-4" />
                  Add Photo ({photos.length}/3)
                </>
              )}
            </Button>
          </div>
        )}

        {/* Photos Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">Loading photos...</p>
          </div>
        ) : photos.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-8 text-center">
            <Camera className="mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-muted-foreground">No photos yet</p>
            <p className="text-sm text-muted-foreground">
              Click &quot;Add Photo&quot; to capture or upload images
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {photos.map((photo) => (
              <div key={photo.id} className="group relative">
                <button
                  onClick={() => openPhotoModal(photo)}
                  className="aspect-square w-full overflow-hidden rounded-lg border transition-opacity hover:opacity-80"
                >
                  <Image
                    src={photo.url}
                    alt="CMR photo"
                    className="h-full w-full object-cover"
                  />
                </button>
                {!readonly && (
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="absolute right-1 top-1 h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100"
                    onClick={() => handleDeletePhoto(photo)}
                    aria-label="Delete photo"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}

              </div>
            ))}
          </div>
        )}

        {photos.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Click on a photo to view full size
          </p>
        )}
      </CardContent>

      {/* Photo Modal */}
      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-4xl">
          <DialogTitle className="sr-only">CMR Photo</DialogTitle>
          {selectedPhoto && (
            <div className="relative">
              <Image
                src={selectedPhoto.url}
                alt="CMR photo"
                className="w-full h-auto rounded-lg"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
