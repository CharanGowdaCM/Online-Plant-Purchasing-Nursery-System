const supabase = require('../config/supabaseClient');

class SupportTicketModel {
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

  static async updateTicket(id, updates) {
    const { data, error } = await supabase
      .from('support_tickets')
      .update({ ...updates, updated_at: new Date() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getTicketsByUser(userId) {
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  static async getAllTickets() {
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }
}

module.exports = SupportTicketModel;
