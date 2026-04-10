'use strict';
const express = require('express');
const router  = express.Router();
const Ctrl    = require('../Controllers/LersController');
const { requireLogin, requirePermission } = require('../Middlewares/auth');
router.use(requireLogin);

router.get('/autocomplete',                                               Ctrl.autocomplete);
router.get('/',                        requirePermission('view_lers'),   Ctrl.index);
router.post('/paginate',               requirePermission('view_lers'),   Ctrl.paginate);
router.get('/export',                  requirePermission('export_lers'), Ctrl.exportData);
router.post('/export',                 requirePermission('export_lers'), Ctrl.exportData);
router.post('/import',                 requirePermission('import_lers'), Ctrl.importData);
router.post('/import/single',          requirePermission('import_lers'), Ctrl.importSingleRow);
router.post('/bulk-action',            requirePermission('edit_lers'),   Ctrl.bulkAction);
router.get('/create',                  requirePermission('add_lers'),    Ctrl.create);
router.post('/',                       requirePermission('add_lers'),    Ctrl.store);
router.get('/:uuid/view-data',         requirePermission('view_lers'),   Ctrl.viewData);
router.get('/:uuid/usage',            requirePermission('view_lers'),   Ctrl.usage);
router.get('/:uuid/edit',              requirePermission('edit_lers'),   Ctrl.edit);
router.post('/:uuid',                  requirePermission('edit_lers'),   Ctrl.update);
router.post('/:uuid/toggle-status',    requirePermission('edit_lers'),   Ctrl.toggleStatus);
router.post('/:uuid/recover',          requirePermission('edit_lers'),   Ctrl.recover);
router.post('/:uuid/delete',           requirePermission('delete_lers'), Ctrl.destroy);

module.exports = router;
