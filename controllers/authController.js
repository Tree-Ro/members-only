const User = require('../models/user');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');

const asyncHandler = require('express-async-handler');
const passport = require('passport');
const user = require('../models/user');

const roleHierarchy = {
  guest: 1,
  member: 2,
  admin: 3,
};

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

  passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureMessage: true,
  }),
];

module.exports.logout_GET = (req, res, next) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect('/');
  });
};

module.exports.upgrade_GET = asyncHandler(async (req, res, next) => {
  const currentUserRole = req.user ? req.user.role : null;
  let query = {};
  let roles = Object.keys(roleHierarchy);

  if (roleHierarchy[currentUserRole] === roleHierarchy['member']) {
    // If the current user is a member, show only guests
    query = { role: 'guest' };
    roles = ['guest', 'member'];
  } else if (roleHierarchy[currentUserRole] === roleHierarchy['guest']) {
    // If the current user is a guest, they shouldn't see any other users
    query = { _id: null };
    roles = [];
  } else if (roleHierarchy[currentUserRole] === roleHierarchy['admin']) {
    // Admins can see all roles
    query = {};
  }

  // Fetch users based on the query and sort them by username
  const users = await User.find(query, 'username role')
    .sort({ username: 1 })
    .exec();

  // Render the view with users and roles
  res.render('upgrade', { users: users, roles: roles });
});

module.exports.upgrade_POST = asyncHandler(async (req, res) => {
  const { id, role } = req.body;
  const currentUser = req.user.id;

  // Validate request body
  if (!id || !role) {
    return res.status(400).json({ message: 'User ID and role are required.' });
  }

  // Validate role
  if (!roleHierarchy.hasOwnProperty(role)) {
    return res.status(400).json({ message: 'Invalid role.' });
  }

  // Find the target user
  const targetUser = await User.findById(id);

  if (!currentUser) {
    return res.status(404).json({ message: 'Current user not found.' });
  }

  if (!targetUser) {
    return res.status(404).json({ message: 'Target user not found.' });
  }

  // Check if the current user has a higher role than the target user
  if (roleHierarchy[currentUser.role] < roleHierarchy[targetUser.role]) {
    return res.status(403).json({
      message: "You do not have permission to update this user's role.",
    });
  }

  // Update the target user's role
  await User.findByIdAndUpdate(id, { role });

  res.redirect('upgrade');
});

module.exports.delete_POST = asyncHandler(async (req, res) => {
  const { id, role } = req.body;
  const currentUserId = req.user.id; // Assuming `req.user` contains the current user's info

  // Validate request body
  if (!id || !role) {
    return res.status(400).json({ message: 'User ID and role are required.' });
  }

  // Validate role
  if (!roleHierarchy.hasOwnProperty(role)) {
    return res.status(400).json({ message: 'Invalid role.' });
  }

  // Find the current user and target user
  const currentUser = await User.findById(currentUserId);
  const targetUser = await User.findById(id);

  if (!currentUser) {
    return res.status(404).json({ message: 'Current user not found.' });
  }

  if (!targetUser) {
    return res.status(404).json({ message: 'Target user not found.' });
  }

  // Check if the current user has a higher role than the target user
  if (roleHierarchy[currentUser.role] < roleHierarchy[targetUser.role]) {
    return res.status(403).json({
      message: 'You do not have permission to delete this account.',
    });
  }

  // Update the target user's role
  await User.findByIdAndDelete(id);

  res.redirect('upgrade');
});
