const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
  const authorization = req.headers.authorization;
  const [scheme, token] = authorization?.split(" ") || [];

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.SECRET);

    if (!decoded.sub) {
      return res.status(401).json({ message: "Please log in again" });
    }

    req.user = decoded;
    return next();
  } catch (error) {
    const message =
      error.name === "TokenExpiredError"
        ? "Your session has expired. Please log in again."
        : "Invalid authentication token";

    return res.status(401).json({ message });
  }
};

module.exports = { auth };
