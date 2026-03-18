'use strict';
const express = require('express');
const router  = express.Router();
const Menus   = require('../Controllers/MenusController');
const { requireLogin, requirePermission } = require('../Middlewares/auth');

router.use(requireLogin);

router.get( '/',                            requirePermission('view_menus'),   Menus.index);
router.get( '/data',                        requirePermission('view_menus'),   Menus.getData);
router.get( '/create',                      requirePermission('add_menus'),    Menus.create);
router.post('/',                            requirePermission('add_menus'),    Menus.store);
router.get( '/:uuid/edit',                  requirePermission('edit_menus'),   Menus.edit);
router.post('/:uuid',                       requirePermission('edit_menus'),   Menus.update);
router.post('/:uuid/delete',                requirePermission('delete_menus'), Menus.destroy);
router.post('/:uuid/toggle-visibility',     requirePermission('edit_menus'),   Menus.toggleVisibility);

module.exports = router;
