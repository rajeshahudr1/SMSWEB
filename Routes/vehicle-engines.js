'use strict';
const express = require('express');
const router  = express.Router();
const Ctrl    = require('../Controllers/VehicleEnginesController');
const { requireLogin, requirePermission } = require('../Middlewares/auth');
router.use(requireLogin);

router.get('/',                        requirePermission('view_vehicle_engines'),   Ctrl.index);
router.post('/paginate',               requirePermission('view_vehicle_engines'),   Ctrl.paginate);
router.get('/export',                  requirePermission('export_vehicle_engines'), Ctrl.exportData);
router.post('/export',                 requirePermission('export_vehicle_engines'), Ctrl.exportData);
router.post('/import',                 requirePermission('import_vehicle_engines'), Ctrl.importData);
router.post('/import/single',          requirePermission('import_vehicle_engines'), Ctrl.importSingleRow);
router.get('/ai-config',               Ctrl.aiConfig);
router.post('/translate',              Ctrl.translate);
router.post('/:uuid/update-variants', requirePermission('edit_vehicle_engines'), Ctrl.updateVariants);
router.post('/bulk-action',            requirePermission('edit_vehicle_engines'),   Ctrl.bulkAction);
router.get('/create',                  requirePermission('add_vehicle_engines'),    Ctrl.create);
router.post('/',                       requirePermission('add_vehicle_engines'),    Ctrl.store);
router.get('/:uuid/view-data',         requirePermission('view_vehicle_engines'),   Ctrl.viewData);
router.get('/:uuid/edit',              requirePermission('edit_vehicle_engines'),   Ctrl.edit);
router.post('/:uuid',                  requirePermission('edit_vehicle_engines'),   Ctrl.update);
router.post('/:uuid/toggle-status',    requirePermission('edit_vehicle_engines'),   Ctrl.toggleStatus);
router.post('/:uuid/recover',          requirePermission('edit_vehicle_engines'),   Ctrl.recover);
router.post('/:uuid/delete',           requirePermission('delete_vehicle_engines'), Ctrl.destroy);

module.exports = router;