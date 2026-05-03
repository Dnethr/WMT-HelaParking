const router = require('express').Router();
const ctrl = require('../controllers/user.controller');
const verifyToken = require('../middleware/verifyToken');
const requireSuperAdmin = require('../middleware/requireSuperAdmin');

router.get('/', verifyToken, requireSuperAdmin, ctrl.getAllUsers);
router.get('/me/vehicles', verifyToken, ctrl.getVehicles);
router.post('/vehicles', verifyToken, ctrl.addVehicle);
router.delete('/vehicles/:vehicleNumber', verifyToken, ctrl.deleteVehicle);
router.put('/:id', verifyToken, ctrl.updateUser);
router.put('/:id/ban', verifyToken, requireSuperAdmin, ctrl.toggleBan);
router.delete('/me', verifyToken, ctrl.deleteMe);
router.delete('/:id', verifyToken, requireSuperAdmin, ctrl.deleteUser);

module.exports = router;
