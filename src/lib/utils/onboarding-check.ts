/**
 * Onboarding Check Utility
 *
 * Checks if a user has completed onboarding:
 * 1. Profile exists with required fields
 * 2. At least one vehicle exists
 */

import { supabase } from '@/lib/supabaseClient';

export interface OnboardingStatus {
  hasProfile: boolean;
  hasVehicles: boolean;
  isComplete: boolean;
}

/**
 * Check if the user has completed onboarding
 * Returns the onboarding status with details
 */
export async function checkOnboardingStatus(userId: string): Promise<OnboardingStatus> {
  try {
    // Check if profile exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, company_name, company_address')
      .eq('id', userId)
      .maybeSingle(); // Use maybeSingle() instead of single() to avoid 406 errors

    if (profileError) {
      console.error('Error checking profile:', profileError);
    }

    const hasProfile = !!(
      profile &&
      profile.full_name &&
      profile.company_name &&
      profile.company_address
    );

    // Check if user has at least one vehicle
    const { data: vehicles, error: vehiclesError } = await supabase
      .from('vehicles')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    if (vehiclesError) {
      console.error('Error checking vehicles:', vehiclesError);
    }

    const hasVehicles = !!(vehicles && vehicles.length > 0);

    return {
      hasProfile,
      hasVehicles,
      isComplete: hasProfile && hasVehicles,
    };
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    return {
      hasProfile: false,
      hasVehicles: false,
      isComplete: false,
    };
  }
}

/**
 * Get the next onboarding step path
 * Returns null if onboarding is complete
 */
export function getOnboardingRedirectPath(status: OnboardingStatus): string | null {
  if (status.isComplete) {
    return null;
  }

  if (!status.hasProfile) {
    return '/onboarding/profile';
  }

  if (!status.hasVehicles) {
    return '/onboarding/vehicles';
  }

  return null;
}
