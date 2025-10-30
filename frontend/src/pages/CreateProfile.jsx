/**
 * Developer: K Akhilesh
 * Features: Create Profile, Multi-step Form, User Registration, Form Validation, 
 * API Integration, Session Management, Address Management, React Hooks, Navigation
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';


const CreateProfile = () => {
  const navigate = useNavigate();
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

    const phoneRegex = /^\+\d{1,3}\d{10}$/;
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
      const pendingProfile = JSON.parse(localStorage.getItem('user'));
      if (!pendingProfile) {
        throw new Error('No pending profile data found');
      }

      const { email } = pendingProfile;

      // Create profile
      // Build delivery addresses payload from structured inputs; filter empty rows
      const delivery_addresses_payload = (formData.delivery_addresses || []).filter(addr => {
        const { street = '', city = '', state = '', postalCode = '' } = addr || {};
        return [street, city, state, postalCode].some(v => (v || '').trim().length > 0);
      }).map(addr => ({
        street: (addr.street || '').trim(),
        city: (addr.city || '').trim(),
        state: (addr.state || '').trim(),
        postalCode: (addr.postalCode || '').trim()
      }));

      const response = await api.post('/users/profile/create', {
        ...formData,
        delivery_addresses: delivery_addresses_payload,
        email
      });

      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Failed to create profile');
      }
      // const loginResponse = await login(email, password);
      // if (loginResponse.success) {
      //   sessionStorage.removeItem('pendingProfile');
        navigate('/');
      // } else {
      //   throw new Error('Failed to log in after profile creation');
      // }
    } catch (err) {
      console.error('Error creating profile:', err);
      setError(err.message || 'Failed to create profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Single-page form: no step handling

  return (
    <div style={{ backgroundColor: '#FAFAE6', minHeight: '100vh', paddingTop: '2rem', paddingBottom: '2rem' }}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            {/* Header */}
            <div className="text-center mb-5">
              <div 
                className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
                style={{
                  width: '80px',
                  height: '80px',
                  background: 'linear-gradient(135deg, #2d5f3f 0%, #3a7d52 100%)',
                  color: '#fff',
                  fontSize: '2rem'
                }}
              >
                <i className="bi bi-person-plus"></i>
              </div>
              <h2 className="fw-bold mb-2" style={{ color: '#2d5f3f' }}>Complete Your Profile</h2>
              <p className="text-muted">Just a few more details to get started</p>
            </div>

            {/* Single-page form (no stepper) */}

            {/* Form Card */}
            <div className="card border-0 shadow-sm rounded-4">
              <div className="card-body p-5">
                {error && (
                  <div className="alert alert-danger rounded-3 d-flex align-items-center mb-4" role="alert">
                    <i className="bi bi-exclamation-triangle-fill me-2 fs-5"></i>
                    <div>{error}</div>
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div>
                    <h5 className="fw-bold mb-4" style={{ color: '#2d5f3f' }}>
                      <i className="bi bi-person-badge me-2"></i>
                      Personal Information
                    </h5>
                    <div className="row g-4">
                      <div className="col-md-6">
                        <label htmlFor="first_name" className="form-label fw-semibold" style={{ color: '#2d5f3f' }}>
                          First Name <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control form-control-lg rounded-3"
                          id="first_name"
                          name="first_name"
                          value={formData.first_name}
                          onChange={handleChange}
                          placeholder="Enter your first name"
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label htmlFor="last_name" className="form-label fw-semibold" style={{ color: '#2d5f3f' }}>
                          Last Name <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control form-control-lg rounded-3"
                          id="last_name"
                          name="last_name"
                          value={formData.last_name}
                          onChange={handleChange}
                          placeholder="Enter your last name"
                          required
                        />
                      </div>
                      <div className="col-12">
                        <label htmlFor="middle_name" className="form-label fw-semibold" style={{ color: '#2d5f3f' }}>
                          Middle Name <span className="text-muted small">(Optional)</span>
                        </label>
                        <input
                          type="text"
                          className="form-control form-control-lg rounded-3"
                          id="middle_name"
                          name="middle_name"
                          value={formData.middle_name}
                          onChange={handleChange}
                          placeholder="Enter your middle name"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-5">
                    <h5 className="fw-bold mb-4" style={{ color: '#2d5f3f' }}>
                      <i className="bi bi-telephone me-2"></i>
                      Contact & Address
                    </h5>
                    <div className="row g-4">
                      <div className="col-12">
                        <label htmlFor="mobile_number" className="form-label fw-semibold" style={{ color: '#2d5f3f' }}>
                          Mobile Number <span className="text-danger">*</span>
                        </label>
                        <input
                          type="tel"
                          className="form-control form-control-lg rounded-3"
                          id="mobile_number"
                          name="mobile_number"
                          value={formData.mobile_number}
                          onChange={handleChange}
                          placeholder="+91 9876543210"
                          required
                        />
                        <small className="text-muted d-flex align-items-center mt-2">
                          <i className="bi bi-info-circle me-1"></i>
                          Format: +[country code] [number], e.g., +91 9876543210
                        </small>
                      </div>
                      <div className="col-12">
                        <label htmlFor="permanent_address" className="form-label fw-semibold" style={{ color: '#2d5f3f' }}>
                          Permanent Address <span className="text-danger">*</span>
                        </label>
                        <textarea
                          className="form-control form-control-lg rounded-3"
                          id="permanent_address"
                          name="permanent_address"
                          value={formData.permanent_address}
                          onChange={handleChange}
                          rows="4"
                          placeholder="Enter your complete permanent address"
                          required
                        ></textarea>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5">
                    <h5 className="fw-bold mb-2" style={{ color: '#2d5f3f' }}>
                      <i className="bi bi-geo-alt me-2"></i>
                      Delivery Addresses
                    </h5>
                    <p className="text-muted mb-4">
                      Optional. Add one or more delivery addresses.
                    </p>

                    {(formData.delivery_addresses || []).length > 0 ? (
                      formData.delivery_addresses.map((addr, index) => (
                        <div key={index} className="card mb-3 border-0 shadow-sm rounded-3" style={{ backgroundColor: '#f8f9fa' }}>
                          <div className="card-body p-4">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                              <h6 className="mb-0 fw-bold" style={{ color: '#2d5f3f' }}>
                                <i className="bi bi-house-door me-2"></i>Address {index + 1}
                              </h6>
                              <button
                                type="button"
                                className="btn btn-danger btn-sm rounded-pill"
                                onClick={() => {
                                  const newAddresses = formData.delivery_addresses.filter((_, i) => i !== index);
                                  setFormData({ ...formData, delivery_addresses: newAddresses });
                                }}
                              >
                                <i className="bi bi-trash me-1"></i>Remove
                              </button>
                            </div>
                            <div className="row g-3">
                              <div className="col-12">
                                <input
                                  type="text"
                                  className="form-control rounded-3"
                                  placeholder="Street address"
                                  value={addr.street || ''}
                                  onChange={(e) => {
                                    const newAddresses = [...formData.delivery_addresses];
                                    newAddresses[index] = { ...newAddresses[index], street: e.target.value };
                                    setFormData({ ...formData, delivery_addresses: newAddresses });
                                  }}
                                />
                              </div>
                              <div className="col-md-6">
                                <input
                                  type="text"
                                  className="form-control rounded-3"
                                  placeholder="City"
                                  value={addr.city || ''}
                                  onChange={(e) => {
                                    const newAddresses = [...formData.delivery_addresses];
                                    newAddresses[index] = { ...newAddresses[index], city: e.target.value };
                                    setFormData({ ...formData, delivery_addresses: newAddresses });
                                  }}
                                />
                              </div>
                              <div className="col-md-3">
                                <input
                                  type="text"
                                  className="form-control rounded-3"
                                  placeholder="State"
                                  value={addr.state || ''}
                                  onChange={(e) => {
                                    const newAddresses = [...formData.delivery_addresses];
                                    newAddresses[index] = { ...newAddresses[index], state: e.target.value };
                                    setFormData({ ...formData, delivery_addresses: newAddresses });
                                  }}
                                />
                              </div>
                              <div className="col-md-3">
                                <input
                                  type="text"
                                  className="form-control rounded-3"
                                  placeholder="Pincode"
                                  value={addr.postalCode || ''}
                                  onChange={(e) => {
                                    const newAddresses = [...formData.delivery_addresses];
                                    newAddresses[index] = { ...newAddresses[index], postalCode: e.target.value };
                                    setFormData({ ...formData, delivery_addresses: newAddresses });
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="alert alert-info rounded-3 border-0" style={{ backgroundColor: '#e0f2fe' }}>
                        <i className="bi bi-info-circle me-2"></i>
                        No delivery addresses added yet. You can add them now or later from your profile.
                      </div>
                    )}

                    <button
                      type="button"
                      className="btn btn-outline-success rounded-pill px-4"
                      onClick={() => {
                        const newAddresses = [
                          ...(formData.delivery_addresses || []),
                          { street: '', city: '', state: '', postalCode: '' }
                        ];
                        setFormData({ ...formData, delivery_addresses: newAddresses });
                      }}
                    >
                      <i className="bi bi-plus-circle me-2"></i>Add Delivery Address
                    </button>
                  </div>

                  {/* Old step-based UI removed */}

                  {/* Navigation Buttons */}
                  {/* Submit Button */}
                  <div className="d-flex justify-content-end mt-5">
                    <button
                      type="submit"
                      className="btn btn-success btn-lg rounded-pill px-5"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Creating Profile...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-check-circle me-2"></i>
                          Create Profile
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Help Text */}
            <div className="text-center mt-4">
              <p className="text-muted small mb-0">
                <i className="bi bi-shield-check me-1"></i>
                Your information is secure and will be used only for order processing and communication.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateProfile;