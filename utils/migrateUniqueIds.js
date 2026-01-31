const mongoose = require('mongoose');
const User = require('../models/user');

const migrateUniqueIds = async () => {
    try {
        console.log('Checking for users without uniqueId...');
        const usersWithoutId = await User.find({ uniqueId: { $exists: false } });
        
        if (usersWithoutId.length === 0) {
            console.log('All users have uniqueId.');
            return;
        }

        console.log(`Found ${usersWithoutId.length} users without uniqueId. Migrating...`);

        for (const user of usersWithoutId) {
            // The pre-save hook will generate the uniqueId
            await user.save({ validateBeforeSave: false });
            console.log(`Generated uniqueId for user ${user._id}`);
        }

        console.log('Migration completed successfully.');
    } catch (error) {
        console.error('Migration failed:', error);
    }
};

module.exports = migrateUniqueIds;
