const Post = require('../models/post');
const User = require('../models/user');

const asyncHandler = require('express-async-handler');

module.exports.index = asyncHandler(async (req, res, next) => {
  res.render('index');
});
