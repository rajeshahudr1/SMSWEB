'use strict';
const express = require('express');
const router  = express.Router();
const Ctrl    = require('../Controllers/VehicleMakesController');
const { requireLogin, requirePermission } = require('../Middlewares/auth');
router.use(requireLogin);

router.get('/',                        requirePermission('view_vehicle_makes'),   Ctrl.index);
router.post('/paginate',               requirePermission('view_vehicle_makes'),   Ctrl.paginate);
router.get('/export',                  requirePermission('export_vehicle_makes'), Ctrl.exportData);
router.post('/export',                 requirePermission('export_vehicle_makes'), Ctrl.exportData);
router.post('/import',                 requirePermission('import_vehicle_makes'), Ctrl.importData);
router.post('/import/single',          requirePermission('import_vehicle_makes'), Ctrl.importSingleRow);
router.get('/ai-config',               Ctrl.aiConfig);
router.post('/translate',              Ctrl.translate);
router.post('/bulk-action',            requirePermission('edit_vehicle_makes'),   Ctrl.bulkAction);
router.get('/create',                  requirePermission('add_vehicle_makes'),    Ctrl.create);
router.post('/',                       requirePermission('add_vehicle_makes'),    Ctrl.store);
router.get('/:uuid/view-data',         requirePermission('view_vehicle_makes'),   Ctrl.viewData);
router.get('/:uuid/edit',              requirePermission('edit_vehicle_makes'),   Ctrl.edit);
router.post('/:uuid',                  requirePermission('edit_vehicle_makes'),   Ctrl.update);
router.post('/:uuid/toggle-status',    requirePermission('edit_vehicle_makes'),   Ctrl.toggleStatus);
router.post('/:uuid/recover',          requirePermission('edit_vehicle_makes'),   Ctrl.recover);
router.post('/:uuid/delete',           requirePermission('delete_vehicle_makes'), Ctrl.destroy);

module.exports = router;
