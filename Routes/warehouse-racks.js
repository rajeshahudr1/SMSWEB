'use strict';
const express = require('express');
const router  = express.Router();
const Ctrl    = require('../Controllers/WarehouseRacksController');
const { requireLogin, requirePermission } = require('../Middlewares/auth');
router.use(requireLogin);

router.get('/autocomplete',            Ctrl.autocomplete);
router.get('/',                        requirePermission('view_warehouse_racks'),   Ctrl.index);
router.post('/paginate',               requirePermission('view_warehouse_racks'),   Ctrl.paginate);
router.get('/export',                  requirePermission('export_warehouse_racks'), Ctrl.exportData);
router.post('/export',                 requirePermission('export_warehouse_racks'), Ctrl.exportData);
router.post('/bulk-action',            requirePermission('edit_warehouse_racks'),   Ctrl.bulkAction);
router.get('/create',                  requirePermission('add_warehouse_racks'),    Ctrl.create);
router.post('/',                       requirePermission('add_warehouse_racks'),    Ctrl.store);
router.get('/:uuid/usage',             requirePermission('view_warehouse_racks'),   Ctrl.usage);
router.get('/:uuid/view-data',         requirePermission('view_warehouse_racks'),   Ctrl.viewData);
router.get('/:uuid/edit',              requirePermission('edit_warehouse_racks'),   Ctrl.edit);
router.post('/:uuid',                  requirePermission('edit_warehouse_racks'),   Ctrl.update);
router.post('/:uuid/toggle-status',    requirePermission('edit_warehouse_racks'),   Ctrl.toggleStatus);
router.post('/:uuid/recover',          requirePermission('edit_warehouse_racks'),   Ctrl.recover);
router.post('/:uuid/delete',           requirePermission('delete_warehouse_racks'), Ctrl.destroy);

module.exports = router;
