const router = require('express').Router();
const ctrl = require('../controllers/overstay.controller');
const verifyToken = require('../middleware/verifyToken');
const requireAdmin = require('../middleware/requireAdmin');

router.get('/', verifyToken, requireAdmin, ctrl.getOverstays);

module.exports = router;
