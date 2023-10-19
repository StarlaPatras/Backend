const fs = require("fs");
const AppError = require("../models/AppError");
const { validationResult } = require("express-validator");
const Place = require("../models/Places");
const User = require("../models/User");
const mongoose = require("mongoose");
const { options } = require("../Routes/Places-routes");

exports.getPlaceById = async (req, res, next) => {
  const placeId = req.params.pid; // { pid: 'p1' }

  let place;
  try {
    place = await Place.findById(placeId);
  } catch (err) {
    const error = new AppError(
      "Something went wrong, could not find a place.",
      500
    );
    return next(error);
  }

  if (!place) {
    const error = new AppError(
      "Could not find a place for the provided id.",
      404
    );
    return next(error);
  }

  res.json({ place: place.toObject({ getters: true }) }); // => { place } => { place: place }
};

exports.getPlacesByUserId = async (req, res, next) => {
  const userId = req.params.uid;

  // let places;
  let userWithPlaces;
  try {
    userWithPlaces = await User.findById(userId).populate("places");
  } catch (err) {
    console.log(err);
    const error = new AppError(
      "Fetching places failed, please try again later",
      500
    );
    return next(error);
  }

  // if (!places || places.length === 0) {
  if (!userWithPlaces || userWithPlaces.places.length === 0) {
    return next(
      new AppError("Could not find places for the provided user id.", 404)
    );
  }

  res.json({
    places: userWithPlaces.places.map((place) =>
      place.toObject({ getters: true })
    ),
  });
};
exports.createPlace = async (req, res, next) => {
  const error = validationResult(req);
  console.log(error);
  if (!error.isEmpty()) {
    throw new AppError("Invalid input passesd ", 404);
  }

  const { title, description, address, creator } = req.body;

  const createPlace = new Place({
    title,
    description,
    creator,
    image: req.file.path,
    address,
  });

  let user;
  try {
    user = await User.findById(creator);
  } catch (err) {
    console.log(err);
    const error = new AppError("Creating place failed", 404);
    return next(error);
    console.log(error);
  }

  if (!user) {
    const error = new AppError("Could not get User with provided id", 404);
    console.log(error);

    return next(error);
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createPlace.save({ session: sess });
    user.places.push(createPlace);
    await user.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    console.log(err);
    const error = new AppError("Creating place failed, please try again.", 500);

    return next(error);
  }

  // DUMMY_PLACE.push(createPlace);
  res.status(200).json({ place: createPlace });
};
exports.updatePlaceById = async (req, res, next) => {
  const { title, description } = req.body;
  const placeId = req.params.pid;

  let place;
  try {
    place = await Place.findById(placeId);
  } catch (err) {
    const error = new AppError(
      "Could not update data ,something went wrong",
      500
    );
    return next(error);
  }

  if (place.creator.toString() !== req.userData.userId) {
    const error = new AppError("You are not allowed to edit this place", 401);
    return next(error);
  }

  place.title = title;
  place.description = description;

  try {
    await place.save();
  } catch (err) {
    const error = new AppError(
      "Could not update data ,something went wrong",
      500
    );
    return next(error);
  }

  res.status(200).json({
    place: place.toObject({ getters: true }),
  });
};
exports.deletePlace = async (req, res, next) => {
  const placeId = req.params.pid;

  let place;
  try {
    place = await Place.findById(placeId).populate("creator");
  } catch (err) {
    const error = new AppError(
      "Something went wrong, could not delete place.",
      500
    );
    console.log(error);
    return next(error);
  }

  if (!place) {
    const error = new AppError("Could not find place for this id.", 404);
    return next(error);
  }

  console.log(place);

  if (place.creator.id !== req.userData.userId) {
    const error = new AppError("You are not allowed to edit this place", 401);
    return next(error);
  }

  const imagePath = Place.image;

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();

    await Place.findByIdAndDelete(placeId, { session: sess });

    await User.findByIdAndUpdate(
      place.creator._id,
      {
        $pull: { places: placeId },
      },
      { session: sess }
    );

    await sess.commitTransaction();
  } catch (err) {
    console.log(err);
    const error = new AppError(
      "Something went wrong, could not delete place.",
      500
    );
    return next(error);
  }

  fs.unlink(imagePath, (err) => {
    console.log(err);
  });

  res.status(200).json({ message: "Deleted place." });
};
