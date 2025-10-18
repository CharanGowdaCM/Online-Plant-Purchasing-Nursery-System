const express = require('express');
const router = express.Router();
const {
  updateTicketStatus,
  getAllTickets
} = require('../../controllers/admin/supportTicketController.js');

const { verifyToken, supportAdmin } = require('../../middleware/auth.js');

// Admin routes
router.get('/all', verifyToken, supportAdmin, getAllTickets);
router.put('/:id', verifyToken, supportAdmin, updateTicketStatus);

module.exports = router;
