'use strict';

const express = require('express');
const router  = express.Router();
const Roles   = require('../Controllers/RolesController');
const { requireLogin, requirePermission } = require('../Middlewares/auth');

router.use(requireLogin);

router.get( '/',             requirePermission('view_roles'),   Roles.index);
router.post('/paginate',     requirePermission('view_roles'),   Roles.paginate);
router.get( '/export',                 requirePermission('view_roles'),   Roles.exportData);
router.post('/export',                 requirePermission('view_roles'),   Roles.exportData);
router.get( '/create',       requirePermission('add_roles'),    Roles.create);
router.post('/',             requirePermission('add_roles'),    Roles.store);
router.get( '/:uuid/usage',  requirePermission('view_roles'),   Roles.usage);
router.get( '/:uuid/edit',   requirePermission('edit_roles'),   Roles.edit);
router.post('/:uuid',        requirePermission('edit_roles'),   Roles.update);
router.get( '/:uuid/delete', requirePermission('delete_roles'), Roles.deleteConfirm);
router.post('/:uuid/delete', requirePermission('delete_roles'), Roles.destroy);

module.exports = router;
