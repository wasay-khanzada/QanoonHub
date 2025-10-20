const express = require('express');
const router = express.Router();
const { getCaseMessages, getCasesWithMessages, deleteCaseMessages } = require('../controllers/chatController');
const { requireAuth } = require('../middlewares/authMiddleware');

// Test route (no auth required)
router.get('/test', (req, res) => {
    res.json({ message: 'Chat routes are working!' });
});

// Apply authentication middleware to all routes
router.use(requireAuth);

// Get messages for a specific case
router.get('/cases/:caseId/messages', getCaseMessages);

// Get all cases with message counts for the user
router.get('/cases/messages', getCasesWithMessages);

// Delete all messages for a specific case
router.delete('/cases/:caseId/messages', deleteCaseMessages);

module.exports = router;
