# SMS WEB — Scrap Management System (Frontend)

## Overview

SMSWEB is the frontend web application for the Scrap Management System. Built with **Node.js**, **Express.js**, **EJS** templating, **Bootstrap 5** (Tabler UI), **jQuery**, and **Select2**.

It acts as a proxy layer between the browser and SMSAPI, rendering server-side EJS views and proxying API calls with session-based authentication.

---

## Architecture

```
Browser <-> SMSWEB (Port 3001) <-> SMSAPI (Port 3000) <-> PostgreSQL

SMSWEB:
  |-- Express.js server (EJS templating)
  |-- Session-based auth (express-session + connect-pg-simple)
  |-- Proxy controllers (forward requests to SMSAPI with JWT token)
  |-- Server-side rendering (EJS views)
  |-- Client-side JS (jQuery + Select2 + Bootstrap)
  |-- Static assets (CSS, JS, images, uploads)
  |
  |-- 35 Controllers (proxy to API)
  |-- 39 Route Files
  |-- 40 View Directories
  |-- 67 Frontend JS Files
```

---

## How It Works

1. **User visits** `/warehouses` in browser
2. **SMSWEB route** (`routes/warehouses.js`) calls controller
3. **SMSWEB controller** (`Controllers/WarehousesController.js`) fetches data from SMSAPI via HTTP
4. **SMSAPI** returns JSON data
5. **SMSWEB controller** renders EJS template with data
6. **Browser** receives HTML page with embedded JS
7. **Client JS** makes AJAX calls to SMSWEB routes (which proxy to SMSAPI)

---

## Modules & Views

### Authentication Pages
| View | Route | Purpose |
|------|-------|---------|
| `auth/login.ejs` | `GET /login` | Login form |
| `auth/signup.ejs` | `GET /signup` | Registration form |
| `auth/forgot-password.ejs` | `GET /forgot-password` | Password reset request |
| `auth/reset-password.ejs` | `GET /reset-password` | New password form |
| `auth/google-complete.ejs` | `GET /google-complete` | Google OAuth completion |

### Dashboard
| View | Route | Purpose |
|------|-------|---------|
| `dashboard/index.ejs` | `GET /dashboard` | Main dashboard with stats |

### Administration
| Module | List View | Form View | JS Files |
|--------|-----------|-----------|----------|
| Users | `users/index.ejs` | `users/form.ejs` | `users.js`, `users-form.js` |
| Roles | `roles/index.ejs` | (inline modal) | `roles.js` |
| Permissions | `permissions/index.ejs` | (inline) | `permissions.js` |
| Menus | `menus/index.ejs` | (offcanvas) | `menus.js` |
| Settings | `settings/index.ejs` | (inline) | `settings.js` |
| Profile | `profile/index.ejs` | (inline) | `profile.js` |
| Activity Logs | `activity-logs/index.ejs` | (view only) | `activity-logs.js` |

### Language System
| Module | View | JS |
|--------|------|-----|
| Master Languages | `master-languages/index.ejs` | `master-languages.js` |
| Translation Editor | `languages/index.ejs` | `languages.js` |

### Part Masters
| Module | List | Form | JS |
|--------|------|------|-----|
| Part Types | `part-types/index.ejs` | `part-types/form.ejs` | `part-types.js`, `part-types-form.js` |
| Part Locations | `part-locations/index.ejs` | `part-locations/form.ejs` | `part-locations.js`, `part-locations-form.js` |
| Part Groups | `part-groups/index.ejs` | `part-groups/form.ejs` | `part-groups.js`, `part-groups-form.js` |
| Part Sides | `part-sides/index.ejs` | `part-sides/form.ejs` | `part-sides.js`, `part-sides-form.js` |
| Part Brands | `part-brands/index.ejs` | `part-brands/form.ejs` | `part-brands.js`, `part-brands-form.js` |
| Part Catalogs | `part-catalogs/index.ejs` | `part-catalogs/form.ejs` | `part-catalogs.js`, `part-catalogs-form.js` |

### Vehicle Masters
| Module | List | Form | JS |
|--------|------|------|-----|
| Vehicle Categories | `vehicle-categories/index.ejs` | `vehicle-categories/form.ejs` | `vehicle-categories.js`, `vehicle-categories-form.js` |
| Vehicle Fuels | `vehicle-fuels/index.ejs` | `vehicle-fuels/form.ejs` | `vehicle-fuels.js`, `vehicle-fuels-form.js` |
| Vehicle Years | `vehicle-years/index.ejs` | `vehicle-years/form.ejs` | `vehicle-years.js`, `vehicle-years-form.js` |
| Vehicle Types | `vehicle-types/index.ejs` | `vehicle-types/form.ejs` | `vehicle-types.js`, `vehicle-types-form.js` |
| Vehicle Makes | `vehicle-makes/index.ejs` | `vehicle-makes/form.ejs` | `vehicle-makes.js`, `vehicle-makes-form.js` |
| Vehicle Models | `vehicle-models/index.ejs` | `vehicle-models/form.ejs` | `vehicle-models.js`, `vehicle-models-form.js` |
| Vehicle Variants | `vehicle-variants/index.ejs` | `vehicle-variants/form.ejs` | `vehicle-variants.js`, `vehicle-variants-form.js` |
| Vehicle Engines | `vehicle-engines/index.ejs` | `vehicle-engines/form.ejs` | `vehicle-engines.js`, `vehicle-engines-form.js` |

### Vehicle Inventory
| View | Route | JS | Purpose |
|------|-------|-----|---------|
| `vehicle-inventories/index.ejs` | `GET /vehicle-inventories` | `vehicle-inventories.js` | List with dynamic columns, advanced filters, PDF download |
| `vehicle-inventories/form.ejs` | `GET /vehicle-inventories/create` | `vehicle-inventories-form.js` | 6-tab form (Vehicle, Extra, Images, Videos, Owner, Docs) |
| `vehicle-inventories/pdf.ejs` | `GET /vehicle-inventories/:uuid/pdf` | (server-side Puppeteer) | PDF generation template |

### Warehouse System
| Module | List | Form | JS |
|--------|------|------|-----|
| Warehouses | `warehouses/index.ejs` | `warehouses/form.ejs` | `warehouses.js`, `warehouses-form.js` |
| Zones | `warehouse-zones/index.ejs` | `warehouse-zones/form.ejs` | `warehouse-zones.js`, `warehouse-zones-form.js` |
| Shelves | `warehouse-shelves/index.ejs` | `warehouse-shelves/form.ejs` | `warehouse-shelves.js`, `warehouse-shelves-form.js` |
| Racks | `warehouse-racks/index.ejs` | `warehouse-racks/form.ejs` | `warehouse-racks.js`, `warehouse-racks-form.js` |
| Bins | `warehouse-bins/index.ejs` | `warehouse-bins/form.ejs` | `warehouse-bins.js`, `warehouse-bins-form.js` |

### Location
| Module | List | Form | JS |
|--------|------|------|-----|
| Countries | `countries/index.ejs` | (inline) | `countries.js` |
| States | `states/index.ejs` | `states/form.ejs` | `states.js`, `states-form.js` |
| Cities | `cities/index.ejs` | `cities/form.ejs` | `cities.js`, `cities-form.js` |

---

## Common JS Modules

| File | Purpose |
|------|---------|
| `public/js/app.js` | Global utilities: smsConfirm, pagination, date formatting, dropdown positioning |
| `public/js/notifications.js` | Notification polling, unread count badge |
| `public/js/common/image-editor.js` | Fabric.js image editor (crop, draw, text, filters, BG removal) |
| `public/js/common/video-editor.js` | FFmpeg WASM video editor (trim, rotate, speed, compress, watermark) |
| `public/js/common/media-gallery.js` | Reusable image/video gallery with upload, delete, reorder, editor integration |
| `public/js/common/location.js` | Cascading country/state/city dropdowns |
| `public/js/common/phone.js` | International phone number input |

---

## CSS & Design System

| File | Purpose |
|------|---------|
| `public/css/modern-theme.css` | Complete design system override: cards, tables, forms, buttons, modals, dynamic theming |
| `public/css/menus.css` | Menu manager tree styling, B2B/B2C toggle |
| `public/css/languages.css` | Translation editor styling, group cards |

### CSS Variables (Dynamic Theme)
```css
--tblr-primary: #0054a6;       /* Accent color (from settings) */
--sms-text: #1a2332;           /* Text color */
--sms-icon-color: currentColor; /* Icon color */
--sms-border: #e8ecf1;         /* Border color */
--sms-card-bg: #ffffff;        /* Card background */
```

---

## SMSWEB Route Pattern

Every module follows the same proxy pattern:

| Method | SMSWEB Route | Proxies To | Purpose |
|--------|-------------|-----------|---------|
| `GET` | `/{module}` | (renders EJS) | List page |
| `POST` | `/{module}/paginate` | `POST /api/{module}/paginate` | Paginated data |
| `GET` | `/{module}/autocomplete` | `GET /api/{module}/autocomplete` | Select2 search |
| `GET/POST` | `/{module}/export` | `/api/{module}/export/data` | Export data |
| `POST` | `/{module}/import` | `/api/{module}/import/upload` | Import file |
| `POST` | `/{module}/bulk-action` | `/api/{module}/bulk-action` | Bulk operations |
| `GET` | `/{module}/create` | (renders form EJS) | Add form |
| `POST` | `/{module}` | `POST /api/{module}` | Create record |
| `GET` | `/{module}/:uuid/usage` | `GET /api/{module}/:uuid/usage` | Usage data |
| `GET` | `/{module}/:uuid/view-data` | `GET /api/{module}/:uuid/view` | Detail data |
| `GET` | `/{module}/:uuid/edit` | (renders form EJS) | Edit form |
| `POST` | `/{module}/:uuid` | `PUT /api/{module}/:uuid` | Update record |
| `POST` | `/{module}/:uuid/toggle-status` | `PATCH /api/{module}/:uuid/toggle-status` | Toggle |
| `POST` | `/{module}/:uuid/recover` | `POST /api/{module}/:uuid/recover` | Recover |
| `POST` | `/{module}/:uuid/delete` | `DELETE /api/{module}/:uuid` | Soft delete |

---

## Frontend UI Pattern (per module)

### List Page Features
- Card with header (title, badge count, per-page selector, export dropdown, add button)
- Search input with debounce
- Advanced filter sidebar (offcanvas) with cascade dropdowns
- Filter badge showing active filter count + clear button
- Sortable column headers
- Bulk action bar (select all, activate, deactivate, delete, recover)
- Action dropdown per row (Preview, Edit, Toggle, Usage, QR Code, Delete)
- View details modal (modal-xl with sections)
- QR code modal (generate, print, download PNG)
- Pagination footer

### Form Page Features
- Back button + title
- Company dropdown (super admin, server-side rendered with pre-select)
- Parent cascade dropdowns (Select2 AJAX with `name (code)` format)
- Form fields with validation
- Status selector (edit mode)
- Submit via AJAX (JSON, not FormData)

---

## Third-Party Libraries

| Library | Version | Purpose | Load Method |
|---------|---------|---------|-------------|
| jQuery | 3.x | DOM manipulation, AJAX | local |
| Bootstrap 5 | 5.x (Tabler) | UI framework | local |
| Select2 | 4.x | Searchable dropdowns | local |
| Flatpickr | latest | Date/time picker | local |
| Toastr | latest | Toast notifications | local |
| Fabric.js | 5.3.1 | Canvas image editor | CDN + local patch |
| FFmpeg WASM | 0.11.6 | Browser video processing | CDN |
| html2canvas | 1.4.1 | HTML to canvas | CDN |
| jsPDF | 2.5.1 | Client-side PDF | CDN |
| Puppeteer | latest | Server-side PDF generation | npm |
| qrcode-generator | 1.4.4 | QR code generation | npm (copied to public) |

---

## Setup

```bash
npm install
cp .env.example .env     # Configure API_URL, session secret
npm run dev               # Start with nodemon on port 3001
```

## Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `PORT` | 3001 | Web server port |
| `API_URL` | http://localhost:3000/api | SMSAPI base URL |
| `SESSION_SECRET` | changeme | Session encryption key |
| `SESSION_NAME` | sms_session | Cookie name |

---

## File Structure

```
SMSWEB/
  Controllers/         # 35 proxy controllers
  routes/              # 39 Express router files
  Middlewares/         # auth (session check + permission)
  helpers/             # api (HTTP client to SMSAPI)
  views/
    layouts/main.ejs   # Main layout (sidebar, header, scripts)
    partials/          # Shared partials (usage-modal, etc.)
    {module}/          # 40 module view directories
      index.ejs        # List page
      form.ejs         # Add/Edit form
  public/
    css/               # modern-theme.css, menus.css, languages.css
    js/
      app.js           # Global utilities
      notifications.js # Notification polling
      common/          # Shared modules (image-editor, video-editor, media-gallery)
      pages/           # 67 page-specific JS files
    libs/              # Third-party CSS/JS (Bootstrap, Select2, etc.)
    images/            # Static images
  index.js             # Express app entry point
```

---

## New Modules (Added)

### Subscription Management (`/subscriptions/admin`)
- All org subscriptions list (one row per org, latest sub)
- Detail modal: 4 tabs (Details, Subscriptions, Payments, History)
- Actions: extend, change plan, cancel, activate, suspend
- Alert settings: configurable expiry warning days, email/notification toggle, grace period
- Payment Reports page: stats cards, gateway/country breakdown, filters, export

### Package Enquiries (`/packages/enquiries`)
- Enquiry list with search, filters, pagination, export
- Detail modal with admin notes timeline
- Status management (new/contacted/closed)

### Reviews (`/reviews`)
- Review list with search, rating filter, status filter
- View modal with star display + approve/reject buttons
- Approve/reject/delete actions

### Profile — Subscription Tab
- Current plan card with expiry banner (X days remaining / expired / expiring soon)
- 3 inner tabs: Details (with subscription history table), Payments (with invoice PDF download), History (vertical timeline)
- Renew, Upgrade, Cancel, Undo Cancel buttons
- Auto-renew toggle with description

### Choose Plan (`/choose-plan`)
- Standalone page (no sidebar) matching pricing.html design
- Monthly/yearly toggle, all packages from API
- Current plan: "Renew" button. Lower plans: disabled. Higher plans: "Upgrade"
- Trial, custom plan (enquiry form), tax note

### Payment Pages
- Payment page: price breakdown + Stripe redirect / Razorpay modal
- Success page: green confirmation with subscription summary
- Payment result page: success/pending/error states
