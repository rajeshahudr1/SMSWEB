'use strict';
const express = require('express');
const router  = express.Router();
const Ctrl    = require('../Controllers/VehicleTypesController');
const { requireLogin, requirePermission } = require('../Middlewares/auth');
router.use(requireLogin);

router.get('/',                        requirePermission('view_vehicle_types'),   Ctrl.index);
router.post('/paginate',               requirePermission('view_vehicle_types'),   Ctrl.paginate);
router.get('/export',                  requirePermission('export_vehicle_types'), Ctrl.exportData);
router.post('/export',                 requirePermission('export_vehicle_types'), Ctrl.exportData);
router.post('/import',                 requirePermission('import_vehicle_types'), Ctrl.importData);
router.post('/import/single',          requirePermission('import_vehicle_types'), Ctrl.importSingleRow);
router.get('/ai-config',               Ctrl.aiConfig);
router.post('/translate',              Ctrl.translate);
router.post('/bulk-action',            requirePermission('edit_vehicle_types'),   Ctrl.bulkAction);
router.get('/create',                  requirePermission('add_vehicle_types'),    Ctrl.create);
router.post('/',                       requirePermission('add_vehicle_types'),    Ctrl.store);
router.get('/:uuid/view-data',         requirePermission('view_vehicle_types'),   Ctrl.viewData);
router.get('/:uuid/edit',              requirePermission('edit_vehicle_types'),   Ctrl.edit);
router.post('/:uuid',                  requirePermission('edit_vehicle_types'),   Ctrl.update);
router.post('/:uuid/toggle-status',    requirePermission('edit_vehicle_types'),   Ctrl.toggleStatus);
router.post('/:uuid/recover',          requirePermission('edit_vehicle_types'),   Ctrl.recover);
router.post('/:uuid/delete',           requirePermission('delete_vehicle_types'), Ctrl.destroy);

module.exports = router;
