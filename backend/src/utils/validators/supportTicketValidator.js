// src/utils/validators/supportTicketValidator.js

const SupportTicketModel = require('../../src/models/supportTicketModel');

const ALLOWED_CATEGORIES = SupportTicketModel.TICKET_CATEGORIES || [
  'order_issue','plant_care','technical','general','complaint'
];
const ALLOWED_PRIORITIES = SupportTicketModel.TICKET_PRIORITIES || ['low','medium','high','urgent'];

function validateCreateTicket(payload) {
  const errors = {};

  if (!payload.subject || String(payload.subject).trim().length < 3) {
    errors.subject = 'Subject is required and should be at least 3 characters';
  }

  if (!payload.description || String(payload.description).trim().length < 10) {
    errors.description = 'Description is required and should be at least 10 characters';
  }

  if (!payload.customer_email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.customer_email)) {
    errors.customer_email = 'Valid customer email is required';
  }

  if (payload.category && !ALLOWED_CATEGORIES.includes(payload.category)) {
    errors.category = `Category must be one of: ${ALLOWED_CATEGORIES.join(', ')}`;
  }

  if (payload.priority && !ALLOWED_PRIORITIES.includes(payload.priority)) {
    errors.priority = `Priority must be one of: ${ALLOWED_PRIORITIES.join(', ')}`;
  }

  return { isValid: Object.keys(errors).length === 0, errors };
}

function validateUpdateTicket(payload) {
  const errors = {};
  if (payload.status && !SupportTicketModel.TICKET_STATUSES.includes(payload.status)) {
    errors.status = `Invalid status. Allowed: ${SupportTicketModel.TICKET_STATUSES.join(', ')}`;
  }

  if (payload.priority && !SupportTicketModel.TICKET_PRIORITIES.includes(payload.priority)) {
    errors.priority = `Invalid priority. Allowed: ${SupportTicketModel.TICKET_PRIORITIES.join(', ')}`;
  }

  return { isValid: Object.keys(errors).length === 0, errors };
}

module.exports = { validateCreateTicket, validateUpdateTicket };
