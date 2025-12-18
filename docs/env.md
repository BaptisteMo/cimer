# Environment Variables Configuration

This document lists all environment variables required for the CMR Digital MVP.

---

## Required Environment Variables

### 1. Supabase Configuration (Client-Side)

These variables are **publicly exposed** in the browser (prefixed with `NEXT_PUBLIC_`). They are safe to use in client-side code.

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | `https://czboqpveoesjoythbwyh.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase publishable key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` or `sb_publishable_...` |

**Where to find these values:**
1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Copy the **Project URL** for `NEXT_PUBLIC_SUPABASE_URL`
4. Copy the **Publishable key** for `NEXT_PUBLIC_SUPABASE_ANON_KEY`

⚠️ **Important:** Use the **publishable key** (starts with `eyJ...` or `sb_publishable_...`), NOT the secret key for client-side code!

---

### 2. Supabase Secret Key (Server-Side Only - Optional for MVP)

This key should **NEVER** be exposed to the browser. Only use it in server-side code (API routes, server components with proper security).

| Variable | Description | Example |
|----------|-------------|---------|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase secret key (bypasses RLS) | `sb_secret_...` or `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |

**Where to find this value:**
1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Copy the **Secret key** (shown only when you click "Reveal")

⚠️ **Security Warning:**
- The secret key **bypasses Row Level Security (RLS)**
- Never commit this key to version control
- Never use it in client-side code
- Only use it for admin operations or server-side tasks

**For the MVP**, you likely won't need this key unless you're implementing server-side PDF generation or admin features.

---

## `.env.local` Example

Create a `.env.local` file in the root of your project with the following content:

```bash
# Supabase Configuration (Public - safe for client-side)
NEXT_PUBLIC_SUPABASE_URL=https://czboqpveoesjoythbwyh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-publishable-key-here

# Supabase Secret Key (Private - server-side only)
# SUPABASE_SERVICE_ROLE_KEY=your-secret-key-here

# Optional: Node environment
NODE_ENV=development
```

---

## Getting Your Keys from Supabase

### Step-by-step:

1. **Log in to Supabase**: https://app.supabase.com
2. **Select your project**: `CMR Digital` (or whatever you named it)
3. **Go to Settings**:
   - Click the **Settings** icon (gear) in the left sidebar
   - Click **API** in the Settings submenu
4. **Copy the values**:
   - **URL**: Copy the "Project URL" (e.g., `https://xxx.supabase.co`)
   - **Publishable Key**: Copy the "Publishable key" (starts with `eyJ...` or `sb_publishable_...`)
   - **Secret Key** (optional): Click "Reveal" and copy (only if needed, starts with `sb_secret_...`)

---

## Security Best Practices

### ✅ DO:
- Use `NEXT_PUBLIC_SUPABASE_ANON_KEY` for all client-side code
- Commit `.env.example` to version control (without actual values)
- Use Row Level Security (RLS) policies to protect your data
- Keep `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` (gitignored)

### ❌ DON'T:
- Don't use `SUPABASE_SERVICE_ROLE_KEY` (secret key) in client-side code
- Don't commit `.env.local` to version control
- Don't share your secret key publicly
- Don't disable RLS if using the publishable key

---

## Verifying Your Setup

After setting up your `.env.local`, verify the configuration:

1. **Check if environment variables are loaded**:
   ```typescript
   console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
   console.log('Anon Key present:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
   ```

2. **Test the connection**:
   ```typescript
   import { supabase } from '@/lib/supabaseClient';

   const { data, error } = await supabase.from('profiles').select('*').limit(1);
   if (error) console.error('Connection error:', error);
   else console.log('Connected successfully!');
   ```

---

## `.env.example` Template

Create this file to help other developers set up their environment:

```bash
# .env.example
# Copy this file to .env.local and fill in your actual values

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-publishable-key-here

# Optional: Supabase Secret Key (server-side only)
# SUPABASE_SERVICE_ROLE_KEY=your-secret-key-here
```

---

## Troubleshooting

### Error: "Missing NEXT_PUBLIC_SUPABASE_URL environment variable"

**Solution:**
1. Make sure `.env.local` exists in the root of your project
2. Restart the Next.js dev server (`npm run dev`)
3. Verify the variable name is exactly `NEXT_PUBLIC_SUPABASE_URL`

### Error: "Invalid API key" or "Forbidden use of secret API key in browser"

**Solution:**
1. Double-check you copied the **publishable key**, NOT the secret key
2. The publishable key starts with `eyJ...` or `sb_publishable_...`
3. The secret key (which starts with `sb_secret_...`) should NEVER be used in client-side code
4. Make sure there are no extra spaces or line breaks in the key

### Error: "Failed to fetch" or CORS issues

**Solution:**
1. Check your Supabase project URL is correct
2. Verify your Supabase project is active (not paused)
3. Check Supabase dashboard for any authentication issues

---

## Additional Configuration (Future)

As the project grows, you may need additional environment variables:

```bash
# Email (if using Resend or similar)
RESEND_API_KEY=your-resend-key-here

# Google Maps API (for address autocomplete)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-key-here

# Sentry (error tracking)
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn-here

# Analytics
NEXT_PUBLIC_GA_TRACKING_ID=your-google-analytics-id-here
```

For the MVP, only the Supabase configuration is required.
