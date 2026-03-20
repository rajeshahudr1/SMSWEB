'use strict';
/* ═══════════════════════════════════════════════════════
   [WEB]  Routes/menus.js
   IMPORTANT: /reorder and /create must come BEFORE /:uuid
═══════════════════════════════════════════════════════ */
const express = require('express');
const router  = express.Router();
const C       = require('../Controllers/MenusController');
const { requireLogin, requireSuperAdmin } = require('../Middlewares/auth');

router.use(requireLogin);

/* ── Fixed-string routes FIRST ─────────────────────── */
router.get( '/',            requireSuperAdmin,   C.index);
router.get( '/data',        requireSuperAdmin,   C.getData);
router.get( '/flat',        requireSuperAdmin,   C.getFlat);
router.get( '/create',      requireSuperAdmin,    C.create);
router.post('/',            requireSuperAdmin,    C.store);
router.post('/reorder',     requireSuperAdmin,   C.reorder);   // ← BEFORE /:uuid

/* ── Param routes AFTER ────────────────────────────── */
router.get( '/:uuid/edit',              requireSuperAdmin,   C.edit);
router.post('/:uuid',                   requireSuperAdmin,   C.update);
router.post('/:uuid/delete',            requireSuperAdmin, C.destroy);
router.post('/:uuid/toggle-visibility', requireSuperAdmin,   C.toggleVisibility);
router.post('/:uuid/move',              requireSuperAdmin,   C.move);

module.exports = router;