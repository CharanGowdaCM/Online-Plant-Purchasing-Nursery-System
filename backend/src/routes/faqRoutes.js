const express = require('express');
const router = express.Router();
const {
  getFAQById,
  listFAQs,
  getFAQCategories
} = require('../controllers/admin/faqController.js');


router.get('/', listFAQs);

router.get('/categories', getFAQCategories);


router.get('/:id', getFAQById);

module.exports = router;
