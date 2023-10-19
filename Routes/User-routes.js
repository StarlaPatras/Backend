const express = require("express");
const { check } = require("express-validator");

const usersController = require("../controller/user-controller");

const fileUpload = require("../middlewares/fileUpload");

const router = express.Router();

router.get("/", usersController.getUsers);

router.post(
  "/signup",
  fileUpload.single("image"),
  [
    check("name").not().isEmpty(),
    check("email").normalizeEmail().isEmail(),
    check("password").isLength({ min: 6 }),
  ],
  usersController.signup
);

router.post(
  "/login",
  [check("name").not().isEmpty(), check("email").normalizeEmail().isEmail()],
  usersController.login
);

module.exports = router;
