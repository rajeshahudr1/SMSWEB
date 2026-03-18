'use strict';
const express  = require('express');
const router   = express.Router();
const Perms    = require('../Controllers/PermissionsController');
const { requireLogin, requirePermission } = require('../Middlewares/auth');

router.use(requireLogin);

router.get( '/',                requirePermission('view_permissions'), Perms.index);
router.get( '/data',            requirePermission('view_permissions'), Perms.getData);
router.get( '/create',          requirePermission('add_permissions'),  Perms.create);
router.post('/',                requirePermission('add_permissions'),  Perms.store);
router.get( '/:uuid/edit',      requirePermission('edit_permissions'), Perms.edit);
router.post('/:uuid',           requirePermission('edit_permissions'), Perms.update);
router.post('/:uuid/delete',    requirePermission('delete_permissions'), Perms.destroy);

module.exports = router;
