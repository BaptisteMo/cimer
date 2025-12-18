'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SignaturePad } from './signature-pad';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store/auth.store';
import { supabase } from '@/lib/supabaseClient';
import { CheckCircle2 } from 'lucide-react';
import { performCmrAction } from '@/lib/utils/cmr-actions';
import Image from 'next/image'

interface Signature {
  id: string;
  storage_path: string;
  created_at: string;
  signer_name: string | null;
  signer_role: string | null;
  signer_email: string | null;
  url: string;
}

type PartyType = 'shipper' | 'consignee';

interface SignatureSectionProps {
  cmrId: string;
  partyType: PartyType;
  onSignatureAdded?: () => void;
}

const PARTY_CONFIG = {
  shipper: {
    title: 'Shipper Signature',
    description: 'Signature of the sender (expéditeur)',
    message: 'The shipper must sign to confirm that the goods have been loaded and are ready for transport.',
    namePlaceholder: 'John Doe',
    rolePlaceholder: 'Manager',
    emailPlaceholder: 'john.doe@example.com',
  },
  consignee: {
    title: 'Consignee Signature',
    description: 'Signature of the recipient (destinataire)',
    message: 'The consignee must sign to confirm receipt of the goods.',
    namePlaceholder: 'Jane Smith',
    rolePlaceholder: 'Warehouse Manager',
    emailPlaceholder: 'jane.smith@example.com',
  },
};

export function SignatureSectionUnified({ cmrId, partyType, onSignatureAdded }: SignatureSectionProps) {
  const { user } = useAuthStore();
  const [signature, setSignature] = useState<Signature | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signerName, setSignerName] = useState('');
  const [signerRole, setSignerRole] = useState('');
  const [signerEmail, setSignerEmail] = useState('');

  const config = PARTY_CONFIG[partyType];

  const loadSignature = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if signature exists
      const { data: signatureData, error: signatureError } = await supabase
        .from('cmr_signatures')
        .select('*')
        .eq('cmr_id', cmrId)
        .eq('party_type', partyType)
        .maybeSingle();

      if (signatureError) {
        throw signatureError;
      }

      if (signatureData) {
        // Get signed URL from storage
        const { data: urlData } = await supabase.storage
          .from('cmr-signatures')
          .createSignedUrl(signatureData.storage_path, 3600);

        if (urlData) {
          setSignature({
            ...signatureData,
            url: urlData.signedUrl,
          });
        }
      }
    } catch (err) {
      console.error(`Error loading ${partyType} signature:`, err);
      setError('Failed to load signature');
    } finally {
      setLoading(false);
    }
  }, [cmrId, partyType]);

  useEffect(() => {
    loadSignature();
  }, [loadSignature]);

  const handleSaveSignature = async (signatureBlob: Blob) => {
    if (!user) {
      setError('User not authenticated');
      return;
    }

    try {
      setError(null);

      // Upload signature to storage
      const fileName = `${cmrId}-${partyType}-${Date.now()}.png`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('cmr-signatures')
        .upload(fileName, signatureBlob, {
          contentType: 'image/png',
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Insert signature record
      const { data: signatureData, error: insertError } = await supabase
        .from('cmr_signatures')
        .insert({
          cmr_id: cmrId,
          user_id: user.id,
          storage_path: uploadData.path,
          party_type: partyType,
          signer_name: signerName.trim() || null,
          signer_role: signerRole.trim() || null,
          signer_email: signerEmail.trim() || null,
        })
        .select()
        .single();

      if (insertError) {
        // Clean up uploaded file if insert fails
        await supabase.storage.from('cmr-signatures').remove([uploadData.path]);
        throw insertError;
      }

      // For consignee signature, update final status
      if (partyType === 'consignee') {
        await performCmrAction({
          cmrId,
          userId: user.id,
          type: 'delivery_end',
        });
      }

      // Get signed URL
      const { data: urlData } = await supabase.storage
        .from('cmr-signatures')
        .createSignedUrl(uploadData.path, 3600);

      if (urlData) {
        setSignature({
          ...signatureData,
          url: urlData.signedUrl,
        });
      }

      // Notify parent to refresh
      if (onSignatureAdded) {
        onSignatureAdded();
      }
    } catch (err) {
      console.error('Save signature error:', err);
      setError(err instanceof Error ? err.message : 'Failed to save signature');
      throw err;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{config.title}</CardTitle>
            <CardDescription>{config.description}</CardDescription>
          </div>
          {signature && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              <span className="text-sm font-medium">Signed</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">Loading signature...</p>
          </div>
        ) : signature ? (
          <div className="space-y-3">
            {(signature.signer_name || signature.signer_role || signature.signer_email) && (
              <div className="text-sm space-y-1">
                {signature.signer_name && (
                  <p>
                    <span className="font-medium">Signer:</span> {signature.signer_name}
                  </p>
                )}
                {signature.signer_role && (
                  <p>
                    <span className="font-medium">Role:</span> {signature.signer_role}
                  </p>
                )}
                {signature.signer_email && (
                  <p>
                    <span className="font-medium">Email:</span> {signature.signer_email}
                  </p>
                )}
              </div>
            )}
            <div className="rounded-lg border bg-white p-4">
              <Image
                src={signature.url}
                alt={`${config.title}`}
                className="w-full max-w-md mx-auto"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Signed on {new Date(signature.created_at).toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {config.message}
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor={`${partyType}-name`}>Signer Name (Optional)</Label>
                <Input
                  id={`${partyType}-name`}
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  placeholder={config.namePlaceholder}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`${partyType}-role`}>Role (Optional)</Label>
                <Input
                  id={`${partyType}-role`}
                  value={signerRole}
                  onChange={(e) => setSignerRole(e.target.value)}
                  placeholder={config.rolePlaceholder}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`${partyType}-email`}>Email (Optional)</Label>
              <Input
                id={`${partyType}-email`}
                type="email"
                value={signerEmail}
                onChange={(e) => setSignerEmail(e.target.value)}
                placeholder={config.emailPlaceholder}
              />
            </div>

            <SignaturePad onSave={handleSaveSignature} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
