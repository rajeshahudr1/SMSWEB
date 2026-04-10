'use strict';
const express = require('express');
const router  = express.Router();
const Ctrl    = require('../Controllers/UnitsController');
const { requireLogin, requirePermission } = require('../Middlewares/auth');
router.use(requireLogin);

router.get('/',                        requirePermission('view_units'),   Ctrl.index);
router.post('/paginate',               requirePermission('view_units'),   Ctrl.paginate);
router.get('/export',                  requirePermission('export_units'), Ctrl.exportData);
router.post('/export',                 requirePermission('export_units'), Ctrl.exportData);
router.post('/import',                 requirePermission('import_units'), Ctrl.importData);
router.post('/import/single',          requirePermission('import_units'), Ctrl.importSingleRow);
router.post('/bulk-action',            requirePermission('edit_units'),   Ctrl.bulkAction);
router.get('/autocomplete',                                               Ctrl.autocomplete);
router.get('/create',                  requirePermission('add_units'),    Ctrl.create);
router.post('/',                       requirePermission('add_units'),    Ctrl.store);
router.get('/:uuid/view-data',         requirePermission('view_units'),   Ctrl.viewData);
router.get('/:uuid/usage',            requirePermission('view_units'),   Ctrl.usage);
router.get('/:uuid/edit',              requirePermission('edit_units'),   Ctrl.edit);
router.post('/:uuid',                  requirePermission('edit_units'),   Ctrl.update);
router.post('/:uuid/toggle-status',    requirePermission('edit_units'),   Ctrl.toggleStatus);
router.post('/:uuid/recover',          requirePermission('edit_units'),   Ctrl.recover);
router.post('/:uuid/delete',           requirePermission('delete_units'), Ctrl.destroy);

module.exports = router;
