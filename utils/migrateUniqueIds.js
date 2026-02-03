const mongoose = require('mongoose');
const User = require('../models/user');

const migrateUniqueIds = async () => {
    try {
        console.log('Checking for users without gigId...');
        const usersWithoutId = await User.find({ gigId: { $exists: false } });
        
        if (usersWithoutId.length === 0) {
            console.log('All users have gigId.');
            return;
        }

        console.log(`Found ${usersWithoutId.length} users without gigId. Migrating...`);

        for (const user of usersWithoutId) {
            // The pre-save hook will generate the gigId (or copy from uniqueId)
            await user.save({ validateBeforeSave: false });
            console.log(`Generated gigId for user ${user._id}`);
        }

        console.log('Migration completed successfully.');
    } catch (error) {
        console.error('Migration failed:', error);
    }
};

module.exports = migrateUniqueIds;
