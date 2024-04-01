const User = require("./models/userModel");

let clients = {};



const initWebSocketServer = (io) => {

    io.on("connection", (socket) => {
        const userId = socket.handshake.query.userId;
        if (userId) {
          console.log(`User ${userId} connected`);
          clients[userId] = socket; // Use clients directly
      
          socket.on("disconnect", () => {
            console.log(`User ${userId} disconnected`);
            delete clients[userId];
          });
        } else {
          console.log("User connected without userId");
        }
      });

}


// sendNotification = (userId, data) => {
//     if (!userId || !data) {
//       console.error("Both userId and data are required."); // Note: No res to send a response here
//       return;
//     }
  
//     console.log(`Attempting to send notification to user ${userId}`);
//     const userSocket = clients[userId];
//     if (userSocket) {
//       userSocket.emit("notification", { data });
//     } else {
//       console.error(`No socket found for user ${userId}`);
//     }
//   }


sendNotification = async (userId, data) => {
  if (!userId || !data) {
    console.error("Both userId and data are required.");
    return;
  }

  // console.log(`Attempting to send notification to user ${userId}`);

  // Always save the notification in the database
  await saveNotificationToDB(userId, data);

  const userSocket = clients[userId];
  if (userSocket) {
    userSocket.emit("notification", {data});
    // console.log({data})
  } else {
    console.error(`No socket found for user ${userId}. Notification saved to database.`);
  }
};

const saveNotificationToDB = async (userId, data) => {
  try {
      // Fetch user from database
      const user = await User.findById(userId);

      if (!user) {
          console.error(`No user found with id ${userId}`);
          return;
      }


      // Push the new notification to the user's notifications array
      user.notifications.push({
          message: data.message,
          email: data.email,           // Add the email field
          time: data.time,      // Add the time field
          seen: false
      });

      // Save updated user
      // console.log(user);
      await user.save();
      // console.log(`Notification saved for user ${userId}`);

  } catch (error) {
      console.error("Error saving notification:", error);
  }
};





  module.exports = { initWebSocketServer, sendNotification };
  