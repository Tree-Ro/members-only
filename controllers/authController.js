const User = require('../models/user');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');

const asyncHandler = require('express-async-handler');
const passport = require('passport');

const normalizeEmail = (req, res, next) => {
  if (req.body.email) {
    req.body.email = req.body.email.toLowerCase();
  }
  next();
};

exports.register_GET = (req, res) => {
  res.render('register_form');
};

exports.register_POST = [
  normalizeEmail,

  body('username')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Username must not be empty.')
    .escape(),

  body('username')
    .trim()
    .isLength({ min: 3 })
    .withMessage('Username is too short')
    .escape(),

  body('email')
    .trim()
    .isEmail()
    .withMessage('Email is not a valid email address')

    .custom(async (value) => {
      const user = await User.findOne({ email: value }).exec();
      if (user) {
        throw new Error('This email is already in use.');
      }
    })
    .withMessage('This email is already in use')
    .escape(),

  body('password')
    .trim()
    .isLength({ min: 8 })
    .withMessage('Password needs to be longer than 8 characters')
    .escape(),

  body('confirm-password')
    .custom((value, { req }) => {
      return value === req.body.password;
    })
    .withMessage('Passwords do not match'),

  asyncHandler(async (req, res, next) => {
    const result = validationResult(req);
    const body = req.body;
    if (result.isEmpty()) {
      try {
        const hashedPassword = await bcrypt.hash(body.password, 10);
        const user = new User({
          username: body.username,
          email: body.email,
          password: hashedPassword,
        });
        const result = await user.save();

        return res.redirect('login');
      } catch (err) {
        return next(err);
      }
    }

    res.render('register_form', { content: req.body, errors: result.errors });
  }),
];

module.exports.login_GET = (req, res) => {
  res.render('login_form');
};

module.exports.login_POST = [
  normalizeEmail,

  (req, res, next) => {
    console.log(req.body);

    next();
  },

  passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
  }),
];
