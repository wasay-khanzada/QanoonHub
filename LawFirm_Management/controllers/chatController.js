const Message = require('../models/message');
const Case = require('../models/case');
const getUserInfo = require('../helpers/getUserInfo');

// Get messages for a specific case
const getCaseMessages = async (req, res) => {
    try {
        const { userId, type } = getUserInfo(res);
        const { caseId } = req.params;

        // Verify user has access to this case
        const caseData = await Case.findById(caseId)
            .populate('client_id', 'username email')
            .populate('assigned_lawyer_id', 'username email');

        if (!caseData) {
            return res.status(404).json({
                error: 'Case not found'
            });
        }

        // Check if user has access to this case (only client, assigned lawyer, or admin)
        let hasAccess = false;
        
        if (type === 'admin') {
            hasAccess = true;
        } else if (type === 'client' && caseData.client_id._id.toString() === userId) {
            hasAccess = true;
        } else if (type === 'lawyer' && caseData.assigned_lawyer_id && caseData.assigned_lawyer_id._id.toString() === userId) {
            hasAccess = true;
        }

        if (!hasAccess) {
            return res.status(403).json({
                error: 'You do not have access to this case'
            });
        }

        // Get messages for this case
        const messageData = await Message.findOne({ message_case_id: caseId });
        
        if (!messageData || !messageData.message_list) {
            return res.status(200).json([]);
        }

        // Sort messages by timestamp (oldest first)
        const sortedMessages = messageData.message_list.sort((a, b) => 
            new Date(a.message_sent_date) - new Date(b.message_sent_date)
        );

        res.status(200).json(sortedMessages);
    } catch (error) {
        console.error('Error fetching case messages:', error);
        res.status(500).json({
            error: 'Failed to fetch messages'
        });
    }
};

// Get all cases with recent messages for the user
const getCasesWithMessages = async (req, res) => {
    try {
        const { userId, type } = getUserInfo(res);
        
        let cases = [];
        
        switch (type) {
            case 'client':
                cases = await Case.find({ client_id: userId })
                    .populate('client_id', 'username email')
                    .populate('assigned_lawyer_id', 'username email');
                break;

            case 'lawyer':
                cases = await Case.find({ assigned_lawyer_id: userId })
                    .populate('client_id', 'username email')
                    .populate('assigned_lawyer_id', 'username email');
                break;

            case 'admin':
                cases = await Case.find({})
                    .populate('client_id', 'username email')
                    .populate('assigned_lawyer_id', 'username email');
                break;

            default:
                return res.status(403).json({
                    error: 'Unauthorized access'
                });
        }

        // Get message counts for each case
        const casesWithMessages = await Promise.all(
            cases.map(async (caseItem) => {
                const messageData = await Message.findOne({ 
                    message_case_id: caseItem._id.toString() 
                });
                
                const messageCount = messageData ? messageData.message_list.length : 0;
                const lastMessage = messageData && messageData.message_list.length > 0 
                    ? messageData.message_list[messageData.message_list.length - 1]
                    : null;

                return {
                    ...caseItem.toObject(),
                    messageCount,
                    lastMessage: lastMessage ? {
                        message: lastMessage.message,
                        sender: lastMessage.message_sender_name,
                        timestamp: lastMessage.message_sent_date
                    } : null
                };
            })
        );

        res.status(200).json(casesWithMessages);
    } catch (error) {
        console.error('Error fetching cases with messages:', error);
        res.status(500).json({
            error: 'Failed to fetch cases with messages'
        });
    }
};

// Delete all messages for a specific case
const deleteCaseMessages = async (req, res) => {
    console.log('🗑️ [deleteCaseMessages] Called with caseId:', req.params.caseId);
    try {
        const { userId, type } = getUserInfo(res);
        const { caseId } = req.params;

        // Verify user has access to this case
        const caseData = await Case.findById(caseId)
            .populate('client_id', 'username email')
            .populate('assigned_lawyer_id', 'username email');

        if (!caseData) {
            return res.status(404).json({
                error: 'Case not found'
            });
        }

        // Check if user has access to this case (only client, assigned lawyer, or admin)
        let hasAccess = false;
        
        if (type === 'admin') {
            hasAccess = true;
        } else if (type === 'client' && caseData.client_id._id.toString() === userId) {
            hasAccess = true;
        } else if (type === 'lawyer' && caseData.assigned_lawyer_id && caseData.assigned_lawyer_id._id.toString() === userId) {
            hasAccess = true;
        }

        if (!hasAccess) {
            return res.status(403).json({
                error: 'You do not have access to this case'
            });
        }

        // Delete all messages for this case
        const result = await Message.deleteOne({ message_case_id: caseId });
        
        res.status(200).json({
            message: 'All messages deleted successfully',
            deletedCount: result.deletedCount
        });
    } catch (error) {
        console.error('Error deleting case messages:', error);
        res.status(500).json({
            error: 'Failed to delete messages'
        });
    }
};

module.exports = {
    getCaseMessages,
    getCasesWithMessages,
    deleteCaseMessages
};
