# Subox

The AI‑powered student housing and campus marketplace.

Subox helps students sublease faster and sell move‑out items with near‑zero friction. Snap‑it‑list‑it: take a few photos, and Subox auto‑writes the description, tags the category, maps the location to your campus area, and publishes a high‑quality listing in minutes.

---

## Why Subox

Students already use dozens of fragmented groups and spreadsheets to find a short‑term place or offload furniture the week before finals. Subox unifies subleasing and move‑out sales into one trusted, searchable marketplace with rich filters for the way students actually decide where to live: commute time to campus, safety, budget, roommates, and vibe.

---

## Key Features

### Lightning‑fast listing creation

1. Lazy upload flow that lets users start with photos first and fill in details later
2. AI‑generated titles and descriptions from images and minimal inputs
3. Auto‑categorization and suggested tags
4. **One‑tap, iMessage‑style creation**  modern UI where users can simply tap quick prompts (e.g., price, location, availability) as chat‑like bubbles instead of filling long forms

### Smart discovery

1. Airbnb‑style that expands campus queries
   * e.g., search for “University of Minnesota” and see broader Minneapolis listings
2. **Commute Map**  users can search not just by address, but by commute time to a specific classroom, lab, or landmark. Select a destination and instantly see colored travel‑time zones overlayed on the map.
3. Commute filters by walking, biking, transit, or driving time to selected campus buildings
4. Interactive map with clustering, price overlays, and saved‑search alerts

### Trust and safety

1. School‑verified profiles and optional .edu verification
2. In‑app messaging with limited‑share contact reveals
3. Flagging, rate‑limit, and fraud heuristics

### Move‑out sale flow

1. Camera‑first item posting with AI category + price suggestions
2. Bulk‑upload from camera roll and quick‑list templates
   
### Creator‑friendly details

1. Polished UI with Framer Motion micro‑interactions
2. Mobile‑first PWA that installs from the browser
---

## Architecture

**Frontend**  Next.js + React + TypeScript + Tailwind CSS + Framer Motion

**Backend**  Firebase Authentication, Firestore, Cloud Storage, Cloud Functions

**Search**  Algolia indices for listings and users

**AI**

* Text generation and normalization for listing titles, descriptions, and tags

**Maps**  Google Maps JavaScript API with custom campus overlays and travel time matrix

---

## Data Model

### Firestore collections

* `listings`  core marketplace documents
* `users`  profile, verification, preferences, saved searches
* `messages`  conversation threads and message documents
* `campuses`  normalized campus data and polygon bounds
* `analytics`  lightweight event logs for insights

### Listing document shape

```json
{
  "title": "Sunny room near Dinkytown",
  "type": "sublease|item",
  "price": 850,
  "currency": "USD",
  "deposit": 0,
  "availability": { "start": "2025-09-15", "end": "2026-05-31" },
  "location": { "lat": 44.98, "lng": -93.23, "placeId": "...", "campusId": "umn-tc" },
  "commute": { "toBuildingId": "keller-hall", "mode": "walk", "minutes": 12 },
  "amenities": ["furnished", "laundry", "pets"],
  "images": ["gs://subox/.../a.jpg", "gs://subox/.../b.jpg"],
  "ownerId": "user_abc",
  "status": "active",
  "ai": { "tags": ["studio", "near-campus"], "confidence": 0.87 },
  "createdAt": 1724800000,
  "updatedAt": 1724800000
}
```

---

## Getting Started

### Prerequisites

* Node.js 18+
* Yarn or npm
* Firebase project with Authentication, Firestore, and Storage enabled
* Algolia application and admin key
* Google Maps JavaScript API key

### Installation

```bash
# clone
git clone https://github.com/your-org/subox.git
cd subox

# install deps
yarn
# or
npm install

# run dev server
yarn dev
# or
npm run dev
```
---

## Development

### Project structure

```
src/
  app/                Next.js app router pages
  components/         UI components and shadcn/ui wrappers
  lib/                Firebase, Algolia, and utility clients
  features/
    listings/         create, edit, view flows
    search/           SearchLocationPicker and map
    profile/          user settings and verification
  styles/             Tailwind config and globals
  functions/          Firebase Cloud Functions
```

### Useful scripts

```bash
# typecheck
npm run typecheck

# lint
npm run lint

# build
npm run build

# emulators
npm run emu
```

### SearchLocationPicker and Commute Map behavior

* Accepts campuses, buildings, neighborhoods, and free‑typed addresses
* Expands a campus query into a polygonal area and returns listings in the broader region
* Commute Map overlays travel‑time zones by walk, bike, transit, or drive to a chosen destination
* Debounced geocoding and Algolia query to reduce API calls

### AI description generator

* Server action calls a text model with a structured prompt
* Normalizes style  concise, factual, no emojis, includes key amenities
* Post‑process for safety and price guidance

---

## Deployment

* **Hosting**  Vercel or Firebase Hosting
* **Functions**  Deployed via Firebase CLI
* **Search indexing**  Trigger Cloud Function on `listings` create/update/delete
* **Analytics**  Export Firestore events to BigQuery for insights

---

## Security and Privacy

* Email/SSO sign‑in with optional .edu verification
* Abuse prevention  IP throttling, image moderation, and fraud rules
* Firestore rules enforce per‑field access and listing ownership

---

## Contributing

Pull requests are welcome. For larger changes, open an issue describing the problem and proposed approach. Please run tests and linting before submitting.

---

## License

MIT
