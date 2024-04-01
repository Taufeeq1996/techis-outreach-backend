const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();
const cors = require("cors");
const cookieParser = require("cookie-parser");
const userRoutes = require("./routes/userRoutes");
const errorHandler = require("./middlewares/errorMiddleware");
const gmailCredentialsRoutes = require("./routes/GmailCredentialsRoutes");
const kixieCredentialsRoutes = require("./routes/KixieCredentialsRoutes");
const gmailTemplateRoutes = require("./routes/GmailTemplateRoutes");
const kixieTemplateRoutes = require("./routes/KixieTemplateRoutes");
const sendSmsRoutes = require("./routes/sendMessageRoute");
const trackRoute = require("./routes/trackRoute");
const reportRoutes = require("./routes/ReportsRoute");
const helmet = require("helmet");
const http = require("http");
const socketIo = require("socket.io");
const { initWebSocketServer } = require("./socketio.js");
const cron = require("node-cron");
const cleanupTask = require("./tasks/cleanup");

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  "http://127.0.0.1:5174",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
  process.env.FRONTEND_URL,
  process.env.ADMIN_FRONTEND_URL,
];

const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
  },
});

initWebSocketServer(io);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(helmet()); // Set secure HTTP headers

app.use(
  cors({
    origin: function (origin, callback) {
      if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

function allowAnyOriginForTrackRoute(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );

  // Capture the client's IP address using the CF-Connecting-IP header
  const clientIP = req.header("CF-Connecting-IP");

  if (clientIP) {
    // Store the IPv4 address in the request object for later use
    req.clientIPv4 = clientIP;
  } else {
    // Handle cases where the address is not found
    req.clientIPv4 = null;
  }

  next();
}

app.use("/api/track", allowAnyOriginForTrackRoute);

app.use("/api/users", userRoutes);
app.use("/api/kixie-credentials", kixieCredentialsRoutes);
app.use("/api/gmail-credentials", gmailCredentialsRoutes);
app.use("/api/gmail-template", gmailTemplateRoutes);
app.use("/api/kixie-template", kixieTemplateRoutes);
app.use("/api/message", sendSmsRoutes);
app.use("/reports", reportRoutes);

app.enable("trust proxy");
app.use("/api/track", trackRoute);

const PORT = process.env.PORT || 8000;

app.use(errorHandler);

// Scheduled Tasks
cron.schedule("0 2 * * *", cleanupTask);

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    server.listen(PORT, () =>
      console.log(`Server running with socket.io on port : ${PORT}`)
    );
  })
  .catch((err) => console.log(err));
