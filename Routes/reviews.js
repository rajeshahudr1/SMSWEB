'use strict';
const express = require('express');
const router = express.Router();
const Ctrl = require('../Controllers/ReviewsController');
const { requireLogin, requireSuperAdmin } = require('../Middlewares/auth');

router.use(requireLogin);
router.use(requireSuperAdmin);

router.get('/', Ctrl.index);
router.post('/paginate', Ctrl.paginate);
router.post('/:uuid', Ctrl.update);
router.post('/:uuid/delete', Ctrl.destroy);

module.exports = router;
