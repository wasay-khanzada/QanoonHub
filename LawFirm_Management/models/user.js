const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, "Username is required"],
    },
    email: {
        type: String,
        unique: true,
        required: [true, "Email is required"],
    },
    number: {
        type: String,
        required: [true, "Contact Number is required"],
    },
    address: {
        type: String,
        required: [true, "Address is required"],
    },
    password: {
        type: String,
        required: [true, "Password is required"],
    },
    avatar_url: {
        type: String,
    },
    type: {
        type: String,
        enum: ['client', 'lawyer', 'admin'],
        required: [true, "Type is required"],
    },
    // Lawyer-specific fields
    specializations: {
        type: [String],
        default: []
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    rating: {
        type: Number,
        default: 0
    },
    totalCases: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('User', userSchema);  