const User = require("../models/userModel"); // Import the User model
const mongoose = require("mongoose");
const dotenv = require("dotenv").config();

const addInitialUser = async (first_name, last_name, email, password,role) => {
	try {
		// Connect to the database
		await mongoose.connect(process.env.MONGO_URI, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
		});

		// Create a new user instance
		const initialUser = new User({
			first_name,
			last_name,
			email,
			password,
			role,
		});

		const savedUser = await initialUser.save();

		// Disconnect from the database
		await mongoose.disconnect();
	} catch (error) {
		console.error("Error adding initial user:", error);
	}
};

// Check if enough arguments are provided
if (process.argv.length < 5) {
	console.error("Not enough arguments! Usage: node script.js <first_name> <last_name> <email> <password> <role>");
	process.exit(1);
}

// Call the function to add the initial user
addInitialUser(...process.argv.slice(2));

// To add initial user run this in terminal
// node scripts/initializeUser.js Mani KC admin@gmail.com 123456 director
