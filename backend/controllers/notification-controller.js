import Notification from "../models/notification-model.js";


// Controller function to get notifications for a specific user
export const getNotifications = async (req, res) => {
    try{
        const userId = req.user._id;

        // Find all notifications where the recipient is the current user
        // Populate the 'from' field with username and profileImg from the User model
        const notifications = await Notification.find({ to: userId}).populate({
            path: 'from',
            select: 'username profileImg'
        });

        // Update all retrieved notifications to be marked as read
        await Notification.updateMany({to: userId}, {read: true});

        return res.status(200).json({
            message: "Notification update succussfully",
            notifications
        });
    }
    catch(error){
        console.log("Error in getNotification Controller : ", error.message);
        return res.status(500).json({ 
            error: "An error occurred on getting Notifcation"
        });
    }
}


// Controller function to delete all notifications for a specific user
export const deleteNotifications = async (req, res) => {
    try {
        const  userId = req.user._id;
        
        // Delete all notifications where the recipient is the current user
        await Notification.deleteMany({to: userId});

        return res.status(200).json({
            message: "Notifications deleted successfully",
        })

    } catch (error) {
        console.log("Error in deleteNotifications  Controller : ", error.message);
        return res.status(500).json({
            error: "An error occurred on deleting Notifications"
        })
    }
}


