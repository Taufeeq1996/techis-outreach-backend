const express = require("express");
const router = express.Router();
const { addGmailTemplate, listGmailTemplates, editGmailTemplate,listGmailTemplateById, deleteGmailTemplate, getTemplateNames } = require("../controllers/GmailTemplateController");
const isAuthenticated = require("../middlewares/authMiddleware");

router.use(isAuthenticated);

// Route to add an HTML template
router.post("/add", addGmailTemplate);


//Route to get Template By ID
router.get("/list/:id", listGmailTemplateById);


// Route to list all HTML templates
router.get("/list", listGmailTemplates);


// Route to list all HTML templates names
router.get("/names", getTemplateNames);

// Route to edit an HTML template (by its ID)
router.put("/edit/:id", editGmailTemplate);

// Route to delete an HTML template (by its ID)
router.delete("/delete/:id", deleteGmailTemplate);

module.exports = router;
