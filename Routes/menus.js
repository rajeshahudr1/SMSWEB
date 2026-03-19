'use strict';
/* ═══════════════════════════════════════════════════════
   [WEB]  Routes/menus.js
   IMPORTANT: /reorder and /create must come BEFORE /:uuid
═══════════════════════════════════════════════════════ */
const express = require('express');
const router  = express.Router();
const C       = require('../Controllers/MenusController');
const { requireLogin, requirePermission } = require('../Middlewares/auth');

router.use(requireLogin);

/* ── Fixed-string routes FIRST ─────────────────────── */
router.get( '/',            requirePermission('view_menus'),   C.index);
router.get( '/data',        requirePermission('view_menus'),   C.getData);
router.get( '/flat',        requirePermission('view_menus'),   C.getFlat);
router.get( '/create',      requirePermission('add_menus'),    C.create);
router.post('/',            requirePermission('add_menus'),    C.store);
router.post('/reorder',     requirePermission('edit_menus'),   C.reorder);   // ← BEFORE /:uuid

/* ── Param routes AFTER ────────────────────────────── */
router.get( '/:uuid/edit',              requirePermission('edit_menus'),   C.edit);
router.post('/:uuid',                   requirePermission('edit_menus'),   C.update);
router.post('/:uuid/delete',            requirePermission('delete_menus'), C.destroy);
router.post('/:uuid/toggle-visibility', requirePermission('edit_menus'),   C.toggleVisibility);
router.post('/:uuid/move',              requirePermission('edit_menus'),   C.move);

module.exports = router;