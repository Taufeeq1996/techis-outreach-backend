const asyncHandler = require("express-async-handler");
const KixieTemplate = require("../models/kixieTemplateModel");

// Helper function to find templates
const findTemplates = async (userId, fields) => {
  return KixieTemplate.find({
    $or: [{ userId, template_type: "personal" }, { template_type: "global" }],
  }).select(fields);
};

const assignTemplateType = (role, template_type) => {
  if ((role !== "manager" && role !== "director") || !template_type) {
    return "personal";
  }
  return template_type;
};

const createTemplate = asyncHandler(async (req, res) => {
  const { userId, role, body } = req;

  body.template_type = assignTemplateType(role, body.template_type);

  const template = new KixieTemplate({
    ...body,
    userId,
  });

  const savedTemplate = await template.save();
  res.status(201).json(savedTemplate);
});

const getAllTemplates = asyncHandler(async (req, res) => {
  const { userId } = req;
  const templates = await findTemplates(userId, "_id name content status");
  res.status(200).json(templates);
});

const getTemplateById = asyncHandler(async (req, res) => {
  const { userId } = req;
  const { id } = req.params;
  const template = await KixieTemplate.findById(id);
  res.status(200).json(template);
});

const getTemplateNames = asyncHandler(async (req, res) => {
  const { userId } = req;
  const templates = await KixieTemplate
    .find({
      $or: [
        { userId, template_type: "personal", status: "active" },
        { template_type: "global", status: "active" },
      ],
    })
    .select("_id name");

  if (!templates.length) {
    return res.status(404).json({ error: "Template not found" });
  }
  res.status(200).json(templates);
});

const updateTemplate = asyncHandler(async (req, res) => {
  const { role, params, body } = req;
  const { id } = params;

  body.template_type = assignTemplateType(role, body.template_type);

  const updatedTemplate = await KixieTemplate.findByIdAndUpdate(
    { _id: id },
    body,
    { new: true }
  );

  if (!updatedTemplate) {
    res.status(404);
    throw new Error("Template not found");
  } else {
    res.status(200).json(updatedTemplate);
  }
});

const deleteTemplate = asyncHandler(async (req, res) => {
  const { role, params, body } = req;

  body.template_type = assignTemplateType(role, body.template_type);

  const deletedTemplate = await KixieTemplate.findByIdAndDelete(
    params.templateId
  );

  if (!deletedTemplate) {
    return res.status(404).json({ error: "Template not found" });
  }
  res.status(204).send();
});

module.exports = {
  createTemplate,
  getAllTemplates,
  getTemplateById,
  getTemplateNames,
  updateTemplate,
  deleteTemplate,
};
