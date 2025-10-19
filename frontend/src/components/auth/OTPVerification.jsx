import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';

const OTPVerification = ({ show, onHide, email, password, onSuccess, isSignup = false }) => {
  const navigate = useNavigate();
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (show && resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [show, resendTimer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Only reset local state
      setOtp('');
      setError('');
      setLoading(false);
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
    setLoading(true);
    
    try {
      const result = await authService.verifySignupOTP(email, otp, password);
      
      if (result.success) {
        setSuccess(true);
        if (onSuccess) {
          onSuccess(result);
        }
        
        // Store the temporary auth state
        sessionStorage.setItem('pendingProfile', JSON.stringify({
          email,
          password,
          tempToken: result.user.id // Using user ID as a temporary token
        }));
        
        // Close modal if needed
        if (onHide) onHide();
        
        // Navigate to profile creation
        navigate('/create-profile');
      } else {
        setError(result.message || 'OTP verification failed. Please try again.');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to verify OTP. Please try again.');
    } finally {
      setLoading(false);
    }
    setError('');

    // try {
    //   if (isSignup) {
    //     // For signup flow
    //     // const response = await authService.verifySignupOTP(email, otp, password);
    //     // if (response.success) {
    //     //   setSuccess(true);
          
    //     //   // Store credentials for later login after profile creation
    //     //   sessionStorage.setItem('pendingLogin', JSON.stringify({ email, password }));
          
    //     //   // Close modals and update UI
    //     //   if (onHide) onHide();
    //     //   if (onSuccess) onSuccess(response);
          
    //       // Always redirect to profile creation after successful signup
    //       navigate('/create-profile', { replace: true });
    //     } else {
    //       setError(response.message || 'Verification failed');
  //      }
  //     }
  //    catch (err) {
  //     setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
  //   } finally {
  //     setLoading(false);
  //   }
   };

  const handleResend = async () => {
    try {
      setLoading(true);
      if (isSignup) {
        await authService.sendSignupOTP(email);
      }
      setResendTimer(60);
      setOtp('');
      setError('');
    } catch (err) {
      setError('Failed to resend OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className={`modal fade ${show ? 'show d-block' : ''}`} tabIndex="-1" style={{ backgroundColor: show ? 'rgba(0,0,0,0.5)' : 'transparent' }}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-body text-center py-5">
              <i className="bi bi-check-circle text-success" style={{ fontSize: '5rem' }}></i>
              <h4 className="mt-3">Account Created Successfully!</h4>
              <p className="text-muted">Redirecting to login...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`modal fade ${show ? 'show d-block' : ''}`} tabIndex="-1" style={{ backgroundColor: show ? 'rgba(0,0,0,0.5)' : 'transparent' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header border-0">
            <h5 className="modal-title fw-bold">Verify OTP</h5>
            <button type="button" className="btn-close" onClick={onHide}></button>
          </div>
          
          <div className="modal-body text-center">
            <div className="mb-4">
              <i className="bi bi-shield-lock text-success" style={{ fontSize: '4rem' }}></i>
            </div>
            
            <p className="text-muted mb-4">
              We've sent a 6-digit verification code to<br />
              <strong>{email}</strong>
            </p>

            {error && (
              <div className="alert alert-danger" role="alert">
                <i className="bi bi-exclamation-triangle me-2"></i>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <input
                  type="text"
                  className={`form-control form-control-lg text-center ${error ? 'is-invalid' : ''}`}
                  value={otp}
                  onChange={handleChange}
                  placeholder="Enter 6-digit OTP"
                  maxLength="6"
                  style={{ letterSpacing: '0.5rem', fontSize: '1.5rem' }}
                  autoFocus
                />
              </div>

              <button
                type="submit"
                className="btn btn-success w-100 mb-3"
                disabled={loading || otp.length !== 6}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Verifying...
                  </>
                ) : (
                  'Verify OTP'
                )}
              </button>
            </form>

            <div className="text-muted">
              {resendTimer > 0 ? (
                <p>Resend OTP in {resendTimer}s</p>
              ) : (
                <button
                  className="btn btn-link text-decoration-none"
                  onClick={handleResend}
                  disabled={loading}
                >
                  Resend OTP
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OTPVerification;