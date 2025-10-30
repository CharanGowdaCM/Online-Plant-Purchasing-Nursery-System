import { useState } from 'react';

const OrderStatusUpdateModal = ({ show, order, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    status: order?.status || '',
    notes: '',
    shippingPartner: order?.shipping_partner || ''
  });
  const [isUpdating, setIsUpdating] = useState(false);

  const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'processing', label: 'Processing' },
    { value: 'packed', label: 'Packed' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'out_for_delivery', label: 'Out for Delivery' },
    { value: 'delivered', label: 'Delivered' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      await onUpdate(formData);
    } finally {
      setIsUpdating(false);
    }
  };

  if (!show) return null;

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Update Order Status</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">Order Status</label>
                <select 
                  className="form-select"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  required
                >
                  <option value="">Select Status</option>
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {(formData.status === 'shipped' || formData.status === 'out_for_delivery') && (
                <>
                  <div className="mb-3">
                    <label className="form-label">Shipping Partner</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.shippingPartner}
                      onChange={(e) => setFormData({ ...formData, shippingPartner: e.target.value })}
                      required
                    />
                  </div>
                </>
              )}

              <div className="mb-3">
                <label className="form-label">Notes</label>
                <textarea
                  className="form-control"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows="3"
                  required
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isUpdating}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={isUpdating}>
                {isUpdating ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Updating...
                  </>
                ) : (
                  'Update Status'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OrderStatusUpdateModal;