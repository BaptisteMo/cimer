'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { checkOnboardingStatus } from '@/lib/utils/onboarding-check';
import { VehiclesForm } from '@/components/onboarding/vehicles-form';

export default function VehiclesOnboardingPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      if (!user) {
        router.push('/login');
        return;
      }

      // Check if profile exists
      const status = await checkOnboardingStatus(user.id);

      if (!status.hasProfile) {
        // Redirect to profile if not completed
        router.push('/onboarding/profile');
        return;
      }

      setLoading(false);
    };

    checkAuth();
  }, [user, router]);

  const handleComplete = () => {
    // Onboarding complete, redirect to app
    router.push('/app');
  };

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
            <h1 className="text-2xl font-bold text-gray-900">Add Your Vehicles</h1>
            <p className="mt-2 text-gray-600">
              Add the vehicles you use for transport. You need at least one vehicle to start creating CMR documents.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <div className="flex-1 h-2 bg-blue-600 rounded"></div>
              <div className="flex-1 h-2 bg-blue-600 rounded"></div>
            </div>
            <p className="mt-2 text-sm text-gray-500">Step 2 of 2: Vehicles</p>
          </div>

          <VehiclesForm userId={user.id} onComplete={handleComplete} />
        </div>
      </div>
    </div>
  );
}
