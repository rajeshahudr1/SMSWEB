'use strict';
const express = require('express');
const router  = express.Router();
const Ctrl    = require('../Controllers/VehicleYearsController');
const { requireLogin, requirePermission } = require('../Middlewares/auth');
router.use(requireLogin);

router.get('/',                        requirePermission('view_vehicle_years'),   Ctrl.index);
router.post('/paginate',               requirePermission('view_vehicle_years'),   Ctrl.paginate);
router.get('/export',                  requirePermission('export_vehicle_years'), Ctrl.exportData);
router.post('/export',                 requirePermission('export_vehicle_years'), Ctrl.exportData);
router.post('/import',                 requirePermission('import_vehicle_years'), Ctrl.importData);
router.post('/import/single',          requirePermission('import_vehicle_years'), Ctrl.importSingleRow);
router.post('/bulk-action',            requirePermission('edit_vehicle_years'),   Ctrl.bulkAction);
router.get('/create',                  requirePermission('add_vehicle_years'),    Ctrl.create);
router.post('/',                       requirePermission('add_vehicle_years'),    Ctrl.store);
router.get('/:uuid/usage',             requirePermission('view_vehicle_years'),   Ctrl.usage);
router.get('/:uuid/view-data',         requirePermission('view_vehicle_years'),   Ctrl.viewData);
router.get('/:uuid/edit',              requirePermission('edit_vehicle_years'),   Ctrl.edit);
router.post('/:uuid',                  requirePermission('edit_vehicle_years'),   Ctrl.update);
router.post('/:uuid/toggle-status',    requirePermission('edit_vehicle_years'),   Ctrl.toggleStatus);
router.post('/:uuid/recover',          requirePermission('edit_vehicle_years'),   Ctrl.recover);
router.post('/:uuid/delete',           requirePermission('delete_vehicle_years'), Ctrl.destroy);

module.exports = router;