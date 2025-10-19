import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import authService from '../services/authService';

const CreateProfile = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    permanent_address: '',
    mobile_number: '',
    delivery_addresses: []
  });

  // Get the stored signup data and validate
  useEffect(() => {
    const pendingProfile = sessionStorage.getItem('pendingProfile');
    if (!pendingProfile) {
      navigate('/');
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.first_name || !formData.last_name) {
      setError('First and last name are required');
      return false;
    }
    if (!formData.permanent_address) {
      setError('Permanent address is required');
      return false;
    }
    if (!formData.mobile_number) {
      setError('Mobile number is required');
      return false;
    }
    // Validate mobile number format (international format)
    const phoneRegex = /^\+?[1-9]\d{9,14}$/;
    if (!phoneRegex.test(formData.mobile_number)) {
      setError('Please enter a valid mobile number (e.g., +919876543210)');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      // Get stored credentials
      const pendingProfile = JSON.parse(sessionStorage.getItem('pendingProfile'));
      if (!pendingProfile) {
        throw new Error('No pending profile data found');
      }

      const { email, password } = pendingProfile;

      // Create profile
      const response = await api.post('/users/profile/create', {
        ...formData,
        email
      });

      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Failed to create profile');
      }

      // Direct login after profile creation
      const loginResponse = await login(email, password);
      if (loginResponse.success) {
        // Clear the pending profile data
        sessionStorage.removeItem('pendingProfile');
        
        // Redirect to landing page
        navigate('/');
      } else {
        throw new Error('Failed to log in after profile creation');
      }
    } catch (err) {
      console.error('Error creating profile:', err);
      setError(err.message || 'Failed to create profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          <div className="card shadow">
            <div className="card-body p-4">
              <h2 className="text-center mb-4">Create Your Profile</h2>
              
              {error && (
                <div className="alert alert-danger" role="alert">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label htmlFor="first_name" className="form-label">First Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      id="first_name"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="last_name" className="form-label">Last Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      id="last_name"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label htmlFor="middle_name" className="form-label">Middle Name (Optional)</label>
                  <input
                    type="text"
                    className="form-control"
                    id="middle_name"
                    name="middle_name"
                    value={formData.middle_name}
                    onChange={handleChange}
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="permanent_address" className="form-label">Permanent Address *</label>
                  <textarea
                    className="form-control"
                    id="permanent_address"
                    name="permanent_address"
                    value={formData.permanent_address}
                    onChange={handleChange}
                    rows="3"
                    required
                  ></textarea>
                </div>

                <div className="mb-4">
                  <label htmlFor="mobile_number" className="form-label">Mobile Number *</label>
                  <input
                    type="tel"
                    className="form-control"
                    id="mobile_number"
                    name="mobile_number"
                    value={formData.mobile_number}
                    onChange={handleChange}
                    placeholder="+919876543210"
                    required
                  />
                  <small className="text-muted">Format: +[country code][number], e.g., +919876543210</small>
                </div>

                <button
                  type="submit"
                  className="btn btn-success w-100"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Creating Profile...
                    </>
                  ) : (
                    'Create Profile'
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateProfile;