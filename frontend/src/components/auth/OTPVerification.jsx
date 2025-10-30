import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';

const OTPVerification = ({ show, onHide, email, password, onSuccess, isSignup = false }) => {
  const navigate = useNavigate();
  const timeoutRef = useRef(null);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  // Separate loading states for verify and resend flows
  const [loadingVerify, setLoadingVerify] = useState(false);
  const [loadingResend, setLoadingResend] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (show && resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [show, resendTimer]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setOtp('');
      setError('');
      setLoadingVerify(false);
      setLoadingResend(false);
    };
  }, []);

  const handleChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(value);
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }
    
    setError('');
  setLoadingVerify(true);
    
    try {
      const result = await authService.verifySignupOTP(email, otp, password);
      
      if (result.success) {
        setSuccess(true);
        if (onSuccess) {
          onSuccess(result);
        }
        
        // sessionStorage.setItem('pendingProfile', JSON.stringify({
        //   email,
        //   tempToken: result.user.id
        // }));
        
        timeoutRef.current = setTimeout(() => {
          // navigate once, then close modal
          navigate('/create-profile');
          if (onHide) onHide();
        }, 1100);
      } else {
        setError(result?.message || 'OTP verification failed. Please try again.');
      }
    } catch (error) {
      console.log('OTP verification error:', error);
      setError(error.response?.data?.message || 'Failed to verify OTP. Please try again.');
    } finally {
      setLoadingVerify(false);
    }
  };

  const handleResend = async () => {
    try {
      setLoadingResend(true);
      if (isSignup) {
        await authService.sendSignupOTP(email);
      }
      setResendTimer(60);
      setOtp('');
      setError('');
    } catch (err) {
      setError('Failed to resend OTP. Please try again.');
    } finally {
      setLoadingResend(false);
    }
  };

  if (!show) return null;

  // Success State
  if (success) {
    return (
      <div 
        className="modal fade show d-block" 
        tabIndex="-1" 
        style={{ 
          backgroundColor: 'rgba(44, 95, 45, 0.4)',
          backdropFilter: 'blur(4px)'
        }}
      >
        <div className="modal-dialog modal-dialog-centered">
          <div 
            className="modal-content border-0 shadow-lg"
            style={{
              borderRadius: '20px',
              overflow: 'hidden',
              backgroundColor: '#FFFFFF'
            }}
          >
            <div className="modal-body text-center py-5 px-4">
              <div 
                className="mx-auto d-flex align-items-center justify-content-center mb-4"
                style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  backgroundColor: '#E8F5E9',
                  border: '5px solid #C8E6C9'
                }}
              >
                <i 
                  className="bi bi-check-circle-fill" 
                  style={{ 
                    fontSize: '4.5rem',
                    color: '#2C5F2D'
                  }}
                ></i>
              </div>
              
              <h4 
                className="fw-bold mb-3" 
                style={{ 
                  color: '#2C5F2D',
                  fontSize: '1.6rem'
                }}
              >
                Account Created Successfully!
              </h4>
              
              <p style={{ color: '#6B7B5F', fontSize: '1rem' }}>
                <span 
                  className="spinner-border spinner-border-sm me-2"
                  style={{ 
                    width: '1rem', 
                    height: '1rem',
                    color: '#97C97D'
                  }}
                ></span>
                Redirecting to profile setup...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // OTP Input State
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
                <i className="bi bi-shield-check me-2" style={{ color: '#97C97D' }}></i>
                Verify OTP
              </h5>
              <p className="mb-0" style={{ color: '#6B7B5F', fontSize: '0.9rem' }}>
                Enter the code sent to your email
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
          <div className="modal-body text-center" style={{ padding: '2rem' }}>
            {/* Shield Icon */}
            <div 
              className="mx-auto d-flex align-items-center justify-content-center mb-4"
              style={{
                width: '90px',
                height: '90px',
                borderRadius: '50%',
                backgroundColor: '#E8F5E9',
                border: '4px solid #C8E6C9'
              }}
            >
              <i 
                className="bi bi-shield-lock-fill" 
                style={{ 
                  fontSize: '3rem',
                  color: '#2C5F2D'
                }}
              ></i>
            </div>
            
            {/* Description */}
            <p 
              className="mb-4" 
              style={{ 
                color: '#6B7B5F',
                fontSize: '1rem',
                lineHeight: '1.6'
              }}
            >
              We've sent a 6-digit verification code to
            </p>
            
            <div 
              className="d-inline-block px-4 py-2 mb-4"
              style={{
                backgroundColor: '#F8F6F1',
                borderRadius: '10px',
                border: '2px solid #E5E7EB'
              }}
            >
              <strong style={{ color: '#2C5F2D', fontSize: '1rem' }}>{email}</strong>
            </div>

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
                <div className="fw-semibold text-start">{error}</div>
              </div>
            )}

            {/* OTP Form */}
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <input
                  type="text"
                  className="form-control form-control-lg text-center shadow-none"
                  value={otp}
                  onChange={handleChange}
                  placeholder="000000"
                  maxLength="6"
                  autoFocus
                  style={{ 
                    letterSpacing: '1rem', 
                    fontSize: '2rem',
                    fontWeight: '700',
                    color: '#2C5F2D',
                    backgroundColor: '#F8F6F1',
                    border: `3px solid ${error ? '#E85D75' : otp.length === 6 ? '#2C5F2D' : '#E5E7EB'}`,
                    borderRadius: '12px',
                    padding: '1rem',
                    transition: 'all 0.3s ease'
                  }}
                />
                <small 
                  className="d-block mt-2" 
                  style={{ 
                    color: '#6B7B5F',
                    fontSize: '0.85rem'
                  }}
                >
                  <i className="bi bi-info-circle-fill me-1"></i>
                  Enter the 6-digit code
                </small>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="btn w-100 fw-bold shadow-lg mb-3"
                disabled={loadingVerify || loadingResend || otp.length !== 6}
                style={{
                  backgroundColor: otp.length === 6 ? '#2C5F2D' : '#97C97D',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '1rem',
                  fontSize: '1.05rem',
                  transition: 'all 0.3s ease',
                  opacity: otp.length !== 6 ? 0.6 : 1,
                  cursor: otp.length !== 6 ? 'not-allowed' : 'pointer'
                }}
                onMouseEnter={(e) => {
                  if (!loadingVerify && !loadingResend && otp.length === 6) {
                    e.target.style.backgroundColor = '#1e4620';
                    e.target.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = otp.length === 6 ? '#2C5F2D' : '#97C97D';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                {loadingVerify ? (
                  <>
                    <span 
                      className="spinner-border spinner-border-sm me-2" 
                      role="status"
                      style={{ width: '1.2rem', height: '1.2rem' }}
                    ></span>
                    Verifying Code...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-circle-fill me-2"></i>
                    Verify OTP
                  </>
                )}
              </button>
            </form>

            {/* Resend OTP Section */}
            <div 
              className="pt-3"
              style={{ borderTop: '1px solid #E5E7EB' }}
            >
              {resendTimer > 0 ? (
                <p style={{ color: '#6B7B5F', fontSize: '0.95rem', marginBottom: '0' }}>
                  <i className="bi bi-clock-fill me-2" style={{ color: '#97C97D' }}></i>
                  Resend OTP in <strong style={{ color: '#2C5F2D' }}>{resendTimer}s</strong>
                </p>
              ) : (
                <div>
                  <p className="mb-2" style={{ color: '#6B7B5F', fontSize: '0.9rem' }}>
                    Didn't receive the code?
                  </p>
                  <button
                    type="button"
                    className="btn btn-link text-decoration-none fw-semibold"
                    onClick={handleResend}
                    disabled={loadingResend || loadingVerify}
                    style={{
                      color: '#2C5F2D',
                      fontSize: '1rem',
                      padding: '0.5rem 1rem'
                    }}
                  >
                    {loadingResend ? (
                      <>
                        <span 
                          className="spinner-border spinner-border-sm me-2" 
                          role="status" 
                          style={{ width: '1rem', height: '1rem' }}
                        ></span>
                        Resending OTP...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-arrow-clockwise me-2"></i>
                        Resend OTP
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Modal Footer */}
          <div 
            className="modal-footer border-0 justify-content-center"
            style={{
              backgroundColor: '#F8F6F1',
              padding: '1rem'
            }}
          >
            <small style={{ color: '#6B7B5F', fontWeight: '500' }}>
              <i className="bi bi-envelope-check-fill me-2" style={{ color: '#2C5F2D' }}></i>
              Check your email inbox and spam folder
            </small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OTPVerification;