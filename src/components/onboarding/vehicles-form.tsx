'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, Truck } from 'lucide-react';

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

interface VehiclesFormProps {
  userId: string;
  onComplete: () => void;
}

export function VehiclesForm({ userId, onComplete }: VehiclesFormProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<VehicleInput>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      plate: '',
      type: '',
    },
  });

  const loadVehicles = useCallback(async () => {
    try {
      setLoadingVehicles(true);
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setVehicles(data || []);
    } catch (err) {
      console.error('Error loading vehicles:', err);
      setError(err instanceof Error ? err.message : 'Failed to load vehicles');
    } finally {
      setLoadingVehicles(false);
    }
  }, [userId]);

  // Load existing vehicles
  useEffect(() => {
    loadVehicles();
  }, [loadVehicles]);

  const onSubmit = async (data: VehicleInput) => {
    setLoading(true);
    setError(null);

    try {
      const { error: insertError } = await supabase
        .from('vehicles')
        .insert({
          user_id: userId,
          plate: data.plate.toUpperCase(),
          type: data.type || null,
        });

      if (insertError) {
        // Check for duplicate plate
        if (insertError.code === '23505') {
          throw new Error('A vehicle with this license plate already exists');
        }
        throw insertError;
      }

      // Reload vehicles and reset form
      await loadVehicles();
      reset();
    } catch (err) {
      console.error('Error adding vehicle:', err);
      setError(err instanceof Error ? err.message : 'Failed to add vehicle');
    } finally {
      setLoading(false);
    }
  };

  const deleteVehicle = async (vehicleId: string) => {
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
      console.error('Error deleting vehicle:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete vehicle');
    }
  };

  const canFinish = vehicles.length > 0;

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Existing vehicles list */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Your Vehicles</h3>
        {loadingVehicles ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto"></div>
          </div>
        ) : vehicles.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center text-gray-600">
            <Truck className="mx-auto h-8 w-8 mb-2 text-gray-400" />
            <p>No vehicles yet. Add at least one vehicle to continue.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {vehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <Truck className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-semibold text-gray-900">{vehicle.plate}</p>
                    {vehicle.type && (
                      <p className="text-sm text-gray-600">{vehicle.type}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => deleteVehicle(vehicle.id)}
                  className="text-red-600 hover:text-red-700 p-2"
                  aria-label="Delete vehicle"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add vehicle form */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-3">Add New Vehicle</h3>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="plate">License Plate *</Label>
            <Input
              id="plate"
              {...register('plate')}
              placeholder="AB-123-CD"
              disabled={loading}
              className="uppercase"
            />
            {errors.plate && (
              <p className="text-sm text-red-600">{errors.plate.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Vehicle Type (optional)</Label>
            <Input
              id="type"
              {...register('type')}
              placeholder="e.g., Truck, Van, Semi-trailer"
              disabled={loading}
            />
            {errors.type && (
              <p className="text-sm text-red-600">{errors.type.message}</p>
            )}
          </div>

          <Button type="submit" variant="outline" className="w-full" disabled={loading}>
            {loading ? 'Adding...' : 'Add Vehicle'}
          </Button>
        </form>
      </div>

      {/* Finish button */}
      <div className="border-t pt-6">
        <Button
          onClick={onComplete}
          className="w-full"
          disabled={!canFinish}
        >
          {canFinish ? 'Finish Setup' : 'Add at least one vehicle to continue'}
        </Button>
        {!canFinish && (
          <p className="text-sm text-gray-500 text-center mt-2">
            You need at least one vehicle to complete onboarding
          </p>
        )}
      </div>
    </div>
  );
}
