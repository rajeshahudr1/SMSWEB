'use strict';

const express = require('express');
const router  = express.Router();
const Ctrl    = require('../Controllers/MasterLanguagesController');
const { requireLogin, requirePermission } = require('../Middlewares/auth');

router.use(requireLogin);

router.get( '/',                       requirePermission('view_master_languages'),   Ctrl.index);
router.get( '/organizations',          requirePermission('view_master_languages'),   Ctrl.organizations);
router.get( '/available',              Ctrl.availableLanguages);
router.post('/paginate',               requirePermission('view_master_languages'),   Ctrl.paginate);
router.post('/',                       requirePermission('add_master_languages'),    Ctrl.store);
router.get( '/:uuid/usage',            requirePermission('view_master_languages'),   Ctrl.usage);
router.get( '/:uuid',                  requirePermission('view_master_languages'),   Ctrl.show);
router.post('/:uuid',                  requirePermission('edit_master_languages'),   Ctrl.update);
router.post('/:uuid/delete',           requirePermission('delete_master_languages'), Ctrl.destroy);
router.post('/:uuid/toggle-status',    requirePermission('edit_master_languages'),   Ctrl.toggleStatus);

module.exports = router;
