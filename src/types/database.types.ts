export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      cmr_documents: {
        Row: {
          archived: boolean
          archived_at: string | null
          attached_documents: string | null
          cash_on_delivery_amount: number | null
          cash_on_delivery_currency: string | null
          cmr_number: string | null
          consignee_address: string | null
          consignee_name: string
          created_at: string
          customs_instructions: string | null
          dangerous_goods_adr_letter: string | null
          dangerous_goods_class: string | null
          dangerous_goods_un_number: string | null
          declared_value: number | null
          declared_value_currency: string | null
          delivery_arrival_at: string | null
          delivery_carrier_address: string | null
          delivery_carrier_name: string | null
          delivery_departure_at: string | null
          delivery_extra_services: string | null
          delivery_place: string
          freight_currency: string
          freight_terms: string | null
          freight_total_amount: number | null
          goods_description: string | null
          goods_marks_numbers: string | null
          id: string
          instructions: string | null
          is_controlled_temperature: boolean
          is_dangerous_goods: boolean
          is_international: boolean
          loading_arrival_at: string | null
          loading_date: string
          loading_departure_at: string | null
          loading_extra_services: string | null
          loading_place: string
          packages_count: number | null
          packaging_type: string | null
          pallets_100_120: number | null
          pallets_80_120: number | null
          pallets_bacs: number | null
          pallets_delivered_to_consignee: number | null
          pallets_deposited_at: string | null
          pallets_europe: number | null
          pallets_final_balance: string | null
          pallets_loaded_at_shipper: number | null
          pallets_origin: string | null
          pallets_others: number | null
          pallets_returned_by_consignee: number | null
          pallets_returned_to_shipper: number | null
          pallets_rolls: number | null
          principal_address: string | null
          principal_name: string | null
          requested_delivery_at: string | null
          shipper_address: string | null
          shipper_name: string
          status: string
          temperature_max: number | null
          temperature_min: number | null
          updated_at: string
          user_id: string
          vehicle_id: string
          vehicle_plate: string | null
          weight_kg: number | null
        }
        Insert: {
          archived?: boolean
          archived_at?: string | null
          attached_documents?: string | null
          cash_on_delivery_amount?: number | null
          cash_on_delivery_currency?: string | null
          cmr_number?: string | null
          consignee_address?: string | null
          consignee_name: string
          created_at?: string
          customs_instructions?: string | null
          dangerous_goods_adr_letter?: string | null
          dangerous_goods_class?: string | null
          dangerous_goods_un_number?: string | null
          declared_value?: number | null
          declared_value_currency?: string | null
          delivery_arrival_at?: string | null
          delivery_carrier_address?: string | null
          delivery_carrier_name?: string | null
          delivery_departure_at?: string | null
          delivery_extra_services?: string | null
          delivery_place: string
          freight_currency?: string
          freight_terms?: string | null
          freight_total_amount?: number | null
          goods_description?: string | null
          goods_marks_numbers?: string | null
          id?: string
          instructions?: string | null
          is_controlled_temperature?: boolean
          is_dangerous_goods?: boolean
          is_international?: boolean
          loading_arrival_at?: string | null
          loading_date: string
          loading_departure_at?: string | null
          loading_extra_services?: string | null
          loading_place: string
          packages_count?: number | null
          packaging_type?: string | null
          pallets_100_120?: number | null
          pallets_80_120?: number | null
          pallets_bacs?: number | null
          pallets_delivered_to_consignee?: number | null
          pallets_deposited_at?: string | null
          pallets_europe?: number | null
          pallets_final_balance?: string | null
          pallets_loaded_at_shipper?: number | null
          pallets_origin?: string | null
          pallets_others?: number | null
          pallets_returned_by_consignee?: number | null
          pallets_returned_to_shipper?: number | null
          pallets_rolls?: number | null
          principal_address?: string | null
          principal_name?: string | null
          requested_delivery_at?: string | null
          shipper_address?: string | null
          shipper_name: string
          status?: string
          temperature_max?: number | null
          temperature_min?: number | null
          updated_at?: string
          user_id: string
          vehicle_id: string
          vehicle_plate?: string | null
          weight_kg?: number | null
        }
        Update: {
          archived?: boolean
          archived_at?: string | null
          attached_documents?: string | null
          cash_on_delivery_amount?: number | null
          cash_on_delivery_currency?: string | null
          cmr_number?: string | null
          consignee_address?: string | null
          consignee_name?: string
          created_at?: string
          customs_instructions?: string | null
          dangerous_goods_adr_letter?: string | null
          dangerous_goods_class?: string | null
          dangerous_goods_un_number?: string | null
          declared_value?: number | null
          declared_value_currency?: string | null
          delivery_arrival_at?: string | null
          delivery_carrier_address?: string | null
          delivery_carrier_name?: string | null
          delivery_departure_at?: string | null
          delivery_extra_services?: string | null
          delivery_place?: string
          freight_currency?: string
          freight_terms?: string | null
          freight_total_amount?: number | null
          goods_description?: string | null
          goods_marks_numbers?: string | null
          id?: string
          instructions?: string | null
          is_controlled_temperature?: boolean
          is_dangerous_goods?: boolean
          is_international?: boolean
          loading_arrival_at?: string | null
          loading_date?: string
          loading_departure_at?: string | null
          loading_extra_services?: string | null
          loading_place?: string
          packages_count?: number | null
          packaging_type?: string | null
          pallets_100_120?: number | null
          pallets_80_120?: number | null
          pallets_bacs?: number | null
          pallets_delivered_to_consignee?: number | null
          pallets_deposited_at?: string | null
          pallets_europe?: number | null
          pallets_final_balance?: string | null
          pallets_loaded_at_shipper?: number | null
          pallets_origin?: string | null
          pallets_others?: number | null
          pallets_returned_by_consignee?: number | null
          pallets_returned_to_shipper?: number | null
          pallets_rolls?: number | null
          principal_address?: string | null
          principal_name?: string | null
          requested_delivery_at?: string | null
          shipper_address?: string | null
          shipper_name?: string
          status?: string
          temperature_max?: number | null
          temperature_min?: number | null
          updated_at?: string
          user_id?: string
          vehicle_id?: string
          vehicle_plate?: string | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cmr_documents_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      cmr_events: {
        Row: {
          cmr_id: string
          created_at: string
          id: string
          metadata: Json | null
          type: string
          user_id: string
        }
        Insert: {
          cmr_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          type: string
          user_id: string
        }
        Update: {
          cmr_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cmr_events_cmr_id_fkey"
            columns: ["cmr_id"]
            isOneToOne: false
            referencedRelation: "cmr_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      cmr_photos: {
        Row: {
          cmr_id: string
          created_at: string
          id: string
          storage_path: string
          user_id: string
        }
        Insert: {
          cmr_id: string
          created_at?: string
          id?: string
          storage_path: string
          user_id: string
        }
        Update: {
          cmr_id?: string
          created_at?: string
          id?: string
          storage_path?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cmr_photos_cmr_id_fkey"
            columns: ["cmr_id"]
            isOneToOne: false
            referencedRelation: "cmr_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      cmr_reserves: {
        Row: {
          cmr_id: string
          comment: string | null
          created_at: string
          id: string
          photo_storage_path: string | null
          reserve_type: string
          side: string
          user_id: string
        }
        Insert: {
          cmr_id: string
          comment?: string | null
          created_at?: string
          id?: string
          photo_storage_path?: string | null
          reserve_type: string
          side: string
          user_id: string
        }
        Update: {
          cmr_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          photo_storage_path?: string | null
          reserve_type?: string
          side?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cmr_reserves_cmr_id_fkey"
            columns: ["cmr_id"]
            isOneToOne: false
            referencedRelation: "cmr_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      cmr_signatures: {
        Row: {
          cmr_id: string
          created_at: string
          id: string
          party_type: string
          signer_email: string | null
          signer_name: string | null
          signer_role: string | null
          storage_path: string
          user_id: string
        }
        Insert: {
          cmr_id: string
          created_at?: string
          id?: string
          party_type: string
          signer_email?: string | null
          signer_name?: string | null
          signer_role?: string | null
          storage_path: string
          user_id: string
        }
        Update: {
          cmr_id?: string
          created_at?: string
          id?: string
          party_type?: string
          signer_email?: string | null
          signer_name?: string | null
          signer_role?: string | null
          storage_path?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cmr_signatures_cmr_id_fkey"
            columns: ["cmr_id"]
            isOneToOne: false
            referencedRelation: "cmr_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          billing_adress: string | null
          billing_email: string | null
          company_address: string
          company_naf: string | null
          company_name: string | null
          company_siren: string | null
          company_siret: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          tax_id: string | null
        }
        Insert: {
          billing_adress?: string | null
          billing_email?: string | null
          company_address: string
          company_naf?: string | null
          company_name?: string | null
          company_siren?: string | null
          company_siret?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          tax_id?: string | null
        }
        Update: {
          billing_adress?: string | null
          billing_email?: string | null
          company_address?: string
          company_naf?: string | null
          company_name?: string | null
          company_siren?: string | null
          company_siret?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          tax_id?: string | null
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          created_at: string
          id: string
          photo_storage_path: string | null
          plate: string
          type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          photo_storage_path?: string | null
          plate: string
          type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          photo_storage_path?: string | null
          plate?: string
          type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
