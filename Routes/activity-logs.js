'use strict';
var router = require('express').Router();
var ctrl   = require('../Controllers/ActivityLogsController');

router.get('/',                              ctrl.index);
router.post('/paginate',                     ctrl.paginate);
router.get('/stats',                         ctrl.stats);
router.post('/compare',                      ctrl.compare);
router.get('/record/:module/:uuid',          ctrl.recordHistory);
router.get('/export',                        ctrl.exportData);
router.post('/export',                       ctrl.exportData);
router.get('/:id',                           ctrl.show);

module.exports = router;
