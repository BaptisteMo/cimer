# CMR Digital – MVP Specification

## 1. Product Vision

**One-liner**  
CMR Digital is a mobile-first web app that allows independent truck drivers and small transport companies to create, sign and send CMR transport documents in under 2 minutes.

**Value proposition**  
- Save **25–35 minutes** per delivery  
- Reduce yearly costs by **5 000–7 000€**  
- Achieve ROI in **< 3 months**

---

## 2. Target Users

### Primary persona – Independent truck driver
- Works alone or in a very small team
- Often on the road, low patience for complex tools
- Uses a smartphone for WhatsApp, mail, photos, GPS
- Pain points:
  - Paper CMR is long and repetitive to fill in
  - Risk of errors, loss, or damaged documents
  - Time wasted scanning/sending CMR after delivery

### Secondary persona – Small transport company manager
- 2–10 drivers
- Needs a minimum of traceability and proof of delivery
- Pain points:
  - Collecting CMR from drivers
  - Archiving and finding documents on demand
  - Dealing with clients asking for copies

---

## 3. Core User Journey (MVP)

1. Driver logs in or signs up
2. From the dashboard, he taps **“New CMR”**
3. He fills in:
   - Shipper & consignee information
   - Goods description (type, packages, weight)
   - Vehicle / plate information
   - Date, locations
4. On site, he:
   - Takes optional photos (goods, damage, existing CMR, etc.)
   - Has the consignee sign directly on the phone (signature canvas)
5. The app:
   - Saves the CMR + assets
   - Generates a PDF
   - Allows sending or sharing the CMR (email / Web Share / link)
6. Driver and company can retrieve the CMR later from the app.

The **MVP target**:  
👉 Make this end-to-end flow usable, fast and stable on a smartphone.

---

## 4. MVP Scope (V1)

### In scope

- **Authentication**
  - Email/password via Supabase Auth
  - Simple profile (name, company name)

- **CMR creation**
  - Form with:
    - Shipper (name, address)
    - Consignee (name, address)
    - Goods description (text)
    - Number of packages
    - Approximate weight
    - Vehicle plate / identifier
    - Date of loading
    - Place of loading / delivery
  - Address autocomplete (Google Maps API) is *nice to have*, not mandatory for the first proto

- **CMR details view**
  - Read-only view of all fields
  - List of attached photos
  - Signature status (signed / not signed)

- **Photos**
  - Use device camera (MediaDevices API) to take 1–3 photos
  - Store in Supabase Storage
  - Link to CMR document

- **Signature**
  - Signature canvas on mobile (Canvas API or signature pad lib)
  - Save signature as PNG in Supabase Storage
  - Attach to CMR

- **PDF generation**
  - Minimal PDF layout using jsPDF or pdfmake
  - Includes:
    - CMR key info
    - Signature image
    - Optional small thumbnail of main photo
  - Stored in Supabase Storage or generated on the fly

- **Sharing**
  - Web Share API when available (share link to PDF or download)
  - Fallback: “Copy link” button / download

- **Simple PWA**
  - Installable on mobile (manifest + icons)
  - Works in mobile browser as well

---

## 5. Non-goals (for MVP)

- No multi-language support
- No advanced roles/permissions (admin, dispatcher, etc.)
- No complex document search (simple list is enough)
- No invoicing, pricing or payment logic
- No advanced offline conflict resolution (basic offline support only)
- No full CMR legal completeness (we cover a **practical subset** for demo)

---

## 6. Functional Requirements by Feature

### 6.1 Authentication

- User can:
  - Sign up with email/password
  - Log in
  - Log out
- After login, redirect to `/app` (dashboard)
- Protect all app routes under `/app` and `/cmr` with auth

### 6.2 Dashboard

- Route: `/app`
- Shows:
  - Button “New CMR”
  - List of recent CMRs (basic: last 10) with:
    - Date
    - Shipper → Consignee
    - Status: draft / signed
- Clicking a CMR opens its detail page

### 6.3 CMR Creation

- Route: `/cmr/new`
- Uses React Hook Form + Zod for validation
- Minimal validation:
  - Required: shipper name, consignee name, date, locations
  - Basic sanity checks (e.g. positive number of packages/weight)
- On submit:
  - Insert into `cmr_documents` (Supabase)
  - Redirect to `/cmr/[id]`

### 6.4 CMR Details

- Route: `/cmr/[id]`
- Displays:
  - All main fields
  - Photos section
  - Signature section
  - Actions:
    - “Generate PDF”
    - “Share”
- Status:
  - Draft: no signature yet
  - Signed: at least one signature stored

### 6.5 Photos

- From `/cmr/[id]`:
  - Button “Add photo”
  - Opens camera (when possible) or file picker
  - Upload to Supabase Storage in a `cmr-photos/` bucket
  - Store metadata (URL + CMR id) in `cmr_photos`

### 6.6 Signature

- From `/cmr/[id]`:
  - Signature area:
    - Canvas component
    - Buttons: “Clear”, “Save”
  - On save:
    - Export signature to PNG
    - Upload to Supabase Storage in a `cmr-signatures/` bucket
    - Link to CMR in `cmr_signatures`

### 6.7 PDF Generation & Sharing

- From `/cmr/[id]`:
  - Button “Generate PDF”
    - Fetch CMR info + signature
    - Generate PDF client-side
    - Option: upload to Storage or download directly
  - Button “Share”
    - Use Web Share API if available with:
      - Title: “CMR [id] – [shipper] → [consignee]”
      - URL: link to PDF or public share link
    - Fallback: show link + “Copy to clipboard”

---

## 7. Technical Stack & Architecture

### 7.1 Frontend

- **Framework**: Next.js 14 – App Router – TypeScript
- **UI**:
  - Tailwind CSS
  - shadcn/ui components
- **State management**:
  - Zustand (or Jotai) for global app state (auth/session, UI state, ephemeral data)
- **Forms & validation**:
  - React Hook Form + Zod

### 7.2 Backend & Data

- **Backend**: Supabase
  - PostgreSQL database
  - Auth
  - Storage (photos, signatures, PDFs)
  - RLS
- Basic pattern:
  - `supabase-js` client on the frontend
  - Simple CRUD directly from Next.js components / hooks for MVP

### 7.3 PWA & Offline

- Service Worker:
  - Cache static assets
  - Cache main routes: `/`, `/login`, `/app`, `/cmr/new`, `/cmr/[id]`
- IndexedDB (via `idb` or `dexie`):
  - Store draft CMR while filling the form
  - Sync to Supabase when back online

### 7.4 External Services

- PDF: jsPDF or pdfmake
- Email (optional / later): Supabase Edge Functions + Resend
- Maps (optional / later): Google Maps autocomplete for addresses

---

## 8. Data Model (MVP)

### 8.1 Tables

#### `profiles`
- `id` (uuid, pk, references auth.users)
- `full_name` (text)
- `company_name` (text)
- `created_at` (timestamptz, default now())

#### `cmr_documents`
- `id` (uuid, pk)
- `user_id` (uuid, references auth.users)
- `shipper_name` (text)
- `shipper_address` (text)
- `consignee_name` (text)
- `consignee_address` (text)
- `goods_description` (text)
- `packages_count` (integer)
- `weight_kg` (numeric)
- `vehicle_plate` (text)
- `loading_place` (text)
- `delivery_place` (text)
- `loading_date` (date)
- `status` (text, enum-ish: 'draft' | 'signed')
- `created_at` (timestamptz, default now())
- `updated_at` (timestamptz)

#### `cmr_photos`
- `id` (uuid, pk)
- `cmr_id` (uuid, references cmr_documents.id)
- `user_id` (uuid)
- `storage_path` (text) // path in Supabase Storage
- `created_at` (timestamptz, default now())

#### `cmr_signatures`
- `id` (uuid, pk)
- `cmr_id` (uuid, references cmr_documents.id)
- `user_id` (uuid)
- `storage_path` (text)
- `created_at` (timestamptz, default now())

### 8.2 RLS (high level)

- All rows in `cmr_documents`, `cmr_photos`, `cmr_signatures` belong to a `user_id`.
- Policies:
  - Users can `select/insert/update/delete` only rows where `user_id = auth.uid()`.

---

## 9. Next.js Routes (MVP)

- `/` → Landing / redirect to `/login` if not logged in
- `/login` → Public auth page
- `/app` → Protected dashboard
- `/cmr/new` → New CMR form
- `/cmr/[id]` → CMR details (form read-only + photos + signature + actions)

---

## 10. Implementation Order (suggested vertical slices)

1. **Slice 1 – Auth + basic dashboard**
   - Auth flow with Supabase
   - `/login`, `/app` with empty list

2. **Slice 2 – Create CMR**
   - `/cmr/new` form
   - Insert in DB
   - List on `/app`
   - Details `/cmr/[id]`

3. **Slice 3 – Photos + Signature**
   - Add photos from detail view
   - Signature canvas and storage

4. **Slice 4 – PDF + Share**
   - Generate PDF
   - Basic sharing

5. **Slice 5 – PWA + simple offline**
   - Manifest, service worker
   - Draft CMR stored offline while filling

---

## 11. Open Questions / Later

- Full legal compliance with official CMR format?
- Multi-driver and company accounts?
- Multi-language support (FR/EN/others)?
- Search / filters / archives for hundreds of CMRs?
- Branding and UI refinement for production.

