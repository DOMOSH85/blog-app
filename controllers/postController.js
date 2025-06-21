import Post from '../models/Post.js'
import { validationResult } from 'express-validator'
import slugify from 'slugify'

// @desc    Get all posts
// @route   GET /api/posts
// @access  Public
export const getPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit

    const total = await Post.countDocuments({ isPublished: true })
    const posts = await Post.find({ isPublished: true })
      .populate('category', 'name')
      .populate('author', 'name avatar')
      .populate('comments')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })

    res.json({
      posts,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalPosts: total
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// @desc    Get single post by slug
// @route   GET /api/posts/:slug
// @access  Public
export const getPostBySlug = async (req, res) => {
  try {
    const post = await Post.findOne({ slug: req.params.slug })
      .populate('category', 'name')
      .populate('author', 'name avatar')
      .populate({
        path: 'comments',
        populate: {
          path: 'user',
          select: 'name avatar'
        }
      })

    if (!post) {
      return res.status(404).json({ message: 'Post not found' })
    }

    res.json(post)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// @desc    Create a post
// @route   POST /api/posts
// @access  Private/Admin
export const createPost = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  try {
    const { title, content, category, tags } = req.body

    const post = new Post({
      title,
      content,
      category,
      tags,
      author: req.user.id,
      featuredImage: req.file?.path
    })

    const savedPost = await post.save()
    res.status(201).json(savedPost)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}