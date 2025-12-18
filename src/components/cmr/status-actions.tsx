'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabaseClient';
import { useAuthStore } from '@/store/auth.store';
import { Truck, PackageCheck, MapPin, AlertCircle } from 'lucide-react';
import { performCmrAction, type CmrActionType } from '@/lib/utils/cmr-actions';

interface StatusActionsProps {
  cmrId: string;
  currentStatus: string;
  onStatusChanged: () => void;
  refreshKey?: number; // Add refresh trigger
}

export function StatusActions({ cmrId, currentStatus, onStatusChanged, refreshKey }: StatusActionsProps) {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasShipperSignature, setHasShipperSignature] = useState(false);
  const [checkingSignature, setCheckingSignature] = useState(false);

  const [_hasConsigneeSignature, setHasConsigneeSignature] = useState(false);
  const [_checkingConsignee, setCheckingConsignee] = useState(false);
  const [_hasReserves, setHasReserves] = useState(false);
  const [_checkingReserves, setCheckingReserves] = useState(false);


  // Check for shipper signature when status is 'loading'
    useEffect(() => {
      const checkShipperSignature = async () => {
        if (currentStatus !== 'loading') {
          setHasShipperSignature(false);
          return;
        }

        setCheckingSignature(true);
        try {
          const { data, error } = await supabase
            .from('cmr_signatures')
            .select('id')
            .eq('cmr_id', cmrId)
            .eq('party_type', 'shipper')
            .limit(1);

          if (error) {
            console.error('Error checking shipper signature:', error);
            return;
          }

          setHasShipperSignature(!!data?.length);
        } catch (err) {
          console.error('Unexpected error checking signature:', err);
        } finally {
          setCheckingSignature(false);
        }
      };

      checkShipperSignature();
    }, [cmrId, currentStatus, refreshKey]);

    useEffect(() => {
      const checkConsigneeAndReserves = async () => {
        if (currentStatus !== 'ready_to_deliver') {
          setHasConsigneeSignature(false);
          setHasReserves(false);
          return;
        }

        setCheckingConsignee(true);
        setCheckingReserves(true);

        try {
          // Signature destinataire
          const { data: sigs, error: sigError } = await supabase
            .from('cmr_signatures')
            .select('id')
            .eq('cmr_id', cmrId)
            .eq('party_type', 'consignee')
            .limit(1);

          if (sigError) {
            console.error('Error checking consignee signature:', sigError);
          } else {
            setHasConsigneeSignature(!!sigs?.length);
          }

          // Réserves (peu importe le side)
          const { data: reserves, error: resError } = await supabase
            .from('cmr_reserves')
            .select('id')
            .eq('cmr_id', cmrId)
            .limit(1);

          if (resError) {
            console.error('Error checking reserves:', resError);
          } else {
            setHasReserves(!!reserves?.length);
          }
        } catch (err) {
          console.error('Unexpected error checking consignee signature / reserves:', err);
        } finally {
          setCheckingConsignee(false);
          setCheckingReserves(false);
        }
      };

      checkConsigneeAndReserves();
    }, [cmrId, currentStatus, refreshKey]);

const handleStatusAction = async (type: CmrActionType) => {
  if (!user) return;

  setLoading(true);
  setError(null);

  try {
    await performCmrAction({ cmrId, userId: user.id, type });
    onStatusChanged();
  } catch (err) {
    console.error('CMR action error:', err);
    setError(
      err instanceof Error ? err.message : 'An unexpected error occurred'
    );
  } finally {
    setLoading(false);
  }
};

  // Don't show actions if CMR is completed
  if (currentStatus === 'completed' || currentStatus === 'completed_with_reserves') {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Status Actions</CardTitle>
        <CardDescription>Update the CMR transport status</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {currentStatus === 'ready_to_load' && (
          <Button
            onClick={() => handleStatusAction('loading_start')}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            <Truck className="mr-2 h-5 w-5" />
            {loading ? 'Starting...' : 'Start Loading'}
          </Button>
        )}

        {currentStatus === 'loading' && (
          <>
            {!hasShipperSignature && !checkingSignature && (
              <div className="rounded-md bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">Shipper signature required</p>
                  <p className="text-xs mt-1">
                    The shipper must sign before you can end the loading phase. Please capture the
                    shipper signature below.
                  </p>
                </div>
              </div>
            )}

            <Button
              onClick={() => handleStatusAction('loading_end')}
              disabled={loading || checkingSignature || !hasShipperSignature}
              className="w-full"
              size="lg"
            >
              <PackageCheck className="mr-2 h-5 w-5" />
              {checkingSignature
                ? 'Checking...'
                : loading
                ? 'Ending...'
                : 'End Loading'}
            </Button>
          </>
        )}

        {currentStatus === 'in_transit' && (
          <Button
            onClick={() => handleStatusAction('delivery_start')}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            <MapPin className="mr-2 h-5 w-5" />
            {loading ? 'Starting...' : 'Start Delivery'}
          </Button>
        )}

      </CardContent>
    </Card>
  );
}
