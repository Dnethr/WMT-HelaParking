const router = require('express').Router();
const ctrl = require('../controllers/settings.controller');
const verifyToken = require('../middleware/verifyToken');
const requireSuperAdmin = require('../middleware/requireSuperAdmin');

router.get('/', verifyToken, ctrl.getSettings);
router.put('/', verifyToken, requireSuperAdmin, ctrl.updateSettings);

module.exports = router;
