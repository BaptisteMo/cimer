'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabaseClient';
import { useAuthStore } from '@/store/auth.store';
import { Plus, Upload, Trash2, FileText } from 'lucide-react';
import type { Database } from '@/types/database.types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Image from 'next/image'

type Reserve = Database['public']['Tables']['cmr_reserves']['Row'];

interface ReservesSectionProps {
  cmrId: string;
  side: 'loading' | 'delivery';
  readonly?: boolean;
}

const RESERVE_TYPES = [
  'Damaged packaging',
  'Missing items',
  'Incorrect quantity',
  'Quality issue',
  'Other',
];

export function ReservesSection({ cmrId, side, readonly = false }: ReservesSectionProps) {
  const { user } = useAuthStore();
  const [reserves, setReserves] = useState<Reserve[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [_submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [reserveType, setReserveType] = useState(RESERVE_TYPES[0]);
  const [comment, setComment] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const loadReserves = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('cmr_reserves')
        .select('*')
        .eq('cmr_id', cmrId)
        .eq('side', side)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReserves(data || []);
    } catch (err) {
      console.error('Error loading reserves:', err);
    } finally {
      setLoading(false);
    }
  }, [cmrId, side]);

  useEffect(() => {
    loadReserves();
  }, [loadReserves]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handleDeleteReserve = async (reserve: Reserve) => {
    if (!window.confirm('Delete this reserve? This action cannot be undone.')) {
      return;
    }

    setError(null);

    try {
      // 1. Delete the reserve row
      const { error: deleteError } = await supabase
        .from('cmr_reserves')
        .delete()
        .eq('id', reserve.id);

      if (deleteError) {
        throw deleteError;
      }

      // 2. Delete the photo in storage if any (best effort)
      if (reserve.photo_storage_path) {
        const { error: storageError } = await supabase
          .storage
          .from('cmr-reserve-photos')
          .remove([reserve.photo_storage_path]);

        // On ne bloque pas l'UI si la suppression storage foire,
        // mais on log l'erreur pour debug
        if (storageError) {
          console.error('Error deleting reserve photo from storage:', storageError);
        }
      }

      // 3. Update local state
      setReserves((prev) => prev.filter((r) => r.id !== reserve.id));
    } catch (err) {
      console.error('Error deleting reserve:', err);
      setError(
        err instanceof Error
          ? `Failed to delete reserve: ${err.message}`
          : 'Failed to delete reserve'
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);
    setError(null);

    try {
      let photoPath: string | null = null;

      // Upload photo if present
      if (photoFile) {
        const fileName = `${cmrId}-${side}-reserve-${Date.now()}.${photoFile.name.split('.').pop()}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('cmr-reserve-photos')
          .upload(fileName, photoFile, {
            contentType: photoFile.type,
            upsert: false,
          });

        if (uploadError) {
          throw new Error(`Photo upload failed: ${uploadError.message}`);
        }

        photoPath = uploadData.path;
      }

      // Insert reserve
      const { error: insertError } = await supabase.from('cmr_reserves').insert({
        cmr_id: cmrId,
        user_id: user.id,
        side,
        reserve_type: reserveType,
        comment: comment.trim() || null,
        photo_storage_path: photoPath,
      });

      if (insertError) {
        // Clean up uploaded photo if insert fails
        if (photoPath) {
          await supabase.storage.from('cmr-reserve-photos').remove([photoPath]);
        }
        throw insertError;
      }

      // Reset form and reload
      setReserveType(RESERVE_TYPES[0]);
      setComment('');
      setPhotoFile(null);
      setPhotoPreview(null);
      setShowForm(false);
      await loadReserves();
    } catch (err) {
      console.error('Error adding reserve:', err);
      setError(err instanceof Error ? err.message : 'Failed to add reserve');
    } finally {
      setSubmitting(false);
    }
  };


  const title = side === 'loading' ? 'Loading Reserves' : 'Delivery Reserves';
  const description = side === 'loading'
    ? 'Record any issues found during loading'
    : 'Record any issues found during delivery';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {!showForm && !readonly && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowForm(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Reserve
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {/* Add reserve form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="space-y-4 border rounded-lg p-4 bg-gray-50">
            

            <div className="space-y-2">
              <Label htmlFor="reserve_type_id">Select reserve type</Label>
                  <Select>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a reserve type" />
                    </SelectTrigger>
                    <SelectContent>
                      {RESERVE_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="comment">Comment</Label>
              <Textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Describe the issue..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Photo (Optional)</Label>
              {photoPreview ? (
                <div className="relative">
                  <Image
                    src={photoPreview}
                    alt="Reserve preview"
                    className="w-full max-w-xs rounded-lg border"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    className="absolute top-2 right-2"
                    onClick={handleRemovePhoto}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="flex-1"
                  />
                  <Upload className="h-5 w-5 text-gray-400" />
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setReserveType(RESERVE_TYPES[0]);
                  setComment('');
                  setPhotoFile(null);
                  setPhotoPreview(null);
                  setError(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                Add Reserve
              </Button>
            </div>
          </form>
        )}

        {/* Reserves list */}
        {loading ? (
          <p className="text-sm text-gray-500">Loading reserves...</p>
        ) : reserves.length === 0 ? (
          <p className="text-sm text-gray-500">No reserves recorded</p>
        ) : (
          <div className="space-y-3">
            {reserves.map((reserve) => (
               <ReserveItem
                key={reserve.id}
                reserve={reserve}
                onDelete={() => handleDeleteReserve(reserve)}
                readonly={readonly}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ReserveItem({
  reserve,
  onDelete,
  readonly = false,
}: {
  reserve: Reserve;
  onDelete: () => void;
  readonly?: boolean;
}) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (reserve.photo_storage_path) {
      supabase.storage
        .from('cmr-reserve-photos')
        .createSignedUrl(reserve.photo_storage_path, 3600)
        .then(({ data }) => {
          if (data) setPhotoUrl(data.signedUrl);
        });
    }
  }, [reserve.photo_storage_path]);

  return (
    <>
      <div className="border rounded-lg p-3 bg-white space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-600" />
              <p className="font-medium text-sm">{reserve.reserve_type}</p>
            </div>

            {reserve.comment && (
              <p className="text-sm text-gray-600 mt-1">{reserve.comment}</p>
            )}

            <p className="text-xs text-gray-400 mt-1">
              {new Date(reserve.created_at).toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>

          {!readonly && (
            <div className="flex items-start gap-2">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                onClick={onDelete}
                aria-label="Delete reserve"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {photoUrl && (
          <div className="mt-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="w-full max-w-xs overflow-hidden rounded border cursor-pointer hover:opacity-90 transition-opacity"
            >
              <Image
                src={photoUrl}
                alt={`Reserve: ${reserve.reserve_type}`}
                className="w-full h-auto object-cover"
              />
            </button>
          </div>
        )}
      </div>

      {/* Photo modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogTitle className="sr-only">Reserve photo</DialogTitle>
          {photoUrl && (
            <Image
              src={photoUrl}
              alt={`Reserve: ${reserve.reserve_type}`}
              className="w-full h-auto rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
