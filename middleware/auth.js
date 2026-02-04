// Load JWT Lib
const jwt = require("jsonwebtoken");

// Authorisation function
function checkAuth(req, res, next) {
  // Save the token string unformatted
  let token = req.headers.authorization;
  // Check it has been retrieved
  if (!token) {
    // Respond with warning if it has not
    return res.status(401).json({ error: "No token provided" });
  }
  // Format the token
  token = token.split(" ")[1];
  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Attach user ID
    req.userId = decoded.userId;
    // Continue
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

module.exports = checkAuth;
