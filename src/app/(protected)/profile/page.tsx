'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthStore } from '@/store/auth.store';
import { supabase } from '@/lib/supabaseClient';
import { User, Building2, Truck, CreditCard, ArrowLeft } from 'lucide-react';
import { ProfileInfoSection } from '@/components/profile/profile-info-section';
import { CompanyInfoSection } from '@/components/profile/company-info-section';
import { VehiclesManagementSection } from '@/components/profile/vehicles-management-section';
import { BillingInfoSection } from '@/components/profile/billing-info-section';
import type { Tables } from '@/types/database.types'; // adapte le chemin


type Profile = Tables<'profiles'>;


export default function ProfilePage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) {
        router.push('/login');
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle(); // Use maybeSingle() instead of single() to avoid 406 errors

        if (error) {
          console.error('Error loading profile:', error);
          return;
        }

        setProfile(data);
      } catch (err) {
        console.error('Unexpected error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user, router]);

  const handleProfileUpdate = (updatedProfile: Profile) => {
    setProfile(updatedProfile);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/app')}
            className="mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold">Profile Settings</h1>
          <p className="text-muted-foreground">
            Manage your account information and preferences
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="personal" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="personal" className="gap-2">
            <User className="h-4 w-4" />
            Personal
          </TabsTrigger>
          <TabsTrigger value="company" className="gap-2">
            <Building2 className="h-4 w-4" />
            Company
          </TabsTrigger>
          <TabsTrigger value="vehicles" className="gap-2">
            <Truck className="h-4 w-4" />
            Vehicles
          </TabsTrigger>
          <TabsTrigger value="billing" className="gap-2">
            <CreditCard className="h-4 w-4" />
            Billing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="space-y-4">
          <ProfileInfoSection
            userId={user.id}
            userEmail={user.email || ''}
            profile={profile}
            onUpdate={handleProfileUpdate}
          />
        </TabsContent>

        <TabsContent value="company" className="space-y-4">
          <CompanyInfoSection
            userId={user.id}
            profile={profile}
            onUpdate={handleProfileUpdate}
          />
        </TabsContent>

        <TabsContent value="vehicles" className="space-y-4">
          <VehiclesManagementSection userId={user.id} />
        </TabsContent>

        <TabsContent value="billing" className="space-y-4">
          <BillingInfoSection
            userId={user.id}
            profile={profile}
            onUpdate={handleProfileUpdate}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
