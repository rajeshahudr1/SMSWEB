'use strict';
const express = require('express');
const router  = express.Router();
const Ctrl    = require('../Controllers/PackagesController');
const { requireLogin, requireSuperAdmin } = require('../Middlewares/auth');

router.use(requireLogin);
router.use(requireSuperAdmin);

router.get('/',                        Ctrl.index);
router.post('/paginate',               Ctrl.paginate);
router.get('/roles',                   Ctrl.roles);
router.get('/role-modules',            Ctrl.roleModules);
router.get('/sort',                    Ctrl.sortOrder);
router.post('/reorder',               Ctrl.reorder);
router.get('/export',                 Ctrl.exportData);
router.post('/export',                Ctrl.exportData);
router.get('/enquiries',               Ctrl.enquiries);
router.post('/enquiries/paginate',     Ctrl.enquiriesPaginate);
router.post('/enquiries/export',       Ctrl.exportEnquiries);
router.get('/enquiries/:uuid',         Ctrl.showEnquiry);
router.post('/enquiries/:uuid',        Ctrl.updateEnquiry);
router.post('/enquiries/:uuid/note',   Ctrl.addEnquiryNote);
router.post('/enquiries/:uuid/delete', Ctrl.deleteEnquiry);
router.get('/create',                  Ctrl.create);
router.post('/',                       Ctrl.store);
router.post('/bulk-action',            Ctrl.bulkAction);
router.get('/:uuid/view-data',        Ctrl.viewData);
router.get('/:uuid/edit',             Ctrl.edit);
router.post('/:uuid',                 Ctrl.update);
router.post('/:uuid/toggle-status',   Ctrl.toggleStatus);
router.post('/:uuid/recover',         Ctrl.recover);
router.post('/:uuid/delete',          Ctrl.destroy);
router.post('/:uuid/assign-org',      Ctrl.assignOrg);

module.exports = router;
