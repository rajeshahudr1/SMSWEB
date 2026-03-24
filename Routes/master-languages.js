'use strict';

const express = require('express');
const router  = express.Router();
const Ctrl    = require('../Controllers/MasterLanguagesController');
const { requireLogin, requireSuperAdmin } = require('../Middlewares/auth');

router.use(requireLogin);
router.use(requireSuperAdmin);

router.get( '/',                       Ctrl.index);
router.get( '/available',             Ctrl.availableLanguages);   // DDL data
router.post('/paginate',               Ctrl.paginate);
router.post('/',                       Ctrl.store);
router.get( '/:uuid',                  Ctrl.show);
router.post('/:uuid',                  Ctrl.update);
router.post('/:uuid/delete',           Ctrl.destroy);
router.post('/:uuid/toggle-status',    Ctrl.toggleStatus);

module.exports = router;
