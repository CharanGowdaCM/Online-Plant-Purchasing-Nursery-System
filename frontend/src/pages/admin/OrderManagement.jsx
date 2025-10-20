import { useState, useEffect } from 'react';
import orderService from '../../services/orderService';

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    dateFrom: '',
    dateTo: '',
    page: 1,
    limit: 20
  });

  useEffect(() => {
    fetchOrders();
  }, [filters]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await orderService.getAllOrders(filters);
      setOrders(response.data || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await orderService.updateOrderStatus(orderId, {
        status: newStatus,
        notes: `Status updated to ${newStatus}`
      });
      fetchOrders();
    } catch (err) {
      alert('Failed to update order status');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'warning',
      confirmed: 'info',
      processing: 'primary',
      packed: 'primary',
      shipped: 'info',
      out_for_delivery: 'info',
      delivered: 'success',
      cancelled: 'danger',
      refunded: 'secondary'
    };
    return `badge bg-${badges[status] || 'secondary'}`;
  };

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-success"></div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <div className="row mb-4">
        <div className="col-md-6">
          <h2>Order Management</h2>
          <p className="text-muted">Manage and process customer orders</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-3">
              <select
                className="form-select"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="col-md-3">
              <input
                type="date"
                className="form-control"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              />
            </div>
            <div className="col-md-3">
              <input
                type="date"
                className="form-control"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              />
            </div>
            <div className="col-md-3">
              <button
                className="btn btn-outline-secondary w-100"
                onClick={() => setFilters({ status: '', dateFrom: '', dateTo: '', page: 1, limit: 20 })}
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="card shadow-sm">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover">
              <thead className="table-light">
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-4">No orders found</td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order.id}>
                      <td className="fw-bold">{order.order_number}</td>
                      <td>
                        <div>{order.users?.profiles?.first_name} {order.users?.profiles?.last_name}</div>
                        <small className="text-muted">{order.users?.email}</small>
                      </td>
                      <td>{new Date(order.placed_at).toLocaleDateString()}</td>
                      <td>{order.order_items?.length || 0}</td>
                      <td>₹{order.total_amount}</td>
                      <td>
                        <span className={getStatusBadge(order.status)}>
                          {order.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <div className="dropdown">
                          <button
                            className="btn btn-sm btn-outline-primary dropdown-toggle"
                            type="button"
                            data-bs-toggle="dropdown"
                          >
                            Update Status
                          </button>
                          <ul className="dropdown-menu">
                            <li><button className="dropdown-item" onClick={() => handleStatusUpdate(order.id, 'confirmed')}>Confirmed</button></li>
                            <li><button className="dropdown-item" onClick={() => handleStatusUpdate(order.id, 'processing')}>Processing</button></li>
                            <li><button className="dropdown-item" onClick={() => handleStatusUpdate(order.id, 'packed')}>Packed</button></li>
                            <li><button className="dropdown-item" onClick={() => handleStatusUpdate(order.id, 'shipped')}>Shipped</button></li>
                            <li><button className="dropdown-item" onClick={() => handleStatusUpdate(order.id, 'delivered')}>Delivered</button></li>
                            <li><hr className="dropdown-divider" /></li>
                            <li><button className="dropdown-item text-danger" onClick={() => handleStatusUpdate(order.id, 'cancelled')}>Cancel</button></li>
                          </ul>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderManagement;