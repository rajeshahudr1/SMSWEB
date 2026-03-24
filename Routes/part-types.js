'use strict';

const express  = require('express');
const router   = express.Router();
const Ctrl     = require('../Controllers/PartTypesController');
const { requireLogin, requirePermission } = require('../Middlewares/auth');

router.use(requireLogin);

// ── List + data ──
router.get( '/',                       requirePermission('view_part_types'),   Ctrl.index);
router.post('/paginate',               requirePermission('view_part_types'),   Ctrl.paginate);

// ── Export ──
router.get( '/export',                 requirePermission('export_part_types'), Ctrl.exportData);
router.post('/export',                 requirePermission('export_part_types'), Ctrl.exportData);

// ── Import ──
router.post('/import',                 requirePermission('import_part_types'), Ctrl.importData);

// ── Bulk action ──
router.post('/bulk-action',            requirePermission('edit_part_types'),   Ctrl.bulkAction);

// ── CRUD ──
router.get( '/create',                 requirePermission('add_part_types'),    Ctrl.create);
router.post('/',                       requirePermission('add_part_types'),    Ctrl.store);
router.get( '/:uuid/view-data',        requirePermission('view_part_types'),   Ctrl.viewData);
router.get( '/:uuid/edit',             requirePermission('edit_part_types'),   Ctrl.edit);
router.post('/:uuid',                  requirePermission('edit_part_types'),   Ctrl.update);
router.post('/:uuid/toggle-status',    requirePermission('edit_part_types'),   Ctrl.toggleStatus);
router.post('/:uuid/delete',           requirePermission('delete_part_types'), Ctrl.destroy);

module.exports = router;
