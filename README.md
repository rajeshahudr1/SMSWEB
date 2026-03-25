# SMSWEB — Vehicle Catalog Modules (New)

> Specification for 8 new vehicle master modules to be added to the existing SMSWEB.
> All modules follow the established Part Types web pattern unless noted otherwise.

---

## Overview — What Gets Built

```
New sidebar menu (under Masters):

Masters
├── Parts (existing — 5 modules)
├── Vehicle                                    ← NEW menu group
│   ├── Vehicle Categories                     ← Clone of Part Types (full CRUD)
│   ├── Vehicle Fuels                          ← Clone of Part Types (full CRUD)
│   ├── Vehicle Years                          ← Simplified (year integer, no image, no translations)
│   ├── Vehicle Types                          ← Clone of Part Types (full CRUD)
│   ├── Vehicle Makes                          ← Part Types + vehicle type autocomplete
│   ├── Vehicle Models                         ← Part Types + year/type/make autocomplete + 4 int fields
│   ├── Vehicle Variants                       ← Part Types + year/type/make/model autocomplete + 6 int fields
│   └── Vehicle Engines                        ← Part Types + type/make/model autocomplete
├── Languages (existing)
```

---

## New Files Summary (SMSWEB)

### Routes/ (8 new files)

| File | Clone From |
|------|-----------|
| `Routes/vehicle-categories.js` | `Routes/part-types.js` |
| `Routes/vehicle-fuels.js` | `Routes/part-types.js` |
| `Routes/vehicle-years.js` | `Routes/part-types.js` |
| `Routes/vehicle-types.js` | `Routes/part-types.js` |
| `Routes/vehicle-makes.js` | `Routes/part-types.js` |
| `Routes/vehicle-models.js` | `Routes/part-types.js` |
| `Routes/vehicle-variants.js` | `Routes/part-types.js` |
| `Routes/vehicle-engines.js` | `Routes/part-types.js` |

### Controllers/ (8 new files)

| File | Clone From | Key Differences |
|------|-----------|-----------------|
| `VehicleCategoriesController.js` | `PartTypesController.js` | API path: `/vehicle-categories`, view: `vehicle-categories/`, activeLink: `vehicle-categories` |
| `VehicleFuelsController.js` | `PartTypesController.js` | API path: `/vehicle-fuels` |
| `VehicleYearsController.js` | `PartTypesController.js` | API path: `/vehicle-years`. No image upload (remove multer). No languages fetch. No AI routes. |
| `VehicleTypesController.js` | `PartTypesController.js` | API path: `/vehicle-types` |
| `VehicleMakesController.js` | `PartTypesController.js` | API path: `/vehicle-makes`. Form page fetches vehicle types for autocomplete. |
| `VehicleModelsController.js` | `PartTypesController.js` | API path: `/vehicle-models`. Form page fetches years + types + makes for autocomplete. |
| `VehicleVariantsController.js` | `PartTypesController.js` | API path: `/vehicle-variants`. Form page fetches years + types + makes + models for autocomplete. |
| `VehicleEnginesController.js` | `PartTypesController.js` | API path: `/vehicle-engines`. Form page fetches types + makes + models for autocomplete. |

### views/ (8 new folders, 2 files each)

| Folder | Files | Clone From |
|--------|-------|-----------|
| `views/vehicle-categories/` | `index.ejs`, `form.ejs` | `views/part-types/` |
| `views/vehicle-fuels/` | `index.ejs`, `form.ejs` | `views/part-types/` |
| `views/vehicle-years/` | `index.ejs`, `form.ejs` | `views/part-types/` — Remove image section, remove translations section from form |
| `views/vehicle-types/` | `index.ejs`, `form.ejs` | `views/part-types/` |
| `views/vehicle-makes/` | `index.ejs`, `form.ejs` | `views/part-types/` — Add vehicle type autocomplete to form + filter on index |
| `views/vehicle-models/` | `index.ejs`, `form.ejs` | `views/part-types/` — Add 3 autocomplete dropdowns + 4 integer fields to form |
| `views/vehicle-variants/` | `index.ejs`, `form.ejs` | `views/part-types/` — Add 4 autocomplete dropdowns + 6 integer fields to form |
| `views/vehicle-engines/` | `index.ejs`, `form.ejs` | `views/part-types/` — Add 3 autocomplete dropdowns to form |

### public/js/pages/ (16 new files)

| File | Clone From | Key Differences |
|------|-----------|-----------------|
| `vehicle-categories.js` | `part-types.js` | API path, translation keys |
| `vehicle-categories-form.js` | `part-types-form.js` | API path, translation keys |
| `vehicle-fuels.js` | `part-types.js` | API path, translation keys |
| `vehicle-fuels-form.js` | `part-types-form.js` | API path, translation keys |
| `vehicle-years.js` | `part-types.js` | API path. Column is `year` (int). Remove image column from table. |
| `vehicle-years-form.js` | `part-types-form.js` | Single integer input. No image, no translations, no AI translate. |
| `vehicle-types.js` | `part-types.js` | API path |
| `vehicle-types-form.js` | `part-types-form.js` | API path |
| `vehicle-makes.js` | `part-types.js` | API path. Add vehicle_type filter to list page. |
| `vehicle-makes-form.js` | `part-types-form.js` | API path. Add vehicle type autocomplete dropdown. |
| `vehicle-models.js` | `part-types.js` | API path. Add 3 cascade filters. |
| `vehicle-models-form.js` | `part-types-form.js` | API path. Add 3 autocomplete dropdowns + 4 int fields. |
| `vehicle-variants.js` | `part-types.js` | API path. Add 4 cascade filters. |
| `vehicle-variants-form.js` | `part-types-form.js` | API path. Add 4 autocomplete dropdowns + 6 int fields. |
| `vehicle-engines.js` | `part-types.js` | API path. Add 3 cascade filters. |
| `vehicle-engines-form.js` | `part-types-form.js` | API path. Add 3 autocomplete dropdowns. |

### Routes/index.js (add 8 route mounts)

```javascript
router.use('/vehicle-categories', authGuard, require('./vehicle-categories'));
router.use('/vehicle-fuels',      authGuard, require('./vehicle-fuels'));
router.use('/vehicle-years',      authGuard, require('./vehicle-years'));
router.use('/vehicle-types',      authGuard, require('./vehicle-types'));
router.use('/vehicle-makes',      authGuard, require('./vehicle-makes'));
router.use('/vehicle-models',     authGuard, require('./vehicle-models'));
router.use('/vehicle-variants',   authGuard, require('./vehicle-variants'));
router.use('/vehicle-engines',    authGuard, require('./vehicle-engines'));
```

---

## Autocomplete Dropdown — UI Behavior

The autocomplete fields behave as a hybrid between a **searchable Select2 dropdown** and a **regular dropdown**:

```
┌──────────────────────────────────────────┐
│  Vehicle Type                             │
│  ┌────────────────────────────────────┐  │
│  │ 🔍 Search type...              ▼  │  │
│  └────────────────────────────────────┘  │
│  ┌────────────────────────────────────┐  │
│  │  Sedan                             │  │ ← Shows top N results immediately
│  │  SUV                               │  │    (N = autocomplete_limit from settings)
│  │  Hatchback                         │  │
│  │  Truck                             │  │ ← Typing filters results via AJAX
│  │  Van                               │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
```

**Behavior:**
1. On dropdown open → immediately load top N records (no search needed, works like normal dropdown)
2. On typing → AJAX search with debounce (300ms), shows filtered results
3. Supports keyboard navigation (arrow keys, enter to select)
4. Selected value shows as a tag/pill, clearable with X
5. Uses **Select2 AJAX mode** with `minimumInputLength: 0` so it loads options on open

**Implementation (Select2 AJAX):**

```javascript
$('#vehicleTypeId').select2({
    placeholder: SMS_T('vehicle_makes.select_type', 'Select Vehicle Type'),
    allowClear: true,
    ajax: {
        url: BASE_URL + '/vehicle-types/autocomplete',
        dataType: 'json',
        delay: 300,
        data: function(params) {
            return { search: params.term || '', limit: '' };
            // limit='' → API reads from settings
        },
        processResults: function(res) {
            return {
                results: (res.data || []).map(function(r) {
                    return { id: r.id, text: r.name };
                })
            };
        }
    },
    minimumInputLength: 0  // ← Shows results on open without typing
});
```

**Web proxy route** (each module needs an autocomplete proxy in its web controller):

```javascript
// In VehicleMakesController.js
exports.autocompleteTypes = async (req, res) => {
    res.json(await api.get('/vehicle-types/autocomplete', req.session.token, req.query));
};
```

---

## Cascade Dependency — How Filters Chain on Form Pages

```
Form: Vehicle Model
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  Vehicle Year     [ 🔍 Select year...               ▼ ]     │
│  Vehicle Type     [ 🔍 Select type...               ▼ ]     │
│  Vehicle Make     [ 🔍 Select make...               ▼ ]  ← Filtered by type (if selected)
│                                                              │
│  Name             [ ___________________________________ ]    │
│                                                              │
│  Month Initial    [ _____ ]   Month Final    [ _____ ]       │
│  Start Year       [ _____ ]   End Year       [ _____ ]       │
│                                                              │
│  Image / External URL / Translations / AI Translate          │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Cascade logic in form JS:**

```javascript
// When Vehicle Type changes → reset + re-filter Vehicle Make
$('#vehicleTypeId').on('change', function() {
    $('#vehicleMakeId').val(null).trigger('change');  // Clear make selection
    // Make dropdown will re-query API with new vehicle_type_id on next open
});

// Vehicle Make autocomplete passes parent filters:
$('#vehicleMakeId').select2({
    ajax: {
        url: BASE_URL + '/vehicle-makes/autocomplete',
        data: function(params) {
            return {
                search: params.term || '',
                vehicle_type_id: $('#vehicleTypeId').val() || '',  // ← Pass parent filter
                limit: ''
            };
        },
        // ...
    }
});
```

**Cascade chain per module:**

| Module | Parent Dropdowns on Form | Parent Filters on List |
|--------|--------------------------|----------------------|
| Vehicle Category | (none) | company (super admin) |
| Vehicle Fuel | (none) | company (super admin) |
| Vehicle Year | (none) | company (super admin) |
| Vehicle Type | (none) | company (super admin) |
| Vehicle Make | Vehicle Type | company, vehicle_type |
| Vehicle Model | Vehicle Year, Vehicle Type, Vehicle Make | company, vehicle_year, vehicle_type, vehicle_make |
| Vehicle Variant | Vehicle Year, Vehicle Type, Vehicle Make, Vehicle Model | company, vehicle_year, vehicle_type, vehicle_make, vehicle_model |
| Vehicle Engine | Vehicle Type, Vehicle Make, Vehicle Model | company, vehicle_type, vehicle_make, vehicle_model |

---

## Settings Page — New Field

Add to the Settings page (Localisation section):

```
┌──────────────────────────────────────────────────────────┐
│  Localisation                                             │
│                                                           │
│  Language          [ English (en-US)              ▼ ]     │
│  Date Format       [ DD/MM/YYYY                  ▼ ]     │
│  Timezone          [ Asia/Kolkata (IST)          ▼ ]     │
│  Items Per Page    [ 15                          ▼ ]     │
│  Autocomplete Limit[ 10                          ▼ ]  ← NEW
│                                                           │
└──────────────────────────────────────────────────────────┘
```

**Setting key:** `autocomplete_limit`
**Values:** 5, 10, 15, 20, 25, 50
**Default:** 10
**Scope:** Organization-level (applies to all users in the org)

This requires:
1. Add dropdown in `views/settings/index.ejs`
2. Include in save payload in `public/js/pages/settings.js`
3. API stores as `settings` table row: `{ organization_id, user_id: null, key: 'autocomplete_limit', value: '10' }`

---

## Module Detail — Vehicle Years (simplified)

Vehicle Years is the only module that differs significantly from Part Types:

### List Page (index.ejs)

```
┌──────────────────────────────────────────────────────────────┐
│  Vehicle Years  [23]            [Per Page ▼] [Export ▼] [+Add]│
├──────────────────────────────────────────────────────────────┤
│  [Company ▼]  [🔍 Search year...]  [Status ▼]  [Deleted ▼] [✕]│
├──────────────────────────────────────────────────────────────┤
│  ☐  #   Year    Status      Created         Actions          │
│  ☐  1   2024    ● Active    25/03/2026      👁 ✏️ ⏻ 🗑       │
│  ☐  2   2023    ● Active    25/03/2026      👁 ✏️ ⏻ 🗑       │
│  ☐  3   2022    ○ Inactive  24/03/2026      👁 ✏️ ⏻ 🗑       │
├──────────────────────────────────────────────────────────────┤
│  Showing 1–3 of 3                          [< 1 >]           │
└──────────────────────────────────────────────────────────────┘

Differences from Part Types list:
  ✕ No image column
  ✕ Column is "Year" instead of "Name"
  ✓ Search filters by year (integer LIKE or exact match)
  ✓ Everything else same (bulk actions, export, import, sort, pagination)
```

### Form Page (form.ejs)

```
┌──────────────────────────────────────────────────────────────┐
│  Add Vehicle Year                                             │
│                                                               │
│  Company  [ Global (Super Admin)                     ▼ ]      │  ← Super admin only
│                                                               │
│  Year     [ 2024__________________ ]                          │  ← Integer input only
│           ⚠️ Must be a valid 4-digit year                     │
│                                                               │
│  Status   [● Active  ○ Inactive]                              │
│                                                               │
│  ✕ No image upload section                                    │
│  ✕ No translations section                                    │
│  ✕ No AI translate button                                     │
│                                                               │
│                              [Cancel]  [Save Vehicle Year]    │
└──────────────────────────────────────────────────────────────┘
```

**Validation:** Input type="number", min="1900", max="2100", step="1". Integer only.

---

## Module Detail — Vehicle Makes (with autocomplete)

### Form Page (form.ejs)

```
┌──────────────────────────────────────────────────────────────┐
│  Add Vehicle Make                                             │
│                                                               │
│  Company       [ Global (Super Admin)                ▼ ]      │
│                                                               │
│  Vehicle Type  [ 🔍 Search or select type...         ▼ ]  ← AUTOCOMPLETE
│                  Shows top N results on open                  │
│                  Typing filters via AJAX                      │
│                  Optional — if blank, make is not type-linked │
│                                                               │
│  Name          [ Toyota__________________________ ]           │
│                                                               │
│  Image Upload  [Choose File] or External URL [ __________ ]  │
│  Status        [● Active  ○ Inactive]                         │
│                                                               │
│  ── Translations ─────────────────────────────────────────    │
│  🇺🇸 English    [ Toyota ]  (auto-filled from name)          │
│  🇮🇳 Hindi      [ टोयोटा ]                                    │
│  🇮🇳 Gujarati   [ ટોયોટા ]                                    │
│                              [🤖 AI Translate All]            │
│                                                               │
│                              [Cancel]  [Save Vehicle Make]    │
└──────────────────────────────────────────────────────────────┘
```

### List Page — Extra Filter

```
Filter bar adds vehicle_type_id dropdown:
┌──────────────────────────────────────────────────────────────┐
│  [Company ▼]  [Vehicle Type ▼]  [🔍 Search...]  [Status ▼]   │
└──────────────────────────────────────────────────────────────┘
```

### View Modal — Shows Related Name

```
┌──────────────────────────────────┐
│  Toyota                          │
│  ● Active                        │
│  Company: Global (Super Admin)   │
│  Vehicle Type: SUV               │  ← Joined from vehicle_types table
│  Created: 25/03/2026 10:30 AM   │
│                                  │
│  Translations:                   │
│  🇺🇸 English: Toyota             │
│  🇮🇳 Hindi: टोयोटा                │
└──────────────────────────────────┘
```

---

## Module Detail — Vehicle Models (3 autocompletes + 4 int fields)

### Form Page (form.ejs)

```
┌──────────────────────────────────────────────────────────────┐
│  Add Vehicle Model                                            │
│                                                               │
│  Company         [ Global (Super Admin)              ▼ ]      │
│                                                               │
│  Vehicle Year    [ 🔍 Search year...                 ▼ ]  ← AUTOCOMPLETE
│  Vehicle Type    [ 🔍 Search type...                 ▼ ]  ← AUTOCOMPLETE
│  Vehicle Make    [ 🔍 Search make...                 ▼ ]  ← AUTOCOMPLETE (filtered by type)
│                                                               │
│  Name            [ Fortuner_________________________ ]        │
│                                                               │
│  ── Production Period ───────────────────────────────────     │
│  Month Initial [ 01 ]    Month Final  [ 12 ]                 │  ← Integer 1-12
│  Start Year    [ 2018 ]  End Year     [ 2024 ]               │  ← Integer year
│                                                               │
│  Image Upload  [Choose File] or External URL [ __________ ]  │
│  Status        [● Active  ○ Inactive]                         │
│                                                               │
│  ── Translations ─────────────────────────────────────────    │
│  🇺🇸 English    [ Fortuner ]                                  │
│  🇮🇳 Hindi      [ फॉर्च्यूनर ]                                  │
│                              [🤖 AI Translate All]            │
│                                                               │
│                              [Cancel]  [Save Vehicle Model]   │
└──────────────────────────────────────────────────────────────┘
```

### List Page — Extra Filters

```
Filter bar:
┌────────────────────────────────────────────────────────────────────────┐
│  [Company ▼] [Year ▼] [Type ▼] [Make ▼] [🔍 Search...] [Status ▼] [✕]│
└────────────────────────────────────────────────────────────────────────┘
```

### Table Columns

```
☐  #  Image  Name       Type   Make    Year  Start  End   Status  Created    Actions
☐  1  [img]  Fortuner   SUV    Toyota  2024  2018   2024  Active  25/03/26   👁 ✏️ ⏻ 🗑
```

---

## Module Detail — Vehicle Variants (4 autocompletes + 6 int fields)

### Form Page (form.ejs)

```
┌──────────────────────────────────────────────────────────────┐
│  Add Vehicle Variant                                          │
│                                                               │
│  Company         [ Global (Super Admin)              ▼ ]      │
│                                                               │
│  Vehicle Year    [ 🔍 Search year...                 ▼ ]  ← AUTOCOMPLETE
│  Vehicle Type    [ 🔍 Search type...                 ▼ ]  ← AUTOCOMPLETE
│  Vehicle Make    [ 🔍 Search make...                 ▼ ]  ← AUTOCOMPLETE (filtered by type)
│  Vehicle Model   [ 🔍 Search model...               ▼ ]  ← AUTOCOMPLETE (filtered by type+make)
│                                                               │
│  Name            [ 2.8L Diesel 4x4 AT______________ ]        │
│                                                               │
│  ── Production Period ───────────────────────────────────     │
│  Month Initial [ 03 ]    Month Final  [ 11 ]                 │
│  Start Year    [ 2020 ]  End Year     [ 2024 ]               │
│                                                               │
│  ── Performance ─────────────────────────────────────────     │
│  KW (Kilowatts) [ 150 ]    HP (Horsepower) [ 204 ]          │
│                                                               │
│  Image Upload  [Choose File] or External URL [ __________ ]  │
│  Status        [● Active  ○ Inactive]                         │
│                                                               │
│  ── Translations + AI ───────────────────────────────────     │
│                                                               │
│                             [Cancel]  [Save Vehicle Variant]  │
└──────────────────────────────────────────────────────────────┘
```

---

## Module Detail — Vehicle Engines (3 autocompletes)

### Form Page (form.ejs)

```
┌──────────────────────────────────────────────────────────────┐
│  Add Vehicle Engine                                           │
│                                                               │
│  Company         [ Global (Super Admin)              ▼ ]      │
│                                                               │
│  Vehicle Type    [ 🔍 Search type...                 ▼ ]  ← AUTOCOMPLETE
│  Vehicle Make    [ 🔍 Search make...                 ▼ ]  ← AUTOCOMPLETE (filtered by type)
│  Vehicle Model   [ 🔍 Search model...               ▼ ]  ← AUTOCOMPLETE (filtered by type+make)
│                                                               │
│  Name            [ 1.5L Turbo Petrol________________ ]        │
│                                                               │
│  Image Upload  [Choose File] or External URL [ __________ ]  │
│  Status        [● Active  ○ Inactive]                         │
│                                                               │
│  ── Translations + AI ───────────────────────────────────     │
│                                                               │
│                             [Cancel]  [Save Vehicle Engine]   │
└──────────────────────────────────────────────────────────────┘
```

---

## Web Routes (Full List — 8 Modules)

### Vehicle Categories (same pattern as Part Types)
| Method | URL | Permission | Controller | Type |
|--------|-----|------------|------------|------|
| GET | `/vehicle-categories` | view_vehicle_categories | VC.index | Page |
| POST | `/vehicle-categories/paginate` | view_vehicle_categories | VC.paginate | AJAX |
| GET | `/vehicle-categories/export` | export_vehicle_categories | VC.exportData | Download |
| POST | `/vehicle-categories/export` | export_vehicle_categories | VC.exportData | Download |
| POST | `/vehicle-categories/import` | import_vehicle_categories | VC.importData | AJAX |
| POST | `/vehicle-categories/import/single` | import_vehicle_categories | VC.importSingleRow | AJAX |
| GET | `/vehicle-categories/ai-config` | — | VC.aiConfig | AJAX |
| POST | `/vehicle-categories/translate` | — | VC.translate | AJAX |
| POST | `/vehicle-categories/bulk-action` | edit_vehicle_categories | VC.bulkAction | AJAX |
| GET | `/vehicle-categories/create` | add_vehicle_categories | VC.create | Page |
| POST | `/vehicle-categories` | add_vehicle_categories | VC.store | AJAX (multipart) |
| GET | `/vehicle-categories/:uuid/view-data` | view_vehicle_categories | VC.viewData | AJAX |
| GET | `/vehicle-categories/:uuid/edit` | edit_vehicle_categories | VC.edit | Page |
| POST | `/vehicle-categories/:uuid` | edit_vehicle_categories | VC.update | AJAX (multipart) |
| POST | `/vehicle-categories/:uuid/toggle-status` | edit_vehicle_categories | VC.toggleStatus | AJAX |
| POST | `/vehicle-categories/:uuid/recover` | edit_vehicle_categories | VC.recover | AJAX |
| POST | `/vehicle-categories/:uuid/delete` | delete_vehicle_categories | VC.destroy | AJAX |

### Vehicle Fuels — Same pattern as Vehicle Categories

### Vehicle Years (simplified — no AI, no image)
| Method | URL | Permission | Controller | Type |
|--------|-----|------------|------------|------|
| GET | `/vehicle-years` | view_vehicle_years | VY.index | Page |
| POST | `/vehicle-years/paginate` | view_vehicle_years | VY.paginate | AJAX |
| GET | `/vehicle-years/export` | export_vehicle_years | VY.exportData | Download |
| POST | `/vehicle-years/export` | export_vehicle_years | VY.exportData | Download |
| POST | `/vehicle-years/import` | import_vehicle_years | VY.importData | AJAX |
| POST | `/vehicle-years/import/single` | import_vehicle_years | VY.importSingleRow | AJAX |
| POST | `/vehicle-years/bulk-action` | edit_vehicle_years | VY.bulkAction | AJAX |
| GET | `/vehicle-years/create` | add_vehicle_years | VY.create | Page |
| POST | `/vehicle-years` | add_vehicle_years | VY.store | AJAX (JSON) |
| GET | `/vehicle-years/:uuid/view-data` | view_vehicle_years | VY.viewData | AJAX |
| GET | `/vehicle-years/:uuid/edit` | edit_vehicle_years | VY.edit | Page |
| POST | `/vehicle-years/:uuid` | edit_vehicle_years | VY.update | AJAX (JSON) |
| POST | `/vehicle-years/:uuid/toggle-status` | edit_vehicle_years | VY.toggleStatus | AJAX |
| POST | `/vehicle-years/:uuid/recover` | edit_vehicle_years | VY.recover | AJAX |
| POST | `/vehicle-years/:uuid/delete` | delete_vehicle_years | VY.destroy | AJAX |

_No `/ai-config` or `/translate` routes._

### Vehicle Types — Same as Vehicle Categories + autocomplete proxy
| Extra | URL | Controller | Type |
|-------|-----|------------|------|
| GET | `/vehicle-types/autocomplete` | VT.autocomplete | AJAX proxy |

### Vehicle Makes — Same as Vehicle Categories + autocomplete proxy
| Extra | URL | Controller | Type |
|-------|-----|------------|------|
| GET | `/vehicle-makes/autocomplete` | VM.autocomplete | AJAX proxy |
| GET | `/vehicle-types/autocomplete` | _(reuse VT proxy)_ | AJAX proxy (for form dropdown) |

### Vehicle Models — Same as Vehicle Categories + autocomplete proxies
| Extra | URL | Controller | Type |
|-------|-----|------------|------|
| GET | `/vehicle-models/autocomplete` | VMo.autocomplete | AJAX proxy |
| GET | `/vehicle-years/autocomplete` | _(proxy)_ | AJAX |
| GET | `/vehicle-types/autocomplete` | _(proxy)_ | AJAX |
| GET | `/vehicle-makes/autocomplete` | _(proxy)_ | AJAX |

### Vehicle Variants — Same as Vehicle Categories + autocomplete proxies
| Extra | URL | Controller | Type |
|-------|-----|------------|------|
| GET | `/vehicle-variants/autocomplete` | VVa.autocomplete | AJAX proxy |
| GET | _(+ year, type, make, model autocomplete proxies)_ | | AJAX |

### Vehicle Engines — Same as Vehicle Categories + autocomplete proxies
| Extra | URL | Controller | Type |
|-------|-----|------------|------|
| GET | `/vehicle-engines/autocomplete` | VE.autocomplete | AJAX proxy |
| GET | _(+ type, make, model autocomplete proxies)_ | | AJAX |

---

## Autocomplete Proxy — Shared Route Approach

Instead of duplicating autocomplete proxy routes in every module, add a shared autocomplete proxy route file:

### Option: Shared `/vehicle-autocomplete` route

```javascript
// Routes/vehicle-autocomplete.js
router.get('/vehicle-years/autocomplete',    proxy('/vehicle-years/autocomplete'));
router.get('/vehicle-types/autocomplete',    proxy('/vehicle-types/autocomplete'));
router.get('/vehicle-makes/autocomplete',    proxy('/vehicle-makes/autocomplete'));
router.get('/vehicle-models/autocomplete',   proxy('/vehicle-models/autocomplete'));
router.get('/vehicle-variants/autocomplete', proxy('/vehicle-variants/autocomplete'));
router.get('/vehicle-engines/autocomplete',  proxy('/vehicle-engines/autocomplete'));

function proxy(apiPath) {
    return async (req, res) => {
        res.json(await api.get(apiPath, req.session.token, req.query));
    };
}
```

Mount in Routes/index.js:
```javascript
router.use('/', authGuard, require('./vehicle-autocomplete'));
```

This way all form pages can call `/vehicle-types/autocomplete?search=...` without needing per-module proxy duplication.

---

## Translation Keys (add to en-US.json)

```json
{
    "nav.vehicle": "Vehicle",
    "nav.vehicle_categories": "Vehicle Categories",
    "nav.vehicle_fuels": "Vehicle Fuels",
    "nav.vehicle_years": "Vehicle Years",
    "nav.vehicle_types": "Vehicle Types",
    "nav.vehicle_makes": "Vehicle Makes",
    "nav.vehicle_models": "Vehicle Models",
    "nav.vehicle_variants": "Vehicle Variants",
    "nav.vehicle_engines": "Vehicle Engines",

    "vehicle_categories.title": "Vehicle Categories",
    "vehicle_categories.add": "Add Category",
    "vehicle_categories.search_ph": "Search categories...",
    "vehicle_categories.name": "Category Name",
    "vehicle_categories.no_data": "No vehicle categories found",

    "vehicle_fuels.title": "Vehicle Fuels",
    "vehicle_fuels.add": "Add Fuel Type",

    "vehicle_years.title": "Vehicle Years",
    "vehicle_years.add": "Add Year",
    "vehicle_years.year": "Year",
    "vehicle_years.search_ph": "Search year...",

    "vehicle_types.title": "Vehicle Types",
    "vehicle_types.add": "Add Type",
    "vehicle_types.select_type": "Select Vehicle Type",

    "vehicle_makes.title": "Vehicle Makes",
    "vehicle_makes.add": "Add Make",
    "vehicle_makes.select_type": "Select Vehicle Type",

    "vehicle_models.title": "Vehicle Models",
    "vehicle_models.add": "Add Model",
    "vehicle_models.select_year": "Select Vehicle Year",
    "vehicle_models.select_type": "Select Vehicle Type",
    "vehicle_models.select_make": "Select Vehicle Make",
    "vehicle_models.month_initial": "Month Initial",
    "vehicle_models.month_final": "Month Final",
    "vehicle_models.start_year": "Start Year",
    "vehicle_models.end_year": "End Year",

    "vehicle_variants.title": "Vehicle Variants",
    "vehicle_variants.add": "Add Variant",
    "vehicle_variants.select_model": "Select Vehicle Model",
    "vehicle_variants.kw": "KW (Kilowatts)",
    "vehicle_variants.hp": "HP (Horsepower)",

    "vehicle_engines.title": "Vehicle Engines",
    "vehicle_engines.add": "Add Engine",

    "settings.autocomplete_limit": "Autocomplete Limit"
}
```

---

## Total New File Count

| Layer | Files | Description |
|-------|-------|-------------|
| SMSAPI Migrations | 15 | 8 main tables + 7 translation tables |
| SMSAPI Controllers | 8 | One per module |
| SMSAPI Routes | 8 | One per module |
| SMSWEB Controllers | 8 | One per module |
| SMSWEB Routes | 9 | 8 modules + 1 shared autocomplete |
| SMSWEB Views | 16 | 8 × (index.ejs + form.ejs) |
| SMSWEB JS Pages | 16 | 8 × (list.js + form.js) |
| Config updates | 3 | permissions.config.js, menus.config.js, en-US.json |
| Settings update | 2 | settings view + settings JS |
| **Total** | **85** | |