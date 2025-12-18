# CMR Digital - PWA Setup

This document describes the Progressive Web App (PWA) implementation for CMR Digital.

## What is Implemented

### 1. Web App Manifest

Located at `/public/manifest.json`, the manifest defines:
- **name**: "CMR Digital"
- **short_name**: "CMR"
- **description**: "Digital CMR transport documents for truck drivers"
- **display**: standalone (hides browser UI when installed)
- **theme_color**: #000000
- **background_color**: #ffffff
- **icons**: 192x192 and 512x512 PNG icons (placeholders, need to be replaced)

### 2. Service Worker

Located at `/public/sw.js`, the service worker provides:
- **Static asset caching**: Caches key routes (/, /login, /signup, /app, /cmr/new)
- **Cache-first strategy**: Serves cached content when available, updates cache in background
- **Network bypass for API calls**: Supabase API calls always use network
- **Automatic cache updates**: Old caches are cleaned up on activation

The service worker is automatically registered via the `ServiceWorkerRegister` component in the root layout.

### 3. Offline Drafts

Located at `/src/lib/offline-drafts.ts`, provides IndexedDB-based storage for:
- **Auto-save**: Form data is automatically saved every 1 second while editing
- **Auto-restore**: Saved draft is loaded when returning to /cmr/new
- **Auto-clear**: Draft is cleared after successful CMR creation

**Database**: `cmr-digital-db`
**Store**: `drafts`
**Key**: `cmr-new-draft`

## How to Test Installation

### Desktop (Chrome/Edge)

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Open the app in Chrome**: Navigate to `http://localhost:3000`

3. **Check PWA readiness**:
   - Open DevTools (F12)
   - Go to "Application" tab
   - Check "Manifest" section to verify manifest is loaded
   - Check "Service Workers" section to verify worker is registered

4. **Install the PWA**:
   - Look for the install icon (⊕) in the address bar
   - Click it and confirm installation
   - Or use Chrome menu → "Install CMR Digital..."

5. **Verify installation**:
   - The app should open in a standalone window without browser chrome
   - Check start menu / desktop for the app icon

### Mobile (iOS Safari)

1. **Deploy to HTTPS**: PWA requires HTTPS (except localhost)

2. **Open in Safari**: Navigate to your deployed URL

3. **Install**:
   - Tap the Share button (square with arrow)
   - Scroll down and tap "Add to Home Screen"
   - Edit name if desired, tap "Add"

4. **Verify**:
   - App icon appears on home screen
   - Opening it shows the app without Safari UI

### Mobile (Android Chrome)

1. **Open in Chrome**: Navigate to your deployed URL

2. **Install**:
   - Look for "Add to Home screen" banner at bottom
   - Or tap menu (⋮) → "Install app"
   - Confirm installation

3. **Verify**:
   - App icon appears on home screen
   - Opening it shows the app in standalone mode

## Testing Offline Functionality

### Test Static Caching

1. **With dev server running**, open the app
2. **Open DevTools** → Application → Service Workers
3. **Check "Offline" checkbox** to simulate offline mode
4. **Navigate** between pages (/, /login, /app, /cmr/new)
5. **Verify**: Pages should load from cache

### Test Offline Drafts

1. **Go to** `/cmr/new`
2. **Fill in some form fields** (wait 1 second for auto-save)
3. **Refresh the page** or close and reopen the browser
4. **Verify**: Form data should be restored
5. **Submit the form successfully**
6. **Go back to** `/cmr/new`
7. **Verify**: Form should be empty (draft cleared)

### Test True Offline Mode

1. **Disconnect from network** (turn off WiFi, unplug ethernet, or enable airplane mode)
2. **Open the installed PWA**
3. **Navigate** to cached pages
4. **Go to** `/cmr/new` and fill out the form
5. **Verify**: Draft is saved offline (you'll see "Draft saved offline" message)
6. **Reconnect to network**
7. **Submit the form**
8. **Verify**: Form submits successfully and draft is cleared

## Known Limitations

### Current MVP Limitations

1. **No background sync**: Forms are not auto-submitted when coming back online. User must manually submit.

2. **Limited route caching**: Only main routes are pre-cached. Dynamic routes like `/cmr/[id]` are cached on first visit.

3. **No offline photo upload**: Photos require network connection. Draft only saves form text data.

4. **No offline signature**: Signature canvas requires network to save. Draft doesn't include signature data.

5. **No conflict resolution**: If user creates CMR offline on multiple devices, there's no conflict resolution.

6. **Icon placeholders**: App uses default icons until proper icons are provided.

7. **Single draft only**: Only one CMR draft is stored at a time. Creating a new CMR overwrites the previous draft.

8. **No draft management UI**: No way to manually view or delete drafts from the UI.

### Architecture Trade-offs

- **Client-side only**: Service worker and IndexedDB are client-side. No server-side sync.
- **Simple caching**: Uses basic cache-first strategy. Could be optimized with stale-while-revalidate.
- **No versioning**: Draft data isn't versioned. Schema changes could break saved drafts.

## Future Enhancements

Potential improvements for future versions:

1. **Background Sync API**: Auto-submit forms when network is restored
2. **Multiple drafts**: Store multiple CMR drafts with timestamps
3. **Draft management UI**: View and manage saved drafts
4. **Offline photo storage**: Store photos in IndexedDB until upload
5. **Push notifications**: Notify users of CMR status changes
6. **Better caching**: Implement stale-while-revalidate strategy
7. **Update prompts**: Notify users when new app version is available
8. **Custom icons**: Professional app icons for all sizes

## Technical Details

### Service Worker Lifecycle

1. **Install**: Caches static assets
2. **Activate**: Cleans up old caches
3. **Fetch**: Intercepts requests and serves from cache

### IndexedDB Schema

```javascript
Database: cmr-digital-db
  Store: drafts
    Key: "cmr-new-draft"
    Value: {
      data: CmrInput,      // Form data
      savedAt: string      // ISO timestamp
    }
```

### Cache Names

- `cmr-digital-v1`: Main cache for dynamic content
- `cmr-static-v1`: Static asset cache

## Troubleshooting

### Service Worker Not Registering

- Check browser console for errors
- Ensure you're on HTTPS or localhost
- Try clearing browser cache and reloading

### Draft Not Saving

- Check browser console for IndexedDB errors
- Verify browser supports IndexedDB
- Check browser storage settings (some browsers block storage in private mode)

### App Not Installing

- Verify manifest.json is loading (check DevTools → Application → Manifest)
- Ensure HTTPS is enabled (required for PWA except on localhost)
- Check that service worker is registered
- Some browsers require certain criteria (e.g., user engagement) before showing install prompt

### Offline Pages Not Loading

- Check that service worker is active (DevTools → Application → Service Workers)
- Verify page was cached (DevTools → Application → Cache Storage)
- Try clearing cache and reloading while online first

## Browser Support

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Service Worker | ✅ | ✅ | ✅ | ✅ |
| IndexedDB | ✅ | ✅ | ✅ | ✅ |
| Web App Manifest | ✅ | ✅ | ✅ | ✅ |
| Install Prompt | ✅ | ✅ | ✅ | ✅ |
| Standalone Mode | ✅ | ✅ | ✅ | ✅ |

## Resources

- [MDN: Progressive Web Apps](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [web.dev: PWA](https://web.dev/progressive-web-apps/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
