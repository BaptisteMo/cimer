-- Add billing and contact fields to profiles table
-- This migration adds optional fields for billing information and phone contact

-- Add phone column
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Add billing_address column
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS billing_address TEXT;

-- Add tax_id column (VAT number or tax identification)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS tax_id TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.profiles.phone IS 'User contact phone number';
COMMENT ON COLUMN public.profiles.billing_address IS 'Billing address (optional, defaults to company_address if not set)';
COMMENT ON COLUMN public.profiles.tax_id IS 'Tax ID or VAT number for invoicing';
