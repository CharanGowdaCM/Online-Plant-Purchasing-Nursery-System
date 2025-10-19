import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import RegisterModal from './RegisterModal';
import ForgotPassword from './ForgotPassword';

const LoginModal = ({ show, onHide }) => {
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

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
        onHide();
        window.location.reload(); // Refresh to update auth state
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

  return (
    <>
      <div
        className={`modal fade ${show ? 'show d-block' : ''}`}
        tabIndex="-1"
        style={{ backgroundColor: show ? 'rgba(0,0,0,0.5)' : 'transparent' }}
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header border-0">
              <h5 className="modal-title fw-bold">Login to Your Account</h5>
              <button type="button" className="btn-close" onClick={onHide}></button>
            </div>

            <div className="modal-body">
              {errors.submit && (
                <div className="alert alert-danger" role="alert">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  {errors.submit}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">Email Address</label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <i className="bi bi-envelope"></i>
                    </span>
                    <input
                      type="email"
                      className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Enter your email"
                    />
                  </div>
                  {errors.email && (
                    <div className="invalid-feedback d-block">{errors.email}</div>
                  )}
                </div>

                <div className="mb-3">
                  <label htmlFor="password" className="form-label">Password</label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <i className="bi bi-lock"></i>
                    </span>
                    <input
                      type="password"
                      className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Enter your password"
                    />
                  </div>
                  {errors.password && (
                    <div className="invalid-feedback d-block">{errors.password}</div>
                  )}
                </div>

                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="rememberMe"
                    />
                    <label className="form-check-label" htmlFor="rememberMe">
                      Remember me
                    </label>
                  </div>
                  <button
                    type="button"
                    className="btn btn-link p-0 text-decoration-none"
                    onClick={handleSwitchToForgotPassword}
                  >
                    Forgot Password?
                  </button>
                </div>

                <button
                  type="submit"
                  className="btn btn-success w-100"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                      ></span>
                      Logging in...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-box-arrow-in-right me-2"></i>
                      Login
                    </>
                  )}
                </button>
              </form>

              <div className="text-center mt-3">
                <p className="text-muted mb-0">
                  Don't have an account?{' '}
                  <button
                    className="btn btn-link p-0 text-decoration-none"
                    onClick={handleSwitchToRegister}
                  >
                    Register here
                  </button>
                </p>
              </div>
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