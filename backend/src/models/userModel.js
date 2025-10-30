/*
 user Model - Handles user data and profiles
 Author: Akhilesh K
 Features: User profile management, user listing, status updates, role management
*/
const supabase = require('../config/supabase');

class UserModel {
  static async getUserIdByEmail(email) {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; 
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
      .maybeSingle();

    return { ...user, profile };
  }

  static async listUsers({ page = 1, limit = 10, role, is_active }) {
  const offset = (page - 1) * limit;

 const { data, error, count } = await supabase
    .from('users')
    .select('*', { count: 'exact' });
console.log(data, error);


  if (error) throw error;

  console.log('Fetched users:', data);

  return { users: data ?? [], count: count ?? 0 };
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
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); 

    const { error } = await supabase
      .from('email_change_requests')
      .upsert({ user_id: userId, new_email: newEmail, otp, expires_at: new Date(Date.now() + 10*60*1000).toISOString() }); // valid 10 mins

    if (error) throw error;
    return otp;
  }

  static async verifyEmailOTP(userId, otp) {
    const { data, error } = await supabase
      .from('email_change_requests')
      .select('*')
      .eq('user_id', userId)
      .eq('otp', otp)
      .single();

    if (error || !data) return false;

    if (new Date(data.expires_at) < new Date()) return false;

    const { error: updateError } = await supabase
      .from('users')
      .update({ email: data.new_email, updated_at: new Date().toISOString() })
      .eq('id', userId);
    if (updateError) throw updateError;

    await supabase.from('email_change_requests').delete().eq('user_id', userId);

    return true;
  }
}

module.exports = UserModel;