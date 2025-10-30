const express = require('express');
const router = express.Router();
const {
  createFAQ,
  updateFAQ,
  deleteFAQ,
  listFAQs,
  reorderFAQs
} = require('../../controllers/admin/faqController.js');

const { verifyToken } = require('../../middleware/auth.js');

router.post('/', verifyToken,  createFAQ);
router.get('/', verifyToken,  listFAQs);
router.put('/:id', verifyToken,  updateFAQ);
router.delete('/:id', verifyToken,  deleteFAQ);
router.post('/reorder', verifyToken,  reorderFAQs);

module.exports = router;
