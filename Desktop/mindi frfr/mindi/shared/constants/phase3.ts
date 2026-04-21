// =============================================================================
// MINDI — Phase 3 Constants
// Sync windows, offline limits, collaboration config, export settings.
// =============================================================================

// -----------------------------------------------------------------------------
// CROSS-DEVICE SYNC
// -----------------------------------------------------------------------------

export const SYNC_CONFIG = {
  // Firestore real-time sync via onSnapshot — always-on when online
  // Offline queue flushed on reconnect in order of localTimestamp
  OFFLINE_QUEUE_MAX: 500,           // Max queued operations before blocking UI
  CONFLICT_WINDOW_MS: 5000,         // Operations within 5s are batched for conflict check
  SYNC_INDICATOR_DEBOUNCE_MS: 1000, // Avoid flashing "syncing" for fast operations
  DEVICE_HEARTBEAT_INTERVAL_MS: 30_000, // Update lastSeenAt every 30s when active
} as const;

// Platforms
export const PLATFORM_CONFIG = {
  web: { label: 'Web', icon: '🌐', supportsOffline: true },
  desktop: { label: 'Desktop', icon: '💻', supportsOffline: true },
  mobile: { label: 'Mobile', icon: '📱', supportsOffline: true },
} as const;

// -----------------------------------------------------------------------------
// COLLABORATION
// -----------------------------------------------------------------------------

export const COLLAB_CONFIG = {
  MAX_PARTICIPANTS: 2,              // Phase 3: pair-based (1:1)
  SANDBOX_EXPIRY_HOURS: 72,         // Sandboxes auto-close after 3 days of inactivity
  INVITE_EXPIRY_HOURS: 24,          // Invitations expire
  MAX_SANDBOX_NODES: 100,           // Cap to prevent runaway co-creation sessions
  CONFLICT_AUTO_RESOLVE_THRESHOLD: 0.95, // Auto-merge if similarity ≥ 95%
} as const;

// -----------------------------------------------------------------------------
// OFFLINE MODE
// -----------------------------------------------------------------------------

export const OFFLINE_CONFIG = {
  // IndexedDB stores
  IDB_STORES: {
    NODES: 'mindi_nodes_cache',
    EMBEDDINGS: 'mindi_vectors',
    HASHES: 'mindi_hashes',
    QUEUE: 'mindi_sync_queue',
    MANIFEST: 'mindi_cache_manifest',
  },

  // Max nodes to cache locally (beyond this, LRU eviction)
  MAX_CACHED_NODES: 1000,

  // Lightweight local AI fallback (offline vector search only — no LLM)
  LOCAL_SEARCH_MAX_RESULTS: 10,

  // Service worker cache strategy
  SW_CACHE_NAME: 'mindi-v1',
  SW_PRECACHE_ROUTES: ['/', '/dashboard', '/offline'],
} as const;

// -----------------------------------------------------------------------------
// EXPORT
// -----------------------------------------------------------------------------

export const EXPORT_CONFIG = {
  DOWNLOAD_LINK_EXPIRY_MINUTES: 60,
  MAX_EXPORT_NODES: 10_000,
  JSON_PRETTY_PRINT: true,

  MARKDOWN_TEMPLATE: `# Mindi Brain Export
Exported: {{date}}
Regions: {{regions}}
Node count: {{count}}

---

{{nodes}}
`,
} as const;

// -----------------------------------------------------------------------------
// BROWSER EXTENSION
// -----------------------------------------------------------------------------

export const EXTENSION_CONFIG = {
  ALLOWED_ORIGINS: ['https://app.mindi.ai', 'http://localhost:3000'],
  MAX_CAPTURE_CHARS: 10_000,        // Clip full-page captures at 10k chars
  STORAGE_KEY_TOKEN: 'mindi_ext_token',
} as const;
