'use client';

/**
 * CMR Details Page - Complete Transport Lifecycle View
 *
 * This page manages the complete lifecycle of a CMR transport document:
 *
 * LIFECYCLE STAGES:
 * 1. ready_to_load → CMR created, waiting to start loading
 * 2. loading → Driver at shipper site, loading goods
 * 3. in_transit → Loading complete with shipper signature, goods in transit
 * 4. ready_to_deliver → Driver arrived at delivery site
 * 5. completed / completed_with_reserves → Delivery complete with consignee signature
 *
 * PAGE STRUCTURE:
 * - Header: CMR number, status, basic info
 * - TRANSPORTER Block: Carrier/transporter information from profiles table
 *   (Corresponds to "Transporteur" on paper CMR - Box 2)
 * - LOADING Block: Everything that happens at shipper site
 *   - Party info (shipper, principal)
 *   - Loading location, timestamps (arrival, departure)
 *   - Extra services at loading
 *   - Goods details (description, ADR, temperature, pallets)
 *   - Loading reserves (damages/discrepancies noted during loading)
 *   - Shipper signature (required to complete loading)
 *
 * - DELIVERY Block: Everything that happens at consignee site
 *   - Party info (consignee, delivery carrier)
 *   - Delivery location, timestamps (arrival, departure)
 *   - Extra services at delivery
 *   - Cash on delivery (COD) if applicable
 *   - Delivery reserves (damages/discrepancies noted during delivery)
 *   - Consignee signature (required to complete transport)
 *
 * - FOOTER: PDF generation, archive actions
 *
 * DATA SOURCES:
 * - cmr_documents table: Mission-specific data (shipper, consignee, goods, etc.)
 * - profiles table: Transporter/carrier info (company name, address, SIREN, phone)
 * - vehicles table: Vehicle details (fetched through vehicle_id in CMR)
 *
 * FIELD FILLING RESPONSIBILITY:
 * - Back-office / Dispatcher: Creates CMR with all initial data (parties, goods, planning)
 * - Driver: Updates timestamps, adds reserves, collects signatures, takes photos
 * - System: Auto-updates status based on signatures and workflow
 */

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/lib/supabaseClient';
import { useAuthStore } from '@/store/auth.store';
import {
  ArrowLeft,
  Package,
  MapPin,
  Clock,
  AlertTriangle,
  Thermometer,
  FileText,
  Truck,
  Euro,
  Calendar,
  Building2,
} from 'lucide-react';
import type { Database } from '@/types/database.types';
import { PhotosSection } from '@/components/cmr/photos-section';
import { SignatureSectionUnified } from '@/components/cmr/signature-section-unified';
import { PdfActions } from '@/components/cmr/pdf-actions';
import { StatusActions } from '@/components/cmr/status-actions';
import { EventsTimeline } from '@/components/cmr/events-timeline';
import { ReservesSection } from '@/components/cmr/reserves-section';
import { ArchiveActions } from '@/components/cmr/archive-actions';

type CmrDocument = Database['public']['Tables']['cmr_documents']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

export default function CmrDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [cmr, setCmr] = useState<CmrDocument | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  /**
   * Fetch CMR document from database
   */
  const fetchCmr = useCallback(async () => {
    if (!user || !params.id) {
      setLoading(false);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('cmr_documents')
        .select('*')
        .eq('id', params.id as string)
        .eq('user_id', user.id)
        .single();

      if (fetchError) {
        console.error('Fetch error:', fetchError);
        setError('Failed to load CMR document');
        return;
      }

      if (!data) {
        setError('CMR not found');
        return;
      }

      setCmr(data);
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [user, params.id]);

  /**
   * Fetch user profile for transporter information
   *
   * NOTE: Transporter info is NEVER stored in cmr_documents table.
   * It's always fetched from profiles to ensure consistency and avoid duplication.
   * This corresponds to the "Transporteur" (Carrier) section on paper CMR (Box 2).
   */
  const fetchProfile = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        return;
      }

      if (data) {
        setProfile(data);
      }
    } catch (err) {
      console.error('Unexpected error fetching profile:', err);
    }
  }, [user]);

  useEffect(() => {
    fetchCmr();
    fetchProfile();
  }, [fetchCmr, fetchProfile]);

  const handleSignatureAdded = async () => {
    await fetchCmr();
    setRefreshKey((prev) => prev + 1);
  };

  const handleStatusChanged = async () => {
    await fetchCmr();
    setRefreshKey((prev) => prev + 1);
  };

  /**
   * Helper to format dates and timestamps
   */
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'PPP');
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'PPP à HH:mm');
    } catch {
      return dateString;
    }
  };

  /**
   * Determine if CMR is completed (read-only)
   */
  const isCompleted = cmr?.status === 'completed' || cmr?.status === 'completed_with_reserves';

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading CMR...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 mx-auto max-w-3xl">
        <Button variant="ghost" onClick={() => router.push('/app')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
        <div className="rounded-md bg-red-50 border border-red-200 p-4 text-red-800">
          <p className="font-medium">Error</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!cmr) {
    return (
      <div className="space-y-4 mx-auto max-w-3xl">
        <Button variant="ghost" onClick={() => router.push('/app')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
        <div className="rounded-md bg-yellow-50 border border-yellow-200 p-4 text-yellow-800">
          CMR document not found
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12">
      {/* ========================================================================
          HEADER - CMR Number, Status, Basic Info
          ======================================================================== */}
      <div className="flex items-start justify-between">
        <div>
          <Button variant="ghost" onClick={() => router.push('/app')} className="mb-2 -ml-3">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">
            CMR {cmr.cmr_number || `#${cmr.id.slice(0, 8)}`}
          </h1>
          <p className="text-muted-foreground mt-1">
            Created {formatDate(cmr.created_at)}
            {cmr.is_international && (
              <Badge variant="secondary" className="ml-2">International</Badge>
            )}
          </p>
        </div>
        <Badge
          variant={isCompleted ? 'default' : 'secondary'}
          className="text-sm px-3 py-1"
        >
          {cmr.status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
        </Badge>
      </div>

      {/* Status Management Actions */}
      <StatusActions
        cmrId={cmr.id}
        currentStatus={cmr.status}
        onStatusChanged={handleStatusChanged}
        refreshKey={refreshKey}
      />

      <Separator />

      {/* ========================================================================
          TRANSPORTER BLOCK - Carrier/Transporter Information
          Corresponds to "Transporteur" (Carrier) on paper CMR (Box 2)

          NOTE: This data comes from the profiles table, NOT cmr_documents.
          We avoid duplicating transporter info for every CMR.
          The transporter is always the authenticated user's company.
          ======================================================================== */}
      {profile && (
        <Card className="border-2 border-purple-200 bg-purple-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-purple-600" />
              Transporter (Transporteur)
            </CardTitle>
            <CardDescription>
              Carrier company information - Box 2 of paper CMR
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {profile.company_name && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Company Name</p>
                  <p className="text-base font-semibold">{profile.company_name}</p>
                </div>
              )}
              {profile.company_address && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Address</p>
                  <p className="text-base">{profile.company_address}</p>
                </div>
              )}
              {profile.phone && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Phone</p>
                  <p className="text-base">{profile.phone}</p>
                </div>
              )}
              {profile.billing_email && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p className="text-base">{profile.billing_email}</p>
                </div>
              )}
            </div>

            {/* Company registration numbers (SIREN, SIRET, NAF) if available */}
            {(profile.company_siren || profile.company_siret || profile.company_naf) && (
              <>
                <Separator />
                <div className="grid grid-cols-3 gap-4 text-sm">
                  {profile.company_siren && (
                    <div>
                      <p className="text-muted-foreground font-medium">SIREN</p>
                      <p className="font-mono">{profile.company_siren}</p>
                    </div>
                  )}
                  {profile.company_siret && (
                    <div>
                      <p className="text-muted-foreground font-medium">SIRET</p>
                      <p className="font-mono">{profile.company_siret}</p>
                    </div>
                  )}
                  {profile.company_naf && (
                    <div>
                      <p className="text-muted-foreground font-medium">NAF</p>
                      <p className="font-mono">{profile.company_naf}</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* ========================================================================
          LOADING BLOCK - Everything that happens at shipper site
          Corresponds to loading phase of paper CMR (Box 1-13)
          ======================================================================== */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-100">
            <Truck className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Loading (Chargement)</h2>
            <p className="text-sm text-muted-foreground">
              Operations at shipper site
            </p>
          </div>
        </div>

        {/* Shipper & Principal */}
        <Card>
          <CardHeader>
            <CardTitle>Parties</CardTitle>
            <CardDescription>Shipper and principal (if different)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-muted-foreground mb-1">Shipper (Expéditeur)</p>
              <p className="font-medium">{cmr.shipper_name}</p>
              <p className="text-sm text-muted-foreground">{cmr.shipper_address || 'N/A'}</p>
            </div>

            {cmr.principal_name && (
              <>
                <Separator />
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-1">
                    Principal (Donneur d&apos;ordre)
                  </p>
                  <p className="font-medium">{cmr.principal_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {cmr.principal_address || 'N/A'}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Loading Location & Times */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Loading Location & Timeline
            </CardTitle>
            <CardDescription>Where and when loading takes place</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Loading Place</p>
              <p className="text-base">{cmr.loading_place}</p>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Planned Loading Date
                </p>
                <p className="text-base">{formatDate(cmr.loading_date)}</p>
              </div>

              {cmr.loading_arrival_at && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Arrival at Loading Site
                  </p>
                  <p className="text-base">{formatDateTime(cmr.loading_arrival_at)}</p>
                </div>
              )}

              {cmr.loading_departure_at && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Departure from Loading Site
                  </p>
                  <p className="text-base">{formatDateTime(cmr.loading_departure_at)}</p>
                </div>
              )}
            </div>

            {cmr.loading_extra_services && (
              <>
                <Separator />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Extra Services</p>
                  <p className="text-sm">{cmr.loading_extra_services}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Goods Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Goods Information
            </CardTitle>
            <CardDescription>Details of cargo being transported</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Description</p>
              <p className="text-base">{cmr.goods_description || 'N/A'}</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Packages</p>
                <p className="text-lg font-semibold">{cmr.packages_count || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Weight</p>
                <p className="text-lg font-semibold">
                  {cmr.weight_kg ? `${cmr.weight_kg} kg` : 'N/A'}
                </p>
              </div>
              {cmr.packaging_type && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Packaging</p>
                  <p className="text-base">{cmr.packaging_type}</p>
                </div>
              )}
              {cmr.goods_marks_numbers && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Marks & Numbers</p>
                  <p className="text-base">{cmr.goods_marks_numbers}</p>
                </div>
              )}
            </div>

            {(cmr.declared_value || cmr.declared_value_currency) && (
              <>
                <Separator />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Declared Value</p>
                  <p className="text-lg font-semibold">
                    {cmr.declared_value} {cmr.declared_value_currency || 'EUR'}
                  </p>
                </div>
              </>
            )}

            {/* Dangerous Goods Warning */}
            {cmr.is_dangerous_goods && (
              <>
                <Separator />
                <div className="rounded-lg bg-orange-50 border border-orange-200 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    <p className="font-semibold text-orange-900">Dangerous Goods (ADR)</p>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    {cmr.dangerous_goods_class && (
                      <div>
                        <p className="text-orange-700 font-medium">Class</p>
                        <p className="text-orange-900">{cmr.dangerous_goods_class}</p>
                      </div>
                    )}
                    {cmr.dangerous_goods_un_number && (
                      <div>
                        <p className="text-orange-700 font-medium">UN Number</p>
                        <p className="text-orange-900">{cmr.dangerous_goods_un_number}</p>
                      </div>
                    )}
                    {cmr.dangerous_goods_adr_letter && (
                      <div>
                        <p className="text-orange-700 font-medium">ADR Letter</p>
                        <p className="text-orange-900">{cmr.dangerous_goods_adr_letter}</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Temperature Control */}
            {cmr.is_controlled_temperature && (
              <>
                <Separator />
                <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Thermometer className="h-5 w-5 text-blue-600" />
                    <p className="font-semibold text-blue-900">Temperature Controlled</p>
                  </div>
                  <div className="flex gap-4 text-sm">
                    {cmr.temperature_min !== null && (
                      <div>
                        <p className="text-blue-700 font-medium">Min</p>
                        <p className="text-blue-900">{cmr.temperature_min}°C</p>
                      </div>
                    )}
                    {cmr.temperature_max !== null && (
                      <div>
                        <p className="text-blue-700 font-medium">Max</p>
                        <p className="text-blue-900">{cmr.temperature_max}°C</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Pallets Information */}
            {(cmr.pallets_80_120 ||
              cmr.pallets_100_120 ||
              cmr.pallets_europe ||
              cmr.pallets_others ||
              cmr.pallets_bacs ||
              cmr.pallets_rolls) && (
              <>
                <Separator />
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-2">
                    Pallets & Supports
                  </p>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-3 text-sm">
                    {(cmr.pallets_80_120 && cmr.pallets_80_120 > 0) && (
                      <div className="text-center p-2 bg-muted rounded">
                        <p className="font-semibold text-lg">{cmr.pallets_80_120}</p>
                        <p className="text-xs text-muted-foreground">80x120</p>
                      </div>
                    )}
                    {(cmr.pallets_100_120 && cmr.pallets_100_120 > 0) && (
                      <div className="text-center p-2 bg-muted rounded">
                        <p className="font-semibold text-lg">{cmr.pallets_100_120}</p>
                        <p className="text-xs text-muted-foreground">100x120</p>
                      </div>
                    )}
                    {(cmr.pallets_europe && cmr.pallets_europe > 0) && (
                      <div className="text-center p-2 bg-muted rounded">
                        <p className="font-semibold text-lg">{cmr.pallets_europe}</p>
                        <p className="text-xs text-muted-foreground">Euro</p>
                      </div>
                    )}
                    {(cmr.pallets_others && cmr.pallets_others > 0) && (
                      <div className="text-center p-2 bg-muted rounded">
                        <p className="font-semibold text-lg">{cmr.pallets_others}</p>
                        <p className="text-xs text-muted-foreground">Others</p>
                      </div>
                    )}
                    {(cmr.pallets_bacs && cmr.pallets_bacs > 0) && (
                      <div className="text-center p-2 bg-muted rounded">
                        <p className="font-semibold text-lg">{cmr.pallets_bacs}</p>
                        <p className="text-xs text-muted-foreground">Bacs</p>
                      </div>
                    )}
                    {(cmr.pallets_rolls && cmr.pallets_rolls > 0) && (
                      <div className="text-center p-2 bg-muted rounded">
                        <p className="font-semibold text-lg">{cmr.pallets_rolls}</p>
                        <p className="text-xs text-muted-foreground">Rolls</p>
                      </div>
                    )}
                  </div>
                  {cmr.pallets_origin && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Origin: {cmr.pallets_origin}
                    </p>
                  )}
                </div>
              </>
            )}

            {/* Instructions */}
            {(cmr.instructions || cmr.customs_instructions || cmr.attached_documents) && (
              <>
                <Separator />
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Instructions & Documents
                  </p>
                  {cmr.instructions && (
                    <div className="text-sm bg-muted p-3 rounded">
                      <p className="font-medium mb-1">Special Instructions:</p>
                      <p>{cmr.instructions}</p>
                    </div>
                  )}
                  {cmr.customs_instructions && (
                    <div className="text-sm bg-muted p-3 rounded">
                      <p className="font-medium mb-1">Customs Instructions:</p>
                      <p>{cmr.customs_instructions}</p>
                    </div>
                  )}
                  {cmr.attached_documents && (
                    <div className="text-sm">
                      <p className="font-medium mb-1">Attached Documents:</p>
                      <p className="text-muted-foreground">{cmr.attached_documents}</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Loading Photos */}
        <PhotosSection
          cmrId={cmr.id}
          readonly={isCompleted}
        />

        {/* Loading Reserves - Corresponds to "Réserves" section of paper CMR at loading */}
        {(cmr.status === 'loading' || isCompleted) && (
          <ReservesSection
            cmrId={cmr.id}
            side="loading"
            readonly={isCompleted}
          />
        )}

        {/* Shipper Signature - Required to complete loading */}
        {cmr.status === 'loading' && (
          <SignatureSectionUnified
            cmrId={cmr.id}
            partyType="shipper"
            onSignatureAdded={handleSignatureAdded}
          />
        )}
      </div>

      <Separator className="my-8" />

      {/* ========================================================================
          DELIVERY BLOCK - Everything that happens at consignee site
          Corresponds to delivery phase of paper CMR (Box 14-24)
          ======================================================================== */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-100">
            <MapPin className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Delivery (Livraison)</h2>
            <p className="text-sm text-muted-foreground">
              Operations at consignee site
            </p>
          </div>
        </div>

        {/* Consignee & Delivery Carrier */}
        <Card>
          <CardHeader>
            <CardTitle>Parties</CardTitle>
            <CardDescription>Consignee and delivery carrier (if different)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-muted-foreground mb-1">
                Consignee (Destinataire)
              </p>
              <p className="font-medium">{cmr.consignee_name}</p>
              <p className="text-sm text-muted-foreground">{cmr.consignee_address || 'N/A'}</p>
            </div>

            {cmr.delivery_carrier_name && (
              <>
                <Separator />
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-1">
                    Delivery Carrier (Transporteur successif)
                  </p>
                  <p className="font-medium">{cmr.delivery_carrier_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {cmr.delivery_carrier_address || 'N/A'}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Delivery Location & Times */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Delivery Location & Timeline
            </CardTitle>
            <CardDescription>Where and when delivery takes place</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Delivery Place</p>
              <p className="text-base">{cmr.delivery_place}</p>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cmr.requested_delivery_at && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Requested Delivery
                  </p>
                  <p className="text-base">{formatDateTime(cmr.requested_delivery_at)}</p>
                </div>
              )}

              {cmr.delivery_arrival_at && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Arrival at Delivery Site
                  </p>
                  <p className="text-base">{formatDateTime(cmr.delivery_arrival_at)}</p>
                </div>
              )}

              {cmr.delivery_departure_at && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Departure from Delivery Site
                  </p>
                  <p className="text-base">{formatDateTime(cmr.delivery_departure_at)}</p>
                </div>
              )}
            </div>

            {cmr.delivery_extra_services && (
              <>
                <Separator />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Extra Services</p>
                  <p className="text-sm">{cmr.delivery_extra_services}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Cash on Delivery (COD) - Prominent display if applicable */}
        {cmr.cash_on_delivery_amount && cmr.cash_on_delivery_amount > 0 && (
          <Card className="border-2 border-yellow-300 bg-yellow-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-900">
                <Euro className="h-6 w-6" />
                Cash on Delivery (Contre-Remboursement)
              </CardTitle>
              <CardDescription className="text-yellow-800">
                Amount to collect from consignee
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-yellow-900">
                {cmr.cash_on_delivery_amount} {cmr.cash_on_delivery_currency || 'EUR'}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Financial Information */}
        {(cmr.freight_total_amount || cmr.freight_terms) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Euro className="h-5 w-5" />
                Freight Charges
              </CardTitle>
              <CardDescription>Transport costs and payment terms</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {cmr.freight_total_amount && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
                  <p className="text-xl font-semibold">
                    {cmr.freight_total_amount} {cmr.freight_currency || 'EUR'}
                  </p>
                </div>
              )}
              {cmr.freight_terms && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Payment Terms</p>
                  <p className="text-base">{cmr.freight_terms}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Delivery Reserves - Corresponds to "Réserves" section of paper CMR at delivery */}
        {(cmr.status === 'ready_to_deliver' || isCompleted) && (
          <ReservesSection
            cmrId={cmr.id}
            side="delivery"
            readonly={isCompleted}
          />
        )}

        {/* Consignee Signature - Required to complete delivery */}
        {cmr.status === 'ready_to_deliver' && (
          <SignatureSectionUnified
            cmrId={cmr.id}
            partyType="consignee"
            onSignatureAdded={handleSignatureAdded}
          />
        )}
      </div>

      <Separator className="my-8" />

      {/* ========================================================================
          FOOTER - Timeline, PDF, Archive
          ======================================================================== */}
      <EventsTimeline cmrId={cmr.id} refreshKey={refreshKey} />

      <PdfActions cmrId={cmr.id} cmr={cmr} />

      <ArchiveActions cmrId={cmr.id} cmr={cmr} onArchiveChanged={fetchCmr} />
    </div>
  );
}
