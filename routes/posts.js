const express = require('express');
const { body, validationResult, param } = require('express-validator');
const Post = require('../models/Post');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const path = require('path');

const router = express.Router();

// GET /api/posts - Get all blog posts (with pagination)
router.get('/', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const total = await Post.countDocuments();
    const posts = await Post.find()
      .populate('category')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    res.json({
      posts,
      page,
      totalPages: Math.ceil(total / limit),
      total,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/posts/:id - Get a specific blog post
router.get('/:id', [param('id').isMongoId()], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const post = await Post.findById(req.params.id).populate('category');
    if (!post) return res.status(404).json({ message: 'Post not found' });
    res.json(post);
  } catch (err) {
    next(err);
  }
});

// POST /api/posts - Create a new blog post (with image upload, protected)
router.post(
  '/',
  auth,
  upload.single('featuredImage'),
  [
    body('title').notEmpty(),
    body('content').notEmpty(),
    body('category').isMongoId(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
      const postData = {
        title: req.body.title,
        content: req.body.content,
        category: req.body.category,
        featuredImage: req.file ? `/uploads/${req.file.filename}` : undefined,
      };
      const post = new Post(postData);
      await post.save();
      res.status(201).json(post);
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/posts/:id - Update an existing blog post
router.put(
  '/:id',
  auth,
  upload.single('featuredImage'),
  [
    param('id').isMongoId(),
    body('title').optional().notEmpty(),
    body('content').optional().notEmpty(),
    body('category').optional().isMongoId(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
      const updateData = { ...req.body };
      if (req.file) {
        updateData.featuredImage = `/uploads/${req.file.filename}`;
      }
      const post = await Post.findByIdAndUpdate(req.params.id, updateData, { new: true });
      if (!post) return res.status(404).json({ message: 'Post not found' });
      res.json(post);
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/posts/:id - Delete a blog post
router.delete('/:id', auth, [param('id').isMongoId()], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const post = await Post.findByIdAndDelete(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    res.json({ message: 'Post deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
