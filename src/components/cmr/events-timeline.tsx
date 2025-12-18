'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabaseClient';
import { Clock, Truck, PackageCheck, MapPin, CheckCircle2 } from 'lucide-react';
import type { Database } from '@/types/database.types';

type CmrEvent = Database['public']['Tables']['cmr_events']['Row'];

interface EventMetadata {
  status?: 'completed_with_reserves' | 'completed_without_reserves';
  [key: string]: unknown;
}

interface EventsTimelineProps {
  cmrId: string;
  refreshKey?: number;
}

export function EventsTimeline({ cmrId, refreshKey }: EventsTimelineProps) {
  const [events, setEvents] = useState<CmrEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const { data, error } = await supabase
          .from('cmr_events')
          .select('*')
          .eq('cmr_id', cmrId)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Failed to fetch events:', error);
          return;
        }

        setEvents(data || []);
      } catch (err) {
        console.error('Unexpected error fetching events:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [cmrId, refreshKey]);

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  };

    const getIcon = (type: string) => {
      switch (type) {
        case 'loading_start':
          return <Truck className="h-5 w-5 text-blue-600" />;
        case 'loading_end':
          return <PackageCheck className="h-5 w-5 text-green-600" />;
        case 'delivery_start':
          return <MapPin className="h-5 w-5 text-purple-600" />;
        case 'delivery_end':
          return <CheckCircle2 className="h-5 w-5 text-emerald-600" />;
        default:
          return <Clock className="h-5 w-5 text-gray-600" />;
      }
    };

    const getLabel = (type: string) => {
      switch (type) {
        case 'loading_start':
          return 'Loading started';
        case 'loading_end':
          return 'Loading completed';
        case 'delivery_start':
          return 'Delivery started';
        case 'delivery_end':
          return 'Delivery completed';
        default:
          return type;
      }
    };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transport Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">Loading events...</p>
        </CardContent>
      </Card>
    );
  }

  if (events.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transport Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">No events recorded yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">

      {/* Full Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Complete Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {events.map((event) => {
              const meta = event.metadata as EventMetadata | null;

              return (
                <div key={event.id} className="flex items-start gap-3 pb-3 border-b last:border-b-0">
                  {getIcon(event.type)}
                  <div className="flex-1">
                    <p className="font-medium text-sm">{getLabel(event.type)}</p>
                    <p className="text-xs text-gray-500">
                      {formatDateTime(event.created_at)}
                    </p>

                    {event.type === 'delivery_end' && meta && (
                      <p className="mt-1 text-xs text-gray-600">
                        {meta.status === 'completed_with_reserves'
                          ? 'Completed with reserves'
                          : 'Completed without reserves'}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}

          </div>
        </CardContent>
      </Card>
    </div>
  );
}
