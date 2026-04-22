# Stacked

> A portable bookmark manager that turns your saved links into organized, shareable collections.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Variable Structures](#variable-structures)
- [Module Reference](#module-reference)
- [Build Order](#build-order)
- [Component Features](#component-features)
- [Database Schema](#database-schema)
- [API Routes](#api-routes)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [Deployment](#deployment)
- [USP Features](#usp-features)
- [Roadmap](#roadmap)

---

## Overview

Stacked is a full-featured bookmark manager built around three core ideas:

1. **Stack View** — A unique visual metaphor where bookmarks are displayed as stacked cards grouped by category, replacing the flat-list fatigue of every other bookmark tool.
2. **Portable Pages** — Shareable, customizable start pages that turn your curated bookmarks into a public resource (think Linktree for knowledge).
3. **Smart Collections** — Rule-based auto-categorization that reduces the friction of manual organization.

---

## Tech Stack

| Layer               | Technology                       | Version   | Purpose                                      |
|---------------------|----------------------------------|-----------|----------------------------------------------|
| Framework           | Next.js (App Router)             | 14+       | SSR, RSC, file-based routing                 |
| Language            | TypeScript                       | 5.x       | Type safety across the entire codebase       |
| UI Components       | shadcn/ui                        | latest    | Accessible, composable primitives            |
| Styling             | Tailwind CSS                     | 3.x       | Utility-first CSS                            |
| State / Data        | TanStack Query (React Query)     | 5.x       | Server-state caching, optimistic updates     |
| Database            | Supabase (PostgreSQL 15)         | latest    | Auth, DB, RLS, Realtime, Storage, Edge Fns   |
| Auth                | Supabase Auth                    | latest    | Magic link, OAuth (Google, GitHub)           |
| Serverless          | Supabase Edge Functions (Deno)   | latest    | Metadata fetching, link health checks        |
| Command Palette     | cmdk                             | 1.x       | Keyboard-first navigation                    |
| Animations          | Framer Motion                    | 11.x      | Stack View fan-out, page transitions         |
| Charts              | Recharts                         | 2.x       | Analytics & insights visualizations          |
| Drag & Drop         | @dnd-kit/core                    | 6.x       | Bookmark and category reordering             |
| Deployment          | Vercel                           | —         | Edge network, preview deploys                |
| Monitoring          | Sentry + Vercel Analytics        | —         | Error tracking + performance                 |

---

## Project Structure

```
stacked/
├── .env.local                          # Environment variables
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── supabase/
│   ├── config.toml                     # Supabase project config
│   ├── migrations/
│   │   ├── 001_create_profiles.sql
│   │   ├── 002_create_categories.sql
│   │   ├── 003_create_bookmarks.sql
│   │   ├── 004_create_shared_links.sql
│   │   ├── 005_create_collection_rules.sql
│   │   ├── 006_enable_rls.sql
│   │   └── 007_create_search_index.sql
│   ├── functions/
│   │   ├── fetch-metadata/index.ts     # URL scraper edge function
│   │   └── check-links/index.ts        # Link health checker
│   └── seed.sql                        # Default categories & demo data
├── public/
│   ├── icons/
│   └── og-image.png
├── src/
│   ├── app/
│   │   ├── layout.tsx                  # Root layout (providers, fonts)
│   │   ├── page.tsx                    # Landing / marketing page
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   ├── signup/page.tsx
│   │   │   ├── verify-email/page.tsx   # Email verification pending screen
│   │   │   ├── onboarding/page.tsx     # Post-signup onboarding wizard
│   │   │   └── callback/route.ts       # OAuth callback handler
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx              # Dashboard shell (sidebar + nav)
│   │   │   ├── page.tsx                # Main bookmark view
│   │   │   ├── categories/
│   │   │   │   └── [id]/page.tsx       # Single category view
│   │   │   ├── search/page.tsx         # Search results page
│   │   │   ├── analytics/page.tsx      # Analytics & insights
│   │   │   ├── import/page.tsx         # Import bookmarks
│   │   │   └── settings/
│   │   │       ├── page.tsx            # General settings
│   │   │       ├── profile/page.tsx
│   │   │       └── shared-links/page.tsx
│   │   ├── p/[slug]/
│   │   │   ├── page.tsx                # Public portable view (SSR)
│   │   │   └── opengraph-image.tsx     # Dynamic OG image generation
│   │   └── api/
│   │       ├── bookmarks/
│   │       │   ├── route.ts            # GET (list), POST (create)
│   │       │   └── [id]/route.ts       # GET, PATCH, DELETE
│   │       ├── categories/
│   │       │   ├── route.ts
│   │       │   └── [id]/route.ts
│   │       ├── import/route.ts         # POST (import from HTML/JSON)
│   │       ├── export/route.ts         # GET (export as JSON/HTML/CSV)
│   │       └── metadata/route.ts       # POST (fetch URL metadata)
│   ├── components/
│   │   ├── ui/                         # shadcn/ui primitives
│   │   ├── layout/
│   │   │   ├── sidebar.tsx
│   │   │   ├── top-bar.tsx
│   │   │   ├── mobile-nav.tsx
│   │   │   └── theme-toggle.tsx
│   │   ├── bookmarks/
│   │   │   ├── bookmark-card.tsx
│   │   │   ├── bookmark-list-item.tsx
│   │   │   ├── bookmark-stack.tsx      # USP: Stack View component
│   │   │   ├── bookmark-grid.tsx
│   │   │   ├── bookmark-form.tsx
│   │   │   ├── bookmark-actions.tsx    # Context menu / bulk actions
│   │   │   └── bookmark-skeleton.tsx   # Loading state
│   │   ├── categories/
│   │   │   ├── category-tree.tsx
│   │   │   ├── category-card.tsx
│   │   │   ├── category-form.tsx
│   │   │   └── category-badge.tsx
│   │   ├── search/
│   │   │   ├── search-bar.tsx
│   │   │   ├── search-filters.tsx
│   │   │   └── search-results.tsx
│   │   ├── portable/
│   │   │   ├── portable-header.tsx
│   │   │   ├── portable-grid.tsx
│   │   │   └── portable-theme.tsx
│   │   ├── analytics/
│   │   │   ├── stats-cards.tsx
│   │   │   ├── growth-chart.tsx
│   │   │   ├── category-breakdown.tsx
│   │   │   └── tag-cloud.tsx
│   │   ├── import-export/
│   │   │   ├── import-wizard.tsx
│   │   │   ├── import-preview.tsx
│   │   │   └── export-options.tsx
│   │   └── shared/
│   │       ├── command-palette.tsx
│   │       ├── empty-state.tsx
│   │       ├── confirm-dialog.tsx
│   │       ├── favicon.tsx
│   │       └── link-status-badge.tsx
│   ├── hooks/
│   │   ├── use-bookmarks.ts
│   │   ├── use-categories.ts
│   │   ├── use-search.ts
│   │   ├── use-keyboard-shortcuts.ts
│   │   ├── use-debounce.ts
│   │   └── use-media-query.ts
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts               # Browser client
│   │   │   ├── server.ts               # Server component client
│   │   │   ├── admin.ts                # Service-role client (server only)
│   │   │   └── middleware.ts            # Auth session refresh
│   │   ├── utils.ts                    # cn(), formatDate, etc.
│   │   ├── constants.ts                # App-wide constants
│   │   ├── validators.ts               # Zod schemas
│   │   └── metadata-parser.ts          # OG/favicon parser logic
│   ├── types/
│   │   ├── index.ts                    # Barrel export
│   │   ├── database.ts                 # Supabase generated types
│   │   ├── bookmark.ts
│   │   ├── category.ts
│   │   ├── profile.ts
│   │   ├── shared-link.ts
│   │   ├── search.ts
│   │   ├── analytics.ts
│   │   └── api.ts                      # API request/response types
│   └── config/
│       ├── site.ts                     # Site metadata
│       ├── nav.ts                      # Navigation items
│       └── keyboard-shortcuts.ts       # Shortcut definitions
└── extensions/
    └── chrome/                         # Browser extension (Phase 2)
        ├── manifest.json
        ├── popup/
        ├── background/
        └── content/
```

---

## Variable Structures

All TypeScript types and interfaces used across the application.

### Core Entity Types

```typescript
// ============================================================
// types/profile.ts — User profile
// ============================================================
export type UserTier = "free" | "pro";         // Pro gated behind M15 (future)
export type OnboardingStep = "username" | "categories" | "first_bookmark" | "done";

export interface Profile {
  id: string;                         // UUID, maps to auth.users.id
  email: string;                      // From auth.users, denormalized for convenience
  email_verified: boolean;            // Whether email has been confirmed
  username: string;                   // Unique, used in portable URL
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;                 // Shown on portable page
  tier: UserTier;                     // Always "free" at launch; Pro via M15 later
  onboarding_step: OnboardingStep;    // Tracks progress; "done" = completed
  preferences: UserPreferences;
  last_login_at: string | null;       // Updated on each session
  created_at: string;                 // ISO 8601
  updated_at: string;
}

export interface UserPreferences {
  theme: "light" | "dark" | "system";
  default_view: "stack" | "grid" | "list";
  default_category_id: string | null; // Where new bookmarks go by default
  items_per_page: number;             // 20 | 40 | 60 | 100
  show_favicons: boolean;
  show_og_images: boolean;
  compact_mode: boolean;
  email_notifications: boolean;       // Future: weekly digest, dead link alerts
}

// Tier limits — enforced in API routes, not just UI
// At launch everything uses FREE limits; Pro unlocked by M15 later
export const TIER_LIMITS: Record<UserTier, {
  max_bookmarks: number;
  max_categories: number;
  max_shared_links: number;
  smart_collections: boolean;
  custom_themes: boolean;
}> = {
  free: {
    max_bookmarks: 500,
    max_categories: 20,
    max_shared_links: 1,
    smart_collections: false,
    custom_themes: false,
  },
  pro: {
    max_bookmarks: 10_000,
    max_categories: 200,
    max_shared_links: 20,
    smart_collections: true,
    custom_themes: true,
  },
} as const;


// ============================================================
// types/category.ts — Categories and nesting
// ============================================================
export interface Category {
  id: string;                         // UUID
  user_id: string;                    // FK → profiles.id
  name: string;
  slug: string;                       // URL-safe version of name
  description: string | null;
  color: string;                      // Hex color, e.g. "#6366F1"
  icon: string | null;                // Lucide icon name, e.g. "folder"
  parent_id: string | null;           // FK → categories.id (one level nesting)
  sort_order: number;                 // Manual ordering
  bookmark_count: number;             // Denormalized counter (updated via trigger)
  is_default: boolean;                // The "General" category
  created_at: string;
  updated_at: string;
}

export interface CategoryTree extends Category {
  children: Category[];               // Nested sub-categories
}

export interface CategoryFormData {
  name: string;
  description?: string;
  color: string;
  icon?: string;
  parent_id?: string | null;
}


// ============================================================
// types/bookmark.ts — Bookmarks (the core entity)
// ============================================================
export type LinkStatus = "alive" | "dead" | "redirected" | "timeout" | "unchecked";

export interface Bookmark {
  id: string;                         // UUID
  user_id: string;                    // FK → profiles.id
  category_id: string;                // FK → categories.id
  url: string;                        // The actual link
  title: string;
  description: string | null;
  favicon_url: string | null;         // Cached in Supabase Storage
  og_image_url: string | null;        // Cached in Supabase Storage
  tags: string[];                     // PostgreSQL TEXT[]
  is_pinned: boolean;
  is_archived: boolean;
  sort_order: number;
  link_status: LinkStatus;
  last_checked_at: string | null;     // Link health check timestamp
  domain: string;                     // Extracted from URL, e.g. "github.com"
  created_at: string;
  updated_at: string;
}

export interface BookmarkFormData {
  url: string;
  title?: string;
  description?: string;
  category_id: string;
  tags?: string[];
  is_pinned?: boolean;
}

export interface BookmarkMetadata {
  title: string | null;
  description: string | null;
  favicon_url: string | null;
  og_image_url: string | null;
  domain: string;
}

export interface BookmarkWithCategory extends Bookmark {
  category: Pick<Category, "id" | "name" | "color" | "icon">;
}


// ============================================================
// types/shared-link.ts — Portable public views
// ============================================================
export type PortableTheme = "minimal" | "cards" | "masonry" | "terminal";
export type PortableLayout = "grid" | "list" | "stack";

export interface SharedLink {
  id: string;                         // UUID
  user_id: string;                    // FK → profiles.id
  category_id: string | null;         // NULL = share all categories
  slug: string;                       // Unique, used in /p/[slug]
  title: string | null;               // Custom page title
  description: string | null;         // Bio / subtitle on the page
  theme: PortableTheme;
  layout: PortableLayout;
  show_tags: boolean;
  show_descriptions: boolean;
  show_dates: boolean;
  is_active: boolean;
  view_count: number;                 // Denormalized, incremented on visit
  created_at: string;
  updated_at: string;
}

export interface SharedLinkFormData {
  category_id?: string | null;
  slug: string;
  title?: string;
  description?: string;
  theme: PortableTheme;
  layout: PortableLayout;
  show_tags?: boolean;
  show_descriptions?: boolean;
  show_dates?: boolean;
}


// ============================================================
// types/search.ts — Search, filter, and sort
// ============================================================
export type SortField = "created_at" | "updated_at" | "title" | "sort_order";
export type SortDirection = "asc" | "desc";

export interface SearchParams {
  query: string;                      // Full-text search input
  category_id?: string | null;
  tags?: string[];
  link_status?: LinkStatus;
  is_pinned?: boolean;
  is_archived?: boolean;
  date_from?: string;                 // ISO date
  date_to?: string;
  sort_by: SortField;
  sort_dir: SortDirection;
  page: number;
  per_page: number;
}

export interface SearchResult {
  bookmarks: BookmarkWithCategory[];
  total_count: number;
  page: number;
  per_page: number;
  has_next: boolean;
}


// ============================================================
// types/analytics.ts — Dashboard insights
// ============================================================
export interface AnalyticsOverview {
  total_bookmarks: number;
  total_categories: number;
  total_tags: number;
  bookmarks_this_week: number;
  bookmarks_this_month: number;
  dead_links_count: number;
  stale_bookmarks_count: number;      // Not updated in 90+ days
}

export interface CategoryBreakdown {
  category_id: string;
  category_name: string;
  category_color: string;
  count: number;
  percentage: number;
}

export interface GrowthDataPoint {
  date: string;                       // ISO date (day or week)
  count: number;                      // Bookmarks added
  cumulative: number;                 // Running total
}

export interface TagFrequency {
  tag: string;
  count: number;
}

export interface DomainFrequency {
  domain: string;
  count: number;
  favicon_url: string | null;
}


// ============================================================
// types/api.ts — API request/response wrappers
// ============================================================
export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
  status: number;
}

export interface ApiError {
  code: string;                       // e.g. "VALIDATION_ERROR", "NOT_FOUND"
  message: string;
  details?: Record<string, string[]>; // Field-level errors
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    per_page: number;
    total_count: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export interface BulkActionRequest {
  bookmark_ids: string[];
  action: "move" | "delete" | "archive" | "tag" | "pin" | "unpin";
  payload?: {
    category_id?: string;             // For "move"
    tags?: string[];                  // For "tag"
  };
}

export interface ImportRequest {
  format: "html" | "json" | "csv";
  content: string;                    // Raw file content
  duplicate_strategy: "skip" | "overwrite" | "create_new";
  default_category_id?: string;
}

export interface ImportPreview {
  total_items: number;
  categories_detected: string[];
  duplicates_found: number;
  items: Array<{
    url: string;
    title: string;
    folder: string | null;
    is_duplicate: boolean;
  }>;
}

export interface ExportRequest {
  format: "json" | "html" | "csv";
  category_ids?: string[];            // Empty = export all
  include_metadata: boolean;
}


// ============================================================
// types/collection-rules.ts — Smart Collections (USP)
// ============================================================
export type RuleMatchType = "domain" | "url_contains" | "title_contains" | "tag_match";

export interface CollectionRule {
  id: string;
  user_id: string;
  name: string;                       // e.g. "GitHub Repos"
  match_type: RuleMatchType;
  match_value: string;                // e.g. "github.com", "recipe"
  target_category_id: string;         // Auto-assign to this category
  is_active: boolean;
  auto_created: boolean;              // System-suggested vs user-created
  matched_count: number;              // How many bookmarks matched
  created_at: string;
}

export interface CollectionSuggestion {
  rule: Omit<CollectionRule, "id" | "user_id" | "created_at">;
  sample_bookmarks: Pick<Bookmark, "id" | "url" | "title">[];
  confidence: number;                 // 0-1, based on match count
}
```

### State & Hook Types

```typescript
// ============================================================
// hooks/use-bookmarks.ts — Return types
// ============================================================
export interface UseBookmarksReturn {
  bookmarks: BookmarkWithCategory[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  // Mutations
  addBookmark: (data: BookmarkFormData) => Promise<Bookmark>;
  updateBookmark: (id: string, data: Partial<BookmarkFormData>) => Promise<Bookmark>;
  deleteBookmark: (id: string) => Promise<void>;
  bulkAction: (request: BulkActionRequest) => Promise<void>;
  // Pagination
  page: number;
  setPage: (page: number) => void;
  hasNextPage: boolean;
  // Filters
  filters: SearchParams;
  setFilters: (filters: Partial<SearchParams>) => void;
  resetFilters: () => void;
}

export interface UseCategoriesReturn {
  categories: CategoryTree[];
  flatCategories: Category[];         // Flattened for dropdowns
  isLoading: boolean;
  addCategory: (data: CategoryFormData) => Promise<Category>;
  updateCategory: (id: string, data: Partial<CategoryFormData>) => Promise<Category>;
  deleteCategory: (id: string, strategy: "move" | "delete") => Promise<void>;
  reorderCategories: (orderedIds: string[]) => Promise<void>;
}

export interface UseSearchReturn {
  query: string;
  setQuery: (q: string) => void;
  results: SearchResult | null;
  isSearching: boolean;
  suggestions: string[];              // Recent / popular searches
  clearSearch: () => void;
}
```

### Configuration Constants

```typescript
// ============================================================
// lib/constants.ts
// ============================================================
export const APP_CONFIG = {
  name: "Stacked",
  description: "Your bookmarks, beautifully organized.",
  url: "https://stacked.app",
  creator: "Stacked Team",
} as const;

export const LIMITS = {
  MAX_BOOKMARKS_FREE: 500,
  MAX_BOOKMARKS_PRO: 10_000,
  MAX_CATEGORIES_FREE: 20,
  MAX_CATEGORIES_PRO: 200,
  MAX_TAGS_PER_BOOKMARK: 10,
  MAX_TAG_LENGTH: 30,
  MAX_TITLE_LENGTH: 200,
  MAX_DESCRIPTION_LENGTH: 500,
  MAX_IMPORT_SIZE_MB: 10,
  MAX_SHARED_LINKS_FREE: 1,
  MAX_SHARED_LINKS_PRO: 20,
  METADATA_FETCH_TIMEOUT_MS: 8_000,
  SEARCH_DEBOUNCE_MS: 300,
  LINK_CHECK_BATCH_SIZE: 50,
  LINK_CHECK_INTERVAL_MS: 1_000,
  STALE_BOOKMARK_DAYS: 90,
  FAVICON_MAX_SIZE_KB: 500,
  OG_IMAGE_MAX_SIZE_KB: 2_048,
} as const;

export const DEFAULT_CATEGORY = {
  name: "General",
  color: "#6B7280",
  icon: "inbox",
  is_default: true,
} as const;

export const PORTABLE_THEMES: Record<PortableTheme, { label: string; description: string }> = {
  minimal:  { label: "Minimal",  description: "Clean list with subtle separators" },
  cards:    { label: "Cards",    description: "Card-based grid layout" },
  masonry:  { label: "Masonry",  description: "Pinterest-style dynamic grid" },
  terminal: { label: "Terminal", description: "Monospace hacker aesthetic" },
} as const;

export const KEYBOARD_SHORTCUTS = {
  SEARCH:           { key: "/",     mod: false, description: "Focus search" },
  COMMAND_PALETTE:  { key: "k",     mod: true,  description: "Open command palette" },
  NEW_BOOKMARK:     { key: "n",     mod: false, description: "Add new bookmark" },
  TOGGLE_VIEW:      { key: "v",     mod: false, description: "Toggle view mode" },
  TOGGLE_SIDEBAR:   { key: "b",     mod: true,  description: "Toggle sidebar" },
  ESCAPE:           { key: "Escape",mod: false, description: "Close modal / clear search" },
} as const;

export const CATEGORY_COLORS = [
  "#EF4444", "#F97316", "#F59E0B", "#84CC16",
  "#22C55E", "#14B8A6", "#06B6D4", "#3B82F6",
  "#6366F1", "#8B5CF6", "#A855F7", "#EC4899",
] as const;

export const LINK_STATUS_CONFIG: Record<LinkStatus, { label: string; color: string; icon: string }> = {
  alive:      { label: "Active",     color: "#22C55E", icon: "check-circle" },
  dead:       { label: "Broken",     color: "#EF4444", icon: "x-circle" },
  redirected: { label: "Redirected", color: "#F59E0B", icon: "arrow-right-circle" },
  timeout:    { label: "Timeout",    color: "#6B7280", icon: "clock" },
  unchecked:  { label: "Unchecked",  color: "#9CA3AF", icon: "help-circle" },
} as const;
```

### Zod Validation Schemas

```typescript
// ============================================================
// lib/validators.ts
// ============================================================
import { z } from "zod";

export const bookmarkSchema = z.object({
  url: z.string().url("Must be a valid URL").max(2048),
  title: z.string().max(200).optional(),
  description: z.string().max(500).optional(),
  category_id: z.string().uuid(),
  tags: z.array(z.string().max(30)).max(10).optional().default([]),
  is_pinned: z.boolean().optional().default(false),
});

export const categorySchema = z.object({
  name: z.string().min(1, "Name is required").max(50),
  description: z.string().max(200).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a hex color"),
  icon: z.string().max(30).optional(),
  parent_id: z.string().uuid().nullable().optional(),
});

export const sharedLinkSchema = z.object({
  slug: z.string()
    .min(3).max(40)
    .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens"),
  category_id: z.string().uuid().nullable().optional(),
  title: z.string().max(100).optional(),
  description: z.string().max(300).optional(),
  theme: z.enum(["minimal", "cards", "masonry", "terminal"]),
  layout: z.enum(["grid", "list", "stack"]),
  show_tags: z.boolean().optional().default(true),
  show_descriptions: z.boolean().optional().default(true),
  show_dates: z.boolean().optional().default(false),
});

export const searchParamsSchema = z.object({
  query: z.string().max(200),
  category_id: z.string().uuid().nullable().optional(),
  tags: z.array(z.string()).optional(),
  link_status: z.enum(["alive","dead","redirected","timeout","unchecked"]).optional(),
  is_pinned: z.boolean().optional(),
  is_archived: z.boolean().optional(),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
  sort_by: z.enum(["created_at","updated_at","title","sort_order"]).default("created_at"),
  sort_dir: z.enum(["asc","desc"]).default("desc"),
  page: z.coerce.number().int().positive().default(1),
  per_page: z.coerce.number().int().min(10).max(100).default(20),
});

export const importSchema = z.object({
  format: z.enum(["html", "json", "csv"]),
  content: z.string().max(10 * 1024 * 1024), // 10MB
  duplicate_strategy: z.enum(["skip", "overwrite", "create_new"]),
  default_category_id: z.string().uuid().optional(),
});

export const profileSchema = z.object({
  username: z.string()
    .min(3).max(30)
    .regex(/^[a-z0-9_-]+$/, "Only lowercase letters, numbers, underscores, hyphens"),
  display_name: z.string().max(50).optional(),
  bio: z.string().max(300).optional(),
});

export const onboardingSchema = z.object({
  step: z.enum(["username", "categories", "first_bookmark", "done"]),
  data: z.object({
    username: z.string().min(3).max(30).optional(),         // step: username
    selected_categories: z.array(z.string()).optional(),     // step: categories (preset picks)
    first_bookmark_url: z.string().url().optional(),         // step: first_bookmark
  }),
});
```

---

## Module Reference

All 15 modules are defined in `stacked module.json`. Each module entry includes:

- **id** — Unique key (M1–M15)
- **name** — Human-readable module name
- **owner** — Which layer is responsible
- **scope** — What the module covers
- **dependencies** — Which modules it requires (never start a module before all deps are done)
- **tables** — Database tables it reads/writes
- **components** — UI components that belong to it
- **api_routes** — API endpoints it exposes
- **priority** — `mvp`, `phase2`, `phase3`, or `phase4`

The file also contains a top-level `build_order` array — the canonical implementation sequence with per-module status tracking. Update `build_order.sequence[n].status` to `"done"` as each module ships.

---

## Build Order

Derived from the dependency graph in `stacked module.json`. Never start a module before all its listed deps are complete.

| Step | Module | Name                      | Deps                  | Phase   | Notes |
|------|--------|---------------------------|-----------------------|---------|-------|
| 1    | M1     | Auth & Identity           | —                     | MVP     | ✅ Done |
| 2    | M2     | Category Engine           | M1                    | MVP     | ✅ Done |
| 3    | M9     | Storage & Asset Mgmt      | —                     | MVP     | ⬅ **Next** — no deps, unblocks M4 |
| 4    | M4     | Metadata Fetcher          | M9                    | MVP     | |
| 5    | M3     | Bookmark Core             | M1, M2, M4            | MVP     | |
| 6    | M5     | Search                    | M3                    | MVP     | |
| 7    | M8     | Dashboard Shell           | M1, M2, M3, M5        | MVP     | |
| 8    | M14    | Settings & Preferences    | M1                    | MVP     | Core only (profile/prefs/danger-zone). `settings-shared-links` is a placeholder until M7. |
| 9    | M6     | Import / Export           | M2, M3                | Phase 2 | |
| 10   | M7     | Portable Public View      | M1, M2, M3            | Phase 2 | After M7 ships, activate `settings-shared-links` in M14. |
| 11   | M10    | Link Health Monitor       | M3                    | Phase 2 | |
| 12   | M12    | Command Palette           | M2, M3, M5, M8        | Phase 2 | |
| 13   | M11    | Browser Extension         | M1, M3, M4            | Phase 3 | |
| 14   | M13    | Analytics & Insights      | M3, M10               | Phase 3 | |
| 15   | M15    | Billing & Tiers           | M1, M14               | Phase 4 | |

**Key rules:**
- M9 has no dependencies — it can be built in parallel with M2 if needed
- M14's `settings-shared-links` component is deferred: scaffold as a "Coming soon" placeholder in MVP, fully activate after M7
- M6 and M7 are independent of each other (both need M3); do M6 first as it uses existing tables

---

## Component Features

### Auth & Onboarding Components

| Component            | Features                                                                    |
|----------------------|-----------------------------------------------------------------------------|
| `login-form`         | Email input for magic link, Google OAuth button, GitHub OAuth button, loading states, error handling, "Check your email" confirmation screen |
| `signup-form`        | Email input, username selection with live availability check, avatar upload (optional), terms acceptance checkbox |
| `verify-email`       | Pending verification screen with resend button (60s cooldown), auto-redirect on verification, illustration + messaging |
| `onboarding-wizard`  | 3-step post-signup flow: Step 1 — choose username + avatar, Step 2 — pick starter categories from presets (Dev, Design, News, etc.), Step 3 — add your first bookmark (with metadata preview). Progress indicator, skip option per step, "Get Started" CTA at end |
| `auth-guard`         | Layout wrapper that redirects unauthenticated users to login, checks `onboarding_step !== "done"` and redirects to onboarding if incomplete, renders loading skeleton during session check |

### Layout Components

| Component          | Features                                                                       |
|--------------------|--------------------------------------------------------------------------------|
| `sidebar`          | Category tree with drag-reorder, collapse/expand, color indicators, count badges, add button, responsive drawer on mobile |
| `top-bar`          | Search bar, quick-add button, view toggle (stack/grid/list), notification bell, user avatar dropdown |
| `mobile-nav`       | Bottom navigation bar (Home, Search, Add, Categories, Settings), active indicator |
| `theme-toggle`     | Light/dark/system toggle with smooth transition, persisted to preferences       |
| `command-palette`  | Cmd+K activation, fuzzy search across bookmarks + categories + actions, recent history, keyboard navigation |

### Bookmark Components

| Component             | Features                                                                    |
|-----------------------|-----------------------------------------------------------------------------|
| `bookmark-card`       | Favicon, title, domain, truncated description, tags as pills, pin indicator, OG image thumbnail (optional), hover actions (edit, delete, open, copy URL), context menu, link status indicator |
| `bookmark-list-item`  | Compact row: favicon + title + domain + tags + pin + status, inline edit on double-click |
| `bookmark-stack`      | **USP** — Stacked card pile per category showing count badge + top 3 favicons, hover to peek, click to fan-out with spring animation (Framer Motion), collapsed/expanded state, category color accent |
| `bookmark-grid`       | Responsive grid (auto-fill, min 280px), masonry option for varied card heights, virtualized rendering for 100+ items |
| `bookmark-form`       | URL input with auto-fetch trigger, metadata preview (favicon + title + description), category dropdown, tag input (autocomplete from existing tags), pin toggle, manual edit override |
| `bookmark-actions`    | Bulk action toolbar (appears when items selected): move, delete, archive, tag, pin/unpin. Confirmation dialog for destructive actions. Select all / deselect all |
| `bookmark-skeleton`   | Shimmer loading placeholders matching card/list/stack layouts              |

### Category Components

| Component           | Features                                                                      |
|---------------------|-------------------------------------------------------------------------------|
| `category-tree`     | Hierarchical list with indent, expand/collapse children, drag-to-reorder via @dnd-kit, drop-to-move bookmarks, active state highlighting |
| `category-card`     | Large card view showing name, color, icon, bookmark count, description preview, click to navigate |
| `category-form`     | Name input, color picker (from preset palette), icon selector (Lucide icons grid), parent category dropdown, description textarea |
| `category-badge`    | Inline pill showing category name with its assigned color as background     |

### Search Components

| Component          | Features                                                                       |
|--------------------|--------------------------------------------------------------------------------|
| `search-bar`       | Debounced text input (300ms), clear button, search icon, keyboard shortcut hint ("/" to focus), recent searches dropdown |
| `search-filters`   | Collapsible filter panel: category multi-select, tag multi-select, date range picker, link status filter, pinned-only toggle, archived toggle |
| `search-results`   | Results list with highlighted match terms, result count, applied filters summary, clear all filters button, empty state for no matches |

### Portable View Components

| Component          | Features                                                                       |
|--------------------|--------------------------------------------------------------------------------|
| `portable-header`  | User avatar, display name, bio, social links (optional), total bookmark count  |
| `portable-grid`    | Renders bookmarks in the chosen layout (grid/list/stack), respects theme choice, responsive, no interactivity beyond clicking links |
| `portable-theme`   | Applies the selected theme (minimal/cards/masonry/terminal), self-contained CSS, dark mode support |

### Analytics Components

| Component              | Features                                                                  |
|------------------------|---------------------------------------------------------------------------|
| `stats-cards`          | 4-card row: total bookmarks, added this week, categories, broken links. Each with icon, count, delta indicator |
| `growth-chart`         | Line chart (Recharts) showing bookmarks added per week over last 12 weeks, cumulative overlay option |
| `category-breakdown`   | Horizontal bar chart or donut chart showing bookmark count per category, colored by category color |
| `tag-cloud`            | Weighted tag cloud or ranked list showing top 20 tags by frequency       |

### Import/Export Components

| Component          | Features                                                                       |
|--------------------|--------------------------------------------------------------------------------|
| `import-wizard`    | Step 1: select format (HTML/JSON/CSV), Step 2: file upload with drag-drop zone, Step 3: preview + duplicate strategy, Step 4: confirmation + progress bar |
| `import-preview`   | Table showing parsed bookmarks: URL, title, detected folder → category mapping, duplicate flag. Edit category mapping before confirming |
| `export-options`   | Format selector (JSON/HTML/CSV), category filter (export all or selected), include metadata toggle, download button |

### Shared / Utility Components

| Component            | Features                                                                    |
|----------------------|-----------------------------------------------------------------------------|
| `empty-state`        | Illustration + message + CTA button, context-aware (different for no bookmarks vs no search results vs no categories) |
| `confirm-dialog`     | Modal with title, description, cancel/confirm buttons, destructive variant (red confirm), loading state on confirm |
| `favicon`            | Renders cached favicon with fallback: domain initial on colored circle. Lazy-loaded. Handles broken image gracefully |
| `link-status-badge`  | Small colored dot/icon indicating alive/dead/redirected/timeout/unchecked status, tooltip with last checked date |

---

## Database Schema

See `supabase/migrations/` in the project structure. Key design decisions:

- **RLS on every table** — users can only access their own data
- **`profiles` extended with auth fields** — `email_verified`, `onboarding_step`, `tier` (defaults to "free"), `last_login_at` tracked per session
- **`search_vec` tsvector column** on bookmarks — auto-updated by trigger
- **`bookmark_count` on categories** — denormalized, updated by trigger on bookmark insert/delete
- **`domain` extracted on insert** — trigger parses URL and stores domain separately for analytics
- **`view_count` on shared_links** — incremented by the public SSR page on each visit
- **Soft delete via `is_archived`** — bookmarks are archived first, permanently deleted after 30 days by a cron job
- **Tier limits enforced at API layer** — every create/update route checks `profiles.tier` against `TIER_LIMITS` before allowing writes (free limits apply to all users at launch)

---

## API Routes

| Method   | Route                     | Module | Description                          |
|----------|---------------------------|--------|--------------------------------------|
| `POST`   | `/api/auth/verify-email`  | M1     | Resend email verification            |
| `GET`    | `/api/auth/me`            | M1     | Get current user profile + tier      |
| `POST`   | `/api/onboarding`         | M1     | Submit onboarding step data          |
| `GET`    | `/api/username/check`     | M1     | Check username availability          |
| `GET`    | `/api/bookmarks`          | M3     | List bookmarks (paginated, filtered) |
| `POST`   | `/api/bookmarks`          | M3     | Create bookmark                      |
| `GET`    | `/api/bookmarks/[id]`     | M3     | Get single bookmark                  |
| `PATCH`  | `/api/bookmarks/[id]`     | M3     | Update bookmark                      |
| `DELETE` | `/api/bookmarks/[id]`     | M3     | Delete bookmark                      |
| `POST`   | `/api/bookmarks/bulk`     | M3     | Bulk actions                         |
| `GET`    | `/api/categories`         | M2     | List categories (tree)               |
| `POST`   | `/api/categories`         | M2     | Create category                      |
| `PATCH`  | `/api/categories/[id]`    | M2     | Update category                      |
| `DELETE` | `/api/categories/[id]`    | M2     | Delete category                      |
| `PATCH`  | `/api/categories/reorder` | M2     | Update sort orders                   |
| `POST`   | `/api/metadata`           | M4     | Fetch URL metadata                   |
| `GET`    | `/api/search`             | M5     | Full-text search                     |
| `POST`   | `/api/import`             | M6     | Import bookmarks                     |
| `POST`   | `/api/import/preview`     | M6     | Preview import (dry run)             |
| `GET`    | `/api/export`             | M6     | Export bookmarks                     |
| `GET`    | `/api/analytics/overview` | M13    | Dashboard stats                      |
| `GET`    | `/api/analytics/growth`   | M13    | Growth chart data                    |
| `GET`    | `/api/analytics/tags`     | M13    | Tag frequency data                   |

---

## Getting Started

```bash
# 1. Clone and install
git clone https://github.com/your-org/stacked.git
cd stacked
npm install

# 2. Set up Supabase
npx supabase init
npx supabase start              # Local dev instance
npx supabase db push            # Apply migrations

# 3. Configure environment
cp .env.example .env.local      # Fill in Supabase keys

# 4. Run development server
npm run dev                     # http://localhost:3000

# 5. Run Supabase Edge Functions locally
npx supabase functions serve
```

---

## Deployment

```bash
# Deploy to Vercel
vercel deploy --prod

# Deploy Supabase migrations
npx supabase db push --linked

# Deploy Edge Functions
npx supabase functions deploy fetch-metadata
npx supabase functions deploy check-links
```

---

## USP Features

### Stack View (Primary Differentiator)
Bookmarks displayed as visual card stacks grouped by category. Hover to peek at contents, click to fan out with spring physics animation. No other bookmark manager has this interaction pattern.

### Portable Pages
Shareable, themeable start pages at `stacked.app/yourname`. Four themes (minimal, cards, masonry, terminal). Customizable layout and visibility settings. Free tier gets 1 page, Pro gets unlimited + custom domains.

### Smart Collections
Rule-based auto-categorization. When patterns are detected (e.g., multiple `github.com` bookmarks), Stacked suggests a collection. Users can accept, dismiss, or customize rules.

---

## Roadmap

| Phase   | Timeline   | Modules                                                   |
|---------|------------|-----------------------------------------------------------|
| Phase 1 | Weeks 1–4  | M1, M2, M3, M4, M5, M8, M9, M14 (Core MVP)              |
| Phase 2 | Weeks 5–7  | M6, M7, M10, M12 (Import/Export, Portable, Health, Cmdk)  |
| Phase 3 | Weeks 8–10 | M11, M13, Smart Collections, Browser Extension            |
| Phase 4 | TBD        | M15 — Billing & Tiers (Stripe, Pro plan, usage metering)  |

---

## License

MIT

---

*Built with discipline. Organized by design. Stacked by nature.*
