import { useState } from 'react';
import authService from '../../services/authService';

const ForgotPassword = ({ show, onHide }) => {
  const [step, setStep] = useState(1); // 1: Email, 2: Reset Form
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

  return (
    <div className={`modal fade ${show ? 'show d-block' : ''}`} tabIndex="-1" style={{ backgroundColor: show ? 'rgba(0,0,0,0.5)' : 'transparent' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header border-0">
            <h5 className="modal-title fw-bold">Reset Password</h5>
            <button type="button" className="btn-close" onClick={handleClose}></button>
          </div>
          
          <div className="modal-body">
            {success ? (
              <div className="text-center py-4">
                <i className="bi bi-check-circle text-success" style={{ fontSize: '4rem' }}></i>
                <h5 className="mt-3">Check Your Email</h5>
                <p className="text-muted">
                  We've sent a password reset link to <strong>{email}</strong>
                </p>
                <p className="text-muted small">
                  The link will expire in 10 minutes. Please check your spam folder if you don't see it.
                </p>
                <button className="btn btn-success mt-3" onClick={handleClose}>
                  Close
                </button>
              </div>
            ) : (
              <>
                <p className="text-muted mb-4">
                  Enter your email address and we'll send you a link to reset your password.
                </p>

                {error && (
                  <div className="alert alert-danger" role="alert">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    {error}
                  </div>
                )}

                <form onSubmit={handleEmailSubmit}>
                  <div className="mb-3">
                    <label htmlFor="resetEmail" className="form-label">Email Address</label>
                    <div className="input-group">
                      <span className="input-group-text">
                        <i className="bi bi-envelope"></i>
                      </span>
                      <input
                        type="email"
                        className={`form-control ${error ? 'is-invalid' : ''}`}
                        id="resetEmail"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setError('');
                        }}
                        placeholder="Enter your email"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-success w-100"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Sending...
                      </>
                    ) : (
                      'Send Reset Link'
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;