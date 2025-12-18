'use client';

import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabaseClient';
import { Truck, Plus, Pencil, Trash2, X } from 'lucide-react';

const vehicleSchema = z.object({
  plate: z.string().min(2, 'License plate is required'),
  type: z.string().optional(),
});

type VehicleInput = z.infer<typeof vehicleSchema>;

interface Vehicle {
  id: string;
  plate: string;
  type: string | null;
  created_at: string;
}

interface VehiclesManagementSectionProps {
  userId: string;
}

export function VehiclesManagementSection({ userId }: VehiclesManagementSectionProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<VehicleInput>({
    resolver: zodResolver(vehicleSchema),
  });

  const loadVehicles = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setVehicles(data || []);
    } catch (err) {
      console.error('Error loading vehicles:', err);
      setError('Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadVehicles();
  }, [loadVehicles]);

  const onSubmit = async (data: VehicleInput) => {
    setSubmitting(true);
    setError(null);

    try {
      if (editingId) {
        // Update existing vehicle
        const { error: updateError } = await supabase
          .from('vehicles')
          .update({
            plate: data.plate,
            type: data.type || null,
          })
          .eq('id', editingId)
          .eq('user_id', userId);

        if (updateError) throw updateError;
      } else {
        // Add new vehicle
        const { error: insertError } = await supabase
          .from('vehicles')
          .insert({
            user_id: userId,
            plate: data.plate,
            type: data.type || null,
          });

        if (insertError) throw insertError;
      }

      await loadVehicles();
      reset();
      setEditingId(null);
      setShowAddForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save vehicle');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (vehicle: Vehicle) => {
    setEditingId(vehicle.id);
    setValue('plate', vehicle.plate);
    setValue('type', vehicle.type || '');
    setShowAddForm(true);
  };

  const handleDelete = async (vehicleId: string) => {
    if (!confirm('Are you sure you want to delete this vehicle?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', vehicleId)
        .eq('user_id', userId);

      if (error) throw error;

      await loadVehicles();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete vehicle');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setShowAddForm(false);
    reset();
    setError(null);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Your Vehicles</CardTitle>
              <CardDescription>
                Manage vehicles for your CMR documents
              </CardDescription>
            </div>
            {!showAddForm && (
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Vehicle
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

          {/* Add/Edit Form */}
          {showAddForm && (
            <Card className="border-2 border-primary">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {editingId ? 'Edit Vehicle' : 'Add New Vehicle'}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancelEdit}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="plate">License Plate *</Label>
                    <Input
                      id="plate"
                      {...register('plate')}
                      placeholder="AB-123-CD"
                    />
                    {errors.plate && (
                      <p className="text-sm text-red-600">{errors.plate.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">Vehicle Type</Label>
                    <Input
                      id="type"
                      {...register('type')}
                      placeholder="Truck, Van, etc."
                    />
                    {errors.type && (
                      <p className="text-sm text-red-600">{errors.type.message}</p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" disabled={submitting}>
                      {submitting ? 'Saving...' : editingId ? 'Update Vehicle' : 'Add Vehicle'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancelEdit}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Vehicles List */}
          {vehicles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Truck className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No vehicles added yet</p>
              <p className="text-sm text-muted-foreground">
                Add your first vehicle to start creating CMR documents
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {vehicles.map((vehicle) => (
                <div
                  key={vehicle.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <Truck className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{vehicle.plate}</p>
                      {vehicle.type && (
                        <p className="text-sm text-muted-foreground">{vehicle.type}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(vehicle)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(vehicle.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
