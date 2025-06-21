const express = require('express');
const { body, validationResult, param } = require('express-validator');
const Comment = require('../models/Comment');
const Post = require('../models/Post');

const router = express.Router();

// GET /api/comments/:postId - Get all comments for a post
router.get('/:postId', [param('postId').isMongoId()], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const comments = await Comment.find({ post: req.params.postId }).sort({ createdAt: -1 });
    res.json(comments);
  } catch (err) {
    next(err);
  }
});

// POST /api/comments/:postId - Add a comment to a post
router.post(
  '/:postId',
  [
    param('postId').isMongoId(),
    body('author').notEmpty(),
    body('content').notEmpty(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
      // Ensure post exists
      const post = await Post.findById(req.params.postId);
      if (!post) return res.status(404).json({ message: 'Post not found' });
      const comment = new Comment({
        post: req.params.postId,
        author: req.body.author,
        content: req.body.content,
      });
      await comment.save();
      res.status(201).json(comment);
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
