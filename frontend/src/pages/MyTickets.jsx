/**
 * Developer: Charan Gowda C M
 * Features: My Tickets, Support System, Ticket Management, Create Ticket, Filter Tickets, 
 * Status Tracking, Priority Color, Ticket Stats, Modal Form, Ticket List, 
 * Navigation, Responsive UI, React Hooks, API Integration
 */


import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ticketService from '../services/ticketService';
import CreateTicketModal from '../components/support/CreateTicketModal';

const MyTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyTickets();
  }, []);

  const fetchMyTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await ticketService.getMyTickets();
      setTickets(response.tickets.tickets);
    } catch (err) {
      console.error('Error fetching tickets:', err);
      setError('Failed to load your tickets. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (ticketData) => {
    try {
      await ticketService.createTicket(ticketData);
      await fetchMyTickets();
    } catch (err) {
      console.error('Error creating ticket:', err);
      throw err;
    }
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: '#6b7280',
      medium: '#3b82f6',
      high: '#f59e0b',
      urgent: '#ef4444'
    };
    return colors[priority] || '#6b7280';
  };

  const getPriorityBadge = (priority) => {
    const badges = {
      low: 'bg-secondary',
      medium: 'bg-info',
      high: 'bg-warning',
      urgent: 'bg-danger'
    };
    return badges[priority] || 'bg-secondary';
  };

  const getStatusBadge = (status) => {
    const badges = {
      open: 'bg-primary',
      in_progress: 'bg-warning',
      waiting_customer: 'bg-info',
      resolved: 'bg-success',
      closed: 'bg-secondary'
    };
    return `badge ${badges[status] || 'bg-secondary'}`;
  };

  const getStatusIcon = (status) => {
    const icons = {
      open: 'bi-door-open',
      in_progress: 'bi-hourglass-split',
      waiting_customer: 'bi-clock-history',
      resolved: 'bi-check-circle',
      closed: 'bi-x-circle'
    };
    return icons[status] || 'bi-circle';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredTickets = filterStatus === 'all' 
    ? tickets 
    : tickets.filter(ticket => ticket.status === filterStatus);

  const ticketStats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'open').length,
    in_progress: tickets.filter(t => t.status === 'in_progress').length,
    resolved: tickets.filter(t => t.status === 'resolved').length
  };

  if (loading) {
    return (
      <div style={{ backgroundColor: '#FAFAE6', minHeight: '100vh' }}>
        <div className="container py-5">
          <div className="text-center" style={{ paddingTop: '10rem' }}>
            <div className="spinner-border text-success" role="status" style={{ width: '3rem', height: '3rem' }}>
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3 text-muted fw-semibold">Loading your tickets...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#FAFAE6', minHeight: '100vh', paddingTop: '2rem', paddingBottom: '3rem' }}>
      <div className="container">
        {/* Header Section */}
        <div className="row mb-4 align-items-center">
          <div className="col-lg-8">
            <div className="d-flex align-items-center mb-3">
              <div 
                className="d-flex align-items-center justify-content-center rounded-circle me-3"
                style={{
                  width: '60px',
                  height: '60px',
                  background: 'linear-gradient(135deg, #2d5f3f 0%, #3a7d52 100%)',
                  color: '#fff',
                  fontSize: '1.5rem'
                }}
              >
                <i className="bi bi-headset"></i>
              </div>
              <div>
                <h2 className="mb-1 fw-bold" style={{ color: '#2d5f3f' }}>My Support Tickets</h2>
                <p className="text-muted mb-0">View and track your support requests</p>
              </div>
            </div>
          </div>
          <div className="col-lg-4 text-lg-end">
            <button 
              className="btn btn-success btn-lg rounded-pill px-4 shadow-sm"
              onClick={() => setShowCreateModal(true)}
            >
              <i className="bi bi-plus-circle me-2"></i>
              Create New Ticket
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {tickets.length > 0 && (
          <div className="row g-3 mb-4">
            <div className="col-md-3">
              <div className="card border-0 shadow-sm rounded-3 h-100">
                <div className="card-body text-center p-4">
                  <i className="bi bi-ticket-detailed text-primary display-4 mb-2"></i>
                  <h3 className="fw-bold mb-1" style={{ color: '#2d5f3f' }}>{ticketStats.total}</h3>
                  <p className="text-muted small mb-0">Total Tickets</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card border-0 shadow-sm rounded-3 h-100">
                <div className="card-body text-center p-4">
                  <i className="bi bi-door-open text-info display-4 mb-2"></i>
                  <h3 className="fw-bold mb-1" style={{ color: '#2d5f3f' }}>{ticketStats.open}</h3>
                  <p className="text-muted small mb-0">Open</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card border-0 shadow-sm rounded-3 h-100">
                <div className="card-body text-center p-4">
                  <i className="bi bi-hourglass-split text-warning display-4 mb-2"></i>
                  <h3 className="fw-bold mb-1" style={{ color: '#2d5f3f' }}>{ticketStats.in_progress}</h3>
                  <p className="text-muted small mb-0">In Progress</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card border-0 shadow-sm rounded-3 h-100">
                <div className="card-body text-center p-4">
                  <i className="bi bi-check-circle text-success display-4 mb-2"></i>
                  <h3 className="fw-bold mb-1" style={{ color: '#2d5f3f' }}>{ticketStats.resolved}</h3>
                  <p className="text-muted small mb-0">Resolved</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filter Section */}
        {tickets.length > 0 && (
          <div className="card border-0 shadow-sm rounded-3 mb-4">
            <div className="card-body p-4">
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <span className="text-muted fw-semibold me-2">
                  <i className="bi bi-funnel me-1"></i>Filter by status:
                </span>
                <button
                  className={`btn ${filterStatus === 'all' ? 'btn-success' : 'btn-outline-secondary'} btn-sm rounded-pill px-3`}
                  onClick={() => setFilterStatus('all')}
                >
                  All ({tickets.length})
                </button>
                <button
                  className={`btn ${filterStatus === 'open' ? 'btn-primary' : 'btn-outline-secondary'} btn-sm rounded-pill px-3`}
                  onClick={() => setFilterStatus('open')}
                >
                  Open ({ticketStats.open})
                </button>
                <button
                  className={`btn ${filterStatus === 'in_progress' ? 'btn-warning' : 'btn-outline-secondary'} btn-sm rounded-pill px-3`}
                  onClick={() => setFilterStatus('in_progress')}
                >
                  In Progress ({ticketStats.in_progress})
                </button>
                <button
                  className={`btn ${filterStatus === 'resolved' ? 'btn-success' : 'btn-outline-secondary'} btn-sm rounded-pill px-3`}
                  onClick={() => setFilterStatus('resolved')}
                >
                  Resolved ({ticketStats.resolved})
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="alert alert-danger alert-dismissible fade show rounded-3 shadow-sm" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {error}
            <button 
              type="button" 
              className="btn-close" 
              onClick={() => setError(null)}
            ></button>
          </div>
        )}

        {/* Tickets List */}
        {filteredTickets.length === 0 ? (
          <div className="card border-0 shadow-sm rounded-4">
            <div className="card-body text-center py-5">
              <div 
                className="d-inline-flex align-items-center justify-content-center rounded-circle mb-4"
                style={{
                  width: '120px',
                  height: '120px',
                  backgroundColor: '#f3f4f6'
                }}
              >
                <i className="bi bi-inbox display-1 text-muted"></i>
              </div>
              <h4 className="mb-2 fw-bold" style={{ color: '#2d5f3f' }}>
                {filterStatus === 'all' ? 'No Tickets Yet' : 'No Tickets Found'}
              </h4>
              <p className="text-muted mb-4">
                {filterStatus === 'all' 
                  ? "You haven't created any support tickets yet." 
                  : `No tickets with status "${filterStatus.replace('_', ' ')}"`}
              </p>
              <button 
                className="btn btn-success btn-lg rounded-pill px-5"
                onClick={() => setShowCreateModal(true)}
              >
                <i className="bi bi-plus-circle me-2"></i>
                Create Your First Ticket
              </button>
            </div>
          </div>
        ) : (
          <div className="row g-4">
            {filteredTickets.map((ticket) => (
              <div key={ticket.id} className="col-12">
                <div 
                  className="card border-0 shadow-sm rounded-4"
                  style={{ 
                    cursor: 'pointer', 
                    transition: 'all 0.3s ease',
                    overflow: 'hidden'
                  }}
                  onClick={() => navigate(`/tickets/${ticket.id}`)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-5px)';
                    e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '';
                  }}
                >
                  {/* Status Color Bar */}
                  <div 
                    style={{
                      height: '6px',
                      background: ticket.status === 'resolved' 
                        ? 'linear-gradient(90deg, #22c55e 0%, #16a34a 100%)'
                        : ticket.status === 'in_progress'
                        ? 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)'
                        : 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)'
                    }}
                  ></div>

                  <div className="card-body p-4">
                    <div className="row">
                      <div className="col-lg-8">
                        {/* Ticket Header */}
                        <div className="d-flex align-items-start gap-3 mb-3">
                          <div 
                            className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                            style={{
                              width: '50px',
                              height: '50px',
                              background: 'linear-gradient(135deg, #2d5f3f 0%, #3a7d52 100%)',
                              color: '#fff',
                              fontSize: '1.2rem'
                            }}
                          >
                            <i className={`bi ${getStatusIcon(ticket.status)}`}></i>
                          </div>
                          <div className="flex-grow-1">
                            <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
                              <h5 className="mb-0 fw-bold" style={{ color: '#2d5f3f' }}>
                                {ticket.subject}
                              </h5>
                              <span className={`${getStatusBadge(ticket.status)} rounded-pill px-3 py-1`}>
                                {ticket.status.replace('_', ' ').toUpperCase()}
                              </span>
                            </div>
                            <p className="text-muted mb-0">
                              {ticket.description.length > 150 
                                ? ticket.description.substring(0, 150) + '...' 
                                : ticket.description}
                            </p>
                          </div>
                        </div>

                        {/* Ticket Meta Info */}
                        <div className="d-flex flex-wrap gap-3 mb-3">
                          <div className="d-flex align-items-center gap-2">
                            <div 
                              className="rounded-circle d-flex align-items-center justify-content-center"
                              style={{
                                width: '32px',
                                height: '32px',
                                backgroundColor: '#f3f4f6'
                              }}
                            >
                              <i className="bi bi-hash text-muted"></i>
                            </div>
                            <div>
                              <small className="text-muted d-block" style={{ fontSize: '0.7rem' }}>TICKET ID</small>
                              <span className="fw-semibold small">{ticket.ticket_number}</span>
                            </div>
                          </div>

                          <div className="d-flex align-items-center gap-2">
                            <div 
                              className="rounded-circle d-flex align-items-center justify-content-center"
                              style={{
                                width: '32px',
                                height: '32px',
                                backgroundColor: '#f3f4f6'
                              }}
                            >
                              <i className="bi bi-tag text-muted"></i>
                            </div>
                            <div>
                              <small className="text-muted d-block" style={{ fontSize: '0.7rem' }}>CATEGORY</small>
                              <span className="fw-semibold small text-capitalize">
                                {ticket.category.replace('_', ' ')}
                              </span>
                            </div>
                          </div>

                          <div className="d-flex align-items-center gap-2">
                            <div 
                              className="rounded-circle d-flex align-items-center justify-content-center"
                              style={{
                                width: '32px',
                                height: '32px',
                                backgroundColor: getPriorityColor(ticket.priority) + '20'
                              }}
                            >
                              <i 
                                className="bi bi-exclamation-circle"
                                style={{ color: getPriorityColor(ticket.priority) }}
                              ></i>
                            </div>
                            <div>
                              <small className="text-muted d-block" style={{ fontSize: '0.7rem' }}>PRIORITY</small>
                              <span 
                                className={`badge ${getPriorityBadge(ticket.priority)} rounded-pill`}
                              >
                                {ticket.priority.toUpperCase()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="col-lg-4">
                        <div className="text-lg-end">
                          {/* Timestamps */}
                          <div className="mb-3">
                            <div className="small mb-2">
                              <i className="bi bi-clock me-1 text-muted"></i>
                              <span className="text-muted">Created</span>
                              <br />
                              <span className="fw-semibold">{formatDate(ticket.created_at)}</span>
                            </div>
                            {ticket.updated_at !== ticket.created_at && (
                              <div className="small">
                                <i className="bi bi-arrow-clockwise me-1 text-muted"></i>
                                <span className="text-muted">Updated</span>
                                <br />
                                <span className="fw-semibold">{formatDate(ticket.updated_at)}</span>
                              </div>
                            )}
                          </div>

                          {/* View Details Button */}
                          <button 
                            className="btn btn-success rounded-pill px-4"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/tickets/${ticket.id}`);
                            }}
                          >
                            View Details
                            <i className="bi bi-arrow-right ms-2"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Ticket Modal Component */}
      <CreateTicketModal 
        show={showCreateModal}
        onClose={handleCloseModal}
        onSubmit={handleCreateTicket}
      />
    </div>
  );
};

export default MyTickets;