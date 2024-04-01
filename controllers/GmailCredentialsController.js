const GmailCredentials = require("../models/gmailCredModel");
const asyncHandler = require("express-async-handler");

// Helper function to validate Gmail Credentials
const validateGmailCredentials = (credentials) => {
  const { email, oauthClientId, oauthClientSecret, oauthRefreshToken } =
    credentials;
  return email && oauthClientId && oauthClientSecret && oauthRefreshToken;
};

// Helper function to find Gmail Credentials
const findGmailCredentials = async (userId, type) => {
  return await GmailCredentials.find({
    $or: [{ userId, type: "personal" }, { type: "global" }],
  });
};

// Add Gmail Credentials
const addGmailCredentials = asyncHandler(async (req, res) => {
  const { role, userId } = req;
  const credentials = req.body;

  if (!validateGmailCredentials(credentials)) {
    res.status(400);
    throw new Error("Please enter all the credentials");
  }

  let { type } = req.body;
  if (role !== "manager" && role !== "director") {
    type = "personal";
  }

  try {
    const newCredentials = new GmailCredentials({
      ...credentials,
      userId,
      type,
    });
    await newCredentials.save();
    res.status(201).json({ message: "Successfully added" });
  } catch (error) {
    res.status(500);
    throw new Error(error.message);
  }
});

// List Gmail Credentials
const listGmailCredentials = asyncHandler(async (req, res) => {
  const { userId } = req;

  try {
    const credentials = await findGmailCredentials(userId, "personal");
    res.status(200).json(credentials);
  } catch (error) {
    res.status(500);
    throw new Error(error.message);
  }
});

// List Gmail Emails
const listGmailEmails = asyncHandler(async (req, res) => {
  const { userId } = req;

  try {
    const credentials = await GmailCredentials.find({
      $or: [
        { userId, type: "personal", status: "active" },
        { type: "global", status: "active" },
      ],
    });
    res.status(200).json(credentials.map(({ _id, email }) => ({ _id, email })));
  } catch (error) {
    res.status(500);
    throw new Error(error.message);
  }
});

// Edit Gmail Credentials
const editGmailCredentials = asyncHandler(async (req, res) => {
  const { role } = req;

  if (role !== "manager" && role !== "director") {
    req.body.type = "personal";
  }

  const { status, type } = req.body;

  try {
    const updatedCredentials = await GmailCredentials.findByIdAndUpdate(
      req.params.id,
      { status, type },
      { new: true }
    );

    if (!updatedCredentials) {
      res.status(404);
      throw new Error("GmailCredentials not found");
    }

    res.status(200).json({ message: "Successfully updated" });
  } catch (error) {
    res.status(500);
    throw new Error(error.message);
  }
});

module.exports = {
  listGmailEmails,
  listGmailCredentials,
  editGmailCredentials,
  addGmailCredentials,
};
