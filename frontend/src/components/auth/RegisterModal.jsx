import { useState } from 'react';
import authService from '../../services/authService';
import OTPVerification from './OTPVerification';

const RegisterModal = ({ show, onHide, onSwitchToLogin }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validate();
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      await authService.sendSignupOTP(formData.email, formData.password);
      setStep(2);
    } catch (error) {
      setErrors({ 
        submit: error.response?.data?.errors?.email ||  error.response?.data?.errors?.password || 'Failed to send OTP. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOTPSuccess = () => {
    // Leave navigation and modal closing to the OTPVerification component
    // so it can complete its redirect flow without being unmounted prematurely.
    // Do NOT change `step` here (that would unmount OTPVerification).
    // We'll clear the form data when the modal is actually hidden by OTP's
    // onHide (which calls the parent onHide passed below).
  };

  const getPasswordStrength = () => {
    const password = formData.password;
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

  if (step === 2) {
    return (
      <OTPVerification
        show={show}
        onHide={() => {
          setStep(1);
          onHide();
        }}
        email={formData.email}
        password={formData.password}
        onSuccess={handleOTPSuccess}
        isSignup={true}
      />
    );
  }

  if (!show) return null;

  return (
    <div 
      className="modal fade show d-block" 
      tabIndex="-1" 
      style={{ 
        backgroundColor: 'rgba(44, 95, 45, 0.4)',
        backdropFilter: 'blur(4px)'
      }}
      onClick={onHide}
    >
      <div 
        className="modal-dialog modal-dialog-centered modal-dialog-scrollable"
        onClick={(e) => e.stopPropagation()}
      >
        <div 
          className="modal-content border-0 shadow-lg"
          style={{
            borderRadius: '20px',
            overflow: 'hidden',
            backgroundColor: '#FFFFFF'
          }}
        >
          {/* Modal Header */}
          <div 
            className="modal-header border-0 pb-2"
            style={{
              backgroundColor: '#F8F6F1',
              padding: '1.5rem 2rem 1rem'
            }}
          >
            <div>
              <h5 
                className="modal-title fw-bold mb-1" 
                style={{ 
                  color: '#2C5F2D',
                  fontSize: '1.6rem'
                }}
              >
                <i className="bi bi-person-plus-fill me-2" style={{ color: '#97C97D' }}></i>
                Create Your Account
              </h5>
              <p className="mb-0" style={{ color: '#6B7B5F', fontSize: '0.9rem' }}>
                Join our plant community today
              </p>
            </div>
            <button 
              type="button" 
              className="btn-close" 
              onClick={onHide}
              style={{
                filter: 'brightness(0.7)'
              }}
            ></button>
          </div>
          
          {/* Modal Body */}
          <div className="modal-body" style={{ padding: '2rem' }}>
            {/* Error Message */}
            {errors.submit && (
              <div 
                className="alert border-0 d-flex align-items-start mb-4" 
                role="alert"
                style={{
                  backgroundColor: '#FFF5F5',
                  color: '#E85D75',
                  borderRadius: '12px',
                  padding: '1rem 1.25rem'
                }}
              >
                <i className="bi bi-exclamation-triangle-fill me-3 mt-1" style={{ fontSize: '1.2rem' }}></i>
                <div className="fw-semibold">{errors.submit}</div>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Email Field */}
              <div className="mb-4">
                <label 
                  htmlFor="email" 
                  className="form-label fw-semibold mb-2"
                  style={{ color: '#2C5F2D', fontSize: '0.95rem' }}
                >
                  Email Address <span style={{ color: '#E85D75' }}>*</span>
                </label>
                <div 
                  className={`input-group ${errors.email ? 'is-invalid' : ''}`}
                  style={{
                    border: `2px solid ${errors.email ? '#E85D75' : '#E5E7EB'}`,
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
                    <i className="bi bi-envelope-fill"></i>
                  </span>
                  <input
                    type="email"
                    className="form-control border-0 shadow-none"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    style={{
                      backgroundColor: 'transparent',
                      color: '#2C5F2D',
                      padding: '0.75rem 0.5rem'
                    }}
                  />
                </div>
                {errors.email && (
                  <div className="mt-2" style={{ color: '#E85D75', fontSize: '0.875rem', fontWeight: '500' }}>
                    <i className="bi bi-x-circle-fill me-1"></i>
                    {errors.email}
                  </div>
                )}
              </div>

              {/* Password Field */}
              <div className="mb-4">
                <label 
                  htmlFor="password" 
                  className="form-label fw-semibold mb-2"
                  style={{ color: '#2C5F2D', fontSize: '0.95rem' }}
                >
                  Password <span style={{ color: '#E85D75' }}>*</span>
                </label>
                <div 
                  className="input-group"
                  style={{
                    border: `2px solid ${errors.password ? '#E85D75' : '#E5E7EB'}`,
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
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="At least 8 characters"
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
                {errors.password && (
                  <div className="mt-2" style={{ color: '#E85D75', fontSize: '0.875rem', fontWeight: '500' }}>
                    <i className="bi bi-x-circle-fill me-1"></i>
                    {errors.password}
                  </div>
                )}
                
                {/* Password Strength Indicator */}
                {formData.password && (
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
                  className="d-block mt-2" 
                  style={{ 
                    color: '#6B7B5F',
                    fontSize: '0.85rem'
                  }}
                >
                  <i className="bi bi-info-circle-fill me-2"></i>
                  Must be at least 8 characters with uppercase, lowercase, and numbers
                </small>
              </div>

              {/* Confirm Password Field */}
              <div className="mb-4">
                <label 
                  htmlFor="confirmPassword" 
                  className="form-label fw-semibold mb-2"
                  style={{ color: '#2C5F2D', fontSize: '0.95rem' }}
                >
                  Confirm Password <span style={{ color: '#E85D75' }}>*</span>
                </label>
                <div 
                  className="input-group"
                  style={{
                    border: `2px solid ${errors.confirmPassword ? '#E85D75' : '#E5E7EB'}`,
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
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-enter your password"
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
                {errors.confirmPassword && (
                  <div className="mt-2" style={{ color: '#E85D75', fontSize: '0.875rem', fontWeight: '500' }}>
                    <i className="bi bi-x-circle-fill me-1"></i>
                    {errors.confirmPassword}
                  </div>
                )}
                
                {/* Password Match Indicator */}
                {formData.confirmPassword && formData.password && (
                  <small 
                    className="d-block mt-2 fw-semibold" 
                    style={{
                      color: formData.password === formData.confirmPassword 
                        ? '#2C5F2D' 
                        : '#E85D75'
                    }}
                  >
                    <i className={`bi ${
                      formData.password === formData.confirmPassword 
                        ? 'bi-check-circle-fill' 
                        : 'bi-x-circle-fill'
                    } me-2`}></i>
                    {formData.password === formData.confirmPassword 
                      ? 'Passwords match' 
                      : 'Passwords do not match'}
                  </small>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="btn w-100 fw-bold shadow-lg mb-3"
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
                      role="status"
                      style={{ width: '1.2rem', height: '1.2rem' }}
                    ></span>
                    Sending OTP...
                  </>
                ) : (
                  <>
                    <i className="bi bi-arrow-right-circle-fill me-2"></i>
                    Continue to Verification
                  </>
                )}
              </button>

              {/* Switch to Login */}
              <div 
                className="text-center pt-3" 
                style={{ borderTop: '1px solid #E5E7EB' }}
              >
                <p className="mb-0" style={{ color: '#6B7B5F', fontSize: '0.95rem' }}>
                  Already have an account?{' '}
                  <button
                    type="button"
                    className="btn btn-link p-0 text-decoration-none fw-semibold"
                    onClick={onSwitchToLogin}
                    style={{ color: '#2C5F2D' }}
                  >
                    Login here
                  </button>
                </p>
              </div>
            </form>
          </div>

          {/* Modal Footer - Info */}
          <div 
            className="modal-footer border-0 justify-content-center"
            style={{
              backgroundColor: '#F8F6F1',
              padding: '1rem'
            }}
          >
            <small style={{ color: '#6B7B5F', fontWeight: '500' }}>
              <i className="bi bi-shield-lock-fill me-2" style={{ color: '#2C5F2D' }}></i>
              Your information is secure and encrypted
            </small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterModal;