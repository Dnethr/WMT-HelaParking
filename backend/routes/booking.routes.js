const router = require('express').Router();
const ctrl = require('../controllers/booking.controller');
const verifyToken = require('../middleware/verifyToken');
const requireAdmin = require('../middleware/requireAdmin');

router.post('/', verifyToken, ctrl.createBooking);
router.get('/my', verifyToken, ctrl.getMyBookings);
router.get('/', verifyToken, ctrl.getAllBookings);
router.put('/:id/cancel', verifyToken, ctrl.cancelBooking);
router.put('/:id/extend', verifyToken, ctrl.extendBooking);
router.get('/:id/qr', verifyToken, ctrl.getBookingQR);

module.exports = router;
