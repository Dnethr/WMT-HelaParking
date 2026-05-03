const router = require('express').Router();
const ctrl = require('../controllers/pricing.controller');
const verifyToken = require('../middleware/verifyToken');
const requireSuperAdmin = require('../middleware/requireSuperAdmin');

router.get('/', verifyToken, ctrl.getAllPricing);
router.put('/', verifyToken, requireSuperAdmin, ctrl.bulkUpdatePricing);

module.exports = router;
