'use strict';
const express = require('express');
const router  = express.Router();
const Ctrl    = require('../Controllers/PartSidesController');
const { requireLogin, requirePermission } = require('../Middlewares/auth');
router.use(requireLogin);

router.get('/',                        requirePermission('view_part_sides'),   Ctrl.index);
router.post('/paginate',               requirePermission('view_part_sides'),   Ctrl.paginate);
router.get('/export',                  requirePermission('export_part_sides'), Ctrl.exportData);
router.post('/export',                 requirePermission('export_part_sides'), Ctrl.exportData);
router.post('/import',                 requirePermission('import_part_sides'), Ctrl.importData);
router.post('/import/single',          requirePermission('import_part_sides'), Ctrl.importSingleRow);
router.get('/ai-config',               Ctrl.aiConfig);
router.post('/translate',              Ctrl.translate);
router.post('/bulk-action',            requirePermission('edit_part_sides'),   Ctrl.bulkAction);
router.get('/create',                  requirePermission('add_part_sides'),    Ctrl.create);
router.post('/',                       requirePermission('add_part_sides'),    Ctrl.store);
router.get('/:uuid/view-data',         requirePermission('view_part_sides'),   Ctrl.viewData);
router.get('/:uuid/edit',              requirePermission('edit_part_sides'),   Ctrl.edit);
router.post('/:uuid',                  requirePermission('edit_part_sides'),   Ctrl.update);
router.post('/:uuid/toggle-status',    requirePermission('edit_part_sides'),   Ctrl.toggleStatus);
router.post('/:uuid/recover',          requirePermission('edit_part_sides'),   Ctrl.recover);
router.post('/:uuid/delete',           requirePermission('delete_part_sides'), Ctrl.destroy);

module.exports = router;
