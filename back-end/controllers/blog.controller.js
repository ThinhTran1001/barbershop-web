const Blog = require('../models/blog.model');
const User = require('../models/user.model');

// GET blog by ID and increase view count
const getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    ).populate('author', 'name avatarUrl');

    if (!blog)
      return res.status(404).json({ success: false, message: 'Blog not found' });

    res.json({ success: true, data: blog });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Get blog failed', error: err.message });
  }
};

// GET all blogs with pagination, sorting and filtering
const getAllBlogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 5,
      sort = 'desc',
      category,
      status
    } = req.query;

    const pageNum = Math.max(parseInt(page), 1);
    const limitNum = Math.max(parseInt(limit), 1);

    const query = {};
    if (category) query.categories = category;
    if (status) query.status = status;

    const sortOptions = {
      asc: { createdAt: 1 },
      desc: { createdAt: -1 },
      views: { views: -1 }
    };

    const sortQuery = sortOptions[sort] || sortOptions['desc'];

    const total = await Blog.countDocuments(query);
    const blogs = await Blog.find(query)
      .populate('author', 'name avatarUrl')
      .sort(sortQuery)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    res.json({
      success: true,
      total,
      page: pageNum,
      limit: limitNum,
      data: blogs.map(blog => {
        // Nếu author là null hoặc undefined, trả về null, nếu là object thì giữ nguyên
        let author = null;
        if (blog.author && typeof blog.author === 'object' && blog.author.name) {
          author = {
            _id: blog.author._id,
            name: blog.author.name,
            avatarUrl: blog.author.avatarUrl || null
          };
        }
        return {
          ...blog.toObject(),
          status: blog.status || 'active',
          author
        };
      })
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// CREATE a new blog
const createBlog = async (req, res) => {
  try {
    const { title, content, tags, shortDesc, image, status } = req.body;
    // Đảm bảo categories luôn là mảng string
    const categories = Array.isArray(req.body.categories)
      ? req.body.categories
      : req.body.categories
        ? [req.body.categories]
        : [];
    const author = req.user?._id || req.user?.id;
    if (!title || !content)
      return res.status(400).json({ success: false, message: 'Title và content là bắt buộc' });
    if (!author)
      return res.status(401).json({ success: false, message: 'Unauthorized: missing user' });

    const blog = new Blog({
      title,
      content,
      author,
      categories,
      tags,
      shortDesc,
      image,
      status
    });
    const savedBlog = await blog.save();
    await savedBlog.populate('author', 'name avatarUrl');

    res.status(201).json({ success: true, data: savedBlog });
  } catch (err) {
    res.status(400).json({ success: false, message: 'Create failed', error: err.message });
  }
};

// UPDATE a blog by ID
const updateBlog = async (req, res) => {
  try {
    // Đảm bảo categories luôn là mảng string
    const categories = Array.isArray(req.body.categories)
      ? req.body.categories
      : req.body.categories
        ? [req.body.categories]
        : [];
    const updateData = { ...req.body, categories };
    const updated = await Blog.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('author', 'name avatarUrl');

    if (!updated)
      return res.status(404).json({ success: false, message: 'Blog not found' });

    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: 'Update failed', error: err.message });
  }
};

// DELETE a blog by ID
const deleteBlog = async (req, res) => {
  try {
    const deleted = await Blog.findByIdAndDelete(req.params.id);

    if (!deleted)
      return res.status(404).json({ success: false, message: 'Blog not found' });

    res.json({ success: true, message: 'Blog deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Delete failed', error: err.message });
  }
};

module.exports = {
  getBlogById,
  getAllBlogs,
  createBlog,
  updateBlog,
  deleteBlog
};
