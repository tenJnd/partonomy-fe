# SaaS App UI/UX Specification

This document defines the core layout, navigation structure, and UX principles for the machining-drawing processing SaaS tool.

---

# **1. App Layout Overview**

The application uses a three‑section layout:

## **1.1 Top Navigation Bar**

* Logo (left)
* Organization selector (dropdown)
* User profile menu (right)
* Optional: billing status, plan badge, notifications

## **1.2 Left Sidebar Navigation**

Contains primary navigation tabs:

* **Documents** (default)
* **Parts**
* **Settings**

Planned future primary tab:

* **Assemblies** (groups of Parts)

* **Documents** (default)

* **Parts**

* **Settings**

Optional future tabs:

* **Assemblies** (future; 1 Assembly = N Parts)
* **Integrations** (e.g., SharePoint connector)
* **Team / Members**
* **Billing**
* **Activity Log**

The sidebar is collapsible.

## **1.3 Main Content Area**

Dynamic section where the pages render:

* Documents list view
* Document detail view
* Parts list view
* Part detail view
* Settings pages

Each page follows a consistent layout:

* Page title
* Filters / search bar (when applicable)
* Content grid or table
* Right‑side slide‑over panel for detail views (optional future upgrade)

---

# **2. Global UX Principles**

## **2.1 Clarity First**

The user must understand at a glance:

* what is happening now (status)
* what requires attention
* what was processed recently

## **2.2 Realtime Feedback**

Documents and parts update automatically via Supabase realtime channels. No manual refresh.

## **2.3 1 Document → 1 Part (Happy Path)**

Communicate this clearly, but handle multi‑part documents gracefully.

## **2.4 Minimal Cognitive Load**

Default list views must show only the essentials.
Detailed machining info is hidden in expandable sections.

## **2.5 Progressive Disclosure**

Users see:

* Summary first
* Important details second
* Raw JSON only if requested

---

# **3. Navigation Structure**

```
Top Bar
 └── Org Selector
 └── Profile Menu

Left Sidebar
 ├── Documents
 │    └── Document List View
 │    └── Document Detail View
 │
 ├── Parts
 │    └── Part List View
 │    └── Part Detail View (with linked Documents)
 │
 └── Settings
      ├── General
      ├── Organization
      ├── Members
      ├── Integrations
      └── Billing
```

---

# **4. Page Layout Templates**

## **4.1 List Page Template (Documents / Parts)**

**Header Row:**

* Page title
* Search bar
* Filters
* Upload button (Documents only)

**Body:**

* Responsive grid or table of tiles
* Each tile shows key metadata
* Status badges (Queued, Processing, Success, Error)

**Footer:**

* Pagination

---

## **4.2 Detail Page Template (Document / Part)**

**Left column:**

* Main info (title, status, metadata)
* Summary
* Key attributes (material, envelope, complexity)

**Right column:**

* Thumbnail / preview (if applicable)
* Related items:

  * Document → Parts
  * Part → Documents

**Expandable sections:**

* Detailed report
* Features & GD&T
* Raw JSON (debug)
* Job history

---

# **5. Components Library (High-Level)**

## **5.1 Tiles**

Standardized card for any entity:

* Icon/thumbnail
* Title
* Subtitles (part ID, status, material)
* Status pill

## **5.2 Status Badges**

* **Queued** – gray
* **Processing** – yellow spinner
* **Success** – green
* **Error** – red

## **5.3 Filters & Search**

* Full text search (file name, part ID)
* Status filter
* Date range

## **5.4 Panel / Slide-over (optional)**

For quick document previews.

---

# **6. Responsive Behavior**

## Desktop

* Full three‑pane layout

## Tablet

* Sidebar collapses
* Grids become 2‑column

## Mobile

* Bottom navigation
* Single column lists
* Reduced detail sections

---

# **7. Future UI Extensions**

* Revision comparison view (side-by-side diff)
* SharePoint folder browser
* Drag‑and‑drop mapping of documents to parts
* AI insights panel
* Team activity feed

---

# **8. Documents View (Main Panel)**

This section describes the UX, layout, component structure, and Supabase queries used to populate the **Documents** list view.

---

## **8.1 Purpose of the Documents View**

The Documents tab serves as the primary "inbox" where users upload, review, and monitor the processing status of engineering drawings.

**User goals:**

* Upload documents (single or batch)
* Monitor processing status in realtime
* Quickly preview thumbnails
* See extracted part numbers / metadata
* Filter by status or date
* Open document detail view

This is the default landing page after selecting an organization.

---

## **8.2 Page Structure**

```
[ Top Bar ]
[ Left Sidebar ]   [ Main Panel: Documents List ]
```

### **Main Panel Sections:**

1. **Header row**

   * Title: "Documents"
   * Search bar
   * Status filter (All / Queued / Processing / Success / Error)
   * Date filter
   * Upload button

2. **Documents Grid (Tiles)**

   * Responsive grid layout (3–5 columns depending on screen width)
   * Each tile shows:

     * Thumbnail
     * File name
     * Detected Part (if available)
     * Status badge
     * Last processed timestamp

3. **Pagination footer**

---

## **8.3 Tile Component Specification**

This section now also includes a **three‑dot contextual actions menu** available on every Document tile.**

This section includes **three interaction states** for tiles:

* **Collapsed tile** (default)
* **Expanded tile** (first click)
* **Full detail navigation** (second click)

### **8.3.0 Tile Interaction Model (3‑Stage UX)**

#### **Stage 1 — Collapsed Tile (Default)**

A compact row‑style tile for easier scanning, with a **three‑dot actions menu** in the top‑right corner.

**Available actions (collapsed or expanded):**

* **Open latest document** (if available)
* **Export part report (PDF/JSON)**
* **Copy part number**
* **Open in ERP / external system** (future integration)
* **Delete part** (if org permissions allow and safe to do so)

Shows only the essential identifiers:

* Part ID / part_number
* Short description
* Revision
* Last updated timestamp
* Complexity badge (optional)

**Click on the tile body → expands tile inline** (no navigation yet)
A three‑dot actions menu is available in the top‑right corner of the tile.

**Available actions (collapsed or expanded):**

* **Download original file**
* **Export report (PDF/JSON)**
* **View raw JSON** (debug mode only)
* **Reprocess document** (optional)
* **Delete document** (if org permissions allow)
  **
  Visible in the grid.
  Shows minimal info:
* Thumbnail
* File name
* Status badge
* Detected part (if 1:1)

**Click → expands tile inline**
(No page navigation yet.)

---

#### **Stage 2 — Expanded Tile (Inline Preview)**

Tile grows vertically (not fullscreen). Shows richer info:

* Main part ID (if single‑part)
* Revision
* Quick summary (1–2 short lines)
* Processing timestamp
* If multi‑part: label **“Contains N parts”**

**Click again → navigate to full Document Detail page**

Optional additional inline controls:

* Download
* Reprocess
* Open Part Detail (if single‑part)

---

#### **Stage 3 — Full Document Detail Page**

Standard full detail view (defined later in section 11).

---

### **8.3.1 Tile Layout (Collapsed)**

```
┌───────────────────────────────┐
│ [Thumbnail]                   │
├───────────────────────────────┤
│ file_name.pdf                 │
│ Part: FR20517                 │
│ Status: [SUCCESS]             │
└───────────────────────────────┘
```

### **8.3.2 Tile Layout (Expanded)**

```
┌────────────────────────────────────────────┐
│ [Thumbnail larger or unchanged]           │
├────────────────────────────────────────────┤
│ file_name.pdf                             │
│ Part: FR20517 (Rev A)                     │
│ Quick summary: "Aluminum flange..."       │
│ Processed: 2025‑01‑10                     │
│ If multi‑part: "Contains 3 parts"         │
└────────────────────────────────────────────┘
```

Click → **Document Detail Page****

### **Tile Layout**

```
┌───────────────────────────────┐
│ [Thumbnail]                   │
│                               │
├───────────────────────────────┤
│ file_name.pdf                 │
│ Part: FR20517 (if available)  │
│ Status: [SUCCESS]             │
│ Processed: 2025-01-10         │
└───────────────────────────────┘
```

### **Tile Interaction**

* **Click anywhere** → opens Document Detail page
* **On hover** → shows secondary actions:

  * Download
  * Reprocess (optional)
  * Open raw JSON (optional / debug mode)

---

## **8.4 Supabase Queries for Documents View**

Below are recommended queries and patterns implemented in the FE.

### **8.4.1 Fetch documents list**

```js
const pageSize = 20;

const { data: docs, count } = await supabase
  .from('documents')
  .select(`
    id,
    file_name,
    last_status,
    last_error,
    last_thumbnail_key,
    storage_key,
    created_at,
    last_processed_at,
    detected_part_id
  `, { count: 'exact' })
  .eq('org_id', currentOrgId)
  .order('created_at', { ascending: false })
  .range(page * pageSize, page * pageSize + pageSize - 1);
```

### **8.4.2 Getting public thumbnail URL**

```js
const { data: { publicUrl } } = supabase.storage
  .from('rfq-thumbnails')
  .getPublicUrl(doc.last_thumbnail_key);
```

### **8.4.3 Filtering by status**

```js
.eq('last_status', selectedStatus)
```

If `selectedStatus === 'all'` → omit.

### **8.4.4 Realtime updates via Postgres changes**

```js
const channel = supabase
  .channel('documents-realtime')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'documents',
      filter: `org_id=eq.${currentOrgId}`,
    },
    payload => {
      const updated = payload.new;
      updateLocalDocumentList(updated);
    }
  )
  .subscribe();
```

### **8.4.5 Upload new documents**

Handled via:

1. Upload to storage
2. Insert into documents
3. Trigger an RPC to enqueue a new job

```js
const storagePath = `org-${currentOrgId}/${Date.now()}-${file.name}`;

await supabase.storage
  .from('rfq-documents')
  .upload(storagePath, file);

const { data: doc } = await supabase
  .from('documents')
  .insert({
    org_id: currentOrgId,
    user_id: user.id,
    file_name: file.name,
    storage_key: storagePath,
    last_status: 'queued'
  })
  .select()
  .single();

await supabase.rpc('enqueue_job', {
  _org_id: currentOrgId,
  _document_id: doc.id,
});
```

---

## **8.5 UX Behavior**

### **Realtime UI Updates**

* Tiles immediately update when:

  * job starts → document.last_status = "processing"
  * job finishes → status → success/error
  * thumbnails arrive → tile updates preview

### **Empty State**

If org has no documents:

* Show upload box
* Show example sample PDF
* Short tip: "Upload machining drawings to extract parts and manufacturability data."

### **Error State**

If processing fails:

* Tile shows red status
* Tooltip: last_error message

---

## **8.6 Document Upload & Processing Flow**

This subsection defines the end-to-end flow for handling uploaded documents and how the the Documents tab reflects each step.

### **8.6.1 High-Level Flow**

1. User selects one or more files in the Documents tab (drag & drop or file picker).
2. For each file:

   * Check subscription / quota limits.
   * If allowed:

     * Upload file to Supabase Storage.
     * Create a `documents` row.
     * Enqueue a `jobs` row via RPC.
   * If not allowed:

     * Do **not** upload or insert.
     * Show a clear UI error (plan limit reached / billing inactive).
3. Background pipeline processes jobs:

   * Reads file from Storage.
   * Runs parsing + analysis.
   * Writes results into `jobs.result_json`.
   * Updates `documents` (status, timestamps, detected part info, thumbnail key).
   * Upserts into `parts` and `document_parts`.
4. Documents tab updates in realtime via Postgres changes.

---

### **8.6.2 Subscription / Quota Check**

The quota check should happen **before** job creation. Recommended pattern:

* Expose a Postgres function `enqueue_job(_org_id, _document_id)` that:

  * Verifies that the organization has an active subscription.
  * Verifies that the org has not exceeded its monthly/plan quota.
  * If OK:

    * Inserts a new row into `jobs` with status = `queued`.
  * If NOT OK:

    * Raises a specific error (e.g., `job_quota_exceeded`, `billing_inactive`).

Frontend behavior:

* If RPC error indicates quota/billing issue:

  * Show a banner: e.g. "Plan limit reached. Upgrade your plan to process more documents."
  * Optionally mark the related document tile with a special status (e.g., `limit_exceeded`).

---

### **8.6.3 Document Status Lifecycle**

Documents have a `last_status` field that reflects the latest known processing state.

Suggested statuses:

* `queued`
* `processing`
* `success`
* `error`
* (optional) `limit_exceeded`

State transitions:

1. **On insert** into `documents`:

   * `last_status = 'queued'`
2. **When a worker starts processing a job** for this document:

   * Update `jobs.status = 'processing'`
   * Optionally update `documents.last_status = 'processing'`
3. **On successful completion**:

   * `jobs.status = 'success'`
   * `jobs.result_json` populated
   * `documents.last_status = 'success'`
   * `documents.last_processed_at` set
   * `documents.last_job_id` set
   * `documents.detected_part_id` (if single-part) or left null
   * `documents.last_thumbnail_key` set if thumbnail generated
4. **On failure**:

   * `jobs.status = 'error'`
   * `jobs.error_message` set
   * `documents.last_status = 'error'`
   * `documents.last_error` (optional) set from job

The UI subscribes to `documents` changes and refreshes tile appearance accordingly.

---

### **8.6.4 Documents Tab UI States During Upload**

For each file selected for upload, the UI may show a temporary local state before the row exists in the database:

1. **Pre-upload (client-side only)**

   * Show a temporary tile with status "Uploading…".

2. **After successful Storage upload + `documents` insert**

   * Replace temporary tile with a real tile bound to the new `documents.id`.
   * Status: `queued`.

3. **After `enqueue_job` RPC success**

   * Tile remains `queued` until worker picks it up.

4. **On realtime updates**

   * Tile transitions to `processing`, then `success` / `error`.

5. **On quota / billing error**

   * Do not create job.
   * Tile may:

     * either be removed (if you decide not to store the document at all), or
     * remain with a special status `limit_exceeded` and tooltip asking user to upgrade.

Recommended UX:

* If quota check fails, do **not** store document at all (to avoid confusion). Show a clear error toast / banner instead.

---

### **8.6.5 Background Processing & Data Writes**

The backend pipeline (worker) performs the heavy lifting:

1. Fetch `jobs` where `status = 'queued'`.
2. For each job:

   * Set `status = 'processing'`.
   * Load file from `rfq-documents` bucket using `documents.storage_key`.
   * Run parsing + analysis.
   * Write structured result into `jobs.result_json`.
   * Generate thumbnail → write to `rfq-thumbnails` bucket.
   * Update `documents` row:

     * `last_status = 'success'` or `'error'`
     * `last_processed_at = now()`
     * `last_job_id = jobs.id`
     * `last_thumbnail_key`
     * `detected_part_id` if applicable
   * Upsert `parts` and `document_parts` based on parsed part data.

The Documents tab does **not** call the worker directly; it only reacts to database changes.

---

### **8.6.6 User Feedback & Notifications**

* When a batch of files is uploaded:

  * Show a short toast: "Uploading X documents…"
  * After successful enqueue: "X documents queued for processing."
* On errors (quota, storage, RPC failures):

  * Show explicit error messages with short, actionable text.
  * Example: "You reached the limit of your current plan. Upgrade in Settings → Billing."

---

# **10. Search (Reserved)**

*Search functionality will be added in the future. Full‑text and vector search features have been intentionally removed from the current specification.*

# END OF SECTION

### **Realtime UI Updates**

* Tiles immediately update when:

  * job starts → document.last_status = "processing"
  * job finishes → status → success/error
  * thumbnails arrive → tile updates preview

### **Empty State**

If org has no documents:

* Show upload box
* Show example sample PDF
* Short tip: "Upload machining drawings to extract parts and manufacturability data."

### **Error State**

If processing fails:

* Tile shows red status
* Tooltip: last_error message

---

# **9. Parts View (Main Panel)**

This section describes the UX, layout, and Supabase interactions for the **Parts** list view.

---

## **9.1 Purpose of the Parts View**

The Parts tab provides a consolidated view of **unique parts** detected across all documents within an organization.

**User goals:**

* See a catalog of all parts encountered so far
* Quickly find a specific part by part number or description
* Open a part to see its details and related documents
* Identify newly processed or recently updated parts

The Parts view is especially useful for:

* Process engineers
* Technologists
* Quality / engineering managers

---

## **9.2 Page Structure**

```
[ Top Bar ]
[ Left Sidebar ]   [ Main Panel: Parts List ]
```

### **Main Panel Sections:**

1. **Header row**

   * Title: "Parts"
   * Search bar (part ID, description)
   * Filters (e.g., by complexity, material)
   * (Optional) Sort selector (last updated, created date, part ID)

2. **Parts Grid (Tiles)**

   * Responsive grid layout or table-like list
   * Each tile shows:

     * Part ID / part_number (from meta)
     * Short description (from meta)
     * Latest revision (if available)
     * Material (if available)
     * Last updated / last_job_at timestamp
     * Complexity indicator (e.g., Low/Medium/High)

3. **Pagination footer**

---

## **9.3 Tile Component Specification (Part Tile)**

This section includes the same 3‑stage tile interaction model used for Documents **and** a three‑dot contextual actions menu on each Part tile.

This section includes **the same 3‑stage tile interaction model** used for Documents:

* **Collapsed tile** (default)
* **Expanded tile** (first click)
* **Full Part Detail navigation** (second click)

### **9.3.0 Tile Interaction Model (3‑Stage UX)**

#### **Stage 1 — Collapsed Tile (Default)**

A compact row‑style tile for easier scanning.
Shows only the essential identifiers:

* Part ID / part_number
* Short description
* Revision
* Last updated timestamp
* Complexity badge (optional)

**Click → expands tile inline** (no navigation yet)

---

#### **Stage 2 — Expanded Tile (Inline Preview)**

Tile grows vertically to reveal richer info:

* Full description
* Material
* Revision
* Latest processing summary (1–2 lines)
* Latest document link ("Last seen in FR20517_RA.pdf")
* Last updated timestamp (formatted)

**Click again → navigate to full Part Detail page**

Optional inline actions:

* Open latest document
* Copy part number
* Open in ERP (future integrations)

---

#### **Stage 3 — Full Part Detail Page**

Navigates to the dedicated Part Detail view.
Described later in section 12.

---

### **9.3.1 Tile Layout (Collapsed)**

```
┌─────────────────────────────────────────────────────────┐
│ FR20517 (Rev A)                                         │
│ "Servomotor flange"                                    │
│ Last updated: 2025‑01‑12 14:32   Complexity: HIGH       │
└─────────────────────────────────────────────────────────┘
```

This layout uses **one row** with minimal whitespace.

---

### **9.3.2 Tile Layout (Expanded)**

```
┌─────────────────────────────────────────────────────────┐
│ FR20517 (Rev A)                                         │
│ "Servomotor flange for motor assembly…"                │
│ Material: EN AW‑6082‑T6                                 │
│ Summary: "Flange with tight tolerance on bore…"        │
│ Last seen in: FR20517_RA.pdf                            │
│ Last updated: 2025‑01‑12 14:32                          │
└─────────────────────────────────────────────────────────┘
```

Click again → **Part Detail Page** (Part Tile)**

### **Tile Layout**

```
┌─────────────────────────────────────┐
│ Part: FR20517 (Rev A)              │
│ "Servomotor flange"               │
│ Material: EN AW-6082-T6           │
│ Complexity: HIGH                   │
│ Last updated: 2025-01-12 14:32     │
└─────────────────────────────────────┘
```

Fields are derived from `parts.meta` JSON.

### **Tile Interaction**

* **Click anywhere** → opens Part Detail view
* Optional hover actions:

  * Open latest document
  * Open in ERP (if integration exists)

---

## **9.4 Supabase Queries for Parts View**

### **9.4.1 Fetch parts list**

```js
const pageSize = 20;

const { data: parts, count } = await supabase
  .from('parts')
  .select(`
    part_id,
    org_id,
    meta,
    latest_job_id,
    created_at,
    last_updated,
    last_job_at
  `, { count: 'exact' })
  .eq('org_id', currentOrgId)
  .order('last_job_at', { ascending: false })
  .range(page * pageSize, page * pageSize + pageSize - 1);
```

**Notes:**

* `meta` is a JSONB field that should contain:

  * `meta.part_number`
  * `meta.revision`
  * `meta.description`
  * `meta.material`
  * `meta.complexity` (Low/Medium/High)

### **9.4.2 Search by part ID / description**

Frontend should apply a text search on selected fields inside `meta`.
Depending on the indexing strategy, either:

* client-side filter (for small orgs), or
* server-side text search (preferred for scale).

Example simple server-side filter (if `meta.part_number` is also materialized into a separate column like `part_number`):

```js
let query = supabase
  .from('parts')
  .select(`
    part_id,
    org_id,
    meta,
    latest_job_id,
    created_at,
    last_updated,
    last_job_at
  `, { count: 'exact' })
  .eq('org_id', currentOrgId);

if (searchTerm) {
  query = query.ilike('part_number', `%${searchTerm}%`);
}

const { data: parts, count } = await query
  .order('last_job_at', { ascending: false })
  .range(page * pageSize, page * pageSize + pageSize - 1);
```

(If there is no dedicated `part_number` column, consider adding it for performance and UX.)

### **9.4.3 Filter by complexity or material**

If `meta.complexity` and `meta.material` are projected into columns (e.g., `complexity`, `material`):

```js
if (selectedComplexity && selectedComplexity !== 'all') {
  query = query.eq('complexity', selectedComplexity);
}

if (selectedMaterial && selectedMaterial !== 'all') {
  query = query.eq('material', selectedMaterial);
}
```

### **9.4.4 Realtime updates for parts**

Subscribe to changes in `parts` to reflect newly processed or updated parts:

```js
const partsChannel = supabase
  .channel('realtime:parts')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'parts',
      filter: `org_id=eq.${currentOrgId}`,
    },
    payload => {
      const updatedPart = payload.new;
      updateLocalPartList(updatedPart);
    }
  )
  .subscribe();
```

---

## **9.5 UX Behavior**

### **Highlight recently updated parts**

Parts that have been processed in the last N seconds/minutes can be visually highlighted, e.g.:

* Blue dot
* "Just updated" badge

Example logic:

```js
const isRecentlyUpdated = (lastJobAt) => {
  if (!lastJobAt) return false;
  const deltaMs = Date.now() - new Date(lastJobAt).getTime();
  return deltaMs < 20_000; // 20 seconds
};
```

### **Empty State**

If there are no parts yet for the org:

* Show guidance: "Parts appear here after you upload and process documents."
* CTA: "Go to Documents to upload your first drawing."

### **Error State**

If parts cannot be loaded:

* Show an inline error message
* Retry button to refetch from Supabase

---

## **9.6 Relationship to Documents View**

* Each Part is derived from one or more Documents.
* Clicking a Part opens the Part Detail view, which includes:

  * Latest extracted data for the part
  * A list of related Documents (via `document_parts`)
* From the Document Detail view, the user can navigate back to the associated Part.

---

# END OF SECTION — more sections will be appended as the spec evolves.

---

# **13. Document Detail View (MVP)**

This section defines the MVP-level UX for the **Document Detail** page.

The goal is to keep the page **lightweight and fast**, focused on:

* visual inspection of the drawing (large PNG preview),
* quick understanding of the extracted part(s),
* simple navigation between parts within the same document,
* basic editing of key fields,
* export / download actions.

No heavy PLM-style workflows are included in the MVP.

---

## **13.1 Purpose**

The Document Detail view allows the user to:

* See a **large, zoomable PNG preview** of the drawing.
* Open / download the **original file** (PDF/PNG/JPEG/etc.).
* View high-level **document metadata** (status, timestamps, source).
* Step through **parts extracted from this document** (1 or N parts).
* For the currently selected part:

  * see summary, material, envelope, and key info,
  * expand additional sections with more details (risks, notes, etc.),
  * edit key fields and save.

This view is opened by clicking a Document tile **twice** (collapsed → expanded → detail), or via a direct deep link.

---

## **13.2 Layout**

Two-column layout inside the main content area:

```
[ Top Bar ]
[ Left Sidebar ]   [ Document Detail ]

Document Detail:

┌─────────────────────────────────────────────────────────────┐
│ Header: file name, status, primary actions                 │
├─────────────────────────────────────────────────────────────┤
│ Left column                      │ Right column             │
│ (parts & details, editable)      │ (large PNG preview)      │
└─────────────────────────────────────────────────────────────┘
```

### **13.2.1 Header**

Elements:

* File name (e.g. `FR20517_RA.pdf`)
* Status badge (Queued / Processing / Success / Error)
* Source (Upload / API / SharePoint)
* Last processed timestamp
* Primary actions (buttons):

  * **Download original file**
  * **Export report (PDF)**
  * **Export JSON**

---

## **13.3 Right Column – Large PNG Preview**

### **13.3.1 PNG Preview Basics**

* Always show a **large PNG image** of the drawing generated by the backend.
* Viewer behavior:

  * Max width/height chosen to fit typical desktop viewport.
  * Zoomable (scroll-to-zoom or +/- controls).
  * Pannable (click + drag or touch drag).
* If the document has multiple pages:

  * Add a simple page selector (e.g. `Page 1 / 2 / 3…`) above the viewer.

The PNG is mainly **for visual context**; part selection on the left changes the *info panel*, but the image typically stays the same page unless explicitly changed by the user.

Data source:

* `documents.preview_png_key` (preferred) or `documents.last_thumbnail_key`.

```js
const { data: { publicUrl: previewUrl } } = supabase.storage
  .from('rfq-previews') // or 'rfq-thumbnails'
  .getPublicUrl(doc.preview_png_key || doc.last_thumbnail_key);
```

### **13.3.2 Link to Original File**

Above or below the PNG preview, show:

* Button: **"Open original file"**

  * Opens the original document from `rfq-documents` bucket in a new tab.

```js
const { data: { publicUrl: originalUrl } } = supabase.storage
  .from('rfq-documents')
  .getPublicUrl(doc.storage_key);
```

---

## **13.4 Left Column – Parts & Detail Panel**

The left column is the main **information and interaction** area.
It is structured as:

1. **Document metadata** (read-only)
2. **Part navigation** (for 1..N parts in the document)
3. **Current part detail** (summary, material, envelope, etc.)
4. **Expandable detail sections**
5. **Edit + save for key fields**

### **13.4.1 Document Metadata (Read-only)**

Small block at the top:

* Document ID
* File name
* Upload date
* Processed date
* Status
* Number of detected parts:

  * `1 part detected` or `Contains 3 parts`

If there is a known main part:

* Show: `Main part: FR20517`.

### **13.4.2 Part Navigation (1..N parts)**

Directly under document metadata, show a **"Current part" panel**:

* Label: `Part 1 of N`.
* Part identifier: `FR20517 (Rev A)`.
* Left/right arrows to switch between parts:

  * `<` previous part
  * `>` next part
* Optional dropdown: quick jump to any part in the document.

Behavior:

* If the document has only **1 part**, arrows are hidden.
* If the document has **N > 1 parts**, arrows and `"Part X of N"` are visible.
* Changing the current part updates the **detail panel below** (summary, material, etc.).

Data source:

* `document_parts` joined with `parts` (see 13.5).
* For MVP, if `document_parts` is not yet populated, we can fall back to `detected_part_id` only.

---

### **13.4.3 Current Part – Key Info (Summary Block)**

For the currently selected part (based on the part navigation above), show a compact, high-signal block:

Fields (read-only initially, some editable later):

* **Summary** (1–2 sentences)
* **Material** (e.g. `EN AW-6082-T6`)
* **Envelope** (e.g. `Ø56.96 × 10.00 mm`)
* **Complexity / risk level** (badge: Low / Medium / High)

This block answers: *"Co to je a jak moc je to náročné?"* at a glance.

---

### **13.4.4 Editable Fields (Per Current Part)**

Below the summary block, provide an **editable form** for key fields of the current part.

MVP editable fields:

* Part number
* Revision
* Part name / short description
* Material (optional)
* Internal note (free text)

Behavior:

* Fields are pre-filled from system-extracted values (coming from parsed data for that part).
* User edits them and clicks **Save**.
* Values are stored as **overrides**.

**Storage strategy (MVP):**

* To keep implementation simple and document-centric, overrides can be stored in `documents.user_meta` as a map keyed by part_id, for example:

```json
{
  "parts_overrides": {
    "FR20517": {
      "part_number_override": "FR20517",
      "revision_override": "A",
      "description_override": "Custom name from user",
      "material_override": "EN AW-6082-T6",
      "notes": "Internal note for this doc+part"
    }
  }
}
```

This keeps the MVP simple and tied to the **document context** (1 document = 1 main part is the happy path). A later iteration can move overrides to `parts.user_meta` when needed.

Frontend merge logic:

* Display override if present.
* Fallback to system value otherwise.

Save example:

```js
const updatedUserMeta = {
  ...(doc.user_meta || {}),
  parts_overrides: {
    ...(doc.user_meta?.parts_overrides || {}),
    [currentPartId]: {
      part_number_override: formValues.partNumber,
      revision_override: formValues.revision,
      description_override: formValues.description,
      material_override: formValues.material,
      notes: formValues.notes,
    },
  },
};

await supabase
  .from('documents')
  .update({ user_meta: updatedUserMeta })
  .eq('id', documentId);
```

---

### **13.4.5 Expandable Detail Sections (Placeholders Allowed)**

Below the editable block, use collapsible sections where most content can be initially **placeholder** text driven from the parsed JSON.

Suggested sections:

1. **Quick summary** (expanded by default)

   * 1–3 sentences about the part and its intent.
2. **Risks / manufacturing notes** (collapsed by default)

   * bullet list of key risks, e.g. tight tolerances, thin walls, coatings.
3. **Suggested machining notes** (collapsed by default)

   * optional, high-level operation hints.
   * For MVP, can be simple placeholder like: "Detailed process suggestions will be added in a later version."
4. **Other extracted notes** (collapsed)

   * general notes from the drawing (e.g., remove burrs, apply coating before/after, etc.).
5. **Raw JSON (debug)** (collapsed)

   * pretty-printed section showing `jobs.result_json`, only for advanced users/dev.

The key is **progressive disclosure**: user sees summary and basic fields by default, everything else is opt-in.

---

## **13.5 Supabase Data Access – Document Detail**

### **13.5.1 Fetch document**

```js
const { data: doc, error } = await supabase
  .from('documents')
  .select(`
    id,
    org_id,
    file_name,
    storage_key,
    last_status,
    last_error,
    last_thumbnail_key,
    preview_png_key,
    created_at,
    last_processed_at,
    last_job_id,
    detected_part_id,
    detected_parts_count,
    user_meta
  `)
  .eq('id', documentId)
  .single();
```

### **13.5.2 Fetch related parts for this document**

For multi-part support and part navigation:

```js
const { data: docParts, error: docPartsError } = await supabase
  .from('document_parts')
  .select(`
    part_id,
    last_job_id,
    parts (
      part_id,
      org_id,
      meta,
      latest_job_id,
      created_at,
      last_updated,
      last_job_at
    )
  `)
  .eq('document_id', documentId);
```

Frontend derives:

* `partsList = docParts.map(p => p.parts)`
* `currentPartIndex` and `currentPartId` based on navigation.

### **13.5.3 Fetch latest job (for raw JSON)**

```js
const { data: lastJob, error: jobError } = await supabase
  .from('jobs')
  .select(`
    id,
    status,
    error_message,
    result_json,
    created_at,
    started_at,
    finished_at
  `)
  .eq('id', doc.last_job_id)
  .single();
```

### **13.5.4 Save user edits (per current part)**

See example in 13.4.4; high-level behavior:

* Update `documents.user_meta` with overrides for `currentPartId`.
* Optimistically update UI.
* Show toast on success or error.

---

## **13.6 UX Edge Cases**

### **13.6.1 Document still processing**

If `doc.last_status === 'processing'`:

* Show a prominent banner: "Processing…"
* PNG preview may be missing → show skeleton/placeholder.
* Part navigation and detail may be disabled or show "Data will appear after processing".

### **13.6.2 Document in error state**

If `doc.last_status === 'error'`:

* Show red banner with `doc.last_error` or `lastJob.error_message`.
* Allow **Reprocess** action from header.
* Preview may be missing.

### **13.6.3 No parts detected**

If `detected_parts_count` is null/0 and `document_parts` is empty:

* Show message: "No parts were confidently detected from this document.".
* Still allow user to manually enter part metadata (single-part view) and save overrides.

### **13.6.4 Multi-part document**

If `detected_parts_count > 1` or `document_parts.length > 1`:

* Show `"Contains N parts"` in metadata.
* Enable part navigation (arrows and `Part X of N`).
* Editing always applies to the **currently selected part context**.

---

## **13.7 Summary**

The Document Detail view in MVP:

* Uses the **right column** for a large zoomable PNG preview and quick access to the original file.
* Uses the **left column** as a part-aware detail panel with simple navigation for 1..N parts.
* Exposes **summary, material, envelope, and basic fields** for the currently selected part.
* Allows light-weight editing of key fields and saving as overrides.
* Hides advanced content in expandable sections and keeps raw JSON away from typical users.

This makes it a **fast helper for RFQ / machining workflows**, not a heavy PLM client.

---

# END OF SECTION — more sections can be added as the spec evolves.

---

# **14. Part Detail View (MVP)**

The Part Detail view is intentionally very similar to the Document Detail view to keep UX consistent and simple.

Key differences:

* It focuses on **a single part** (no part switching UI).
* Right column still shows a **PNG preview** of the related drawing for this part.
* The relational panel shows **Documents** where this part appears, plus job history related to the part.

---

## **14.1 Purpose**

The Part Detail view allows the user to:

* See a **large, zoomable PNG preview** of the part’s drawing.
* Open / download the **original file** (via a related Document).
* View and edit key **part-level metadata**.
* See which **Documents** reference this part.
* Inspect **job history** related to this part.

It is typically opened from:

* Parts list (tile click → detail), or
* a link in the Document Detail view ("Open Part detail").

---

## **14.2 Layout**

Same two-column structure as Document Detail:

```
[ Top Bar ]
[ Left Sidebar ]   [ Part Detail ]

Part Detail:

┌─────────────────────────────────────────────────────────────┐
│ Header: part identifier, status, primary actions           │
├─────────────────────────────────────────────────────────────┤
│ Left column                      │ Right column             │
│ (part info, docs & jobs)         │ (large PNG preview)      │
└─────────────────────────────────────────────────────────────┘
```

### **14.2.1 Header**

Elements:

* Part identifier (e.g. `FR20517 (Rev A)`)
* Optional status badge (e.g., based on latest job success/error)
* Last updated / last job timestamp
* Primary actions:

  * **Export part report (PDF)**
  * **Export JSON**
  * **Copy part number**

Original document download is accessed via the Documents section (see below).

---

## **14.3 Right Column – PNG Preview for Part**

The right column behaves similarly to Document Detail:

* Show a **PNG preview** of the drawing **most representative** for this part, typically:

  * from the latest associated Document, or
  * from a designated "primary document" for the part.
* Viewer behavior:

  * Zoom & pan.
  * If multiple pages exist, allow page switching (same pattern as Document Detail).

Data source options (MVP simplification):

* Add a `preview_png_key` (or store document+page reference) to `parts.meta`, or
* Derive preview from the latest Document linked to this part.

For MVP, a practical approach:

* Use the PNG preview from the **latest job** where this part was extracted.

---

## **14.4 Left Column – Part Info, Documents & Jobs**

The left column contains:

1. **Part metadata** (editable)
2. **Summary & key attributes**
3. **Documents list** (where this part appears)
4. **Job history** for this part
5. **Expandable detail sections**

### **14.4.1 Part Metadata (Editable)**

Core identifying information:

* Part number
* Revision
* Name / short description
* Material
* Internal note

These fields:

* Are prefilled from `parts.meta` (system extraction).
* Can be edited and saved (store as overrides in `parts.user_meta` or merged into `meta` in MVP).

MVP storage strategy (simpler than Document overrides here):

* `parts.meta` already contains part-level data; **optional**:

  * add `parts.user_meta` JSONB for overrides, mirroring the document pattern.

Example update:

```js
const updatedUserMeta = {
  ...(part.user_meta || {}),
  part_number_override: formValues.partNumber,
  revision_override: formValues.revision,
  description_override: formValues.description,
  material_override: formValues.material,
  notes: formValues.notes,
};

await supabase
  .from('parts')
  .update({ user_meta: updatedUserMeta })
  .eq('part_id', partId);
```

Frontend merge logic: `override || meta.*`.

---

### **14.4.2 Summary & Key Attributes**

Below the editable metadata, show a compact summary block (read-only):

* Short summary (1–2 sentences)
* Envelope (e.g. `Ø56.96 × 10.00 mm`)
* Complexity / risk badge

These are derived from `parts.meta` (or from the latest associated job result).

---

### **14.4.3 Documents List (where this Part appears)**

Section title: **"Documents"**

Show a simple list or small tiles of all documents that reference this part:

Data source:

```js
const { data: docsForPart, error } = await supabase
  .from('document_parts')
  .select(`
    document_id,
    last_job_id,
    documents (
      id,
      file_name,
      last_status,
      last_error,
      last_thumbnail_key,
      created_at,
      last_processed_at
    )
  `)
  .eq('part_id', partId);
```

UI:

* Each row/tile:

  * File name
  * Status
  * Last processed
  * Small thumbnail
* Clicking a document opens **Document Detail**.

---

### **14.4.4 Job History for Part**

Section title: **"Job history"**

The goal is to show relevant processing runs that produced/updated this part.

Implementation options:

* If there is a direct link (e.g. `parts.latest_job_id` and a history somewhere), show those jobs.
* MVP option: show jobs from `document_parts.last_job_id` for each related document.

Example (simple MVP approach):

```js
// Using docsForPart from above
const jobIds = docsForPart
  .map(d => d.last_job_id)
  .filter(Boolean);

const { data: jobs, error: jobsError } = await supabase
  .from('jobs')
  .select(`
    id,
    document_id,
    status,
    error_message,
    created_at,
    started_at,
    finished_at
  `)
  .in('id', jobIds);
```

UI:

* List of jobs with:

  * status badge
  * created/finished timestamps
  * reference to which document run it belongs to.

This is **more for power users** and debugging, but gives transparency.

---

### **14.4.5 Expandable Detail Sections**

Similar pattern as Document Detail:

* **Quick summary**
* **Risks / manufacturing notes**
* **Suggested machining notes** (can be placeholder)
* **Other notes from drawings**
* **Raw JSON (debug)** – e.g. a merged view from latest job.

All collapsed by default except maybe Quick summary.

---

## **14.5 Supabase Data Access – Part Detail**

### **14.5.1 Fetch part**

```js
const { data: part, error } = await supabase
  .from('parts')
  .select(`
    part_id,
    org_id,
    meta,
    latest_job_id,
    created_at,
    last_updated,
    last_job_at,
    user_meta
  `)
  .eq('part_id', partId)
  .single();
```

### **14.5.2 Fetch related documents**

As in 14.4.3:

```js
const { data: docsForPart, error: docsError } = await supabase
  .from('document_parts')
  .select(`
    document_id,
    last_job_id,
    documents (
      id,
      file_name,
      last_status,
      last_error,
      last_thumbnail_key,
      created_at,
      last_processed_at
    )
  `)
  .eq('part_id', partId);
```

### **14.5.3 Fetch jobs for history / debug**

From `parts.latest_job_id` or via document_parts → jobs.

```js
const jobIds = docsForPart
  .map(d => d.last_job_id)
  .filter(Boolean);

const { data: jobs, error: jobsError } = await supabase
  .from('jobs')
  .select(`
    id,
    document_id,
    status,
    error_message,
    created_at,
    started_at,
    finished_at
  `)
  .in('id', jobIds);
```

For raw JSON:

```js
const { data: lastJob, error: jobError } = await supabase
  .from('jobs')
  .select(`
    id,
    status,
    error_message,
    result_json,
    created_at,
    started_at,
    finished_at
  `)
  .eq('id', part.latest_job_id)
  .single();
```

---

## **14.6 UX Relationship: Document Detail vs Part Detail**

* **Document Detail** shows:

  * Right: PNG preview for the document.
  * Left: document metadata + **part navigation (1..N parts)**.
  * Extra sections: parts list for this document + job history for this document.

* **Part Detail** shows:

  * Right: PNG preview for this part (via a related document).
  * Left: part metadata, summary, attributes.
  * Extra sections: **documents list** where this part appears + **job history** affecting this part.

Navigation:

* From Document Detail → click on a part → Part Detail.
* From Part Detail → click on a document → Document Detail.

This creates a simple, intuitive **Document ↔ Part** navigation loop over the same underlying data.

---

