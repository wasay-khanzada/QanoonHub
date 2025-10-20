const mongoose = require('mongoose');
require('dotenv').config();

// Import the actual models
const User = require('./models/user');
const Case = require('./models/case');

async function clearDatabase() {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            dbName: process.env.MONGO_DBNAME,
        });
        console.log('Connected to MongoDB');

        // Count existing data
        const userCount = await User.countDocuments();
        const caseCount = await Case.countDocuments();
        
        console.log(`\n📊 Current Database State:`);
        console.log(`Users: ${userCount}`);
        console.log(`Cases: ${caseCount}`);

        if (userCount === 0 && caseCount === 0) {
            console.log('\n✅ Database is already empty!');
            return;
        }

        // Clear all users
        if (userCount > 0) {
            await User.deleteMany({});
            console.log(`\n🗑️  Deleted ${userCount} users`);
        }

        // Clear all cases
        if (caseCount > 0) {
            await Case.deleteMany({});
            console.log(`🗑️  Deleted ${caseCount} cases`);
        }

        // Verify deletion
        const finalUserCount = await User.countDocuments();
        const finalCaseCount = await Case.countDocuments();
        
        console.log(`\n✅ Database cleared successfully!`);
        console.log(`Final state - Users: ${finalUserCount}, Cases: ${finalCaseCount}`);

    } catch (error) {
        console.error('❌ Error clearing database:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

clearDatabase(); 