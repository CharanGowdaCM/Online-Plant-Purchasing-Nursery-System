import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import authService from '../../services/authService';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Validate token exists
  if (!token) {
    return (
      <div 
        className="min-vh-100 d-flex align-items-center justify-content-center" 
        style={{ backgroundColor: '#F5F1E8' }}
      >
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-6 col-lg-5">
              <div 
                className="card border-0 shadow-lg" 
                style={{ 
                  borderRadius: '20px',
                  overflow: 'hidden'
                }}
              >
                <div 
                  className="card-body text-center p-5"
                  style={{ backgroundColor: '#FFFFFF' }}
                >
                  <div 
                    className="mb-4 mx-auto d-flex align-items-center justify-content-center"
                    style={{
                      width: '100px',
                      height: '100px',
                      borderRadius: '50%',
                      backgroundColor: '#FFF5F5'
                    }}
                  >
                    <i 
                      className="bi bi-exclamation-triangle" 
                      style={{ 
                        fontSize: '3rem',
                        color: '#E85D75'
                      }}
                    ></i>
                  </div>
                  <h3 
                    className="fw-bold mb-3" 
                    style={{ color: '#2C5F2D' }}
                  >
                    Invalid Reset Link
                  </h3>
                  <p 
                    className="mb-4" 
                    style={{ 
                      color: '#6B7B5F',
                      fontSize: '1.05rem',
                      lineHeight: '1.6'
                    }}
                  >
                    This password reset link is invalid or has expired. 
                    Please request a new password reset link.
                  </p>
                  <button 
                    className="btn fw-semibold shadow"
                    onClick={() => navigate('/')}
                    style={{
                      backgroundColor: '#2C5F2D',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '0.9rem 2rem',
                      fontSize: '1rem'
                    }}
                  >
                    <i className="bi bi-arrow-left me-2"></i>
                    Back to Home
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
    setMessage('');
  };

  const validatePasswords = () => {
    if (formData.newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }
    
    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    const hasUpperCase = /[A-Z]/.test(formData.newPassword);
    const hasLowerCase = /[a-z]/.test(formData.newPassword);
    const hasNumber = /[0-9]/.test(formData.newPassword);
    
    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      setError('Password must contain uppercase, lowercase, and numbers');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!validatePasswords()) {
      return;
    }

    try {
      setLoading(true);
      const response = await authService.resetPassword(
        token,
        formData.newPassword,
        formData.confirmPassword
      );

      if (response.success) {
        setMessage('Password reset successful! Redirecting to login...');
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        setError(response.message || 'Failed to reset password');
      }
    } catch (err) {
      console.error('Reset password error:', err);
      setError(
        err.response?.data?.message || 
        'Something went wrong! Please try again or request a new reset link.'
      );
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = () => {
    const password = formData.newPassword;
    if (password.length === 0) return { strength: '', color: '', percentage: 0 };
    
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 25;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 15;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 10;

    if (strength < 40) return { strength: 'Weak', color: '#E85D75', percentage: strength };
    if (strength < 70) return { strength: 'Medium', color: '#FFA726', percentage: strength };
    return { strength: 'Strong', color: '#2C5F2D', percentage: strength };
  };

  const passwordStrength = getPasswordStrength();

  return (
    <div 
      className="min-vh-100 d-flex align-items-center justify-content-center py-5" 
      style={{ 
        backgroundColor: '#F5F1E8',
        padding: '40px 20px'
      }}
    >
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-5">
            {/* Main Card */}
            <div 
              className="card border-0 shadow-lg mb-4" 
              style={{ 
                borderRadius: '20px',
                overflow: 'hidden'
              }}
            >
              {/* Card Header */}
              <div 
                className="text-center pt-5 pb-4"
                style={{ backgroundColor: '#FFFFFF' }}
              >
                <div 
                  className="mx-auto d-flex align-items-center justify-content-center mb-3"
                  style={{ 
                    width: '90px', 
                    height: '90px',
                    borderRadius: '50%',
                    backgroundColor: '#E8F5E9',
                    border: '4px solid #C8E6C9'
                  }}
                >
                  <i 
                    className="bi bi-key-fill" 
                    style={{ 
                      fontSize: '2.5rem',
                      color: '#2C5F2D'
                    }}
                  ></i>
                </div>
                <h3 
                  className="fw-bold mb-2" 
                  style={{ 
                    color: '#2C5F2D',
                    fontSize: '1.9rem'
                  }}
                >
                  Reset Password
                </h3>
                <p 
                  className="mb-0 px-4" 
                  style={{ 
                    color: '#6B7B5F',
                    fontSize: '1rem'
                  }}
                >
                  Enter your new password below to reset your account
                </p>
              </div>

              {/* Card Body */}
              <div 
                className="card-body p-4 p-md-5" 
                style={{ backgroundColor: '#FFFFFF' }}
              >
                {/* Success Message */}
                {message && (
                  <div 
                    className="alert border-0 d-flex align-items-center mb-4" 
                    role="alert"
                    style={{
                      backgroundColor: '#E8F5E9',
                      color: '#2C5F2D',
                      borderRadius: '12px',
                      padding: '1rem 1.25rem'
                    }}
                  >
                    <i className="bi bi-check-circle-fill me-3" style={{ fontSize: '1.3rem' }}></i>
                    <div className="fw-semibold">{message}</div>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div 
                    className="alert border-0 d-flex align-items-center mb-4" 
                    role="alert"
                    style={{
                      backgroundColor: '#FFF5F5',
                      color: '#E85D75',
                      borderRadius: '12px',
                      padding: '1rem 1.25rem'
                    }}
                  >
                    <i className="bi bi-exclamation-triangle-fill me-3" style={{ fontSize: '1.3rem' }}></i>
                    <div className="fw-semibold">{error}</div>
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  {/* New Password */}
                  <div className="mb-4">
                    <label 
                      className="form-label fw-semibold mb-2" 
                      style={{ color: '#2C5F2D', fontSize: '0.95rem' }}
                    >
                      New Password <span style={{ color: '#E85D75' }}>*</span>
                    </label>
                    <div 
                      className="input-group"
                      style={{
                        border: '2px solid #E5E7EB',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        backgroundColor: '#F8F6F1'
                      }}
                    >
                      <span 
                        className="input-group-text border-0"
                        style={{
                          backgroundColor: 'transparent',
                          color: '#6B7B5F'
                        }}
                      >
                        <i className="bi bi-lock-fill"></i>
                      </span>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="form-control border-0 shadow-none"
                        name="newPassword"
                        placeholder="Enter new password"
                        value={formData.newPassword}
                        onChange={handleInputChange}
                        required
                        disabled={loading}
                        style={{
                          backgroundColor: 'transparent',
                          color: '#2C5F2D',
                          padding: '0.75rem 0.5rem'
                        }}
                      />
                      <button
                        type="button"
                        className="btn border-0"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                          backgroundColor: 'transparent',
                          color: '#6B7B5F'
                        }}
                      >
                        <i className={`bi ${showPassword ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`}></i>
                      </button>
                    </div>
                    
                    {/* Password Strength Indicator */}
                    {formData.newPassword && (
                      <div className="mt-3">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <small style={{ color: '#6B7B5F', fontWeight: '500' }}>
                            Password strength:
                          </small>
                          <small style={{ color: passwordStrength.color, fontWeight: '700' }}>
                            {passwordStrength.strength}
                          </small>
                        </div>
                        <div 
                          className="position-relative" 
                          style={{ 
                            height: '8px',
                            backgroundColor: '#E5E7EB',
                            borderRadius: '10px',
                            overflow: 'hidden'
                          }}
                        >
                          <div 
                            style={{ 
                              width: `${passwordStrength.percentage}%`,
                              height: '100%',
                              backgroundColor: passwordStrength.color,
                              transition: 'all 0.3s ease',
                              borderRadius: '10px'
                            }}
                          ></div>
                        </div>
                      </div>
                    )}
                    
                    <small 
                      className="d-block mt-3" 
                      style={{ 
                        color: '#6B7B5F',
                        fontSize: '0.85rem'
                      }}
                    >
                      <i className="bi bi-info-circle-fill me-2"></i>
                      Must be at least 8 characters with uppercase, lowercase, and numbers
                    </small>
                  </div>

                  {/* Confirm Password */}
                  <div className="mb-4">
                    <label 
                      className="form-label fw-semibold mb-2" 
                      style={{ color: '#2C5F2D', fontSize: '0.95rem' }}
                    >
                      Confirm Password <span style={{ color: '#E85D75' }}>*</span>
                    </label>
                    <div 
                      className="input-group"
                      style={{
                        border: '2px solid #E5E7EB',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        backgroundColor: '#F8F6F1'
                      }}
                    >
                      <span 
                        className="input-group-text border-0"
                        style={{
                          backgroundColor: 'transparent',
                          color: '#6B7B5F'
                        }}
                      >
                        <i className="bi bi-shield-check"></i>
                      </span>
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        className="form-control border-0 shadow-none"
                        name="confirmPassword"
                        placeholder="Re-enter new password"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        required
                        disabled={loading}
                        style={{
                          backgroundColor: 'transparent',
                          color: '#2C5F2D',
                          padding: '0.75rem 0.5rem'
                        }}
                      />
                      <button
                        type="button"
                        className="btn border-0"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={{
                          backgroundColor: 'transparent',
                          color: '#6B7B5F'
                        }}
                      >
                        <i className={`bi ${showConfirmPassword ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`}></i>
                      </button>
                    </div>
                    
                    {/* Password Match Indicator */}
                    {formData.confirmPassword && (
                      <small 
                        className="d-block mt-3 fw-semibold" 
                        style={{
                          color: formData.newPassword === formData.confirmPassword 
                            ? '#2C5F2D' 
                            : '#E85D75'
                        }}
                      >
                        <i className={`bi ${
                          formData.newPassword === formData.confirmPassword 
                            ? 'bi-check-circle-fill' 
                            : 'bi-x-circle-fill'
                        } me-2`}></i>
                        {formData.newPassword === formData.confirmPassword 
                          ? 'Passwords match' 
                          : 'Passwords do not match'}
                      </small>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="btn w-100 fw-bold shadow-lg"
                    disabled={loading}
                    style={{
                      backgroundColor: '#2C5F2D',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '1rem',
                      fontSize: '1.05rem',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!loading) {
                        e.target.style.backgroundColor = '#1e4620';
                        e.target.style.transform = 'translateY(-2px)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = '#2C5F2D';
                      e.target.style.transform = 'translateY(0)';
                    }}
                  >
                    {loading ? (
                      <>
                        <span 
                          className="spinner-border spinner-border-sm me-2"
                          style={{ width: '1.2rem', height: '1.2rem' }}
                        ></span>
                        Resetting Password...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-circle-fill me-2"></i>
                        Reset Password
                      </>
                    )}
                  </button>
                </form>

                {/* Back to Login */}
                <div className="text-center mt-4 pt-4" style={{ borderTop: '1px solid #E5E7EB' }}>
                  <p className="mb-2" style={{ color: '#6B7B5F', fontSize: '0.95rem' }}>
                    Remembered your password?
                  </p>
                  <button 
                    className="btn btn-link text-decoration-none fw-semibold"
                    onClick={() => navigate('/')}
                    style={{
                      color: '#2C5F2D',
                      fontSize: '1rem'
                    }}
                  >
                    <i className="bi bi-arrow-left me-2"></i>
                    Back to Home & Login
                  </button>
                </div>
              </div>

              {/* Security Note */}
              <div 
                className="text-center py-3"
                style={{ 
                  backgroundColor: '#F8F6F1',
                  borderTop: '1px solid #E5E7EB'
                }}
              >
                <small style={{ color: '#6B7B5F', fontWeight: '500' }}>
                  <i className="bi bi-shield-lock-fill me-2" style={{ color: '#2C5F2D' }}></i>
                  Your password is encrypted and secure
                </small>
              </div>
            </div>

            {/* Tips Card */}
            <div 
              className="card border-0 shadow-sm"
              style={{
                borderRadius: '16px',
                backgroundColor: '#FFFFFF'
              }}
            >
              <div className="card-body p-4">
                <h6 
                  className="fw-bold mb-3 d-flex align-items-center" 
                  style={{ color: '#2C5F2D' }}
                >
                  <span 
                    className="d-flex align-items-center justify-content-center me-2"
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      backgroundColor: '#FFF9E6'
                    }}
                  >
                    <i className="bi bi-lightbulb-fill" style={{ color: '#FFA726' }}></i>
                  </span>
                  Password Tips
                </h6>
                <ul className="mb-0 ps-3" style={{ color: '#6B7B5F', fontSize: '0.9rem' }}>
                  <li className="mb-2">Use a mix of uppercase and lowercase letters</li>
                  <li className="mb-2">Include at least one number</li>
                  <li className="mb-2">Add special characters for extra security</li>
                  <li className="mb-2">Avoid using personal information</li>
                  <li className="mb-0">Make it at least 12 characters long</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;