// models/authModel.js
const supabase = require("../config/supabase");


class AuthModel {
  /**
   * Find user by email
   * @param {string} email - User email
   * @returns {Promise<Object|null>} User object or null
   */
  static async findUserByEmail(email) {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("email", email)
        .single();

      if (error) {
        // Return null if user not found (not an error case)
        if (error.code === "PGRST116") {
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error("Error in findUserByEmail:", error);
      throw new Error(`Database error: ${error.message}`);
    }
  }

  
  static async userExists(email) {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("email")
        .eq("email", email)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      return !!data;
    } catch (error) {
      console.error("Error in userExists:", error);
      throw new Error(`Database error: ${error.message}`);
    }
  }

   static async createUser(userData) {
    try {
       console.log("done21");
      const { data, error } = await supabase
        .from("users")
        .insert([{
          email: userData.email,
          password_hash: userData.password_hash,
          is_verified: userData.is_verified || true,
          role: userData.role || "customer",
          is_active: true
        }])
        .select()
        .single();
         console.log("done22");
      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error("Error in createUser:", error);
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }

  
  static async updateLastLogin(userId) {
    try {
      const { error } = await supabase
        .from("users")
        .update({ last_login: new Date().toISOString() })
        .eq("id", userId);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error("Error in updateLastLogin:", error);
      throw new Error(`Failed to update last login: ${error.message}`);
    }
  }

  
  static async updatePassword(email, passwordHash) {
    try {
      const { error } = await supabase
        .from("users")
        .update({ password_hash: passwordHash })
        .eq("email", email);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error("Error in updatePassword:", error);
      throw new Error(`Failed to update password: ${error.message}`);
    }
  }

 
  static async findOTPByEmail(email) {
    try {
       console.log("done11");
      const { data, error } = await supabase
        .from("otps")
        .select("*")
        .eq("email", email)
        .single();
       console.log("done12");
      if (error) {
        if (error.code === "PGRST116") {
           console.log("done13");
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error("Error in findOTPByEmail:", error);
      throw new Error(`Database error: ${error.message}`);
    }
  }

 
  static async createOTP(email, otp, expiresAt) {
    try {
      // Delete existing OTP first
      await this.deleteOTP(email);

      // Insert new OTP
      const { error } = await supabase
        .from("otps")
        .insert([{ 
          email, 
          otp, 
          expires_at: expiresAt.toISOString(),
          attempts: 0 
        }]);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error("Error in createOTP:", error);
      throw new Error(`Failed to create OTP: ${error.message}`);
    }
  }

  static async deleteOTP(email) {
    try {
      const { error } = await supabase
        .from("otps")
        .delete()
        .eq("email", email);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error("Error in deleteOTP:", error);
      throw new Error(`Failed to delete OTP: ${error.message}`);
    }
  }

  static async incrementOTPAttempts(email, currentAttempts) {
    try {
      const { error } = await supabase
        .from("otps")
        .update({ attempts: currentAttempts + 1 })
        .eq("email", email);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error("Error in incrementOTPAttempts:", error);
      throw new Error(`Failed to increment OTP attempts: ${error.message}`);
    }
  }

  static async findPasswordResetToken(token) {
    try {
      const { data, error } = await supabase
        .from("password_resets")
        .select("*")
        .eq("token", token)
        .is("used_at", null)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error("Error in findPasswordResetToken:", error);
      throw new Error(`Database error: ${error.message}`);
    }
  }

  static async createPasswordResetToken(email, token, expiresAt) {
    try {
      // Delete any existing reset tokens for this email
      await this.deletePasswordResetToken(email);

      // Insert new reset token
      const { error } = await supabase
        .from("password_resets")
        .insert([{ 
          email, 
          token, 
          expires_at: expiresAt.toISOString() 
        }]);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error("Error in createPasswordResetToken:", error);
      throw new Error(`Failed to create password reset token: ${error.message}`);
    }
  }

  
  static async markPasswordResetTokenAsUsed(token) {
    try {
      const { error } = await supabase
        .from("password_resets")
        .update({ used_at: new Date().toISOString() })
        .eq("token", token);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error("Error in markPasswordResetTokenAsUsed:", error);
      throw new Error(`Failed to mark token as used: ${error.message}`);
    }
  }

  static async deletePasswordResetToken(email) {
    try {
      const { error } = await supabase
        .from("password_resets")
        .delete()
        .eq("email", email);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error("Error in deletePasswordResetToken:", error);
      throw new Error(`Failed to delete password reset token: ${error.message}`);
    }
  }

  static async createAdmin({ email, password_hash, role }) {
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          email,
          password_hash,
          role,
          is_verified: true, // Admins are pre-verified
          is_active: true
        }
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getUsersByRole(role) {
    const { data, error } = await supabase
      .from('users')
      .select('*, profiles(*)')
      .eq('role', role);

    if (error) throw error;
    return data;
  }

  static async updateUserRole(userId, newRole) {
    const { error } = await supabase
      .from('users')
      .update({ role: newRole })
      .eq('id', userId);

    if (error) throw error;
  }

  static async getAdminsByRole(role) {
    const { data, error } = await supabase
      .from('users')
      .select('email')
      .eq('role', role)
      .eq('is_active', true);

    if (error) throw error;
    return data;
  }
}

module.exports = AuthModel;