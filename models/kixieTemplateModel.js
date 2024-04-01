const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const KixieTemplateSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User", // Assume you have a User model
      required: [true, "User ID is required"],
    },
    template_type: {
      type: String,
      enum: ["global", "personal"],
      default: "personal",
    },
    content: {
      type: String,
      required: [true, "Content is required"],
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      required: [true, "Status is required"],
    },
  },
  {
    timestamps: true, // Automatically includes createdAt and updatedAt fields
  }
);

const KixieTemplate = mongoose.model("KixieTemplate", KixieTemplateSchema);

module.exports = KixieTemplate;
