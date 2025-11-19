# Partonomy

A modern SaaS application for managing technical documents and parts.

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Build

```bash
npm run build
```

## Features

### Current Implementation (Core Layout)

- **Top Navigation Bar**
  - App logo
  - Organization selector with dropdown
  - User profile menu
  - Plan badge

- **Left Sidebar Navigation**
  - Documents (default page)
  - Parts
  - Settings
  - Collapsible on mobile devices

- **Pages**
  - **Documents**: List view with search, filters, and upload button
  - **Parts**: List view with search and complexity/material filters
  - **Settings**: Configuration sections for General, Organization, Members, and Billing

## Tech Stack

- React 18
- TypeScript
- Vite
- React Router DOM
- CSS Modules

## Project Structure

```
src/
├── components/
│   ├── TopBar.tsx          # Top navigation bar
│   ├── TopBar.css
│   ├── Sidebar.tsx         # Left sidebar navigation
│   └── Sidebar.css
├── pages/
│   ├── Documents.tsx       # Documents list page
│   ├── Documents.css
│   ├── Parts.tsx           # Parts list page
│   ├── Parts.css
│   ├── Settings.tsx        # Settings page
│   └── Settings.css
├── App.tsx                 # Main app component with routing
├── App.css
├── main.tsx               # App entry point
└── index.css              # Global styles
```

## Next Steps

This is a shell implementation with:
- ✅ Complete layout structure
- ✅ Responsive design
- ✅ Navigation routing
- ✅ Placeholder content

Ready for:
- [ ] Supabase authentication integration
- [ ] Real data fetching
- [ ] Document detail views
- [ ] Part detail views
- [ ] File upload functionality
- [ ] Real-time updates
