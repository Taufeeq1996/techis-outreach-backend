const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const notificationSchema = mongoose.Schema(
  {
    message: {
      type: String,
      required: true,
    },
    email: {
      // The email associated with the notification
      type: String,
      required: true,
      match: [
        /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/,
        "Enter a valid email",
      ],
    },
    time: {
      // The time associated with the notification
      type: Date,
      required: true,
    },

    seen: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
); // Prevent mongoose from creating a unique ID for each notification.

const userSchema = mongoose.Schema({
  first_name: {
    type: String,
    required: [true, "Please enter your first name"],
  },
  last_name: {
    type: String,
    required: [true, "Please enter your last name"],
  },
  email: {
    type: String,
    unique: true,
    required: [true, "Please enter your email"],
    trim: true,
    match: [
      /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/,
      "Enter a valid email",
    ],
  },
  password: {
    type: String,
    required: [true, "Please enter your password"],
    minLength: [6, "Password should not be less than 6 characters"],
  },
  role: {
    type: String,
    enum: ["director", "manager", "user", "engineer"],
  },
  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "active",
  },
  notifications: [notificationSchema], // Add the notifications field
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(this.password, salt);
  this.password = hashedPassword;
  next();
});

const User = mongoose.model("User", userSchema);

module.exports = User;
