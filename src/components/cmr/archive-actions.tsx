'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabaseClient';
import { Archive, ArchiveRestore, Loader2 } from 'lucide-react';
import type { Database } from '@/types/database.types';

type CmrDocument = Database['public']['Tables']['cmr_documents']['Row'];

interface ArchiveActionsProps {
  cmrId: string;
  cmr: CmrDocument;
  onArchiveChanged: () => void;
}

export function ArchiveActions({ cmrId, cmr, onArchiveChanged }: ArchiveActionsProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleArchive = async () => {
    if (!confirm('Are you sure you want to archive this CMR? It will be hidden from the main dashboard.')) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { error: updateError } = await supabase
        .from('cmr_documents')
        .update({
          archived: true,
          archived_at: new Date().toISOString(),
        })
        .eq('id', cmrId);

      if (updateError) throw updateError;

      setSuccess('CMR archived successfully!');
      setTimeout(() => {
        onArchiveChanged();
      }, 1000);
    } catch (err) {
      console.error('Archive error:', err);
      setError(err instanceof Error ? err.message : 'Failed to archive CMR');
    } finally {
      setLoading(false);
    }
  };

  const handleUnarchive = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { error: updateError } = await supabase
        .from('cmr_documents')
        .update({
          archived: false,
          archived_at: null,
        })
        .eq('id', cmrId);

      if (updateError) throw updateError;

      setSuccess('CMR unarchived successfully!');
      setTimeout(() => {
        onArchiveChanged();
      }, 1000);
    } catch (err) {
      console.error('Unarchive error:', err);
      setError(err instanceof Error ? err.message : 'Failed to unarchive CMR');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Archive</CardTitle>
        <CardDescription>
          {cmr.archived
            ? 'This CMR is archived. Unarchive it to show it in the main dashboard.'
            : 'Archive this CMR to hide it from the main dashboard. It will not be deleted.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-md bg-green-50 p-3 text-sm text-green-800">
            {success}
          </div>
        )}

        {cmr.archived ? (
          <Button
            onClick={handleUnarchive}
            disabled={loading}
            variant="outline"
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Unarchiving...
              </>
            ) : (
              <>
                <ArchiveRestore className="mr-2 h-4 w-4" />
                Unarchive CMR
              </>
            )}
          </Button>
        ) : (
          <Button
            onClick={handleArchive}
            disabled={loading}
            variant="outline"
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Archiving...
              </>
            ) : (
              <>
                <Archive className="mr-2 h-4 w-4" />
                Archive CMR
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
