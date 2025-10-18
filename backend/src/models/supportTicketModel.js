const supabase = require('../config/supabase.js');

class SupportTicketModel {
  // Create a new support ticket
  static async createTicket({
    user_id = null,
    customer_email,
    customer_name,
    subject,
    category = 'general',
    priority = 'medium',
    description,
    assigned_to = null,
  }) {
    const ticketNumber = `TCKT-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const payload = {
      ticket_number: ticketNumber,
      user_id,
      customer_email,
      customer_name,
      subject,
      category,
      priority,
      description,
      assigned_to,
    };

    const { data, error } = await supabase
      .from('support_tickets')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Get ticket by ID
  static async getTicketById(ticketId) {
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('id', ticketId)
      .single();

    if (error) throw error;
    return data;
  }

  // Update a ticket
  static async updateTicket(ticketId, updates) {
    const payload = { ...updates, updated_at: new Date().toISOString() };

    const { data, error } = await supabase
      .from('support_tickets')
      .update(payload)
      .eq('id', ticketId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // List tickets with filters & pagination
  static async listTickets({ page = 1, limit = 20, status, priority, category, assigned_to, search }) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('support_tickets')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (status) query = query.eq('status', status);
    if (priority) query = query.eq('priority', priority);
    if (category) query = query.eq('category', category);
    if (assigned_to) query = query.eq('assigned_to', assigned_to);

    if (search) {
      query = query.or(
        `subject.ilike.%${search}%,ticket_number.ilike.%${search}%,customer_name.ilike.%${search}%,customer_email.ilike.%${search}%`
      );
    }

    const { data, error, count } = await query;
    if (error) throw error;

    return { tickets: data || [], count: count || 0 };
  }

  // Get tickets for a specific user
  static async getTicketsByUser(userId, { page = 1, limit = 20 } = {}) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
      .from('support_tickets')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;
    return { tickets: data || [], count: count || 0 };
  }
}

module.exports = SupportTicketModel;
