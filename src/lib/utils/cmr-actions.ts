
import { supabase } from '@/lib/supabaseClient';

export type CmrActionType =
  | 'loading_start'
  | 'loading_end'
  | 'delivery_start'
  | 'delivery_end';

interface PerformCmrActionOptions {
  cmrId: string;
  userId: string;
  type: CmrActionType;
}

/**
 * Action métier générique : crée un cmr_event + applique les effets de bord
 * (changement de statut, vérifs, etc.)
 */
export async function performCmrAction({
  cmrId,
  userId,
  type,
}: PerformCmrActionOptions) {
  switch (type) {
    case 'loading_start':
      return startLoading({ cmrId, userId });
    case 'loading_end':
      return endLoading({ cmrId, userId });
    case 'delivery_start':
      return startDelivery({ cmrId, userId });
    case 'delivery_end':
      return completeDelivery({ cmrId, userId });
    default:
      throw new Error(`Unknown CMR action type: ${type}`);
  }
}

// Tu peux mettre ces helpers privés dans le même fichier :

async function startLoading({ cmrId, userId }: { cmrId: string; userId: string }) {
  // event
  const { error: eventError } = await supabase.from('cmr_events').insert({
    cmr_id: cmrId,
    user_id: userId,
    type: 'loading_start',
    metadata: {},
  });
  if (eventError) throw eventError;

  // statut
  const { error: statusError } = await supabase
    .from('cmr_documents')
    .update({ status: 'loading' })
    .eq('id', cmrId);
  if (statusError) throw statusError;
}

async function endLoading({ cmrId, userId }: { cmrId: string; userId: string }) {
  // Vérif côté BDD : signature shipper présente ?
  const { data: sigs, error: sigError } = await supabase
    .from('cmr_signatures')
    .select('id')
    .eq('cmr_id', cmrId)
    .eq('party_type', 'shipper')
    .limit(1);

  if (sigError) throw sigError;
  if (!sigs || sigs.length === 0) {
    throw new Error('Cannot end loading without shipper signature');
  }

  const { error: eventError } = await supabase.from('cmr_events').insert({
    cmr_id: cmrId,
    user_id: userId,
    type: 'loading_end',
    metadata: {},
  });
  if (eventError) throw eventError;

  const { error: statusError } = await supabase
    .from('cmr_documents')
    .update({ status: 'in_transit' })
    .eq('id', cmrId);
  if (statusError) throw statusError;
}

async function startDelivery({ cmrId, userId }: { cmrId: string; userId: string }) {
  const { error: eventError } = await supabase.from('cmr_events').insert({
    cmr_id: cmrId,
    user_id: userId,
    type: 'delivery_start',
    metadata: {},
  });
  if (eventError) throw eventError;

  const { error: statusError } = await supabase
    .from('cmr_documents')
    .update({ status: 'ready_to_deliver' })
    .eq('id', cmrId);
  if (statusError) throw statusError;
}

async function completeDelivery({
  cmrId,
  userId,
}: {
  cmrId: string;
  userId: string;
}) {
  // 1) réserves ?
  const { data: reserves, error: reservesError } = await supabase
    .from('cmr_reserves')
    .select('id')
    .eq('cmr_id', cmrId)
    .limit(1);

  if (reservesError) throw reservesError;

  const hasReserves = !!reserves?.length;
  const finalStatus = hasReserves ? 'completed_with_reserves' : 'completed';

  // 2) statut cmr_documents
  const { error: statusError } = await supabase
    .from('cmr_documents')
    .update({ status: finalStatus })
    .eq('id', cmrId);
  if (statusError) throw statusError;

  // 3) event delivery_end
  const { error: eventError } = await supabase.from('cmr_events').insert({
    cmr_id: cmrId,
    user_id: userId,
    type: 'delivery_end',
    metadata: {
      status: finalStatus,
      has_reserves: hasReserves,
    },
  });
  if (eventError) throw eventError;
}
