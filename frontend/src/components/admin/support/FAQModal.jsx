import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';

const FAQModal = ({ show, onClose, onSave, editingFaq = null }) => {
  const [formData, setFormData] = useState({
    category: '',
    question: '',
    answer: '',
    display_order: 0,
    is_active: true
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Initialize form data when modal opens or editingFaq changes
  useEffect(() => {
    if (editingFaq) {
      setFormData({
        category: editingFaq.category || '',
        question: editingFaq.question || '',
        answer: editingFaq.answer || '',
        display_order: editingFaq.display_order || 0,
        is_active: editingFaq.is_active !== undefined ? editingFaq.is_active : true
      });
    } else {
      setFormData({
        category: '',
        question: '',
        answer: '',
        display_order: 0,
        is_active: true
      });
    }
    setErrors({});
  }, [editingFaq, show]);

  const handleChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [errors]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.category.trim()) {
      newErrors.category = 'Category is required';
    }

    if (!formData.question.trim()) {
      newErrors.question = 'Question is required';
    }

    if (!formData.answer.trim()) {
      newErrors.answer = 'Answer is required';
    }

    if (formData.display_order < 0) {
      newErrors.display_order = 'Display order must be 0 or greater';
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
    try {
      await onSave(formData);
      handleClose();
    } catch (err) {
      console.error('Error saving FAQ:', err);
      // Error handling is done in parent component
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      category: '',
      question: '',
      answer: '',
      display_order: 0,
      is_active: true
    });
    setErrors({});
    onClose();
  };

  if (!show) return null;

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              {editingFaq ? 'Edit FAQ' : 'Create New FAQ'}
            </h5>
            <button 
              type="button" 
              className="btn-close"
              onClick={handleClose}
              disabled={submitting}
              aria-label="Close"
            ></button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {/* Category Field */}
              <div className="mb-3">
                <label htmlFor="faqCategory" className="form-label">
                  Category <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  id="faqCategory"
                  className={`form-control ${errors.category ? 'is-invalid' : ''}`}
                  value={formData.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                  placeholder="e.g., Plant Care, Shipping, Returns"
                  disabled={submitting}
                />
                {errors.category && (
                  <div className="invalid-feedback">{errors.category}</div>
                )}
                <small className="text-muted">
                  FAQs will be grouped by category on the public page
                </small>
              </div>

              {/* Question Field */}
              <div className="mb-3">
                <label htmlFor="faqQuestion" className="form-label">
                  Question <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  id="faqQuestion"
                  className={`form-control ${errors.question ? 'is-invalid' : ''}`}
                  value={formData.question}
                  onChange={(e) => handleChange('question', e.target.value)}
                  placeholder="Enter the question"
                  disabled={submitting}
                />
                {errors.question && (
                  <div className="invalid-feedback">{errors.question}</div>
                )}
              </div>

              {/* Answer Field */}
              <div className="mb-3">
                <label htmlFor="faqAnswer" className="form-label">
                  Answer <span className="text-danger">*</span>
                </label>
                <textarea
                  id="faqAnswer"
                  className={`form-control ${errors.answer ? 'is-invalid' : ''}`}
                  rows="5"
                  value={formData.answer}
                  onChange={(e) => handleChange('answer', e.target.value)}
                  placeholder="Enter the detailed answer"
                  disabled={submitting}
                ></textarea>
                {errors.answer && (
                  <div className="invalid-feedback">{errors.answer}</div>
                )}
              </div>

              <div className="row">
                {/* Display Order Field */}
                <div className="col-md-6 mb-3">
                  <label htmlFor="faqDisplayOrder" className="form-label">
                    Display Order
                  </label>
                  <input
                    type="number"
                    id="faqDisplayOrder"
                    className={`form-control ${errors.display_order ? 'is-invalid' : ''}`}
                    value={formData.display_order}
                    onChange={(e) => handleChange('display_order', parseInt(e.target.value) || 0)}
                    min="0"
                    disabled={submitting}
                  />
                  {errors.display_order && (
                    <div className="invalid-feedback">{errors.display_order}</div>
                  )}
                  <small className="text-muted">Lower numbers appear first</small>
                </div>

                {/* Status Field */}
                <div className="col-md-6 mb-3">
                  <label htmlFor="faqStatus" className="form-label">
                    Status
                  </label>
                  <select
                    id="faqStatus"
                    className="form-select"
                    value={formData.is_active}
                    onChange={(e) => handleChange('is_active', e.target.value === 'true')}
                    disabled={submitting}
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                  <small className="text-muted">
                    Only active FAQs are visible to customers
                  </small>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={handleClose}
                disabled={submitting}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-success"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    {editingFaq ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  editingFaq ? 'Update FAQ' : 'Create FAQ'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

FAQModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  editingFaq: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    category: PropTypes.string,
    question: PropTypes.string,
    answer: PropTypes.string,
    display_order: PropTypes.number,
    is_active: PropTypes.bool
  })
};

export default FAQModal;
