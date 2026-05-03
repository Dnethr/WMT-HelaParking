const router = require('express').Router();
const ctrl = require('../controllers/incident.controller');
const verifyToken = require('../middleware/verifyToken');
const requireAdmin = require('../middleware/requireAdmin');
const requireSuperAdmin = require('../middleware/requireSuperAdmin');
const { upload } = require('../utils/uploadMiddleware');

router.post('/', verifyToken, ctrl.createIncident);
router.get('/my', verifyToken, ctrl.getMyIncidents);
router.get('/', verifyToken, requireAdmin, ctrl.getAllIncidents);
router.get('/:id', verifyToken, ctrl.getIncidentById);
router.put('/:id/assign', verifyToken, requireAdmin, ctrl.assignIncident);
router.put('/:id/status', verifyToken, requireAdmin, ctrl.updateIncidentStatus);
router.post('/:id/image', verifyToken, upload.single('image'), ctrl.uploadEvidence);
router.delete('/:id', verifyToken, requireSuperAdmin, ctrl.deleteIncident);

module.exports = router;
