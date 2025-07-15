const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blog.controller');

// GET all blogs
router.get('/', blogController.getAllBlogs);

// GET blog by ID
router.get('/:id', blogController.getBlogById);

// CREATE new blog
router.post('/', blogController.createBlog);

// UPDATE blog
router.put('/:id', blogController.updateBlog);

// DELETE blog
router.delete('/:id', blogController.deleteBlog);

module.exports = router;
