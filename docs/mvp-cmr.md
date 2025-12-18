# CMR Digital – Extended MVP Specification

## 1. Product Vision

**One-liner**
CMR Digital is a mobile-first web app that allows independent truck drivers and small transport companies to create, manage and complete CMR transport documents throughout the entire loading and delivery lifecycle, in a matter of minutes instead of hours.

**Value proposition**
- Save **25–35 minutes** per delivery
- Reduce yearly costs by **5 000–7 000€**
- Achieve ROI in **< 3 months**
- Complete digital traceability from loading to delivery
- Capture and document reserves in real-time
- Dual signature workflow (shipper + consignee)

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
  - Difficult to track reserves and document issues
  - Need signatures from both shipper and consignee

### Secondary persona – Small transport company manager
- 2–10 drivers
- Needs traceability and proof of delivery
- Pain points:
  - Collecting CMR from drivers
  - Archiving and finding documents on demand
  - Dealing with clients asking for copies
  - Managing reserves and claims
  - Tracking document status across multiple deliveries

---

## 3. Core User Journey (Extended MVP)

### 3.1 First-time onboarding (one-time)

1. Driver signs up with email/password
2. **Onboarding flow** (mandatory):
   - **Step 1 - Profile**: Fill in name, company details, contact info
   - **Step 2 - Vehicles**: Add at least one vehicle (plate, type, optional photo)
3. Only after completing onboarding can the driver access the dashboard

### 3.2 Creating a new CMR

1. From dashboard, driver taps **"New CMR"**
2. **4-step wizard** (`/cmr/new`):
   - **Step 1 - Shipper**: Shipper name and address
   - **Step 2 - Consignee**: Consignee name and address
   - **Step 3 - Goods**: Description, packages, weight, packaging type
   - **Step 4 - Transport**: Select vehicle, loading/delivery places and date
3. On submit:
   - CMR created with status `ready_to_load`
   - Redirects to `/cmr/[id]`

### 3.3 Loading phase (at pickup location)

1. On CMR details page, driver sees **"Loading"** block
2. Driver taps **"Start loading"** → status becomes `loading`
   - Timestamp recorded in `cmr_events` (loading_start)
3. During loading:
   - Driver can add **loading reserves** (damaged packaging, missing items, etc.)
   - Can attach photos to reserves
   - Can take general photos of goods
4. **Shipper signs** on the signature canvas
   - Signature saved to Storage
   - Linked to CMR with party_type = 'shipper'
5. Driver taps **"End loading"** → status becomes `in_transit`
   - Timestamp recorded in `cmr_events` (loading_end)

### 3.4 Transit phase

1. CMR is now `in_transit`
2. Driver can view all CMR details
3. Can attach additional photos if needed (road conditions, etc.)

### 3.5 Delivery phase (at delivery location)

1. Driver taps **"Start delivery"** → status becomes `ready_to_deliver`
   - Timestamp recorded in `cmr_events` (delivery_start)
2. During delivery:
   - Driver can add **delivery reserves** (damaged goods, quantity issues, etc.)
   - Can attach photos to reserves
   - Can take delivery photos
3. **Consignee signs** on the signature canvas
   - Signature saved to Storage
   - Linked to CMR with party_type = 'consignee'
4. **On consignee signature**:
   - System checks for reserves:
     - **If reserves exist**: status → `completed_with_reserves`
     - **If no reserves**: status → `completed`

### 3.6 Post-delivery

1. Driver can:
   - **Generate PDF** with all info, both signatures, reserves
   - **Download** or **Share** PDF (Web Share API / email / link)
2. CMR appears in **"Recently completed"** section on dashboard
3. All data archived and accessible for future reference

---

## 4. MVP Scope (Extended V1)

### In scope

#### **Onboarding**
- Mandatory profile setup:
  - Full name
  - Company name
  - Company address
  - Phone (optional)
  - Billing email (optional)
- Mandatory vehicle setup:
  - At least one vehicle required
  - Plate number, type, optional photo
  - Can add multiple vehicles

#### **Dashboard**
- Two main sections:
  - **CMR in progress**: Shows CMRs with status in:
    - `draft`, `ready_to_load`, `loading`, `in_transit`, `ready_to_deliver`
  - **Recently completed**: Shows CMRs with status:
    - `completed`, `completed_with_reserves`
- Each CMR displays:
  - Shipper → Consignee
  - Loading date
  - Vehicle plate
  - Status badge
- Primary CTA: "New CMR"

#### **CMR Creation (4-step wizard)**
- Step 1: Shipper information
- Step 2: Consignee information
- Step 3: Goods details
- Step 4: Transport details + summary
- Per-step validation with Zod
- Progress indicator
- Can navigate back/forward between steps
- Creates CMR with status `ready_to_load`

#### **CMR Lifecycle Management**
- Status progression:
  ```
  ready_to_load → loading → in_transit → ready_to_deliver → completed / completed_with_reserves
  ```
- Status-driven action buttons:
  - "Start loading" (ready_to_load → loading)
  - "End loading" (loading → in_transit)
  - "Start delivery" (in_transit → ready_to_deliver)
- Automatic status updates based on consignee signature + reserves

#### **Events Tracking**
- Key actions recorded as events:
  - `loading_start`
  - `loading_end`
  - `delivery_start`
- Events include:
  - Timestamp
  - User who triggered
  - Optional metadata (geolocation, notes)
- Displayed in timeline on CMR details

#### **Reserves System**
- Two types: **Loading reserves** and **Delivery reserves**
- Each reserve includes:
  - Type/category
  - Comment/description
  - Optional photo
  - Timestamp
- Managed from CMR details page
- Affects final CMR status

#### **Dual Signature Workflow**
- **Shipper signature**: Captured during loading phase
- **Consignee signature**: Captured at delivery
- Each signature:
  - Canvas-based capture
  - Saved as PNG to Storage
  - Includes signer name, role, timestamp
  - Linked to CMR with party_type

#### **Photos**
- Multiple photos per CMR:
  - General goods photos
  - Loading photos
  - Delivery photos
  - Photos attached to specific reserves
- Camera capture or file upload
- Stored in Supabase Storage
- Organized by CMR ID

#### **PDF Generation & Sharing**
- Generate comprehensive PDF including:
  - Full CMR details
  - Both signatures (when available)
  - Reserve summary
  - Key timestamps
- Download to device
- Share via Web Share API (mobile)
- Fallback: Copy link / email

#### **Progressive Web App**
- Installable on mobile home screen
- Service worker for offline capability
- IndexedDB for draft persistence
- Works offline for form filling

---

## 5. Non-goals (for MVP)

- No real-time GPS tracking during transit
- No route optimization or navigation
- No multi-language support (French only)
- No advanced roles/permissions (admin, dispatcher, fleet manager)
- No complex document search (simple list and status filter only)
- No invoicing, pricing or payment logic
- No integration with TMS or ERP systems
- No advanced offline conflict resolution
- No full CMR legal completeness (we cover a **practical subset** for MVP)
- No notification system (push notifications, emails)
- No analytics or reporting dashboard

---

## 6. Functional Requirements by Feature

### 6.1 Authentication

**Routes**: `/login`, `/signup`

- User can:
  - Sign up with email/password via Supabase Auth
  - Log in
  - Log out
- After first login, if profile or vehicles incomplete:
  - Redirect to `/onboarding/profile`
- After login with complete profile:
  - Redirect to `/app` (dashboard)
- Protect all routes under `/app`, `/cmr`, `/onboarding/vehicles` with auth

### 6.2 Onboarding

**Routes**: `/onboarding/profile`, `/onboarding/vehicles`

#### Profile Setup (`/onboarding/profile`)
- Form fields:
  - `full_name` (required)
  - `company_name` (required)
  - `company_address` (required)
  - `phone` (optional)
  - `billing_email` (optional)
- On submit:
  - Insert/update `profiles` table
  - Redirect to `/onboarding/vehicles`

#### Vehicle Setup (`/onboarding/vehicles`)
- Shows: List of user's vehicles (if any)
- Form to add vehicle:
  - `plate` (required)
  - `type` (optional: truck, van, etc.)
  - `photo` (optional, upload to Storage)
- Validation:
  - Must have at least 1 vehicle before accessing dashboard
- Actions:
  - Add vehicle
  - Edit vehicle
  - Delete vehicle
- On complete:
  - Redirect to `/app`

### 6.3 Dashboard

**Route**: `/app`

#### Sections

**CMR in Progress**
- Filter: `status IN ('draft', 'ready_to_load', 'loading', 'in_transit', 'ready_to_deliver')`
- Display for each:
  - Shipper name → Consignee name
  - Loading date
  - Vehicle plate
  - Status badge (color-coded)
- Click → Navigate to `/cmr/[id]`

**Recently Completed CMRs**
- Filter: `status IN ('completed', 'completed_with_reserves')`
- Display for each:
  - Shipper name → Consignee name
  - Loading date
  - Vehicle plate
  - Status badge
  - Reserve indicator if `completed_with_reserves`
- Click → Navigate to `/cmr/[id]`

#### Primary Action
- Button: **"New CMR"** → Navigate to `/cmr/new`

### 6.4 CMR Creation Wizard

**Route**: `/cmr/new`

Single route with internal stepper (4 steps).

#### Step 1: Shipper
- Fields:
  - `shipper_name` (required)
  - `shipper_address` (required)
- Validation: Zod schema
- Actions: "Next"

#### Step 2: Consignee
- Fields:
  - `consignee_name` (required)
  - `consignee_address` (required)
- Validation: Zod schema
- Actions: "Back", "Next"

#### Step 3: Goods
- Fields:
  - `goods_description` (required)
  - `packages_count` (required, integer > 0)
  - `weight_kg` (required, decimal > 0)
  - `packaging_type` (optional)
- Validation: Zod schema
- Actions: "Back", "Next"

#### Step 4: Transport & Summary
- Fields:
  - Select `vehicle_id` from user's vehicles (required)
  - `loading_place` (required)
  - `delivery_place` (required)
  - `loading_date` (required, date)
- Summary section:
  - Review all entered data
  - Edit buttons to go back to specific step
- Actions: "Back", "Create CMR"

#### On Submit
- Insert row in `cmr_documents`:
  - All fields from steps 1-4
  - `user_id` = current user
  - `status` = `'ready_to_load'`
  - `created_at` = now
- Redirect to `/cmr/[id]`

### 6.5 CMR Details Page

**Route**: `/cmr/[id]`

Central hub for managing a single CMR throughout its lifecycle.

#### Header Section
- Display:
  - CMR ID (shortened)
  - Status badge (large, color-coded)
  - Shipper → Consignee
  - Loading date
  - Vehicle plate

#### CMR Information Card
- Read-only display of:
  - Shipper details (name, address)
  - Consignee details (name, address)
  - Goods details (description, packages, weight, packaging)
  - Transport details (vehicle, places, date)

#### Loading Block (Shipper Side)

**When status = `ready_to_load`:**
- Button: **"Start Loading"**
- On click:
  - Create event: `loading_start`
  - Update status: `loading`

**When status = `loading`:**
- Display: Loading start timestamp (from events)
- Section: **Loading Reserves**
  - List of reserves where `side = 'loading'`
  - Each reserve shows: type, comment, photo (if any)
  - Button: **"Add Loading Reserve"**
    - Modal/form:
      - Reserve type (dropdown or text)
      - Comment (textarea)
      - Optional photo upload
    - On submit: Insert `cmr_reserves` row
- Section: **Shipper Signature**
  - If not signed: Signature canvas + "Save Signature" button
  - If signed: Display signature image
  - On save:
    - Upload PNG to Storage
    - Insert `cmr_signatures` with `party_type = 'shipper'`
- Button: **"End Loading"**
- On click:
  - Validation: Shipper must have signed
  - Create event: `loading_end`
  - Update status: `in_transit`

#### Transit Status Display
**When status = `in_transit`:**
- Display: Loading completed at [timestamp]
- Display: Transit in progress
- Info message: "Awaiting delivery start"

#### Delivery Block (Consignee Side)

**When status = `in_transit`:**
- Button: **"Start Delivery"**
- On click:
  - Create event: `delivery_start`
  - Update status: `ready_to_deliver`

**When status = `ready_to_deliver`:**
- Display: Delivery start timestamp
- Section: **Delivery Reserves**
  - List of reserves where `side = 'delivery'`
  - Each reserve shows: type, comment, photo (if any)
  - Button: **"Add Delivery Reserve"**
    - Modal/form similar to loading reserves
    - On submit: Insert `cmr_reserves` row with `side = 'delivery'`
- Section: **Consignee Signature**
  - If not signed: Signature canvas + "Save Signature" button
  - If signed: Display signature image
  - On save:
    - Upload PNG to Storage
    - Insert `cmr_signatures` with `party_type = 'consignee'`
    - **Check for reserves**:
      - If any `cmr_reserves` exist for this CMR:
        - Update status: `completed_with_reserves`
      - Else:
        - Update status: `completed`

#### Photos Block
- Display: Grid of all attached photos
- Button: **"Add Photo"**
  - Opens camera or file picker
  - Upload to Storage
  - Insert `cmr_photos` row
- Each photo:
  - Thumbnail
  - Click to view full size (modal)
  - Delete button (if not referenced by reserve)

#### PDF & Share Block
- Button: **"Generate PDF"**
  - Generates PDF with:
    - All CMR details
    - Shipper signature (if available)
    - Consignee signature (if available)
    - Loading and delivery reserves summary
    - Key timestamps
- Button: **"Download PDF"**
  - Downloads generated PDF to device
- Button: **"Share"**
  - If Web Share API available:
    - Share PDF file directly
  - Else:
    - Show link + "Copy to clipboard"

### 6.6 Events System

**Table**: `cmr_events`

Events are automatically created when key actions occur.

**Event Types**:
- `loading_start`: When driver starts loading
- `loading_end`: When driver ends loading
- `delivery_start`: When driver starts delivery
- (Optional future: `waiting_start`, `waiting_end`, `delivery_end`)

**Display**:
- On `/cmr/[id]`: Timeline of events with timestamps
- Used to calculate durations (loading time, delivery time, total time)

### 6.7 Reserves System

**Table**: `cmr_reserves`

**Fields**:
- `cmr_id`: Link to CMR
- `side`: `'loading'` or `'delivery'`
- `reserve_type`: String (e.g., "Damaged packaging", "Missing items")
- `comment`: Optional description
- `photo_storage_path`: Optional photo
- `created_at`: Timestamp

**UI**:
- Separate sections for loading reserves and delivery reserves
- Each section shows list of reserves
- "Add Reserve" button opens form:
  - Select or input type
  - Enter comment
  - Optionally attach photo
- Reserves are displayed with reserve indicator (icon, badge)

**Impact**:
- If any reserves exist when consignee signs:
  - CMR status → `completed_with_reserves`
- Reserves included in PDF generation

### 6.8 Signatures System

**Table**: `cmr_signatures`

**Fields**:
- `cmr_id`: Link to CMR
- `party_type`: `'shipper'` or `'consignee'`
- `signer_name`: Name of person signing
- `signer_role`: Optional role/title
- `storage_path`: Path to PNG in Storage
- `created_at`: Timestamp

**UI**:
- Two signature areas on `/cmr/[id]`:
  - **Shipper signature** (in Loading block)
  - **Consignee signature** (in Delivery block)
- Each area:
  - If not signed: Canvas + "Clear" + "Save Signature"
  - If signed: Display signature image + metadata
- On save:
  - Modal asks for signer_name and optional signer_role
  - Canvas exported to PNG
  - Uploaded to Storage (`cmr-signatures` bucket)
  - Row inserted in `cmr_signatures`

**Logic**:
- Shipper signature required before "End Loading"
- Consignee signature triggers final status determination

---

## 7. Technical Stack & Architecture

### 7.1 Frontend

- **Framework**: Next.js 14 – App Router – TypeScript
- **UI**:
  - Tailwind CSS
  - shadcn/ui components
  - Custom components for:
    - Stepper (wizard navigation)
    - Status badges
    - Timeline (events)
    - Signature canvas
- **State management**:
  - Zustand for global state (auth, user profile, vehicles)
  - React Hook Form for form state
  - React Query (optional) for server state caching
- **Forms & validation**:
  - React Hook Form + Zod
  - Multi-step wizard with shared context

### 7.2 Backend & Data

- **Backend**: Supabase
  - PostgreSQL database
  - Auth (email/password)
  - Storage (photos, signatures, PDFs)
  - Row Level Security (RLS)
- Pattern:
  - `supabase-js` client on frontend
  - Direct CRUD from Next.js components
  - RLS enforces data isolation per user

### 7.3 PWA & Offline

- Service Worker:
  - Cache static assets
  - Cache main routes: `/`, `/login`, `/app`, `/cmr/new`, `/cmr/[id]`
  - Network-first for API calls
- IndexedDB (via custom utility):
  - Store CMR wizard draft while filling
  - Restore on page reload
  - Clear on successful creation

### 7.4 External Services

- **PDF**: jsPDF (client-side generation)
- **Maps** (future): Google Maps API for address autocomplete
- **Email** (future): Supabase Edge Functions + Resend for PDF email

---

## 8. Data Model (Extended MVP)

### 8.1 Tables

#### `profiles`
```sql
- id (uuid, pk, references auth.users)
- full_name (text, not null)
- company_name (text, not null)
- company_address (text, not null)
- phone (text, nullable)
- billing_email (text, nullable)
- created_at (timestamptz, default now())
- updated_at (timestamptz, auto-update)
```

#### `vehicles`
```sql
- id (uuid, pk)
- user_id (uuid, references auth.users, not null)
- plate (text, not null, unique)
- type (text, nullable) -- e.g., "Truck", "Van", "Semi-trailer"
- photo_storage_path (text, nullable) -- Optional photo of vehicle
- created_at (timestamptz, default now())
- updated_at (timestamptz, auto-update)
```

#### `cmr_documents`
```sql
- id (uuid, pk)
- user_id (uuid, references auth.users, not null)
- vehicle_id (uuid, references vehicles, not null)

-- Shipper info
- shipper_name (text, not null)
- shipper_address (text, not null)

-- Consignee info
- consignee_name (text, not null)
- consignee_address (text, not null)

-- Goods info
- goods_description (text, not null)
- packages_count (integer, not null)
- weight_kg (numeric, not null)
- packaging_type (text, nullable)

-- Transport info
- loading_place (text, not null)
- delivery_place (text, not null)
- loading_date (date, not null)

-- Status
- status (text, not null)
  -- Values: 'draft', 'ready_to_load', 'loading', 'in_transit',
  --         'ready_to_deliver', 'completed', 'completed_with_reserves'

- created_at (timestamptz, default now())
- updated_at (timestamptz, auto-update)
```

#### `cmr_events`
```sql
- id (uuid, pk)
- cmr_id (uuid, references cmr_documents, not null)
- user_id (uuid, references auth.users, not null)
- type (text, not null)
  -- Values: 'loading_start', 'loading_end', 'delivery_start',
  --         'waiting_start', 'waiting_end', etc.
- metadata (jsonb, nullable) -- Optional: geolocation, notes, etc.
- created_at (timestamptz, default now())
```

#### `cmr_reserves`
```sql
- id (uuid, pk)
- cmr_id (uuid, references cmr_documents, not null)
- user_id (uuid, references auth.users, not null)
- side (text, not null) -- 'loading' or 'delivery'
- reserve_type (text, not null) -- e.g., "Damaged packaging", "Missing items"
- comment (text, nullable)
- photo_storage_path (text, nullable) -- Optional photo of reserve issue
- created_at (timestamptz, default now())
```

#### `cmr_photos`
```sql
- id (uuid, pk)
- cmr_id (uuid, references cmr_documents, not null)
- user_id (uuid, references auth.users, not null)
- storage_path (text, not null) -- Path in Supabase Storage
- created_at (timestamptz, default now())
```

#### `cmr_signatures`
```sql
- id (uuid, pk)
- cmr_id (uuid, references cmr_documents, not null)
- user_id (uuid, references auth.users, not null)
- party_type (text, not null) -- 'shipper' or 'consignee'
- signer_name (text, not null)
- signer_role (text, nullable) -- Optional: "Driver", "Manager", etc.
- storage_path (text, not null) -- Path to signature PNG in Storage
- created_at (timestamptz, default now())
```

### 8.2 Storage Buckets

- `vehicle-photos`: Photos of vehicles
- `cmr-photos`: General CMR photos
- `cmr-reserve-photos`: Photos attached to reserves
- `cmr-signatures`: Signature PNGs
- `cmr-pdfs` (optional): Generated PDFs if stored

### 8.3 RLS Policies (High Level)

All tables enforce:
- Users can only `select/insert/update/delete` rows where `user_id = auth.uid()`

Specific policies:
- **profiles**: User can only access their own profile
- **vehicles**: User can only manage their own vehicles
- **cmr_documents**: User can only access their own CMRs
- **cmr_events**: User can only create/view events for their CMRs
- **cmr_reserves**: User can only create/view reserves for their CMRs
- **cmr_photos**: User can only upload/view photos for their CMRs
- **cmr_signatures**: User can only create/view signatures for their CMRs

Storage policies:
- Users can only upload/access files in folders matching their user_id

---

## 9. Next.js Routes (Extended MVP)

### Public Routes
- `/` → Landing page / redirect to `/login` if not authenticated
- `/login` → Login page
- `/signup` → Sign up page

### Protected Routes (require auth)

#### Onboarding
- `/onboarding/profile` → Profile setup form
- `/onboarding/vehicles` → Vehicle management (add first vehicle)

#### Main App
- `/app` → Dashboard (in progress + completed CMRs)

#### CMR Management
- `/cmr/new` → 4-step CMR creation wizard
- `/cmr/[id]` → CMR details / lifecycle management hub

#### Settings (future)
- `/settings/profile` → Edit profile
- `/settings/vehicles` → Manage vehicles

---

## 10. Implementation Order (Realistic Slices)

### Slice 1: Auth + Onboarding
**Goal**: User can sign up, complete profile and add vehicles

- Auth pages: `/login`, `/signup`
- Onboarding pages: `/onboarding/profile`, `/onboarding/vehicles`
- Database: `profiles`, `vehicles` tables
- Protected route middleware
- Profile validation (Zod)
- Vehicle CRUD operations
- Vehicle photo upload (optional)

**Acceptance**: New user can sign up, fill profile, add at least one vehicle, and reach dashboard.

---

### Slice 2: Dashboard + Basic CMR List
**Goal**: User sees dashboard with empty states

- Dashboard page: `/app`
- Fetch CMRs from database
- Display "In Progress" section (empty for now)
- Display "Recently Completed" section (empty for now)
- "New CMR" button (links to `/cmr/new`, not functional yet)
- Status badge component

**Acceptance**: Dashboard loads, shows sections, "New CMR" button exists.

---

### Slice 3: CMR Creation Wizard
**Goal**: User can create a CMR through 4-step wizard

- CMR creation page: `/cmr/new`
- Stepper component (4 steps)
- Step 1: Shipper form + validation
- Step 2: Consignee form + validation
- Step 3: Goods form + validation
- Step 4: Transport form + validation + summary
- Vehicle selector (dropdown from user's vehicles)
- Form state management (React Hook Form)
- CMR schema validation (Zod)
- Insert `cmr_documents` with status `ready_to_load`
- Redirect to `/cmr/[id]`

**Acceptance**: User can fill wizard, submit, and see new CMR with status "ready to load".

---

### Slice 4: CMR Details + Basic View
**Goal**: User can view CMR details

- CMR details page: `/cmr/[id]`
- Fetch CMR data
- Display header (ID, status, basic info)
- Display CMR information card (all fields)
- Status badge
- Basic loading/delivery sections (no actions yet)

**Acceptance**: User can view complete CMR details in read-only mode.

---

### Slice 5: Loading Actions + Events
**Goal**: User can start/end loading and track events

- Loading block on `/cmr/[id]`
- "Start Loading" button (ready_to_load → loading)
- "End Loading" button (loading → in_transit)
- Create `cmr_events` table
- Insert events: `loading_start`, `loading_end`
- Display timestamps from events
- Update CMR status

**Acceptance**: User can start loading, see timestamp, end loading, CMR moves to "in transit".

---

### Slice 6: Delivery Actions
**Goal**: User can start delivery

- Delivery block on `/cmr/[id]`
- "Start Delivery" button (in_transit → ready_to_deliver)
- Insert event: `delivery_start`
- Display delivery timestamp
- Update CMR status

**Acceptance**: User can start delivery, status updates to "ready to deliver".

---

### Slice 7: Reserves System
**Goal**: User can add reserves at loading and delivery

- Create `cmr_reserves` table
- Loading reserves section
  - "Add Loading Reserve" button + form
  - Reserve type, comment, optional photo
- Delivery reserves section
  - "Add Delivery Reserve" button + form
- Display reserves lists
- Reserve photo upload to Storage

**Acceptance**: User can add reserves during loading and delivery, see them listed.

---

### Slice 8: Photos
**Goal**: User can attach photos to CMR

- Create `cmr_photos` table
- Photos block on `/cmr/[id]`
- "Add Photo" button
- Camera/file picker integration
- Upload to Storage (`cmr-photos` bucket)
- Display photos in grid
- Photo viewer modal
- Delete photo functionality

**Acceptance**: User can take/upload photos, view them, delete them.

---

### Slice 9: Shipper Signature
**Goal**: Shipper can sign during loading

- Create `cmr_signatures` table
- Shipper signature section in Loading block
- Signature canvas component
- "Clear" and "Save Signature" buttons
- Signer name/role input modal
- Upload signature PNG to Storage
- Insert signature with party_type = 'shipper'
- Display saved signature
- Validation: Must sign before ending loading

**Acceptance**: Shipper can sign, signature saved, displayed, required for loading completion.

---

### Slice 10: Consignee Signature + Final Status
**Goal**: Consignee can sign, CMR reaches final status

- Consignee signature section in Delivery block
- Signature canvas (same component)
- Upload signature with party_type = 'consignee'
- On save:
  - Check for reserves
  - If reserves exist: status → `completed_with_reserves`
  - If no reserves: status → `completed`
- CMR appears in "Recently Completed" on dashboard

**Acceptance**: Consignee signs, CMR status updates correctly based on reserves, appears on dashboard.

---

### Slice 11: PDF Generation
**Goal**: User can generate and download PDF

- PDF generation utility (jsPDF)
- "Generate PDF" button on `/cmr/[id]`
- PDF layout includes:
  - All CMR details
  - Both signatures (if available)
  - Reserves summary
  - Key timestamps
- "Download PDF" button
- PDF stored in memory or optionally uploaded to Storage

**Acceptance**: User can generate PDF, download it, PDF contains all CMR data.

---

### Slice 12: PDF Sharing
**Goal**: User can share PDF

- "Share" button on `/cmr/[id]`
- Web Share API integration
  - Share PDF file directly (if supported)
  - Share title + description + URL
- Fallback for non-supporting browsers:
  - Display shareable link
  - "Copy to clipboard" button

**Acceptance**: User can share PDF on mobile via native share sheet, copy link on desktop.

---

### Slice 13: PWA Setup
**Goal**: App is installable and works offline

- Create `manifest.json`
- Add app icons
- Service Worker:
  - Cache static assets
  - Cache key routes
  - Network-first for API calls
- Register service worker in root layout
- Test installation on mobile

**Acceptance**: App can be installed to home screen, basic pages work offline.

---

### Slice 14: Offline Drafts
**Goal**: CMR wizard data persists offline

- IndexedDB utility (`offline-drafts.ts`)
- Auto-save wizard state every 1 second
- Auto-restore on page reload
- Clear draft on successful CMR creation
- Visual feedback ("Draft saved offline")

**Acceptance**: User can fill wizard, close browser, reopen, data is restored.

---

## 11. Open Questions / Future Enhancements

### Short-term (post-MVP)
- **Address autocomplete**: Google Maps API integration
- **Multi-language**: French + English at minimum
- **Email notifications**: Send PDF via email to shipper/consignee
- **CMR templates**: Save common shipper/consignee/goods combos
- **Search & filters**: Search CMRs by shipper, consignee, date, status
- **Export options**: Excel/CSV export for company records

### Medium-term
- **Company accounts**: Multi-driver management
- **Role-based access**: Driver, manager, admin roles
- **Document archive**: Long-term storage and retrieval
- **GPS tracking**: Real-time location during transit
- **Waiting time tracking**: Track loading/unloading wait times
- **Multiple signatories**: Additional signatures (carrier, warehouse)

### Long-term
- **TMS integration**: Connect with transport management systems
- **E-invoicing**: Generate invoices from CMR data
- **Analytics dashboard**: Company-wide statistics and insights
- **Mobile app**: Native iOS/Android versions
- **Blockchain proof**: Immutable CMR records on blockchain
- **AI-powered OCR**: Scan existing CMR documents
- **Legal compliance**: Full CMR convention compliance

---

## 12. Success Metrics (KPIs)

### User Adoption
- Number of active drivers
- Number of CMRs created per day
- Onboarding completion rate
- App installation rate (PWA)

### User Experience
- Average time to create CMR (target: < 3 minutes)
- Average time from loading start to delivery complete
- Number of reserves per CMR
- Signature completion rate

### Technical Performance
- Page load time (target: < 2s)
- Offline functionality usage
- Error rate
- PDF generation time

### Business Impact
- Time saved per CMR vs paper (target: 25-35 minutes)
- Cost reduction per driver per year
- Customer retention rate
- NPS score

---

## 13. Design Principles

### Mobile-First
- All UI designed for smartphone screens first
- Large touch targets (min 44px)
- Thumb-friendly navigation
- Portrait orientation optimized

### Speed & Simplicity
- Minimize steps and clicks
- Clear visual hierarchy
- Progressive disclosure (show what's needed, when it's needed)
- Instant feedback on actions

### Offline-Ready
- Core functionality works without network
- Clear indicators of online/offline state
- Seamless sync when connection restored

### Visual Clarity
- Color-coded status badges
- Icons for quick recognition
- Consistent spacing and typography
- High contrast for outdoor use

### Error Prevention
- Validation on blur and submit
- Clear error messages
- Confirmation for destructive actions
- Auto-save to prevent data loss

---

## 14. Technical Considerations

### Performance
- Optimize images (compress, lazy load)
- Code splitting per route
- Minimize bundle size
- Cache aggressive with service worker

### Security
- RLS on all database tables
- Secure file upload (validate type, size)
- HTTPS only
- XSS/CSRF protection
- Signature verification (future)

### Scalability
- Horizontal scaling with Supabase
- CDN for static assets
- Database indexes on key fields (user_id, status, loading_date)
- Pagination for large lists

### Accessibility
- Semantic HTML
- ARIA labels where needed
- Keyboard navigation
- Screen reader support
- Color contrast WCAG AA

### Browser Support
- Chrome 90+ (mobile & desktop)
- Safari 14+ (iOS & macOS)
- Firefox 88+
- Edge 90+

---

## 15. Glossary

- **CMR**: Convention Marchandise Routière - International consignment note for road transport
- **Shipper**: Expéditeur - The party sending the goods
- **Consignee**: Destinataire - The party receiving the goods
- **Reserve**: Réserve - Notation of an issue or discrepancy (damage, missing items, etc.)
- **Loading**: Chargement - The process of loading goods onto the vehicle
- **Delivery**: Livraison - The process of unloading goods to the consignee
- **Transit**: En cours de route - The journey between loading and delivery locations
- **PWA**: Progressive Web App - Web app that can be installed like native app
- **RLS**: Row Level Security - Database-level access control

---

**Document version**: 2.0
**Last updated**: December 2024
**Status**: Extended MVP specification - Ready for implementation
