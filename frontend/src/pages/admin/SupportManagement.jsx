import { useState, useEffect, useCallback } from 'react';
import supportService from '../../services/supportService';
import faqService from '../../services/faqService';
import FAQModal from '../../components/admin/support/FAQModal';

const SupportManagement = () => {
  // Tab state
  const [activeTab, setActiveTab] = useState('tickets');

  // Tickets state (existing)
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    category: '',
    page: 1,
    limit: 20
  });
  const [updateStatus, setUpdateStatus] = useState({ loading: false, error: null });
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  // FAQs state
  const [faqs, setFaqs] = useState([]);
  const [faqLoading, setFaqLoading] = useState(false);
  const [faqFilters, setFaqFilters] = useState({
    category: '',
    is_active: '',
    page: 1,
    limit: 50,
    search: ''
  });
  const [showFaqModal, setShowFaqModal] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null);

  useEffect(() => {
    if (activeTab === 'tickets') {
      fetchTickets();
    }
  }, [filters.status, filters.priority, filters.category, filters.page, activeTab]);

  // Debounce FAQ search
  useEffect(() => {
    if (activeTab === 'faqs') {
      const debounceTimer = setTimeout(() => {
        fetchFAQs();
      }, 300);
      return () => clearTimeout(debounceTimer);
    }
  }, [faqFilters.category, faqFilters.is_active, faqFilters.search, faqFilters.page, activeTab]);

  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 3000);
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await supportService.getAllTickets(filters);
      setTickets(response.tickets.tickets || []);
    } catch (err) {
      console.error('Error fetching tickets:', err);
      setError('Failed to load tickets. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (ticketId, newStatus) => {
    try {
      setUpdateStatus({ loading: true, error: null });
      await supportService.updateTicketStatus(ticketId, { status: newStatus });
      await fetchTickets();
      setUpdateStatus({ loading: false, error: null });
    } catch (err) {
      console.error('Error updating ticket:', err);
      setUpdateStatus({ 
        loading: false, 
        error: 'Failed to update ticket status. Please try again.' 
      });
    }
  };

  const TicketDetailsModal = () => {
    if (!selectedTicket) return null;

    return (
      <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                Ticket #{selectedTicket.ticket_number}
              </h5>
              <button 
                type="button" 
                className="btn-close"
                onClick={() => setSelectedTicket(null)}
              ></button>
            </div>
            <div className="modal-body">
              {/* Ticket Details Section */}
              <div className="card mb-4">
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-8">
                      <h6>{selectedTicket.subject}</h6>
                      <p className="text-muted">{selectedTicket.description}</p>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-2">
                        <small className="text-muted">Status:</small>
                        <span className={`badge ms-2 ${getStatusBadge(selectedTicket.status)}`}>
                          {selectedTicket.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <div className="mb-2">
                        <small className="text-muted">Priority:</small>
                        <span className={`badge ms-2 ${getPriorityBadge(selectedTicket.priority)}`}>
                          {selectedTicket.priority.toUpperCase()}
                        </span>
                      </div>
                      <div className="mb-2">
                        <small className="text-muted">Category:</small>
                        <br/>
                        <span className="badge bg-secondary">
                          {selectedTicket.category.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <div className="mb-2">
                        <small className="text-muted">Contact Customer:</small>
                        <br/>
                        <button
                          onClick={() => {
                            if (!selectedTicket?.customer_email) {
                              alert("Customer email not found!");
                              return;
                            }

                            const subject = `Re: ${selectedTicket.subject} (Ticket #${selectedTicket.ticket_number})`;

                            // Construct Gmail compose link
                            const gmailComposeURL = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
                              selectedTicket.customer_email
                            )}&su=${encodeURIComponent(subject)}`;

                            // Open Gmail compose in a new tab
                            window.open(gmailComposeURL, "_blank");
                          }}
                          className="btn btn-sm btn-outline-primary"
                        >
                          <i className="bi bi-envelope me-2"></i>
                          Email Customer
                        </button>


                      </div>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="btn-group">
                      {selectedTicket.status === 'open' && (
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => handleAssignment(selectedTicket.id)}
                          disabled={updateStatus.loading}
                        >
                          Take Action
                        </button>
                      )}
                      {selectedTicket.status !== 'resolved' && selectedTicket.status !== 'closed' && (
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() => handleStatusUpdate(selectedTicket.id, 'resolved')}
                          disabled={updateStatus.loading}
                        >
                          Mark as Resolved
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Take Action Section */}
              {selectedTicket.status !== 'closed' && (
                <div className="card">
                  <div className="card-body">
                    <h6 className="mb-3">Update Status</h6>
                    <div className="d-flex gap-2">
                      <button
                        className="btn btn-warning"
                        onClick={() => handleTakeAction(selectedTicket.id, 'in_progress')}
                        disabled={updateStatus.loading || selectedTicket.status === 'in_progress'}
                      >
                        In Progress
                      </button>
                      <button
                        className="btn btn-info"
                        onClick={() => handleTakeAction(selectedTicket.id, 'waiting_customer')}
                        disabled={updateStatus.loading || selectedTicket.status === 'waiting_customer'}
                      >
                        Waiting Customer
                      </button>
                      <button
                        className="btn btn-success"
                        onClick={() => handleTakeAction(selectedTicket.id, 'resolved')}
                        disabled={updateStatus.loading || selectedTicket.status === 'resolved'}
                      >
                        Resolved
                      </button>
                      <button
                        className="btn btn-secondary"
                        onClick={() => handleTakeAction(selectedTicket.id, 'closed')}
                        disabled={updateStatus.loading}
                      >
                        Close Ticket
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const handleTakeAction = async (ticketId, status) => {
    try {
      setUpdateStatus({ loading: true, error: null });
      await supportService.updateTicketStatus(ticketId, { status });
      await fetchTickets();
      setUpdateStatus({ loading: false, error: null });
      showNotification(`Ticket status successfully updated to ${status.replace('_', ' ').toUpperCase()}`);
      setSelectedTicket(null); // Close the modal
    } catch (err) {
      console.error('Error updating ticket:', err);
      setUpdateStatus({ 
        loading: false, 
        error: 'Failed to update ticket status. Please try again.' 
      });
      showNotification('Failed to update ticket status', 'error');
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

  // ========== FAQ MANAGEMENT FUNCTIONS ==========

  const fetchFAQs = useCallback(async () => {
    try {
      setFaqLoading(true);
      const response = await faqService.getAllFAQs(faqFilters);
      setFaqs(response.faqs || []);
    } catch (err) {
      console.error('Error fetching FAQs:', err);
      showNotification('Failed to load FAQs', 'error');
    } finally {
      setFaqLoading(false);
    }
  }, [faqFilters, showNotification]);

  const handleCreateFAQ = () => {
    setEditingFaq(null);
    setShowFaqModal(true);
  };

  const handleEditFAQ = (faq) => {
    setEditingFaq(faq);
    setShowFaqModal(true);
  };

  const handleSaveFAQ = async (faqData) => {
    try {
      if (editingFaq) {
        await faqService.updateFAQ(editingFaq.id, faqData);
        showNotification('FAQ updated successfully');
      } else {
        await faqService.createFAQ(faqData);
        showNotification('FAQ created successfully');
      }
      setShowFaqModal(false);
      setEditingFaq(null);
      fetchFAQs();
    } catch (err) {
      console.error('Error saving FAQ:', err);
      showNotification('Failed to save FAQ', 'error');
      throw err; // Re-throw to let modal handle it
    }
  };

  const handleCloseFaqModal = () => {
    setShowFaqModal(false);
    setEditingFaq(null);
  };

  const handleDeleteFAQ = async (faqId, hardDelete = false) => {
    const confirmMsg = hardDelete 
      ? 'Are you sure you want to permanently delete this FAQ?' 
      : 'Are you sure you want to deactivate this FAQ?';
    
    if (!window.confirm(confirmMsg)) return;

    try {
      await faqService.deleteFAQ(faqId, hardDelete);
      showNotification(hardDelete ? 'FAQ deleted permanently' : 'FAQ deactivated');
      fetchFAQs();
    } catch (err) {
      console.error('Error deleting FAQ:', err);
      showNotification('Failed to delete FAQ', 'error');
    }
  };

  const FAQsTab = () => (
    <div>
      {/* FAQ Filters and Actions */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex gap-2">
          <input
            type="text"
            className="form-control"
            placeholder="Search FAQs..."
            value={faqFilters.search}
            onChange={(e) => setFaqFilters({ ...faqFilters, search: e.target.value })}
            style={{ width: '300px' }}
          />
          <select
            className="form-select"
            value={faqFilters.is_active}
            onChange={(e) => setFaqFilters({ ...faqFilters, is_active: e.target.value })}
            style={{ width: '150px' }}
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
        <button className="btn btn-success" onClick={handleCreateFAQ}>
          <i className="bi bi-plus-circle me-2"></i>
          Create New FAQ
        </button>
      </div>

      {/* FAQ List */}
      {faqLoading ? (
        <div className="text-center py-4">Loading FAQs...</div>
      ) : faqs.length === 0 ? (
        <div className="alert alert-info">No FAQs found. Create your first FAQ!</div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover">
            <thead>
              <tr>
                <th style={{ width: '50px' }}>Order</th>
                <th style={{ width: '150px' }}>Category</th>
                <th>Question</th>
                <th style={{ width: '100px' }}>Status</th>
                <th style={{ width: '150px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {faqs.map(faq => (
                <tr key={faq.id}>
                  <td>{faq.display_order}</td>
                  <td>
                    <span className="badge bg-secondary">{faq.category}</span>
                  </td>
                  <td>
                    <div className="fw-bold">{faq.question}</div>
                    <small className="text-muted">
                      {faq.answer.length > 100 ? `${faq.answer.substring(0, 100)}...` : faq.answer}
                    </small>
                  </td>
                  <td>
                    <span className={`badge ${faq.is_active ? 'bg-success' : 'bg-secondary'}`}>
                      {faq.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="btn-group">
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => handleEditFAQ(faq)}
                        title="Edit FAQ"
                      >
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button
                        className="btn btn-sm btn-outline-warning"
                        onClick={() => handleDeleteFAQ(faq.id, false)}
                        title="Deactivate FAQ"
                      >
                        <i className="bi bi-eye-slash"></i>
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDeleteFAQ(faq.id, true)}
                        title="Delete Permanently"
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  // Main render
  if (loading && activeTab === 'tickets') return <div className="p-4">Loading...</div>;
  if (error && activeTab === 'tickets') return <div className="p-4 text-danger">{error}</div>;

  return (
    <div className="container-fluid py-4">
      {/* Notification Toast */}
      {notification.show && (
        <div
          className={`alert alert-${notification.type === 'error' ? 'danger' : 'success'} alert-dismissible fade show position-fixed top-0 end-0 m-4`}
          role="alert"
          style={{ zIndex: 1050 }}
        >
          {notification.message}
          <button
            type="button"
            className="btn-close"
            onClick={() => setNotification({ show: false, message: '', type: '' })}
          ></button>
        </div>
      )}

      <h2 className="mb-4">Support Management</h2>

      {/* Tab Navigation */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'tickets' ? 'active' : ''}`}
            onClick={() => setActiveTab('tickets')}
          >
            <i className="bi bi-ticket-perforated me-2"></i>
            Support Tickets
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'faqs' ? 'active' : ''}`}
            onClick={() => setActiveTab('faqs')}
          >
            <i className="bi bi-question-circle me-2"></i>
            FAQs Management
          </button>
        </li>
      </ul>

      {/* Tab Content */}
      {activeTab === 'tickets' ? (
        <>
          {/* Status Filter Buttons */}
          <div className="mb-4">
            <div className="btn-group me-3">
              <button
                className={`btn ${!filters.status ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setFilters(f => ({ ...f, status: '' }))}
              >
                All
              </button>
              {['open', 'in_progress', 'waiting_customer', 'resolved', 'closed'].map(status => (
                <button
                  key={status}
                  className={`btn ${filters.status === status ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setFilters(f => ({ ...f, status }))}
                >
                  {status.replace('_', ' ').toUpperCase()}
                </button>
              ))}
            </div>

            <div className="btn-group">
              <button
                className={`btn ${!filters.priority ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setFilters(f => ({ ...f, priority: '' }))}
              >
                All Priorities
              </button>
              {['urgent', 'high', 'medium', 'low'].map(priority => (
                <button
                  key={priority}
                  className={`btn ${filters.priority === priority ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setFilters(f => ({ ...f, priority }))}
                >
                  {priority.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {updateStatus.error && (
            <div className="alert alert-danger mb-4">{updateStatus.error}</div>
          )}

          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Ticket ID</th>
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
                {tickets.map(ticket => (
                  <tr 
                    key={ticket.id} 
                    className={ticket.priority === 'urgent' ? 'table-danger' : ''}
                    onClick={() => setSelectedTicket(ticket)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>{ticket.ticket_number}</td>
                    <td>
                      <div>{ticket.customer_name}</div>
                      <small className="text-muted">{ticket.customer_email}</small>
                    </td>
                    <td>{ticket.subject}</td>
                    <td>{ticket.category.replace('_', ' ').toUpperCase()}</td>
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
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="btn-group">
                        {ticket.status !== 'closed' ? (
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => setSelectedTicket(ticket)}
                            disabled={updateStatus.loading}
                          >
                            Take Action
                          </button>
                        ) : (
                          <button
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => setSelectedTicket(ticket)}
                          >
                            View Details
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {tickets.length === 0 && (
            <div className="alert alert-info">No tickets found matching the selected filters.</div>
          )}

          {selectedTicket && <TicketDetailsModal />}
        </>
      ) : (
        <FAQsTab />
      )}

      {/* FAQ Modal Component */}
      <FAQModal 
        show={showFaqModal}
        onClose={handleCloseFaqModal}
        onSave={handleSaveFAQ}
        editingFaq={editingFaq}
      />
    </div>
  );
};

export default SupportManagement;