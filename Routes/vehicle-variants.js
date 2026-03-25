'use strict';
const express = require('express');
const router  = express.Router();
const Ctrl    = require('../Controllers/VehicleVariantsController');
const { requireLogin, requirePermission } = require('../Middlewares/auth');
router.use(requireLogin);

router.get('/',                        requirePermission('view_vehicle_variants'),   Ctrl.index);
router.post('/paginate',               requirePermission('view_vehicle_variants'),   Ctrl.paginate);
router.get('/export',                  requirePermission('export_vehicle_variants'), Ctrl.exportData);
router.post('/export',                 requirePermission('export_vehicle_variants'), Ctrl.exportData);
router.post('/import',                 requirePermission('import_vehicle_variants'), Ctrl.importData);
router.post('/import/single',          requirePermission('import_vehicle_variants'), Ctrl.importSingleRow);
router.get('/ai-config',               Ctrl.aiConfig);
router.post('/translate',              Ctrl.translate);
router.post('/bulk-action',            requirePermission('edit_vehicle_variants'),   Ctrl.bulkAction);
router.get('/create',                  requirePermission('add_vehicle_variants'),    Ctrl.create);
router.post('/',                       requirePermission('add_vehicle_variants'),    Ctrl.store);
router.get('/:uuid/view-data',         requirePermission('view_vehicle_variants'),   Ctrl.viewData);
router.get('/:uuid/edit',              requirePermission('edit_vehicle_variants'),   Ctrl.edit);
router.post('/:uuid',                  requirePermission('edit_vehicle_variants'),   Ctrl.update);
router.post('/:uuid/toggle-status',    requirePermission('edit_vehicle_variants'),   Ctrl.toggleStatus);
router.post('/:uuid/recover',          requirePermission('edit_vehicle_variants'),   Ctrl.recover);
router.post('/:uuid/delete',           requirePermission('delete_vehicle_variants'), Ctrl.destroy);

module.exports = router;
