const User = require("../Models/userSchema");
const { verifyAccessToken } = require("../Utils/authToken");
const { getAccessCookie } = require("../Utils/authCookie");

const authMiddleware = async (req, res, next) => {
  const token = getAccessCookie(req);

  if (!token) {
    return res.status(401).json({ msg: "Authentication required" });
  }

  try {
    const decoded = verifyAccessToken(token);
    const userId = decoded.sub || decoded.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(401).json({ msg: "Authentication required" });
    }

    req.user = user;
    return next();
  } catch (err) {
    return res.status(401).json({ msg: "Invalid or expired token" });
  }
};

module.exports = authMiddleware;
