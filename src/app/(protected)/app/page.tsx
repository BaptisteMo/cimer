'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/auth.store';
import { supabase } from '@/lib/supabaseClient';
import { Plus, ArrowRight, Truck, Package, Archive, History } from 'lucide-react';
import { getStatusLabel, getStatusColor, isInProgress } from '@/lib/utils/status-helpers';
import type { Database } from '@/types/database.types';

type CmrDocument = Database['public']['Tables']['cmr_documents']['Row'];
type Vehicle = Database['public']['Tables']['vehicles']['Row'];

interface CmrWithVehicle extends CmrDocument {
  vehicle?: Vehicle;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [inProgressCmrs, setInProgressCmrs] = useState<CmrWithVehicle[]>([]);
  const [completedCmrs, setCompletedCmrs] = useState<CmrWithVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showArchived, _setShowArchived] = useState(false);

  useEffect(() => {
    const fetchCmrs = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Fetch all CMRs with vehicle information
        let query = supabase
          .from('cmr_documents')
          .select(`
            *,
            vehicle:vehicles(*)
          `)
          .eq('user_id', user.id);

        // Filter archived CMRs by default
        if (!showArchived) {
          query = query.eq('archived', false);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching CMRs:', error);
          return;
        }

        const cmrsWithVehicle = (data || []) as CmrWithVehicle[];

        // Separate in-progress and completed CMRs
        const inProgress = cmrsWithVehicle.filter(cmr => isInProgress(cmr.status));
        const completed = cmrsWithVehicle
          .filter(cmr => !isInProgress(cmr.status))
          .slice(0, 10); // Limit completed to 10 most recent

        setInProgressCmrs(inProgress);
        setCompletedCmrs(completed);
      } catch (err) {
        console.error('Unexpected error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCmrs();
  }, [user, showArchived]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const CmrListItem = ({ cmr }: { cmr: CmrWithVehicle }) => (
    <button
      onClick={() => router.push(`/cmr/${cmr.id}`)}
      className="w-full rounded-lg border p-4 text-left transition-colors hover:bg-muted"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          {/* Main info */}
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium">
              {cmr.shipper_name} → {cmr.consignee_name}
            </p>
            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(cmr.status)}`}>
              {getStatusLabel(cmr.status)}
            </span>
            {cmr.archived && (
              <span className="inline-flex items-center gap-1 rounded-full border border-gray-400 bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700">
                <Archive className="h-3 w-3" />
                Archived
              </span>
            )}
          </div>

          {/* Route */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Package className="h-4 w-4" />
            <span>{cmr.loading_place} → {cmr.delivery_place}</span>
          </div>

          {/* Vehicle and date */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {cmr.vehicle && (
              <div className="flex items-center gap-1">
                <Truck className="h-3 w-3" />
                <span>{cmr.vehicle.plate}</span>
              </div>
            )}
            <span>📅 {formatDate(cmr.loading_date)}</span>
          </div>
        </div>
        <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0 mt-1" />
      </div>
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Welcome section */}
      <div>
        <h1 className="text-3xl font-bold">Welcome back!</h1>
        <p className="text-muted-foreground">
          {user?.email}
        </p>
      </div>

      {/* New CMR CTA */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle>Create a new CMR</CardTitle>
          <CardDescription>
            Fill in transport details and manage your delivery
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            size="lg"
            className="gap-2"
            onClick={() => router.push('/cmr/new')}
          >
            <Plus className="h-5 w-5" />
            New CMR
          </Button>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading...</p>
          </div>
        </div>
      ) : (
        <>
          {/* CMRs In Progress */}
          <Card>
            <CardHeader>
              <CardTitle>CMRs In Progress</CardTitle>
              <CardDescription>
                Active transports that need your attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              {inProgressCmrs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Package className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No CMRs in progress</p>
                  <p className="text-sm text-muted-foreground">
                    All your transports are completed
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {inProgressCmrs.map((cmr) => (
                    <CmrListItem key={cmr.id} cmr={cmr} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recently Completed CMRs */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>Recently Completed</CardTitle>
                  <CardDescription>
                    Your last 10 completed transport documents
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/cmr/history')}
                  className="gap-2"
                >
                  <History className="h-4 w-4" />
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {completedCmrs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-muted-foreground">No completed CMRs yet</p>
                  <p className="text-sm text-muted-foreground">
                    Complete your first transport to see it here
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {completedCmrs.map((cmr) => (
                    <CmrListItem key={cmr.id} cmr={cmr} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
