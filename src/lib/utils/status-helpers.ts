/**
 * Status Helpers
 *
 * Utilities for handling CMR document statuses
 */

export type CmrStatus =
  | 'draft'
  | 'ready_to_load'
  | 'loading'
  | 'in_transit'
  | 'ready_to_deliver'
  | 'completed'
  | 'completed_with_reserves';

export const IN_PROGRESS_STATUSES: CmrStatus[] = [
  'draft',
  'ready_to_load',
  'loading',
  'in_transit',
  'ready_to_deliver',
];

export const COMPLETED_STATUSES: CmrStatus[] = [
  'completed',
  'completed_with_reserves',
];

/**
 * Get human-readable label for status
 */
export function getStatusLabel(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Get badge variant for status
 */
export function getStatusVariant(status: string): 'default' | 'secondary' | 'outline' | 'destructive' {
  if (status === 'completed' || status === 'completed_with_reserves') {
    return 'default'; // Green
  }
  if (status === 'in_transit' || status === 'loading') {
    return 'outline'; // Blue outline
  }
  return 'secondary'; // Gray
}

/**
 * Get custom color for status badge
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'completed_with_reserves':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'in_transit':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'loading':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'ready_to_load':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'ready_to_deliver':
      return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    case 'draft':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

/**
 * Check if status is completed
 */
export function isCompleted(status: string): boolean {
  return COMPLETED_STATUSES.includes(status as CmrStatus);
}

/**
 * Check if status is in progress
 */
export function isInProgress(status: string): boolean {
  return IN_PROGRESS_STATUSES.includes(status as CmrStatus);
}
