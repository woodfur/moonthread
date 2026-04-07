# Changelog

All notable changes to the Moonthread Facility Management System will be documented in this file.

## [2026-04-02] — AI-Powered Smart Form Filling

### Added
- **AI Parse API** (`/api/ai-parse`) — sends transcribed voice text to Google Gemini 2.0 Flash for structured data extraction. Supports 5 form types: expense, work_order, supply_request, consumable_new, consumption_log.
- **Intelligent form auto-fill** — AI extracts amounts, categories, dates, item names, quantities, urgency levels and populates ALL relevant form fields automatically.
- **Fuzzy matching** — AI matches spoken locations/items to available database records using context hints.
- **AI loading state** — animated parsing indicator with transcription preview.

### Changed
- **FormEntrySelector** — refactored to full AI pipeline: transcription → Gemini extraction → structured form fill. New props: `formType`, `contextHints`, `onFormDataExtracted`.
- **All 5 form pages** — migrated to `onFormDataExtracted` with controlled state for AI population.

## [2026-04-02] — Voice & Form Entry Separation

### Added
- **FormEntrySelector component** (`src/components/ui/FormEntrySelector.tsx`) — new dual-option entry screen that presents "Record Voice" and "Fill Form" as two distinct cards. Voice recording now happens on a dedicated screen before the form, keeping forms clean.
- **Entry selector CSS** — responsive styles for the choice cards, standalone voice panel, and skip button. Stacks to single column on mobile (≤480px).

### Changed
- **5 form pages refactored** — Expenses, Work Orders, Supply Requests, Consumption (new item & log) now use `FormEntrySelector` instead of inline `VoiceRecorder`. Voice recorder is no longer embedded inside form fields.
- **Cleaner form UI** — removed voice recorder buttons from label rows, simplified description/notes field labels and placeholders.

## [2026-04-02] — Full Responsive & Mobile Design Overhaul

### Added
- **Mobile hamburger menu** — header now shows a hamburger (☰) button on screens ≤768px. Tapping opens the sidebar as a slide-in drawer with a dark overlay backdrop.
- **Mobile sidebar drawer** — sidebar slides in from the left on mobile with an X close button. Tapping any nav link or the overlay auto-closes the drawer.
- **`MobileMenuContext`** — shared React context between `Header` and `Sidebar` for coordinated hamburger/drawer state.
- **Mobile brand label** — "MOONTHREAD" text visible in the header on mobile (since sidebar is hidden).
- **`.dashboard-shell` CSS layout system** — replaced all inline layout styles with class-based CSS for the shell, sidebar, header, and main content.
- **`.form-row` CSS class** — responsive 2-column grid that stacks to 1 column on mobile (≤768px).
- **`.table-responsive` wrapper** — horizontal scroll wrapper for data tables on narrow screens.
- **Comprehensive media queries** — tablet (≤768px) and phone (≤480px) breakpoints covering padding, typography, cards, badges, buttons, and notification dropdown.

### Changed
- **30+ form pages** — converted inline `gridTemplateColumns: '1fr 1fr'` styles to responsive `.form-row` class across all form pages (expenses, assets, vendors, work orders, consumption, supply requests, settings, spaces).
- **Listing pages** — wrapped all `data-table` instances in `.table-responsive` divs for horizontal scroll on mobile (work orders, expenses, vendors, consumption, spaces, settings).
- **Dashboard page** — stat cards and quick actions now use responsive `.grid-3` class instead of inline 3-column grid.
- **Dashboard work orders table** — wrapped in `.table-responsive` for mobile scroll.
- **Page headers** — now use `.page-header` / `.page-header-info` classes that stack vertically on mobile.
- **Header** — search bar hidden on mobile, padding reduced, hamburger button shown.

### Fixed
- **Voice transcription failing** — Hugging Face deprecated the old `api-inference.huggingface.co` endpoint (returning 410 Gone). Migrated to the new `router.huggingface.co/hf-inference` endpoint and upgraded to `whisper-large-v3-turbo` model.
- **Transcription error messages** — improved error handling to surface actual API errors instead of generic "Could not understand audio" messages.



## [2026-04-02] — Voice Input & AI Transcription

### Added
- **VoiceRecorder component** (`src/components/ui/VoiceRecorder.tsx`) — reusable voice recording UI with idle, recording, review, and transcribing states. Uses browser MediaRecorder API with playback, timer, and error handling.
- **Transcription API route** (`src/app/api/transcribe/route.ts`) — server-side proxy to Hugging Face Whisper Inference API (`openai/whisper-large-v3`). Supports Krio→English translation, model warm-up retries, and output cleaning. API key never exposed to client.
- **Voice input in Work Orders** — 🎤 button next to Description field, transcription autofills into textarea.
- **Voice input in Expenses** — 🎤 button next to Description field.
- **Voice input in Consumption Log** — 🎤 button next to Notes field.
- **Voice input in New Consumable Item** — 🎤 button next to Notes field.
- **Voice input in Supply Requests** — 🎤 button next to new Additional Notes field.
- **Voice recorder CSS** (`globals.css`) — pulse animation, recording/review state styles, responsive layout.

### Notes
- Requires `HUGGING_FACE_API_KEY` in `.env.local` (free tier available at huggingface.co).
- Free Inference API is rate-limited; for production use, consider a dedicated Hugging Face Inference Endpoint.

## [2026-03-31] — RBAC Phase 2: Server-Side Hardening & Auth Refinements

### Added
- **Service role admin client** (`src/lib/supabase/admin.ts`) — dedicated Supabase client using `SUPABASE_SERVICE_ROLE_KEY` for server-side admin operations (user creation, role updates). Bypasses RLS; never exposed to the browser.
- **`refreshAuth()` method** on `AuthProvider` — allows the UI to re-fetch the user profile from the database without a full page reload. Useful after role changes.
- **`onAuthStateChange` listener** in `AuthProvider` — automatically clears auth state on sign-out and reloads profile on sign-in/token refresh.

### Fixed
- **Create-user API** (`src/app/api/admin/create-user/route.ts`) — now uses the admin client (service role key) for `auth.admin.createUser()` instead of the anon key, which was silently failing. Added input validation.
- **Navigation flash** — `RouteGuard` no longer resets the `authorized` state on every navigation. Uses a `useRef` to persist authorization across route changes, eliminating the content flash when clicking sidebar links.
- **Recursive RLS policy** on `public.users` table — the "Admins can manage all users" policy was querying `public.users` from within a policy on `public.users`, causing a 500 Internal Server Error. Fixed by querying `auth.users` metadata instead.

### Changed
- **Settings page** (`src/app/dashboard/settings/page.tsx`) — replaced manual role fetching with `useAuth()` hook for consistency with all other pages.



All notable changes to the Moonthread Facility Management System will be documented in this file.

## [2026-03-31] — Role-Based Access Control (Route & Component Guards)

### Added
- **AuthProvider context** (`src/components/auth/AuthProvider.tsx`) — centralised user session and role state shared across all dashboard pages via `useAuth()` hook. Eliminates duplicate Supabase auth calls.
- **RouteGuard component** (`src/components/auth/RouteGuard.tsx`) — route-level protection that checks user role against `ROUTE_PERMISSIONS` and redirects unauthorised users to `/dashboard` with a polished "Access Restricted" screen.
- **RoleGate component** (`src/components/auth/RoleGate.tsx`) — declarative component-level gating that conditionally renders children based on the current user's role.
- **ROUTE_PERMISSIONS map** (`src/lib/constants.ts`) — comprehensive route-to-role mapping covering all dashboard routes and sub-routes (new, edit, detail pages).

### Changed
- **Dashboard layout** (`src/app/dashboard/layout.tsx`) — wrapped with `AuthProvider` and `RouteGuard`.
- **Sidebar** (`src/components/layout/Sidebar.tsx`) — simplified to use `useAuth()` hook, removing duplicate Supabase user/role fetch.
- **Assets page** — replaced local role fetch with `useAuth()`.
- **Spaces page** — replaced local role fetch with `useAuth()`; gated "Add Area" button behind admin/facility_manager.
- **Work Orders detail page** — replaced local role fetch with `useAuth()`.
- **Action buttons gated across all module pages**:
  - Work Orders: "New Work Order" → admin, facility_manager, staff
  - Vendors: "Add Vendor" / "Add Contract" → admin, facility_manager
  - Expenses: "Add Expense" → admin, facility_manager, cleaning_supervisor
  - Supply Requests: "New Request" → admin, facility_manager, cleaning_supervisor
  - Consumption: "Add Item" → admin, facility_manager, cleaning_supervisor
  - Spaces: "Add Area" → admin, facility_manager
