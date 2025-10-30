// Developer: Charan Gowda C M
// Features: useState, useEffect, ProductGrid, productService, fetchCategories, fetchProducts, 
// filters, search, category, priceRange, careLevel, loading, error, handleFilterChange, 
// setProducts, setCategories, minPrice, maxPrice, Debounce, params, API call, 
// dynamic filtering, responsive UI, styled JSX, category normalization, error handling, 
// conditional rendering, data mapping, frontend logic



import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import profileService from '../services/profileService';
import OrderServiceUser from '../services/orderServiceUser';
import reviewService from '../services/reviewService';
import authService from '../services/authService';

const UserProfile = () => {
  const { user, updateUserProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  // Profile data
  const [profileData, setProfileData] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    mobile_number: '',
    permanent_address: ''
  });

  // Orders data
  const [orders, setOrders] = useState([]);

  // Reviews data
  const [reviews, setReviews] = useState([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);

  // Email change data
  const [showEmailChangeModal, setShowEmailChangeModal] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailOTP, setEmailOTP] = useState('');
  const [emailChangeMessage, setEmailChangeMessage] = useState('');

  // Password reset
  const [resetPasswordMessage, setResetPasswordMessage] = useState('');

  useEffect(() => {
    if (activeTab === 'profile') fetchProfile();
    else if (activeTab === 'orders') fetchOrders();
    else if (activeTab === 'reviews') fetchReviews();
  }, [activeTab]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await profileService.getProfile();
      setProfileData(response.profile);
      setFormData({
        first_name: response.profile?.first_name || '',
        middle_name: response.profile?.middle_name || '',
        last_name: response.profile?.last_name || '',
        mobile_number: response.profile?.mobile_number || '',
        permanent_address: response.profile?.permanent_address || '',
        delivery_addresses: response.profile?.delivery_addresses || []
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await profileService.updateProfile(formData);
      updateUserProfile(formData);
      setEditMode(false);
      fetchProfile();
      alert('Profile updated successfully!');
    } catch (err) {
      alert('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await OrderServiceUser.getUserOrders();
      setOrders(response.data || []);
      console.log(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await reviewService.getMyReviews();
      setReviews(response.reviews || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle password reset request
  const handlePasswordReset = async () => {
    try {
      setLoading(true);
      const response = await authService.forgotPassword(user.email);
      setResetPasswordMessage(response.message || 'Password reset link has been sent to your email.');
      setTimeout(() => setResetPasswordMessage(''), 5000);
    } catch (err) {
      setResetPasswordMessage(err.response?.data?.message || 'Failed to send password reset email.');
      setTimeout(() => setResetPasswordMessage(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  // Handle email change request
  const handleRequestEmailChange = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setEmailChangeMessage('');
      const response = await profileService.requestEmailChange(newEmail);
      setEmailChangeMessage(response.message || 'OTP has been sent to your new email address.');
      setShowEmailChangeModal(false);
      setShowOTPModal(true);
    } catch (err) {
      setEmailChangeMessage(err.response?.data?.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP verification for email change
  const handleVerifyEmailOTP = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await profileService.verifyEmailOTP(newEmail, emailOTP);
      setEmailChangeMessage(response.message || 'Email changed successfully! Please login again.');
      setShowOTPModal(false);
      setNewEmail('');
      setEmailOTP('');
      
      // Logout user after email change
      setTimeout(async () => {
        await authService.logout();
        navigate('/');
      }, 2000);
    } catch (err) {
      setEmailChangeMessage(err.response?.data?.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      pending: { bg: '#FEF3C7', color: '#92400E', icon: 'bi-clock' },
      confirmed: { bg: '#DBEAFE', color: '#1E40AF', icon: 'bi-check-circle' },
      processing: { bg: '#E0E7FF', color: '#4338CA', icon: 'bi-arrow-repeat' },
      shipped: { bg: '#DBEAFE', color: '#1E3A8A', icon: 'bi-truck' },
      delivered: { bg: '#D1FAE5', color: '#065F46', icon: 'bi-check-circle-fill' },
      cancelled: { bg: '#FEE2E2', color: '#991B1B', icon: 'bi-x-circle' }
    };
    const style = statusStyles[status] || statusStyles.pending;
    return (
      <span style={{
        backgroundColor: style.bg,
        color: style.color,
        padding: '0.4rem 0.8rem',
        borderRadius: '8px',
        fontSize: '0.85rem',
        fontWeight: '600',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.3rem'
      }}>
        <i className={style.icon}></i>
        {status.toUpperCase()}
      </span>
    );
  };

  const handleReviewClick = (review) => {
    setSelectedReview(review);
    setShowReviewModal(true);
  };

  const handleCloseReviewModal = () => {
    setShowReviewModal(false);
    setSelectedReview(null);
  };

  const renderStars = (rating) => {
    return (
      <div className="d-flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <i
            key={star}
            className={`bi bi-star${star <= rating ? '-fill' : ''}`}
            style={{ 
              fontSize: '1.1rem',
              color: star <= rating ? '#FDB022' : '#E5E7EB'
            }}
          ></i>
        ))}
      </div>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading && !profileData && !orders.length && !reviews.length) {
    return (
      <div 
        className="min-vh-100 d-flex align-items-center justify-content-center" 
        style={{ backgroundColor: '#F5F1E8' }}
      >
        <div className="text-center">
          <div 
            className="spinner-border mb-3" 
            role="status" 
            style={{ 
              width: '4rem', 
              height: '4rem',
              color: '#2C5F2D',
              borderWidth: '0.3rem'
            }}
          >
            <span className="visually-hidden">Loading...</span>
          </div>
          <p style={{ 
            color: '#2C5F2D', 
            fontWeight: '600', 
            fontSize: '1.1rem' 
          }}>
            Loading your profile...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-vh-100" 
      style={{ backgroundColor: '#F5F1E8', paddingBottom: '3rem' }}
    >
      <div className="container py-5" style={{ maxWidth: '1400px' }}>
        {/* Header */}
        <div className="mb-5">
          <h1 
            className="fw-bold mb-2" 
            style={{ 
              color: '#2C5F2D',
              fontSize: '2.5rem',
              letterSpacing: '-0.5px'
            }}
          >
            <i className="bi bi-person-circle me-3" style={{ color: '#97C97D' }}></i>
            My Account
          </h1>
          <p style={{ 
            color: '#6B7B5F', 
            fontSize: '1.1rem',
            marginLeft: '3.5rem'
          }}>
            Manage your profile, orders, and reviews
          </p>
        </div>

        <div className="row g-4">
          {/* Sidebar */}
          <div className="col-lg-3">
            <div 
              className="card border-0 shadow-sm mb-4" 
              style={{ 
                borderRadius: '16px',
                backgroundColor: '#FFFFFF',
                overflow: 'hidden'
              }}
            >
              <div 
                className="card-body text-center p-4"
                style={{ backgroundColor: '#2C5F2D' }}
              >
                <div 
                  className="rounded-circle mx-auto d-flex align-items-center justify-content-center mb-3"
                  style={{ 
                    width: '90px', 
                    height: '90px', 
                    fontSize: '2.5rem',
                    backgroundColor: '#97C97D',
                    color: '#2C5F2D',
                    fontWeight: '700',
                    border: '4px solid #FFFFFF'
                  }}
                >
                  {user?.first_name?.[0] || 'U'}
                </div>
                <h5 className="mb-2" style={{ color: '#FFFFFF', fontWeight: '600' }}>
                  {user?.first_name} {user?.last_name}
                </h5>
                <p className="mb-0" style={{ color: '#E5E7EB', fontSize: '0.9rem' }}>
                  {user?.email}
                </p>
              </div>
            </div>

            <div 
              className="card border-0 shadow-sm" 
              style={{ 
                borderRadius: '16px',
                backgroundColor: '#FFFFFF',
                overflow: 'hidden'
              }}
            >
              <div className="list-group list-group-flush">
                <button
                  className={`list-group-item list-group-item-action border-0 ${activeTab === 'profile' ? '' : ''}`}
                  onClick={() => setActiveTab('profile')}
                  style={{
                    backgroundColor: activeTab === 'profile' ? '#2C5F2D' : 'transparent',
                    color: activeTab === 'profile' ? '#FFFFFF' : '#2C5F2D',
                    padding: '1rem 1.5rem',
                    fontWeight: '600',
                    fontSize: '1rem',
                    transition: 'all 0.3s ease',
                    borderLeft: activeTab === 'profile' ? '4px solid #97C97D' : '4px solid transparent'
                  }}
                  onMouseEnter={(e) => {
                    if (activeTab !== 'profile') {
                      e.target.style.backgroundColor = '#F8F6F1';
                      e.target.style.paddingLeft = '1.8rem';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== 'profile') {
                      e.target.style.backgroundColor = 'transparent';
                      e.target.style.paddingLeft = '1.5rem';
                    }
                  }}
                >
                  <i className="bi bi-person-fill me-3"></i>Profile
                </button>
                <button
                  className={`list-group-item list-group-item-action border-0 ${activeTab === 'orders' ? '' : ''}`}
                  onClick={() => setActiveTab('orders')}
                  style={{
                    backgroundColor: activeTab === 'orders' ? '#2C5F2D' : 'transparent',
                    color: activeTab === 'orders' ? '#FFFFFF' : '#2C5F2D',
                    padding: '1rem 1.5rem',
                    fontWeight: '600',
                    fontSize: '1rem',
                    transition: 'all 0.3s ease',
                    borderLeft: activeTab === 'orders' ? '4px solid #97C97D' : '4px solid transparent'
                  }}
                  onMouseEnter={(e) => {
                    if (activeTab !== 'orders') {
                      e.target.style.backgroundColor = '#F8F6F1';
                      e.target.style.paddingLeft = '1.8rem';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== 'orders') {
                      e.target.style.backgroundColor = 'transparent';
                      e.target.style.paddingLeft = '1.5rem';
                    }
                  }}
                >
                  <i className="bi bi-box-seam-fill me-3"></i>My Orders
                </button>
                <button
                  className={`list-group-item list-group-item-action border-0 ${activeTab === 'reviews' ? '' : ''}`}
                  onClick={() => setActiveTab('reviews')}
                  style={{
                    backgroundColor: activeTab === 'reviews' ? '#2C5F2D' : 'transparent',
                    color: activeTab === 'reviews' ? '#FFFFFF' : '#2C5F2D',
                    padding: '1rem 1.5rem',
                    fontWeight: '600',
                    fontSize: '1rem',
                    transition: 'all 0.3s ease',
                    borderLeft: activeTab === 'reviews' ? '4px solid #97C97D' : '4px solid transparent'
                  }}
                  onMouseEnter={(e) => {
                    if (activeTab !== 'reviews') {
                      e.target.style.backgroundColor = '#F8F6F1';
                      e.target.style.paddingLeft = '1.8rem';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== 'reviews') {
                      e.target.style.backgroundColor = 'transparent';
                      e.target.style.paddingLeft = '1.5rem';
                    }
                  }}
                >
                  <i className="bi bi-star-fill me-3"></i>My Reviews
                </button>
                <button
                  className="list-group-item list-group-item-action border-0"
                  onClick={() => navigate('/tickets')}
                  style={{
                    backgroundColor: 'transparent',
                    color: '#2C5F2D',
                    padding: '1rem 1.5rem',
                    fontWeight: '600',
                    fontSize: '1rem',
                    transition: 'all 0.3s ease',
                    borderLeft: '4px solid transparent'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#F8F6F1';
                    e.target.style.paddingLeft = '1.8rem';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'transparent';
                    e.target.style.paddingLeft = '1.5rem';
                  }}
                >
                  <i className="bi bi-headset me-3"></i>Support Tickets
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="col-lg-9">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div 
                className="card border-0 shadow-sm" 
                style={{ 
                  borderRadius: '16px',
                  backgroundColor: '#FFFFFF'
                }}
              >
                <div 
                  className="card-header border-0 d-flex justify-content-between align-items-center"
                  style={{
                    backgroundColor: '#F8F6F1',
                    padding: '1.5rem 2rem',
                    borderRadius: '16px 16px 0 0'
                  }}
                >
                  <h5 className="mb-0" style={{ color: '#2C5F2D', fontWeight: '700' }}>
                    <i className="bi bi-person-badge me-2" style={{ color: '#97C97D' }}></i>
                    Profile Information
                  </h5>
                  {!editMode && (
                    <button 
                      className="btn fw-semibold"
                      onClick={() => setEditMode(true)}
                      style={{
                        backgroundColor: '#2C5F2D',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '0.6rem 1.5rem',
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
                      <i className="bi bi-pencil-square me-2"></i>Edit Profile
                    </button>
                  )}
                </div>
                <div className="card-body p-4">
                  {editMode ? (
                    <form onSubmit={handleProfileUpdate}>
                      <div className="row g-4">
                        <div className="col-md-6">
                          <label className="form-label fw-semibold" style={{ color: '#2C5F2D' }}>
                            First Name *
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            value={formData.first_name}
                            onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                            required
                            style={{
                              borderRadius: '10px',
                              border: '2px solid #E5E7EB',
                              padding: '0.75rem 1rem',
                              fontSize: '1rem'
                            }}
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label fw-semibold" style={{ color: '#2C5F2D' }}>
                            Middle Name
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            value={formData.middle_name}
                            onChange={(e) => setFormData({...formData, middle_name: e.target.value})}
                            style={{
                              borderRadius: '10px',
                              border: '2px solid #E5E7EB',
                              padding: '0.75rem 1rem',
                              fontSize: '1rem'
                            }}
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label fw-semibold" style={{ color: '#2C5F2D' }}>
                            Last Name *
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            value={formData.last_name}
                            onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                            required
                            style={{
                              borderRadius: '10px',
                              border: '2px solid #E5E7EB',
                              padding: '0.75rem 1rem',
                              fontSize: '1rem'
                            }}
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label fw-semibold" style={{ color: '#2C5F2D' }}>
                            Mobile Number *
                          </label>
                          <input
                            type="tel"
                            className="form-control"
                            value={formData.mobile_number}
                            onChange={(e) => setFormData({...formData, mobile_number: e.target.value})}
                            required
                            style={{
                              borderRadius: '10px',
                              border: '2px solid #E5E7EB',
                              padding: '0.75rem 1rem',
                              fontSize: '1rem'
                            }}
                          />
                        </div>
                        <div className="col-12">
                          <label className="form-label fw-semibold" style={{ color: '#2C5F2D' }}>
                            Permanent Address *
                          </label>
                          <textarea
                            className="form-control"
                            rows="3"
                            value={formData.permanent_address}
                            onChange={(e) => setFormData({...formData, permanent_address: e.target.value})}
                            required
                            style={{
                              borderRadius: '10px',
                              border: '2px solid #E5E7EB',
                              padding: '0.75rem 1rem',
                              fontSize: '1rem'
                            }}
                          ></textarea>
                        </div>
                        
                        {/* Delivery Addresses Section */}
                        <div className="col-12">
                          <hr style={{ border: '2px solid #F8F6F1', margin: '2rem 0' }} />
                          <h6 className="mb-3 fw-bold" style={{ color: '#2C5F2D' }}>
                            <i className="bi bi-geo-alt-fill me-2" style={{ color: '#97C97D' }}></i>
                            Delivery Addresses
                          </h6>
                          {formData.delivery_addresses && formData.delivery_addresses.length > 0 ? (
                            formData.delivery_addresses.map((addr, index) => (
                              <div 
                                key={index} 
                                className="border rounded p-3 mb-3"
                                style={{
                                  borderRadius: '12px',
                                  backgroundColor: '#F8F6F1',
                                  border: '2px solid #E5E7EB'
                                }}
                              >
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                  <strong style={{ color: '#2C5F2D' }}>
                                    <i className="bi bi-house-fill me-2" style={{ color: '#97C97D' }}></i>
                                    Address {index + 1}
                                  </strong>
                                  <button
                                    type="button"
                                    className="btn fw-semibold"
                                    onClick={() => {
                                      const newAddresses = formData.delivery_addresses.filter((_, i) => i !== index);
                                      setFormData({...formData, delivery_addresses: newAddresses});
                                    }}
                                    style={{
                                      backgroundColor: 'transparent',
                                      color: '#E85D75',
                                      border: '2px solid #E85D75',
                                      borderRadius: '8px',
                                      padding: '0.4rem 1rem',
                                      fontSize: '0.85rem'
                                    }}
                                  >
                                    <i className="bi bi-trash me-1"></i>Remove
                                  </button>
                                </div>
                                <div className="row g-2">
                                  <div className="col-12">
                                    <input
                                      type="text"
                                      className="form-control"
                                      placeholder="Street address"
                                      value={addr.street || ''}
                                      onChange={(e) => {
                                        const newAddresses = [...formData.delivery_addresses];
                                        newAddresses[index] = {...newAddresses[index], street: e.target.value};
                                        setFormData({...formData, delivery_addresses: newAddresses});
                                      }}
                                      style={{
                                        borderRadius: '8px',
                                        border: '2px solid #E5E7EB',
                                        padding: '0.6rem 1rem'
                                      }}
                                    />
                                  </div>
                                  <div className="col-md-6">
                                    <input
                                      type="text"
                                      className="form-control"
                                      placeholder="City"
                                      value={addr.city || ''}
                                      onChange={(e) => {
                                        const newAddresses = [...formData.delivery_addresses];
                                        newAddresses[index] = {...newAddresses[index], city: e.target.value};
                                        setFormData({...formData, delivery_addresses: newAddresses});
                                      }}
                                      style={{
                                        borderRadius: '8px',
                                        border: '2px solid #E5E7EB',
                                        padding: '0.6rem 1rem'
                                      }}
                                    />
                                  </div>
                                  <div className="col-md-3">
                                    <input
                                      type="text"
                                      className="form-control"
                                      placeholder="State"
                                      value={addr.state || ''}
                                      onChange={(e) => {
                                        const newAddresses = [...formData.delivery_addresses];
                                        newAddresses[index] = {...newAddresses[index], state: e.target.value};
                                        setFormData({...formData, delivery_addresses: newAddresses});
                                      }}
                                      style={{
                                        borderRadius: '8px',
                                        border: '2px solid #E5E7EB',
                                        padding: '0.6rem 1rem'
                                      }}
                                    />
                                  </div>
                                  <div className="col-md-3">
                                    <input
                                      type="text"
                                      className="form-control"
                                      placeholder="Postal Code"
                                      value={addr.postalCode || ''}
                                      onChange={(e) => {
                                        const newAddresses = [...formData.delivery_addresses];
                                        newAddresses[index] = {...newAddresses[index], postalCode: e.target.value};
                                        setFormData({...formData, delivery_addresses: newAddresses});
                                      }}
                                      style={{
                                        borderRadius: '8px',
                                        border: '2px solid #E5E7EB',
                                        padding: '0.6rem 1rem'
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-muted">No delivery addresses added yet.</p>
                          )}
                          
                          <button
                            type="button"
                            className="btn fw-semibold"
                            onClick={() => {
                              const newAddresses = [...(formData.delivery_addresses || []), {street: '', city: '', state: '', postalCode: ''}];
                              setFormData({...formData, delivery_addresses: newAddresses});
                            }}
                            style={{
                              backgroundColor: 'transparent',
                              color: '#2C5F2D',
                              border: '2px solid #2C5F2D',
                              borderRadius: '10px',
                              padding: '0.6rem 1.5rem'
                            }}
                          >
                            <i className="bi bi-plus-circle me-2"></i>Add New Address
                          </button>
                        </div>
                      </div>
                      <div className="mt-4 d-flex gap-2">
                        <button 
                          type="submit" 
                          className="btn fw-bold"
                          disabled={loading}
                          style={{
                            backgroundColor: '#2C5F2D',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: '10px',
                            padding: '0.75rem 2rem',
                            fontSize: '1rem'
                          }}
                        >
                          {loading ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2"></span>
                              Saving...
                            </>
                          ) : (
                            <>
                              <i className="bi bi-check-circle me-2"></i>
                              Save Changes
                            </>
                          )}
                        </button>
                        <button 
                          type="button" 
                          className="btn fw-bold"
                          onClick={() => setEditMode(false)}
                          style={{
                            backgroundColor: 'transparent',
                            color: '#6B7B5F',
                            border: '2px solid #E5E7EB',
                            borderRadius: '10px',
                            padding: '0.75rem 2rem',
                            fontSize: '1rem'
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div>
                      {/* Success/Error Messages */}
                      {resetPasswordMessage && (
                        <div 
                          className="alert alert-dismissible fade show mb-4" 
                          role="alert"
                          style={{
                            backgroundColor: resetPasswordMessage.includes('Failed') ? '#FEE2E2' : '#D1FAE5',
                            color: resetPasswordMessage.includes('Failed') ? '#991B1B' : '#065F46',
                            border: 'none',
                            borderRadius: '12px',
                            padding: '1rem 1.5rem'
                          }}
                        >
                          <i className={`bi ${resetPasswordMessage.includes('Failed') ? 'bi-exclamation-triangle-fill' : 'bi-check-circle-fill'} me-2`}></i>
                          {resetPasswordMessage}
                          <button 
                            type="button" 
                            className="btn-close" 
                            onClick={() => setResetPasswordMessage('')}
                            style={{ fontSize: '0.8rem' }}
                          ></button>
                        </div>
                      )}
                      {emailChangeMessage && (
                        <div 
                          className="alert alert-dismissible fade show mb-4" 
                          role="alert"
                          style={{
                            backgroundColor: emailChangeMessage.includes('Failed') || emailChangeMessage.includes('Invalid') ? '#FEE2E2' : '#D1FAE5',
                            color: emailChangeMessage.includes('Failed') || emailChangeMessage.includes('Invalid') ? '#991B1B' : '#065F46',
                            border: 'none',
                            borderRadius: '12px',
                            padding: '1rem 1.5rem'
                          }}
                        >
                          <i className={`bi ${emailChangeMessage.includes('Failed') || emailChangeMessage.includes('Invalid') ? 'bi-exclamation-triangle-fill' : 'bi-check-circle-fill'} me-2`}></i>
                          {emailChangeMessage}
                          <button 
                            type="button" 
                            className="btn-close" 
                            onClick={() => setEmailChangeMessage('')}
                            style={{ fontSize: '0.8rem' }}
                          ></button>
                        </div>
                      )}

                      <div className="row g-4">
                        <div className="col-md-6">
                          <div 
                            className="p-3 rounded" 
                            style={{ backgroundColor: '#F8F6F1' }}
                          >
                            <label className="small text-uppercase fw-bold mb-2" style={{ color: '#6B7B5F', letterSpacing: '0.5px' }}>
                              First Name
                            </label>
                            <p className="mb-0 fw-semibold" style={{ color: '#2C5F2D', fontSize: '1.05rem' }}>
                              {profileData?.first_name || 'N/A'}
                            </p>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div 
                            className="p-3 rounded" 
                            style={{ backgroundColor: '#F8F6F1' }}
                          >
                            <label className="small text-uppercase fw-bold mb-2" style={{ color: '#6B7B5F', letterSpacing: '0.5px' }}>
                              Last Name
                            </label>
                            <p className="mb-0 fw-semibold" style={{ color: '#2C5F2D', fontSize: '1.05rem' }}>
                              {profileData?.last_name || 'N/A'}
                            </p>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div 
                            className="p-3 rounded" 
                            style={{ backgroundColor: '#F8F6F1' }}
                          >
                            <label className="small text-uppercase fw-bold mb-2" style={{ color: '#6B7B5F', letterSpacing: '0.5px' }}>
                              Email Address
                            </label>
                            <p className="mb-2 fw-semibold" style={{ color: '#2C5F2D', fontSize: '1.05rem' }}>
                              {user?.email}
                            </p>
                            <button 
                              className="btn btn-sm fw-semibold"
                              onClick={() => setShowEmailChangeModal(true)}
                              style={{
                                backgroundColor: 'transparent',
                                color: '#2C5F2D',
                                border: '2px solid #2C5F2D',
                                borderRadius: '8px',
                                padding: '0.4rem 1rem',
                                fontSize: '0.85rem'
                              }}
                            >
                              <i className="bi bi-envelope me-1"></i>
                              Change Email
                            </button>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div 
                            className="p-3 rounded" 
                            style={{ backgroundColor: '#F8F6F1' }}
                          >
                            <label className="small text-uppercase fw-bold mb-2" style={{ color: '#6B7B5F', letterSpacing: '0.5px' }}>
                              Mobile Number
                            </label>
                            <p className="mb-0 fw-semibold" style={{ color: '#2C5F2D', fontSize: '1.05rem' }}>
                              {profileData?.mobile_number || 'N/A'}
                            </p>
                          </div>
                        </div>
                        <div className="col-12">
                          <div 
                            className="p-3 rounded" 
                            style={{ backgroundColor: '#F8F6F1' }}
                          >
                            <label className="small text-uppercase fw-bold mb-2" style={{ color: '#6B7B5F', letterSpacing: '0.5px' }}>
                              Password
                            </label>
                            <p className="mb-2 fw-semibold" style={{ color: '#2C5F2D', fontSize: '1.05rem' }}>
                              ••••••••
                            </p>
                            <button 
                              className="btn btn-sm fw-semibold"
                              onClick={handlePasswordReset}
                              disabled={loading}
                              style={{
                                backgroundColor: 'transparent',
                                color: '#FDB022',
                                border: '2px solid #FDB022',
                                borderRadius: '8px',
                                padding: '0.4rem 1rem',
                                fontSize: '0.85rem'
                              }}
                            >
                              <i className="bi bi-key me-1"></i>
                              {loading ? 'Sending...' : 'Reset Password'}
                            </button>
                          </div>
                        </div>
                        <div className="col-12">
                          <div 
                            className="p-3 rounded" 
                            style={{ backgroundColor: '#F8F6F1' }}
                          >
                            <label className="small text-uppercase fw-bold mb-2" style={{ color: '#6B7B5F', letterSpacing: '0.5px' }}>
                              Permanent Address
                            </label>
                            <p className="mb-0 fw-semibold" style={{ color: '#2C5F2D', fontSize: '1.05rem' }}>
                              {profileData?.permanent_address || 'N/A'}
                            </p>
                          </div>
                        </div>
                        <div className="col-12">
                          <div 
                            className="p-3 rounded" 
                            style={{ backgroundColor: '#F8F6F1' }}
                          >
                            <label className="small text-uppercase fw-bold mb-3" style={{ color: '#6B7B5F', letterSpacing: '0.5px' }}>
                              <i className="bi bi-geo-alt-fill me-2" style={{ color: '#97C97D' }}></i>
                              Delivery Addresses
                            </label>
                            {profileData?.delivery_addresses && profileData.delivery_addresses.length > 0 ? (
                              <div className="d-flex flex-column gap-2">
                                {profileData.delivery_addresses.map((addr, index) => (
                                  <div 
                                    key={index} 
                                    className="p-3 rounded"
                                    style={{
                                      backgroundColor: '#FFFFFF',
                                      border: '2px solid #E5E7EB'
                                    }}
                                  >
                                    <p className="mb-1 fw-bold" style={{ color: '#2C5F2D', fontSize: '0.9rem' }}>
                                      <i className="bi bi-house-fill me-2" style={{ color: '#97C97D' }}></i>
                                      Address {index + 1}
                                    </p>
                                    <p className="mb-0" style={{ color: '#6B7B5F' }}>
                                      {addr.street}, {addr.city}, {addr.state} - {addr.postalCode}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-muted mb-0">No delivery addresses added</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div 
                className="card border-0 shadow-sm" 
                style={{ 
                  borderRadius: '16px',
                  backgroundColor: '#FFFFFF'
                }}
              >
                <div 
                  className="card-header border-0"
                  style={{
                    backgroundColor: '#F8F6F1',
                    padding: '1.5rem 2rem',
                    borderRadius: '16px 16px 0 0'
                  }}
                >
                  <h5 className="mb-0" style={{ color: '#2C5F2D', fontWeight: '700' }}>
                    <i className="bi bi-box-seam-fill me-2" style={{ color: '#97C97D' }}></i>
                    My Orders
                  </h5>
                </div>
                <div className="card-body p-4">
                  {loading ? (
                    <div className="text-center py-5">
                      <div 
                        className="spinner-border mb-3"
                        style={{ 
                          width: '3rem', 
                          height: '3rem',
                          color: '#2C5F2D'
                        }}
                      ></div>
                      <p style={{ color: '#6B7B5F' }}>Loading your orders...</p>
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="text-center py-5">
                      <div className="mb-4" style={{ fontSize: '4rem' }}>📦</div>
                      <h5 style={{ color: '#2C5F2D', fontWeight: '600' }}>No Orders Yet</h5>
                      <p className="mb-4" style={{ color: '#6B7B5F' }}>
                        Start shopping to see your orders here!
                      </p>
                      <button
                        onClick={() => navigate('/products')}
                        className="btn fw-semibold"
                        style={{
                          backgroundColor: '#2C5F2D',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '12px',
                          padding: '1rem 2.5rem'
                        }}
                      >
                        <i className="bi bi-arrow-left me-2"></i>
                        Browse Products
                      </button>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover" style={{ marginBottom: 0 }}>
                        <thead style={{ backgroundColor: '#F8F6F1' }}>
                          <tr>
                            <th style={{ 
                              color: '#2C5F2D', 
                              fontWeight: '700',
                              padding: '1rem',
                              borderBottom: '2px solid #E5E7EB'
                            }}>
                              Order #
                            </th>
                            <th style={{ 
                              color: '#2C5F2D', 
                              fontWeight: '700',
                              padding: '1rem',
                              borderBottom: '2px solid #E5E7EB'
                            }}>
                              Date
                            </th>
                            <th style={{ 
                              color: '#2C5F2D', 
                              fontWeight: '700',
                              padding: '1rem',
                              borderBottom: '2px solid #E5E7EB'
                            }}>
                              Items
                            </th>
                            <th style={{ 
                              color: '#2C5F2D', 
                              fontWeight: '700',
                              padding: '1rem',
                              borderBottom: '2px solid #E5E7EB'
                            }}>
                              Total
                            </th>
                            <th style={{ 
                              color: '#2C5F2D', 
                              fontWeight: '700',
                              padding: '1rem',
                              borderBottom: '2px solid #E5E7EB'
                            }}>
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {orders.map(order => (
                            <tr 
                              key={order.id}   
                              onClick={() => navigate(`/orders/${order.id}`)}
                              style={{ 
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#F8F6F1';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                              }}
                            >
                              <td style={{ 
                                padding: '1rem',
                                color: '#2C5F2D',
                                fontWeight: '700'
                              }}>
                                {order.order_number}
                              </td>
                              <td style={{ padding: '1rem', color: '#6B7B5F' }}>
                                {new Date(order.placed_at).toLocaleDateString()}
                              </td>
                              <td style={{ padding: '1rem', color: '#6B7B5F' }}>
                                <span 
                                  className="badge"
                                  style={{
                                    backgroundColor: '#2C5F2D',
                                    color: '#FFFFFF',
                                    padding: '0.4rem 0.8rem',
                                    borderRadius: '8px',
                                    fontWeight: '600'
                                  }}
                                >
                                  {order.order_items?.length || 0} items
                                </span>
                              </td>
                              <td style={{ 
                                padding: '1rem',
                                color: '#2C5F2D',
                                fontWeight: '700',
                                fontSize: '1.1rem'
                              }}>
                                ₹{order.total_amount}
                              </td>
                              <td style={{ padding: '1rem' }}>
                                {getStatusBadge(order.status)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
              <div 
                className="card border-0 shadow-sm" 
                style={{ 
                  borderRadius: '16px',
                  backgroundColor: '#FFFFFF'
                }}
              >
                <div 
                  className="card-header border-0"
                  style={{
                    backgroundColor: '#F8F6F1',
                    padding: '1.5rem 2rem',
                    borderRadius: '16px 16px 0 0'
                  }}
                >
                  <h5 className="mb-0" style={{ color: '#2C5F2D', fontWeight: '700' }}>
                    <i className="bi bi-star-fill me-2" style={{ color: '#FDB022' }}></i>
                    My Reviews
                  </h5>
                </div>
                <div className="card-body p-4">
                  {loading ? (
                    <div className="text-center py-5">
                      <div 
                        className="spinner-border mb-3"
                        style={{ 
                          width: '3rem', 
                          height: '3rem',
                          color: '#2C5F2D'
                        }}
                      ></div>
                      <p style={{ color: '#6B7B5F' }}>Loading your reviews...</p>
                    </div>
                  ) : reviews.length === 0 ? (
                    <div className="text-center py-5">
                      <div className="mb-4" style={{ fontSize: '4rem' }}>⭐</div>
                      <h5 style={{ color: '#2C5F2D', fontWeight: '600' }}>No Reviews Yet</h5>
                      <p className="mb-0" style={{ color: '#6B7B5F' }}>
                        Purchase and receive products to write reviews!
                      </p>
                    </div>
                  ) : (
                    <div className="row g-3">
                      {reviews.map(review => (
                        <div key={review.id} className="col-12">
                          <div 
                            className="card border-0 shadow-sm"
                            style={{ 
                              cursor: 'pointer',
                              transition: 'all 0.3s ease',
                              borderRadius: '12px',
                              backgroundColor: '#FFFFFF'
                            }}
                            onClick={() => handleReviewClick(review)}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'translateY(-4px)';
                              e.currentTarget.style.boxShadow = '0 8px 24px rgba(44, 95, 45, 0.12)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = '';
                            }}
                          >
                            <div className="card-body p-4">
                              <div className="d-flex justify-content-between align-items-start mb-3">
                                <div className="flex-grow-1">
                                  <div className="d-flex align-items-center gap-2 mb-2">
                                    <i className="bi bi-box-seam" style={{ color: '#2C5F2D' }}></i>
                                    <h6 className="mb-0 fw-bold" style={{ color: '#2C5F2D' }}>
                                      {review.products?.name || 'Product'}
                                    </h6>
                                  </div>
                                  {renderStars(review.rating)}
                                </div>
                                <div className="d-flex flex-column align-items-end gap-2">
                                  {review.is_verified_purchase && (
                                    <span 
                                      className="badge"
                                      style={{
                                        backgroundColor: '#DBEAFE',
                                        color: '#1E40AF',
                                        padding: '0.4rem 0.8rem',
                                        borderRadius: '8px',
                                        fontSize: '0.75rem',
                                        fontWeight: '600'
                                      }}
                                    >
                                      <i className="bi bi-check-circle me-1"></i>
                                      Verified Purchase
                                    </span>
                                  )}
                                </div>
                              </div>

                              {review.title && (
                                <h6 className="fw-semibold mb-2" style={{ color: '#2C5F2D' }}>
                                  {review.title}
                                </h6>
                              )}

                              <p 
                                className="mb-2"
                                style={{
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                  color: '#6B7B5F',
                                  lineHeight: '1.6'
                                }}
                              >
                                {review.comment}
                              </p>

                              <div className="d-flex justify-content-between align-items-center mt-3">
                                <span style={{ color: '#6B7B5F', fontSize: '0.9rem' }}>
                                  <i className="bi bi-calendar3 me-1"></i>
                                  {formatDate(review.created_at)}
                                </span>
                                <span style={{ color: '#2C5F2D', fontSize: '0.9rem', fontWeight: '600' }}>
                                  Click to view details
                                  <i className="bi bi-arrow-right ms-1"></i>
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Review Detail Modal */}
      {showReviewModal && selectedReview && (
        <div 
          className="modal fade show d-block" 
          style={{ backgroundColor: 'rgba(44, 95, 45, 0.7)' }}
          tabIndex="-1"
          onClick={handleCloseReviewModal}
        >
          <div 
            className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable"
            onClick={(e) => e.stopPropagation()}
          >
            <div 
              className="modal-content border-0"
              style={{ borderRadius: '16px', overflow: 'hidden' }}
            >
              {/* Modal Header */}
              <div 
                className="modal-header border-0"
                style={{ 
                  backgroundColor: '#FEF3C7',
                  padding: '1.5rem 2rem'
                }}
              >
                <div>
                  <h5 className="modal-title mb-1" style={{ color: '#92400E', fontWeight: '700' }}>
                    <i className="bi bi-star-fill me-2" style={{ color: '#FDB022' }}></i>
                    Your Review
                  </h5>
                  <small style={{ color: '#92400E' }}>
                    Review ID: #{selectedReview.id?.substring(0, 8)}
                  </small>
                </div>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={handleCloseReviewModal}
                  style={{ 
                    backgroundColor: '#92400E',
                    opacity: 0.8
                  }}
                ></button>
              </div>

              {/* Modal Body */}
              <div className="modal-body p-4" style={{ backgroundColor: '#F5F1E8' }}>
                {/* Product Info */}
                <div 
                  className="card border-0 mb-4"
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '12px'
                  }}
                >
                  <div className="card-body p-3">
                    <div className="d-flex align-items-center gap-3">
                      <div 
                        className="rounded-circle d-flex align-items-center justify-content-center"
                        style={{ 
                          width: '60px', 
                          height: '60px', 
                          fontSize: '1.5rem',
                          backgroundColor: '#2C5F2D',
                          color: '#FFFFFF',
                          flexShrink: 0
                        }}
                      >
                        <i className="bi bi-box-seam"></i>
                      </div>
                      <div className="flex-grow-1">
                        <h6 className="mb-1 fw-bold" style={{ color: '#2C5F2D' }}>
                          {selectedReview.products?.name || 'Product'}
                        </h6>
                        <small style={{ color: '#6B7B5F' }}>
                          Reviewed on {formatDate(selectedReview.created_at)}
                        </small>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status Badge */}
                {selectedReview.is_verified_purchase && (
                  <div className="mb-4">
                    <span 
                      className="badge"
                      style={{
                        backgroundColor: '#DBEAFE',
                        color: '#1E40AF',
                        padding: '0.6rem 1.2rem',
                        borderRadius: '10px',
                        fontSize: '0.9rem',
                        fontWeight: '600'
                      }}
                    >
                      <i className="bi bi-patch-check me-2"></i>
                      Verified Purchase
                    </span>
                  </div>
                )}

                {/* Rating */}
                <div className="mb-4">
                  <label 
                    className="form-label fw-bold mb-2"
                    style={{ 
                      color: '#6B7B5F',
                      fontSize: '0.85rem',
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase'
                    }}
                  >
                    Your Rating
                  </label>
                  <div className="d-flex align-items-center gap-3">
                    {renderStars(selectedReview.rating)}
                    <span 
                      className="fw-bold"
                      style={{ 
                        fontSize: '1.5rem',
                        color: '#FDB022'
                      }}
                    >
                      {selectedReview.rating}/5
                    </span>
                  </div>
                </div>

                {/* Title */}
                {selectedReview.title && (
                  <div className="mb-4">
                    <label 
                      className="form-label fw-bold mb-2"
                      style={{ 
                        color: '#6B7B5F',
                        fontSize: '0.85rem',
                        letterSpacing: '0.5px',
                        textTransform: 'uppercase'
                      }}
                    >
                      Review Title
                    </label>
                    <h5 className="fw-semibold" style={{ color: '#2C5F2D' }}>
                      {selectedReview.title}
                    </h5>
                  </div>
                )}

                {/* Comment */}
                <div className="mb-4">
                  <label 
                    className="form-label fw-bold mb-2"
                    style={{ 
                      color: '#6B7B5F',
                      fontSize: '0.85rem',
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase'
                    }}
                  >
                    Your Review
                  </label>
                  <div 
                    className="p-3 rounded"
                    style={{ 
                      whiteSpace: 'pre-wrap',
                      lineHeight: '1.8',
                      fontSize: '1rem',
                      backgroundColor: '#FFFFFF',
                      color: '#2C5F2D',
                      border: '2px solid #E5E7EB'
                    }}
                  >
                    {selectedReview.comment}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div 
                className="modal-footer border-0"
                style={{ 
                  backgroundColor: '#F8F6F1',
                  padding: '1.5rem 2rem'
                }}
              >
                <button 
                  type="button" 
                  className="btn fw-bold"
                  onClick={handleCloseReviewModal}
                  style={{
                    backgroundColor: '#2C5F2D',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '0.75rem 2rem'
                  }}
                >
                  <i className="bi bi-x-circle me-2"></i>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Email Change Modal */}
      {showEmailChangeModal && (
        <div 
          className="modal fade show d-block" 
          style={{ backgroundColor: 'rgba(44, 95, 45, 0.7)' }} 
          tabIndex="-1"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div 
              className="modal-content border-0"
              style={{ borderRadius: '16px', overflow: 'hidden' }}
            >
              <div 
                className="modal-header border-0"
                style={{ 
                  backgroundColor: '#F8F6F1',
                  padding: '1.5rem 2rem'
                }}
              >
                <h5 className="modal-title" style={{ color: '#2C5F2D', fontWeight: '700' }}>
                  <i className="bi bi-envelope-fill me-2" style={{ color: '#97C97D' }}></i>
                  Change Email Address
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => {
                    setShowEmailChangeModal(false);
                    setNewEmail('');
                    setEmailChangeMessage('');
                  }}
                ></button>
              </div>
              <form onSubmit={handleRequestEmailChange}>
                <div className="modal-body p-4" style={{ backgroundColor: '#F5F1E8' }}>
                  {emailChangeMessage && !showOTPModal && (
                    <div 
                      className="alert mb-4"
                      style={{
                        backgroundColor: emailChangeMessage.includes('Failed') ? '#FEE2E2' : '#DBEAFE',
                        color: emailChangeMessage.includes('Failed') ? '#991B1B' : '#1E40AF',
                        border: 'none',
                        borderRadius: '12px',
                        padding: '1rem'
                      }}
                    >
                      <i className={`bi ${emailChangeMessage.includes('Failed') ? 'bi-exclamation-triangle-fill' : 'bi-info-circle-fill'} me-2`}></i>
                      {emailChangeMessage}
                    </div>
                  )}
                  <div className="mb-3">
                    <label 
                      className="form-label fw-semibold"
                      style={{ color: '#2C5F2D' }}
                    >
                      Current Email
                    </label>
                    <input
                      type="email"
                      className="form-control"
                      value={user?.email || ''}
                      disabled
                      readOnly
                      style={{
                        borderRadius: '10px',
                        border: '2px solid #E5E7EB',
                        padding: '0.75rem 1rem',
                        backgroundColor: '#F8F6F1',
                        color: '#6B7B5F'
                      }}
                    />
                  </div>
                  <div className="mb-3">
                    <label 
                      className="form-label fw-semibold"
                      style={{ color: '#2C5F2D' }}
                    >
                      New Email Address *
                    </label>
                    <input
                      type="email"
                      className="form-control"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="Enter new email address"
                      required
                      style={{
                        borderRadius: '10px',
                        border: '2px solid #E5E7EB',
                        padding: '0.75rem 1rem',
                        fontSize: '1rem'
                      }}
                    />
                    <div 
                      className="form-text mt-2"
                      style={{ color: '#6B7B5F' }}
                    >
                      <i className="bi bi-info-circle me-1"></i>
                      An OTP will be sent to your new email address for verification
                    </div>
                  </div>
                </div>
                <div 
                  className="modal-footer border-0"
                  style={{ 
                    backgroundColor: '#F8F6F1',
                    padding: '1.5rem 2rem'
                  }}
                >
                  <button 
                    type="button" 
                    className="btn fw-bold"
                    onClick={() => {
                      setShowEmailChangeModal(false);
                      setNewEmail('');
                      setEmailChangeMessage('');
                    }}
                    style={{
                      backgroundColor: 'transparent',
                      color: '#6B7B5F',
                      border: '2px solid #E5E7EB',
                      borderRadius: '10px',
                      padding: '0.75rem 1.5rem'
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn fw-bold"
                    disabled={loading || !newEmail}
                    style={{
                      backgroundColor: '#2C5F2D',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '0.75rem 2rem'
                    }}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Sending OTP...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-send me-2"></i>
                        Send OTP
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* OTP Verification Modal */}
      {showOTPModal && (
        <div 
          className="modal fade show d-block" 
          style={{ backgroundColor: 'rgba(44, 95, 45, 0.7)' }} 
          tabIndex="-1"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div 
              className="modal-content border-0"
              style={{ borderRadius: '16px', overflow: 'hidden' }}
            >
              <div 
                className="modal-header border-0"
                style={{ 
                  backgroundColor: '#D1FAE5',
                  padding: '1.5rem 2rem'
                }}
              >
                <h5 className="modal-title" style={{ color: '#065F46', fontWeight: '700' }}>
                  <i className="bi bi-shield-check me-2" style={{ color: '#2C5F2D' }}></i>
                  Verify OTP
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => {
                    setShowOTPModal(false);
                    setEmailOTP('');
                    setNewEmail('');
                    setEmailChangeMessage('');
                  }}
                ></button>
              </div>
              <form onSubmit={handleVerifyEmailOTP}>
                <div className="modal-body p-4" style={{ backgroundColor: '#F5F1E8' }}>
                  {emailChangeMessage && (
                    <div 
                      className="alert mb-4"
                      style={{
                        backgroundColor: emailChangeMessage.includes('Failed') || emailChangeMessage.includes('Invalid') ? '#FEE2E2' : '#D1FAE5',
                        color: emailChangeMessage.includes('Failed') || emailChangeMessage.includes('Invalid') ? '#991B1B' : '#065F46',
                        border: 'none',
                        borderRadius: '12px',
                        padding: '1rem'
                      }}
                    >
                      <i className={`bi ${emailChangeMessage.includes('Failed') || emailChangeMessage.includes('Invalid') ? 'bi-exclamation-triangle-fill' : 'bi-check-circle-fill'} me-2`}></i>
                      {emailChangeMessage}
                    </div>
                  )}
                  <div 
                    className="alert mb-4"
                    style={{
                      backgroundColor: '#DBEAFE',
                      color: '#1E40AF',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '1rem'
                    }}
                  >
                    <i className="bi bi-info-circle-fill me-2"></i>
                    <strong>OTP sent to:</strong> {newEmail}
                    <br />
                    <small>Please check your email and enter the 6-digit code below</small>
                  </div>
                  <div className="mb-3">
                    <label 
                      className="form-label fw-semibold"
                      style={{ color: '#2C5F2D' }}
                    >
                      Enter OTP *
                    </label>
                    <input
                      type="text"
                      className="form-control form-control-lg text-center"
                      value={emailOTP}
                      onChange={(e) => setEmailOTP(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000"
                      maxLength="6"
                      required
                      style={{ 
                        letterSpacing: '0.8rem', 
                        fontSize: '1.8rem',
                        fontWeight: '700',
                        borderRadius: '12px',
                        border: '2px solid #2C5F2D',
                        padding: '1rem',
                        color: '#2C5F2D',
                        backgroundColor: '#FFFFFF'
                      }}
                    />
                    <div 
                      className="form-text text-center mt-2"
                      style={{ color: '#6B7B5F' }}
                    >
                      Enter the 6-digit verification code
                    </div>
                  </div>
                  <div className="text-center">
                    <button 
                      type="button" 
                      className="btn btn-link text-decoration-none fw-semibold"
                      onClick={() => {
                        setShowOTPModal(false);
                        setShowEmailChangeModal(true);
                        setEmailOTP('');
                      }}
                      style={{ color: '#2C5F2D' }}
                    >
                      <i className="bi bi-arrow-left me-1"></i>
                      Change Email Address
                    </button>
                  </div>
                </div>
                <div 
                  className="modal-footer border-0"
                  style={{ 
                    backgroundColor: '#F8F6F1',
                    padding: '1.5rem 2rem'
                  }}
                >
                  <button 
                    type="button" 
                    className="btn fw-bold"
                    onClick={() => {
                      setShowOTPModal(false);
                      setEmailOTP('');
                      setNewEmail('');
                      setEmailChangeMessage('');
                    }}
                    style={{
                      backgroundColor: 'transparent',
                      color: '#6B7B5F',
                      border: '2px solid #E5E7EB',
                      borderRadius: '10px',
                      padding: '0.75rem 1.5rem'
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn fw-bold"
                    disabled={loading || emailOTP.length !== 6}
                    style={{
                      backgroundColor: '#2C5F2D',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '0.75rem 2rem'
                    }}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Verifying...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-circle me-2"></i>
                        Verify & Change Email
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;