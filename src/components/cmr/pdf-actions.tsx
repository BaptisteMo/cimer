'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { downloadCmrPdf, generateCmrPdfBlob } from '@/lib/utils/pdf-generator';
import { Download, Share2, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import type { Database } from '@/types/database.types';

type CmrDocument = Database['public']['Tables']['cmr_documents']['Row'];

interface PdfActionsProps {
  cmrId: string;
  cmr: CmrDocument;
}

export function PdfActions({ cmrId, cmr }: PdfActionsProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Check if Web Share API is available
  const canShare = typeof navigator !== 'undefined' && !!navigator.share;

  // Function to fetch all CMR data for PDF
  const fetchCmrData = async () => {
    try {
      // Fetch profile for transporter information (Box 2 on paper CMR)
      // This is NOT duplicated in cmr_documents, it comes from the user's profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', cmr.user_id)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
      }

      // Fetch signatures
      const { data: signatures, error: signaturesError } = await supabase
        .from('cmr_signatures')
        .select('*')
        .eq('cmr_id', cmrId);

      if (signaturesError) throw signaturesError;

      const shipperSignature = signatures?.find((s) => s.party_type === 'shipper') || null;
      const consigneeSignature = signatures?.find((s) => s.party_type === 'consignee') || null;

      // Get signed URLs for signatures
      let shipperSignatureWithUrl = null;
      if (shipperSignature) {
        const { data: signedUrl } = await supabase.storage
          .from('cmr-signatures')
          .createSignedUrl(shipperSignature.storage_path, 3600);
        shipperSignatureWithUrl = { ...shipperSignature, signatureUrl: signedUrl?.signedUrl || null };
      }

      let consigneeSignatureWithUrl = null;
      if (consigneeSignature) {
        const { data: signedUrl } = await supabase.storage
          .from('cmr-signatures')
          .createSignedUrl(consigneeSignature.storage_path, 3600);
        consigneeSignatureWithUrl = { ...consigneeSignature, signatureUrl: signedUrl?.signedUrl || null };
      }

      // Fetch reserves
      const { data: reserves, error: reservesError } = await supabase
        .from('cmr_reserves')
        .select('*')
        .eq('cmr_id', cmrId)
        .order('created_at', { ascending: true });

      if (reservesError) throw reservesError;

      // Get signed URLs for reserve photos
      const reservesWithUrls = await Promise.all(
        (reserves || []).map(async (reserve) => {
          if (reserve.photo_storage_path) {
            const { data: signedUrl } = await supabase.storage
              .from('cmr-reserve-photos')
              .createSignedUrl(reserve.photo_storage_path, 3600);
            return { ...reserve, photoUrl: signedUrl?.signedUrl || null };
          }
          return { ...reserve, photoUrl: null };
        })
      );

      // Fetch general CMR photos
      const { data: photos, error: photosError } = await supabase
        .from('cmr_photos')
        .select('*')
        .eq('cmr_id', cmrId)
        .order('created_at', { ascending: true });

      if (photosError) throw photosError;

      // Get signed URLs for general photos
      const photosWithUrls = await Promise.all(
        (photos || []).map(async (photo) => {
          const { data: signedUrl } = await supabase.storage
            .from('cmr-photos')
            .createSignedUrl(photo.storage_path, 3600);
          return { ...photo, photoUrl: signedUrl?.signedUrl || null };
        })
      );

      return {
        profile: profile || null,
        shipperSignature: shipperSignatureWithUrl,
        consigneeSignature: consigneeSignatureWithUrl,
        reserves: reservesWithUrls,
        photos: photosWithUrls,
      };
    } catch (err) {
      console.error('Error fetching CMR data:', err);
      throw err;
    }
  };

  const handleGeneratePdf = async () => {
    setIsGenerating(true);
    setError(null);
    setSuccess(null);

    try {
      const { profile, shipperSignature, consigneeSignature, reserves, photos } = await fetchCmrData();

      await downloadCmrPdf({
        cmr,
        profile,
        shipperSignature,
        consigneeSignature,
        reserves,
        photos,
      });

      setSuccess('PDF downloaded successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('PDF generation error:', err);
      setError('Failed to generate PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShare = async () => {
    setIsSharing(true);
    setError(null);
    setSuccess(null);

    try {
      if (!canShare) {
        // Fallback: copy page URL to clipboard
        const url = window.location.href;
        await navigator.clipboard.writeText(url);
        setSuccess('Link copied to clipboard!');
        setTimeout(() => setSuccess(null), 3000);
        setIsSharing(false);
        return;
      }

      const { profile, shipperSignature, consigneeSignature, reserves, photos } = await fetchCmrData();

      // Generate PDF as blob for sharing
      const pdfBlob = await generateCmrPdfBlob({
        cmr,
        profile,
        shipperSignature,
        consigneeSignature,
        reserves,
        photos,
      });
      const filename = `CMR_${cmr.id.substring(0, 8)}.pdf`;

      // Create a File object from the blob
      const file = new File([pdfBlob], filename, { type: 'application/pdf' });

      // Share using Web Share API
      await navigator.share({
        title: `CMR - ${cmr.shipper_name} → ${cmr.consignee_name}`,
        text: `CMR transport document from ${cmr.loading_place} to ${cmr.delivery_place}`,
        files: [file],
      });

      setSuccess('Shared successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      // Don't show error if user cancelled the share
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Share error:', err);
        setError('Failed to share. Please try again.');
      }
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Export & Share</CardTitle>
        <CardDescription>
          Download or share this complete CMR document as a PDF with signatures, reserves, and photos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-md bg-green-50 p-3 text-sm text-green-800 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            {success}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleGeneratePdf}
            disabled={isGenerating || isSharing}
            className="flex-1 gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Generate PDF
              </>
            )}
          </Button>

          <Button
            onClick={handleShare}
            disabled={isGenerating || isSharing}
            variant="outline"
            className="flex-1 gap-2"
          >
            {isSharing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sharing...
              </>
            ) : (
              <>
                <Share2 className="h-4 w-4" />
                {canShare ? 'Share' : 'Copy Link'}
              </>
            )}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          {canShare
            ? 'Share the complete PDF directly or download it to your device'
            : 'Download the complete PDF or copy the link to share'}
        </p>
      </CardContent>
    </Card>
  );
}
