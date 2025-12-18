'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { supabase } from '@/lib/supabaseClient';
import { ProfileForm } from '@/components/onboarding/profile-form';
import type { Tables } from '@/types/database.types';

type Profile = Tables<'profiles'>;

export default function ProfileOnboardingPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [existingProfile, setExistingProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      if (!user) {
        router.push('/login');
        return;
      }

      // Load existing profile if any
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle(); // Use maybeSingle() instead of single() to avoid 406 errors

        if (error) {
          console.error('Error loading profile:', error);
        }

        if (profile) {
          setExistingProfile(profile);
        } else {
          // No profile exists yet - set empty defaults
          setExistingProfile(null);
        }
      } catch (error) {
        console.error('Unexpected error loading profile:', error);
        setExistingProfile(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [user, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Welcome to CMR Digital</h1>
            <p className="mt-2 text-gray-600">
              Let&apos;s set up your profile. This information will appear on your CMR documents.
            </p>

            {/* Display user email */}
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">
                <span className="font-medium">Account email:</span> {user.email}
              </p>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <div className="flex-1 h-2 bg-blue-600 rounded"></div>
              <div className="flex-1 h-2 bg-gray-200 rounded"></div>
            </div>
            <p className="mt-2 text-sm text-gray-500">Step 1 of 2: Profile</p>
          </div>

          <ProfileForm
            userId={user.id}
            existingProfile={existingProfile ? {
              full_name: existingProfile.full_name || undefined,
              company_name: existingProfile.company_name || undefined,
              company_address: existingProfile.company_address,
              company_siren: existingProfile.company_siren || undefined,
              company_siret: existingProfile.company_siret || undefined,
              company_naf: existingProfile.company_naf || undefined,
              phone: existingProfile.phone || undefined,
              billing_email: existingProfile.billing_email || undefined,
            } : undefined}
          />
        </div>
      </div>
    </div>
  );
}
