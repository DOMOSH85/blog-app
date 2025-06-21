const express = require('express');
const { body, validationResult } = require('express-validator');
const Category = require('../models/Category');

const router = express.Router();

// GET /api/categories - Get all categories
router.get('/', async (req, res, next) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (err) {
    next(err);
  }
});

// POST /api/categories - Create a new category
router.post(
  '/',
  [body('name').notEmpty()],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
      const category = new Category({ name: req.body.name });
      await category.save();
      res.status(201).json(category);
    } catch (err) {
      if (err.code === 11000) {
        return res.status(400).json({ message: 'Category already exists' });
      }
      next(err);
    }
  }
);

module.exports = router;
