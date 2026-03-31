'use strict';
const express = require('express');
const router  = express.Router();
const Ctrl    = require('../Controllers/PartLocationsController');
const { requireLogin, requirePermission } = require('../Middlewares/auth');
router.use(requireLogin);

router.get('/',                        requirePermission('view_part_locations'),   Ctrl.index);
router.post('/paginate',               requirePermission('view_part_locations'),   Ctrl.paginate);
router.get('/export',                  requirePermission('export_part_locations'), Ctrl.exportData);
router.post('/export',                 requirePermission('export_part_locations'), Ctrl.exportData);
router.post('/import',                 requirePermission('import_part_locations'), Ctrl.importData);
router.post('/import/single',          requirePermission('import_part_locations'), Ctrl.importSingleRow);
router.get('/ai-config',               Ctrl.aiConfig);
router.post('/translate',              Ctrl.translate);
router.post('/bulk-action',            requirePermission('edit_part_locations'),   Ctrl.bulkAction);
router.get('/create',                  requirePermission('add_part_locations'),    Ctrl.create);
router.post('/',                       requirePermission('add_part_locations'),    Ctrl.store);
router.get('/:uuid/usage',             requirePermission('view_part_locations'),   Ctrl.usage);
router.get('/:uuid/view-data',         requirePermission('view_part_locations'),   Ctrl.viewData);
router.get('/:uuid/edit',              requirePermission('edit_part_locations'),   Ctrl.edit);
router.post('/:uuid',                  requirePermission('edit_part_locations'),   Ctrl.update);
router.post('/:uuid/toggle-status',    requirePermission('edit_part_locations'),   Ctrl.toggleStatus);
router.post('/:uuid/recover',          requirePermission('edit_part_locations'),   Ctrl.recover);
router.post('/:uuid/delete',           requirePermission('delete_part_locations'), Ctrl.destroy);

module.exports = router;
