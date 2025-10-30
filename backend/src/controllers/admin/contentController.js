/*
 Content Controller - Handles blogs and plant care guides management
 Author: Charan Gowda C M
 Features: Create, Update, Delete, List blog posts and plant care guides
*/

const BlogPostModel = require('../../models/blogPostModel');
const PlantCareModel = require('../../models/plantCareModel');
const { recordActivity } = require('../../utils/activityRecorder');

class ContentController {
  static async createBlogPost(req, res) {
    try {
      const author_id = req.user.id;
      const post = await BlogPostModel.createPost({ ...req.body, author_id });
      
      recordActivity(req, 'CREATE', 'BlogPost', post.id, {
        title: post.title,
        slug: post.slug,
        is_published: post.is_published
      });
      
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
      
      recordActivity(req, 'UPDATE', 'BlogPost', id, {
        title: post.title,
        slug: post.slug,
        is_published: post.is_published
      });
      
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
      
      recordActivity(req, 'DELETE', 'BlogPost', id, {
        title: post.title,
        slug: post.slug
      });
      
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

  // plant care guides
  static async createPlantGuide(req, res) {
    try {
      const author_id = req.user.id;
      const guide = await PlantCareModel.createGuide({ ...req.body, author_id });
      
      recordActivity(req, 'CREATE', 'PlantGuide', guide.id, {
        title: guide.title,
        slug: guide.slug,
        plant_type: guide.plant_type,
        is_published: guide.is_published
      });
      
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
      
      recordActivity(req, 'UPDATE', 'PlantGuide', id, {
        title: guide.title,
        slug: guide.slug,
        plant_type: guide.plant_type,
        is_published: guide.is_published
      });
      
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
      
      recordActivity(req, 'DELETE', 'PlantGuide', id, {
        title: guide.title,
        slug: guide.slug,
        plant_type: guide.plant_type
      });
      
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