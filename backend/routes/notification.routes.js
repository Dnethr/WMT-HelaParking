const router = require('express').Router();
const ctrl = require('../controllers/notification.controller');
const verifyToken = require('../middleware/verifyToken');
const requireAdmin = require('../middleware/requireAdmin');

router.get('/my', verifyToken, ctrl.getMyNotifications);
router.put('/read-all', verifyToken, ctrl.markAllAsRead);
router.put('/:id/read', verifyToken, ctrl.markAsRead);
router.post('/broadcast', verifyToken, requireAdmin, ctrl.broadcast);
router.post('/push-token', verifyToken, ctrl.registerPushToken);

module.exports = router;
