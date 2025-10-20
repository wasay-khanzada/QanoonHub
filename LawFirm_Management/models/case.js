const mongoose = require('mongoose');

const caseSchema = new mongoose.Schema({
    case_title: {
        type: String,
        required: [true, "Case title is required"],
    },
    case_created_by: {
        type: String,
        required: [true, "Case creator is required"],
    },
    case_description: {
        type: String,
        required: [true, "Case description is required"],
    },
    case_type: {
        type: String,
        required: [true, "Case type is required"],
        enum: ['Civil', 'Criminal', 'Corporate', 'Family', 'Real Estate', 'Intellectual Property', 'Employment', 'Tax', 'Immigration']
    },
    case_status: {
        type: String,
        default: 'Open',
        enum: ['Open', 'Assigned', 'In Progress', 'Completed', 'Closed']
    },
    case_priority: {
        type: String,
        default: 'Medium',
        enum: ['Low', 'Medium', 'High', 'Urgent']
    },
    case_total_billed_hour: {
        type: Number,
        default: 0
    },
    // Client and Lawyer assignment
    client_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, "Client ID is required"]
    },
    assigned_lawyer_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    // Applications from lawyers
    applications: [{
        lawyer_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        message: String,
        proposed_fee: Number,
        status: {
            type: String,
            enum: ['Pending', 'Accepted', 'Rejected'],
            default: 'Pending'
        },
        applied_at: {
            type: Date,
            default: Date.now
        }
    }],
    // Case members (for tracking)
    case_member_list: [{
        case_member_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        case_member_type: String,
        case_member_role: String
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('Case', caseSchema);