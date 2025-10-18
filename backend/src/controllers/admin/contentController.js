const BlogPostModel = require('../../models/blogPostModel');
const PlantCareModel = require('../../models/plantCareModel');

class ContentController {
  // ---------------- BLOG POSTS ----------------
  static async createBlogPost(req, res) {
    try {
      const author_id = req.user.id;
      const post = await BlogPostModel.createPost({ ...req.body, author_id });
      res.status(201).json({ success: true, post });
    } catch (error) {
      console.error('Error creating blog post:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async updateBlogPost(req, res) {
    try {
      const { id } = req.params;
      const post = await BlogPostModel.updatePost(id, req.body);
      res.json({ success: true, post });
    } catch (error) {
      console.error('Error updating blog post:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async deleteBlogPost(req, res) {
    try {
      const { id } = req.params;
      const post = await BlogPostModel.deletePost(id);
      res.json({ success: true, post });
    } catch (error) {
      console.error('Error deleting blog post:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async listBlogPosts(req, res) {
    try {
      const posts = await BlogPostModel.listPosts(req.query);
      res.json({ success: true, ...posts });
    } catch (error) {
      console.error('Error listing blog posts:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // ---------------- PLANT CARE GUIDES ----------------
  static async createPlantGuide(req, res) {
    try {
      const author_id = req.user.id;
      const guide = await PlantCareModel.createGuide({ ...req.body, author_id });
      res.status(201).json({ success: true, guide });
    } catch (error) {
      console.error('Error creating plant guide:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async updatePlantGuide(req, res) {
    try {
      const { id } = req.params;
      const guide = await PlantCareModel.updateGuide(id, req.body);
      res.json({ success: true, guide });
    } catch (error) {
      console.error('Error updating plant guide:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async deletePlantGuide(req, res) {
    try {
      const { id } = req.params;
      const guide = await PlantCareModel.deleteGuide(id);
      res.json({ success: true, guide });
    } catch (error) {
      console.error('Error deleting plant guide:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async listPlantGuides(req, res) {
    try {
      const guides = await PlantCareModel.listGuides(req.query);
      res.json({ success: true, ...guides });
    } catch (error) {
      console.error('Error listing plant guides:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = ContentController;