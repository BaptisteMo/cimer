# CMR Digital – Extended Supabase Database Schema

This file contains the complete SQL schema for the CMR Digital Extended MVP, including table definitions and Row Level Security (RLS) policies.

**Instructions:**
1. Copy each section into the Supabase SQL Editor
2. Run the migrations in order (tables first, then RLS policies)
3. Verify that RLS is enabled on all tables

---

## 1. Tables

### 1.1 Profiles Table

Stores extended user profile information (extends Supabase auth.users).

```sql
-- ============================================
-- TABLE: profiles
-- ============================================

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Basic information
  full_name TEXT NOT NULL,
  company_name TEXT NOT NULL,
  company_address TEXT NOT NULL,

  -- Contact information (optional)
  phone TEXT,
  billing_email TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS profiles_id_idx ON profiles(id);

-- Comments
COMMENT ON TABLE profiles IS 'Extended user profile information';
COMMENT ON COLUMN profiles.id IS 'References auth.users.id';
COMMENT ON COLUMN profiles.full_name IS 'User full name (driver name)';
COMMENT ON COLUMN profiles.company_name IS 'Company or business name';
COMMENT ON COLUMN profiles.company_address IS 'Company address';
COMMENT ON COLUMN profiles.phone IS 'Optional phone number';
COMMENT ON COLUMN profiles.billing_email IS 'Optional billing email (may differ from auth email)';
```

---

### 1.2 Vehicles Table

Stores vehicles owned by users for CMR transport assignments.

```sql
-- ============================================
-- TABLE: vehicles
-- ============================================

CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Vehicle information
  plate TEXT NOT NULL,
  type TEXT, -- Optional: "Truck", "Van", "Semi-trailer", etc.
  photo_storage_path TEXT, -- Optional vehicle photo

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Constraints
  CONSTRAINT unique_user_plate UNIQUE(user_id, plate)
);

-- Indexes
CREATE INDEX IF NOT EXISTS vehicles_user_id_idx ON vehicles(user_id);
CREATE INDEX IF NOT EXISTS vehicles_plate_idx ON vehicles(plate);

-- Comments
COMMENT ON TABLE vehicles IS 'Vehicles owned by users for transport operations';
COMMENT ON COLUMN vehicles.user_id IS 'Owner of the vehicle';
COMMENT ON COLUMN vehicles.plate IS 'Vehicle license plate number';
COMMENT ON COLUMN vehicles.type IS 'Optional vehicle type or category';
COMMENT ON COLUMN vehicles.photo_storage_path IS 'Path to vehicle photo in Storage';
```

---

### 1.3 CMR Documents Table

Main table storing CMR transport document information with extended lifecycle support.

```sql
-- ============================================
-- TABLE: cmr_documents
-- ============================================

CREATE TABLE IF NOT EXISTS cmr_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,

  -- Shipper information
  shipper_name TEXT NOT NULL,
  shipper_address TEXT NOT NULL,

  -- Consignee information
  consignee_name TEXT NOT NULL,
  consignee_address TEXT NOT NULL,

  -- Goods information
  goods_description TEXT NOT NULL,
  packages_count INTEGER NOT NULL CHECK (packages_count > 0),
  weight_kg NUMERIC(10, 2) NOT NULL CHECK (weight_kg > 0),
  packaging_type TEXT, -- Optional: "Pallets", "Boxes", "Bulk", etc.

  -- Location and date
  loading_place TEXT NOT NULL,
  delivery_place TEXT NOT NULL,
  loading_date DATE NOT NULL,

  -- Extended status tracking for full lifecycle
  status TEXT DEFAULT 'ready_to_load' NOT NULL CHECK (status IN (
    'draft',
    'ready_to_load',
    'loading',
    'in_transit',
    'ready_to_deliver',
    'completed',
    'completed_with_reserves'
  )),

  -- Archive status (for soft delete / compliance)
  archived BOOLEAN DEFAULT false NOT NULL,
  archived_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS cmr_documents_user_id_idx ON cmr_documents(user_id);
CREATE INDEX IF NOT EXISTS cmr_documents_vehicle_id_idx ON cmr_documents(vehicle_id);
CREATE INDEX IF NOT EXISTS cmr_documents_status_idx ON cmr_documents(status);
CREATE INDEX IF NOT EXISTS cmr_documents_archived_idx ON cmr_documents(archived);
CREATE INDEX IF NOT EXISTS cmr_documents_loading_date_idx ON cmr_documents(loading_date DESC);
CREATE INDEX IF NOT EXISTS cmr_documents_created_at_idx ON cmr_documents(created_at DESC);

-- Comments
COMMENT ON TABLE cmr_documents IS 'CMR transport documents with full lifecycle tracking';
COMMENT ON COLUMN cmr_documents.user_id IS 'Owner of the CMR (driver or company user)';
COMMENT ON COLUMN cmr_documents.vehicle_id IS 'Vehicle assigned to this transport';
COMMENT ON COLUMN cmr_documents.status IS 'Document lifecycle status';
COMMENT ON COLUMN cmr_documents.archived IS 'Archive status (false = active, true = archived)';
COMMENT ON COLUMN cmr_documents.archived_at IS 'Timestamp when CMR was archived (null if not archived)';
COMMENT ON COLUMN cmr_documents.packages_count IS 'Number of packages/pallets';
COMMENT ON COLUMN cmr_documents.weight_kg IS 'Total weight in kilograms';
COMMENT ON COLUMN cmr_documents.packaging_type IS 'Optional packaging description';
```

---

### 1.4 CMR Events Table

Tracks key events throughout the CMR lifecycle (loading start/end, delivery start, etc.).

```sql
-- ============================================
-- TABLE: cmr_events
-- ============================================

CREATE TABLE IF NOT EXISTS cmr_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cmr_id UUID NOT NULL REFERENCES cmr_documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Event type
  type TEXT NOT NULL CHECK (type IN (
    'loading_start',
    'loading_end',
    'delivery_start',
    'delivery_end',
    'waiting_start_loading',
    'waiting_end_loading',
    'waiting_start_delivery',
    'waiting_end_delivery'
  )),

  -- Optional metadata (geolocation, notes, etc.)
  metadata JSONB,

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS cmr_events_cmr_id_idx ON cmr_events(cmr_id);
CREATE INDEX IF NOT EXISTS cmr_events_user_id_idx ON cmr_events(user_id);
CREATE INDEX IF NOT EXISTS cmr_events_type_idx ON cmr_events(type);
CREATE INDEX IF NOT EXISTS cmr_events_created_at_idx ON cmr_events(created_at DESC);

-- Comments
COMMENT ON TABLE cmr_events IS 'Timeline of key events during CMR lifecycle';
COMMENT ON COLUMN cmr_events.cmr_id IS 'References parent CMR document';
COMMENT ON COLUMN cmr_events.type IS 'Type of event (loading_start, loading_end, etc.)';
COMMENT ON COLUMN cmr_events.metadata IS 'Optional JSON metadata (geolocation, notes, etc.)';
```

---

### 1.5 CMR Reserves Table

Stores reserves (issues/discrepancies) reported during loading or delivery.

```sql
-- ============================================
-- TABLE: cmr_reserves
-- ============================================

CREATE TABLE IF NOT EXISTS cmr_reserves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cmr_id UUID NOT NULL REFERENCES cmr_documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Reserve classification
  side TEXT NOT NULL CHECK (side IN ('loading', 'delivery')),
  reserve_type TEXT NOT NULL, -- e.g., "Damaged packaging", "Missing items", "Quantity discrepancy"

  -- Details
  comment TEXT, -- Optional description or explanation
  photo_storage_path TEXT, -- Optional photo documenting the reserve

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS cmr_reserves_cmr_id_idx ON cmr_reserves(cmr_id);
CREATE INDEX IF NOT EXISTS cmr_reserves_user_id_idx ON cmr_reserves(user_id);
CREATE INDEX IF NOT EXISTS cmr_reserves_side_idx ON cmr_reserves(side);

-- Comments
COMMENT ON TABLE cmr_reserves IS 'Reserves (issues) reported during loading or delivery';
COMMENT ON COLUMN cmr_reserves.cmr_id IS 'References parent CMR document';
COMMENT ON COLUMN cmr_reserves.side IS 'Phase when reserve was created: loading or delivery';
COMMENT ON COLUMN cmr_reserves.reserve_type IS 'Type/category of the reserve';
COMMENT ON COLUMN cmr_reserves.comment IS 'Optional detailed description';
COMMENT ON COLUMN cmr_reserves.photo_storage_path IS 'Path to photo in Storage documenting the reserve';
```

---

### 1.6 CMR Photos Table

Stores references to photos attached to CMR documents (goods, damages, general documentation).

```sql
-- ============================================
-- TABLE: cmr_photos
-- ============================================

CREATE TABLE IF NOT EXISTS cmr_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cmr_id UUID NOT NULL REFERENCES cmr_documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Storage reference
  storage_path TEXT NOT NULL,

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS cmr_photos_cmr_id_idx ON cmr_photos(cmr_id);
CREATE INDEX IF NOT EXISTS cmr_photos_user_id_idx ON cmr_photos(user_id);

-- Comments
COMMENT ON TABLE cmr_photos IS 'Photos attached to CMR documents (goods, damages, etc.)';
COMMENT ON COLUMN cmr_photos.cmr_id IS 'References parent CMR document';
COMMENT ON COLUMN cmr_photos.storage_path IS 'Path to photo in Supabase Storage (cmr-photos bucket)';
```

---

### 1.7 CMR Signatures Table

Stores signatures from both shipper and consignee parties.

```sql
-- ============================================
-- TABLE: cmr_signatures
-- ============================================

CREATE TABLE IF NOT EXISTS cmr_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cmr_id UUID NOT NULL REFERENCES cmr_documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Party identification
  party_type TEXT NOT NULL CHECK (party_type IN ('shipper', 'consignee')),
  signer_name TEXT NOT NULL, -- Name of person who signed
  signer_role TEXT, -- Optional: "Driver", "Warehouse Manager", etc.

  -- Storage reference
  storage_path TEXT NOT NULL,

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Constraint: Only one signature per party type per CMR
  CONSTRAINT unique_cmr_party_signature UNIQUE(cmr_id, party_type)
);

-- Indexes
CREATE INDEX IF NOT EXISTS cmr_signatures_cmr_id_idx ON cmr_signatures(cmr_id);
CREATE INDEX IF NOT EXISTS cmr_signatures_user_id_idx ON cmr_signatures(user_id);
CREATE INDEX IF NOT EXISTS cmr_signatures_party_type_idx ON cmr_signatures(party_type);

-- Comments
COMMENT ON TABLE cmr_signatures IS 'Shipper and consignee signatures for CMR documents';
COMMENT ON COLUMN cmr_signatures.cmr_id IS 'References parent CMR document';
COMMENT ON COLUMN cmr_signatures.party_type IS 'Type of signatory: shipper or consignee';
COMMENT ON COLUMN cmr_signatures.signer_name IS 'Full name of person who signed';
COMMENT ON COLUMN cmr_signatures.signer_role IS 'Optional role or title of signer';
COMMENT ON COLUMN cmr_signatures.storage_path IS 'Path to signature PNG in Supabase Storage (cmr-signatures bucket)';
```

---

### 1.8 Triggers for updated_at

Automatically update the `updated_at` timestamp on relevant tables.

```sql
-- ============================================
-- TRIGGER: update_updated_at
-- ============================================

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to vehicles
DROP TRIGGER IF EXISTS update_vehicles_updated_at ON vehicles;
CREATE TRIGGER update_vehicles_updated_at
  BEFORE UPDATE ON vehicles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to cmr_documents
DROP TRIGGER IF EXISTS update_cmr_documents_updated_at ON cmr_documents;
CREATE TRIGGER update_cmr_documents_updated_at
  BEFORE UPDATE ON cmr_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

## 2. Row Level Security (RLS) Policies

Enable RLS and create policies to ensure users can only access their own data.

### 2.1 Enable RLS on All Tables

```sql
-- ============================================
-- ENABLE RLS
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cmr_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE cmr_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE cmr_reserves ENABLE ROW LEVEL SECURITY;
ALTER TABLE cmr_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE cmr_signatures ENABLE ROW LEVEL SECURITY;
```

---

### 2.2 Profiles Policies

```sql
-- ============================================
-- RLS POLICIES: profiles
-- ============================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users can delete their own profile
CREATE POLICY "Users can delete own profile"
  ON profiles
  FOR DELETE
  TO authenticated
  USING (auth.uid() = id);
```

---

### 2.3 Vehicles Policies

```sql
-- ============================================
-- RLS POLICIES: vehicles
-- ============================================

-- Users can view their own vehicles
CREATE POLICY "Users can view own vehicles"
  ON vehicles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own vehicles
CREATE POLICY "Users can insert own vehicles"
  ON vehicles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own vehicles
CREATE POLICY "Users can update own vehicles"
  ON vehicles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own vehicles
CREATE POLICY "Users can delete own vehicles"
  ON vehicles
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
```

---

### 2.4 CMR Documents Policies

```sql
-- ============================================
-- RLS POLICIES: cmr_documents
-- ============================================

-- Users can view their own CMR documents
CREATE POLICY "Users can view own CMR documents"
  ON cmr_documents
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own CMR documents
CREATE POLICY "Users can insert own CMR documents"
  ON cmr_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own CMR documents
CREATE POLICY "Users can update own CMR documents"
  ON cmr_documents
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own CMR documents
CREATE POLICY "Users can delete own CMR documents"
  ON cmr_documents
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
```

---

### 2.5 CMR Events Policies

```sql
-- ============================================
-- RLS POLICIES: cmr_events
-- ============================================

-- Users can view events for their own CMR documents
CREATE POLICY "Users can view own CMR events"
  ON cmr_events
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert events for their own CMR documents
CREATE POLICY "Users can insert own CMR events"
  ON cmr_events
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own CMR events
CREATE POLICY "Users can update own CMR events"
  ON cmr_events
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own CMR events
CREATE POLICY "Users can delete own CMR events"
  ON cmr_events
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
```

---

### 2.6 CMR Reserves Policies

```sql
-- ============================================
-- RLS POLICIES: cmr_reserves
-- ============================================

-- Users can view reserves for their own CMR documents
CREATE POLICY "Users can view own CMR reserves"
  ON cmr_reserves
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert reserves for their own CMR documents
CREATE POLICY "Users can insert own CMR reserves"
  ON cmr_reserves
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own CMR reserves
CREATE POLICY "Users can update own CMR reserves"
  ON cmr_reserves
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own CMR reserves
CREATE POLICY "Users can delete own CMR reserves"
  ON cmr_reserves
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
```

---

### 2.7 CMR Photos Policies

```sql
-- ============================================
-- RLS POLICIES: cmr_photos
-- ============================================

-- Users can view photos of their own CMR documents
CREATE POLICY "Users can view own CMR photos"
  ON cmr_photos
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert photos to their own CMR documents
CREATE POLICY "Users can insert own CMR photos"
  ON cmr_photos
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own CMR photos
CREATE POLICY "Users can update own CMR photos"
  ON cmr_photos
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own CMR photos
CREATE POLICY "Users can delete own CMR photos"
  ON cmr_photos
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
```

---

### 2.8 CMR Signatures Policies

```sql
-- ============================================
-- RLS POLICIES: cmr_signatures
-- ============================================

-- Users can view signatures of their own CMR documents
CREATE POLICY "Users can view own CMR signatures"
  ON cmr_signatures
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert signatures to their own CMR documents
CREATE POLICY "Users can insert own CMR signatures"
  ON cmr_signatures
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own CMR signatures
CREATE POLICY "Users can update own CMR signatures"
  ON cmr_signatures
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own CMR signatures
CREATE POLICY "Users can delete own CMR signatures"
  ON cmr_signatures
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
```

---

## 3. Storage Buckets Configuration

Create the following buckets in Supabase Storage (via Dashboard or API):

### 3.1 Vehicle Photos Bucket

```
Bucket name: vehicle-photos
Public: true
File size limit: 5 MB
Allowed MIME types: image/jpeg, image/png, image/webp
```

**RLS Policies for `vehicle-photos` bucket:**
```sql
-- Policy name: Authenticated users can upload their vehicle photos

-- Operation: INSERT
-- Policy definition:
(bucket_id = 'vehicle-photos'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])

-- Policy name: Anyone can view vehicle photos
-- Operation: SELECT
-- Policy definition:
bucket_id = 'vehicle-photos'::text
```

---

### 3.2 CMR Photos Bucket

```
Bucket name: cmr-photos
Public: true
File size limit: 10 MB
Allowed MIME types: image/jpeg, image/png, image/webp
```

**RLS Policies for `cmr-photos` bucket:**
```sql
-- Policy name: Authenticated users can upload their CMR photos
-- Operation: INSERT
-- Policy definition:
(bucket_id = 'cmr-photos'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])

-- Policy name: Anyone can view CMR photos
-- Operation: SELECT
-- Policy definition:
bucket_id = 'cmr-photos'::text
```

---

### 3.3 CMR Reserve Photos Bucket

```
Bucket name: cmr-reserve-photos
Public: true
File size limit: 10 MB
Allowed MIME types: image/jpeg, image/png, image/webp
```

**RLS Policies for `cmr-reserve-photos` bucket:**
```sql
-- Policy name: Authenticated users can upload reserve photos
-- Operation: INSERT
-- Policy definition:
(bucket_id = 'cmr-reserve-photos'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])

-- Policy name: Anyone can view reserve photos
-- Operation: SELECT
-- Policy definition:
bucket_id = 'cmr-reserve-photos'::text
```

---

### 3.4 CMR Signatures Bucket

```
Bucket name: cmr-signatures
Public: true
File size limit: 2 MB
Allowed MIME types: image/png
```

**RLS Policies for `cmr-signatures` bucket:**
```sql
-- Policy name: Authenticated users can upload their signatures
-- Operation: INSERT
-- Policy definition:
(bucket_id = 'cmr-signatures'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])

-- Policy name: Anyone can view signatures
-- Operation: SELECT
-- Policy definition:
bucket_id = 'cmr-signatures'::text
```

---

### 3.5 CMR PDFs Bucket (Optional)

```
Bucket name: cmr-pdfs
Public: true
File size limit: 5 MB
Allowed MIME types: application/pdf
```

**RLS Policies for `cmr-pdfs` bucket:**
```sql
-- Policy name: Authenticated users can upload their PDFs
-- Operation: INSERT
-- Policy definition:
(bucket_id = 'cmr-pdfs'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])

-- Policy name: Anyone can view PDFs
-- Operation: SELECT
-- Policy definition:
bucket_id = 'cmr-pdfs'::text
```

---

## 4. Migration Notes

### For Existing Databases

If you have an existing database with the previous schema, run these migrations:

```sql
-- ============================================
-- MIGRATION: Extend existing schema
-- ============================================

-- 1. Extend profiles table
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS company_address TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS billing_email TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Make company_name and full_name NOT NULL if not already
ALTER TABLE profiles
  ALTER COLUMN full_name SET NOT NULL,
  ALTER COLUMN company_name SET NOT NULL;

-- Update existing rows to have company_address
UPDATE profiles SET company_address = '' WHERE company_address IS NULL;
ALTER TABLE profiles ALTER COLUMN company_address SET NOT NULL;

-- 2. Create vehicles table
-- (Use CREATE TABLE IF NOT EXISTS from section 1.2)

-- 3. Extend cmr_documents
ALTER TABLE cmr_documents
  ADD COLUMN IF NOT EXISTS vehicle_id UUID REFERENCES vehicles(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS packaging_type TEXT,
  ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

-- Update status column to support extended statuses
ALTER TABLE cmr_documents
  DROP CONSTRAINT IF EXISTS cmr_documents_status_check;

ALTER TABLE cmr_documents
  ADD CONSTRAINT cmr_documents_status_check
  CHECK (status IN (
    'draft',
    'ready_to_load',
    'loading',
    'in_transit',
    'ready_to_deliver',
    'completed',
    'completed_with_reserves'
  ));

-- Update existing 'signed' status to 'completed'
UPDATE cmr_documents SET status = 'completed' WHERE status = 'signed';

-- Make NOT NULL fields
ALTER TABLE cmr_documents
  ALTER COLUMN shipper_address SET NOT NULL,
  ALTER COLUMN consignee_address SET NOT NULL,
  ALTER COLUMN goods_description SET NOT NULL;

-- Add index for archived field
CREATE INDEX IF NOT EXISTS cmr_documents_archived_idx ON cmr_documents(archived);

-- 4. Create new tables
-- (Use CREATE TABLE IF NOT EXISTS from sections 1.4, 1.5)

-- 5. Extend cmr_signatures
ALTER TABLE cmr_signatures
  ADD COLUMN IF NOT EXISTS party_type TEXT CHECK (party_type IN ('shipper', 'consignee')),
  ADD COLUMN IF NOT EXISTS signer_name TEXT,
  ADD COLUMN IF NOT EXISTS signer_role TEXT;

-- Update existing signatures to be 'consignee' type
UPDATE cmr_signatures SET party_type = 'consignee' WHERE party_type IS NULL;
ALTER TABLE cmr_signatures ALTER COLUMN party_type SET NOT NULL;

-- Add unique constraint
ALTER TABLE cmr_signatures
  ADD CONSTRAINT unique_cmr_party_signature UNIQUE(cmr_id, party_type);

-- 6. Add RLS policies for new tables
-- (Run policies from section 2 for vehicles, cmr_events, cmr_reserves)

-- 7. Create storage buckets
-- (Create via Supabase Dashboard as described in section 3)
```

---

## 5. Verification Queries

Run these queries after setup to verify everything is working:

```sql
-- Check if all tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'profiles',
    'vehicles',
    'cmr_documents',
    'cmr_events',
    'cmr_reserves',
    'cmr_photos',
    'cmr_signatures'
  )
ORDER BY table_name;

-- Check if RLS is enabled on all tables
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'profiles',
    'vehicles',
    'cmr_documents',
    'cmr_events',
    'cmr_reserves',
    'cmr_photos',
    'cmr_signatures'
  )
ORDER BY tablename;

-- List all policies
SELECT tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Count policies per table (should be 4 each: SELECT, INSERT, UPDATE, DELETE)
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- Check CMR status values
SELECT DISTINCT status, COUNT(*) as count
FROM cmr_documents
GROUP BY status
ORDER BY status;

-- Check signature party types
SELECT DISTINCT party_type, COUNT(*) as count
FROM cmr_signatures
GROUP BY party_type
ORDER BY party_type;
```

---

## 6. Sample Data (Optional for Testing)

```sql
-- Insert a test profile
INSERT INTO profiles (id, full_name, company_name, company_address, phone)
VALUES (
  'your-user-id',
  'Jean Dupont',
  'Transport Dupont SARL',
  '15 Rue de la Logistique, 75001 Paris, France',
  '+33 6 12 34 56 78'
)
ON CONFLICT (id) DO NOTHING;

-- Insert a test vehicle
INSERT INTO vehicles (user_id, plate, type)
VALUES (
  'your-user-id',
  'AB-123-CD',
  'Semi-trailer'
);

-- Get the vehicle_id for use in CMR
-- (Replace in next query)

-- Insert a test CMR document
INSERT INTO cmr_documents (
  user_id,
  vehicle_id,
  shipper_name,
  shipper_address,
  consignee_name,
  consignee_address,
  goods_description,
  packages_count,
  weight_kg,
  packaging_type,
  loading_place,
  delivery_place,
  loading_date,
  status
) VALUES (
  'your-user-id',
  'vehicle-uuid-here',
  'Expéditeur SA',
  '10 Avenue de l\'Export, 69001 Lyon, France',
  'Destinataire GmbH',
  '25 Hauptstraße, 10115 Berlin, Germany',
  'Electronics - Smartphones and tablets',
  48,
  1450.75,
  'Pallets',
  'Lyon, France',
  'Berlin, Germany',
  '2025-01-20',
  'ready_to_load'
);

-- Insert a loading event
INSERT INTO cmr_events (cmr_id, user_id, type)
VALUES (
  'cmr-uuid-here',
  'your-user-id',
  'loading_start'
);

-- Insert a loading reserve
INSERT INTO cmr_reserves (cmr_id, user_id, side, reserve_type, comment)
VALUES (
  'cmr-uuid-here',
  'your-user-id',
  'loading',
  'Damaged packaging',
  'Box #12 has visible water damage on one corner'
);
```

---

## 7. TypeScript Type Generation

After applying the schema, generate TypeScript types:

```bash
# Install Supabase CLI if needed
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Generate types
supabase gen types typescript --project-id your-project-ref > src/types/database.types.ts
```

Or use the Supabase Dashboard:
- Go to Settings → API → "Generate Types"
- Copy and paste into `src/types/database.types.ts`

---

## 8. Schema Summary

| Table | Purpose | Key Columns | Relationships |
|-------|---------|-------------|---------------|
| `profiles` | Extended user profiles | `id`, `full_name`, `company_name`, `company_address` | Extends `auth.users` |
| `vehicles` | User vehicles | `user_id`, `plate`, `type` | Belongs to user |
| `cmr_documents` | CMR lifecycle | `user_id`, `vehicle_id`, `status` (7 values) | Belongs to user & vehicle |
| `cmr_events` | Event timeline | `cmr_id`, `type`, `created_at` | Belongs to CMR |
| `cmr_reserves` | Loading/delivery issues | `cmr_id`, `side`, `reserve_type` | Belongs to CMR |
| `cmr_photos` | CMR photos | `cmr_id`, `storage_path` | Belongs to CMR |
| `cmr_signatures` | Dual signatures | `cmr_id`, `party_type`, `signer_name` | Belongs to CMR |

**Total tables**: 7
**Total RLS policies**: 28 (4 per table)
**Storage buckets**: 5 (vehicle-photos, cmr-photos, cmr-reserve-photos, cmr-signatures, cmr-pdfs)

---

## 9. CMR Status Lifecycle

The extended status system supports the full driver workflow:

```
draft → ready_to_load → loading → in_transit → ready_to_deliver → completed / completed_with_reserves
```

**Status Descriptions:**

- **draft**: CMR created but not yet ready (rarely used in normal flow)
- **ready_to_load**: CMR created and ready for loading to begin
- **loading**: Driver has started loading process
- **in_transit**: Loading complete, vehicle in transit
- **ready_to_deliver**: Driver has arrived and started delivery process
- **completed**: Delivery complete with no reserves
- **completed_with_reserves**: Delivery complete but reserves were recorded

---

## 10. Event Types Reference

| Event Type | Description | When Created |
|-----------|-------------|--------------|
| `loading_start` | Loading begins | Driver clicks "Start Loading" |
| `loading_end` | Loading complete | Driver clicks "End Loading" |
| `delivery_start` | Delivery begins | Driver clicks "Start Delivery" |
| `delivery_end` | Delivery complete | After consignee signs (future) |
| `waiting_start_loading` | Waiting time begins at loading | Optional future feature |
| `waiting_end_loading` | Waiting time ends at loading | Optional future feature |
| `waiting_start_delivery` | Waiting time begins at delivery | Optional future feature |
| `waiting_end_delivery` | Waiting time ends at delivery | Optional future feature |

---

**Document version**: 2.0 (Extended)
**Last updated**: December 2024
**Status**: Production-ready extended schema
