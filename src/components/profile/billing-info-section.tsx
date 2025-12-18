'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabaseClient';
import type { Tables } from '@/types/database.types';

type Profile = Tables<'profiles'>;


const billingInfoSchema = z.object({
  billing_address: z.string().optional(),
  tax_id: z.string().optional(),
});

type BillingInfoInput = z.infer<typeof billingInfoSchema>;

interface BillingInfoSectionProps {
  userId: string;
  profile: {
    billing_address?: string | null;
    tax_id?: string | null;
  };
  onUpdate: (_profile: Profile) => void;
}

export function BillingInfoSection({ userId, profile, onUpdate }: BillingInfoSectionProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BillingInfoInput>({
    resolver: zodResolver(billingInfoSchema),
    defaultValues: {
      billing_address: profile.billing_address || '',
      tax_id: profile.tax_id || '',
    },
  });

  const onSubmit = async (data: BillingInfoInput) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({
          billing_address: data.billing_address || null,
          tax_id: data.tax_id || null,
        })
        .eq('id', userId)
        .select()
        .single();

      if (updateError) {
        setError(updateError.message);
        return;
      }

      setSuccess(true);
      onUpdate(updatedProfile);

      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Update error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Billing Information</CardTitle>
        <CardDescription>
          Manage your billing address and tax information
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-md bg-green-50 p-3 text-sm text-green-800">
              Billing information updated successfully!
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="billing_address">Billing Address</Label>
            <Input
              id="billing_address"
              {...register('billing_address')}
              placeholder="123 Billing St, Paris, France"
            />
            {errors.billing_address && (
              <p className="text-sm text-red-600">{errors.billing_address.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Leave empty to use your company address for billing
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tax_id">Tax ID / VAT Number</Label>
            <Input
              id="tax_id"
              {...register('tax_id')}
              placeholder="FR12345678901"
            />
            {errors.tax_id && (
              <p className="text-sm text-red-600">{errors.tax_id.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Your company&lsquos tax identification number or VAT number
            </p>
          </div>

          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
