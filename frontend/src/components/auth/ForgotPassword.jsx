import { useState } from 'react';
import authService from '../../services/authService';

const ForgotPassword = ({ show, onHide }) => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [resetData, setResetData] = useState({ token: '', newPassword: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setError('Email is required');
      return;
    }
    
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      await authService.forgotPassword(email);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setEmail('');
    setResetData({ token: '', newPassword: '', confirmPassword: '' });
    setError('');
    setSuccess(false);
    onHide();
  };

  if (!show) return null;

  return (
    <div 
      className="modal fade show d-block" 
      tabIndex="-1" 
      style={{ 
        backgroundColor: 'rgba(44, 95, 45, 0.4)',
        backdropFilter: 'blur(4px)'
      }}
      onClick={handleClose}
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
                <i className="bi bi-key-fill me-2" style={{ color: '#97C97D' }}></i>
                Reset Password
              </h5>
              <p className="mb-0" style={{ color: '#6B7B5F', fontSize: '0.9rem' }}>
                {success ? 'Check your email inbox' : 'We\'ll send you a reset link'}
              </p>
            </div>
            <button 
              type="button" 
              className="btn-close" 
              onClick={handleClose}
              style={{
                filter: 'brightness(0.7)'
              }}
            ></button>
          </div>
          
          {/* Modal Body */}
          <div className="modal-body" style={{ padding: '2rem' }}>
            {success ? (
              // Success State
              <div className="text-center py-4">
                <div 
                  className="mx-auto d-flex align-items-center justify-content-center mb-4"
                  style={{
                    width: '100px',
                    height: '100px',
                    borderRadius: '50%',
                    backgroundColor: '#E8F5E9',
                    border: '4px solid #C8E6C9'
                  }}
                >
                  <i 
                    className="bi bi-check-circle-fill" 
                    style={{ 
                      fontSize: '3.5rem',
                      color: '#2C5F2D'
                    }}
                  ></i>
                </div>
                
                <h5 
                  className="fw-bold mb-3" 
                  style={{ color: '#2C5F2D', fontSize: '1.4rem' }}
                >
                  Check Your Email
                </h5>
                
                <p style={{ color: '#6B7B5F', fontSize: '1rem', lineHeight: '1.6' }}>
                  We've sent a password reset link to
                </p>
                
                <div 
                  className="d-inline-block px-4 py-2 mb-3"
                  style={{
                    backgroundColor: '#F8F6F1',
                    borderRadius: '10px',
                    border: '2px solid #E5E7EB'
                  }}
                >
                  <strong style={{ color: '#2C5F2D', fontSize: '1rem' }}>{email}</strong>
                </div>
                
                <div 
                  className="alert border-0 mt-4 mb-4"
                  style={{
                    backgroundColor: '#FFF9E6',
                    color: '#8B6914',
                    borderRadius: '12px',
                    padding: '1rem'
                  }}
                >
                  <i className="bi bi-info-circle-fill me-2"></i>
                  <small className="fw-semibold">
                    The link will expire in 10 minutes. Please check your spam folder if you don't see it.
                  </small>
                </div>
                
                <button 
                  className="btn fw-bold shadow-lg" 
                  onClick={handleClose}
                  style={{
                    backgroundColor: '#2C5F2D',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '0.9rem 2.5rem',
                    fontSize: '1rem',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#1e4620';
                    e.target.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#2C5F2D';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  <i className="bi bi-check-lg me-2"></i>
                  Got It, Close
                </button>
              </div>
            ) : (
              // Email Input Form
              <>
                <p 
                  className="mb-4" 
                  style={{ 
                    color: '#6B7B5F',
                    fontSize: '1rem',
                    lineHeight: '1.6'
                  }}
                >
                  <i className="bi bi-envelope-paper-fill me-2" style={{ color: '#97C97D' }}></i>
                  Enter your email address and we'll send you a link to reset your password.
                </p>

                {/* Error Message */}
                {error && (
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
                    <div className="fw-semibold">{error}</div>
                  </div>
                )}

                <form onSubmit={handleEmailSubmit}>
                  {/* Email Field */}
                  <div className="mb-4">
                    <label 
                      htmlFor="resetEmail" 
                      className="form-label fw-semibold mb-2"
                      style={{ color: '#2C5F2D', fontSize: '0.95rem' }}
                    >
                      Email Address <span style={{ color: '#E85D75' }}>*</span>
                    </label>
                    <div 
                      className="input-group"
                      style={{
                        border: `2px solid ${error ? '#E85D75' : '#E5E7EB'}`,
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
                        id="resetEmail"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setError('');
                        }}
                        placeholder="Enter your registered email"
                        style={{
                          backgroundColor: 'transparent',
                          color: '#2C5F2D',
                          padding: '0.75rem 0.5rem'
                        }}
                      />
                    </div>
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
                          role="status"
                          style={{ width: '1.2rem', height: '1.2rem' }}
                        ></span>
                        Sending Reset Link...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-send-fill me-2"></i>
                        Send Reset Link
                      </>
                    )}
                  </button>
                </form>

                {/* Help Text */}
                <div 
                  className="text-center mt-4 pt-3"
                  style={{ borderTop: '1px solid #E5E7EB' }}
                >
                  <small style={{ color: '#6B7B5F', fontSize: '0.9rem' }}>
                    <i className="bi bi-shield-lock-fill me-2" style={{ color: '#2C5F2D' }}></i>
                    This is a secure process. We'll never share your email.
                  </small>
                </div>
              </>
            )}
          </div>

          {/* Modal Footer - Only show when not success */}
          {!success && (
            <div 
              className="modal-footer border-0 justify-content-center"
              style={{
                backgroundColor: '#F8F6F1',
                padding: '1rem'
              }}
            >
              <small style={{ color: '#6B7B5F', fontWeight: '500' }}>
                <i className="bi bi-clock-fill me-2" style={{ color: '#97C97D' }}></i>
                Reset link expires in 10 minutes
              </small>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;