'use strict';
const express = require('express');
const router  = express.Router();
const Ctrl    = require('../Controllers/VehicleFuelsController');
const { requireLogin, requirePermission } = require('../Middlewares/auth');
router.use(requireLogin);

router.get('/',                        requirePermission('view_vehicle_fuels'),   Ctrl.index);
router.post('/paginate',               requirePermission('view_vehicle_fuels'),   Ctrl.paginate);
router.get('/export',                  requirePermission('export_vehicle_fuels'), Ctrl.exportData);
router.post('/export',                 requirePermission('export_vehicle_fuels'), Ctrl.exportData);
router.post('/import',                 requirePermission('import_vehicle_fuels'), Ctrl.importData);
router.post('/import/single',          requirePermission('import_vehicle_fuels'), Ctrl.importSingleRow);
router.get('/ai-config',               Ctrl.aiConfig);
router.post('/translate',              Ctrl.translate);
router.post('/bulk-action',            requirePermission('edit_vehicle_fuels'),   Ctrl.bulkAction);
router.get('/create',                  requirePermission('add_vehicle_fuels'),    Ctrl.create);
router.post('/',                       requirePermission('add_vehicle_fuels'),    Ctrl.store);
router.get('/:uuid/usage',             requirePermission('view_vehicle_fuels'),   Ctrl.usage);
router.get('/:uuid/view-data',         requirePermission('view_vehicle_fuels'),   Ctrl.viewData);
router.get('/:uuid/edit',              requirePermission('edit_vehicle_fuels'),   Ctrl.edit);
router.post('/:uuid',                  requirePermission('edit_vehicle_fuels'),   Ctrl.update);
router.post('/:uuid/toggle-status',    requirePermission('edit_vehicle_fuels'),   Ctrl.toggleStatus);
router.post('/:uuid/recover',          requirePermission('edit_vehicle_fuels'),   Ctrl.recover);
router.post('/:uuid/delete',           requirePermission('delete_vehicle_fuels'), Ctrl.destroy);

module.exports = router;
