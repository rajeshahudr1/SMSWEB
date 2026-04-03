'use strict';
const express = require('express');
const router  = express.Router();
const Ctrl    = require('../Controllers/WarehouseBinsController');
const { requireLogin, requirePermission } = require('../Middlewares/auth');
router.use(requireLogin);

router.get('/autocomplete',            Ctrl.autocomplete);
router.get('/',                        requirePermission('view_warehouse_bins'),   Ctrl.index);
router.post('/paginate',               requirePermission('view_warehouse_bins'),   Ctrl.paginate);
router.get('/export',                  requirePermission('export_warehouse_bins'), Ctrl.exportData);
router.post('/export',                 requirePermission('export_warehouse_bins'), Ctrl.exportData);
router.post('/bulk-action',            requirePermission('edit_warehouse_bins'),   Ctrl.bulkAction);
router.get('/create',                  requirePermission('add_warehouse_bins'),    Ctrl.create);
router.post('/',                       requirePermission('add_warehouse_bins'),    Ctrl.store);
router.get('/:uuid/usage',             requirePermission('view_warehouse_bins'),   Ctrl.usage);
router.get('/:uuid/view-data',         requirePermission('view_warehouse_bins'),   Ctrl.viewData);
router.get('/:uuid/edit',              requirePermission('edit_warehouse_bins'),   Ctrl.edit);
router.post('/:uuid',                  requirePermission('edit_warehouse_bins'),   Ctrl.update);
router.post('/:uuid/toggle-status',    requirePermission('edit_warehouse_bins'),   Ctrl.toggleStatus);
router.post('/:uuid/recover',          requirePermission('edit_warehouse_bins'),   Ctrl.recover);
router.post('/:uuid/delete',           requirePermission('delete_warehouse_bins'), Ctrl.destroy);

module.exports = router;
