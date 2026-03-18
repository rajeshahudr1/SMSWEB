=== SMSWEB CHANGES — Icon & Layout Fixes ===

FILES CHANGED:
1. views/layouts/main.ejs       — Added tabler-icons.min.css link back
2. public/css/app.css           — Fixed layout, sidebar CSS, removed conflicting rules
3. views/partials/sidebar.ejs   — New collapsible sidebar
4. views/dashboard/index.ejs    — New dashboard design

CRITICAL FILE ACTION REQUIRED:
Copy font files into the correct location so tabler-icons work:

FROM: public/libs/fonts/fonts/*.woff2  (and .woff, .ttf)
TO:   public/libs/css/fonts/           (CREATE this folder)

Run this command in your project root:
mkdir -p public/libs/css/fonts
cp public/libs/fonts/fonts/* public/libs/css/fonts/

WHY: tabler-icons.min.css references fonts at ./fonts/ relative to /libs/css/
but the fonts were stored at /libs/fonts/fonts/ which is the wrong path.

ICONS USED:
- Sidebar nav items: Bootstrap Icons (bi-*) — already working via bootstrap-icons.min.css
- Tabler Icons (ti-*): Used in dashboard cards/menus from DB data
  These require the font fix above to display.