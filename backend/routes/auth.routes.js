const router = require('express').Router();
const ctrl = require('../controllers/auth.controller');
const verifyToken = require('../middleware/verifyToken');
const requireSuperAdmin = require('../middleware/requireSuperAdmin');

router.post('/send-signup-otp', ctrl.sendSignupOtp);
router.post('/verify-signup-otp', ctrl.verifySignupOtp);
router.post('/register', ctrl.register);
router.post('/register-admin', verifyToken, requireSuperAdmin, ctrl.registerAdmin);
router.post('/login', ctrl.login);
router.get('/me', verifyToken, ctrl.getMe);
router.put('/change-password', verifyToken, ctrl.changePassword);
router.post('/forgot-password', ctrl.forgotPassword);
router.post('/reset-password', ctrl.resetPassword);

module.exports = router;
