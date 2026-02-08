# Viewer UI File Map (Frontend)

Purpose: map all viewer-interface files and related cross-interface references, with line ranges for safe UI-only changes.

Generated from frontend scan (line references based on current codebase).

---

## Core Viewer Pages

### `frontend/src/pages/MainPage.jsx`
- Lines 42-56: error component and setup
- Lines 58-132: `MainPage()` logic (section click, icon map)
- Lines 133-333: render tree

### `frontend/src/pages/VideoPage.jsx`
- Lines 32-69: `VideoPage()` setup
- Lines 160-206: playback + progress tracking + completion threshold
- Lines 207-285: reward completion flow + next video handling
- Lines 291-463: render branches (loading/error/empty)
- Lines 365-660: main render tree (video player + UI)

### `frontend/src/pages/ProfilePage.jsx`
- Lines 37-119: `ProfilePage()` setup + render branches

### `frontend/src/pages/CreditPage.jsx`
- Lines 42-151: `CreditPage()` setup + state
- Lines 152-197: helpers (amount formatting, icons/colors)
- Lines 198-355: render tree

---

## Viewer Layout & Navigation

### `frontend/src/components/ViewerLayout.jsx`
- Lines 37-82: `ViewerLayout()` setup
- Lines 83-197: drawer + nav items
- Lines 198-308: main render tree

---

## Viewer Components

### `frontend/src/components/SectionVideos.jsx`
- Lines 21-93: `SectionVideos()` setup + fetch logic
- Lines 94-150: handlers + render branches
- Lines 182-223: main render tree

### `frontend/src/components/AllAdsTab.jsx`
- Lines 18-113: `AllAdsTab()` setup + fetch logic
- Lines 114-182: render branches
- Lines 183-213: main render tree

### `frontend/src/components/TikTokVideoPlayer.jsx`
- Lines 87-366: `TikTokVideoPlayer()` setup + state
- Lines 392-460: completion/threshold tracking
- Lines 469-868: reward flow + navigation handling
- Lines 869-2111+: full render tree (player UI)

### `frontend/src/components/CreditBar.jsx`
- Lines 26-70: `CreditBar()` setup
- Lines 71-106: formatting helpers
- Lines 107-363: render tree

---

## Viewer API & Route Wiring

### `frontend/src/api/viewer.js`
- Lines 35-59: `startWatchingAd()`, `completeWatchingAd()`
- Lines 73-105: viewer data endpoints (`getSections`, `getVideos`, `getAllAdsRandomly`)

### `frontend/src/App.jsx` (viewer route wiring)
- Lines 56-65: `/viewer` routes (MainPage, SectionVideos, VideoPage, ProfilePage, CreditPage)
- Lines 68-82: duplicate `/profile` and `/credits` routes (viewer-only)

### `frontend/src/components/PrivateRoute.jsx`
- Lines 66-75: role redirects (viewer → `/viewer`, advertiser → `/advertiser`, admin → `/admin/dashboard`)

### `frontend/src/components/LoginForm.jsx`
- Lines 88-91: post-login navigation by role

---

## Cross‑Interface Intersections (Viewer ↔ Advertiser/Admin)

### Shared with Advertiser
- `frontend/src/pages/CreditPage.jsx`
  - Role-based API selection and UI differences (lines ~73-81, ~207-213)
- `frontend/src/components/CreditBar.jsx`
  - Shared credit display component

### Shared with Admin (viewer data surfaces)
- `frontend/src/pages/AdminUsers.jsx`
  - Viewer stats/filters (lines ~90, 108, 121, 329, 724-728)
- `frontend/src/pages/AdminVerify.jsx`
  - Viewer verification counts (lines ~126, 137, 245-248)
- `frontend/src/pages/CompanyDashboard.jsx`
  - Viewer rewards/stats (lines ~75-119, 237-240, 569-575)

---

## Notes
- When redesigning viewer UI, focus changes inside the viewer pages/components and avoid touching shared admin/advertiser files unless required.
- Reward/credit flows are concentrated in `VideoPage.jsx` and `TikTokVideoPlayer.jsx`.
