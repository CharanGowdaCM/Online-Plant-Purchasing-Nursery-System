import { useState, useEffect } from 'react';
import orderService from '../../services/orderService';
import OrderStatusUpdateModal from '../../components/admin/OrderStatusUpdateModal';
import OrderDetailsModal from '../../components/admin/OrderDetailsModal';

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [statusHistory, setStatusHistory] = useState([]);
  const [filters, setFilters] = useState({
    status: '',
    dateFrom: '',
    dateTo: '',
    searchTerm: '',
    page: 1,
    limit: 10
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0
  });

  useEffect(() => {
    fetchOrders();
  }, [filters]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await orderService.getAllOrders(filters);
      setOrders(response.data || []);
      if (response.pagination) {
        const { page, limit, total } = response.pagination;
        setPagination({
          currentPage: page,
          totalItems: total,
          totalPages: Math.ceil(total / limit)
        });
      }
      console.log(pagination);
    } catch (err) {
      console.error('Error fetching orders:', err);
      alert('Failed to fetch orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (formData) => {
    try {
      await orderService.updateOrderStatus(selectedOrder.id, formData);
      setShowStatusModal(false);
      fetchOrders();
      alert('Order status updated successfully!');
    } catch (err) {
      console.error('Error updating order status:', err);
      alert(err.response.data.message || 'Failed to update order status. Please try again.');
    }
  };

  const handleViewDetails = async (order) => {
    setSelectedOrder(order);
    try {
      const historyResponse = await orderService.getOrderHistory(order.id);
      setStatusHistory(historyResponse.data || []);
      setShowDetailsModal(true);
    } catch (err) {
      console.error('Error fetching order history:', err);
      alert('Failed to fetch order history. Please try again.');
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

  const handlePageChange = (page) => {
    setFilters(prev => ({ ...prev, page }));
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
        <div className="col">
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
                onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="processing">Processing</option>
                <option value="packed">Packed</option>
                <option value="shipped">Shipped</option>
                <option value="out_for_delivery">Out for Delivery</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="col-md-3">
              <input
                type="date"
                className="form-control"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value, page: 1 })}
                placeholder="From Date"
              />
            </div>
            <div className="col-md-3">
              <input
                type="date"
                className="form-control"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value, page: 1 })}
                placeholder="To Date"
              />
            </div>
            <div className="col-md-3">
              <input
                type="text"
                className="form-control"
                value={filters.searchTerm}
                onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value, page: 1 })}
                placeholder="Search order number, customer..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="card shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Total</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>{order.order_number}</td>
                  <td>
                    {order.shipping_address?.name}
                    <br />
                    <small className="text-muted">{order.customer_email}</small>
                  </td>
                  <td>
                    {new Date(order.created_at).toLocaleDateString()}
                    <br />
                    <small className="text-muted">
                      {new Date(order.created_at).toLocaleTimeString()}
                    </small>
                  </td>
                  <td>₹{order.total_amount}</td>
                  <td>
                    <span className={getStatusBadge(order.status)}>
                      {order.status}
                    </span>
                  </td>
                  <td>
                    <div className="btn-group btn-group-sm">
                      <button
                        className="btn btn-outline-primary"
                        onClick={() => handleViewDetails(order)}
                      >
                        View
                      </button>
                      <button
                        className="btn btn-outline-success"
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowStatusModal(true);
                        }}
                      >
                        Update
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="card-footer">
            <nav>
              <ul className="pagination justify-content-center mb-0">
                <li className={`page-item ${pagination.currentPage === 1 ? 'disabled' : ''}`}>
                  <button
                    className="page-link"
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                  >
                    Previous
                  </button>
                </li>
                {[...Array(pagination.totalPages)].map((_, index) => (
                  <li
                    key={index + 1}
                    className={`page-item ${pagination.currentPage === index + 1 ? 'active' : ''}`}
                  >
                    <button
                      className="page-link"
                      onClick={() => handlePageChange(index + 1)}
                    >
                      {index + 1}
                    </button>
                  </li>
                ))}
                <li
                  className={`page-item ${
                    pagination.currentPage === pagination.totalPages ? 'disabled' : ''
                  }`}
                >
                  <button
                    className="page-link"
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                  >
                    Next
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        )}
      </div>

      {/* Modals */}
      <OrderStatusUpdateModal
        show={showStatusModal}
        order={selectedOrder}
        onClose={() => setShowStatusModal(false)}
        onUpdate={handleStatusUpdate}
      />

      <OrderDetailsModal
        show={showDetailsModal}
        order={selectedOrder}
        statusHistory={statusHistory}
        onClose={() => setShowDetailsModal(false)}
      />
    </div>
  );
};

export default OrderManagement;