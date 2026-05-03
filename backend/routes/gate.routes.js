const router = require('express').Router();
const ctrl = require('../controllers/gate.controller');
const verifyToken = require('../middleware/verifyToken');
const requireAdmin = require('../middleware/requireAdmin');

router.post('/checkin', verifyToken, requireAdmin, ctrl.checkIn);
router.post('/checkout', verifyToken, requireAdmin, ctrl.checkOut);
router.post('/scan', verifyToken, requireAdmin, ctrl.scan);

module.exports = router;
