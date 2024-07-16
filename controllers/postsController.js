const Post = require('../models/post');

const asyncHandler = require('express-async-handler');

module.exports.index = asyncHandler(async (req, res) => {
  const posts = await Post.find({})
    .populate('user')
    .sort({ createdAt: -1 })
    .exec();

  res.render('index', { posts });
});

module.exports.new_GET = asyncHandler(async (req, res) => {
  res.render('new');
});

module.exports.new_POST = asyncHandler(async (req, res) => {
  const { id, text } = req.body;

  console.log(id, text);
  if (!id || !text)
    return res
      .status(400)
      .json({ message: 'User ID and message are required.' });

  const post = await new Post({
    text,
    user: id,
  }).save();

  res.redirect('/');
});

module.exports.remove_POST = asyncHandler(async (req, res) => {
  const { id } = req.body;
  const user = req.user;

  // Validate request body
  if (!id) {
    return res.status(400).json({ message: 'User ID is required.' });
  }

  // Check if the current user has the 'admin' role
  if (user.role !== 'admin') {
    return res
      .status(403)
      .json({ message: 'You do not have permission to remove posts.' });
  }

  // Find and remove the target user
  const targetPost = await Post.findByIdAndDelete(id);
  if (!targetPost) {
    return res.status(404).json({ message: 'Post not found.' });
  }

  res.redirect('/');
});
