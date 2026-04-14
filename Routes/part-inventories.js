'use strict';
const express = require('express');
const router  = express.Router();
const Ctrl    = require('../Controllers/PartInventoriesController');
const { requireLogin, requirePermission } = require('../Middlewares/auth');
router.use(requireLogin);

router.get('/organizations',             requirePermission('view_part_inventories'),   Ctrl.organizations);
router.get('/autocomplete',              Ctrl.autocomplete);
router.get('/check-duplicate',           requirePermission('view_part_inventories'),   Ctrl.checkDuplicate);
router.get('/:uuid/sub-parts',           requirePermission('view_part_inventories'),   Ctrl.subParts);
router.get('/',                          requirePermission('view_part_inventories'),   Ctrl.index);
router.post('/paginate',                 requirePermission('view_part_inventories'),   Ctrl.paginate);
router.get('/enums',                     Ctrl.enums);
router.get('/settings',                  Ctrl.getSettings);
router.post('/settings',                 requirePermission('settings_part_columns'),   Ctrl.saveSettings);
router.post('/list-columns',             requirePermission('settings_part_columns'),   Ctrl.saveListColumns);
router.get('/export',                    requirePermission('export_part_inventories'), Ctrl.exportData);
router.post('/export',                   requirePermission('export_part_inventories'), Ctrl.exportData);
router.post('/bulk-action',              requirePermission('edit_part_inventories'),   Ctrl.bulkAction);
router.get('/create',                    requirePermission('add_part_inventories'),    Ctrl.create);
router.post('/',                         requirePermission('add_part_inventories'),    Ctrl.store);
router.get('/autocomplete',              requirePermission('view_part_inventories'),   Ctrl.autocomplete);
router.get('/organizations',             Ctrl.organizations);
router.get('/:uuid/usage',              requirePermission('view_part_inventories'),   Ctrl.usage);
router.get('/:uuid/view-data',           requirePermission('view_part_inventories'),   Ctrl.viewData);
router.get('/:uuid/pdf',                 requirePermission('view_part_inventories'),   Ctrl.pdf);
router.get('/:uuid/edit',                requirePermission('edit_part_inventories'),   Ctrl.edit);
router.post('/:uuid',                    requirePermission('edit_part_inventories'),   Ctrl.update);
router.post('/:uuid/toggle-status',      requirePermission('edit_part_inventories'),   Ctrl.toggleStatus);
router.post('/:uuid/recover',            requirePermission('edit_part_inventories'),   Ctrl.recover);
router.post('/:uuid/delete',             requirePermission('delete_part_inventories'), Ctrl.destroy);
// Images
router.post('/:uuid/images',             requirePermission('edit_part_inventories'),   Ctrl.uploadImages);
router.post('/:uuid/images/delete',      requirePermission('edit_part_inventories'),   Ctrl.deleteImage);
router.post('/:uuid/images/:imageId/replace', requirePermission('edit_part_inventories'), Ctrl.replaceImage);
router.post('/:uuid/images/reorder',     requirePermission('edit_part_inventories'),   Ctrl.reorderImages);

// Videos
router.post('/:uuid/videos',             requirePermission('edit_part_inventories'),   Ctrl.uploadVideos);
router.post('/:uuid/videos/delete',      requirePermission('edit_part_inventories'),   Ctrl.deleteVideo);
router.post('/:uuid/videos/reorder',     requirePermission('edit_part_inventories'),   Ctrl.reorderVideos);

// Locations
router.get('/:uuid/locations',           requirePermission('view_part_inventories'),   Ctrl.getLocations);
router.post('/:uuid/locations/bulk',     requirePermission('edit_part_inventories'),   Ctrl.bulkSaveLocations);
router.post('/:uuid/locations',          requirePermission('edit_part_inventories'),   Ctrl.saveLocation);
router.post('/:uuid/locations/delete',   requirePermission('edit_part_inventories'),   Ctrl.deleteLocation);

// References
router.get('/:uuid/references',          requirePermission('view_part_inventories'),   Ctrl.getReferences);
router.post('/:uuid/references',         requirePermission('edit_part_inventories'),   Ctrl.saveReference);
router.post('/:uuid/references/bulk',    requirePermission('edit_part_inventories'),   Ctrl.bulkSaveReferences);
router.post('/:uuid/references/delete',  requirePermission('edit_part_inventories'),   Ctrl.deleteReference);

// Damages
router.get('/:uuid/damages',             requirePermission('view_part_inventories'),   Ctrl.getDamages);
router.post('/:uuid/damages',            requirePermission('edit_part_inventories'),   Ctrl.saveDamage);
router.post('/:uuid/damages/bulk',       requirePermission('edit_part_inventories'),   Ctrl.bulkSaveDamages);
router.post('/:uuid/damages/delete',     requirePermission('edit_part_inventories'),   Ctrl.deleteDamage);

// Attributes
router.get('/:uuid/attributes',          requirePermission('view_part_inventories'),   Ctrl.getAttributes);
router.post('/:uuid/attributes',         requirePermission('edit_part_inventories'),   Ctrl.saveAttributes);

module.exports = router;
