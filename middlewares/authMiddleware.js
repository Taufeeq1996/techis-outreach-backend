const jwt = require("jsonwebtoken");

// Define a custom middleware function
const isAuthenticated = (req, res, next) => {
	try {
		const token = req.cookies.token;

		// Check if token exists
		if (!token) {
			res.status(401);
			throw new Error("Unauthorised, please login to continue");
		}

		const verified = jwt.verify(token, process.env.JWT_SECRET);

		// Check if token is verified
		if (!verified.id) {
			res.status(401);
			throw new Error("Unauthorised, please login to continue");
		}

		// Add user ID and role to the request object
		req.userId = verified.id;
		req.role = verified.role;

		// Move on to the next middleware or route handler
		next();
	} catch (error) {
		res.status(401);
		throw new Error(error.message);
	}
};

module.exports = isAuthenticated;
