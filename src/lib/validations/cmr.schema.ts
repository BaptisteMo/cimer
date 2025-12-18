import { z } from 'zod';


// Helper pour parse un champ <input> optionnel vers un number positif ou undefined
const optionalPositiveNumberFromInput = z
  .preprocess((value) => {
    // Cas les plus fréquents : champ vide ou non rempli → on retourne undefined
    if (value === '' || value === null || value === undefined) {
      return undefined;
    }

    // Si c'est déjà un nombre (valueAsNumber: true par exemple)
    if (typeof value === 'number') {
      // Champ vide + valueAsNumber → NaN → on considère "pas rempli"
      if (Number.isNaN(value)) {
        return undefined;
      }
      return value;
    }

    // Si ça vient d'un input RHF, c'est souvent une string
    if (typeof value === 'string') {
      const normalized = value.replace(',', '.').trim();
      if (normalized === '') return undefined;

      const parsed = Number(normalized);
      // Si ça ne parse pas → on laisse Zod gueuler (NaN)
      if (Number.isNaN(parsed)) {
        return parsed; // NaN → z.number() va gueuler, c'est ok
      }
      return parsed;
    }

    // Si c'est autre chose, on renvoie tel quel (Zod décidera)
    return value;
  }, z.number().positive().optional())
  .optional();


/**
 * CMR Document Validation Schema
 *
 * This schema defines validation rules for creating and updating CMR documents.
 *
 * REQUIRED FIELDS (Step 1 - Minimal info to create/start a CMR):
 * - Shipper & Consignee information (names, addresses)
 * - Loading & Delivery locations
 * - Goods description, packages count, weight
 * - Vehicle selection
 * - Loading date
 *
 * OPTIONAL FIELDS (filled progressively by dispatcher or driver):
 * - Principal & Delivery Carrier info
 * - Dangerous goods (ADR) details
 * - Temperature control requirements
 * - Financial info (COD, freight)
 * - Pallets management
 * - Instructions & attached documents
 * - Detailed timestamps
 *
 * Based on the CMR specification in docs/cimer.md
 */
export const cmrSchema = z.object({
  // ============================================================================
  // BASIC CMR INFORMATION
  // ============================================================================

  /** CMR number (can be auto-generated or manual) */
  cmr_number: z.string().max(50).optional(),

  /** Whether this is an international transport (crosses borders) */
  is_international: z.boolean().optional(),

  // ============================================================================
  // PARTIES - SHIPPER (Expéditeur)
  // Required: The sender/shipper of the goods
  // ============================================================================

  /** Shipper company/person name (required) */
  shipper_name: z.string().min(1, 'Shipper name is required').max(200),

  /** Shipper full address (required) */
  shipper_address: z.string().min(1, 'Shipper address is required').max(500),

  // ============================================================================
  // PARTIES - CONSIGNEE (Destinataire)
  // Required: The recipient of the goods
  // ============================================================================

  /** Consignee company/person name (required) */
  consignee_name: z.string().min(1, 'Consignee name is required').max(200),

  /** Consignee full address (required) */
  consignee_address: z.string().min(1, 'Consignee address is required').max(500),

  // ============================================================================
  // PARTIES - PRINCIPAL (Donneur d'ordre)
  // Optional: The client/entity ordering the transport (if different from shipper)
  // ============================================================================

  /** Principal (ordering party) name */
  principal_name: z.string().max(200).optional(),

  /** Principal full address */
  principal_address: z.string().max(500).optional(),

  // ============================================================================
  // PARTIES - DELIVERY CARRIER (Transporteur successif)
  // Optional: When transport involves multiple carriers
  // ============================================================================

  /** Name of the successive/delivery carrier */
  delivery_carrier_name: z.string().max(200).optional(),

  /** Address of the successive/delivery carrier */
  delivery_carrier_address: z.string().max(500).optional(),

  // ============================================================================
  // GOODS INFORMATION
  // Required: Description, packaging, quantities
  // ============================================================================

  /** Detailed description of goods being transported (required) */
  goods_description: z.string().min(1, 'Goods description is required').max(1000),

  /** Type of packaging (pallets, boxes, bulk, etc.) */
  packaging_type: z.string().max(100).optional(),

  /** Marks and numbers on packages for identification */
  goods_marks_numbers: z.string().max(500).optional(),

  /** Number of packages/units (required, must be positive integer) */
  packages_count: z.number()
    .int('Must be a whole number')
    .positive('Must be greater than 0')
    .min(1, 'At least 1 package required'),

  /** Total weight in kilograms (required, must be positive) */
  weight_kg: z.number()
    .positive('Must be greater than 0')
    .min(0.1, 'Weight must be at least 0.1 kg'),

  /** Declared value of goods (for insurance/liability) */
  declared_value: optionalPositiveNumberFromInput,

  /** Currency for declared value (e.g., EUR, USD) */
  declared_value_currency: z.string().max(3).optional(),

  // ============================================================================
  // TRANSPORT DETAILS - LOCATIONS
  // Required: Where goods are loaded and delivered
  // ============================================================================

  /** Loading location address (required, can default to shipper_address) */
  loading_place: z.string().min(1, 'Loading place is required').max(200),

  /** Delivery location address (required, can default to consignee_address) */
  delivery_place: z.string().min(1, 'Delivery place is required').max(200),

  // ============================================================================
  // TRANSPORT DETAILS - TIMESTAMPS
  // ============================================================================

  /** Planned/requested loading date (required for planning) */
  loading_date: z.string().min(1, 'Loading date is required'),

  /** Requested/expected delivery date and time */
  requested_delivery_at: z.string().optional(),

  /** Actual arrival time at loading location */
  loading_arrival_at: z.string().optional(),

  /** Actual departure time from loading location */
  loading_departure_at: z.string().optional(),

  /** Actual arrival time at delivery location */
  delivery_arrival_at: z.string().optional(),

  /** Actual departure time from delivery location */
  delivery_departure_at: z.string().optional(),

  // ============================================================================
  // TRANSPORT DETAILS - EXTRA SERVICES
  // ============================================================================

  /** Additional services at loading (e.g., tail-lift, crane) */
  loading_extra_services: z.string().max(500).optional(),

  /** Additional services at delivery */
  delivery_extra_services: z.string().max(500).optional(),

  // ============================================================================
  // DANGEROUS GOODS (ADR)
  // For transporting hazardous materials
  // ============================================================================

  /** Whether cargo contains dangerous goods requiring ADR compliance */
  is_dangerous_goods: z.boolean().optional(),

  /** ADR class (e.g., 3 for flammable liquids, 9 for misc.) */
  dangerous_goods_class: z.string().max(10).optional(),

  /** UN number for dangerous goods (e.g., UN1203) */
  dangerous_goods_un_number: z.string().max(20).optional(),

  /** ADR letter/code (e.g., F for flammable) */
  dangerous_goods_adr_letter: z.string().max(5).optional(),

  // ============================================================================
  // TEMPERATURE CONTROL
  // For refrigerated/frozen transport
  // ============================================================================

  /** Whether transport requires temperature control */
  is_controlled_temperature: z.boolean().optional(),

  /** Minimum temperature in Celsius */
  temperature_min: z.number().optional(),

  /** Maximum temperature in Celsius */
  temperature_max: z.number().optional(),

  // ============================================================================
  // FINANCIAL INFORMATION
  // ============================================================================

  /** Cash on delivery amount (if consignee must pay on receipt) */
  cash_on_delivery_amount: optionalPositiveNumberFromInput,

  /** Currency for COD amount */
  cash_on_delivery_currency: z.string().max(3).optional(),

  /** Total freight/transport cost */
  freight_total_amount: optionalPositiveNumberFromInput,

  /** Currency for freight (defaults to EUR) */
  freight_currency: z.string().max(3).optional(),

  /** Freight payment terms (e.g., prepaid, collect, third-party) */
  freight_terms: z.string().max(100).optional(),

  // ============================================================================
  // PALLETS MANAGEMENT
  // Tracking of pallet exchanges (especially European pallets)
  // ============================================================================

  /** Number of 80x120cm pallets */
  pallets_80_120: optionalPositiveNumberFromInput,

  /** Number of 100x120cm pallets */
  pallets_100_120: optionalPositiveNumberFromInput,

  /** Number of Euro pallets (80x120 standardized) */
  pallets_europe: optionalPositiveNumberFromInput,

  /** Number of other/custom sized pallets */
  pallets_others: optionalPositiveNumberFromInput,

  /** Number of bacs/containers */
  pallets_bacs: optionalPositiveNumberFromInput,

  /** Number of rolls/reels */
  pallets_rolls: optionalPositiveNumberFromInput,

  /** Origin/ownership of pallets (e.g., "CHEP", "LPR", "propriétaire") */
  pallets_origin: z.string().max(100).optional(),

  /** Pallets loaded from shipper */
  pallets_loaded_at_shipper: z.number().int().nonnegative().optional(),

  /** Pallets returned to shipper (exchange) */
  pallets_returned_to_shipper: z.number().int().nonnegative().optional(),

  /** Pallets delivered to consignee */
  pallets_delivered_to_consignee: z.number().int().nonnegative().optional(),

  /** Pallets returned by consignee (exchange) */
  pallets_returned_by_consignee: z.number().int().nonnegative().optional(),

  /** Where remaining pallets were deposited */
  pallets_deposited_at: z.string().max(200).optional(),

  /** Final pallet balance (text summary) */
  pallets_final_balance: z.string().max(500).optional(),

  // ============================================================================
  // INSTRUCTIONS & DOCUMENTS
  // ============================================================================

  /** Special instructions for carrier/driver */
  instructions: z.string().max(1000).optional(),

  /** Customs-related instructions (for international transport) */
  customs_instructions: z.string().max(1000).optional(),

  /** List/reference of attached supporting documents */
  attached_documents: z.string().max(500).optional(),

  // ============================================================================
  // VEHICLE SELECTION
  // Required: Which vehicle/truck is assigned to this CMR
  // ============================================================================

  /** UUID of the vehicle from user's fleet (required) */
  vehicle_id: z.string()
    .min(1, 'Please select a vehicle')
    .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, 'Invalid vehicle selected'),
});

/**
 * TypeScript type inferred from the CMR schema
 * Use this type for form values in React Hook Form
 */
export type CmrInput = z.infer<typeof cmrSchema>;

/**
 * Helper type for partial updates (all fields optional)
 * Useful for PATCH operations
 */
export type CmrUpdateInput = Partial<CmrInput>;
