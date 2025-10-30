import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import adminService from '../../services/adminService';

const ActivityLogs = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [filters, setFilters] = useState({
    type: '',
    userId: ''
  });

  useEffect(() => {
    fetchActivityLogs();
  }, [pagination.page, filters.type, filters.userId]);

  const fetchActivityLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...(filters.type && { type: filters.type }),
        ...(filters.userId && { userId: filters.userId })
      };

      const response = await adminService.getActivityLogs(params);
      console.log('Activity Logs Response:', response);

      if (response.success) {
        setLogs(response.data || []);
        setPagination(prev => ({
          ...prev,
          total: response.pagination?.total || 0,
          totalPages: response.pagination?.totalPages || 0
        }));
      } else {
        setError('Failed to load activity logs');
      }
    } catch (err) {
      console.error('Error fetching activity logs:', err);
      setError('Failed to load activity logs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const getActionBadgeClass = (actionType) => {
    const actionMap = {
      'create': 'bg-success',
      'update': 'bg-warning',
      'delete': 'bg-danger',
      'login': 'bg-info',
      'logout': 'bg-secondary',
      'view': 'bg-primary',
      'export': 'bg-info',
      'import': 'bg-warning'
    };
    return actionMap[actionType?.toLowerCase()] || 'bg-secondary';
  };

  const getEntityBadgeClass = (entityType) => {
    const entityMap = {
      'user': 'bg-primary',
      'order': 'bg-success',
      'product': 'bg-warning',
      'ticket': 'bg-danger',
      'category': 'bg-info',
      'payment': 'bg-success',
      'review': 'bg-secondary'
    };
    return entityMap[entityType?.toLowerCase()] || 'bg-secondary';
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getUserName = (log) => {
    if (log.users?.profiles?.[0]?.first_name) {
      const profile = log.users.profiles[0];
      return `${profile.first_name} ${profile.last_name || ''}`.trim();
    }
    return log.users?.email || 'Unknown User';
  };

  const getUserRole = (log) => {
    return log.users?.role || 'N/A';
  };

  if (loading && logs.length === 0) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading activity logs...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger" role="alert">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
        </div>
        <button className="btn btn-primary" onClick={fetchActivityLogs}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="row mb-4">
        <div className="col">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-1">
                <i className="bi bi-clock-history text-primary me-2"></i>
                Activity Logs
              </h2>
              <p className="text-muted">System-wide activity audit trail</p>
            </div>
            <button 
              className="btn btn-outline-secondary"
              onClick={() => navigate('/admin/system')}
            >
              <i className="bi bi-arrow-left me-2"></i>
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label small fw-bold">Filter by Action Type</label>
              <select
                className="form-select"
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
              >
                <option value="">All Actions</option>
                <option value="CREATE">Create</option>
                <option value="UPDATE">Update</option>
                <option value="DELETE">Delete</option>
                <option value="LOGIN">Login</option>
                <option value="LOGOUT">Logout</option>
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label small fw-bold">Filter by User ID</label>
              <input
                type="text"
                className="form-control"
                placeholder="Enter user ID..."
                value={filters.userId}
                onChange={(e) => handleFilterChange('userId', e.target.value)}
              />
            </div>
            <div className="col-md-4 d-flex align-items-end">
              <button
                className="btn btn-outline-secondary w-100"
                onClick={() => {
                  setFilters({ type: '', userId: '' });
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
              >
                <i className="bi bi-x-circle me-2"></i>
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="card shadow-sm border-start border-primary border-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1 small">Total Logs</h6>
                  <h4 className="mb-0 fw-bold">{pagination.total}</h4>
                </div>
                <div className="bg-primary bg-opacity-10 p-3 rounded-circle">
                  <i className="bi bi-journal-text fs-4 text-primary"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card shadow-sm border-start border-success border-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1 small">Current Page</h6>
                  <h4 className="mb-0 fw-bold">{pagination.page} of {pagination.totalPages}</h4>
                </div>
                <div className="bg-success bg-opacity-10 p-3 rounded-circle">
                  <i className="bi bi-file-earmark-text fs-4 text-success"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card shadow-sm border-start border-info border-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1 small">Logs Per Page</h6>
                  <h4 className="mb-0 fw-bold">{pagination.limit}</h4>
                </div>
                <div className="bg-info bg-opacity-10 p-3 rounded-circle">
                  <i className="bi bi-list-ul fs-4 text-info"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card shadow-sm border-start border-warning border-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1 small">Showing</h6>
                  <h4 className="mb-0 fw-bold">{logs.length} logs</h4>
                </div>
                <div className="bg-warning bg-opacity-10 p-3 rounded-circle">
                  <i className="bi bi-eye fs-4 text-warning"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Logs Table */}
      <div className="card shadow-sm">
        <div className="card-header bg-white">
          <h5 className="mb-0">
            <i className="bi bi-table me-2"></i>
            Activity Log Entries
          </h5>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th className="px-3">Timestamp</th>
                  <th>User</th>
                  <th>Role</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Entity ID</th>
                  <th>Details</th>
                  
                </tr>
              </thead>
              <tbody>
                {logs && logs.length > 0 ? (
                  logs.map((log, index) => (
                    <tr key={log.id || index}>
                      <td className="px-3">
                        <small className="text-muted">
                          <i className="bi bi-clock me-1"></i>
                          {formatDateTime(log.created_at)}
                        </small>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="bg-primary bg-opacity-10 rounded-circle p-2 me-2">
                            <i className="bi bi-person-fill text-primary small"></i>
                          </div>
                          <div>
                            <div className="fw-semibold small">{getUserName(log)}</div>
                            <small className="text-muted">{log.users?.email}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge bg-secondary small">
                          {getUserRole(log).toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${getActionBadgeClass(log.action_type)}`}>
                          {log.action_type?.toUpperCase() || 'N/A'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${getEntityBadgeClass(log.entity_type)}`}>
                          {log.entity_type?.toUpperCase() || 'N/A'}
                        </span>
                      </td>
                      <td>
                        <code className="small">{log.entity_id || 'N/A'}</code>
                      </td>
                      <td>
                        <div className="text-truncate" style={{ maxWidth: '200px' }} title={typeof log.details === 'object' ? JSON.stringify(log.details) : log.details}>
                          {typeof log.details === 'object' ? JSON.stringify(log.details) : (log.details || 'No details')}
                        </div>
                      </td>
                     
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="text-center py-5">
                      <i className="bi bi-inbox fs-1 text-muted"></i>
                      <p className="text-muted mt-2">No activity logs found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="card-footer bg-white">
            <nav>
              <ul className="pagination mb-0 justify-content-center">
                <li className={`page-item ${pagination.page === 1 ? 'disabled' : ''}`}>
                  <button
                    className="page-link"
                    onClick={() => handlePageChange(1)}
                    disabled={pagination.page === 1}
                  >
                    <i className="bi bi-chevron-double-left"></i>
                  </button>
                </li>
                <li className={`page-item ${pagination.page === 1 ? 'disabled' : ''}`}>
                  <button
                    className="page-link"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                  >
                    <i className="bi bi-chevron-left"></i>
                  </button>
                </li>

                {/* Page Numbers */}
                {[...Array(pagination.totalPages)].map((_, index) => {
                  const pageNumber = index + 1;
                  // Show first page, last page, current page, and pages around current
                  if (
                    pageNumber === 1 ||
                    pageNumber === pagination.totalPages ||
                    (pageNumber >= pagination.page - 1 && pageNumber <= pagination.page + 1)
                  ) {
                    return (
                      <li
                        key={pageNumber}
                        className={`page-item ${pagination.page === pageNumber ? 'active' : ''}`}
                      >
                        <button
                          className="page-link"
                          onClick={() => handlePageChange(pageNumber)}
                        >
                          {pageNumber}
                        </button>
                      </li>
                    );
                  } else if (
                    pageNumber === pagination.page - 2 ||
                    pageNumber === pagination.page + 2
                  ) {
                    return (
                      <li key={pageNumber} className="page-item disabled">
                        <span className="page-link">...</span>
                      </li>
                    );
                  }
                  return null;
                })}

                <li className={`page-item ${pagination.page === pagination.totalPages ? 'disabled' : ''}`}>
                  <button
                    className="page-link"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                  >
                    <i className="bi bi-chevron-right"></i>
                  </button>
                </li>
                <li className={`page-item ${pagination.page === pagination.totalPages ? 'disabled' : ''}`}>
                  <button
                    className="page-link"
                    onClick={() => handlePageChange(pagination.totalPages)}
                    disabled={pagination.page === pagination.totalPages}
                  >
                    <i className="bi bi-chevron-double-right"></i>
                  </button>
                </li>
              </ul>
            </nav>
            <div className="text-center mt-2">
              <small className="text-muted">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} logs
              </small>
            </div>
          </div>
        )}
      </div>

      {/* Loading Overlay for Filter Changes */}
      {loading && logs.length > 0 && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: 'rgba(0,0,0,0.3)', zIndex: 1050 }}>
          <div className="spinner-border text-light" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityLogs;
