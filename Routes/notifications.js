'use strict';
const express = require('express');
const router  = express.Router();
const Ctrl    = require('../Controllers/NotificationsController');
const { requireLogin } = require('../Middlewares/auth');
router.use(requireLogin);

router.get('/',                       Ctrl.page);         // Notification listing page
router.get('/api-list',               Ctrl.index);        // AJAX list
router.get('/unread-count',       Ctrl.unreadCount);
router.post('/mark-all-read',     Ctrl.markAllRead);
router.get('/job/:uuid',          Ctrl.jobStatus);
router.get('/:uuid',              Ctrl.show);
router.patch('/:uuid/read',       Ctrl.markRead);
router.delete('/:uuid',           Ctrl.destroy);
router.get('/:uuid/download',     Ctrl.downloadFile);

module.exports = router;