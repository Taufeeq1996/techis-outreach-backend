const asyncHandler = require("express-async-handler");
const GmailTemplate = require("../models/gmailTemplateModel"); // Replace with the actual path to your model

// Helper function to validate Gmail Template
const validateGmailTemplate = ({ subject, status, type, content, html }) =>
  subject && status && type && (content || html);

// Helper function to find Gmail Templates
const findGmailTemplates = async (userId, template_type) => {
  return await GmailTemplate.find({
    $or: [{ userId, template_type: "personal" }, { template_type: "global" }],
  });
};

// Add Gmail Template
const addGmailTemplate = asyncHandler(async (req, res) => {
  const { role, userId } = req;
  let templateData = req.body;

  if (!validateGmailTemplate(templateData)) {
    throw new Error("Missing required fields");
  }

  if ((role !== "manager" && role !== "director") || !templateData.template_type) {
    templateData.template_type = "personal";
  }

  const newTemplate = new GmailTemplate({ ...templateData, userId });
  await newTemplate.save();
  res.status(201).json(newTemplate);
});

// List Gmail Templates
const listGmailTemplates = asyncHandler(async (req, res) => {
  const { userId } = req;
  const templates = await findGmailTemplates(userId, "personal");
  res.status(200).json(templates);
});

// Get Template Names
const getTemplateNames = asyncHandler(async (req, res) => {
  const { userId } = req;
  const templates = await GmailTemplate.find({
    $or: [
      { userId, template_type: "personal", status: "active" },
      { template_type: "global", status: "active" },
    ],
  });
  res.status(200).json(templates.map(({ _id, subject }) => ({ _id, subject })));
});

const listGmailTemplateById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const template = await GmailTemplate.findById(id);
  res.status(200).json(template);
});

// Edit Gmail Template
const editGmailTemplate = asyncHandler(async (req, res) => {
  const { role, userId } = req;
  const { id } = req.params;
  const updates = req.body;
  if (role !== "manager" && role !== "director") {
    updates.template_type = "personal";
  }
  const template = await GmailTemplate.findOneAndUpdate({ _id: id }, updates, {
    new: true,
  });

  if (!template) {
    throw new Error("GMAIL Template not found");
  }

  res.status(200).json(template);
});

// Delete Gmail Template
const deleteGmailTemplate = asyncHandler(async (req, res) => {
  const { role, userId } = req;
  const { id } = req.params;

  if ((role !== "manager" && role !== "director") || !template_type) {
    throw new Error("Access forbidden: insufficient role");
  }

  const template = await GmailTemplate.findOneAndDelete({ _id: id, userId });

  if (!template) {
    throw new Error("GMAIL Template not found");
  }

  res.status(200).json({ message: "GMAIL Template deleted" });
});

module.exports = {
  addGmailTemplate,
  listGmailTemplates,
  editGmailTemplate,
  deleteGmailTemplate,
  getTemplateNames,
  listGmailTemplateById,
};
