'use strict';
const express = require('express');
const router  = express.Router();
const Ctrl    = require('../Controllers/WarehouseZonesController');
const { requireLogin, requirePermission } = require('../Middlewares/auth');
router.use(requireLogin);

router.get('/autocomplete',            Ctrl.autocomplete);
router.get('/',                        requirePermission('view_warehouse_zones'),   Ctrl.index);
router.post('/paginate',               requirePermission('view_warehouse_zones'),   Ctrl.paginate);
router.get('/export',                  requirePermission('export_warehouse_zones'), Ctrl.exportData);
router.post('/export',                 requirePermission('export_warehouse_zones'), Ctrl.exportData);
router.post('/bulk-action',            requirePermission('edit_warehouse_zones'),   Ctrl.bulkAction);
router.get('/create',                  requirePermission('add_warehouse_zones'),    Ctrl.create);
router.post('/',                       requirePermission('add_warehouse_zones'),    Ctrl.store);
router.get('/:uuid/usage',             requirePermission('view_warehouse_zones'),   Ctrl.usage);
router.get('/:uuid/view-data',         requirePermission('view_warehouse_zones'),   Ctrl.viewData);
router.get('/:uuid/edit',              requirePermission('edit_warehouse_zones'),   Ctrl.edit);
router.post('/:uuid',                  requirePermission('edit_warehouse_zones'),   Ctrl.update);
router.post('/:uuid/toggle-status',    requirePermission('edit_warehouse_zones'),   Ctrl.toggleStatus);
router.post('/:uuid/recover',          requirePermission('edit_warehouse_zones'),   Ctrl.recover);
router.post('/:uuid/delete',           requirePermission('delete_warehouse_zones'), Ctrl.destroy);

module.exports = router;
