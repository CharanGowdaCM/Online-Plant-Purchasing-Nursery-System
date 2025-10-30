/**
 * Developer: K Akhilesh
 * Features: Ticket Details, Customer Support, Ticket Status, Priority Badge, Ticket Timeline, 
 * API Integration, Dynamic Styling, Ticket Information, React Hooks, Navigation, Responsive UI
 */


import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ticketService from '../services/ticketService';

const TicketDetails = () => {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (ticketId) {
      fetchTicketDetails();
    }
  }, [ticketId]);

  const fetchTicketDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await ticketService.getTicketDetails(ticketId);
      setTicket(response.ticket || response);
    } catch (err) {
      console.error('Error fetching ticket details:', err);
      setError('Failed to load ticket details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      open: 'bg-primary',
      in_progress: 'bg-warning text-dark',
      waiting_customer: 'bg-info',
      resolved: 'bg-success',
      closed: 'bg-secondary'
    };
    return `badge ${badges[status] || 'bg-secondary'}`;
  };

  const getStatusGradient = (status) => {
    const gradients = {
      open: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      in_progress: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      waiting_customer: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
      resolved: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
      closed: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)'
    };
    return gradients[status] || gradients.closed;
  };

  const getStatusIcon = (status) => {
    const icons = {
      open: 'bi-door-open',
      in_progress: 'bi-hourglass-split',
      waiting_customer: 'bi-clock-history',
      resolved: 'bi-check-circle-fill',
      closed: 'bi-x-circle-fill'
    };
    return icons[status] || 'bi-circle';
  };

  const getPriorityBadge = (priority) => {
    const badges = {
      low: 'bg-secondary',
      medium: 'bg-info',
      high: 'bg-warning text-dark',
      urgent: 'bg-danger'
    };
    return `badge ${badges[priority] || 'bg-secondary'}`;
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

  const getStatusMessage = (status) => {
    const messages = {
      open: {
        title: 'Ticket Received',
        message: 'Your ticket is being reviewed by our support team. We will respond shortly.',
        icon: 'bi-inbox-fill',
        color: '#3b82f6'
      },
      in_progress: {
        title: 'In Progress',
        message: 'Our support team is actively working on resolving your issue.',
        icon: 'bi-gear-fill',
        color: '#f59e0b'
      },
      waiting_customer: {
        title: 'Waiting for Your Response',
        message: 'We need additional information from you. Please check your email and respond.',
        icon: 'bi-envelope-fill',
        color: '#06b6d4'
      },
      resolved: {
        title: 'Ticket Resolved',
        message: 'This ticket has been successfully resolved. If you need further assistance, please create a new ticket.',
        icon: 'bi-check-circle-fill',
        color: '#22c55e'
      },
      closed: {
        title: 'Ticket Closed',
        message: 'This ticket is now closed. Please create a new ticket if you need additional support.',
        icon: 'bi-x-circle-fill',
        color: '#6b7280'
      }
    };
    return messages[status] || messages.closed;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric',
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hour${Math.floor(diffInHours) !== 1 ? 's' : ''} ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
    }
  };

  if (loading) {
    return (
      <div style={{ backgroundColor: '#FAFAE6', minHeight: '100vh' }}>
        <div className="container py-5">
          <div className="text-center" style={{ paddingTop: '10rem' }}>
            <div className="spinner-border text-success" role="status" style={{ width: '3rem', height: '3rem' }}>
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3 text-muted fw-semibold">Loading ticket details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div style={{ backgroundColor: '#FAFAE6', minHeight: '100vh', paddingTop: '2rem' }}>
        <div className="container py-5">
          <div className="card border-0 shadow-sm rounded-4">
            <div className="card-body text-center py-5">
              <div 
                className="d-inline-flex align-items-center justify-content-center rounded-circle mb-4"
                style={{
                  width: '100px',
                  height: '100px',
                  backgroundColor: '#fee2e2'
                }}
              >
                <i className="bi bi-exclamation-triangle display-3 text-danger"></i>
              </div>
              <h4 className="mb-3 fw-bold text-danger">Error Loading Ticket</h4>
              <p className="text-muted mb-4">{error || 'Ticket not found'}</p>
              <button 
                className="btn btn-success btn-lg rounded-pill px-5"
                onClick={() => navigate('/tickets')}
              >
                <i className="bi bi-arrow-left me-2"></i>
                Back to My Tickets
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusMessage(ticket.status);

  return (
    <div style={{ backgroundColor: '#FAFAE6', minHeight: '100vh', paddingTop: '2rem', paddingBottom: '3rem' }}>
      <div className="container">
        {/* Back Button */}
        <div className="mb-4">
          <button 
            className="btn btn-outline-secondary rounded-pill px-4"
            onClick={() => navigate('/tickets')}
          >
            <i className="bi bi-arrow-left me-2"></i>
            Back to My Tickets
          </button>
        </div>

        {/* Status Banner */}
        <div 
          className="card border-0 shadow-sm rounded-4 mb-4 overflow-hidden"
          style={{ background: getStatusGradient(ticket.status) }}
        >
          <div className="card-body p-4 text-white">
            <div className="row align-items-center">
              <div className="col-lg-8">
                <div className="d-flex align-items-center gap-3">
                  <div 
                    className="d-flex align-items-center justify-content-center rounded-circle"
                    style={{
                      width: '70px',
                      height: '70px',
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      fontSize: '2rem'
                    }}
                  >
                    <i className={`bi ${statusInfo.icon}`}></i>
                  </div>
                  <div>
                    <h4 className="mb-1 fw-bold">{statusInfo.title}</h4>
                    <p className="mb-0 opacity-90">{statusInfo.message}</p>
                  </div>
                </div>
              </div>
              <div className="col-lg-4 text-lg-end mt-3 mt-lg-0">
                <div className="badge bg-white bg-opacity-25 px-4 py-2 rounded-pill">
                  <i className="bi bi-hash me-1"></i>
                  <span className="fw-bold">{ticket.ticket_number}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="row g-4">
          {/* Main Content */}
          <div className="col-lg-8">
            {/* Ticket Details Card */}
            <div className="card border-0 shadow-sm rounded-4 mb-4">
              <div className="card-body p-4">
                <div className="d-flex align-items-start gap-3 mb-4">
                  <div 
                    className="d-flex align-items-center justify-content-center rounded-circle"
                    style={{
                      width: '50px',
                      height: '50px',
                      background: 'linear-gradient(135deg, #2d5f3f 0%, #3a7d52 100%)',
                      color: '#fff',
                      fontSize: '1.2rem',
                      flexShrink: 0
                    }}
                  >
                    <i className="bi bi-ticket-detailed"></i>
                  </div>
                  <div className="flex-grow-1">
                    <h3 className="mb-3 fw-bold" style={{ color: '#2d5f3f' }}>
                      {ticket.subject}
                    </h3>
                    <div className="d-flex flex-wrap gap-2">
                      <span className={`${getStatusBadge(ticket.status)} rounded-pill px-3 py-2`}>
                        <i className={`bi ${getStatusIcon(ticket.status)} me-1`}></i>
                        {ticket.status.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className={`${getPriorityBadge(ticket.priority)} rounded-pill px-3 py-2`}>
                        <i className="bi bi-exclamation-circle me-1"></i>
                        {ticket.priority.toUpperCase()} PRIORITY
                      </span>
                      <span className="badge bg-light text-dark rounded-pill px-3 py-2">
                        <i className="bi bi-tag me-1"></i>
                        {ticket.category.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>

                <hr className="my-4" />

                <div>
                  <h6 className="text-muted mb-3 fw-semibold">
                    <i className="bi bi-chat-left-text me-2"></i>
                    ORIGINAL REQUEST
                  </h6>
                  <div 
                    className="p-4 rounded-3"
                    style={{
                      backgroundColor: '#f8f9fa',
                      border: '2px dashed #e5e7eb',
                      whiteSpace: 'pre-wrap',
                      lineHeight: '1.8'
                    }}
                  >
                    {ticket.description}
                  </div>
                </div>

                {ticket.resolved_at && (
                  <div className="alert alert-success border-0 rounded-3 mt-4" style={{ backgroundColor: '#d1fae5' }}>
                    <div className="d-flex align-items-center gap-3">
                      <div 
                        className="d-flex align-items-center justify-content-center rounded-circle"
                        style={{
                          width: '40px',
                          height: '40px',
                          backgroundColor: '#22c55e',
                          color: '#fff'
                        }}
                      >
                        <i className="bi bi-check-lg"></i>
                      </div>
                      <div>
                        <strong className="d-block mb-1" style={{ color: '#15803d' }}>
                          Ticket Resolved Successfully
                        </strong>
                        <small className="text-muted">
                          Resolved on {formatDate(ticket.resolved_at)}
                        </small>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Next Steps Card */}
            <div className="card border-0 shadow-sm rounded-4">
              <div className="card-header bg-white border-0 py-3 px-4">
                <h5 className="mb-0 fw-bold" style={{ color: '#2d5f3f' }}>
                  <i className="bi bi-lightbulb me-2"></i>
                  What's Next?
                </h5>
              </div>
              <div className="card-body p-4">
                {ticket.status === 'open' && (
                  <div className="d-flex gap-3">
                    <div className="text-primary" style={{ fontSize: '2rem' }}>
                      <i className="bi bi-hourglass-split"></i>
                    </div>
                    <div>
                      <h6 className="fw-bold mb-2">We're reviewing your request</h6>
                      <p className="text-muted mb-0">
                        Our support team will review your ticket and respond within 24 hours. 
                        You'll receive an email notification when there's an update.
                      </p>
                    </div>
                  </div>
                )}
                {ticket.status === 'in_progress' && (
                  <div className="d-flex gap-3">
                    <div className="text-warning" style={{ fontSize: '2rem' }}>
                      <i className="bi bi-tools"></i>
                    </div>
                    <div>
                      <h6 className="fw-bold mb-2">We're working on it</h6>
                      <p className="text-muted mb-0">
                        Our team is actively investigating and working to resolve your issue. 
                        We'll keep you updated on the progress.
                      </p>
                    </div>
                  </div>
                )}
                {ticket.status === 'waiting_customer' && (
                  <div className="d-flex gap-3">
                    <div className="text-info" style={{ fontSize: '2rem' }}>
                      <i className="bi bi-reply-fill"></i>
                    </div>
                    <div>
                      <h6 className="fw-bold mb-2">Your response needed</h6>
                      <p className="text-muted mb-0">
                        Please check your email and provide the requested information. 
                        Your prompt response will help us resolve this faster.
                      </p>
                    </div>
                  </div>
                )}
                {ticket.status === 'resolved' && (
                  <div className="d-flex gap-3">
                    <div className="text-success" style={{ fontSize: '2rem' }}>
                      <i className="bi bi-emoji-smile"></i>
                    </div>
                    <div>
                      <h6 className="fw-bold mb-2">Issue resolved!</h6>
                      <p className="text-muted mb-2">
                        We're glad we could help. If you have any other questions or need 
                        further assistance, feel free to create a new ticket.
                      </p>
                      <button 
                        className="btn btn-success btn-sm rounded-pill px-3"
                        onClick={() => navigate('/tickets')}
                      >
                        <i className="bi bi-plus-circle me-1"></i>
                        Create New Ticket
                      </button>
                    </div>
                  </div>
                )}
                {ticket.status === 'closed' && (
                  <div className="d-flex gap-3">
                    <div className="text-secondary" style={{ fontSize: '2rem' }}>
                      <i className="bi bi-archive"></i>
                    </div>
                    <div>
                      <h6 className="fw-bold mb-2">Ticket archived</h6>
                      <p className="text-muted mb-2">
                        This ticket has been closed and archived. For new issues, please 
                        create a new support ticket.
                      </p>
                      <button 
                        className="btn btn-success btn-sm rounded-pill px-3"
                        onClick={() => navigate('/tickets')}
                      >
                        <i className="bi bi-plus-circle me-1"></i>
                        Create New Ticket
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="col-lg-4">
            {/* Ticket Info Card */}
            <div className="card border-0 shadow-sm rounded-4 mb-4" style={{ position: 'sticky', top: '100px' }}>
              <div className="card-header bg-white border-0 py-3 px-4">
                <h6 className="mb-0 fw-bold" style={{ color: '#2d5f3f' }}>
                  <i className="bi bi-info-circle me-2"></i>
                  Ticket Information
                </h6>
              </div>
              <div className="card-body p-4">
                <div className="mb-4">
                  <small className="text-muted d-block mb-2 fw-semibold">TICKET NUMBER</small>
                  <div className="d-flex align-items-center gap-2">
                    <div 
                      className="d-flex align-items-center justify-content-center rounded-circle"
                      style={{
                        width: '35px',
                        height: '35px',
                        backgroundColor: '#f3f4f6'
                      }}
                    >
                      <i className="bi bi-hash text-muted"></i>
                    </div>
                    <span className="fw-bold">{ticket.ticket_number}</span>
                  </div>
                </div>

                <div className="mb-4">
                  <small className="text-muted d-block mb-2 fw-semibold">CATEGORY</small>
                  <div className="d-flex align-items-center gap-2">
                    <div 
                      className="d-flex align-items-center justify-content-center rounded-circle"
                      style={{
                        width: '35px',
                        height: '35px',
                        backgroundColor: '#f3f4f6'
                      }}
                    >
                      <i className="bi bi-tag text-muted"></i>
                    </div>
                    <span className="text-capitalize">{ticket.category.replace('_', ' ')}</span>
                  </div>
                </div>

                <div className="mb-4">
                  <small className="text-muted d-block mb-2 fw-semibold">PRIORITY</small>
                  <div className="d-flex align-items-center gap-2">
                    <div 
                      className="d-flex align-items-center justify-content-center rounded-circle"
                      style={{
                        width: '35px',
                        height: '35px',
                        backgroundColor: getPriorityColor(ticket.priority) + '20'
                      }}
                    >
                      <i 
                        className="bi bi-exclamation-circle" 
                        style={{ color: getPriorityColor(ticket.priority) }}
                      ></i>
                    </div>
                    <span className={`badge ${getPriorityBadge(ticket.priority)} rounded-pill`}>
                      {ticket.priority.toUpperCase()}
                    </span>
                  </div>
                </div>

                <hr />

                <div className="mb-3">
                  <small className="text-muted d-block mb-2 fw-semibold">CREATED</small>
                  <div className="d-flex align-items-start gap-2">
                    <i className="bi bi-calendar-check text-muted mt-1"></i>
                    <div>
                      <div className="fw-semibold">{formatDate(ticket.created_at)}</div>
                      <small className="text-muted">{formatRelativeTime(ticket.created_at)}</small>
                    </div>
                  </div>
                </div>

                {ticket.updated_at !== ticket.created_at && (
                  <div className="mb-3">
                    <small className="text-muted d-block mb-2 fw-semibold">LAST UPDATED</small>
                    <div className="d-flex align-items-start gap-2">
                      <i className="bi bi-arrow-clockwise text-muted mt-1"></i>
                      <div>
                        <div className="fw-semibold">{formatDate(ticket.updated_at)}</div>
                        <small className="text-muted">{formatRelativeTime(ticket.updated_at)}</small>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Help Card */}
            <div className="card border-0 shadow-sm rounded-4" style={{ background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)' }}>
              <div className="card-body p-4 text-center">
                <div 
                  className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
                  style={{
                    width: '60px',
                    height: '60px',
                    background: 'linear-gradient(135deg, #2d5f3f 0%, #3a7d52 100%)',
                    color: '#fff',
                    fontSize: '1.5rem'
                  }}
                >
                  <i className="bi bi-question-circle"></i>
                </div>
                <h6 className="fw-bold mb-2" style={{ color: '#15803d' }}>Need More Help?</h6>
                <p className="small text-muted mb-3">
                  Check our FAQ section or contact support for additional assistance.
                </p>
                <button 
                  className="btn btn-success btn-sm rounded-pill px-4"
                  onClick={() => navigate('/faqs')}
                >
                  <i className="bi bi-book me-1"></i>
                  View FAQs
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketDetails;