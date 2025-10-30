/*
 FAQs Controller - Handles FAQ management for  users
 Author: Akhilesh k
 Features: Create, Update, Delete, List FAQs and Categories
*/

const FAQModel = require('../../models/faqModel.js');

const createFAQ = async (req, res) => {
  try {
    const { category, question, answer, display_order, is_active } = req.body;

    // Validation
    if (!category || !category.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Category is required'
      });
    }

    if (!question || !question.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Question is required'
      });
    }

    if (!answer || !answer.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Answer is required'
      });
    }

    const newFAQ = await FAQModel.createFAQ({
      category,
      question,
      answer,
      display_order: display_order !== undefined ? parseInt(display_order) : 0,
      is_active: is_active !== undefined ? is_active : true
    });

    res.status(201).json({
      success: true,
      message: 'FAQ created successfully',
      faq: newFAQ
    });
  } catch (error) {
    console.error('Error creating FAQ:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

const updateFAQ = async (req, res) => {
  try {
    const { id } = req.params;
    const { category, question, answer, display_order, is_active } = req.body;

    const existingFAQ = await FAQModel.getFAQById(id);
    if (!existingFAQ) {
      return res.status(404).json({
        success: false,
        message: 'FAQ not found'
      });
    }

    // Build update payload
    const updates = {};
    if (category !== undefined) updates.category = category.trim();
    if (question !== undefined) updates.question = question.trim();
    if (answer !== undefined) updates.answer = answer.trim();
    if (display_order !== undefined) updates.display_order = parseInt(display_order);
    if (is_active !== undefined) updates.is_active = is_active;

    const updatedFAQ = await FAQModel.updateFAQ(id, updates);

    res.json({
      success: true,
      message: 'FAQ updated successfully',
      faq: updatedFAQ
    });
  } catch (error) {
    console.error('Error updating FAQ:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

const deleteFAQ = async (req, res) => {
  try {
    const { id } = req.params;
    const { hard_delete } = req.query;

    const existingFAQ = await FAQModel.getFAQById(id);
    if (!existingFAQ) {
      return res.status(404).json({
        success: false,
        message: 'FAQ not found'
      });
    }

    const hardDelete = hard_delete === 'true';
    const deletedFAQ = await FAQModel.deleteFAQ(id, hardDelete);

    res.json({
      success: true,
      message: hardDelete ? 'FAQ permanently deleted' : 'FAQ deactivated',
      faq: deletedFAQ
    });
  } catch (error) {
    console.error('Error deleting FAQ:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

const getFAQById = async (req, res) => {
  try {
    const { id } = req.params;

    const faq = await FAQModel.getFAQById(id);
    if (!faq) {
      return res.status(404).json({
        success: false,
        message: 'FAQ not found'
      });
    }

    res.json({
      success: true,
      faq
    });
  } catch (error) {
    console.error('Error fetching FAQ:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

const listFAQs = async (req, res) => {
  try {
    const { 
      category, 
      is_active, 
      page = 1, 
      limit = 50, 
      search 
    } = req.query;

    const isAdmin = req.user?.role === 'support_admin' || req.user?.role === 'super_admin';
    
    const filters = {
      category: category || null,
      is_active: isAdmin ? (is_active === 'true' ? true : is_active === 'false' ? false : null) : true,
      page: parseInt(page),
      limit: parseInt(limit),
      search: search || null
    };

    const { faqs, count } = await FAQModel.listFAQs(filters);

    res.json({
      success: true,
      faqs,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total: count,
        totalPages: Math.ceil(count / filters.limit)
      }
    });
  } catch (error) {
    console.error('Error listing FAQs:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

 
const getFAQCategories = async (req, res) => {
  try {
    const activeOnly = req.query.active_only !== 'false'; 
    const categories = await FAQModel.getAllCategories(activeOnly);

    res.json({
      success: true,
      categories
    });
  } catch (error) {
    console.error('Error fetching FAQ categories:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

const reorderFAQs = async (req, res) => {
  try {
    const { order_updates } = req.body;

    if (!Array.isArray(order_updates) || order_updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'order_updates must be a non-empty array of { id, display_order }'
      });
    }

    await FAQModel.reorderFAQs(order_updates);

    res.json({
      success: true,
      message: 'FAQs reordered successfully'
    });
  } catch (error) {
    console.error('Error reordering FAQs:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

module.exports = {
  createFAQ,
  updateFAQ,
  deleteFAQ,
  getFAQById,
  listFAQs,
  getFAQCategories,
  reorderFAQs
};
