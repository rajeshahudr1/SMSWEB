'use strict';
const express = require('express');
const router  = express.Router();
const Ctrl    = require('../Controllers/WarehousesController');
const { requireLogin, requirePermission } = require('../Middlewares/auth');
router.use(requireLogin);

router.get('/organizations',           requirePermission('view_warehouses'),   Ctrl.organizations);
router.get('/autocomplete',            Ctrl.autocomplete);
router.get('/',                        requirePermission('view_warehouses'),   Ctrl.index);
router.post('/paginate',               requirePermission('view_warehouses'),   Ctrl.paginate);
router.get('/export',                  requirePermission('export_warehouses'), Ctrl.exportData);
router.post('/export',                 requirePermission('export_warehouses'), Ctrl.exportData);
router.post('/bulk-action',            requirePermission('edit_warehouses'),   Ctrl.bulkAction);
router.get('/create',                  requirePermission('add_warehouses'),    Ctrl.create);
router.post('/',                       requirePermission('add_warehouses'),    Ctrl.store);
router.get('/:uuid/usage',             requirePermission('view_warehouses'),   Ctrl.usage);
router.get('/:uuid/view-data',         requirePermission('view_warehouses'),   Ctrl.viewData);
router.get('/:uuid/edit',              requirePermission('edit_warehouses'),   Ctrl.edit);
router.post('/:uuid',                  requirePermission('edit_warehouses'),   Ctrl.update);
router.post('/:uuid/toggle-status',    requirePermission('edit_warehouses'),   Ctrl.toggleStatus);
router.post('/:uuid/recover',          requirePermission('edit_warehouses'),   Ctrl.recover);
router.post('/:uuid/delete',           requirePermission('delete_warehouses'), Ctrl.destroy);

module.exports = router;
