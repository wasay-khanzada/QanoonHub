const express = require('express');
const router = express.Router();
const caseController = require('../controllers/caseController');
const { requireAuth } = require('../middlewares/authMiddleware');

// Get cases (different views based on user type)
router.get('/', requireAuth, caseController.getCases);

// Create case (clients only)
router.post('/', requireAuth, caseController.createCase);

// Apply for case (lawyers only)
router.post('/:caseId/apply', requireAuth, caseController.applyForCase);

// Accept application (clients only)
router.put('/:caseId/applications/:applicationId/accept', requireAuth, caseController.acceptApplication);

// Get applications for a case (case owner only)
router.get('/:caseId/applications', requireAuth, caseController.getCaseApplications);

module.exports = router;