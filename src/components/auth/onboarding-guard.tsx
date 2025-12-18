'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { checkOnboardingStatus, getOnboardingRedirectPath } from '@/lib/utils/onboarding-check';

/**
 * OnboardingGuard Component
 *
 * Checks if the user has completed onboarding and redirects to the appropriate step if not.
 * Should be used in protected routes that require onboarding completion.
 */
export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuthStore();
  const [checking, setChecking] = useState(true);
  const [canProceed, setCanProceed] = useState(false);

  useEffect(() => {
    const checkOnboarding = async () => {
      // Skip check if on onboarding pages
      if (pathname?.startsWith('/onboarding')) {
        setCanProceed(true);
        setChecking(false);
        return;
      }

      // Check auth
      if (!user) {
        router.push('/login');
        return;
      }

      try {
        // Check onboarding status
        const status = await checkOnboardingStatus(user.id);
        const redirectPath = getOnboardingRedirectPath(status);

        if (redirectPath) {
          // Onboarding not complete, redirect
          router.push(redirectPath);
          return;
        }

        // Onboarding complete, allow access
        setCanProceed(true);
      } catch (error) {
        console.error('Error checking onboarding:', error);
        // On error, allow access (fail open)
        setCanProceed(true);
      } finally {
        setChecking(false);
      }
    };

    checkOnboarding();
  }, [user, router, pathname]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!canProceed) {
    return null;
  }

  return <>{children}</>;
}
