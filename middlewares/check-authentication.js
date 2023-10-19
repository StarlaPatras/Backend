const jwt = require("jsonwebtoken");
const AppError = require("../models/AppError");

module.exports = (req, res, next) => {
  if (req.method === "OPTIONS") {
    return next();
  }

  // extract token from authorization
  try {
    const token = req.headers.authorization.split(" ")[1]; // Authorization: 'Bearer TOKEN'

    // if No token
    if (!token) {
      throw new Error("Authentication failed");
    }

    // verify token
    const decodedToken = jwt.verify(token, process.env.JWT_KEY);
    // extract userId from token because we use userId and email as payload
    req.userData = { userId: decodedToken.userId };
  } catch (err) {
    const error = new AppError("Authentication failed!", 401);
    return next(error);
  }
};
