import { supabase } from '@/lib/supabaseClient';

/**
 * @deprecated This function is obsolete. Use ShipperSignatureSection or ConsigneeSignatureSection components instead.
 *
 * They handle signature upload with proper party_type, signer_name, signer_role fields
 * and implement the correct status update logic (shipper vs consignee).
 */
export async function uploadCmrSignature(
  _signatureBlob: Blob,
  _cmrId: string,
  _userId: string
) {
  throw new Error('uploadCmrSignature is deprecated. Use ShipperSignatureSection or ConsigneeSignatureSection components instead.');
}

/**
 * Fetch signature for a CMR document by party type
 *
 * @param cmrId - The CMR document ID
 * @param partyType - Optional: 'shipper' or 'consignee'. If not provided, returns the most recent signature.
 * @returns The signature record with signed URL, or null if not found
 */
export async function fetchCmrSignature(
  cmrId: string,
  partyType?: 'shipper' | 'consignee'
) {
  try {
    let query = supabase
      .from('cmr_signatures')
      .select('*')
      .eq('cmr_id', cmrId);

    // Filter by party type if specified
    if (partyType) {
      query = query.eq('party_type', partyType);
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(); // Use maybeSingle() instead of single() to avoid error when no rows

    if (error) {
      console.error('Fetch signature error:', error);
      throw new Error(`Failed to fetch signature: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    // Get signed URL (more secure than public URL)
    const { data: urlData } = await supabase.storage
      .from('cmr-signatures')
      .createSignedUrl(data.storage_path, 3600); // 1 hour expiry

    if (!urlData) {
      console.error('Failed to create signed URL for:', data.storage_path);
      return {
        ...data,
        url: null,
      };
    }

    return {
      ...data,
      url: urlData.signedUrl,
    };
  } catch (error) {
    console.error('Fetch signature error:', error);
    throw error;
  }
}
