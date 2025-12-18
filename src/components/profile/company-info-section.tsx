'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabaseClient';
import type { Tables } from '@/types/database.types';
import { AddressAutocomplete } from '@/components/forms/AddressAutocomplete';
import { CompanySearchField } from '@/components/forms/CompanySearchField';

const companyInfoSchema = z.object({
  company_name: z.string().min(2, 'Company name must be at least 2 characters'),
  company_address: z.string().min(5, 'Address must be at least 5 characters'),
  company_siren: z.string().optional(),
  company_siret: z.string().optional(),
  company_naf: z.string().optional(),
});

type Profile = Tables<'profiles'>;

interface CompanyInfoSectionProps {
  userId: string;
  profile: Profile;
  onUpdate: (_updated: Profile) => void;
}

type CompanyInfoInput = z.infer<typeof companyInfoSchema>;

export function CompanyInfoSection({ userId, profile, onUpdate }: CompanyInfoSectionProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<CompanyInfoInput>({
    resolver: zodResolver(companyInfoSchema),
    defaultValues: {
      company_name: profile.company_name || '',
      company_address: profile.company_address || '',
      company_siren: profile.company_siren || '',
      company_siret: profile.company_siret || '',
      company_naf: profile.company_naf || '',
    },
  });

  const onSubmit = async (data: CompanyInfoInput) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({
          company_name: data.company_name,
          company_address: data.company_address,
          company_siren: data.company_siren || null,
          company_siret: data.company_siret || null,
          company_naf: data.company_naf || null,
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
        <CardTitle>Company Information</CardTitle>
        <CardDescription>
          Update your company details that appear on CMR documents
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
              Company information updated successfully!
            </div>
          )}

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

          {/* Legal information fields (read-only display) */}
          <div className="space-y-4 rounded-lg border bg-muted/50 p-4">
            <p className="text-sm font-medium">Legal Information (optional)</p>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="company_siren" className="text-xs">
                  SIREN
                </Label>
                <Input
                  id="company_siren"
                  {...register('company_siren')}
                  placeholder="123456789"
                  className="font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_siret" className="text-xs">
                  SIRET
                </Label>
                <Input
                  id="company_siret"
                  {...register('company_siret')}
                  placeholder="12345678900012"
                  className="font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_naf" className="text-xs">
                  NAF/APE
                </Label>
                <Input
                  id="company_naf"
                  {...register('company_naf')}
                  placeholder="49.41Z"
                  className="font-mono text-sm"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              These fields are automatically filled when you search for your company
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground border-t pt-4">
            <p>
              This information will appear on all your CMR documents
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
