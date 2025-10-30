const express = require('express');
const ContentController = require('../../controllers/admin/contentController');
const {  verifyToken, contentAdmin } = require('../../middleware/auth.js');

const router = express.Router();

// Blog posts
router.post('/blog',  verifyToken, contentAdmin, ContentController.createBlogPost);
router.put('/blog/:id',  verifyToken, contentAdmin, ContentController.updateBlogPost);
router.delete('/blog/:id',  verifyToken, contentAdmin, ContentController.deleteBlogPost);
router.get('/blog', ContentController.listBlogPosts);

// Plant care guides
router.post('/plant-guides',  verifyToken, contentAdmin, ContentController.createPlantGuide);
router.put('/plant-guides/:id',  verifyToken, contentAdmin, ContentController.updatePlantGuide);
router.delete('/plant-guides/:id',  verifyToken, contentAdmin, ContentController.deletePlantGuide);
router.get('/plant-guides', ContentController.listPlantGuides);

module.exports = router;
