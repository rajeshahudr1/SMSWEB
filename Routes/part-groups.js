'use strict';
const express = require('express');
const router  = express.Router();
const Ctrl    = require('../Controllers/PartGroupsController');
const { requireLogin, requirePermission } = require('../Middlewares/auth');
router.use(requireLogin);

router.get('/',                        requirePermission('view_part_groups'),   Ctrl.index);
router.post('/paginate',               requirePermission('view_part_groups'),   Ctrl.paginate);
router.get('/export',                  requirePermission('export_part_groups'), Ctrl.exportData);
router.post('/export',                 requirePermission('export_part_groups'), Ctrl.exportData);
router.post('/import',                 requirePermission('import_part_groups'), Ctrl.importData);
router.post('/import/single',          requirePermission('import_part_groups'), Ctrl.importSingleRow);
router.get('/ai-config',               Ctrl.aiConfig);
router.post('/translate',              Ctrl.translate);
router.post('/bulk-action',            requirePermission('edit_part_groups'),   Ctrl.bulkAction);
router.get('/create',                  requirePermission('add_part_groups'),    Ctrl.create);
router.post('/',                       requirePermission('add_part_groups'),    Ctrl.store);
router.get('/:uuid/view-data',         requirePermission('view_part_groups'),   Ctrl.viewData);
router.get('/:uuid/edit',              requirePermission('edit_part_groups'),   Ctrl.edit);
router.post('/:uuid',                  requirePermission('edit_part_groups'),   Ctrl.update);
router.post('/:uuid/toggle-status',    requirePermission('edit_part_groups'),   Ctrl.toggleStatus);
router.post('/:uuid/recover',          requirePermission('edit_part_groups'),   Ctrl.recover);
router.post('/:uuid/delete',           requirePermission('delete_part_groups'), Ctrl.destroy);

module.exports = router;
