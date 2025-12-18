-- =====================================================
-- RLS Policies for CMR Reserves and Photos Storage
-- =====================================================

-- 1. Ensure RLS is enabled on cmr_reserves table
ALTER TABLE public.cmr_reserves ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies if any (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view reserves of their CMR documents" ON public.cmr_reserves;
DROP POLICY IF EXISTS "Users can insert reserves on their CMR documents" ON public.cmr_reserves;
DROP POLICY IF EXISTS "Users can update their own reserves" ON public.cmr_reserves;
DROP POLICY IF EXISTS "Users can delete their own reserves" ON public.cmr_reserves;

-- 3. Create policies for cmr_reserves table

-- SELECT: Users can view reserves of their CMR documents
CREATE POLICY "Users can view reserves of their CMR documents"
ON public.cmr_reserves
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM cmr_documents
    WHERE cmr_documents.id = cmr_reserves.cmr_id
    AND cmr_documents.user_id = auth.uid()
  )
);

-- INSERT: Users can insert reserves on their CMR documents
CREATE POLICY "Users can insert reserves on their CMR documents"
ON public.cmr_reserves
FOR INSERT
TO authenticated
WITH CHECK (
  -- User must own the CMR document
  EXISTS (
    SELECT 1 FROM cmr_documents
    WHERE cmr_documents.id = cmr_reserves.cmr_id
    AND cmr_documents.user_id = auth.uid()
  )
  -- And the user_id must match
  AND user_id = auth.uid()
);

-- UPDATE: Users can update their own reserves
CREATE POLICY "Users can update their own reserves"
ON public.cmr_reserves
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- DELETE: Users can delete their own reserves
CREATE POLICY "Users can delete their own reserves"
ON public.cmr_reserves
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- =====================================================
-- Storage Policies for cmr-photos bucket
-- =====================================================
-- Note: These policies need to be created in Supabase Dashboard
-- under Storage > cmr-photos > Policies, or via API
--
-- Policy 1: Users can upload photos for their own reserves
-- Operation: INSERT
-- Target roles: authenticated
-- Policy definition:
-- bucket_id = 'cmr-photos' AND auth.uid() IS NOT NULL
--
-- Policy 2: Users can view photos of their CMR documents
-- Operation: SELECT
-- Target roles: authenticated
-- Policy definition:
-- bucket_id = 'cmr-photos' AND auth.uid() IS NOT NULL
--
-- Policy 3: Users can delete their own photos
-- Operation: DELETE
-- Target roles: authenticated
-- Policy definition:
-- bucket_id = 'cmr-photos' AND auth.uid() IS NOT NULL
-- =====================================================

-- Add helpful comments
COMMENT ON POLICY "Users can view reserves of their CMR documents" ON public.cmr_reserves IS 'Allow users to view reserves of CMR documents they own';
COMMENT ON POLICY "Users can insert reserves on their CMR documents" ON public.cmr_reserves IS 'Allow users to insert reserves on their CMR documents';
COMMENT ON POLICY "Users can update their own reserves" ON public.cmr_reserves IS 'Allow users to update reserves they created';
COMMENT ON POLICY "Users can delete their own reserves" ON public.cmr_reserves IS 'Allow users to delete reserves they created';
