const express = require("express");
const { check } = require("express-validator");
const fileUpload = require("../middlewares/fileUpload");
const app = express();

const router = express.Router();
const placeController = require("../controller/place-controller");
const checkAuth = require("../middlewares/check-authentication");

router.get("/:pid", placeController.getPlaceById);

router.get("/user/:uid", placeController.getPlacesByUserId);

// check token before proceed
app.use(checkAuth);

router.post(
  "/",
  fileUpload.single("image"),
  [
    check("title").not().isEmpty(),
    check("description").isLength({ min: 5 }),
    check("address").not().isEmpty(),
  ],
  placeController.createPlace
);
router.patch("/:pid", placeController.updatePlaceById);
router.delete("/:pid", placeController.deletePlace);

module.exports = router;
