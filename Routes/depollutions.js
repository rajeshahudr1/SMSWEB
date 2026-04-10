'use strict';
const express = require('express');
const router  = express.Router();
const Ctrl    = require('../Controllers/DepollutionsController');
const { requireLogin, requirePermission } = require('../Middlewares/auth');
router.use(requireLogin);

router.get('/',                        requirePermission('view_depollutions'),   Ctrl.index);
router.post('/paginate',               requirePermission('view_depollutions'),   Ctrl.paginate);
router.get('/group-by-ler',            requirePermission('view_depollutions'),   Ctrl.groupByLer);
router.get('/group-by-ler-detail',     requirePermission('view_depollutions'),   Ctrl.groupByLerDetail);
router.post('/bulk-update-wastage',    requirePermission('edit_depollutions'),   Ctrl.bulkUpdateWastage);
router.get('/export',                  requirePermission('export_depollutions'), Ctrl.exportData);
router.post('/export',                 requirePermission('export_depollutions'), Ctrl.exportData);
router.post('/import',                 requirePermission('import_depollutions'), Ctrl.importData);
router.post('/import/single',          requirePermission('import_depollutions'), Ctrl.importSingleRow);
router.post('/bulk-action',            requirePermission('edit_depollutions'),   Ctrl.bulkAction);
router.get('/create',                  requirePermission('add_depollutions'),    Ctrl.create);
router.post('/',                       requirePermission('add_depollutions'),    Ctrl.store);
router.get('/:uuid/view-data',         requirePermission('view_depollutions'),   Ctrl.viewData);
router.get('/:uuid/edit',              requirePermission('edit_depollutions'),   Ctrl.edit);
router.post('/:uuid',                  requirePermission('edit_depollutions'),   Ctrl.update);
router.post('/:uuid/recover',          requirePermission('edit_depollutions'),   Ctrl.recover);
router.post('/:uuid/delete',           requirePermission('delete_depollutions'), Ctrl.destroy);

module.exports = router;
