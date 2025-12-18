# CMR Digital – MVP Architecture

## 1. High-Level Overview

CMR Digital is a **mobile-first Progressive Web App** built with Next.js 14 (App Router) that allows truck drivers to create, sign, and share CMR transport documents digitally.

### Architecture principles
- **Mobile-first**: Every feature must work seamlessly on smartphone
- **Offline-capable**: Basic offline support with service workers + IndexedDB
- **Simple & pragmatic**: No over-engineering, focus on the core user journey
- **Type-safe**: TypeScript everywhere with Zod for runtime validation
- **Minimal backend**: Supabase handles auth, database, and storage

### Tech stack summary
- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **UI**: Tailwind CSS, shadcn/ui components
- **Forms**: React Hook Form + Zod validation
- **State**: Zustand for global state (auth, UI)
- **Backend**: Supabase (Auth, PostgreSQL, Storage)
- **PDF**: jsPDF or pdfmake (client-side generation)
- **PWA**: Service Worker, Web App Manifest, IndexedDB

---

## 2. Routes Structure (Next.js App Router)

```
/                       # Landing page (redirects to /login if not logged in, or /app if logged in)
/login                  # Sign in page (public)
/signup                 # Sign up page (public)

/app                    # Dashboard – list of CMRs (protected)
/cmr/new                # Create new CMR form (protected)
/cmr/[id]               # CMR details view (protected)
/cmr/[id]/edit          # Edit CMR (optional, can reuse /new form) (protected)

/api/cmr/pdf/[id]       # Optional: Server-side PDF generation endpoint
```

**Route protection strategy:**
- Use middleware to protect all routes under `/app` and `/cmr`
- Redirect unauthenticated users to `/login`
- After login, redirect to `/app`

---

## 3. Folder Structure

```
cimer/
├── app/                          # Next.js 14 App Router
│   ├── (auth)/                   # Auth route group (public layout)
│   │   ├── login/
│   │   │   └── page.tsx          # Login page
│   │   ├── signup/
│   │   │   └── page.tsx          # Signup page
│   │   └── layout.tsx            # Auth layout (centered, no nav)
│   │
│   ├── (protected)/              # Protected route group (with navigation)
│   │   ├── app/
│   │   │   └── page.tsx          # Dashboard (CMR list)
│   │   ├── cmr/
│   │   │   ├── new/
│   │   │   │   └── page.tsx      # New CMR form
│   │   │   └── [id]/
│   │   │       └── page.tsx      # CMR details
│   │   └── layout.tsx            # Protected layout (with header/nav)
│   │
│   ├── api/                      # API routes (if needed)
│   │   └── cmr/
│   │       └── pdf/
│   │           └── [id]/
│   │               └── route.ts  # PDF generation endpoint (optional)
│   │
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Landing page
│   └── globals.css               # Global styles + Tailwind
│
├── components/
│   ├── ui/                       # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   ├── label.tsx
│   │   ├── dialog.tsx
│   │   ├── toast.tsx
│   │   └── ...
│   │
│   ├── cmr/                      # CMR-specific components
│   │   ├── cmr-form.tsx          # Main CMR creation/edit form
│   │   ├── cmr-card.tsx          # CMR card for list view
│   │   ├── cmr-details.tsx       # Read-only CMR details view
│   │   ├── signature-canvas.tsx  # Signature pad component
│   │   ├── photo-uploader.tsx    # Camera/file upload component
│   │   └── pdf-generator.tsx     # PDF generation component
│   │
│   ├── auth/                     # Auth components
│   │   ├── login-form.tsx
│   │   ├── signup-form.tsx
│   │   └── auth-guard.tsx        # Client-side auth guard wrapper
│   │
│   └── shared/                   # Shared/common components
│       ├── header.tsx
│       ├── bottom-nav.tsx        # Mobile bottom navigation
│       ├── loading-spinner.tsx
│       └── error-boundary.tsx
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # Supabase client (browser)
│   │   ├── server.ts             # Supabase server client
│   │   └── middleware.ts         # Auth middleware helpers
│   │
│   ├── validations/              # Zod schemas
│   │   ├── cmr.schema.ts         # CMR form validation
│   │   └── auth.schema.ts        # Auth validation
│   │
│   ├── utils/
│   │   ├── cn.ts                 # Tailwind class merger
│   │   ├── date.ts               # Date formatting utilities
│   │   └── file.ts               # File upload helpers
│   │
│   └── pdf/
│       └── generator.ts          # PDF generation logic
│
├── store/                        # Zustand stores
│   ├── auth.store.ts             # Auth state (user, session)
│   └── ui.store.ts               # UI state (modals, toasts)
│
├── types/
│   ├── database.types.ts         # Supabase generated types
│   ├── cmr.types.ts              # CMR domain types
│   └── index.ts                  # Export all types
│
├── public/
│   ├── icons/                    # PWA icons (192x192, 512x512)
│   ├── manifest.json             # PWA manifest
│   └── sw.js                     # Service worker (generated)
│
├── supabase/
│   ├── migrations/               # Database migrations
│   │   └── 001_initial_schema.sql
│   └── seed.sql                  # Seed data (optional)
│
├── docs/
│   ├── architecture.md           # This file
│   └── deployment.md             # Deployment guide (later)
│
├── .env.local                    # Environment variables
├── middleware.ts                 # Next.js middleware for auth
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 4. Key Modules Description

### 4.1 Supabase Client (`lib/supabase/`)

**Purpose**: Centralize Supabase client initialization for browser and server contexts.

- **`client.ts`**: Browser-side Supabase client using `createBrowserClient` from `@supabase/ssr`
- **`server.ts`**: Server-side client for Server Components and Route Handlers
- **`middleware.ts`**: Auth helpers for Next.js middleware (session refresh, auth checks)

**Key functions**:
- `createClient()` – Get Supabase client instance
- `getSession()` – Retrieve current session
- `getUser()` – Get current user

---

### 4.2 Authentication (`components/auth/`, `middleware.ts`)

**Purpose**: Handle user authentication flow and route protection.

**Components**:
- **`login-form.tsx`**: Email/password login with React Hook Form + Zod
- **`signup-form.tsx`**: User registration form
- **`auth-guard.tsx`**: Client-side wrapper to protect components

**Middleware** (`middleware.ts`):
- Protects `/app/*` and `/cmr/*` routes
- Redirects unauthenticated users to `/login`
- Refreshes session on each request

**Flow**:
1. User submits login/signup form
2. Supabase Auth validates credentials
3. On success, create session + redirect to `/app`
4. Middleware checks session on protected routes

---

### 4.3 CMR Form (`components/cmr/cmr-form.tsx`)

**Purpose**: Form to create/edit CMR documents.

**Features**:
- React Hook Form for state management
- Zod validation (`lib/validations/cmr.schema.ts`)
- Mobile-optimized inputs
- Auto-save to IndexedDB (offline support)

**Fields** (as per spec):
- Shipper (name, address)
- Consignee (name, address)
- Goods description
- Number of packages
- Weight (kg)
- Vehicle plate
- Loading place/date
- Delivery place

**Validation rules** (Zod):
- Required: shipper_name, consignee_name, loading_date, loading_place, delivery_place
- Positive integers: packages_count
- Positive numbers: weight_kg

**On submit**:
1. Validate form
2. Insert into `cmr_documents` table
3. Clear IndexedDB draft
4. Redirect to `/cmr/[id]`

---

### 4.4 Signature Canvas (`components/cmr/signature-canvas.tsx`)

**Purpose**: Capture consignee signature on mobile.

**Implementation**:
- Use `react-signature-canvas` library (wraps HTML5 Canvas)
- Mobile-optimized touch events
- Buttons: "Clear" (reset canvas), "Save" (export + upload)

**Flow**:
1. Driver opens signature section on `/cmr/[id]`
2. Consignee signs on canvas
3. Click "Save":
   - Export canvas to PNG (base64)
   - Convert to Blob
   - Upload to Supabase Storage (`cmr-signatures/[cmr_id]/signature.png`)
   - Insert record in `cmr_signatures` table
   - Update CMR status to "signed"

---

### 4.5 Photo Uploader (`components/cmr/photo-uploader.tsx`)

**Purpose**: Take/upload photos of goods, damages, existing CMR.

**Features**:
- Use `<input type="file" accept="image/*" capture="environment">` for camera
- Preview thumbnails
- Upload to Supabase Storage (`cmr-photos/[cmr_id]/photo_[timestamp].jpg`)

**Flow**:
1. User clicks "Add photo" on `/cmr/[id]`
2. Open camera or file picker
3. Select/take photo
4. Compress image (optional, for mobile data savings)
5. Upload to Storage
6. Insert record in `cmr_photos` table with `storage_path`
7. Display thumbnail in CMR details

---

### 4.6 PDF Generator (`lib/pdf/generator.ts`, `components/cmr/pdf-generator.tsx`)

**Purpose**: Generate printable/shareable CMR PDF.

**Library**: `jsPDF` (simple) or `pdfmake` (more flexible)

**Content**:
- CMR header with logo (optional)
- All CMR fields in a clean layout
- Signature image (embedded PNG)
- Optional: small thumbnail of first photo
- Footer: generated date, app name

**Flow**:
1. User clicks "Generate PDF" on `/cmr/[id]`
2. Fetch CMR data + signature + photos from Supabase
3. Generate PDF client-side using jsPDF
4. Option A: Trigger download directly
5. Option B: Upload to Storage (`cmr-pdfs/[cmr_id].pdf`) and share link

---

### 4.7 Sharing (`components/cmr/share-button.tsx`)

**Purpose**: Share CMR PDF via native mobile sharing or fallback.

**Implementation**:
- Use **Web Share API** (`navigator.share`) when available
- Fallback: "Copy link" + "Download PDF"

**Flow**:
1. User clicks "Share" on `/cmr/[id]`
2. Check if `navigator.share` is supported
3. If yes:
   - Share PDF file or public URL
   - Title: "CMR [id] – [shipper] → [consignee]"
4. If no:
   - Show dialog with shareable link
   - "Copy to clipboard" button

---

### 4.8 State Management (Zustand stores)

**`store/auth.store.ts`**:
- Current user, session
- `login()`, `logout()`, `setUser()`

**`store/ui.store.ts`**:
- Toast notifications
- Modal state (if needed)
- Loading states

**Why Zustand?**
- Minimal boilerplate
- No context providers needed
- Good for small apps
- Easy to persist to localStorage (for offline state)

---

### 4.9 PWA & Offline (`public/manifest.json`, `public/sw.js`)

**Manifest** (`public/manifest.json`):
```json
{
  "name": "CMR Digital",
  "short_name": "CMR",
  "description": "Digital CMR transport documents",
  "start_url": "/app",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3b82f6",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

**Service Worker** (`public/sw.js`):
- Cache static assets (HTML, CSS, JS, images)
- Cache routes: `/`, `/login`, `/app`, `/cmr/new`, `/cmr/[id]`
- Offline fallback: show cached version or offline page

**IndexedDB** (via `idb` or `dexie`):
- Store draft CMR while filling form
- On submit, sync to Supabase
- Clear local draft on success

---

## 5. Implementation Order (Vertical Slices)

---

## Slice 1: Auth + Dashboard

**Goal**: User can sign up, log in, log out, and see an empty dashboard.

### Tasks

#### 1.1 Project setup
- [ ] Initialize Next.js 14 project with TypeScript
- [ ] Install dependencies:
  - `@supabase/supabase-js`, `@supabase/ssr`
  - `tailwindcss`, `@shadcn/ui` init
  - `react-hook-form`, `zod`, `@hookform/resolvers`
  - `zustand`
- [ ] Configure Tailwind + shadcn/ui
- [ ] Set up `.env.local` with Supabase keys

#### 1.2 Supabase setup
- [ ] Create Supabase project
- [ ] Create `profiles` table:
  ```sql
  CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    full_name TEXT,
    company_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  ```
- [ ] Enable RLS on `profiles`
- [ ] Create policy: users can read/update their own profile
- [ ] Generate TypeScript types: `supabase gen types typescript`

#### 1.3 Supabase client
- [ ] Create `lib/supabase/client.ts` (browser client)
- [ ] Create `lib/supabase/server.ts` (server client)
- [ ] Create `lib/supabase/middleware.ts` (auth helpers)

#### 1.4 Auth components
- [ ] Create `lib/validations/auth.schema.ts` (Zod schema for login/signup)
- [ ] Create `components/auth/login-form.tsx`
  - Email/password inputs
  - Form validation with React Hook Form + Zod
  - Submit handler calling `supabase.auth.signInWithPassword()`
  - Error handling
- [ ] Create `components/auth/signup-form.tsx`
  - Email, password, full name, company name
  - Submit handler calling `supabase.auth.signUp()`
  - Create profile record on signup

#### 1.5 Auth pages
- [ ] Create `app/(auth)/layout.tsx` (centered layout, no nav)
- [ ] Create `app/(auth)/login/page.tsx` (render LoginForm)
- [ ] Create `app/(auth)/signup/page.tsx` (render SignupForm)

#### 1.6 Middleware & route protection
- [ ] Create `middleware.ts` at root:
  - Check session on `/app/*` and `/cmr/*`
  - Redirect to `/login` if not authenticated
  - Refresh session on each request
- [ ] Create `app/(protected)/layout.tsx`:
  - Simple header with "Logout" button
  - Check auth server-side, redirect if needed

#### 1.7 Dashboard (empty state)
- [ ] Create `app/(protected)/app/page.tsx`:
  - Fetch current user
  - Show "Welcome [name]" message
  - Button: "New CMR" (links to `/cmr/new`, disabled for now)
  - Empty state: "No CMRs yet"

#### 1.8 Landing page
- [ ] Create `app/page.tsx`:
  - Check if user is logged in
  - If yes, redirect to `/app`
  - If no, redirect to `/login`

#### 1.9 Zustand auth store
- [ ] Create `store/auth.store.ts`:
  - `user` state
  - `login()`, `logout()`, `setUser()` actions

**Deliverable**: User can sign up, log in, see dashboard, and log out.

---

## Slice 2: Create CMR

**Goal**: User can create a CMR, see it in the list, and view its details.

### Tasks

#### 2.1 Database schema
- [ ] Create `cmr_documents` table:
  ```sql
  CREATE TABLE cmr_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    shipper_name TEXT NOT NULL,
    shipper_address TEXT,
    consignee_name TEXT NOT NULL,
    consignee_address TEXT,
    goods_description TEXT,
    packages_count INTEGER,
    weight_kg NUMERIC,
    vehicle_plate TEXT,
    loading_place TEXT NOT NULL,
    delivery_place TEXT NOT NULL,
    loading_date DATE NOT NULL,
    status TEXT DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );
  ```
- [ ] Enable RLS on `cmr_documents`
- [ ] Create policies:
  - `SELECT`: `user_id = auth.uid()`
  - `INSERT`: `user_id = auth.uid()`
  - `UPDATE`: `user_id = auth.uid()`
  - `DELETE`: `user_id = auth.uid()`
- [ ] Regenerate TypeScript types

#### 2.2 CMR validation schema
- [ ] Create `lib/validations/cmr.schema.ts`:
  - Zod schema with all fields
  - Validation rules (required fields, positive numbers)
  - Export TypeScript type from schema

#### 2.3 CMR form component
- [ ] Create `components/cmr/cmr-form.tsx`:
  - Use React Hook Form + Zod resolver
  - All input fields (shipper, consignee, goods, etc.)
  - Mobile-optimized inputs (large touch targets)
  - Submit handler:
    - Insert into `cmr_documents`
    - Redirect to `/cmr/[id]`
  - Error handling + toast notifications

#### 2.4 New CMR page
- [ ] Create `app/(protected)/cmr/new/page.tsx`:
  - Render `<CmrForm />`
  - Page title: "New CMR"

#### 2.5 CMR details view
- [ ] Create `components/cmr/cmr-details.tsx`:
  - Read-only display of all CMR fields
  - Status badge (draft/signed)
  - Placeholders for photos, signature sections (empty for now)
- [ ] Create `app/(protected)/cmr/[id]/page.tsx`:
  - Fetch CMR by ID (server-side)
  - Render `<CmrDetails />`
  - Show 404 if not found or user doesn't own the CMR

#### 2.6 CMR list on dashboard
- [ ] Create `components/cmr/cmr-card.tsx`:
  - Compact card showing:
    - Date
    - Shipper → Consignee
    - Status badge
  - Click opens `/cmr/[id]`
- [ ] Update `app/(protected)/app/page.tsx`:
  - Fetch last 10 CMRs for current user
  - Render list of `<CmrCard />`
  - Enable "New CMR" button

**Deliverable**: User can create a CMR, see it in the list, and view its details.

---

## Slice 3: CMR Details + Photos + Signature

**Goal**: User can add photos and capture signature on CMR details page.

### Tasks

#### 3.1 Database schema for photos
- [ ] Create `cmr_photos` table:
  ```sql
  CREATE TABLE cmr_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cmr_id UUID NOT NULL REFERENCES cmr_documents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    storage_path TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  ```
- [ ] Enable RLS + policies (similar to `cmr_documents`)

#### 3.2 Database schema for signatures
- [ ] Create `cmr_signatures` table:
  ```sql
  CREATE TABLE cmr_signatures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cmr_id UUID NOT NULL REFERENCES cmr_documents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    storage_path TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  ```
- [ ] Enable RLS + policies
- [ ] Regenerate TypeScript types

#### 3.3 Supabase Storage buckets
- [ ] Create `cmr-photos` bucket (public read, authenticated write)
- [ ] Create `cmr-signatures` bucket (public read, authenticated write)

#### 3.4 Photo uploader component
- [ ] Install image compression library (optional): `browser-image-compression`
- [ ] Create `lib/utils/file.ts`:
  - `compressImage()` helper
  - `uploadToStorage()` helper
- [ ] Create `components/cmr/photo-uploader.tsx`:
  - File input with camera capture: `<input type="file" accept="image/*" capture="environment">`
  - Preview selected image
  - Upload to `cmr-photos/[cmr_id]/[timestamp].jpg`
  - Insert record in `cmr_photos` table
  - Display thumbnails of uploaded photos

#### 3.5 Signature canvas component
- [ ] Install `react-signature-canvas`
- [ ] Create `components/cmr/signature-canvas.tsx`:
  - Canvas for signature drawing
  - Buttons: "Clear", "Save"
  - On save:
    - Export to PNG (base64)
    - Convert to Blob
    - Upload to `cmr-signatures/[cmr_id]/signature.png`
    - Insert record in `cmr_signatures` table
    - Update CMR status to "signed"
  - Display saved signature image

#### 3.6 Update CMR details page
- [ ] Update `components/cmr/cmr-details.tsx`:
  - Add "Photos" section with `<PhotoUploader />`
  - Add "Signature" section with `<SignatureCanvas />`
  - Fetch photos and signature on mount
  - Display thumbnails + signature image
- [ ] Update CMR status logic:
  - When signature is saved, update `status` to "signed"

**Deliverable**: User can add photos and capture signature on a CMR.

---

## Slice 4: PDF + Sharing

**Goal**: User can generate a PDF of the CMR and share it.

### Tasks

#### 4.1 PDF generation library
- [ ] Install `jspdf` (or `pdfmake` if more flexibility needed)
- [ ] Install `@types/jspdf` (if using jsPDF)

#### 4.2 PDF generator logic
- [ ] Create `lib/pdf/generator.ts`:
  - Function: `generateCmrPdf(cmr, signature?, photos?)`
  - Layout:
    - Header: "CMR Digital" + CMR ID
    - Body: all CMR fields in clean format
    - Embed signature image (if signed)
    - Optional: embed first photo thumbnail
    - Footer: generated date
  - Return PDF as Blob or trigger download

#### 4.3 PDF generator component
- [ ] Create `components/cmr/pdf-generator.tsx`:
  - Button: "Generate PDF"
  - On click:
    - Fetch CMR + signature + photos
    - Call `generateCmrPdf()`
    - Trigger download or upload to Storage

#### 4.4 Optional: PDF storage
- [ ] Create `cmr-pdfs` bucket in Supabase Storage (public read)
- [ ] On PDF generation:
  - Upload PDF to `cmr-pdfs/[cmr_id].pdf`
  - Store public URL in `cmr_documents.pdf_url` (add column)
  - Use this URL for sharing

#### 4.5 Share button component
- [ ] Create `components/cmr/share-button.tsx`:
  - Button: "Share"
  - Check if `navigator.share` is available:
    - If yes: share PDF file or public URL
    - If no: show dialog with "Copy link" + "Download PDF"
  - Share data:
    - Title: `CMR ${cmr.id} – ${shipper} → ${consignee}`
    - URL: public PDF link or shareable app link

#### 4.6 Update CMR details page
- [ ] Update `components/cmr/cmr-details.tsx`:
  - Add "Actions" section with:
    - `<PdfGenerator />` button
    - `<ShareButton />` button
  - Only enable if CMR is signed (optional: allow draft PDF too)

**Deliverable**: User can generate a PDF and share it via native share or fallback.

---

## Slice 5: PWA + Offline

**Goal**: App is installable as PWA and supports basic offline functionality.

### Tasks

#### 5.1 PWA manifest
- [ ] Create `public/manifest.json`:
  - Name, short name, description
  - Start URL: `/app`
  - Display: standalone
  - Icons: 192x192, 512x512
- [ ] Create app icons:
  - Generate icons in `public/icons/` (use tool like RealFaviconGenerator)
- [ ] Link manifest in `app/layout.tsx`:
  ```tsx
  <link rel="manifest" href="/manifest.json" />
  ```

#### 5.2 Service Worker setup
- [ ] Install `next-pwa` or manually create service worker
- [ ] Configure `next.config.js` to enable PWA (if using next-pwa)
- [ ] Create `public/sw.js` (or use next-pwa generation):
  - Cache static assets
  - Cache key routes: `/`, `/login`, `/app`, `/cmr/new`
  - Offline fallback strategy

#### 5.3 IndexedDB for offline drafts
- [ ] Install `idb` or `dexie`
- [ ] Create `lib/db/index.ts`:
  - Initialize IndexedDB
  - Store: `cmr_drafts` with auto-increment ID
  - Functions: `saveDraft()`, `getDraft()`, `deleteDraft()`
- [ ] Update `components/cmr/cmr-form.tsx`:
  - Auto-save form to IndexedDB on change (debounced)
  - On mount, check if draft exists and restore
  - On successful submit, delete draft

#### 5.4 Offline indicator
- [ ] Create `components/shared/offline-indicator.tsx`:
  - Listen to `online`/`offline` events
  - Show banner when offline: "You're offline. Changes will sync when back online."
- [ ] Add to `app/(protected)/layout.tsx`

#### 5.5 Testing PWA
- [ ] Test installability on mobile (Chrome/Safari)
- [ ] Test offline mode:
  - Create CMR while offline (saves to IndexedDB)
  - Go back online, submit syncs to Supabase
- [ ] Verify service worker caching with DevTools

**Deliverable**: App is installable as PWA and supports basic offline draft saving.

---

## 6. Additional Notes

### 6.1 Environment Variables

`.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
```

### 6.2 shadcn/ui Components Needed

Install as needed:
- `button`, `input`, `label`, `card`, `badge`
- `dialog`, `toast`, `form` (React Hook Form integration)
- `textarea`, `select`

### 6.3 Mobile Optimization

- Use `viewport` meta tag for proper scaling
- Large touch targets (min 44px)
- Bottom navigation for main actions
- Avoid small text (min 16px to prevent zoom on iOS)

### 6.4 Error Handling

- Use toast notifications for errors (shadcn/ui Toast)
- Show inline errors on forms (React Hook Form)
- Graceful degradation when offline

### 6.5 TypeScript

- Generate Supabase types: `npx supabase gen types typescript`
- Keep types in `types/database.types.ts`
- Create domain types in `types/cmr.types.ts`

---

## 7. Success Criteria

✅ **Slice 1**: User can sign up, log in, and see empty dashboard
✅ **Slice 2**: User can create a CMR and view it
✅ **Slice 3**: User can add photos and signature to a CMR
✅ **Slice 4**: User can generate PDF and share it
✅ **Slice 5**: App is installable and works offline (basic)

**Final MVP**: A truck driver can create, sign, and share a CMR in under 2 minutes on their smartphone.
