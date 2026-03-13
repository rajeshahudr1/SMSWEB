'use strict';

const express   = require('express');
const router    = express.Router();
const Dashboard = require('../Controllers/DashboardController');
const { requireLogin } = require('../Middlewares/auth');

router.get('/', requireLogin, Dashboard.index);

module.exports = router;
