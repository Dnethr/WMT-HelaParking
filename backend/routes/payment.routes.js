const router = require('express').Router();
const ctrl = require('../controllers/payment.controller');
const verifyToken = require('../middleware/verifyToken');
const requireSuperAdmin = require('../middleware/requireSuperAdmin');

router.post('/', verifyToken, ctrl.createPayment);
router.get('/my', verifyToken, ctrl.getMyPayments);
router.get('/revenue', verifyToken, requireSuperAdmin, ctrl.getRevenue);
router.post('/create-payment-intent', verifyToken, ctrl.createPaymentIntent);
router.post('/confirm-payment', verifyToken, ctrl.confirmPayment);
module.exports = router;
