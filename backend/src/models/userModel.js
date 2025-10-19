const supabase = require('../config/supabase');

class UserModel {
  static async getUserIdByEmail(email) {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // User not found
      throw error;
    }
    return data.id;
  }

  static async getProfileByUserId(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) throw error;
    return data;
  }

  static async saveProfile(userId, profileData) {
    // First check if user exists in users table
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();
    
    if (userError || !user) {
      throw new Error('User not found');
    }

    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('user_id', userId)
      .single();

    const profileFields = {
      first_name: profileData.first_name,
      middle_name: profileData.middle_name,
      last_name: profileData.last_name,
      permanent_address: profileData.permanent_address,
      mobile_number: profileData.mobile_number,
      delivery_addresses: profileData.delivery_addresses || [],
      updated_at: new Date().toISOString()
    };

    if (existingProfile) {
      const { error } = await supabase
        .from('profiles')
        .update(profileFields)
        .eq('user_id', userId);
      
      if (error) throw error;
      return 'updated';
    } else {
      const { error } = await supabase
        .from('profiles')
        .insert([{ ...profileFields, user_id: userId }]);
      
      if (error) throw error;
      return 'created';
    }
  }

  static async getUserDetailsById(userId) {
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, role, is_verified, is_active, created_at, last_login')
      .eq('id', userId)
      .single();

    if (userError) throw userError;

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    return { ...user, profile };
  }

  static async listUsers({ page, limit, role, is_active }) {
    const offset = (page - 1) * limit;

    let query = supabase
      .from('users')
      .select('id, email, role, is_verified, is_active, created_at, last_login', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (role) query = query.eq('role', role);
    if (is_active !== undefined) query = query.eq('is_active', is_active);

    const { data, error, count } = await query;
    if (error) throw error;

    return { users: data, count };
  }

  static async updateUserStatus(userId, isActive) {
    const { error } = await supabase
      .from('users')
      .update({ 
        is_active: isActive, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', userId);

    if (error) throw error;
  }

  static async updateUserRole(userId, role) {
    const { error } = await supabase
      .from('users')
      .update({ 
        role, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', userId);

    if (error) throw error;
  }

  static async getAnalytics(startDate, endDate) {
    const { data, error } = await supabase
      .rpc('get_user_analytics', {
        start_date: startDate,
        end_date: endDate
      });

    if (error) throw error;
    return data;
  }

  static async getStats() {
    const { data, error } = await supabase
      .from('users')
      .select('role', { count: 'exact' })
      .eq('is_active', true);

    if (error) throw error;
    return data;
  }

  static async requestEmailChange(userId, newEmail) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP

    // Store OTP and new email in a separate table or in-memory store
    const { error } = await supabase
      .from('email_change_requests')
      .upsert({ user_id: userId, new_email: newEmail, otp, expires_at: new Date(Date.now() + 10*60*1000).toISOString() }); // valid 10 mins

    if (error) throw error;
    return otp;
  }

  // Verify OTP and update email
  static async verifyEmailOTP(userId, otp) {
    const { data, error } = await supabase
      .from('email_change_requests')
      .select('*')
      .eq('user_id', userId)
      .eq('otp', otp)
      .single();

    if (error || !data) return false;

    // Check expiration
    if (new Date(data.expires_at) < new Date()) return false;

    // Update email
    const { error: updateError } = await supabase
      .from('users')
      .update({ email: data.new_email, updated_at: new Date().toISOString() })
      .eq('id', userId);
    if (updateError) throw updateError;

    // Delete the OTP entry
    await supabase.from('email_change_requests').delete().eq('user_id', userId);

    return true;
  }
}

module.exports = UserModel;