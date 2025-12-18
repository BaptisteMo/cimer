'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { AddressAutocomplete } from '@/components/forms/AddressAutocomplete';
import { CompanySearchField } from '@/components/forms/CompanySearchField';

const profileSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  company_name: z.string().min(2, 'Company name must be at least 2 characters'),
  company_address: z.string().min(5, 'Company address must be at least 5 characters'),
  company_siren: z.string().optional(),
  company_siret: z.string().optional(),
  company_naf: z.string().optional(),
  phone: z.string().optional(),
  billing_email: z.string().email('Invalid email').optional().or(z.literal('')),
});

type ProfileInput = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  userId: string;
  existingProfile?: Partial<ProfileInput>;
}

export function ProfileForm({ userId, existingProfile }: ProfileFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: existingProfile || {
      full_name: '',
      company_name: '',
      company_address: '',
      company_siren: '',
      company_siret: '',
      company_naf: '',
      phone: '',
      billing_email: '',
    },
  });

  const onSubmit = async (data: ProfileInput) => {
    setLoading(true);
    setError(null);

    console.log('[Onboarding] Starting profile save for user:', userId);

    try {
      // Verify userId exists
      if (!userId) {
        throw new Error('User ID is missing. Please log in again.');
      }

      // Clean up optional fields - let DB handle timestamps
      const profileData = {
        id: userId,
        full_name: data.full_name,
        company_name: data.company_name,
        company_address: data.company_address,
        company_siren: data.company_siren || null,
        company_siret: data.company_siret || null,
        company_naf: data.company_naf || null,
        phone: data.phone || null,
        billing_email: data.billing_email || null,
      };

      console.log('[Onboarding] Profile data:', profileData);

      // Upsert profile (insert or update)
      const { data: result, error: upsertError } = await supabase
        .from('profiles')
        .upsert(profileData, {
          onConflict: 'id',
        })
        .select()
        .single();

      console.log('[Onboarding] Upsert result:', { result, error: upsertError });

      if (upsertError) {
        console.error('[Onboarding] Upsert error details:', {
          message: upsertError.message,
          details: upsertError.details,
          hint: upsertError.hint,
          code: upsertError.code,
        });
        throw new Error(upsertError.message || 'Failed to save profile');
      }

      console.log('[Onboarding] Profile saved successfully, redirecting to vehicles');
      // Success - redirect to vehicles onboarding
      router.push('/onboarding/vehicles');
    } catch (err) {
      console.error('[Onboarding] Error saving profile:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to save profile. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="full_name">Full Name *</Label>
        <Input
          id="full_name"
          {...register('full_name')}
          placeholder="John Doe"
          disabled={loading}
        />
        {errors.full_name && (
          <p className="text-sm text-red-600">{errors.full_name.message}</p>
        )}
      </div>

      <Controller
        name="company_name"
        control={control}
        render={({ field }) => (
          <CompanySearchField
            label="Search your company (name or SIRET)"
            placeholder="Company name or SIRET..."
            value={field.value || ''}
            onChange={field.onChange}
            onSelectCompany={(company) => {
              // Auto-fill all company fields when a company is selected
              setValue('company_name', company.name);
              setValue('company_address', company.address);
              setValue('company_siren', company.siren || '');
              setValue('company_siret', company.siret || '');
              setValue('company_naf', company.naf || '');
            }}
            required
            error={errors.company_name?.message}
          />
        )}
      />

      <Controller
        name="company_address"
        control={control}
        render={({ field }) => (
          <AddressAutocomplete
            label="Company Address"
            placeholder="Start typing address..."
            value={field.value || ''}
            onChange={field.onChange}
            required
            error={errors.company_address?.message}
          />
        )}
      />

      <div className="space-y-2">
        <Label htmlFor="phone">Phone (optional)</Label>
        <Input
          id="phone"
          type="tel"
          {...register('phone')}
          placeholder="+33 6 12 34 56 78"
          disabled={loading}
        />
        {errors.phone && (
          <p className="text-sm text-red-600">{errors.phone.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="billing_email">Billing Email (optional)</Label>
        <Input
          id="billing_email"
          type="email"
          {...register('billing_email')}
          placeholder="billing@company.com"
          disabled={loading}
        />
        {errors.billing_email && (
          <p className="text-sm text-red-600">{errors.billing_email.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Saving...' : 'Continue to Vehicles'}
      </Button>
    </form>
  );
}
