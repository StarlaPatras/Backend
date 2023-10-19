const fs = require("fs");
const express = require("express");
const bodyParser = require("body-parser");
// const cors = require("cors");
const placesRoute = require("./Routes/Places-routes");
const userRoute = require("./Routes/User-routes");
const AppError = require("./models/AppError");
const mongoose = require("mongoose");
const path = require("path");

const app = express();

// app.use(cors())
app.use(bodyParser.json());

app.use("/uploads/images", express.static(path.join("uploads", "images")));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type,Accept,Authorization"
  );
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE");

  next();
});

app.use("/api/places", placesRoute);
app.use("/api/users", userRoute);

// Agar koi route na mily
app.use((req, res, next) => {
  throw new AppError("could not find this route", 404);
});

// Error middlerware
app.use((error, req, res, next) => {
  if (req.file) {
    fs.unlink(req.file.path, (err) => {
      console.log(err);
    });
  }

  if (res.headerSent) {
    return next(error);
  }
  res.status(error.code || 500).json({
    message: error.message || "An unknown error occurred!",
  });
});

mongoose
  .connect(
    `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.0tsdls5.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`
  )
  .then(
    app.listen(5000, () => {
      console.log("DB Connection succesful");
    })
  )
  .catch((err) => console.log(err));
