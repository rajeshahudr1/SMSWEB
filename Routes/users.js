'use strict';

const express  = require('express');
const router   = express.Router();
const Users    = require('../Controllers/UsersController');
const { requireLogin, requirePermission } = require('../Middlewares/auth');
const multer   = require('multer');
const path     = require('path');
const fs       = require('fs');
const os       = require('os');

// Temp storage for import files
const upload = multer({
    dest: os.tmpdir(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, ['.csv', '.xlsx', '.xls'].includes(ext));
    },
});

router.use(requireLogin);

// ── List + data ──
router.get( '/organizations',           requirePermission('view_users'),   Users.organizations);
router.get( '/',                       requirePermission('view_users'),   Users.index);
router.post('/paginate',               requirePermission('view_users'),   Users.paginate);

// ── Export (GET for CSV/Excel direct download, POST for filters) ──
router.get( '/export',                 requirePermission('view_users'),   Users.exportData);
router.post('/export',                 requirePermission('view_users'),   Users.exportData);

// ── Import ──
router.post('/import',                 requirePermission('add_users'),    upload.single('file'), Users.importData);

// ── Bulk action ──
router.post('/bulk-action',            requirePermission('edit_users'),   Users.bulkAction);

// ── CRUD ──
router.get( '/create',                 requirePermission('add_users'),    Users.create);
router.post('/',                       requirePermission('add_users'),    Users.store);
router.get( '/:uuid/view-data',        requirePermission('view_users'),   Users.viewData);
router.get( '/:uuid/edit',             requirePermission('edit_users'),   Users.edit);
router.post('/:uuid',                  requirePermission('edit_users'),   Users.update);
router.post('/:uuid/toggle-status',    requirePermission('edit_users'),   Users.toggleStatus);
router.get( '/:uuid/delete',           requirePermission('delete_users'), Users.deleteConfirm);
router.post('/:uuid/delete',           requirePermission('delete_users'), Users.destroy);

module.exports = router;