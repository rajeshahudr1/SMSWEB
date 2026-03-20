'use strict';

const express = require('express');
const router  = express.Router();
const Pages   = require('../Controllers/PagesController');
const { requireLogin, requireSuperAdmin } = require('../Middlewares/auth');

router.use(requireLogin);
router.use(requireSuperAdmin);

router.get('/',              Pages.index);
router.get('/:uuid/edit',   Pages.edit);
router.post('/:uuid',       Pages.update);

module.exports = router;
