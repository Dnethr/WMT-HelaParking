const router = require('express').Router();
const ctrl = require('../controllers/fine.controller');
const verifyToken = require('../middleware/verifyToken');
const requireAdmin = require('../middleware/requireAdmin');

router.post('/', verifyToken, requireAdmin, ctrl.createFine);
router.get('/my', verifyToken, ctrl.getMyFines);
router.get('/', verifyToken, requireAdmin, ctrl.getAllFines);
router.put('/:id/pay', verifyToken, ctrl.payFine);

module.exports = router;
