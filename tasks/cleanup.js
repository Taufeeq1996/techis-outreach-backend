const cron = require("node-cron");
const User = require("../models/userModel");


const deleteOldNotifications = async () => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7); // Subtract 7 days

    try {
        await User.updateMany(
            {},
            {
                $pull: {
                    notifications: {
                        timestamp: { $lt: oneWeekAgo }
                    }
                }
            }
        );

        console.log("Old notifications deleted.");
    } catch (error) {
        console.error("Error deleting old notifications:", error);
    }
};

module.exports = deleteOldNotifications;
