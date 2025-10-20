import { useState, useEffect } from 'react';
import supportService from '../../services/supportService';

const SupportManagement = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    category: '',
    page: 1,
    limit: 20
  });

  useEffect(() => {
    fetchTickets();
  }, [filters]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const response = await supportService.getAllTickets(filters);
      setTickets(response.tickets || []);
    } catch (err) {
      console.error('Error fetching tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (ticketId, newStatus) => {
    try {
      await supportService.updateTicketStatus(ticketId, { status: newStatus });
      fetchTickets();
    } catch (err) {
      alert('Failed to update ticket status');
    }
  };

  const getPriorityBadge = (priority) => {
    const badges = {
      low: 'secondary',
      medium: 'info',
      high: 'warning',
      urgent: 'danger'
    };
    return `badge bg-${badges[priority] || 'secondary'}`;
  };

  const getStatusBadge = (status) => {
    const badges = {
      open: 'primary',
      in_progress: 'warning',
      waiting_customer: 'info',
      resolved: 'success',
      closed: 'secondary'
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
          <h2>Support Ticket Management</h2>
          <p className="text-muted">Manage customer support tickets</p>
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
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="waiting_customer">Waiting Customer</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div className="col-md-3">
              <select
                className="form-select"
                value={filters.priority}
                onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
              >
                <option value="">All Priority</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div className="col-md-3">
              <select
                className="form-select"
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              >
                <option value="">All Categories</option>
                <option value="order_issue">Order Issue</option>
                <option value="plant_care">Plant Care</option>
                <option value="technical">Technical</option>
                <option value="general">General</option>
                <option value="complaint">Complaint</option>
              </select>
            </div>
            <div className="col-md-3">
              <button
                className="btn btn-outline-secondary w-100"
                onClick={() => setFilters({ status: '', priority: '', category: '', page: 1, limit: 20 })}
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="card shadow-sm">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover">
              <thead className="table-light">
                <tr>
                  <th>Ticket #</th>
                  <th>Customer</th>
                  <th>Subject</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tickets.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-4">No tickets found</td>
                  </tr>
                ) : (
                  tickets.map((ticket) => (
                    <tr key={ticket.id}>
                      <td className="fw-bold">{ticket.ticket_number}</td>
                      <td>
                        <div>{ticket.customer_name}</div>
                        <small className="text-muted">{ticket.customer_email}</small>
                      </td>
                      <td>{ticket.subject}</td>
                      <td>
                        <span className="badge bg-light text-dark">
                          {ticket.category.replace('_', ' ')}
                        </span>
                      </td>
                      <td>
                        <span className={getPriorityBadge(ticket.priority)}>
                          {ticket.priority.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <span className={getStatusBadge(ticket.status)}>
                          {ticket.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td>{new Date(ticket.created_at).toLocaleDateString()}</td>
                      <td>
                        <div className="dropdown">
                          <button
                            className="btn btn-sm btn-outline-primary dropdown-toggle"
                            type="button"
                            data-bs-toggle="dropdown"
                          >
                            Actions
                          </button>
                          <ul className="dropdown-menu">
                            <li><button className="dropdown-item" onClick={() => handleStatusUpdate(ticket.id, 'in_progress')}>Mark In Progress</button></li>
                            <li><button className="dropdown-item" onClick={() => handleStatusUpdate(ticket.id, 'waiting_customer')}>Wait for Customer</button></li>
                            <li><button className="dropdown-item" onClick={() => handleStatusUpdate(ticket.id, 'resolved')}>Mark Resolved</button></li>
                            <li><button className="dropdown-item" onClick={() => handleStatusUpdate(ticket.id, 'closed')}>Close Ticket</button></li>
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

export default SupportManagement;