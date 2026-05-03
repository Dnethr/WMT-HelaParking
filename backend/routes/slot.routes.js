const router = require('express').Router();
const ctrl = require('../controllers/slot.controller');
const verifyToken = require('../middleware/verifyToken');
const requireAdmin = require('../middleware/requireAdmin');

router.get('/', verifyToken, ctrl.getAllSlots);
router.get('/:id', verifyToken, ctrl.getSlotById);
router.post('/', verifyToken, requireAdmin, ctrl.createSlot);
router.put('/:id', verifyToken, requireAdmin, ctrl.updateSlot);
router.delete('/:id', verifyToken, requireAdmin, ctrl.deleteSlot);

module.exports = router;
