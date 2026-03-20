'use strict';
const express  = require('express');
const router   = express.Router();
const Perms    = require('../Controllers/PermissionsController');
const { requireLogin, requireSuperAdmin } = require('../Middlewares/auth');

router.use(requireLogin);

/* ── Fixed-string routes FIRST (before /:uuid) ── */
router.get( '/',                requireSuperAdmin, Perms.index);
router.get( '/data',            requireSuperAdmin, Perms.getData);
router.get( '/actions',         Perms.getActions);       // proxy → API /permissions/actions
router.get( '/menus',           Perms.getMenus);         // proxy → API /permissions/menus
router.get( '/create',          requireSuperAdmin,  Perms.create);
router.post('/',                requireSuperAdmin,  Perms.store);

/* ── Param routes AFTER ── */
router.get( '/:uuid/edit',      requireSuperAdmin, Perms.edit);
router.post('/:uuid',           requireSuperAdmin, Perms.update);
router.post('/:uuid/delete',    requireSuperAdmin, Perms.destroy);

module.exports = router;