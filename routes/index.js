var express = require('express');
var mongoose = require("mongoose");
var router = express.Router();
var User = require("../models/User");
var db = require("../dbconnect/myurl").myurl;
var passport = require('passport');
var jsonwt = require('jsonwebtoken');

var bcrypt = require('bcrypt')
var saltRounds = 10

mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);

mongoose
  .connect(db)
  .then(() => {
    console.log("Database is connected");
  })
  .catch(err => {
    console.log("Error is", err.message)
  })

  router.use(passport.initialize());
require("../strategies/jsonwtStrategy")(passport);

router.get('/', function(req, res, next) {
  res.send("hello! youve reached the api endpoint");
});

router.post("/signup", async (req, res) => {
  var newUser = new User({
    name: req.body.name,
    password: req.body.password
  });

  await User.findOne({ name: newUser.name })
    .then(async profile => {
      if (!profile) {
        bcrypt.hash(newUser.password, saltRounds, async (err, hash) => {
          if (err) {
            console.log("Error is", err.message);
          } else {
            newUser.password = hash;
            await newUser
              .save()
              .then(() => {
                res.status(200).send(newUser);
              })
              .catch(err => {
                console.log("Error is ", err.message);
              });
          }
        });
      } else {
        res.send("User already exists...");
      }
    })
    .catch(err => {
      console.log("Error is", err.message);
    });
});

router.post("/login", async (req, res) => {
  var newUser = {};
  newUser.name = req.body.name;
  newUser.password = req.body.password;

  await User.findOne({ name: newUser.name })
    .then(profile => {
      if (!profile) {
        res.send("User not exist");
      } else {
        bcrypt.compare(
          newUser.password,
          profile.password,
          async (err, result) => {
            if (err) {
              console.log("Error is", err.message);
            } else if (result == true) {
              const payload = {
                id: profile.id,
                name: profile.name
              };
              jsonwt.sign(
                payload,
                'abcdef',
                { expiresIn: 3600 },
                (err, token) => {
                  res.json({
                    success: true,
                    token: "Bearer " + token
                  });
                }
              );
            } else {
              res.send("User Unauthorized Access");
            }
          }
        );
      }
    })
    .catch(err => {
      console.log("Error is ", err.message);
    });
});

router.get(
  "/profile",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    console.log(req);
    res.json({
      id: req.user.id,
      name: req.user.name
    });
  }
);

module.exports = router;
