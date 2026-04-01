'use strict';
const express = require('express');
const router  = express.Router();
const Ctrl    = require('../Controllers/VehicleInventoriesController');
const { requireLogin, requirePermission } = require('../Middlewares/auth');
router.use(requireLogin);

router.get('/',                          requirePermission('view_vehicle_inventories'),   Ctrl.index);
router.post('/paginate',                 requirePermission('view_vehicle_inventories'),   Ctrl.paginate);
router.get('/enums',                     Ctrl.enums);
router.get('/settings',                  Ctrl.getSettings);
router.post('/settings',                 requirePermission('edit_vehicle_inventories'),   Ctrl.saveSettings);
router.post('/list-columns',             requirePermission('edit_vehicle_inventories'),   Ctrl.saveListColumns);
router.get('/export',                    requirePermission('export_vehicle_inventories'), Ctrl.exportData);
router.post('/export',                   requirePermission('export_vehicle_inventories'), Ctrl.exportData);
router.post('/bulk-action',              requirePermission('edit_vehicle_inventories'),   Ctrl.bulkAction);
router.get('/create',                    requirePermission('add_vehicle_inventories'),    Ctrl.create);
router.post('/',                         requirePermission('add_vehicle_inventories'),    Ctrl.store);
router.get('/:uuid/view-data',           requirePermission('view_vehicle_inventories'),   Ctrl.viewData);
router.get('/:uuid/edit',                requirePermission('edit_vehicle_inventories'),   Ctrl.edit);
router.post('/:uuid',                    requirePermission('edit_vehicle_inventories'),   Ctrl.update);
router.post('/:uuid/toggle-status',      requirePermission('edit_vehicle_inventories'),   Ctrl.toggleStatus);
router.post('/:uuid/recover',            requirePermission('edit_vehicle_inventories'),   Ctrl.recover);
router.post('/:uuid/delete',             requirePermission('delete_vehicle_inventories'), Ctrl.destroy);
// Images
router.post('/:uuid/images',             requirePermission('edit_vehicle_inventories'),   Ctrl.uploadImages);
router.post('/:uuid/images/delete',      requirePermission('edit_vehicle_inventories'),   Ctrl.deleteImage);
router.post('/:uuid/images/reorder',     requirePermission('edit_vehicle_inventories'),   Ctrl.reorderImages);
// Videos
router.post('/:uuid/videos',             requirePermission('edit_vehicle_inventories'),   Ctrl.uploadVideos);
router.post('/:uuid/videos/delete',      requirePermission('edit_vehicle_inventories'),   Ctrl.deleteVideo);
router.post('/:uuid/videos/reorder',     requirePermission('edit_vehicle_inventories'),   Ctrl.reorderVideos);
// Documents
router.post('/:uuid/documents',          requirePermission('edit_vehicle_inventories'),   Ctrl.uploadDocument);
router.post('/:uuid/documents/delete',   requirePermission('edit_vehicle_inventories'),   Ctrl.deleteDocument);

module.exports = router;
