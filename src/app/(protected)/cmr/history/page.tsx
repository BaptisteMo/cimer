'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { useAuthStore } from '@/store/auth.store';
import { supabase } from '@/lib/supabaseClient';
import {
  ArrowLeft,
  ArrowRight,
  Truck,
  Package,
  Archive,
  Search,
  Calendar,
  Filter,
  ArrowUpDown,
} from 'lucide-react';
import { getStatusLabel, getStatusColor } from '@/lib/utils/status-helpers';
import type { Database } from '@/types/database.types';

type CmrDocument = Database['public']['Tables']['cmr_documents']['Row'];
type Vehicle = Database['public']['Tables']['vehicles']['Row'];

interface CmrWithVehicle extends CmrDocument {
  vehicle?: Vehicle;
}

type StatusFilter = 'all' | 'in_progress' | 'completed' | 'completed_with_reserves';
type SortField = 'loading_date_desc' | 'loading_date_asc' | 'shipper_name' | 'consignee_name';

export default function CmrHistoryPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  // Data
  const [cmrs, setCmrs] = useState<CmrWithVehicle[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [vehicleFilter, setVehicleFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [showArchived, setShowArchived] = useState(false);

  // Sorting & Pagination
  const [sortBy, setSortBy] = useState<SortField>('loading_date_desc');
  const [page, setPage] = useState(1);
  const pageSize = 50;

  // Fetch user vehicles for filter
  useEffect(() => {
    const fetchVehicles = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('user_id', user.id)
        .order('plate', { ascending: true });

      if (!error && data) {
        setVehicles(data);
      }
    };

    fetchVehicles();
  }, [user]);

  // Fetch CMRs with filters
  useEffect(() => {
    const fetchCmrs = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        let query = supabase
          .from('cmr_documents')
          .select(`
            *,
            vehicle:vehicles(*)
          `, { count: 'exact' })
          .eq('user_id', user.id);

        // Archived filter
        if (!showArchived) {
          query = query.eq('archived', false);
        }

        // Status filter
        if (statusFilter === 'in_progress') {
          query = query.in('status', ['draft', 'ready_to_load', 'loading', 'in_transit', 'ready_to_deliver']);
        } else if (statusFilter === 'completed') {
          query = query.in('status', ['completed', 'completed_with_reserves']);
        } else if (statusFilter === 'completed_with_reserves') {
          query = query.eq('status', 'completed_with_reserves');
        }

        // Vehicle filter
        if (vehicleFilter !== 'all') {
          query = query.eq('vehicle_id', vehicleFilter);
        }

        // Date range filter
        if (dateFrom) {
          query = query.gte('loading_date', dateFrom.toISOString().split('T')[0]);
        }
        if (dateTo) {
          query = query.lte('loading_date', dateTo.toISOString().split('T')[0]);
        }

        // Text search (simple ILIKE on shipper_name and consignee_name)
        if (searchText.trim()) {
          // For Supabase, we need to use .or() for multiple column search
          query = query.or(
            `shipper_name.ilike.%${searchText}%,consignee_name.ilike.%${searchText}%`
          );
        }

        // Sorting
        if (sortBy === 'loading_date_desc') {
          query = query.order('loading_date', { ascending: false });
        } else if (sortBy === 'loading_date_asc') {
          query = query.order('loading_date', { ascending: true });
        } else if (sortBy === 'shipper_name') {
          query = query.order('shipper_name', { ascending: true });
        } else if (sortBy === 'consignee_name') {
          query = query.order('consignee_name', { ascending: true });
        }

        // Pagination
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        query = query.range(from, to);

        const { data, error, count } = await query;

        if (error) {
          console.error('Error fetching CMRs:', error);
          return;
        }

        setCmrs((data || []) as CmrWithVehicle[]);
        setTotalCount(count || 0);
      } catch (err) {
        console.error('Unexpected error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCmrs();
  }, [user, searchText, statusFilter, vehicleFilter, dateFrom, dateTo, showArchived, sortBy, page]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  const CmrListItem = ({ cmr }: { cmr: CmrWithVehicle }) => (
    <button
      onClick={() => router.push(`/cmr/${cmr.id}`)}
      className="w-full rounded-lg border p-4 text-left transition-colors hover:bg-muted"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          {/* Main info */}
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium">
              {cmr.shipper_name} → {cmr.consignee_name}
            </p>
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(
                cmr.status
              )}`}
            >
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
            <span>
              {cmr.loading_place} → {cmr.delivery_place}
            </span>
          </div>

          {/* Vehicle and date */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {cmr.vehicle && (
              <div className="flex items-center gap-1">
                <Truck className="h-3 w-3" />
                <span>{cmr.vehicle.plate}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{formatDate(cmr.loading_date)}</span>
            </div>
          </div>
        </div>
        <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0 mt-1" />
      </div>
    </button>
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" onClick={() => router.push('/app')} className="mb-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold">CMR History</h1>
          <p className="text-muted-foreground">
            Browse and filter all your transport documents
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
          <CardDescription>Refine your search to find specific CMRs</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="space-y-2">
            <Label htmlFor="search">Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Shipper or consignee name..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Status filter */}
            <div className="space-y-2">
              <Label htmlFor="status-filter">Status</Label>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
                <SelectTrigger id="status-filter" className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="completed_with_reserves">Completed with Reserves</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Vehicle filter */}
            <div className="space-y-2">
              <Label htmlFor="vehicle-filter">Vehicle</Label>
              <Select value={vehicleFilter} onValueChange={setVehicleFilter}>
                <SelectTrigger id="vehicle-filter" className="w-full">
                  <SelectValue placeholder="Select vehicle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Vehicles</SelectItem>
                  {vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.plate}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date from */}
            <div className="space-y-2">
              <Label htmlFor="date-from">From</Label>
              <DatePicker
                date={dateFrom}
                onSelect={setDateFrom}
                placeholder="Select start date"
              />
            </div>

            {/* Date to */}
            <div className="space-y-2">
              <Label htmlFor="date-to">To</Label>
              <DatePicker
                date={dateTo}
                onSelect={setDateTo}
                placeholder="Select end date"
              />
            </div>
          </div>

          {/* Show archived toggle */}
          <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-3">
            <Switch
              id="show-archived-history"
              checked={showArchived}
              onCheckedChange={setShowArchived}
            />
            <Label htmlFor="show-archived-history" className="cursor-pointer">
              Show archived CMRs
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Sorting & Results count */}
      <div className="flex items-center justify-between gap-4">
        <div className="text-sm text-muted-foreground">
          {loading ? (
            'Loading...'
          ) : (
            <>
              Showing {cmrs.length} of {totalCount} CMR{totalCount !== 1 ? 's' : ''}
              {page > 1 && ` (Page ${page} of ${totalPages})`}
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Label htmlFor="sort-by" className="text-sm">
            <ArrowUpDown className="inline h-4 w-4 mr-1" />
            Sort by:
          </Label>
          <Select
            value={sortBy}
            onValueChange={(value) => {
              setSortBy(value as SortField);
              setPage(1); // Reset to first page on sort change
            }}
          >
            <SelectTrigger id="sort-by" className="w-[200px]" size="sm">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="loading_date_desc">Loading Date (Newest)</SelectItem>
              <SelectItem value="loading_date_asc">Loading Date (Oldest)</SelectItem>
              <SelectItem value="shipper_name">Shipper (A→Z)</SelectItem>
              <SelectItem value="consignee_name">Consignee (A→Z)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading CMRs...</p>
          </div>
        </div>
      ) : cmrs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No CMRs found</p>
            <p className="text-sm text-muted-foreground mt-1">
              Try adjusting your filters or create a new CMR
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3">
              {cmrs.map((cmr) => (
                <CmrListItem key={cmr.id} cmr={cmr} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
          >
            Previous
          </Button>
          <div className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </div>
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || loading}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
