const Case = require('../models/case');
const User = require('../models/user');
const getUserInfo = require('../helpers/getUserInfo');

// Get cases based on user type
const getCases = async (req, res) => {
    try {
        const { userId, type } = getUserInfo(res);
        
        let cases = [];
        
        switch (type) {
            case 'client':
                // Clients see their own cases
                cases = await Case.find({ client_id: userId })
                    .populate('assigned_lawyer_id', 'username email')
                    .populate('client_id', 'username email')
                    .populate('case_member_list.case_member_id', 'username email');
                break;

            case 'lawyer':
                // Lawyers see cases they're assigned to or can apply for
                const lawyer = await User.findById(userId);
                
                if (!lawyer || !lawyer.isVerified) {
                    return res.status(403).json({
                        error: 'Lawyer not verified'
                    });
                }

                // Get assigned cases
                const assignedCases = await Case.find({ 
                    assigned_lawyer_id: userId 
                })
                    .populate('client_id', 'username email')
                    .populate('assigned_lawyer_id', 'username email')
                    .populate('case_member_list.case_member_id', 'username email');

                // Map lawyer specializations to case types
                const specializationToCaseType = {
                    'Criminal Law': 'Criminal',
                    'Family Law': 'Family',
                    'Corporate Law': 'Corporate',
                    'Civil Law': 'Civil',
                    'Property Law': 'Real Estate',
                    'Real Estate': 'Real Estate',
                    'Real Estate Law': 'Real Estate', // Added this mapping
                    'Intellectual Property Law': 'Intellectual Property',
                    'Intellectual Property': 'Intellectual Property', // Added this mapping
                    'Employment Law': 'Employment',
                    'Tax Law': 'Tax',
                    'Immigration Law': 'Immigration',
                    'Constitutional Law': 'Criminal', // Fallback
                    'Human Rights': 'Criminal', // Fallback
                    'Divorce Law': 'Family',
                    'Child Custody': 'Family',
                    'Drug Law': 'Criminal',
                    'Traffic Law': 'Criminal',
                    'Contract Law': 'Corporate',
                    'Environmental Law': 'Civil' // Added this mapping
                };

                // Convert lawyer specializations to case types
                const matchingCaseTypes = lawyer.specializations
                    .map(spec => specializationToCaseType[spec])
                    .filter(type => type); // Remove undefined mappings

                // Get available cases (matching specializations)
                const availableCases = await Case.find({
                    case_status: 'Open',
                    case_type: { $in: matchingCaseTypes }
                })
                    .populate('client_id', 'username email')
                    .populate('assigned_lawyer_id', 'username email')
                    .populate('case_member_list.case_member_id', 'username email');

                cases = [...assignedCases, ...availableCases];
                break;

            case 'admin':
                // Admins see all cases
                cases = await Case.find({})
                    .populate('client_id', 'username email')
                    .populate('assigned_lawyer_id', 'username email')
                    .populate('case_member_list.case_member_id', 'username email');
                break;

            default:
                return res.status(403).json({
                    error: 'Unauthorized access'
                });
        }

        res.status(200).json(cases);
    } catch (error) {
        console.error('Error fetching cases:', error);
        res.status(500).json({
            error: 'Failed to fetch cases'
        });
    }
};

// Create a new case (clients only)
const createCase = async (req, res) => {
    try {
        const { userId, type } = getUserInfo(res);
        
        if (type !== 'client') {
            return res.status(403).json({
                error: 'Only clients can create cases'
            });
        }
        
        const {
            case_title,
            case_description,
            case_type,
            case_priority
        } = req.body;
        
        // Ensure client_id is always a valid ObjectId
        const clientObj = await User.findById(userId);
        if (!clientObj) {
            return res.status(400).json({ error: 'Client not found' });
        }
        const newCase = new Case({
            case_title,
            case_description,
            case_type,
            case_priority,
            case_created_by: userId,
            client_id: clientObj._id,
            assigned_lawyer_id: null,
            case_member_list: [{
                case_member_id: clientObj._id,
                case_member_type: 'client',
                case_member_role: 'client'
            }]
        });
        
        await newCase.save();

        // Populate client, assigned lawyer, and case_member_list for response
        const populatedCase = await Case.findById(newCase._id)
            .populate('client_id', 'username email')
            .populate('assigned_lawyer_id', 'username email')
            .populate('case_member_list.case_member_id', 'username email');

        res.status(201).json({
            message: 'Case created successfully',
            case: populatedCase
        });
    } catch (error) {
        console.error('Error creating case:', error);
        res.status(500).json({
            error: 'Failed to create case'
        });
    }
};

// Apply for a case (lawyers only)
const applyForCase = async (req, res) => {
    try {
        const { userId, type } = getUserInfo(res);
        const { caseId } = req.params;
        const { message, proposed_fee } = req.body;
        
        if (type !== 'lawyer') {
            return res.status(403).json({
                error: 'Only lawyers can apply for cases'
            });
        }
        
        // Check if lawyer is verified
        const lawyer = await User.findById(userId);
        if (!lawyer || !lawyer.isVerified) {
            return res.status(403).json({
                error: 'Lawyer not verified'
            });
        }
        
        // Find the case
        const caseData = await Case.findById(caseId);
        if (!caseData) {
            return res.status(404).json({
                error: 'Case not found'
            });
        }
        
        if (caseData.case_status !== 'Open') {
            return res.status(400).json({
                error: 'Case is not available for application'
            });
        }
        
        // Check if already applied
        const existingApplication = caseData.applications.find(
            app => app.lawyer_id === userId
        );
        
        if (existingApplication) {
            return res.status(400).json({
                error: 'You have already applied for this case'
            });
        }
        
        // Add application
        caseData.applications.push({
            lawyer_id: userId,
            message,
            proposed_fee
        });
        
        await caseData.save();
        
        res.status(200).json({
            message: 'Application submitted successfully'
        });
    } catch (error) {
        console.error('Error applying for case:', error);
        res.status(500).json({
            error: 'Failed to submit application'
        });
    }
};

// Accept lawyer application (clients only)
const acceptApplication = async (req, res) => {
    try {
        const { userId, type } = getUserInfo(res);
        const { caseId, applicationId } = req.params;
        
        if (type !== 'client') {
            return res.status(403).json({
                error: 'Only clients can accept applications'
            });
        }
        
        const caseData = await Case.findById(caseId);
        if (!caseData) {
            return res.status(404).json({
                error: 'Case not found'
            });
        }
        
        if (caseData.client_id.toString() !== userId) {
            return res.status(403).json({
                error: 'You can only accept applications for your own cases'
            });
        }
        
        const application = caseData.applications.id(applicationId);
        if (!application) {
            return res.status(404).json({
                error: 'Application not found'
            });
        }
        
        // Accept the application
        application.status = 'Accepted';
        caseData.assigned_lawyer_id = application.lawyer_id;
        caseData.case_status = 'Assigned';
        
        // Reject other applications
        caseData.applications.forEach(app => {
            if (app._id.toString() !== applicationId) {
                app.status = 'Rejected';
            }
        });
        
        // Add lawyer to case members
        caseData.case_member_list.push({
            case_member_id: application.lawyer_id,
            case_member_type: 'lawyer',
            case_member_role: 'assigned_lawyer'
        });
        
        await caseData.save();

        // Return updated case with populated fields
        const populatedCase = await Case.findById(caseData._id)
            .populate('client_id', 'username email')
            .populate('assigned_lawyer_id', 'username email')
            .populate('case_member_list.case_member_id', 'username email');

        res.status(200).json({
            message: 'Application accepted successfully',
            case: populatedCase
        });
    } catch (error) {
        console.error('Error accepting application:', error);
        res.status(500).json({
            error: 'Failed to accept application'
        });
    }
};

// Get applications for a case
const getCaseApplications = async (req, res) => {
    try {
        const { userId, type } = getUserInfo(res);
        const { caseId } = req.params;
        
        const caseData = await Case.findById(caseId)
            .populate('applications.lawyer_id', 'username email specializations rating');
        
        if (!caseData) {
            return res.status(404).json({
                error: 'Case not found'
            });
        }
        
        // Only case owner can see applications
        if (caseData.client_id !== userId) {
            return res.status(403).json({
                error: 'Unauthorized access'
            });
        }
        
        res.status(200).json(caseData.applications);
    } catch (error) {
        console.error('Error fetching applications:', error);
        res.status(500).json({
            error: 'Failed to fetch applications'
        });
    }
};

module.exports = {
    getCases,
    createCase,
    applyForCase,
    acceptApplication,
    getCaseApplications
};
