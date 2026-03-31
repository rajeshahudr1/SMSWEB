'use strict';
const express = require('express');
const router  = express.Router();
const Ctrl    = require('../Controllers/PartBrandsController');
const { requireLogin, requirePermission } = require('../Middlewares/auth');
router.use(requireLogin);

router.get('/',                        requirePermission('view_part_brands'),   Ctrl.index);
router.post('/paginate',               requirePermission('view_part_brands'),   Ctrl.paginate);
router.get('/export',                  requirePermission('export_part_brands'), Ctrl.exportData);
router.post('/export',                 requirePermission('export_part_brands'), Ctrl.exportData);
router.post('/import',                 requirePermission('import_part_brands'), Ctrl.importData);
router.post('/import/single',          requirePermission('import_part_brands'), Ctrl.importSingleRow);
router.get('/ai-config',               Ctrl.aiConfig);
router.post('/translate',              Ctrl.translate);
router.post('/bulk-action',            requirePermission('edit_part_brands'),   Ctrl.bulkAction);
router.get('/create',                  requirePermission('add_part_brands'),    Ctrl.create);
router.post('/',                       requirePermission('add_part_brands'),    Ctrl.store);
router.get('/:uuid/usage',             requirePermission('view_part_brands'),   Ctrl.usage);
router.get('/:uuid/view-data',         requirePermission('view_part_brands'),   Ctrl.viewData);
router.get('/:uuid/edit',              requirePermission('edit_part_brands'),   Ctrl.edit);
router.post('/:uuid',                  requirePermission('edit_part_brands'),   Ctrl.update);
router.post('/:uuid/toggle-status',    requirePermission('edit_part_brands'),   Ctrl.toggleStatus);
router.post('/:uuid/recover',          requirePermission('edit_part_brands'),   Ctrl.recover);
router.post('/:uuid/delete',           requirePermission('delete_part_brands'), Ctrl.destroy);

module.exports = router;
