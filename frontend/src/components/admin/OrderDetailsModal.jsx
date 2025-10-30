import { useState } from 'react';

const OrderDetailsModal = ({ show, order, onClose, statusHistory }) => {
  const [activeTab, setActiveTab] = useState('details');

  if (!show || !order) return null;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadgeClass = (status) => {
    const classes = {
      pending: 'bg-warning',
      confirmed: 'bg-info',
      processing: 'bg-primary',
      packed: 'bg-primary',
      shipped: 'bg-info',
      out_for_delivery: 'bg-info',
      delivered: 'bg-success',
      cancelled: 'bg-danger',
      refunded: 'bg-secondary'
    };
    return `badge ${classes[status] || 'bg-secondary'}`;
  };

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Order Details - {order.order_number}</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <ul className="nav nav-tabs mb-3">
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === 'details' ? 'active' : ''}`}
                  onClick={() => setActiveTab('details')}
                >
                  Order Details
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === 'history' ? 'active' : ''}`}
                  onClick={() => setActiveTab('history')}
                >
                  Status History
                </button>
              </li>
            </ul>

            {activeTab === 'details' ? (
              <div>
                <div className="row">
                  <div className="col-md-6">
                    <h6>Customer Information</h6>
                    <p>Name: {order.shipping_address?.name}<br />
                       Email: {order.customer_email}<br />
                       Phone: {order.customer_phone}</p>
                  </div>
                  <div className="col-md-6">
                    <h6>Order Information</h6>
                    <p>
                      Order Date: {formatDate(order.created_at)}<br />
                      Status: <span className={getStatusBadgeClass(order.status)}>{order.status}</span><br />
                      Payment Status: <span className={`badge ${order.payment_status === 'paid' ? 'bg-success' : 'bg-warning'}`}>
                        {order.payment_status}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="row mt-3">
                  <div className="col-md-6">
                    <h6>Shipping Address</h6>
                    <p>{order.shipping_address?.address_line}<br />
                       {order.shipping_address?.city}, {order.shipping_address?.state}<br />
                       {order.shipping_address?.zip}</p>
                  </div>
                  <div className="col-md-6">
                    <h6>Order Summary</h6>
                    <p>
                      Subtotal: ₹{order.subtotal}<br />
                      Shipping: ₹{order.shipping_cost}<br />
                      Tax: ₹{order.tax_amount}<br />
                      Discount: ₹{order.discount_amount}<br />
                      <strong>Total: ₹{order.total_amount}</strong>
                    </p>
                  </div>
                </div>

                {order.items && (
                  <div className="mt-4">
                    <h6>Order Items</h6>
                    <div className="table-responsive">
                      <table className="table table-sm">
                        <thead>
                          <tr>
                            <th>Product</th>
                            <th>Quantity</th>
                            <th>Price</th>
                            <th>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {order.items.map((item, index) => (
                            <tr key={index}>
                              <td>{item.product_name || item.name}</td>
                              <td>{item.quantity}</td>
                              <td>₹{item.price}</td>
                              <td>₹{item.quantity * item.price}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {(order.tracking_number || order.shipping_partner) && (
                  <div className="mt-3">
                    <h6>Shipping Information</h6>
                    <p>
                      Tracking Number: {order.tracking_number}<br />
                      Shipping Partner: {order.shipping_partner}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <h6>Status History</h6>
                {statusHistory && statusHistory.length > 0 ? (
                  <div className="timeline">
                    {statusHistory.map((history, index) => (
                      <div key={index} className="timeline-item">
                        <div className="d-flex">
                          <div className="pe-3">
                            <i className="bi bi-circle-fill text-primary"></i>
                          </div>
                          <div>
                            <p className="mb-1">
                              <strong>{history.status}</strong>
                            </p>
                            <p className="text-muted mb-1">{formatDate(history.created_at)}</p>
                            {history.notes && <p className="text-muted mb-0">{history.notes}</p>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>No status history available</p>
                )}
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsModal;