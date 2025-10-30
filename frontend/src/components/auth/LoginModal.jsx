import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import RegisterModal from './RegisterModal';
import ForgotPassword from './ForgotPassword';

const LoginModal = ({ show, onHide }) => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  window.showLastLoginToast = (data) => {
    const event = new CustomEvent('show-last-login-toast', { detail: data });
    window.dispatchEvent(event);
  };

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
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
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
      const response = await login(formData.email, formData.password);
      if (response.success) {
        if (response.user.previousLoginTime) {
          sessionStorage.setItem(
            'showLastLoginNotification',
            JSON.stringify({
              email: response.user.email,
              lastLogin: response.user.previousLoginTime,
              timestamp: Date.now()
            })
          );
        }

        const notificationData = {
          email: response.user.email,
          lastLogin: response.user.previousLoginTime,
          timestamp: Date.now()
        };

        if (window.showLastLoginToast) {
          window.showLastLoginToast(notificationData);
        }

        onHide();
        navigate('/');
      }
    } catch (error) {
      setErrors({ 
        submit: error.response?.data?.message || 'Login failed. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchToRegister = () => {
    onHide();
    setShowRegister(true);
  };

  const handleSwitchToForgotPassword = () => {
    onHide();
    setShowForgotPassword(true);
  };

  if (!show) return (
    <>
      <RegisterModal
        show={showRegister}
        onHide={() => setShowRegister(false)}
        onSwitchToLogin={() => {
          setShowRegister(false);
          onHide();
          setTimeout(() => onHide(), 100);
        }}
      />

      <ForgotPassword
        show={showForgotPassword}
        onHide={() => setShowForgotPassword(false)}
      />
    </>
  );

  return (
    <>
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
          className="modal-dialog modal-dialog-centered"
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
                  <i className="bi bi-box-arrow-in-right me-2" style={{ color: '#97C97D' }}></i>
                  Welcome Back
                </h5>
                <p className="mb-0" style={{ color: '#6B7B5F', fontSize: '0.9rem' }}>
                  Login to continue your plant journey
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
                    Email Address
                  </label>
                  <div 
                    className="input-group"
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
                <div className="mb-3">
                  <label 
                    htmlFor="password" 
                    className="form-label fw-semibold mb-2"
                    style={{ color: '#2C5F2D', fontSize: '0.95rem' }}
                  >
                    Password
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
                      placeholder="Enter your password"
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
                </div>

                {/* Forgot Password */}
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <button
                    type="button"
                    className="btn btn-link p-0 text-decoration-none fw-semibold"
                    onClick={handleSwitchToForgotPassword}
                    style={{
                      color: '#2C5F2D',
                      fontSize: '0.9rem'
                    }}
                  >
                    Forgot Password?
                  </button>
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
                      Logging in...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-box-arrow-in-right me-2"></i>
                      Login to Account
                    </>
                  )}
                </button>

                {/* Switch to Register */}
                <div 
                  className="text-center pt-3" 
                  style={{ borderTop: '1px solid #E5E7EB' }}
                >
                  <p className="mb-0" style={{ color: '#6B7B5F', fontSize: '0.95rem' }}>
                    Don't have an account?{' '}
                    <button
                      type="button"
                      className="btn btn-link p-0 text-decoration-none fw-semibold"
                      onClick={handleSwitchToRegister}
                      style={{ color: '#2C5F2D' }}
                    >
                      Register here
                    </button>
                  </p>
                </div>
              </form>
            </div>

            {/* Modal Footer - Security Badge */}
            <div 
              className="modal-footer border-0 justify-content-center"
              style={{
                backgroundColor: '#F8F6F1',
                padding: '1rem'
              }}
            >
              <small style={{ color: '#6B7B5F', fontWeight: '500' }}>
                <i className="bi bi-shield-lock-fill me-2" style={{ color: '#2C5F2D' }}></i>
                Secure login with encrypted connection
              </small>
            </div>
          </div>
        </div>
      </div>

      <RegisterModal
        show={showRegister}
        onHide={() => setShowRegister(false)}
        onSwitchToLogin={() => {
          setShowRegister(false);
          onHide();
          setTimeout(() => onHide(), 100);
        }}
      />

      <ForgotPassword
        show={showForgotPassword}
        onHide={() => setShowForgotPassword(false)}
      />
    </>
  );
};

export default LoginModal;