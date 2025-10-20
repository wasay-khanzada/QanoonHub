const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

const userSchema = new mongoose.Schema({
    username: String,
    email: String,
    number: String,
    address: String,
    password: String,
    avatar_url: String,
    type: String,
    specializations: [String],
    isVerified: Boolean,
    rating: Number,
    totalCases: Number
});

const User = mongoose.model('User', userSchema);

async function createAdmin() {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            dbName: process.env.MONGO_DBNAME,
        });
        console.log('Connected to MongoDB');

        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: 'admin@qanoonhub.com' });
        if (existingAdmin) {
            console.log('Admin already exists');
            return;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash('admin123', 12);

        // Create admin
        const admin = new User({
            username: 'System Administrator',
            email: 'admin@qanoonhub.com',
            number: '+1234567890',
            address: '123 Admin Street, Admin City',
            password: hashedPassword,
            type: 'admin',
            isVerified: true
        });

        await admin.save();
        console.log('✅ Admin created successfully!');
        console.log('Email: admin@qanoonhub.com');
        console.log('Password: admin123');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

createAdmin(); 