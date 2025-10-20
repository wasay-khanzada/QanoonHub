const mongoose = require('mongoose');
const { Schema } = mongoose;

const caseApplicationSchema = new Schema({
    clientId: {
        type: String,
        required: [true, "Client ID is required"],
    },
    lawyerId: {
        type: String,
        required: [true, "Lawyer ID is required"],
    },
    caseTitle: {
        type: String,
        required: [true, "Case title is required"],
    },
    caseDescription: {
        type: String,
        required: [true, "Case description is required"],
    },
    caseType: {
        type: String,
        required: [true, "Case type is required"],
        enum: ['Civil', 'Criminal', 'Corporate', 'Family', 'Real Estate', 'Intellectual Property', 'Employment', 'Tax', 'Immigration']
    },
    casePriority: {
        type: String,
        required: [true, "Case priority is required"],
        enum: ['Low', 'Medium', 'High', 'Urgent'],
        default: 'Medium'
    },
    status: {
        type: String,
        required: [true, "Status is required"],
        enum: ['pending', 'accepted', 'rejected', 'completed'],
        default: 'pending'
    },
    clientMessage: {
        type: String,
        required: [true, "Client message is required"],
    },
    lawyerResponse: {
        type: String,
        default: ''
    },
    estimatedBudget: {
        type: Number,
        required: [true, "Estimated budget is required"],
    },
    documents: [{
        title: String,
        url: String,
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    acceptedAt: {
        type: Date
    },
    completedAt: {
        type: Date
    }
});

// Update the updatedAt field before saving
caseApplicationSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const CaseApplication = mongoose.model('CaseApplication', caseApplicationSchema);

module.exports = CaseApplication; 