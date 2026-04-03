'use strict';
const express = require('express');
const router  = express.Router();
const Ctrl    = require('../Controllers/WarehouseShelvesController');
const { requireLogin, requirePermission } = require('../Middlewares/auth');
router.use(requireLogin);

router.get('/autocomplete',            Ctrl.autocomplete);
router.get('/',                        requirePermission('view_warehouse_shelves'),   Ctrl.index);
router.post('/paginate',               requirePermission('view_warehouse_shelves'),   Ctrl.paginate);
router.get('/export',                  requirePermission('export_warehouse_shelves'), Ctrl.exportData);
router.post('/export',                 requirePermission('export_warehouse_shelves'), Ctrl.exportData);
router.post('/bulk-action',            requirePermission('edit_warehouse_shelves'),   Ctrl.bulkAction);
router.get('/create',                  requirePermission('add_warehouse_shelves'),    Ctrl.create);
router.post('/',                       requirePermission('add_warehouse_shelves'),    Ctrl.store);
router.get('/:uuid/usage',             requirePermission('view_warehouse_shelves'),   Ctrl.usage);
router.get('/:uuid/view-data',         requirePermission('view_warehouse_shelves'),   Ctrl.viewData);
router.get('/:uuid/edit',              requirePermission('edit_warehouse_shelves'),   Ctrl.edit);
router.post('/:uuid',                  requirePermission('edit_warehouse_shelves'),   Ctrl.update);
router.post('/:uuid/toggle-status',    requirePermission('edit_warehouse_shelves'),   Ctrl.toggleStatus);
router.post('/:uuid/recover',          requirePermission('edit_warehouse_shelves'),   Ctrl.recover);
router.post('/:uuid/delete',           requirePermission('delete_warehouse_shelves'), Ctrl.destroy);

module.exports = router;
