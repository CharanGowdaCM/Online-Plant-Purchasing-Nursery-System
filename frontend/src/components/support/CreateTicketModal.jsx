import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';

const CreateTicketModal = ({ show, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    category: 'general',
    priority: 'medium'
  });
  const [errors, setErrors] = useState({});
  const [submitStatus, setSubmitStatus] = useState({ type: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (show) {
      setFormData({
        subject: '',
        description: '',
        category: 'general',
        priority: 'medium'
      });
      setErrors({});
      setSubmitStatus({ type: '', message: '' });
    }
  }, [show]);

  const handleChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [errors]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    } else if (formData.subject.trim().length < 5) {
      newErrors.subject = 'Subject must be at least 5 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.trim().length < 20) {
      newErrors.description = 'Description must be at least 20 characters';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (!formData.priority) {
      newErrors.priority = 'Priority is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    setSubmitStatus({ type: 'loading', message: 'Creating ticket...' });

    try {
      await onSubmit(formData);
      setSubmitStatus({ type: 'success', message: 'Ticket created successfully!' });
      
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err) {
      console.error('Error creating ticket:', err);
      setSubmitStatus({
        type: 'error',
        message: err.response?.data?.message || 'Failed to create ticket. Please try again.'
      });
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      subject: '',
      description: '',
      category: 'general',
      priority: 'medium'
    });
    setErrors({});
    setSubmitStatus({ type: '', message: '' });
    setSubmitting(false);
    onClose();
  };

  if (!show) return null;

  const getCategoryIcon = (category) => {
    const icons = {
      order_issue: 'bi-box-seam',
      plant_care: 'bi-flower2',
      technical: 'bi-gear',
      general: 'bi-chat-dots',
      complaint: 'bi-exclamation-triangle'
    };
    return icons[category] || 'bi-chat-dots';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: '#97C97D',
      medium: '#FFA726',
      high: '#E85D75',
      urgent: '#C53030'
    };
    return colors[priority] || '#97C97D';
  };

  return (
    <div 
      className="modal show d-block" 
      style={{ 
        backgroundColor: 'rgba(44, 95, 45, 0.4)',
        backdropFilter: 'blur(4px)'
      }}
      onClick={handleClose}
    >
      <div 
        className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable"
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
                <i className="bi bi-ticket-detailed-fill me-2" style={{ color: '#97C97D' }}></i>
                Create Support Ticket
              </h5>
              <p className="mb-0" style={{ color: '#6B7B5F', fontSize: '0.9rem' }}>
                We're here to help you resolve any issues
              </p>
            </div>
            <button 
              type="button" 
              className="btn-close"
              onClick={handleClose}
              disabled={submitting}
              aria-label="Close"
              style={{
                filter: 'brightness(0.7)'
              }}
            ></button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div 
              className="modal-body" 
              style={{ 
                padding: '2rem',
                maxHeight: 'calc(100vh - 250px)',
                overflowY: 'auto'
              }}
            >
              {/* Status Messages */}
              {submitStatus.message && (
                <div 
                  className="alert border-0 d-flex align-items-start mb-4" 
                  role="alert"
                  style={{
                    backgroundColor: submitStatus.type === 'error' 
                      ? '#FFF5F5' 
                      : submitStatus.type === 'success' 
                      ? '#E8F5E9' 
                      : '#E3F2FD',
                    color: submitStatus.type === 'error' 
                      ? '#E85D75' 
                      : submitStatus.type === 'success' 
                      ? '#2C5F2D' 
                      : '#1976D2',
                    borderRadius: '12px',
                    padding: '1rem 1.25rem'
                  }}
                >
                  {submitStatus.type === 'loading' && (
                    <span 
                      className="spinner-border spinner-border-sm me-3 mt-1" 
                      role="status" 
                      aria-hidden="true"
                      style={{
                        width: '1.2rem',
                        height: '1.2rem',
                        color: '#1976D2'
                      }}
                    ></span>
                  )}
                  {submitStatus.type === 'success' && (
                    <i className="bi bi-check-circle-fill me-3 mt-1" style={{ fontSize: '1.2rem' }}></i>
                  )}
                  {submitStatus.type === 'error' && (
                    <i className="bi bi-exclamation-triangle-fill me-3 mt-1" style={{ fontSize: '1.2rem' }}></i>
                  )}
                  <div className="fw-semibold flex-grow-1">{submitStatus.message}</div>
                  {submitStatus.type !== 'loading' && (
                    <button 
                      type="button" 
                      className="btn-close" 
                      onClick={() => setSubmitStatus({ type: '', message: '' })}
                      aria-label="Close"
                      style={{
                        fontSize: '0.8rem',
                        opacity: 0.7
                      }}
                    ></button>
                  )}
                </div>
              )}
              
              {/* Subject Field */}
              <div className="mb-4">
                <label 
                  htmlFor="ticketSubject" 
                  className="form-label fw-semibold mb-2"
                  style={{ color: '#2C5F2D', fontSize: '0.95rem' }}
                >
                  Subject <span style={{ color: '#E85D75' }}>*</span>
                </label>
                <div 
                  className="input-group"
                  style={{
                    border: `2px solid ${errors.subject ? '#E85D75' : '#E5E7EB'}`,
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
                    <i className="bi bi-pencil-fill"></i>
                  </span>
                  <input
                    type="text"
                    id="ticketSubject"
                    className="form-control border-0 shadow-none"
                    value={formData.subject}
                    onChange={(e) => handleChange('subject', e.target.value)}
                    placeholder="Brief description of your issue"
                    disabled={submitting}
                    maxLength={200}
                    style={{
                      backgroundColor: 'transparent',
                      color: '#2C5F2D',
                      padding: '0.75rem 0.5rem'
                    }}
                  />
                </div>
                {errors.subject && (
                  <div className="mt-2" style={{ color: '#E85D75', fontSize: '0.875rem', fontWeight: '500' }}>
                    <i className="bi bi-x-circle-fill me-1"></i>
                    {errors.subject}
                  </div>
                )}
                <small className="d-block mt-2" style={{ color: '#6B7B5F', fontSize: '0.85rem' }}>
                  {formData.subject.length}/200 characters
                </small>
              </div>

              {/* Description Field */}
              <div className="mb-4">
                <label 
                  htmlFor="ticketDescription" 
                  className="form-label fw-semibold mb-2"
                  style={{ color: '#2C5F2D', fontSize: '0.95rem' }}
                >
                  Description <span style={{ color: '#E85D75' }}>*</span>
                </label>
                <textarea
                  id="ticketDescription"
                  className="form-control shadow-none"
                  rows="5"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Please provide detailed information about your issue"
                  disabled={submitting}
                  maxLength={1000}
                  style={{
                    border: `2px solid ${errors.description ? '#E85D75' : '#E5E7EB'}`,
                    borderRadius: '12px',
                    backgroundColor: '#F8F6F1',
                    color: '#2C5F2D',
                    padding: '0.75rem',
                    resize: 'vertical'
                  }}
                />
                {errors.description && (
                  <div className="mt-2" style={{ color: '#E85D75', fontSize: '0.875rem', fontWeight: '500' }}>
                    <i className="bi bi-x-circle-fill me-1"></i>
                    {errors.description}
                  </div>
                )}
                <small className="d-block mt-2" style={{ color: '#6B7B5F', fontSize: '0.85rem' }}>
                  {formData.description.length}/1000 characters. Minimum 20 characters required.
                </small>
              </div>

              <div className="row">
                {/* Category Field */}
                <div className="col-md-6 mb-4">
                  <label 
                    htmlFor="ticketCategory" 
                    className="form-label fw-semibold mb-2"
                    style={{ color: '#2C5F2D', fontSize: '0.95rem' }}
                  >
                    Category <span style={{ color: '#E85D75' }}>*</span>
                  </label>
                  <div 
                    className="input-group"
                    style={{
                      border: `2px solid ${errors.category ? '#E85D75' : '#E5E7EB'}`,
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
                      <i className={`bi ${getCategoryIcon(formData.category)}`}></i>
                    </span>
                    <select
                      id="ticketCategory"
                      className="form-select border-0 shadow-none"
                      value={formData.category}
                      onChange={(e) => handleChange('category', e.target.value)}
                      disabled={submitting}
                      style={{
                        backgroundColor: 'transparent',
                        color: '#2C5F2D',
                        padding: '0.75rem 0.5rem'
                      }}
                    >
                      <option value="order_issue">📦 Order Issue</option>
                      <option value="plant_care">🌸 Plant Care</option>
                      <option value="technical">⚙️ Technical</option>
                      <option value="general">💬 General</option>
                      <option value="complaint">⚠️ Complaint</option>
                    </select>
                  </div>
                  {errors.category && (
                    <div className="mt-2" style={{ color: '#E85D75', fontSize: '0.875rem', fontWeight: '500' }}>
                      <i className="bi bi-x-circle-fill me-1"></i>
                      {errors.category}
                    </div>
                  )}
                  <small className="d-block mt-2" style={{ color: '#6B7B5F', fontSize: '0.85rem' }}>
                    Select the category that best describes your issue
                  </small>
                </div>

                {/* Priority Field */}
                <div className="col-md-6 mb-4">
                  <label 
                    htmlFor="ticketPriority" 
                    className="form-label fw-semibold mb-2"
                    style={{ color: '#2C5F2D', fontSize: '0.95rem' }}
                  >
                    Priority <span style={{ color: '#E85D75' }}>*</span>
                  </label>
                  <div 
                    className="input-group"
                    style={{
                      border: `2px solid ${errors.priority ? '#E85D75' : getPriorityColor(formData.priority)}`,
                      borderRadius: '12px',
                      overflow: 'hidden',
                      backgroundColor: '#F8F6F1'
                    }}
                  >
                    <span 
                      className="input-group-text border-0"
                      style={{
                        backgroundColor: 'transparent',
                        color: getPriorityColor(formData.priority)
                      }}
                    >
                      <i className="bi bi-flag-fill"></i>
                    </span>
                    <select
                      id="ticketPriority"
                      className="form-select border-0 shadow-none"
                      value={formData.priority}
                      onChange={(e) => handleChange('priority', e.target.value)}
                      disabled={submitting}
                      style={{
                        backgroundColor: 'transparent',
                        color: '#2C5F2D',
                        padding: '0.75rem 0.5rem'
                      }}
                    >
                      <option value="low">🟢 Low - General inquiry</option>
                      <option value="medium">🟡 Medium - Normal issue</option>
                      <option value="high">🟠 High - Serious issue</option>
                      <option value="urgent">🔴 Urgent - Critical issue</option>
                    </select>
                  </div>
                  {errors.priority && (
                    <div className="mt-2" style={{ color: '#E85D75', fontSize: '0.875rem', fontWeight: '500' }}>
                      <i className="bi bi-x-circle-fill me-1"></i>
                      {errors.priority}
                    </div>
                  )}
                  <small className="d-block mt-2" style={{ color: '#6B7B5F', fontSize: '0.85rem' }}>
                    Higher priority tickets are addressed first
                  </small>
                </div>
              </div>

              {/* Info Alert */}
              <div 
                className="alert border-0 d-flex align-items-start"
                style={{
                  backgroundColor: '#E3F2FD',
                  color: '#1565C0',
                  borderRadius: '12px',
                  padding: '1rem 1.25rem'
                }}
              >
                <i className="bi bi-info-circle-fill me-3 mt-1" style={{ fontSize: '1.5rem', color: '#1976D2' }}></i>
                <div>
                  <strong style={{ fontSize: '0.95rem' }}>Tips for faster resolution:</strong>
                  <ul className="mb-0 mt-2 small" style={{ paddingLeft: '1.2rem' }}>
                    <li>Provide as much detail as possible</li>
                    <li>Include relevant order numbers or product information</li>
                    <li>Attach screenshots if applicable (you can add them later)</li>
                  </ul>
                </div>
              </div>
            </div>
            
            {/* Modal Footer */}
            <div 
              className="modal-footer border-0"
              style={{
                backgroundColor: '#F8F6F1',
                padding: '1.25rem 2rem'
              }}
            >
              <button 
                type="button" 
                className="btn fw-semibold"
                onClick={handleClose}
                disabled={submitting}
                style={{
                  backgroundColor: 'transparent',
                  color: '#6B7B5F',
                  border: '2px solid #E5E7EB',
                  borderRadius: '10px',
                  padding: '0.65rem 1.5rem',
                  fontSize: '0.95rem',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  if (!submitting) {
                    e.target.style.backgroundColor = '#E5E7EB';
                    e.target.style.color = '#2C5F2D';
                  }
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.color = '#6B7B5F';
                }}
              >
                <i className="bi bi-x-lg me-2"></i>
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn fw-bold shadow-lg"
                disabled={submitting || submitStatus.type === 'success'}
                style={{
                  backgroundColor: '#2C5F2D',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '0.65rem 1.5rem',
                  fontSize: '0.95rem',
                  transition: 'all 0.3s ease',
                  opacity: submitting ? 0.7 : 1
                }}
                onMouseEnter={(e) => {
                  if (!submitting && submitStatus.type !== 'success') {
                    e.target.style.backgroundColor = '#1e4620';
                    e.target.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#2C5F2D';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                {submitting ? (
                  <>
                    <span 
                      className="spinner-border spinner-border-sm me-2" 
                      role="status" 
                      aria-hidden="true"
                      style={{ width: '1rem', height: '1rem' }}
                    ></span>
                    Creating Ticket...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-circle-fill me-2"></i>
                    Create Ticket
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

CreateTicketModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired
};

export default CreateTicketModal;