const mongoose = require("mongoose");
const session = require("express-session");
const config = require("./config/config");
const express = require("express");
const morgan = require("morgan");
const userRoute = require("./routes/userRoute");
const adminRoute = require("./routes/adminRoute");
const app = express();
mongoose.connect(config.mongoDBURL);

app.use(morgan("dev"));
app.use("/public", express.static("public"));

app.use(
  session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set("view engine", "ejs");

//for userRoute
app.use("/", userRoute);
//for adminRoute

app.use("/admin", adminRoute);

app.listen(config.port, () => {
  console.log(`Server running on http://localhost:${config.port}/`);
});