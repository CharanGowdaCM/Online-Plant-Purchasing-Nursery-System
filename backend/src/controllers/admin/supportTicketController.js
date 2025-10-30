/*
 Tickets(customer support) Controller - Handles support ticket management operations
 Author: Akhilesh K
 Features: Create ticket, update ticket, get ticket details, get all tickets
*/

const SupportTicketModel = require('../../models/supportTicketModel.js');
const UserModel = require('../../models/userModel.js');
const { sendTicketStatusUpdate, sendTicketCreated } = require('../../utils/notifications.js');
const { recordActivity } = require('../../utils/activityRecorder.js');


const createTicket = async (req, res) => {
  try {
    const {
      user_id: providedUserId,
      customer_email,
      customer_name,
      subject,
      category,
      priority,
      description,
      assigned_to,
    } = req.body;

    const isAdmin = req.user?.role === 'support_admin' || req.user?.role === 'super_admin';

    let user_id = null;
    let finalCustomerEmail = customer_email;
    let finalCustomerName = customer_name;

    if (isAdmin) {
      if (providedUserId) {
        user_id = providedUserId;
        const user = await UserModel.getUserDetailsById(providedUserId);
        if (user) {
          finalCustomerEmail = user.email;
          finalCustomerName = `${user.profile?.first_name || ''} ${user.profile?.last_name || ''}`.trim();
        }
      } else if (!customer_email || !customer_name) {
        return res.status(400).json({
          success: false,
          message: 'Admin must provide user_id or customer_email & customer_name',
        });
      }
    } else {
      user_id = req.user?.id;
      const user = await UserModel.getUserDetailsById(user_id);
      finalCustomerEmail = user.email;
      finalCustomerName = `${user.profile?.first_name || ''} ${user.profile?.last_name || ''}`.trim();
    }

    const newTicket = await SupportTicketModel.createTicket({
      user_id,
      customer_email: finalCustomerEmail,
      customer_name: finalCustomerName,
      subject,
      category,
      priority,
      description,
      assigned_to,
    });

    await sendTicketCreated(newTicket);

    recordActivity(req, 'CREATE', 'SupportTicket', newTicket.id, {
      ticket_number: newTicket.ticket_number,
      category: newTicket.category,
      priority: newTicket.priority,
      subject: newTicket.subject,
      customer_email: finalCustomerEmail
    });

    res.status(201).json({
      success: true,
      message: 'Support ticket created successfully',
      ticket: newTicket,
    });
  } catch (error) {
    console.error('Error creating support ticket:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const updateTicketStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, priority, assigned_to } = req.body;

    const updatedTicket = await SupportTicketModel.updateTicket(id, {
      status,
      priority,
      assigned_to,
    });

    if (!updatedTicket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    if (updatedTicket.user_id) {
      const user = await UserModel.getUserDetailsById(updatedTicket.user_id);
      await sendTicketStatusUpdate(updatedTicket, user);
    }

    recordActivity(req, 'UPDATE', 'SupportTicket', id, {
      ticket_number: updatedTicket.ticket_number,
      old_status: req.body.old_status,
      new_status: status,
      new_priority: priority,
      assigned_to: assigned_to
    });

    res.json({
      success: true,
      message: 'Ticket updated successfully',
      ticket: updatedTicket,
    });
  } catch (error) {
    console.error('Error updating support ticket:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const getUserTickets = async (req, res) => {
  try {
    const userId = req.user?.id;
    const tickets = await SupportTicketModel.getTicketsByUser(userId);
    res.json({ success: true, tickets });
  } catch (error) {
    console.error('Error fetching user tickets:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const getTicketDetails = async (req, res) => {
  try {
    const ticketId = req.params.ticketId;
    console.log(req);
    console.log('Fetching ticket with ID:', ticketId);
    const ticket = await SupportTicketModel.getTicketById(ticketId);
    res.json({ success: true, ticket });
  } catch (error) {
    console.error('Error fetching ticket:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const getAllTickets = async (req, res) => {
  try {
    const { page, limit, status, priority, category, assigned_to, search } = req.query;
    const tickets = await SupportTicketModel.listTickets({
      page: Number(page) || 1,
      limit: Number(limit) || 20,
      status,
      priority,
      category,
      assigned_to,
      search,
    });

    res.json({ success: true, tickets });
  } catch (error) {
    console.error('Error fetching all tickets:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

module.exports = {
  createTicket,
  updateTicketStatus,
  getUserTickets,
  getTicketDetails,
  getAllTickets,
};

